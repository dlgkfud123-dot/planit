import { NextResponse } from "next/server.js";
import { cityByName } from "../../../../data/cities.ts";
import type { HotelLocation, HotelOffer, NormalizedHotelPrice, TripScoreBreakdown, TripScoreGrade, TravelStyle, CityBudgetEstimate } from "../../../../types/hotel";
import { validateHotelInput } from "../../../../utils/bookingValidation.ts";
import { ApiHttpError, ROUTE_DEADLINE_MS, apiErrorResponse, fetchWithTimeout, providerErrorFromStatus } from "../../../../utils/apiRuntime.ts";
import { liteApiFetch } from "../../../../utils/liteApiRuntime.ts";

type LiteApiTaxRaw = { included?: boolean; amount?: number };
type LiteApiRetailRateRaw = {
  total?: Array<{ amount?: number }>;
  taxesAndFees?: LiteApiTaxRaw[];
};
type LiteApiRateItemRaw = {
  name?: string;
  retailRate?: LiteApiRetailRateRaw;
  payAtProperty?: boolean;
  payableAtHotel?: boolean;
};
type LiteApiRoomTypeRaw = {
  name?: string;
  offerRetailRate?: { amount?: number; currency?: string };
  rates?: LiteApiRateItemRaw[];
};
type LiteApiRateRaw = {
  id?: string | number;
  hotelId?: string | number;
  roomTypes?: LiteApiRoomTypeRaw[];
  offers?: LiteApiRoomTypeRaw[];
};
type LiteApiHotelRaw = {
  id?: string | number;
  hotelId?: string | number;
  name?: string;
  latitude: number;
  longitude: number;
  dist?: number;
  address?: string | { line1?: string };
};
type LiteApiHotelDetailRaw = LiteApiHotelRaw & {
  main_photo?: string;
  mainPhoto?: string;
  imageUrl?: string;
  hotelImages?: Array<{ url?: string }>;
  countryCode?: string;
  address?: string | { line1?: string };
};
type OsmElementRaw = {
  id: string | number;
  type: string;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

/**
 * INACTIVE PROVIDER NOTICE:
 * Amadeus Self-Service Portal was permanently shut down on July 17, 2026.
 * Currently only Enterprise API Portal is maintained.
 * Amadeus implementation is preserved as an inactive provider in compliance with project directives.
 */

type CacheEntry = {
  timestamp: number;
  data: LiteApiRateRaw[];
};
type TimedCacheEntry<T> = { timestamp: number; data: T };
// Best-effort per-instance cache only. Correctness and selected prices must never
// depend on this cache because serverless instances do not share memory.
const ratesCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;
const hotelListCache = new Map<string, TimedCacheEntry<LiteApiHotelRaw[]>>();
const hotelDetailCache = new Map<string, TimedCacheEntry<LiteApiHotelDetailRaw>>();
const hotelSearchInFlight = new Map<string, Promise<HotelSearchResult>>();
const HOTEL_LIST_TTL_MS = 60 * 60 * 1000;
const HOTEL_DETAIL_TTL_MS = 6 * 60 * 60 * 1000;
const HOTEL_RADIUS_METERS = 20_000;
const HOTEL_DETAIL_LIMIT = 3;
const HOTEL_DEFERRED_BATCH_LIMIT = 3;
const HOTEL_DEFERRED_LOOKUP_TTL_MS = CACHE_TTL_MS;
const HOTEL_DETAIL_TIMEOUT_MS = 3_000;
const OSM_REQUEST_TIMEOUT_MS = 1_500;

type HotelSearchResult = Awaited<ReturnType<typeof executeHotelSearch>>;
type HotelOfferContext = {
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
  lodgingBudgetThreshold: number;
  travelStyle: TravelStyle;
  itineraryPlaces: Array<{ name: string; lat: number; lng: number; day?: number }>;
  transitMode: "transit" | "walk" | "drive";
  centerLat: number;
  centerLng: number;
};
type DeferredHotelCandidate = { candidate: LiteApiHotelRaw; rate: LiteApiRateRaw };
type DeferredHotelLookupResult = {
  success: true;
  hotels: HotelOffer[];
  hasMoreHotels: boolean;
  attemptedCount: number;
  externalDetailCallCount: number;
  detailCacheHitCount: number;
};
type DeferredHotelLookupEntry = {
  createdAt: number;
  nextIndex: number;
  candidates: DeferredHotelCandidate[];
  context: HotelOfferContext;
  inFlight: Promise<DeferredHotelLookupResult> | null;
};
const deferredHotelLookups = new Map<string, DeferredHotelLookupEntry>();

function getTimedCache<T>(cache: Map<string, TimedCacheEntry<T>>, key: string, ttlMs: number): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setTimedCache<T>(cache: Map<string, TimedCacheEntry<T>>, key: string, data: T) {
  cache.set(key, { timestamp: Date.now(), data });
}

function getCachedRates(key: string) {
  const entry = ratesCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    ratesCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCachedRates(key: string, data: LiteApiRateRaw[]) {
  // Shared-cache replacement point. Only provider search results are cached;
  // an already selected booking snapshot is never overwritten from this path.
  ratesCache.set(key, { timestamp: Date.now(), data });
}

function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function parseNormalizedPrice(roomType: LiteApiRoomTypeRaw, rateItem: LiteApiRateItemRaw): NormalizedHotelPrice {
  const basePrice = roomType?.offerRetailRate?.amount || rateItem?.retailRate?.total?.[0]?.amount || null;
  const currency = roomType?.offerRetailRate?.currency || "KRW";
  const taxesList = rateItem?.retailRate?.taxesAndFees || [];

  let includedTaxAmount = 0;
  let excludedTaxAmount = 0;
  let hasIncluded = false;
  let hasExcluded = false;

  taxesList.forEach((t) => {
    if (t.included === true) {
      includedTaxAmount += t.amount || 0;
      hasIncluded = true;
    } else if (t.included === false) {
      excludedTaxAmount += t.amount || 0;
      hasExcluded = true;
    }
  });

  let taxStatus: NormalizedHotelPrice["taxStatus"] = "unknown";
  if (hasIncluded && hasExcluded) {
    taxStatus = "partial";
  } else if (hasExcluded) {
    taxStatus = "excluded";
  } else if (hasIncluded) {
    taxStatus = "included";
  } else if (taxesList.length > 0) {
    taxStatus = "included";
  }

  const explicitPayAtHotel = rateItem?.payAtProperty || rateItem?.payableAtHotel || null;
  const paymentTiming: NormalizedHotelPrice["paymentTiming"] = explicitPayAtHotel ? "at_property" : "unknown";
  const payableAtHotel = explicitPayAtHotel ? excludedTaxAmount : null;
  const payableOnline = basePrice;

  let payableTotal: number | null = null;
  if (basePrice !== null) {
    if (taxStatus === "included") {
      payableTotal = basePrice;
    } else if (taxStatus === "excluded" || taxStatus === "partial") {
      payableTotal = basePrice + excludedTaxAmount;
    } else {
      payableTotal = basePrice;
    }
  }

  return {
    basePrice,
    includedTaxAmount: hasIncluded ? includedTaxAmount : 0,
    excludedTaxAmount: hasExcluded ? excludedTaxAmount : 0,
    feeAmount: 0,
    payableOnline,
    payableAtHotel,
    payableTotal,
    currency,
    taxStatus,
    paymentTiming,
    sourcePaths: {
      basePrice: "data[0].roomTypes[0].offerRetailRate.amount",
      includedTaxAmount: hasIncluded ? "data[0].roomTypes[0].rates[0].retailRate.taxesAndFees[included=true]" : null,
      excludedTaxAmount: hasExcluded ? "data[0].roomTypes[0].rates[0].retailRate.taxesAndFees[included=false]" : null,
      payableTotal: "basePrice + excludedTaxAmount"
    }
  };
}

function getGradeFromScore(score: number): TripScoreGrade {
  if (score >= 90) return "S (Excellent)";
  if (score >= 80) return "A (Very Good)";
  if (score >= 70) return "B (Good)";
  if (score >= 60) return "C (Fair)";
  return "D (Low Match)";
}

// Compute Trip Score, Travel Time & Top 3 Data-Driven Recommendation Reasons
function computeTripScoreAndReasons(
  hLat: number,
  hLon: number,
  distanceFromCenterKm: number,
  price: NormalizedHotelPrice,
  imageUrl: string | null,
  address: string | null,
  lodgingBudget: number,
  travelStyle: TravelStyle = "standard",
  itineraryPlaces: Array<{ name: string; lat: number; lng: number; day?: number }> = [],
  transitMode: "transit" | "walk" | "drive" = "transit"
): {
  tripScore: number;
  tripScoreGrade: TripScoreGrade;
  avgItineraryDistanceKm: number;
  avgItineraryTimeMinutes: number;
  closestDayNumber?: number;
  recommendationReasons: string[];
  scoreBreakdown: TripScoreBreakdown;
} {
  let avgItineraryDistanceKm = distanceFromCenterKm;
  let closestDayNumber: number | undefined = undefined;
  let closestDayDist = Infinity;
  let closestDayTimeMin = 0;

  if (itineraryPlaces.length > 0) {
    let totalDist = 0;
    const dayDistancesMap = new Map<number, number[]>();

    itineraryPlaces.forEach((p) => {
      const d = calculateHaversineDistance(hLat, hLon, p.lat, p.lng);
      totalDist += d;
      const dayNum = p.day || 1;
      if (!dayDistancesMap.has(dayNum)) dayDistancesMap.set(dayNum, []);
      dayDistancesMap.get(dayNum)!.push(d);
    });

    avgItineraryDistanceKm = Math.round((totalDist / itineraryPlaces.length) * 10) / 10;

    dayDistancesMap.forEach((dists, dayNum) => {
      const dayAvg = dists.reduce((a, b) => a + b, 0) / dists.length;
      if (dayAvg < closestDayDist) {
        closestDayDist = dayAvg;
        closestDayNumber = dayNum;
      }
    });
  }

  // Calculate Average Travel Time (in Minutes)
  let speedKmH = 25; // Default public transit / city taxi average
  let fixedWaitMinutes = 5;
  if (transitMode === "walk") {
    speedKmH = 4.5;
    fixedWaitMinutes = 0;
  } else if (transitMode === "drive") {
    speedKmH = 35;
    fixedWaitMinutes = 3;
  }
  const avgItineraryTimeMinutes = Math.round((avgItineraryDistanceKm / speedKmH) * 60 + fixedWaitMinutes);
  if (closestDayDist !== Infinity) {
    closestDayTimeMin = Math.round((closestDayDist / speedKmH) * 60 + fixedWaitMinutes);
  }

  // 1. Component Scores (0 ~ 100)
  const itineraryDistScore = Math.max(0, Math.min(100, Math.round(100 - (avgItineraryDistanceKm * 8))));

  const payable = price.payableTotal || Infinity;
  let budgetMatchScore = 50;
  let priceDiff = 0;

  // Target price ratio range based on travelStyle & budget
  let targetMinRatio = 0.55;
  let targetMaxRatio = 0.95;
  if (travelStyle === "budget") {
    targetMinRatio = 0.30;
    targetMaxRatio = 0.85;
  } else if (travelStyle === "premium") {
    targetMinRatio = 0.70;
    targetMaxRatio = 1.00;
  }

  if (payable <= lodgingBudget) {
    const ratio = payable / Math.max(1, lodgingBudget);
    if (ratio >= targetMinRatio && ratio <= targetMaxRatio) {
      const mid = (targetMinRatio + targetMaxRatio) / 2;
      const dev = Math.abs(ratio - mid);
      budgetMatchScore = Math.min(100, Math.round(92 + (1 - dev) * 8));
    } else if (ratio < targetMinRatio) {
      budgetMatchScore = Math.max(50, Math.round(90 - ((targetMinRatio - ratio) * 60)));
    } else {
      budgetMatchScore = Math.max(75, Math.round(92 - ((ratio - targetMaxRatio) * 50)));
    }
  } else {
    priceDiff = payable - lodgingBudget;
    const excessRatio = priceDiff / Math.max(1, lodgingBudget);
    budgetMatchScore = Math.max(0, Math.round(65 - (excessRatio * 100)));
  }

  const cityAccessScore = Math.max(0, Math.min(100, Math.round(100 - (distanceFromCenterKm * 6))));
  const detailQualityScore = (imageUrl ? 60 : 0) + (address ? 40 : 0);

  // 2. Dynamic Weightings by Travel Style
  let wItinerary = 0.40;
  let wBudget = 0.30;
  let wCity = 0.15;
  let wQuality = 0.15;

  if (travelStyle === "budget") {
    wBudget = 0.50;
    wItinerary = 0.30;
    wCity = 0.10;
    wQuality = 0.10;
  } else if (travelStyle === "premium") {
    wQuality = 0.35;
    wCity = 0.30;
    wItinerary = 0.25;
    wBudget = 0.10;
  }

  const totalScore = Math.round(
    itineraryDistScore * wItinerary +
    budgetMatchScore * wBudget +
    cityAccessScore * wCity +
    detailQualityScore * wQuality
  );

  const grade = getGradeFromScore(totalScore);

  const scoreBreakdown: TripScoreBreakdown = {
    itineraryDistScore,
    budgetMatchScore,
    cityAccessScore,
    detailQualityScore,
    totalScore,
    grade
  };

  // 3. Top-3 Data-Driven Recommendation Reasons
  const reasons: string[] = [];

  // Reason 1: Budget / Savings
  if (payable <= lodgingBudget) {
    if (priceDiff >= 10000) {
      reasons.push(`숙소 예산보다 ₩${priceDiff.toLocaleString()}원 저렴합니다.`);
    } else {
      reasons.push(`선호 숙소 예산(₩${lodgingBudget.toLocaleString()}원)에 적합합니다.`);
    }
  } else {
    reasons.push(`숙소 예산보다 ₩${priceDiff.toLocaleString()}원 초과하지만 입지 접근성이 좋은 대안입니다.`);
  }

  // Reason 2: Itinerary Travel Time / Distance
  if (closestDayNumber !== undefined && closestDayDist <= 4.0) {
    reasons.push(`DAY ${closestDayNumber} 일정 평균 이동시간이 가장 짧습니다 (대중교통 약 ${closestDayTimeMin}분).`);
  } else if (avgItineraryDistanceKm <= 3.5) {
    reasons.push(`전체 일정 평균 이동시간이 약 ${avgItineraryTimeMinutes}분으로 동선 효율이 뛰어납니다.`);
  } else {
    reasons.push(`전체 일정 평균 이동거리 ${avgItineraryDistanceKm}km (이동시간 약 ${avgItineraryTimeMinutes}분).`);
  }

  // Reason 3: City Center Access / Quality
  if (distanceFromCenterKm <= 2.0) {
    reasons.push(`도심 중심가 접근성 상위 10%입니다 (중심지와 ${distanceFromCenterKm}km).`);
  } else if (detailQualityScore >= 90) {
    reasons.push(`실제 상세 이미지 및 위치 정보 품질이 검증되었습니다.`);
  } else {
    reasons.push(`도심 접근성(${distanceFromCenterKm}km)과 일정 동선의 위치 균형이 우수합니다.`);
  }

  return {
    tripScore: totalScore,
    tripScoreGrade: grade,
    avgItineraryDistanceKm,
    avgItineraryTimeMinutes,
    closestDayNumber,
    recommendationReasons: reasons.slice(0, 3),
    scoreBreakdown
  };
}

function normalizeHotelAddress(value: LiteApiHotelRaw["address"]): string | null {
  if (typeof value === "string") return value.trim() || null;
  return value?.line1?.trim() || null;
}

async function fetchHotelDetail(
  providerHotelId: string,
  liteApiKey: string,
  routeSignal?: AbortSignal
): Promise<{ detail: LiteApiHotelDetailRaw | null; cacheHit: boolean; externalCall: boolean }> {
  const cached = getTimedCache(hotelDetailCache, providerHotelId, HOTEL_DETAIL_TTL_MS);
  if (cached) return { detail: cached, cacheHit: true, externalCall: false };

  try {
    const detailSignal = routeSignal
      ? AbortSignal.any([routeSignal, AbortSignal.timeout(HOTEL_DETAIL_TIMEOUT_MS)])
      : AbortSignal.timeout(HOTEL_DETAIL_TIMEOUT_MS);
    const detailRes = await liteApiFetch(`https://api.liteapi.travel/v3.0/data/hotel?hotelId=${providerHotelId}`, {
      headers: { "X-API-Key": liteApiKey, "Accept": "application/json" }
    }, detailSignal);
    const payload: { data?: LiteApiHotelDetailRaw } = await detailRes.json();
    const detail = payload.data || null;
    const detailId = String(detail?.id || detail?.hotelId || "");
    if (!detail || detailId !== providerHotelId) return { detail: null, cacheHit: false, externalCall: true };
    setTimedCache(hotelDetailCache, providerHotelId, detail);
    return { detail, cacheHit: false, externalCall: true };
  } catch (error) {
    console.warn("[LiteAPI detail skipped]", JSON.stringify({ providerStage: "DETAIL", providerHotelId, error: error instanceof Error ? error.message : String(error) }));
    return { detail: null, cacheHit: false, externalCall: true };
  }
}

function buildHotelOffer(
  candidate: LiteApiHotelRaw,
  rateMatch: LiteApiRateRaw,
  detailObj: LiteApiHotelDetailRaw,
  context: HotelOfferContext
): HotelOffer | null {
  const providerHotelId = String(candidate.id || candidate.hotelId || "");
  if (!providerHotelId || String(rateMatch.hotelId || rateMatch.id || "") !== providerHotelId) return null;
  if (String(detailObj.id || detailObj.hotelId || "") !== providerHotelId) return null;

  const roomType = rateMatch.roomTypes?.[0] || rateMatch.offers?.[0];
  const rateInfo = roomType?.rates?.[0];
  if (!roomType || !rateInfo) return null;
  const price = parseNormalizedPrice(roomType, rateInfo);
  if (price.payableTotal === null) return null;

  const imageUrl = detailObj.main_photo || detailObj.mainPhoto || detailObj.imageUrl || detailObj.hotelImages?.[0]?.url || null;
  const address = normalizeHotelAddress(detailObj.address) || normalizeHotelAddress(candidate.address);
  const latitude = detailObj.latitude ?? candidate.latitude;
  const longitude = detailObj.longitude ?? candidate.longitude;
  const distanceFromCenterKm = calculateHaversineDistance(context.centerLat, context.centerLng, latitude, longitude);
  const score = computeTripScoreAndReasons(
    latitude,
    longitude,
    distanceFromCenterKm,
    price,
    imageUrl,
    address,
    context.lodgingBudgetThreshold,
    context.travelStyle,
    context.itineraryPlaces,
    context.transitMode
  );
  const hotelName = detailObj.name || candidate.name || "";

  return {
    providerHotelId,
    hotelName,
    city: context.city,
    countryCode: detailObj.countryCode || "JP",
    address,
    latitude,
    longitude,
    checkIn: context.checkIn,
    checkOut: context.checkOut,
    adults: context.adults,
    rooms: context.rooms,
    available: true,
    roomName: rateInfo.name || roomType.name || "Standard Room",
    price,
    imageUrl,
    bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(`${hotelName} ${context.city}`)}&checkin=${context.checkIn}&checkout=${context.checkOut}&group_adults=${context.adults}`,
    bookingLinkType: "external_search",
    provider: "LiteAPI",
    environment: "sandbox",
    fetchedAt: new Date().toISOString(),
    derivedNightlyPrice: true,
    distanceFromCenterKm,
    destinationMatched: distanceFromCenterKm <= 25,
    travelStyle: context.travelStyle,
    tripScore: score.tripScore,
    tripScoreGrade: score.tripScoreGrade,
    avgItineraryDistanceKm: score.avgItineraryDistanceKm,
    avgItineraryTimeMinutes: score.avgItineraryTimeMinutes,
    transitMode: context.transitMode,
    closestDayNumber: score.closestDayNumber,
    recommendationReasons: score.recommendationReasons,
    scoreBreakdown: score.scoreBreakdown
  };
}

function removeExpiredDeferredHotelLookups() {
  const now = Date.now();
  deferredHotelLookups.forEach((entry, key) => {
    if (now - entry.createdAt > HOTEL_DEFERRED_LOOKUP_TTL_MS) deferredHotelLookups.delete(key);
  });
}

const cityBudgetEstimatesMap: Record<string, CityBudgetEstimate> = {
  도쿄: {
    cityName: "도쿄",
    budgetRangeText: "1박 약 ₩90,000 ~ ₩350,000 (시즌 및 지역별 차등)",
    standardNightlyRange: "₩90,000 ~ ₩180,000 (비즈니스/실속형)",
    premiumNightlyRange: "₩220,000 ~ ₩450,000 (시부야/신주쿠 중심가 4~5성급)",
    disclaimer: "본 예산 범위는 도쿄 지역 숙박 평균 지출 기준 참고용 예상치(Estimate)이며, 특정 날짜의 실시간 가격 및 잔여 객실은 외부 예약 사이트 조회가 필요합니다."
  },
  후쿠오카: {
    cityName: "후쿠오카",
    budgetRangeText: "1박 약 ₩70,000 ~ ₩260,000 (시즌 및 지역별 차등)",
    standardNightlyRange: "₩70,000 ~ ₩140,000 (하카타/텐진 실속형)",
    premiumNightlyRange: "₩160,000 ~ ₩320,000 (역세권 고급/온천 료칸)",
    disclaimer: "본 예산 범위는 후쿠오카 지역 숙박 평균 지출 기준 참고용 예상치(Estimate)이며, 특정 날짜의 실시간 가격 및 잔여 객실은 외부 예약 사이트 조회가 필요합니다."
  },
  파리: {
    cityName: "파리",
    budgetRangeText: "1박 약 ₩140,000 ~ ₩550,000 (시즌 및 존별 차등)",
    standardNightlyRange: "₩140,000 ~ ₩260,000 (외곽/실속형 3성급)",
    premiumNightlyRange: "₩320,000 ~ ₩750,000 (1~8구 중심가 고급 호텔)",
    disclaimer: "본 예산 범위는 파리 지역 숙박 평균 지출 기준 참고용 예상치(Estimate)이며, 특정 날짜의 실시간 가격 및 잔여 객실은 외부 예약 사이트 조회가 필요합니다."
  }
};

async function executeHotelSearch(
  city: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  rooms: number,
  currency: string,
  lodgingBudgetThreshold: number = 600000,
  travelStyle: TravelStyle = "standard",
  itineraryPlaces: Array<{ name: string; lat: number; lng: number; day?: number }> = [],
  transitMode: "transit" | "walk" | "drive" = "transit",
  routeSignal?: AbortSignal
) {
  const startTime = Date.now();
  const liteApiKey = process.env.LITEAPI_SANDBOX_KEY || process.env.LITEAPI_API_KEY || "";
  const hasLiteApiKey = Boolean(liteApiKey);
  if (!hasLiteApiKey) throw new ApiHttpError(503, "UNAVAILABLE", "LiteAPI 환경변수가 설정되지 않았습니다.");

  const cityData = cityByName[city];

  if (!cityData) {
    return {
      success: false,
      city,
      priceApiStatus: "UNCONFIGURED_MISSING_SANDBOX_KEY",
      liteApiHotels: [],
      budgetMatchedHotels: [],
      budgetExceededHotels: [],
      osmLocations: [],
      message: "해당 도시 위치 정보가 시스템에 등록되어 있지 않습니다.",
    };
  }

  const centerLat = cityData.lat;
  const centerLng = cityData.lon;

  let candidatesCount = 0;
  let ratesRequestedCount = 0;
  let cacheHit = false;
  let detailRequestedCount = 0;
  let detailCompletedCount = 0;
  let detailSkippedCount = 0;
  let hotelDetailLookupId: string | null = null;
  let hasMoreHotels = false;
  const liteApiHotels: HotelOffer[] = [];

  if (hasLiteApiKey) {
    try {
      // 1. Fetch up to 100 candidate hotels within 20km radius
      const listCacheKey = `${city}_${centerLat}_${centerLng}_${HOTEL_RADIUS_METERS}_limit100`;
      const cachedCandidateHotels = getTimedCache(hotelListCache, listCacheKey, HOTEL_LIST_TTL_MS);
      let candidateHotels: LiteApiHotelRaw[];
      if (cachedCandidateHotels) {
        candidateHotels = cachedCandidateHotels;
      } else {
        const geoUrl = `https://api.liteapi.travel/v3.0/data/hotels?latitude=${centerLat}&longitude=${centerLng}&radius=${HOTEL_RADIUS_METERS}&limit=100`;
        const searchRes = await liteApiFetch(geoUrl, {
          headers: { "X-API-Key": liteApiKey, "Accept": "application/json" }
        }, routeSignal);
        const searchData = await searchRes.json();
        candidateHotels = searchData.data || searchData.hotels || [];
        setTimedCache(hotelListCache, listCacheKey, candidateHotels);
      }
      {
        candidatesCount = candidateHotels.length;

        if (candidateHotels.length > 0) {
          // Score and bucket all 100 candidates based on location, quality, and itinerary proximity
          const enrichedCandidates = candidateHotels.map((h: LiteApiHotelRaw) => {
            const distCenter = calculateHaversineDistance(centerLat, centerLng, h.latitude, h.longitude);
            let itineraryDist = distCenter;
            if (itineraryPlaces.length > 0) {
              const minDist = Math.min(...itineraryPlaces.map((p) => calculateHaversineDistance(p.lat, p.lng, h.latitude, h.longitude)));
              itineraryDist = minDist;
            }
            const starRating = (h as { rating?: number; stars?: number }).rating || (h as { rating?: number; stars?: number }).stars || 3;
            const hasPhoto = Boolean((h as { main_photo?: string; photo?: string }).main_photo || (h as { main_photo?: string; photo?: string }).photo);
            const listScore = Math.max(0, 100 - itineraryDist * 5 - distCenter * 3) * 0.6 + (starRating * 15) + (hasPhoto ? 10 : 0);
            return { ...h, distCenter, itineraryDist, starRating, hasPhoto, listScore };
          });

          // Diversified Bucketing: Itinerary proximity, City Center access, Quality/Stars, Value
          const bucketItinerary = [...enrichedCandidates].sort((a, b) => a.itineraryDist - b.itineraryDist);
          const bucketCenter = [...enrichedCandidates].sort((a, b) => a.distCenter - b.distCenter);
          const bucketQuality = [...enrichedCandidates].sort((a, b) => b.starRating - a.starRating || b.listScore - a.listScore);
          const bucketBalanced = [...enrichedCandidates].sort((a, b) => b.listScore - a.listScore);

          // Round-robin selection across buckets up to 35 candidates
          const selectedCandidates: typeof enrichedCandidates = [];
          const seenIds = new Set<string>();

          const addCandidate = (cand?: typeof enrichedCandidates[0]) => {
            if (!cand) return;
            const pId = String(cand.id || cand.hotelId);
            if (!seenIds.has(pId)) {
              seenIds.add(pId);
              selectedCandidates.push(cand);
            }
          };

          const maxLen = Math.max(bucketItinerary.length, bucketCenter.length, bucketQuality.length, bucketBalanced.length);
          for (let i = 0; i < maxLen && selectedCandidates.length < 35; i++) {
            if (travelStyle === "premium") {
              addCandidate(bucketQuality[i]);
              addCandidate(bucketItinerary[i]);
              addCandidate(bucketCenter[i]);
              addCandidate(bucketBalanced[i]);
            } else if (travelStyle === "budget") {
              addCandidate(bucketBalanced[i]);
              addCandidate(bucketItinerary[i]);
              addCandidate(bucketCenter[i]);
              addCandidate(bucketQuality[i]);
            } else {
              addCandidate(bucketItinerary[i]);
              addCandidate(bucketBalanced[i]);
              addCandidate(bucketCenter[i]);
              addCandidate(bucketQuality[i]);
            }
          }

          // Stepwise Rates Query: Step 1 (15 candidates). Step 2 (+10 candidates if budget-matched < 3)
          const step1Candidates = selectedCandidates.slice(0, 15);
          ratesRequestedCount = step1Candidates.length;

          const fetchRatesBatch = async (batch: typeof selectedCandidates) => {
            const candidateIds = batch.map((h) => String(h.id || h.hotelId));
            const cacheKey = `rates_${city}_${checkIn}_${checkOut}_${adults}_${rooms}_${currency}_${lodgingBudgetThreshold}_${travelStyle}_${candidateIds.join(",")}`;
            let rates = getCachedRates(cacheKey);
            if (rates) {
              cacheHit = true;
              return rates;
            }

            const occupancies = Array.from({ length: rooms }, (_, index) => ({
              adults: index === 0 ? adults - rooms + 1 : 1,
              childrenAges: [] as number[],
            }));
            const ratesRes = await liteApiFetch("https://api.liteapi.travel/v3.0/hotels/rates", {
              method: "POST",
              headers: {
                "X-API-Key": liteApiKey,
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                hotelIds: candidateIds,
                checkIn,
                checkOut,
                occupancies,
                currency,
                guestNationality: "KR"
              })
            }, routeSignal);
            const ratesData: { data?: LiteApiRateRaw[] } = await ratesRes.json();
            rates = ratesData.data || [];
            setCachedRates(cacheKey, rates);
            return rates;
          };

          let allRates: LiteApiRateRaw[] = await fetchRatesBatch(step1Candidates);

          // Evaluate Step 1 price results
          const evalCandidates = (cands: typeof selectedCandidates, rates: LiteApiRateRaw[]) => {
            return cands.map((cand) => {
              const pId = String(cand.id || cand.hotelId);
              const rateMatch = rates.find((r) => String(r.hotelId || r.id) === pId);
              const roomType = rateMatch?.roomTypes?.[0] || rateMatch?.offers?.[0];
              const rateInfo = roomType?.rates?.[0];
              const price = roomType && rateInfo ? parseNormalizedPrice(roomType, rateInfo) : null;
              const payableTotal = price?.payableTotal ?? null;
              if (!rateMatch || payableTotal === null || price === null) return null;

              const provScore = computeTripScoreAndReasons(
                cand.latitude,
                cand.longitude,
                cand.distCenter,
                price,
                null,
                normalizeHotelAddress(cand.address),
                lodgingBudgetThreshold,
                travelStyle,
                itineraryPlaces,
                transitMode
              ).tripScore;

              return { candidate: cand, rateMatch, payableTotal, provScore };
            }).filter((item): item is NonNullable<typeof item> => item !== null);
          };

          let scoredCandidates = evalCandidates(step1Candidates, allRates);
          let budgetMatchedCount = scoredCandidates.filter((c) => c.payableTotal <= lodgingBudgetThreshold).length;

          // Step 2 Extension: If fewer than 3 budget-matched candidates, fetch Rates for next 10 candidates
          if (budgetMatchedCount < 3 && selectedCandidates.length > 15) {
            const step2Candidates = selectedCandidates.slice(15, 25);
            ratesRequestedCount += step2Candidates.length;
            const step2Rates = await fetchRatesBatch(step2Candidates);
            allRates = [...allRates, ...step2Rates];
            scoredCandidates = evalCandidates(selectedCandidates.slice(0, 25), allRates);
          }

          if (scoredCandidates.length > 0) {
            // Tier 1: Within Budget
            const withinBudget = scoredCandidates
              .filter((item) => item.payableTotal <= lodgingBudgetThreshold)
              .sort((a, b) => b.provScore - a.provScore || a.candidate.distCenter - b.candidate.distCenter);

            // Tier 2: Close to Budget (<= 30% excess)
            const closeToBudget = scoredCandidates
              .filter((item) => item.payableTotal > lodgingBudgetThreshold && item.payableTotal <= lodgingBudgetThreshold * 1.3)
              .sort((a, b) => {
                const ratioA = (a.payableTotal - lodgingBudgetThreshold) / lodgingBudgetThreshold;
                const ratioB = (b.payableTotal - lodgingBudgetThreshold) / lodgingBudgetThreshold;
                if (Math.abs(ratioA - ratioB) > 0.05) return ratioA - ratioB;
                return b.provScore - a.provScore;
              });

            // Tier 3: Over Budget
            const overBudget = scoredCandidates
              .filter((item) => item.payableTotal > lodgingBudgetThreshold * 1.3)
              .sort((a, b) => {
                const ratioA = (a.payableTotal - lodgingBudgetThreshold) / lodgingBudgetThreshold;
                const ratioB = (b.payableTotal - lodgingBudgetThreshold) / lodgingBudgetThreshold;
                if (Math.abs(ratioA - ratioB) > 0.05) return ratioA - ratioB;
                return b.provScore - a.provScore;
              });

            // Combine up to 15 candidates for UI + multi-batch load more
            const finalCandidates = [...withinBudget, ...closeToBudget, ...overBudget].slice(0, 15);

            const detailCandidates = finalCandidates.slice(0, HOTEL_DETAIL_LIMIT);
            detailRequestedCount = detailCandidates.length;
            const detailEntries = await Promise.all(detailCandidates.map(async ({ candidate, rateMatch }) => {
              const providerHotelId = String(candidate.id || candidate.hotelId);
              const result = await fetchHotelDetail(providerHotelId, liteApiKey, routeSignal);
              return { candidate, rateMatch, detail: result.detail };
            }));
            detailCompletedCount = detailEntries.filter((entry) => entry.detail !== null).length;
            detailSkippedCount = detailRequestedCount - detailCompletedCount;
            const offerContext: HotelOfferContext = { city, checkIn, checkOut, adults, rooms, lodgingBudgetThreshold, travelStyle, itineraryPlaces, transitMode, centerLat, centerLng };
            const offers = detailEntries.map(({ candidate, rateMatch, detail }) => detail
              ? buildHotelOffer(candidate, rateMatch, detail, offerContext)
              : null);
            liteApiHotels.push(...offers.filter((offer): offer is HotelOffer => offer !== null));

            const deferredCandidates = finalCandidates.slice(HOTEL_DETAIL_LIMIT).map(({ candidate, rateMatch }) => ({ candidate, rate: rateMatch }));
            if (deferredCandidates.length > 0) {
              removeExpiredDeferredHotelLookups();
              hotelDetailLookupId = crypto.randomUUID();
              deferredHotelLookups.set(hotelDetailLookupId, {
                createdAt: Date.now(),
                nextIndex: 0,
                candidates: deferredCandidates,
                context: offerContext,
                inFlight: null,
              });
              hasMoreHotels = true;
            }
          }
        }
      }
    } catch (error: unknown) {
      if (error instanceof ApiHttpError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`[LiteAPI Recommendation Error]: ${message}`);
    }
  }

  // Separate into Budget-Matched vs Budget-Exceeded
  const budgetMatchedHotels = liteApiHotels
    .filter((h) => h.price.payableTotal !== null && h.price.payableTotal <= lodgingBudgetThreshold)
    .sort((a, b) => b.tripScore - a.tripScore);

  const budgetExceededHotels = liteApiHotels
    .filter((h) => h.price.payableTotal !== null && h.price.payableTotal > lodgingBudgetThreshold)
    .sort((a, b) => {
      const ratioA = ((a.price.payableTotal || 0) - lodgingBudgetThreshold) / lodgingBudgetThreshold;
      const ratioB = ((b.price.payableTotal || 0) - lodgingBudgetThreshold) / lodgingBudgetThreshold;
      if (Math.abs(ratioA - ratioB) > 0.05) return ratioA - ratioB;
      return b.tripScore - a.tripScore;
    });

  liteApiHotels.sort((a, b) => b.tripScore - a.tripScore);

  // 2. Fetch OSM Locations for Map / Attraction Context
  const queryData = `[out:json][timeout:15];nwr["tourism"~"hotel|hostel|guest_house|apartment"](around:7000,${centerLat},${centerLng});out center tags 20;`;
  const overpassEndpoints = [
    `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(queryData)}`,
    `https://overpass.kumi.systems/api/interpreter?data=${encodeURIComponent(queryData)}`
  ];

  let rawOsmElements: OsmElementRaw[] = [];
  let osmStatus: "AVAILABLE" | "UNAVAILABLE" = "UNAVAILABLE";
  for (const endpointUrl of overpassEndpoints) {
    try {
      const osmSignal = routeSignal
        ? AbortSignal.any([routeSignal, AbortSignal.timeout(OSM_REQUEST_TIMEOUT_MS)])
        : AbortSignal.timeout(OSM_REQUEST_TIMEOUT_MS);
      const response = await fetchWithTimeout(endpointUrl, {
        headers: { "User-Agent": "EyriaTravelApp/1.0" },
        next: { revalidate: 1800 }
      }, osmSignal);
      if (!response.ok) throw providerErrorFromStatus(response.status, "OpenStreetMap");
      if (response.ok) {
        const data = await response.json();
        if (data.elements) {
          rawOsmElements = data.elements;
          osmStatus = "AVAILABLE";
          break;
        }
      }
    } catch (error) {
      console.warn("[Hotel OSM skipped]", JSON.stringify({ providerStage: "OSM", error: error instanceof Error ? error.message : String(error) }));
    }
  }

  const osmLocations: HotelLocation[] = rawOsmElements
    .map((item) => {
      const tags = item.tags || {};
      const rawName = tags["name:ko"] || tags.name || tags["name:en"] || "";
      if (!rawName) return null;

      const itemLat = item.type === "node" ? item.lat : item.center?.lat;
      const itemLon = item.type === "node" ? item.lon : item.center?.lon;
      if (!itemLat || !itemLon) return null;

      return {
        sourceId: `osm-${item.type}-${item.id}`,
        name: rawName.trim(),
        address: tags["addr:full"] || tags["addr:street"] || null,
        latitude: itemLat,
        longitude: itemLon,
        website: tags.website || null,
        source: "OpenStreetMap" as const,
      };
    })
    .filter((loc): loc is HotelLocation => loc !== null);

  const budgetEstimate = cityBudgetEstimatesMap[city] || {
    cityName: city,
    budgetRangeText: `1박 약 ₩80,000 ~ ₩350,000 (${city} 평균 범위)`,
    standardNightlyRange: "₩80,000 ~ ₩160,000 (실속형)",
    premiumNightlyRange: "₩180,000 ~ ₩400,000 (고급/중심가)",
    disclaimer: `본 예산 범위는 ${city} 지역 숙박 평균 지출 기준 참고용 예상치(Estimate)이며, 특정 날짜의 실시간 가격은 외부 사이트 조회가 필요합니다.`
  };

  const responseTimeMs = Date.now() - startTime;

  return {
    success: true,
    city,
    checkIn,
    checkOut,
    adults,
    travelStyle,
    priceApiProvider: "LiteAPI Sandbox",
    priceApiStatus: liteApiHotels.length === 0 ? "NO_HOTELS_FOUND" : "LITEAPI_SANDBOX_KEY_CONFIGURED",
    priceApiMessage: hasLiteApiKey
      ? "LiteAPI Sandbox API Key가 정상 연동되어 AI Travel Style Trip Score 요금을 수신합니다."
      : "LiteAPI Sandbox API Key가 미설정되어 개별 호텔 가격 조회가 제공되지 않으며, 가짜 가격을 생성하지 않습니다.",
    budgetEstimate,
    candidatesCount,
    ratesRequestedCount,
    budgetMatchedCount: budgetMatchedHotels.length,
    budgetExceededCount: budgetExceededHotels.length,
    finalRecommendationCount: liteApiHotels.length,
    cacheHit,
    responseTimeMs,
    providerDiagnostics: {
      lastSuccessfulStage: detailCompletedCount > 0 ? "DETAIL" : ratesRequestedCount > 0 ? "RATES" : candidatesCount > 0 ? "LIST" : "NONE",
      detailRequestedCount,
      detailCompletedCount,
      detailSkippedCount,
      osmStatus,
    },
    hotelDetailLookupId,
    hasMoreHotels,
    liteApiHotels,
    budgetMatchedHotels: budgetMatchedHotels.slice(0, 4),
    budgetExceededHotels: budgetExceededHotels.slice(0, 3),
    osmLocations,
  };
}

