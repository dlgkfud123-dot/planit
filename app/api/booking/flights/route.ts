import { NextResponse } from "next/server.js";
import type {
  FlightOffer,
  FlightSlice,
  FlightSegment,
  FlightPartyPrice,
  FlightScoreBreakdown,
  NormalizedFlightPrice,
  FlightSearchResponse,
  FlightBookingOption,
  FlightBaggageDetails,
  FlightAmenities,
  FlightTimeFlags,
  FlightPriceSource,
} from "../../../../types/flight";
import { normalizeFlightBookingOption } from "../../../../utils/bookingLinks.ts";
import { getCityAirportIata, isSupportedAirport } from "../../../../data/airports.ts";
import { validateFlightInput } from "../../../../utils/bookingValidation.ts";
import { ApiHttpError, ROUTE_DEADLINE_MS, apiErrorResponse, fetchWithTimeout, providerErrorFromStatus } from "../../../../utils/apiRuntime.ts";
import { calculateFlightTimeScore } from "../../../../utils/flightRuntime.ts";

type SerpApiFlightLegRaw = {
  departure_airport?: { time?: string; id?: string };
  arrival_airport?: { time?: string; id?: string };
  overnight?: boolean;
  flight_number?: string;
  airline?: string;
  airline_logo?: string;
  duration?: number;
  legroom?: string;
  extensions?: string[];
};

type SerpApiFlightRaw = {
  departure_token?: string;
  booking_token?: string;
  price?: number;
  airline_logo?: string;
  flights?: SerpApiFlightLegRaw[];
};

type SerpApiResponseRaw = {
  error?: string;
  search_metadata?: { id?: string };
  best_flights?: SerpApiFlightRaw[];
  other_flights?: SerpApiFlightRaw[];
  booking_options?: unknown[];
  baggage_prices?: unknown;
};

type BookingLookupEntry = {
  bookingToken: string;
  departureAirport: string;
  destinationAirport: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  travelClass: string;
  currency: string;
  fallbackPrice: number | null;
  expiresAt: number;
  cachedOptions: FlightBookingOption[] | undefined;
};

const BOOKING_LOOKUP_TTL_MS = 5 * 60 * 1000;
const bookingLookupCache = new Map<string, BookingLookupEntry>();

function registerBookingLookup(entry: Omit<BookingLookupEntry, "expiresAt" | "cachedOptions">): string {
  const lookupId = crypto.randomUUID();
  bookingLookupCache.set(lookupId, {
    ...entry,
    expiresAt: Date.now() + BOOKING_LOOKUP_TTL_MS,
    cachedOptions: undefined,
  });
  return lookupId;
}

function getBookingLookup(lookupId: string): BookingLookupEntry | null {
  const entry = bookingLookupCache.get(lookupId);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    bookingLookupCache.delete(lookupId);
    return null;
  }
  return entry;
}

async function readSerpResponse(response: Response, stage: "STEP_1" | "STEP_2" | "STEP_3"): Promise<SerpApiResponseRaw> {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiHttpError(502, "PROVIDER_ERROR", `SerpAPI ${stage} 응답을 해석할 수 없습니다.`);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ApiHttpError(502, "PROVIDER_ERROR", `SerpAPI ${stage} 응답 형식이 올바르지 않습니다.`);
  }
  const parsed = body as SerpApiResponseRaw;
  if (typeof parsed.error === "string" && parsed.error.trim()) {
    throw new ApiHttpError(502, "PROVIDER_ERROR", `SerpAPI ${stage} 요청이 거부되었습니다.`);
  }
  if (stage !== "STEP_3" && !Array.isArray(parsed.best_flights) && !Array.isArray(parsed.other_flights)) {
    throw new ApiHttpError(502, "PROVIDER_ERROR", `SerpAPI ${stage} 항공편 응답 형식이 올바르지 않습니다.`);
  }
  return parsed;
}

