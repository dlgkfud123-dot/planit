import test from "node:test";
import assert from "node:assert/strict";
import { cities } from "../data/cities.ts";
import {
  CITY_AIRPORT_GROUPS,
  getCanonicalArrivalAirportCandidates,
  getCityAirportGroup,
} from "../data/airports.ts";
import { createFlightSearchCacheKey, GET as searchFlights } from "../app/api/booking/flights/route.ts";

const futureDate = (offset) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

const leg = (origin, destination, number) => ({
  departure_airport: { id: origin, time: `${futureDate(30)} 09:00` },
  arrival_airport: { id: destination, time: `${futureDate(30)} 11:00` },
  flight_number: number,
  airline: "Test Air",
  duration: 120,
});

test("현재 지원 도시 74개는 공항 그룹 registry에 정확히 한 번씩 등록된다", () => {
  assert.equal(cities.length, 74);
  assert.equal(CITY_AIRPORT_GROUPS.length, 74);
  for (const city of cities) {
    const matches = CITY_AIRPORT_GROUPS.filter((entry) => entry.cityNames.includes(city.name));
    assert.equal(matches.length, 1, `${city.name} registry 누락 또는 중복`);
  }
});

test("단일 공항 도시와 복수 공항 도시가 동일 배열 모델을 사용한다", () => {
  assert.deepEqual(getCityAirportGroup("후쿠오카")?.arrivalAirportCandidates, ["FUK"]);
  assert.deepEqual(getCityAirportGroup("도쿄")?.arrivalAirportCandidates, ["HND", "NRT"]);
  assert.deepEqual(getCityAirportGroup("뉴욕")?.arrivalAirportCandidates, ["JFK", "EWR", "LGA"]);
  assert.deepEqual(getCityAirportGroup("런던")?.arrivalAirportCandidates, ["LHR", "LGW", "STN", "LTN", "LCY"]);
});

test("공항 후보 순서가 달라도 canonical cache key는 동일하다", () => {
  assert.deepEqual(getCanonicalArrivalAirportCandidates("도쿄"), ["HND", "NRT"]);
  const first = createFlightSearchCacheKey(new URL(`http://localhost/api/booking/flights?city=도쿄&arrivalAirport=HND&checkIn=${futureDate(30)}&checkOut=${futureDate(34)}&adults=1&currency=KRW`));
  const second = createFlightSearchCacheKey(new URL(`http://localhost/api/booking/flights?currency=KRW&adults=1&checkOut=${futureDate(34)}&checkIn=${futureDate(30)}&arrivalAirport=NRT&city=도쿄`));
  assert.equal(first, second);
});

test("복수 도착 공항은 단일 Step 1 요청을 사용하고 실제 segment 공항과 서로 다른 귀국 공항을 보존한다", async () => {
  const originalKey = process.env.SERPAPI_API_KEY;
  const originalFetch = global.fetch;
  process.env.SERPAPI_API_KEY = "test-key";
  const calls = [];
  try {
    global.fetch = async (input) => {
      const url = new URL(String(input));
      calls.push(url);
      assert.equal(url.searchParams.get("arrival_id"), "HND,NRT");
      assert.equal(url.searchParams.get("sort_by"), "2");
      assert.equal(url.searchParams.has("booking_token"), false, "선택 전 Step 3 호출 금지");
      const token = url.searchParams.get("departure_token");
      if (token === "hnd-token") {
        return Response.json({ best_flights: [{ price: 700000, booking_token: "hnd-book", flights: [leg("HND", "ICN", "TA 201")] }], other_flights: [] });
      }
      if (token === "nrt-token") {
        return Response.json({ best_flights: [{ price: 600000, booking_token: "nrt-book", flights: [leg("HND", "ICN", "TA 202")] }], other_flights: [] });
      }
      return Response.json({
        best_flights: [
          { price: 700000, departure_token: "hnd-token", flights: [leg("ICN", "HND", "TA 101")] },
          { price: 600000, departure_token: "nrt-token", flights: [leg("ICN", "NRT", "TA 102")] },
        ],
        other_flights: [],
      });
    };
    const url = `http://localhost/api/booking/flights?city=도쿄&arrivalAirport=HND&departureAirport=ICN&checkIn=${futureDate(30)}&checkOut=${futureDate(34)}&adults=1&flightBudget=900000&currency=KRW&comparison=1&case=multi-arrival`;
    const response = await searchFlights(new Request(url));
    const data = await response.json();
    assert.equal(response.status, 200);
    assert.equal(calls.length, 3, "Step 1 1회 + Step 2 최대 2회");
    assert.deepEqual(data.offers.map((offer) => offer.outbound.destinationAirport).sort(), ["HND", "NRT"]);
    const openJaw = data.offers.find((offer) => offer.outbound.destinationAirport === "NRT");
    assert.equal(openJaw.inbound.originAirport, "HND");

  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalKey;
  }
});