async function handleHotelSearch(
  city: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  rooms: number,
  currency: string,
  lodgingBudgetThreshold = 600000,
  travelStyle: TravelStyle = "standard",
  itineraryPlaces: Array<{ name: string; lat: number; lng: number; day?: number }> = [],
  transitMode: "transit" | "walk" | "drive" = "transit",
  routeSignal?: AbortSignal
) {
  const key = JSON.stringify({ city, checkIn, checkOut, adults, rooms, currency, lodgingBudgetThreshold, travelStyle, itineraryPlaces, transitMode });
  const existing = hotelSearchInFlight.get(key);
  if (existing) return existing;
  const request = executeHotelSearch(city, checkIn, checkOut, adults, rooms, currency, lodgingBudgetThreshold, travelStyle, itineraryPlaces, transitMode, routeSignal);
  hotelSearchInFlight.set(key, request);
  try {
    return await request;
  } finally {
    hotelSearchInFlight.delete(key);
  }
}

async function loadDeferredHotelDetails(lookupId: string, routeSignal?: AbortSignal): Promise<DeferredHotelLookupResult> {
  removeExpiredDeferredHotelLookups();
  const entry = deferredHotelLookups.get(lookupId);
  if (!entry) throw new ApiHttpError(410, "LOOKUP_EXPIRED", "추가 숙소 조회 정보가 만료되었습니다. 숙소를 다시 조회해주세요.");
  if (entry.inFlight) return entry.inFlight;

  const request = (async () => {
    const liteApiKey = process.env.LITEAPI_SANDBOX_KEY || process.env.LITEAPI_API_KEY || "";
    if (!liteApiKey) throw new ApiHttpError(503, "UNAVAILABLE", "LiteAPI 환경변수가 설정되지 않았습니다.");
    const batch = entry.candidates.slice(entry.nextIndex, entry.nextIndex + HOTEL_DEFERRED_BATCH_LIMIT);
    entry.nextIndex += batch.length;
    let externalDetailCallCount = 0;
    let detailCacheHitCount = 0;
    const results = await Promise.all(batch.map(async ({ candidate, rate }) => {
      const providerHotelId = String(candidate.id || candidate.hotelId || "");
      const detailResult = await fetchHotelDetail(providerHotelId, liteApiKey, routeSignal);
      if (detailResult.externalCall) externalDetailCallCount += 1;
      if (detailResult.cacheHit) detailCacheHitCount += 1;
      return detailResult.detail ? buildHotelOffer(candidate, rate, detailResult.detail, entry.context) : null;
    }));
    const hasMoreHotels = entry.nextIndex < entry.candidates.length;
    if (!hasMoreHotels) deferredHotelLookups.delete(lookupId);
    return {
      success: true as const,
      hotels: results.filter((hotel): hotel is HotelOffer => hotel !== null),
      hasMoreHotels,
      attemptedCount: batch.length,
      externalDetailCallCount,
      detailCacheHitCount,
    };
  })();

  entry.inFlight = request;
  try {
    return await request;
  } finally {
    const current = deferredHotelLookups.get(lookupId);
    if (current) current.inFlight = null;
  }
}