function serpProviderError(response: Response, stage: "STEP_1" | "STEP_2" | "STEP_3") {
  if (response.status !== 429) return providerErrorFromStatus(response.status, "SerpAPI");
  const retryAfterHeader = response.headers.get("Retry-After");
  const resetHeader = response.headers.get("X-RateLimit-Reset");
  const retryAfterSeconds = retryAfterHeader && Number.isFinite(Number(retryAfterHeader))
    ? Math.max(0, Math.ceil(Number(retryAfterHeader)))
    : resetHeader && Number.isFinite(Number(resetHeader))
      ? Math.max(0, Math.ceil(Number(resetHeader) - Date.now() / 1000))
      : undefined;
  const retryAt = retryAfterSeconds === undefined ? undefined : new Date(Date.now() + retryAfterSeconds * 1000).toISOString();
  return new ApiHttpError(429, "RATE_LIMITED", "SerpAPI 요청 한도를 초과했습니다.", {
    retryAt,
    retryAfterSeconds,
    providerStage: stage,
  });
}

export function calculateTimeFlags(departingAt?: string, arrivingAt?: string, rawOvernight?: boolean): FlightTimeFlags {
  if (!departingAt || !arrivingAt) {
    return { arrivesNextDay: false, dayOffset: 0, isOvernightFlight: Boolean(rawOvernight) };
  }

  try {
    const depDateStr = departingAt.split(" ")[0]; // e.g. "2026-08-13"
    const arrDateStr = arrivingAt.split(" ")[0]; // e.g. "2026-08-13"

    const depDate = new Date(depDateStr);
    const arrDate = new Date(arrDateStr);

    const diffTime = arrDate.getTime() - depDate.getTime();
    const dayOffset = Math.max(0, Math.round(diffTime / (1000 * 3600 * 24)));
    const arrivesNextDay = dayOffset > 0;

    const depHour = parseInt(departingAt.split(" ")[1]?.split(":")[0] || "0", 10);
    const arrHour = parseInt(arrivingAt.split(" ")[1]?.split(":")[0] || "0", 10);
    const isOvernightFlight = Boolean(rawOvernight) || depHour >= 22 || depHour < 5 || arrHour < depHour;

    return {
      arrivesNextDay,
      dayOffset,
      isOvernightFlight,
    };
  } catch {
    return { arrivesNextDay: false, dayOffset: 0, isOvernightFlight: Boolean(rawOvernight) };
  }
}

function formatSerpTime(dateTimeStr?: string): { dateText: string; timeText: string; isoText: string } {
  if (!dateTimeStr) return { dateText: "", timeText: "", isoText: "" };
  try {
    const parts = dateTimeStr.split(" ");
    const datePart = parts[0] || "";
    const timePart = parts[1] || "";

    const dateTokens = datePart.split("-");
    const month = dateTokens[1] ? parseInt(dateTokens[1], 10) : "";
    const day = dateTokens[2] ? parseInt(dateTokens[2], 10) : "";
    const dateText = month && day ? `${month}월 ${day}일` : datePart;

    return {
      dateText,
      timeText: timePart,
      isoText: dateTimeStr,
    };
  } catch {
    return { dateText: "", timeText: dateTimeStr, isoText: dateTimeStr };
  }
}

function parseSerpSegment(rawLeg: SerpApiFlightLegRaw, fallbackOrigin: string, fallbackDest: string): FlightSegment {
  const depInfo = formatSerpTime(rawLeg.departure_airport?.time);
  const arrInfo = formatSerpTime(rawLeg.arrival_airport?.time);
  const timeFlags = calculateTimeFlags(depInfo.isoText, arrInfo.isoText, rawLeg.overnight);

  const flightNum = rawLeg.flight_number || null;
  const airlineCode = flightNum ? flightNum.split(" ")[0] : null;

  return {
    flightNumber: flightNum,
    originAirport: rawLeg.departure_airport?.id || fallbackOrigin,
    destinationAirport: rawLeg.arrival_airport?.id || fallbackDest,
    departingAt: depInfo.isoText,
    arrivingAt: arrInfo.isoText,
    departureDateText: depInfo.dateText,
    departureTimeText: depInfo.timeText,
    arrivalDateText: arrInfo.dateText,
    arrivalTimeText: arrInfo.timeText,
    arrivesNextDay: timeFlags.arrivesNextDay,
    dayOffset: timeFlags.dayOffset,
    isOvernightFlight: timeFlags.isOvernightFlight,
    marketingCarrierName: rawLeg.airline || null,
    operatingCarrierName: rawLeg.airline || null,
    airlineCode,
    isCodeshare: false,
  };
}

