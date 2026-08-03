import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { isSelectableRoundTrip, selectFlightSeller } from "../utils/flightSelection.ts";
import { createBookingSnapshot, readBookingSnapshot } from "../utils/bookingSnapshot.ts";
import { getHotelBookingLinkLabel, normalizeFlightBookingOption } from "../utils/bookingLinks.ts";
import { calculateTravelBudgetSummary } from "../utils/packageBudgetEngine.ts";

const slice = (origin, destination) => ({
  originAirport: origin, destinationAirport: destination,
  departureDateText: "8월 10일", departureTime: "10:00",
  arrivalDateText: "8월 10일", arrivalTime: "12:00",
  durationMinutes: 120, durationText: "2시간", stopsCount: 0, isDirect: true,
  segments: [{ flightNumber: "OZ 100", originAirport: origin, destinationAirport: destination,
    departingAt: "2026-08-10 10:00", arrivingAt: "2026-08-10 12:00",
    departureDateText: "8월 10일", departureTimeText: "10:00", arrivalDateText: "8월 10일", arrivalTimeText: "12:00",
    arrivesNextDay: false, dayOffset: 0, marketingCarrierName: "Asiana", operatingCarrierName: "Asiana", airlineCode: "OZ", isCodeshare: false }],
  sliceBaggageText: "unknown",
});

const flight = {
  providerOfferId: "offer-1", ownerAirlineName: "Asiana", ownerAirlineCode: "OZ", airlineLogoUrl: null,
  outbound: slice("ICN", "HND"), inbound: slice("HND", "ICN"), baggageInfo: [],
  price: { baseFare: null, taxes: null, surcharges: null, baggageFee: null, payableTotal: 700000, currency: "KRW", taxStatus: "unknown", sourcePaths: { baseFare: null, taxes: null, payableTotal: "return.price" } },
  partyPrice: { passengerCount: 2, totalTripPrice: 700000, averagePerPassenger: 350000, currency: "KRW", averagePerPassengerDerived: true },
  flightScore: 80, recommendationReasons: [], scoreBreakdown: { priceScore: 80, timeScore: 80, directScore: 100, baggageScore: 70, totalScore: 80 },
  expiresAt: null, bookingUrl: null, bookingOptions: [], provider: "SerpAPI Google Flights", fetchedAt: "2026-08-03T00:00:00.000Z",
};

const hotel = {
  providerHotelId: "hotel-1", hotelName: "Real Hotel", city: "도쿄", countryCode: "JP", address: null,
  latitude: 35, longitude: 139, checkIn: "2026-08-10", checkOut: "2026-08-13", adults: 2, rooms: 1,
  available: true, roomName: "Room", price: { basePrice: 300000, includedTaxAmount: 0, excludedTaxAmount: 0, feeAmount: 0, payableOnline: null, payableAtHotel: null, payableTotal: 300000, currency: "KRW", taxStatus: "included", paymentTiming: "unknown", sourcePaths: { basePrice: "rate", includedTaxAmount: null, excludedTaxAmount: null, payableTotal: "rate" } },
  imageUrl: null, bookingUrl: "https://www.booking.com/searchresults.html", bookingLinkType: "external_search",
  provider: "LiteAPI", environment: "sandbox", fetchedAt: "2026-08-03T00:00:00.000Z", derivedNightlyPrice: true,
  distanceFromCenterKm: 1, destinationMatched: true, travelStyle: "standard", tripScore: 80, tripScoreGrade: "A (Very Good)",
  avgItineraryDistanceKm: 1, avgItineraryTimeMinutes: 10, transitMode: "transit", recommendationReasons: [],
  scoreBreakdown: { itineraryDistScore: 80, budgetMatchScore: 80, cityAccessScore: 80, detailQualityScore: 80, totalScore: 80, grade: "A (Very Good)" },
};

const makeSnapshot = (selectedFlight = flight) => {
  const budgetSummary = calculateTravelBudgetSummary(1500000, 2, selectedFlight, hotel, 3);
  return createBookingSnapshot({ draftId: "draft-1", destinationId: "도쿄", checkIn: "2026-08-10", checkOut: "2026-08-13", passengerCount: 2, selectedFlight, selectedHotel: hotel, budgetSummary, packageId: "pkg_offer-1_hotel-1" });
};

test("Step 2 실패/빈 결과처럼 inbound가 없으면 왕복 offer는 선택 불가이고 snapshot도 생성되지 않는다", () => {
  const incomplete = { ...flight, inbound: null };
  assert.equal(isSelectableRoundTrip(incomplete), false);
  assert.equal(makeSnapshot(incomplete), null);
  const route = fs.readFileSync(new URL("../app/api/booking/flights/route.ts", import.meta.url), "utf8");
  assert.equal(route.includes("`${ownerAirlineCode} 102`"), false);
  assert.match(route, /if \(!inboundSlice \|\| inboundSlice\.segments\.length === 0\) continue/);
});

test("Summary snapshot이 없거나 다른 draftId이면 거부하고 데모 fallback이 없다", () => {
  const storage = { getItem: () => null };
  assert.equal(readBookingSnapshot(storage, "draft-1"), null);
  const snapshot = makeSnapshot();
  const otherStorage = { getItem: () => JSON.stringify(snapshot) };
  assert.equal(readBookingSnapshot(otherStorage, "draft-2"), null);
  const source = fs.readFileSync(new URL("../app/summary/page.tsx", import.meta.url), "utf8");
  assert.equal(source.includes("generateItinerary"), false);
  assert.equal(source.includes("readSavedTrips"), false);
  assert.match(source, /확정된 여행 정보가 없습니다/);
});

test("판매처 가격 변경은 기존 FlightOffer를 mutate하지 않고 Summary 총액에 반영된다", () => {
  const option = { sellerId: "seller-1", seller: "Seller", price: 650000, currency: "KRW", url: null, bookingRequestMethod: "post_required" };
  const originalPrice = flight.price.payableTotal;
  const updated = selectFlightSeller(flight, option);
  assert.notEqual(updated, flight);
  assert.equal(flight.price.payableTotal, originalPrice);
  assert.equal(updated.price.payableTotal, 650000);
  assert.equal(updated.selectedSeller.sellerId, "seller-1");
  const snapshot = makeSnapshot(updated);
  assert.ok(snapshot);
  assert.equal(snapshot.budgetSummary.selectedFlightTotal, 650000);
  assert.equal(snapshot.budgetSummary.committedTotal, 950000);
});

test("post_data가 필요한 항공 옵션은 단순 GET 링크로 노출하지 않는다", () => {
  const option = normalizeFlightBookingOption({ together: { book_with: "Seller", price: 700000, booking_request: { url: "https://example.com", post_data: "secret" } } }, 0, 700000);
  assert.equal(option.bookingRequestMethod, "post_required");
  assert.equal(option.url, null);
});

test("Booking.com 링크는 LiteAPI 실제 예약 링크가 아니라 재검색 링크로 표시된다", () => {
  assert.equal(getHotelBookingLinkLabel(hotel), "Booking.com에서 다시 검색");
  assert.equal(hotel.bookingLinkType, "external_search");
});