export function resetHotelSearchRuntimeForTests() {
  ratesCache.clear();
  hotelListCache.clear();
  hotelDetailCache.clear();
  hotelSearchInFlight.clear();
  deferredHotelLookups.clear();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get("cityId") || searchParams.get("city") || "";
  const checkIn = searchParams.get("checkIn") || "";
  const checkOut = searchParams.get("checkOut") || "";
  const adultsParam = searchParams.get("guests") || searchParams.get("adults");
  const adults = adultsParam ? parseInt(adultsParam, 10) : 2;
  const rooms = searchParams.get("rooms") ? parseInt(searchParams.get("rooms")!, 10) : 1;
  const currency = searchParams.get("currency") || "KRW";
  const budget = searchParams.get("budget") ? Number(searchParams.get("budget")) : 600000;
  const styleParam = (searchParams.get("travelStyle") || "standard") as TravelStyle;

  if (!searchParams.get("city") && !searchParams.get("cityId")) {
    return NextResponse.json({ success: false, providerStatus: "INVALID_INPUT", message: "도시가 필요합니다." }, { status: 400 });
  }
  const requestedCity = searchParams.get("cityId") || searchParams.get("city") || city;
  const inputError = validateHotelInput({ cityId: requestedCity, checkIn, checkOut, guests: adults, rooms, budget });
  if (inputError) return NextResponse.json({ success: false, providerStatus: "INVALID_INPUT", message: inputError }, { status: 400 });
  if (rooms > adults || !/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ success: false, providerStatus: "INVALID_INPUT", message: "객실 수와 통화를 확인해주세요." }, { status: 400 });
  try {
    const result = await handleHotelSearch(requestedCity, checkIn, checkOut, adults, rooms, currency, budget, styleParam, [], "transit", AbortSignal.timeout(ROUTE_DEADLINE_MS));
    return NextResponse.json(result);
  } catch (error) {
    const mapped = apiErrorResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body?.operation === "loadMoreDetails") {
      if (typeof body.lookupId !== "string" || !/^[0-9a-f-]{36}$/i.test(body.lookupId)) {
        return NextResponse.json({ success: false, providerStatus: "INVALID_INPUT", message: "추가 숙소 조회 정보가 올바르지 않습니다." }, { status: 400 });
      }
      const result = await loadDeferredHotelDetails(body.lookupId, AbortSignal.timeout(ROUTE_DEADLINE_MS));
      return NextResponse.json(result);
    }
    const requestedCity = body.cityId || body.city || "";
    const checkIn = body.checkIn || "";
    const checkOut = body.checkOut || "";
    const adults = body.adults ?? body.guests ?? 2;
    const rooms = body.rooms ?? 1;
    const currency = body.currency ?? "KRW";
    const lodgingBudget = body.lodgingBudget ?? body.budget ?? 600000;
    const travelStyle: TravelStyle = body.travelStyle || "standard";
    const itineraryPlaces = body.itineraryPlaces || [];
    const transitMode = body.transitMode || "transit";

    console.info("[Hotel search request]", JSON.stringify({ cityId: requestedCity, checkIn, checkOut, adults, rooms, currency }));

    const inputError = validateHotelInput({ cityId: requestedCity, checkIn, checkOut, guests: adults, rooms, budget: lodgingBudget });
    if (inputError) return NextResponse.json({ success: false, providerStatus: "INVALID_INPUT", message: inputError }, { status: 400 });
    if (rooms > adults || typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) return NextResponse.json({ success: false, providerStatus: "INVALID_INPUT", message: "객실 수와 통화를 확인해주세요." }, { status: 400 });
    const result = await handleHotelSearch(requestedCity, checkIn, checkOut, adults, rooms, currency, lodgingBudget, travelStyle, itineraryPlaces, transitMode, AbortSignal.timeout(ROUTE_DEADLINE_MS));
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("[Hotel search error]", error instanceof Error ? error.stack || error.message : String(error));
    const mapped = apiErrorResponse(error);
    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}
