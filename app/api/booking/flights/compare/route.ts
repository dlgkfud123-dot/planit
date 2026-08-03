import { NextResponse } from "next/server.js";
import { DEFAULT_FLIGHT_COMPARISON_AIRPORTS, getKoreaAirport } from "../../../../../data/airports.ts";
import type { FlightOffer, FlightSearchResponse } from "../../../../../types/flight.ts";
import { GET as searchFlights } from "../route.ts";

type AirportAvailability =
  | "AVAILABLE_DIRECT"
  | "AVAILABLE_CONNECTING"
  | "NO_FLIGHTS_FOUND"
  | "PROVIDER_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED";

export type AirportComparisonResult = {
  departureAirport: string;
  departureAirportName: string;
  status: AirportAvailability;
  httpStatus: number;
  offer: FlightOffer | null;
  providerCallCount: number;
  retryAt?: string;
  retryAfterSeconds?: number;
};

type ComparisonResponse = {
  success: boolean;
  partial: boolean;
  status: "COMPLETED" | "PARTIAL" | "NO_FLIGHTS_FOUND" | "COMPARISON_FAILED";
  message: string;
  results: AirportComparisonResult[];
  offers: FlightOffer[];
  providerCallCount: number;
  cached: boolean;
  durationMs: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const comparisonCache = new Map<string, { expiresAt: number; value: ComparisonResponse }>();
const comparisonInFlight = new Map<string, Promise<ComparisonResponse>>();

const totalDuration = (offer: FlightOffer) =>
  offer.outbound.durationMinutes + (offer.inbound?.durationMinutes ?? Number.MAX_SAFE_INTEGER);

const totalStops = (offer: FlightOffer) =>
  offer.outbound.stopsCount + (offer.inbound?.stopsCount ?? Number.MAX_SAFE_INTEGER);

const isCompleteComparableOffer = (offer: FlightOffer, currency: string) =>
  offer.outbound.segments.length > 0 &&
  Boolean(offer.inbound && offer.inbound.segments.length > 0) &&
  offer.price.payableTotal !== null &&
  offer.price.currency.toUpperCase() === currency;

export const compareFlightOffers = (a: FlightOffer, b: FlightOffer) => {
  const priceDifference = (a.price.payableTotal ?? Number.MAX_SAFE_INTEGER) - (b.price.payableTotal ?? Number.MAX_SAFE_INTEGER);
  if (priceDifference !== 0) return priceDifference;
  const aDirect = a.outbound.isDirect && Boolean(a.inbound?.isDirect);
  const bDirect = b.outbound.isDirect && Boolean(b.inbound?.isDirect);
  if (aDirect !== bDirect) return aDirect ? -1 : 1;
  const durationDifference = totalDuration(a) - totalDuration(b);
  if (durationDifference !== 0) return durationDifference;
  return totalStops(a) - totalStops(b);
};

export const mapFailureStatus = (httpStatus: number, providerStatus?: string): AirportAvailability => {
  if (httpStatus === 504 || providerStatus === "TIMEOUT") return "TIMEOUT";
  if (httpStatus === 429 || providerStatus === "RATE_LIMITED") return "RATE_LIMITED";
  return "PROVIDER_ERROR";
};

async function mapWithConcurrency<T, R>(items: readonly T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

async function runComparison(requestUrl: URL, cacheKey: string): Promise<ComparisonResponse> {
  const startedAt = Date.now();
  const currency = (requestUrl.searchParams.get("currency") || "KRW").toUpperCase();
  const directOnly = requestUrl.searchParams.get("directOnly") === "true";
  const requestedAirports = (requestUrl.searchParams.get("airports") || "")
    .split(",")
    .map((iata) => iata.trim().toUpperCase())
    .filter((iata, index, values) => Boolean(getKoreaAirport(iata)) && values.indexOf(iata) === index);
  const airports: readonly string[] = requestedAirports.length > 0 ? requestedAirports.slice(0, 8) : DEFAULT_FLIGHT_COMPARISON_AIRPORTS;
  const results = await mapWithConcurrency(airports, 2, async (departureAirport): Promise<AirportComparisonResult> => {
    const airport = getKoreaAirport(departureAirport);
    const airportUrl = new URL(requestUrl);
    airportUrl.pathname = "/api/booking/flights";
    airportUrl.searchParams.delete("directOnly");
    airportUrl.searchParams.delete("airports");
    airportUrl.searchParams.set("departureAirport", departureAirport);
    airportUrl.searchParams.set("comparison", "1");
    const response = await searchFlights(new Request(airportUrl));
    const data = await response.json() as FlightSearchResponse & {
      providerStatus?: string;
      retryAt?: string;
      retryAfterSeconds?: number;
    };
    const comparable = (data.offers || [])
      .filter((offer) => isCompleteComparableOffer(offer, currency))
      .filter((offer) => !directOnly || (offer.outbound.isDirect && Boolean(offer.inbound?.isDirect)))
      .sort(compareFlightOffers);
    const best = comparable[0] ?? null;
    if (best) {
      const isDirect = best.outbound.isDirect && Boolean(best.inbound?.isDirect);
      return {
        departureAirport,
        departureAirportName: airport?.name || departureAirport,
        status: isDirect ? "AVAILABLE_DIRECT" : "AVAILABLE_CONNECTING",
        httpStatus: response.status,
        offer: best,
        providerCallCount: data.providerCallCount || 0,
      };
    }
    const successfulEmpty = response.ok && data.success;
    return {
      departureAirport,
      departureAirportName: airport?.name || departureAirport,
      status: successfulEmpty ? "NO_FLIGHTS_FOUND" : mapFailureStatus(response.status, data.providerStatus || data.flightApiStatus),
      httpStatus: response.status,
      offer: null,
      providerCallCount: data.providerCallCount || 0,
      retryAt: data.retryAt,
      retryAfterSeconds: data.retryAfterSeconds,
    };
  });

  const availableResults = results.filter((result) => result.offer !== null).sort((a, b) => compareFlightOffers(a.offer!, b.offer!));
  const offers = availableResults.map((result) => result.offer!);
  const orderedResults = [...availableResults, ...results.filter((result) => result.offer === null)];
  const unavailableCount = results.length - availableResults.length;
  const allEmpty = results.every((result) => result.status === "NO_FLIGHTS_FOUND");
  const allUnavailable = results.every((result) => ["PROVIDER_ERROR", "TIMEOUT", "RATE_LIMITED"].includes(result.status));
  const status = allEmpty ? "NO_FLIGHTS_FOUND" : allUnavailable ? "COMPARISON_FAILED" : unavailableCount > 0 ? "PARTIAL" : "COMPLETED";
  const message = allEmpty
    ? "현재 조건에서 검색 가능한 왕복 항공편이 없습니다."
    : allUnavailable
      ? "현재 항공편 비교를 완료하지 못했습니다."
      : unavailableCount > 0
        ? `정상 결과를 우선 표시합니다. ${unavailableCount}개 공항은 결과가 없거나 확인되지 않았습니다.`
        : "전국 주요 공항의 왕복 항공편 비교가 완료되었습니다.";
  const value: ComparisonResponse = {
    success: availableResults.length > 0,
    partial: availableResults.length > 0 && unavailableCount > 0,
    status,
    message,
    results: orderedResults,
    offers,
    providerCallCount: results.reduce((sum, result) => sum + result.providerCallCount, 0),
    cached: false,
    durationMs: Date.now() - startedAt,
  };
  const hasTransientFailure = results.some((result) => ["PROVIDER_ERROR", "TIMEOUT", "RATE_LIMITED"].includes(result.status));
  if (!hasTransientFailure) {
    comparisonCache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  }
  return value;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cacheKey = url.searchParams.toString();
  const cached = comparisonCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.value, cached: true, providerCallCount: 0, durationMs: 0 });
  }
  if (cached) comparisonCache.delete(cacheKey);
  let pending = comparisonInFlight.get(cacheKey);
  if (!pending) {
    pending = runComparison(url, cacheKey).finally(() => comparisonInFlight.delete(cacheKey));
    comparisonInFlight.set(cacheKey, pending);
  }
  try {
    return NextResponse.json(await pending);
  } catch {
    return NextResponse.json({
      success: false,
      partial: false,
      status: "COMPARISON_FAILED",
      message: "현재 항공편 비교를 완료하지 못했습니다.",
      results: [],
      offers: [],
      providerCallCount: 0,
      cached: false,
      durationMs: 0,
    } satisfies ComparisonResponse, { status: 502 });
  }
}
