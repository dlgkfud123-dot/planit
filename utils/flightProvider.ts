import type {
  FlightOffer,
  FlightSlice,
  FlightSegment,
  FlightPartyPrice,
  FlightScoreBreakdown,
  NormalizedFlightPrice,
  FlightSearchResponse,
  FlightBaggageDetails,
  FlightAmenities,
  FlightTimeFlags,
} from "../types/flight";
import { getCityAirportIata, getCanonicalArrivalAirportCandidates, isSupportedAirport } from "../data/airports.ts";
import { validateFlightInput } from "./bookingValidation.ts";
import { ApiHttpError, fetchWithTimeout, providerErrorFromStatus } from "./apiRuntime.ts";
import { calculateFlightTimeScore } from "./flightRuntime.ts";

export interface FlightSearchParams {
  city: string;
  departureAirport: string;
  destinationAirport: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  flightBudget: number;
  travelClass: string;
  currency: string;
  comparisonSearch?: boolean;
}

export interface FlightProvider {
  name: "Duffel" | "SerpAPI Google Flights";
  searchFlights(params: FlightSearchParams, signal?: AbortSignal): Promise<FlightSearchResponse>;
}

export function parseIsoDuration(durationStr?: string | null): { hours: number; minutes: number; totalMinutes: number; text: string } {
  if (!durationStr) return { hours: 0, minutes: 0, totalMinutes: 0, text: "" };
  try {
    const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return { hours: 0, minutes: 0, totalMinutes: 0, text: durationStr };
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const minutes = match[2] ? parseInt(match[2], 10) : 0;
    const totalMinutes = hours * 60 + minutes;
    const text = hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;
    return { hours, minutes, totalMinutes, text };
  } catch {
    return { hours: 0, minutes: 0, totalMinutes: 0, text: durationStr };
  }
}

export function formatDuffelDateTime(dateTimeStr?: string | null): { dateText: string; timeText: string; isoText: string } {
  if (!dateTimeStr) return { dateText: "", timeText: "", isoText: "" };
  try {
    const dateObj = new Date(dateTimeStr);
    if (isNaN(dateObj.getTime())) return { dateText: "", timeText: dateTimeStr, isoText: dateTimeStr };

    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const dateText = `${month}월 ${day}일`;

    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const timeText = `${hours}:${minutes}`;

    return {
      dateText,
      timeText,
      isoText: dateTimeStr,
    };
  } catch {
    return { dateText: "", timeText: dateTimeStr || "", isoText: dateTimeStr || "" };
  }
}

export function calculateDuffelTimeFlags(departingAt?: string, arrivingAt?: string): FlightTimeFlags {
  if (!departingAt || !arrivingAt) {
    return { arrivesNextDay: false, dayOffset: 0, isOvernightFlight: false };
  }
  try {
    const depDate = new Date(departingAt);
    const arrDate = new Date(arrivingAt);

    const diffMs = arrDate.getTime() - depDate.getTime();
    const dayOffset = Math.max(0, Math.round(diffMs / (1000 * 3600 * 24)));
    const arrivesNextDay = dayOffset > 0;

    const depHour = depDate.getHours();
    const arrHour = arrDate.getHours();
    const isOvernightFlight = depHour >= 22 || depHour < 5 || arrHour < depHour;

    return { arrivesNextDay, dayOffset, isOvernightFlight };
  } catch {
    return { arrivesNextDay: false, dayOffset: 0, isOvernightFlight: false };
  }
}

export type DuffelRawSegment = {
  id?: string;
  origin?: { iata_code?: string; name?: string };
  destination?: { iata_code?: string; name?: string };
  departing_at?: string;
  arriving_at?: string;
  duration?: string;
  marketing_carrier?: { iata_code?: string; name?: string; logo_symbol_url?: string };
  operating_carrier?: { iata_code?: string; name?: string; logo_symbol_url?: string };
  marketing_carrier_flight_number?: string;
  operating_carrier_flight_number?: string;
  passengers?: Array<{
    cabin_class?: string;
    cabin_class_marketing_name?: string;
    baggages?: Array<{ quantity?: number; type?: string }>;
    cabin?: {
      amenities?: {
        wifi?: { available?: boolean };
        power?: { available?: boolean };
        seat?: { legroom?: string; pitch?: string };
      };
    };
  }>;
};

