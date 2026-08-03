import test from "node:test";
import assert from "node:assert/strict";
import { GET as compareAirports, mapFailureStatus } from "../app/api/booking/flights/compare/route.ts";

const futureDate = (offset) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const leg = (origin, destination, number, duration = 70) => ({
  departure_airport: { id: origin, time: `${futureDate(30)} 09:00` },
  arrival_airport: { id: destination, time: `${futureDate(30)} 10:10` },
  flight_number: number,
  airline: `Air ${origin}`,
  duration,
});

const urlFor = (suffix = "") => `http://localhost/api/booking/flights/compare?city=후쿠오카&arrivalAirport=FUK&checkIn=${futureDate(30)}&checkOut=${futureDate(34)}&adults=1&flightBudget=500000&currency=KRW${suffix}`;

test("timeout, rate limit, provider 오류는 항공편 없음과 구분한다", () => {
  assert.equal(mapFailureStatus(504, "TIMEOUT"), "TIMEOUT");
  assert.equal(mapFailureStatus(429, "RATE_LIMITED"), "RATE_LIMITED");
  assert.equal(mapFailureStatus(502, "AUTH_FAILED"), "PROVIDER_ERROR");
});

test("전국 공항 비교는 실제 완성 왕복만 가격순으로 유지하고 공항별 실패 상태를 구분한다", async () => {
  const originalKey = process.env.SERPAPI_API_KEY;
  const originalFetch = global.fetch;
  process.env.SERPAPI_API_KEY = "test-key";
  const calls = [];
  const prices = { ICN: 200000, GMP: 200000, PUS: 180000 };
  try {
    global.fetch = async (input) => {
      const url = new URL(String(input));
      calls.push(url);
      assert.equal(url.searchParams.has("booking_token"), false, "비교 중 Step 3를 호출하면 안 된다");
      const departure = url.searchParams.get("departure_id");
      if (departure === "TAE") {
        return Response.json({ error: "rate limited" }, { status: 429, headers: { "Retry-After": "2" } });
      }
      if (departure === "CJJ") return Response.json({ unexpected: true });
      if (departure === "CJU") return Response.json({ best_flights: [], other_flights: [] });
      const price = prices[departure];
      if (url.searchParams.has("departure_token")) {
        return Response.json({
          best_flights: [{
            price,
            booking_token: `${departure}-booking`,
            flights: [leg("FUK", departure, `${departure} 200`)],
          }],
          other_flights: [],
        });
      }
      const outboundFlights = departure === "PUS"
        ? [leg("PUS", "KIX", "PUS 100", 55), leg("KIX", "FUK", "PUS 101", 60)]
        : [leg(departure, "FUK", `${departure} 100`, departure === "GMP" ? 60 : 70)];
      return Response.json({
        search_metadata: { id: `${departure}-search` },
        best_flights: [{ price, departure_token: `${departure}-return`, flights: outboundFlights }],
        other_flights: [],
      });
    };

    const response = await compareAirports(new Request(urlFor("&case=availability")));
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(data.partial, true);
    assert.deepEqual(data.offers.map((offer) => offer.outbound.originAirport), ["PUS", "GMP", "ICN"]);
    assert.equal(data.results.find((result) => result.departureAirport === "PUS").status, "AVAILABLE_CONNECTING");
    assert.equal(data.results.find((result) => result.departureAirport === "ICN").status, "AVAILABLE_DIRECT");
    assert.equal(data.results.find((result) => result.departureAirport === "CJU").status, "NO_FLIGHTS_FOUND");
    assert.equal(data.results.find((result) => result.departureAirport === "CJJ").status, "PROVIDER_ERROR");
    assert.equal(data.results.find((result) => result.departureAirport === "TAE").status, "RATE_LIMITED");
    assert.equal(data.results.find((result) => result.departureAirport === "TAE").retryAfterSeconds, 2);
    assert.equal(calls.some((url) => url.searchParams.has("booking_token")), false);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalKey;
  }
});

test("동일 전국 비교 요청은 in-flight를 병합하고 완료 후 5분 캐시에서 외부 호출 0회를 유지한다", async () => {
  const originalKey = process.env.SERPAPI_API_KEY;
  const originalFetch = global.fetch;
  process.env.SERPAPI_API_KEY = "test-key";
  let calls = 0;
  try {
    global.fetch = async (input) => {
      calls += 1;
      const url = new URL(String(input));
      const departure = url.searchParams.get("departure_id");
      if (url.searchParams.has("departure_token")) {
        return Response.json({ best_flights: [{ price: 210000, flights: [leg("FUK", departure, `${departure} 200`)] }], other_flights: [] });
      }
      return Response.json({ best_flights: [{ price: 210000, departure_token: `${departure}-token`, flights: [leg(departure, "FUK", `${departure} 100`)] }], other_flights: [] });
    };
    const requestUrl = urlFor("&case=dedupe");
    const [first, concurrent] = await Promise.all([
      compareAirports(new Request(requestUrl)),
      compareAirports(new Request(requestUrl)),
    ]);
    const firstData = await first.json();
    const concurrentData = await concurrent.json();
    assert.equal(calls, 12, "6개 공항이 각각 Step 1/2 한 세트만 호출되어야 한다");
    assert.equal(firstData.offers.length, 6);
    assert.equal(concurrentData.offers.length, 6);
    const warm = await compareAirports(new Request(requestUrl));
    const warmData = await warm.json();
    assert.equal(calls, 12);
    assert.equal(warmData.cached, true);
    assert.equal(warmData.providerCallCount, 0);
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalKey;
  }
});

test("Booking과 Summary는 출발 공항 선택·비교·공항명 보존 UI를 포함한다", async () => {
  const fs = await import("node:fs/promises");
  const booking = await fs.readFile(new URL("../components/booking/BookingApp.tsx", import.meta.url), "utf8");
  const summary = await fs.readFile(new URL("../components/final-trip/FinalTripConfirmationCard.tsx", import.meta.url), "utf8");
  assert.match(booking, /특정 출발 공항 직접 선택/);
  assert.match(booking, /전국 주요 공항 최저가 비교/);
  assert.match(booking, /writeDraftById\(draftId, updated/);
  assert.match(summary, /getKoreaAirport\(bookingSnapshot\.departureAirport\)/);
});