function parseSerpSlice(rawLegs: SerpApiFlightLegRaw[], fallbackOrigin: string, fallbackDest: string): FlightSlice {
  const segments: FlightSegment[] = (rawLegs || []).map((leg) =>
    parseSerpSegment(leg, fallbackOrigin, fallbackDest)
  );

  const firstSeg = segments[0] || {
    flightNumber: null,
    originAirport: fallbackOrigin,
    destinationAirport: fallbackDest,
    departingAt: "",
    arrivingAt: "",
    departureDateText: "",
    departureTimeText: "10:00",
    arrivalDateText: "",
    arrivalTimeText: "12:35",
    arrivesNextDay: false,
    dayOffset: 0,
    isOvernightFlight: false,
    marketingCarrierName: null,
    operatingCarrierName: null,
    airlineCode: null,
    isCodeshare: false,
  };
  const lastSeg = segments[segments.length - 1] || firstSeg;

  const totalMins = (rawLegs || []).reduce((acc, leg) => acc + (leg.duration || 0), 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const durationText = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;

  const stopsCount = Math.max(0, segments.length - 1);
  const isDirect = stopsCount === 0;

  return {
    originAirport: firstSeg.originAirport,
    destinationAirport: lastSeg.destinationAirport,
    departureDateText: firstSeg.departureDateText,
    departureTime: firstSeg.departureTimeText,
    arrivalDateText: lastSeg.arrivalDateText,
    arrivalTime: lastSeg.arrivalTimeText,
    durationMinutes: totalMins,
    durationText,
    stopsCount,
    isDirect,
    segments,
    sliceBaggageText: "수하물 조건은 예약 옵션에서 확인",
  };
}

export function parseAmenitiesAndBaggage(rawLegs: SerpApiFlightLegRaw[], bookingBaggagePrices?: unknown): {
  amenities: FlightAmenities;
  baggageDetails: FlightBaggageDetails;
  baggageInfo: string[];
} {
  let legroom: string | null = null;
  let wifi: boolean | null = null;
  let powerOutlet: boolean | null = null;
  let carbonEmissionText: string | null = null;
  let explicitBaggageText: string | null = null;
  let baggageSourcePath: string | null = null;

  (rawLegs || []).forEach((leg, legIdx) => {
    if (leg.legroom) {
      legroom = leg.legroom;
    }

    const exts: string[] = leg.extensions || [];
    exts.forEach((ext, extIdx) => {
      const lower = ext.toLowerCase();

      if (lower.includes("legroom")) {
        const match = ext.match(/\((\d+cm)\)/);
        if (match && match[1]) legroom = match[1];
        else if (!legroom) legroom = ext;
      } else if (lower.includes("wi-fi") || lower.includes("wifi")) {
        wifi = true;
      } else if (lower.includes("power") || lower.includes("usb")) {
        powerOutlet = true;
      } else if (lower.includes("carbon")) {
        carbonEmissionText = ext;
      } else if (lower.includes("carry-on") || lower.includes("checked bag") || lower.includes("baggage") || lower.includes("수하물")) {
        explicitBaggageText = ext;
        baggageSourcePath = `flights[${legIdx}].extensions[${extIdx}]`;
      }
    });
  });

  if (!explicitBaggageText && bookingBaggagePrices) {
    if (Array.isArray(bookingBaggagePrices) && bookingBaggagePrices.length > 0) {
      explicitBaggageText = bookingBaggagePrices.join(" / ");
      baggageSourcePath = "booking_options.baggage_prices";
    } else if (typeof bookingBaggagePrices === "object" && bookingBaggagePrices !== null) {
      const combined = Object.values(bookingBaggagePrices)
        .flatMap((value) => Array.isArray(value) ? value : [value])
        .map(String)
        .join(" / ");
      if (combined) {
        explicitBaggageText = combined;
        baggageSourcePath = "booking_options.baggage_prices";
      }
    }
  }

  const amenities: FlightAmenities = {
    legroom,
    wifi,
    powerOutlet,
    carbonEmissionText,
  };

  if (explicitBaggageText) {
    return {
      amenities,
      baggageDetails: {
        outbound: explicitBaggageText,
        inbound: explicitBaggageText,
        status: "explicit",
        sourcePath: baggageSourcePath,
      },
      baggageInfo: [`수하물: ${explicitBaggageText}`],
    };
  }

  return {
    amenities,
    baggageDetails: {
      outbound: null,
      inbound: null,
      status: "unknown",
      sourcePath: "baggageDetails.status: unknown",
    },
    baggageInfo: ["수하물 조건은 예약 옵션에서 확인"],
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("city") || searchParams.get("arrivalAirport") || "";
  const departureAirport = (searchParams.get("departureAirport") || searchParams.get("origin") || "ICN").toUpperCase();
  const mappedArrivalAirport = getCityAirportIata(city);
  const destinationAirport = (searchParams.get("arrivalAirport") || mappedArrivalAirport || "").toUpperCase();
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adultsParam = searchParams.get("guests") || searchParams.get("adults");
  const adults = adultsParam ? parseInt(adultsParam, 10) : 2;
  const flightBudget = searchParams.get("flightBudget") ? parseInt(searchParams.get("flightBudget")!, 10) : 500000;
  const travelClass = searchParams.get("travelClass") || "1";
  const currency = (searchParams.get("currency") || "KRW").toUpperCase();
  const comparisonSearch = searchParams.get("comparison") === "1";
  if (!searchParams.get("city") && !searchParams.get("arrivalAirport")) {
    return NextResponse.json(
      { success: false, providerStatus: "INVALID_INPUT", message: "도시 또는 도착 공항이 필요합니다.", offers: [] },
      { status: 400 }
    );
  }
  const inputError = (!mappedArrivalAirport && !searchParams.get("arrivalAirport"))
    ? "등록되지 않은 도시입니다."
    : validateFlightInput({
        departureAirport,
        arrivalAirport: destinationAirport,
        outboundDate: checkIn,
        returnDate: checkOut,
        adults,
        travelClass,
        currency,
      });
  if (inputError || !isSupportedAirport(destinationAirport)) {
    return NextResponse.json(
      { success: false, providerStatus: "INVALID_INPUT", message: inputError || "지원하지 않는 공항입니다.", offers: [] },
      { status: 400 }
    );
  }
  const routeSignal = AbortSignal.timeout(ROUTE_DEADLINE_MS);
  const serpApiKey = process.env.SERPAPI_API_KEY || "";
  const hasSerpKey = Boolean(serpApiKey);
  let providerCallCount = 0;

  if (!hasSerpKey) {
    return NextResponse.json({
      success: false,
      providerStatus: "UNAVAILABLE",
      city,
      flightApiProvider: "SerpAPI Google Flights",
      flightApiStatus: "UNAVAILABLE_BUSINESS_ONBOARDING_REQUIRED",
      integrationStatus: "UNVERIFIED",
      providerAvailable: false,
      liveSearchEnabled: false,
      status: "UNAVAILABLE_BUSINESS_ONBOARDING_REQUIRED",
      reason: "Business name and country of incorporation are required, and South Korea is unavailable in the current signup flow.",
      message: "SERPAPI_API_KEY 미설정 상태입니다. 가짜 mock 항공권 데이터를 생성하지 않습니다.",
      offers: [],
      budgetMatchedOffers: [],
      budgetExceededOffers: [],
    }, { status: 503 });
  }

  try {
    // STEP 1: INITIAL SEARCH (OUTBOUND FLIGHTS)
    const step1Params = new URLSearchParams({
      engine: "google_flights",
      departure_id: departureAirport,
      arrival_id: destinationAirport,
      outbound_date: checkIn,
      return_date: checkOut,
      type: "1", // Round trip
      adults: String(adults),
      travel_class: travelClass,
      currency,
      hl: "ko",
      gl: "kr",
      api_key: serpApiKey,
    });

    providerCallCount += 1;
    const step1Res = await fetchWithTimeout(`https://serpapi.com/search.json?${step1Params.toString()}`, {}, routeSignal);
    if (!step1Res.ok) {
      throw serpProviderError(step1Res, "STEP_1");
    }

    const step1Json = await readSerpResponse(step1Res, "STEP_1");
    const metadataId = step1Json.search_metadata?.id || null;
    const rawBest = step1Json.best_flights || [];
    const rawOther = step1Json.other_flights || [];
    const allOutboundRaw = [...rawBest, ...rawOther];

    if (allOutboundRaw.length === 0) {
      return NextResponse.json<FlightSearchResponse>({
        success: true,
        city,
        flightApiProvider: "SerpAPI Google Flights",
        flightApiStatus: "NO_FLIGHTS_FOUND",
        integrationStatus: "VERIFIED",
        providerAvailable: true,
        liveSearchEnabled: true,
        status: "ACTIVE",
        reason: "SerpAPI Google Flights API key verified.",
        message: "검색 조건에 해당 항공편이 검색되지 않았습니다.",
        offers: [],
        providerCallCount,
      });
    }

    const normalizedOffers: FlightOffer[] = [];
    let lastSelectionError: ApiHttpError | null = null;

    // Process top outbound options with dynamic price source tracking
    const outboundCandidateLimit = comparisonSearch ? 2 : 5;
    for (let i = 0; i < Math.min(outboundCandidateLimit, allOutboundRaw.length); i++) {
      const rawOutbound = allOutboundRaw[i];
      const depToken = rawOutbound.departure_token;
      const initialPrice = rawOutbound.price || null;

      const outboundSlice = parseSerpSlice(rawOutbound.flights || [], departureAirport, destinationAirport);
      const firstLeg = rawOutbound.flights?.[0] || {};
      const ownerAirlineName = firstLeg.airline || "Google Flights Airline";
      const ownerAirlineCode = firstLeg.flight_number?.split(" ")[0] || "ZZ";
      const logoUrl = rawOutbound.airline_logo || firstLeg.airline_logo || null;

      let inboundSlice: FlightSlice | null = null;
      let finalComboPrice = initialPrice;
      let bookingToken: string | null = null;
      let bookingOptionsLookupId: string | null = null;

      const initialCollection = i < rawBest.length ? "best_flights" : "other_flights";
      const initialIdx = i < rawBest.length ? i : i - rawBest.length;

      let priceSource: FlightPriceSource = {
        stage: "initial_search",
        collection: initialCollection,
        index: initialIdx,
        path: `initial_search.${initialCollection}[${initialIdx}].price`,
      };

      // STEP 2: QUERY RETURN FLIGHT USING DEPARTURE_TOKEN
      if (depToken) {
        try {
          const step2Params = new URLSearchParams({
            engine: "google_flights",
            departure_id: departureAirport,
            arrival_id: destinationAirport,
            outbound_date: checkIn,
            return_date: checkOut,
            type: "1",
            adults: String(adults),
            travel_class: travelClass,
            currency,
            hl: "ko",
            gl: "kr",
            departure_token: depToken,
            api_key: serpApiKey,
          });

          providerCallCount += 1;
          const step2Res = await fetchWithTimeout(`https://serpapi.com/search.json?${step2Params.toString()}`, {}, routeSignal);
          if (!step2Res.ok) throw serpProviderError(step2Res, "STEP_2");
          if (step2Res.ok) {
            const step2Json = await readSerpResponse(step2Res, "STEP_2");
            const step2Best = step2Json.best_flights || [];
            const step2Other = step2Json.other_flights || [];

            let selectedRet: SerpApiFlightRaw | null = null;
            let retCollection: "best_flights" | "other_flights" = "best_flights";
            let retIdx = 0;

            if (step2Best.length > 0) {
              selectedRet = step2Best[0];
              retCollection = "best_flights";
              retIdx = 0;
            } else if (step2Other.length > 0) {
              selectedRet = step2Other[0];
              retCollection = "other_flights";
              retIdx = 0;
            }

            if (selectedRet) {
              inboundSlice = parseSerpSlice(selectedRet.flights || [], destinationAirport, departureAirport);
              if (selectedRet.price) {
                finalComboPrice = selectedRet.price;
                priceSource = {
                  stage: "return_selection",
                  collection: retCollection,
                  index: retIdx,
                  path: `return_selection.${retCollection}[${retIdx}].price`,
                };
              }
              bookingToken = selectedRet.booking_token || null;
            }
          }
        } catch (error) {
          if (error instanceof ApiHttpError) lastSelectionError = error;
          // This candidate is excluded because a real inbound could not be verified.
        }
      }

      // Only real SerpAPI inbound segments can make a selectable round-trip.
      if (!inboundSlice || inboundSlice.segments.length === 0) continue;

      // Step 3 is deliberately lazy. The opaque lookup id keeps booking_token
      // server-side and lets the base round-trip render as soon as Step 2 succeeds.
      if (bookingToken) {
        bookingOptionsLookupId = registerBookingLookup({
          bookingToken,
          departureAirport,
          destinationAirport,
          checkIn,
          checkOut,
          adults,
          travelClass,
          currency,
          fallbackPrice: finalComboPrice,
        });
      }

      // Strict Price Normalization (NO 85/15 Split!)
      const normalizedPrice: NormalizedFlightPrice = {
        baseFare: null,
        taxes: null,
        surcharges: null,
        baggageFee: null,
        payableTotal: finalComboPrice,
        currency,
        taxStatus: "unknown",
        sourcePaths: {
          baseFare: null,
          taxes: null,
          payableTotal: priceSource.path,
        },
      };

      const partyPrice: FlightPartyPrice = {
        passengerCount: adults,
        totalTripPrice: finalComboPrice || 0,
        averagePerPassenger: finalComboPrice ? Math.round(finalComboPrice / adults) : null,
        currency,
        averagePerPassengerDerived: true,
      };

      const { amenities, baggageDetails, baggageInfo } = parseAmenitiesAndBaggage(
        rawOutbound.flights || [],
        null
      );

      // Score Breakdown
      const payable = finalComboPrice || Infinity;
      const priceDiff = payable <= flightBudget ? flightBudget - payable : payable - flightBudget;
      const priceScore = payable <= flightBudget ? Math.min(100, 80 + Math.round(priceDiff / 10000)) : Math.max(0, 60 - Math.round(priceDiff / 10000));
      const isAllDirect = outboundSlice.isDirect && inboundSlice.isDirect;
      const directScore = isAllDirect ? 100 : 70;
      const timeScore = calculateFlightTimeScore(outboundSlice, inboundSlice);
      const baggageScore = baggageDetails.status === "explicit" ? 90 : 70;

      const flightScore = Math.round(priceScore * 0.40 + timeScore * 0.25 + directScore * 0.20 + baggageScore * 0.15);
      const scoreBreakdown: FlightScoreBreakdown = { priceScore, timeScore, directScore, baggageScore, totalScore: flightScore };

      const recommendationReasons: string[] = [];
      if (payable <= flightBudget) {
        recommendationReasons.push(`항공 예산(₩${flightBudget.toLocaleString()}원)에 부합합니다.`);
      } else {
        recommendationReasons.push(`예산보다 ₩${priceDiff.toLocaleString()}원 높지만 우수한 스케줄의 추천 대안입니다.`);
      }
      if (isAllDirect) {
        recommendationReasons.push("직항 왕복 여정으로 환승 없이 편리하게 이동합니다.");
      } else {
        recommendationReasons.push("경유 구간이 포함된 여정입니다.");
      }
      if (amenities.legroom) {
        recommendationReasons.push(`좌석 간격: ${amenities.legroom}`);
      } else {
        recommendationReasons.push(baggageInfo[0]);
      }

      const offerObj: FlightOffer = {
        providerOfferId: `serpapi_${departureAirport}_${metadataId || "search"}_${i}`,
        ownerAirlineName,
        ownerAirlineCode,
        airlineLogoUrl: logoUrl,
        outbound: outboundSlice,
        inbound: inboundSlice,
        baggageInfo,
        baggageDetails,
        amenities,
        priceSource,
        price: normalizedPrice,
        partyPrice,
        flightScore,
        recommendationReasons: recommendationReasons.slice(0, 3),
        scoreBreakdown,
        expiresAt: null,
        bookingUrl: null,
        bookingOptions: null,
        bookingOptionsLookupId,
        departureToken: null,
        bookingToken: null,
        searchMetadataId: metadataId,
        provider: "SerpAPI Google Flights",
        dataEnvironment: "live_search",
        bookingEnvironment: "external",
        fetchedAt: new Date().toISOString(),
      };

      normalizedOffers.push(offerObj);
    }

    if (normalizedOffers.length === 0) {
      if (lastSelectionError) throw lastSelectionError;
      return NextResponse.json<FlightSearchResponse>({
        success: true,
        city,
        flightApiProvider: "SerpAPI Google Flights",
        flightApiStatus: "NO_FLIGHTS_FOUND",
        integrationStatus: "VERIFIED",
        providerAvailable: true,
        liveSearchEnabled: true,
        status: "ACTIVE",
        reason: "No complete round-trip offers with real inbound segments were returned.",
        message: "현재 조건에서 검색 가능한 항공편이 없습니다.",
        offers: [],
        budgetMatchedOffers: [],
        budgetExceededOffers: [],
        providerCallCount,
      });
    }

    const budgetMatchedOffers = normalizedOffers
      .filter((f) => f.price.payableTotal !== null && f.price.payableTotal <= flightBudget)
      .sort((a, b) => b.flightScore - a.flightScore);

    const budgetExceededOffers = normalizedOffers
      .filter((f) => f.price.payableTotal !== null && f.price.payableTotal > flightBudget)
      .sort((a, b) => {
        const excessA = (a.price.payableTotal || 0) - flightBudget;
        const excessB = (b.price.payableTotal || 0) - flightBudget;
        if (Math.abs(excessA - excessB) > 20000) return excessA - excessB;
        return b.flightScore - a.flightScore;
      });

    normalizedOffers.sort((a, b) => b.flightScore - a.flightScore);

    return NextResponse.json<FlightSearchResponse>({
      success: true,
      city,
      flightApiProvider: "SerpAPI Google Flights",
      flightApiStatus: "SERPAPI_LIVE_SEARCH_SUCCESS",
      integrationStatus: "VERIFIED",
      providerAvailable: true,
      liveSearchEnabled: true,
      status: "ACTIVE",
      reason: "SerpAPI Google Flights API key verified; base round trips completed through return selection.",
      message: `SerpAPI Google Flights에서 총 ${normalizedOffers.length}개의 라이브 왕복 항공권을 수신하였습니다.`,
      offers: normalizedOffers,
      budgetMatchedOffers: budgetMatchedOffers.slice(0, 3),
      budgetExceededOffers: budgetExceededOffers.slice(0, 2),
      providerCallCount,
    });
  } catch (error: unknown) {
    const mappedError = apiErrorResponse(error);
    if (mappedError.status !== 500) {
      return NextResponse.json({ ...mappedError.body, city, offers: [], providerCallCount }, { status: mappedError.status });
    }
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({
      success: false,
      providerStatus: "INTERNAL_ERROR",
      city,
      flightApiProvider: "SerpAPI Google Flights",
      flightApiStatus: "SERPAPI_FETCH_EXCEPTION",
      integrationStatus: "VERIFIED",
      providerAvailable: true,
      liveSearchEnabled: true,
      status: "ACTIVE",
      reason: `SerpAPI Exception: ${errorMessage}`,
      message: `SerpAPI 연동 처리 중 오류가 발생하였습니다: ${errorMessage}`,
      offers: [],
      providerCallCount,
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const serpApiKey = process.env.SERPAPI_API_KEY || "";
  if (!serpApiKey) {
    return NextResponse.json({ success: false, providerStatus: "UNAVAILABLE", message: "항공 판매처 정보를 불러올 수 없습니다." }, { status: 503 });
  }

  try {
    const body: unknown = await request.json();
    const lookupId = body && typeof body === "object" && "lookupId" in body && typeof body.lookupId === "string"
      ? body.lookupId
      : "";
    if (!/^[0-9a-f-]{36}$/i.test(lookupId)) {
      return NextResponse.json({ success: false, providerStatus: "INVALID_INPUT", message: "예약 옵션 요청이 올바르지 않습니다." }, { status: 400 });
    }

    const entry = getBookingLookup(lookupId);
    if (!entry) {
      return NextResponse.json({ success: false, providerStatus: "EXPIRED", message: "예약 옵션 조회 시간이 만료되었습니다. 항공편을 다시 조회해주세요." }, { status: 410 });
    }
    if (entry.cachedOptions !== undefined) {
      return NextResponse.json({ success: true, bookingOptions: entry.cachedOptions, cached: true });
    }

    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: entry.departureAirport,
      arrival_id: entry.destinationAirport,
      outbound_date: entry.checkIn,
      return_date: entry.checkOut,
      type: "1",
      adults: String(entry.adults),
      travel_class: entry.travelClass,
      currency: entry.currency,
      hl: "ko",
      gl: "kr",
      booking_token: entry.bookingToken,
      api_key: serpApiKey,
    });
    const response = await fetchWithTimeout(`https://serpapi.com/search.json?${params.toString()}`, {}, AbortSignal.timeout(ROUTE_DEADLINE_MS));
    if (!response.ok) throw serpProviderError(response, "STEP_3");
    const json = await readSerpResponse(response, "STEP_3");
    const options = (json.booking_options || []).map((option, index) =>
      normalizeFlightBookingOption(option, index, entry.fallbackPrice)
    );
    entry.cachedOptions = options;
    return NextResponse.json({ success: true, bookingOptions: options, cached: false });
  } catch (error) {
    const mapped = apiErrorResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