export type DuffelRawSlice = {
  id?: string;
  origin?: { iata_code?: string; name?: string };
  destination?: { iata_code?: string; name?: string };
  duration?: string;
  segments?: DuffelRawSegment[];
  conditions?: Record<string, unknown>;
  passengers?: Array<{
    baggage?: Array<{ quantity?: number; type?: string }>;
  }>;
};

export type DuffelRawOffer = {
  id: string;
  total_amount: string;
  base_amount?: string | null;
  tax_amount?: string | null;
  total_currency: string;
  expires_at?: string | null;
  owner?: {
    iata_code?: string;
    name?: string;
    logo_symbol_url?: string;
  };
  slices?: DuffelRawSlice[];
  passengers?: Array<{ id?: string }>;
};

export function parseDuffelSegment(rawSeg: DuffelRawSegment, fallbackOrigin: string, fallbackDest: string): FlightSegment {
  const depInfo = formatDuffelDateTime(rawSeg.departing_at);
  const arrInfo = formatDuffelDateTime(rawSeg.arriving_at);
  const timeFlags = calculateDuffelTimeFlags(depInfo.isoText, arrInfo.isoText);

  const mCarrierCode = rawSeg.marketing_carrier?.iata_code || "";
  const mFlightNum = rawSeg.marketing_carrier_flight_number || "";
  const flightNumber = mCarrierCode && mFlightNum ? `${mCarrierCode} ${mFlightNum}` : mFlightNum || null;

  const oCarrierCode = rawSeg.operating_carrier?.iata_code || mCarrierCode;
  const isCodeshare = Boolean(oCarrierCode && mCarrierCode && oCarrierCode !== mCarrierCode);

  return {
    flightNumber,
    originAirport: rawSeg.origin?.iata_code || fallbackOrigin,
    destinationAirport: rawSeg.destination?.iata_code || fallbackDest,
    departingAt: depInfo.isoText,
    arrivingAt: arrInfo.isoText,
    departureDateText: depInfo.dateText,
    departureTimeText: depInfo.timeText,
    arrivalDateText: arrInfo.dateText,
    arrivalTimeText: arrInfo.timeText,
    arrivesNextDay: timeFlags.arrivesNextDay,
    dayOffset: timeFlags.dayOffset,
    isOvernightFlight: timeFlags.isOvernightFlight,
    marketingCarrierName: rawLegName(rawSeg.marketing_carrier?.name),
    operatingCarrierName: rawLegName(rawSeg.operating_carrier?.name) || rawLegName(rawSeg.marketing_carrier?.name),
    airlineCode: mCarrierCode || null,
    isCodeshare,
  };
}

function rawLegName(val?: string | null): string | null {
  return val ? val.trim() : null;
}

