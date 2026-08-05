import test from "node:test";
import assert from "node:assert/strict";
import { calculateTravelBudgetSummary } from "../utils/packageBudgetEngine.ts";
import { fetchExchangeRate } from "../utils/exchangeRate.ts";

const mockFlightUSD = {
  providerOfferId: "flight_usd_123",
  ownerAirlineName: "Duffel Airways",
  ownerAirlineCode: "ZZ",
  airlineLogoUrl: null,
  outbound: {
    originAirport: "ICN",
    destinationAirport: "FUK",
    departureTime: "09:00",
    arrivalTime: "10:30",
    durationText: "1h 30m",
    durationMinutes: 90,
    isDirect: true,
    segments: [],
  },
  inbound: {
    originAirport: "FUK",
    destinationAirport: "ICN",
    departureTime: "11:00",
    arrivalTime: "12:30",
    durationText: "1h 30m",
    durationMinutes: 90,
    isDirect: true,
    segments: [],
  },
  baggageInfo: [],
  price: {
    payableTotal: 384.9,
    currency: "USD",
    taxStatus: "included",
    sourcePaths: {},
  },
  partyPrice: {
    passengerCount: 2,
    totalTripPrice: 384.9,
    averagePerPassenger: 192.45,
    currency: "USD",
  },
  flightScore: 85,
  recommendationReasons: [],
  scoreBreakdown: { priceScore: 85, timeScore: 85, directScore: 100, baggageScore: 90, totalScore: 85 },
  expiresAt: null,
  provider: "Duffel",
  fetchedAt: "2026-08-05T00:00:00Z",
};

const mockFlightKRW = {
  ...mockFlightUSD,
  providerOfferId: "flight_krw_123",
  price: {
    payableTotal: 500000,
    currency: "KRW",
    taxStatus: "included",
    sourcePaths: {},
  },
  partyPrice: {
    passengerCount: 2,
    totalTripPrice: 500000,
    averagePerPassenger: 250000,
    currency: "KRW",
  },
};

const mockHotelKRW = {
  providerHotelId: "hotel_krw_123",
  hotelName: "Fukuoka Grand Hotel",
  address: "Fukuoka, Japan",
  latitude: 33.59,
  longitude: 130.40,
  city: "후쿠오카",
  checkIn: "2026-09-10",
  checkOut: "2026-09-13",
  adults: 2,
  price: {
    payableTotal: 1325332,
    currency: "KRW",
    source: "LiteAPI",
  },
  starRating: 4,
  reviewScore: 8.8,
  reviewCount: 150,
  heroImage: null,
  amenities: [],
  distanceFromCenterKm: 1.2,
};

test("KRW + KRW calculates normal numeric sum", () => {
  const summary = calculateTravelBudgetSummary(2000000, 2, mockFlightKRW, mockHotelKRW, 3);
  assert.equal(summary.isTotalAvailable, true);
  assert.equal(summary.currencyMismatch, false);
  assert.equal(summary.conversionPending, false);
  assert.equal(summary.committedTotal, 1825332);
  assert.equal(summary.currency, "KRW");
  assert.notEqual(summary.estimatedGrandTotal, null);
  assert.ok((summary.estimatedGrandTotal ?? 0) > 0);
});

test("USD + KRW without exchange rate sets unavailable state and NEVER 0", () => {
  const summary = calculateTravelBudgetSummary(2000000, 2, mockFlightUSD, mockHotelKRW, 3, null);
  assert.equal(summary.isTotalAvailable, false);
  assert.equal(summary.currencyMismatch, true);
  assert.equal(summary.conversionPending, true);
  assert.equal(summary.committedTotal, null);
  assert.equal(summary.estimatedGrandTotal, null);
  assert.equal(summary.remainingBudget, null);
  assert.notEqual(summary.committedTotal, 0);
  assert.notEqual(summary.estimatedGrandTotal, 0);
  assert.equal(summary.budgetStatus, "currency_mismatch");
  assert.equal(summary.statusMessage, "환율 확인 필요");
  assert.ok(summary.currencyMismatchMessage?.includes("통화 변환 후 총액이 계산됩니다"));
});

test("USD + KRW with valid exchange rate converts USD to KRW and calculates total", () => {
  const exchangeRateInfo = {
    rate: 1350,
    source: "Open Exchange Rates API",
    timestamp: "2026-08-05T00:00:00Z",
    baseCurrency: "USD",
    targetCurrency: "KRW",
  };

  const summary = calculateTravelBudgetSummary(3000000, 2, mockFlightUSD, mockHotelKRW, 3, exchangeRateInfo);
  assert.equal(summary.isTotalAvailable, true);
  assert.equal(summary.currencyMismatch, true);
  assert.equal(summary.conversionPending, false);
  const expectedFlightKRW = Math.round(384.9 * 1350); // 519615
  assert.equal(summary.committedTotal, expectedFlightKRW + 1325332);
  assert.equal(summary.currency, "KRW");
  assert.notEqual(summary.estimatedGrandTotal, null);
});

test("fetchExchangeRate handles same currency and invalid pairs cleanly", async () => {
  const same = await fetchExchangeRate("KRW", "KRW");
  assert.equal(same?.rate, 1);
  assert.equal(same?.baseCurrency, "KRW");
});