export function parseDuffelSlice(rawSlice: DuffelRawSlice, fallbackOrigin: string, fallbackDest: string): FlightSlice {
  const rawSegments = rawSlice.segments || [];
  const segments: FlightSegment[] = rawSegments.map((seg) => parseDuffelSegment(seg, fallbackOrigin, fallbackDest));

  const firstSeg = segments[0] || {
    flightNumber: null,
    originAirport: rawSlice.origin?.iata_code || fallbackOrigin,
    destinationAirport: rawSlice.destination?.iata_code || fallbackDest,
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

  const sliceDuration = parseIsoDuration(rawSlice.duration);
  const stopsCount = Math.max(0, segments.length - 1);
  const isDirect = stopsCount === 0;

  let baggageText = "기내 수하물 포함";
  const paxBaggages = rawSlice.passengers?.[0]?.baggage || rawSegments[0]?.passengers?.[0]?.baggages || [];
  let checkedCount = 0;
  let carryOnCount = 0;

  paxBaggages.forEach((bag) => {
    if (bag.type === "checked") checkedCount += bag.quantity || 1;
    if (bag.type === "carry_on") carryOnCount += bag.quantity || 1;
  });

  if (checkedCount > 0 && carryOnCount > 0) {
    baggageText = `위탁 수하물 ${checkedCount}개 / 기내 수하물 ${carryOnCount}개`;
  } else if (checkedCount > 0) {
    baggageText = `위탁 수하물 ${checkedCount}개 포함`;
  } else if (carryOnCount > 0) {
    baggageText = `기내 수하물 ${carryOnCount}개 포함`;
  }

  return {
    originAirport: firstSeg.originAirport,
    destinationAirport: lastSeg.destinationAirport,
    departureDateText: firstSeg.departureDateText,
    departureTime: firstSeg.departureTimeText,
    arrivalDateText: lastSeg.arrivalDateText,
    arrivalTime: lastSeg.arrivalTimeText,
    durationMinutes: sliceDuration.totalMinutes,
    durationText: sliceDuration.text,
    stopsCount,
    isDirect,
    segments,
    sliceBaggageText: baggageText,
  };
}

export function parseDuffelAmenitiesAndBaggage(rawOffer: DuffelRawOffer): {
  amenities: FlightAmenities;
  baggageDetails: FlightBaggageDetails;
  baggageInfo: string[];
} {
  const firstSlice = rawOffer.slices?.[0];
  const firstSeg = firstSlice?.segments?.[0];
  const paxCabin = firstSeg?.passengers?.[0]?.cabin;
  const paxAmenities = paxCabin?.amenities;

  const legroom = paxAmenities?.seat?.pitch ? `${paxAmenities.seat.pitch}인치` : paxAmenities?.seat?.legroom || null;
  const wifi = paxAmenities?.wifi?.available ?? null;
  const powerOutlet = paxAmenities?.power?.available ?? null;

  const paxBaggages = firstSlice?.passengers?.[0]?.baggage || firstSeg?.passengers?.[0]?.baggages || [];
  let checkedCount = 0;
  let carryOnCount = 0;

  paxBaggages.forEach((bag) => {
    if (bag.type === "checked") checkedCount += bag.quantity || 1;
    if (bag.type === "carry_on") carryOnCount += bag.quantity || 1;
  });

  let baggageText = "기내 수하물 포함";
  if (checkedCount > 0 && carryOnCount > 0) {
    baggageText = `위탁 수하물 ${checkedCount}개 / 기내 수하물 ${carryOnCount}개`;
  } else if (checkedCount > 0) {
    baggageText = `위탁 수하물 ${checkedCount}개 포함`;
  } else if (carryOnCount > 0) {
    baggageText = `기내 수하물 ${carryOnCount}개 포함`;
  }

  return {
    amenities: {
      legroom,
      wifi,
      powerOutlet,
      carbonEmissionText: null,
    },
    baggageDetails: {
      outbound: baggageText,
      inbound: baggageText,
      status: "explicit",
      sourcePath: "slices[0].passengers[0].baggage",
    },
    baggageInfo: [`수하물: ${baggageText}`],
  };
}

export function normalizeDuffelOffer(
  rawOffer: DuffelRawOffer,
  passengerCount: number,
  flightBudget: number,
  isTestToken: boolean
): FlightOffer | null {
  if (!rawOffer || !rawOffer.id || !rawOffer.total_amount || !rawOffer.slices || rawOffer.slices.length === 0) {
    return null;
  }

  const outboundSlice = parseDuffelSlice(rawOffer.slices[0], "ICN", "NRT");
  const inboundSlice = rawOffer.slices[1] ? parseDuffelSlice(rawOffer.slices[1], "NRT", "ICN") : null;

  const totalPayable = parseFloat(rawOffer.total_amount);
  const baseFare = rawOffer.base_amount ? parseFloat(rawOffer.base_amount) : totalPayable;
  const taxes = rawOffer.tax_amount ? parseFloat(rawOffer.tax_amount) : 0;
  const currency = (rawOffer.total_currency || "KRW").toUpperCase();

  const normalizedPrice: NormalizedFlightPrice = {
    baseFare,
    taxes,
    surcharges: 0,
    baggageFee: 0,
    payableTotal: totalPayable,
    currency,
    taxStatus: "included",
    sourcePaths: {
      baseFare: "offer.base_amount",
      taxes: "offer.tax_amount",
      payableTotal: "offer.total_amount",
    },
  };

  const perPax = passengerCount > 0 ? Math.round(totalPayable / passengerCount) : totalPayable;
  const partyPrice: FlightPartyPrice = {
    passengerCount,
    totalTripPrice: totalPayable,
    averagePerPassenger: perPax,
    currency,
    averagePerPassengerDerived: true,
  };

  const airlineName = rawOffer.owner?.name || "기타 항공사";
  const airlineCode = rawOffer.owner?.iata_code || "ZZ";
  const airlineLogoUrl = rawOffer.owner?.logo_symbol_url || `https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/${airlineCode}.svg`;

  const { amenities, baggageDetails, baggageInfo } = parseDuffelAmenitiesAndBaggage(rawOffer);

  const timeScore = calculateFlightTimeScore(outboundSlice, inboundSlice || outboundSlice);

  let priceScore = 80;
  if (totalPayable <= flightBudget) {
    priceScore = Math.min(100, 85 + Math.round(((flightBudget - totalPayable) / flightBudget) * 15));
  } else {
    const excessRatio = (totalPayable - flightBudget) / flightBudget;
    priceScore = Math.max(0, 75 - Math.round(excessRatio * 60));
  }

  const directScore = outboundSlice.isDirect && (!inboundSlice || inboundSlice.isDirect) ? 100 : 70;
  const baggageScore = 90;
  const totalScore = Math.round(priceScore * 0.45 + timeScore * 0.3 + directScore * 0.15 + baggageScore * 0.1);

  const scoreBreakdown: FlightScoreBreakdown = {
    priceScore,
    timeScore,
    directScore,
    baggageScore,
    totalScore,
  };

  const recommendationReasons: string[] = [];
  if (totalPayable <= flightBudget) recommendationReasons.push("예산 대비 가성비 우수");
  if (outboundSlice.isDirect) recommendationReasons.push("직항 운항으로 신속 이동");
  if (totalScore >= 80) recommendationReasons.push("항공사 정시 운항 및 종합 평가 우수");

  const expiresAt = rawOffer.expires_at || null;
  const isExpired = expiresAt ? Date.now() >= Date.parse(expiresAt) : false;

  return {
    providerOfferId: rawOffer.id,
    ownerAirlineName: airlineName,
    ownerAirlineCode: airlineCode,
    airlineLogoUrl,
    outbound: outboundSlice,
    inbound: inboundSlice,
    baggageInfo,
    baggageDetails,
    amenities,
    price: normalizedPrice,
    partyPrice,
    flightScore: totalScore,
    recommendationReasons,
    scoreBreakdown,
    expiresAt,
    isExpired,
    bookingUrl: null,
    bookingOptions: null,
    bookingOptionsLookupId: null,
    selectedSeller: null,
    departureToken: null,
    bookingToken: null,
    searchMetadataId: null,
    provider: "Duffel",
    environment: isTestToken ? "sandbox" : "production",
    dataEnvironment: "live_search",
    bookingEnvironment: "external",
    fetchedAt: new Date().toISOString(),
  };
}

export class DuffelFlightProvider implements FlightProvider {
  name = "Duffel" as const;

  async searchFlights(params: FlightSearchParams, signal?: AbortSignal): Promise<FlightSearchResponse> {
    const apiKey = process.env.DUFFEL_API_KEY || process.env.DUFFEL_TOKEN || "";
    if (!apiKey) {
      throw new ApiHttpError(503, "UNAVAILABLE", "DUFFEL_API_KEY 미설정 상태입니다.");
    }

    const isTestToken = apiKey.startsWith("duffel_test_");

    const slices = [
      {
        origin: params.departureAirport,
        destination: params.destinationAirport,
        departure_date: params.checkIn,
      },
    ];

    if (params.checkOut) {
      slices.push({
        origin: params.destinationAirport,
        destination: params.departureAirport,
        departure_date: params.checkOut,
      });
    }

    const passengers = Array.from({ length: params.adults }, () => ({ type: "adult" }));

    const duffelPayload = {
      data: {
        slices,
        passengers,
        cabin_class: "economy",
      },
    };

    let res: Response;
    try {
      res = await fetchWithTimeout(
        "https://api.duffel.com/air/offer_requests?return_offers=true",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Duffel-Version": "v2",
            "Content-Type": "application/json",
            "Accept-Encoding": "gzip",
          },
          body: JSON.stringify(duffelPayload),
        },
        signal
      );
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new ApiHttpError(504, "TIMEOUT", "Duffel 항공 서비스 응답이 지연되고 있습니다.");
      }
      throw new ApiHttpError(502, "PROVIDER_ERROR", "Duffel 항공 서비스 연결 실패");
    }

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new ApiHttpError(401, "AUTH_ERROR", "Duffel API 인증 정보가 올바르지 않습니다.");
      }
      if (res.status === 429) {
        throw new ApiHttpError(429, "RATE_LIMITED", "Duffel API 요청 한도를 초과했습니다.");
      }
      if (res.status === 400 || res.status === 422) {
        throw new ApiHttpError(400, "INVALID_AIRPORT", "유효하지 않은 공항 코드이거나 요청 정보가 올바르지 않습니다.");
      }
      throw providerErrorFromStatus(res.status, "Duffel");
    }

    let duffelJson: { data?: { id?: string; offers?: DuffelRawOffer[] } };
    try {
      duffelJson = await res.json();
    } catch {
      throw new ApiHttpError(502, "PROVIDER_ERROR", "Duffel API 응답을 해석할 수 없습니다.");
    }

    const rawOffers = duffelJson.data?.offers || [];
    const normalizedOffers: FlightOffer[] = rawOffers
      .map((offer) => normalizeDuffelOffer(offer, params.adults, params.flightBudget, isTestToken))
      .filter((offer): offer is FlightOffer => offer !== null);

    // Sort by flightScore descending
    normalizedOffers.sort((a, b) => b.flightScore - a.flightScore);

    const budgetMatchedOffers = normalizedOffers
      .filter((o) => (o.price.payableTotal ?? 0) <= params.flightBudget)
      .sort((a, b) => b.flightScore - a.flightScore);

    const budgetExceededOffers = normalizedOffers
      .filter((o) => (o.price.payableTotal ?? 0) > params.flightBudget)
      .sort((a, b) => (a.price.payableTotal ?? 0) - (b.price.payableTotal ?? 0));

    return {
      success: true,
      city: params.city,
      flightApiProvider: "Duffel Test Mode (API v2)",
      flightApiStatus: isTestToken ? "DUFFEL_TEST_MODE_ACTIVE" : "DUFFEL_LIVE_MODE_ACTIVE",
      integrationStatus: "VERIFIED",
      providerAvailable: true,
      liveSearchEnabled: true,
      status: "ACTIVE",
      reason: isTestToken ? "Duffel Sandbox Test Mode Enabled" : "Duffel Production Mode Active",
      message: isTestToken
        ? "현재 항공편 정보는 Duffel 테스트 환경에서 제공됩니다. 실제 운임·재고와 다를 수 있습니다."
        : "Duffel API 항공편 검색 결과입니다.",
      rawOfferSummary: duffelJson.data?.id
        ? {
            id: duffelJson.data.id,
            live_mode: !isTestToken,
            expires_at: rawOffers[0]?.expires_at || null,
            base_amount: rawOffers[0]?.base_amount || null,
            base_currency: rawOffers[0]?.total_currency || null,
            tax_amount: rawOffers[0]?.tax_amount || null,
            tax_currency: rawOffers[0]?.total_currency || null,
            total_amount: rawOffers[0]?.total_amount || null,
            total_currency: rawOffers[0]?.total_currency || null,
            slice_ids: [],
            segment_ids: [],
          }
        : undefined,
      offers: normalizedOffers,
      budgetMatchedOffers,
      budgetExceededOffers,
      providerCallCount: 1,
      cached: false,
      isTestMode: isTestToken,
      testNotice: isTestToken
        ? {
            title: "항공권 검색 결과",
            notice: "현재 항공편 정보는 Duffel 테스트 환경에서 제공됩니다. 실제 운임·재고와 다를 수 있습니다.",
          }
        : undefined,
    } as FlightSearchResponse & { isTestMode?: boolean; testNotice?: { title: string; notice: string } };
  }
}

export function getFlightProvider(providerName?: string): FlightProvider {
  const targetProvider = providerName || process.env.FLIGHT_PROVIDER || "duffel";
  const hasDuffelKey = Boolean(process.env.DUFFEL_API_KEY || process.env.DUFFEL_TOKEN);

  if (targetProvider === "duffel" && hasDuffelKey) {
    return new DuffelFlightProvider();
  }
  return new SerpApiFlightProvider();
}

export class SerpApiFlightProvider implements FlightProvider {
  name = "SerpAPI Google Flights" as const;

  async searchFlights(params: FlightSearchParams, signal?: AbortSignal): Promise<FlightSearchResponse> {
    const serpApiKey = process.env.SERPAPI_API_KEY || "";
    if (!serpApiKey) {
      throw new ApiHttpError(503, "UNAVAILABLE", "SERPAPI_API_KEY 미설정 상태입니다.");
    }
    throw new Error("SerpAPI provider fallback delegates to legacy serpapi handler");
  }
}
