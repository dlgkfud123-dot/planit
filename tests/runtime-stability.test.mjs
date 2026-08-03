import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { validateFlightInput, validateHotelInput } from "../utils/bookingValidation.ts";
import { ApiHttpError, TIMEOUT_MESSAGE, fetchWithTimeout, providerErrorFromStatus } from "../utils/apiRuntime.ts";
import { calculateFlightTimeScore } from "../utils/flightRuntime.ts";
import { calculateAirportDistanceKm } from "../utils/packageBudgetEngine.ts";
import { GET as getFlights } from "../app/api/booking/flights/route.ts";
import { GET as getHotels, resetHotelSearchRuntimeForTests } from "../app/api/booking/hotels/route.ts";
import { resetLiteApiRuntimeForTests } from "../utils/liteApiRuntime.ts";

const readSource = (relativePath) => fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
const futureDates = { checkIn: "2099-08-10", checkOut: "2099-08-13" };

const flightInput = (overrides = {}) => ({
  departureAirport: "ICN",
  arrivalAirport: "HND",
  outboundDate: futureDates.checkIn,
  returnDate: futureDates.checkOut,
  adults: 1,
  travelClass: "1",
  currency: "KRW",
  ...overrides,
});

test("invalid dates and zero adults are rejected", () => {
  assert.ok(validateFlightInput(flightInput({ outboundDate: "not-a-date" })));
  assert.ok(validateFlightInput(flightInput({ adults: 0 })));
  assert.ok(validateHotelInput({ cityId: "후쿠오카", checkIn: "2099-08-13", checkOut: "2099-08-10", guests: 1, rooms: 1, budget: 1 }));
});

test("unknown city returns 400 without a Tokyo fallback", async () => {
  const response = await getHotels(new Request(`http://localhost/api/booking/hotels?city=unknown-city&checkIn=${futureDates.checkIn}&checkOut=${futureDates.checkOut}`));
  assert.equal(response.status, 400);
  assert.equal((await response.json()).providerStatus, "INVALID_INPUT");
});

test("provider status mapping distinguishes auth and rate limits for both providers", () => {
  for (const provider of ["SerpAPI", "LiteAPI"]) {
    const auth = providerErrorFromStatus(401, provider);
    assert.equal(auth.httpStatus, 502);
    assert.equal(auth.providerStatus, "AUTH_FAILED");
    const limited = providerErrorFromStatus(429, provider);
    assert.equal(limited.httpStatus, 429);
    assert.equal(limited.providerStatus, "RATE_LIMITED");
  }
});

test("provider timeout maps to HTTP 504 semantics", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, init) => new Promise((_resolve, reject) => {
    init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
  });
  try {
    await assert.rejects(fetchWithTimeout("https://provider.invalid", {}, undefined, 5), (error) => {
      assert.ok(error instanceof ApiHttpError);
      assert.equal(error.httpStatus, 504);
      assert.equal(error.providerStatus, "TIMEOUT");
      assert.equal(error.message, TIMEOUT_MESSAGE);
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("SerpAPI auth, rate-limit, and empty-result branches preserve HTTP semantics", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SERPAPI_API_KEY;
  process.env.SERPAPI_API_KEY = "test-key";
  const url = `http://localhost/api/booking/flights?city=도쿄&departureAirport=ICN&checkIn=${futureDates.checkIn}&checkOut=${futureDates.checkOut}&adults=1`;
  try {
    for (const [providerStatus, expectedStatus] of [[401, 502], [429, 429]]) {
      resetHotelSearchRuntimeForTests();
      resetLiteApiRuntimeForTests();
      globalThis.fetch = async () => new Response("{}", { status: providerStatus });
      const response = await getFlights(new Request(url));
      assert.equal(response.status, expectedStatus);
    }
    globalThis.fetch = async () => Response.json({ best_flights: [], other_flights: [] });
    const empty = await getFlights(new Request(url));
    const body = await empty.json();
    assert.equal(empty.status, 200);
    assert.deepEqual(body.offers, []);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalKey;
  }
});

test("SerpAPI malformed response is mapped to a provider error instead of HTTP 500", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SERPAPI_API_KEY;
  process.env.SERPAPI_API_KEY = "test-key";
  globalThis.fetch = async () => Response.json({ unexpected: true });
  try {
    const response = await getFlights(new Request(`http://localhost/api/booking/flights?city=도쿄&departureAirport=ICN&checkIn=${futureDates.checkIn}&checkOut=${futureDates.checkOut}&adults=1`));
    const body = await response.json();
    assert.equal(response.status, 502);
    assert.equal(body.providerStatus, "PROVIDER_ERROR");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalKey;
  }
});

test("provider transport failures are mapped to HTTP 502", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new TypeError("fetch failed", { cause: { code: "EACCES" } }); };
  try {
    await assert.rejects(fetchWithTimeout("https://provider.invalid"), (error) => {
      assert.ok(error instanceof ApiHttpError);
      assert.equal(error.httpStatus, 502);
      assert.equal(error.providerStatus, "PROVIDER_ERROR");
      return true;
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("LiteAPI auth, rate-limit, and empty-result branches preserve HTTP semantics", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.LITEAPI_SANDBOX_KEY;
  process.env.LITEAPI_SANDBOX_KEY = "test-key";
  const url = `http://localhost/api/booking/hotels?city=후쿠오카&checkIn=${futureDates.checkIn}&checkOut=${futureDates.checkOut}&guests=1&rooms=1`;
  try {
    for (const [providerStatus, expectedStatus] of [[401, 502], [429, 429]]) {
      globalThis.fetch = async () => new Response("{}", { status: providerStatus });
      const response = await getHotels(new Request(url));
      assert.equal(response.status, expectedStatus);
    }
    resetHotelSearchRuntimeForTests();
    resetLiteApiRuntimeForTests();
    globalThis.fetch = async () => Response.json({ data: [] });
    const empty = await getHotels(new Request(url));
    const body = await empty.json();
    assert.equal(empty.status, 200);
    assert.deepEqual(body.liteApiHotels, []);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.LITEAPI_SANDBOX_KEY;
    else process.env.LITEAPI_SANDBOX_KEY = originalKey;
  }
});

const abortingFetch = (_input, init) => new Promise((_resolve, reject) => {
  init.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")), { once: true });
});

test("SerpAPI timeout is returned as HTTP 504", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.SERPAPI_API_KEY;
  process.env.SERPAPI_API_KEY = "test-key";
  globalThis.fetch = abortingFetch;
  try {
    const response = await getFlights(new Request(`http://localhost/api/booking/flights?city=도쿄&departureAirport=ICN&checkIn=${futureDates.checkIn}&checkOut=${futureDates.checkOut}&adults=1`));
    const body = await response.json();
    assert.equal(response.status, 504);
    assert.equal(body.providerStatus, "TIMEOUT");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.SERPAPI_API_KEY;
    else process.env.SERPAPI_API_KEY = originalKey;
  }
});

test("LiteAPI timeout is returned as HTTP 504", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.LITEAPI_SANDBOX_KEY;
  resetHotelSearchRuntimeForTests();
  resetLiteApiRuntimeForTests();
  process.env.LITEAPI_SANDBOX_KEY = "test-key";
  globalThis.fetch = abortingFetch;
  try {
    const response = await getHotels(new Request(`http://localhost/api/booking/hotels?city=후쿠오카&checkIn=${futureDates.checkIn}&checkOut=${futureDates.checkOut}&guests=1&rooms=1`));
    const body = await response.json();
    assert.equal(response.status, 504);
    assert.equal(body.providerStatus, "TIMEOUT");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.LITEAPI_SANDBOX_KEY;
    else process.env.LITEAPI_SANDBOX_KEY = originalKey;
  }
});

const slice = (durationMinutes, stopsCount, departingAt, arrivingAt) => ({
  durationMinutes,
  stopsCount,
  segments: [{ departingAt, arrivingAt }],
});

test("timeScore changes with actual duration, layover, and stops and remains clamped", () => {
  const fast = calculateFlightTimeScore(
    slice(120, 0, "2099-08-10 09:00", "2099-08-10 11:00"),
    slice(120, 0, "2099-08-13 09:00", "2099-08-13 11:00")
  );
  const slow = calculateFlightTimeScore(
    slice(360, 1, "2099-08-10 09:00", "2099-08-10 17:00"),
    slice(360, 1, "2099-08-13 09:00", "2099-08-13 17:00")
  );
  assert.ok(fast > slow);
  assert.ok(slow >= 0 && fast <= 100);
});

test("airport distance uses coordinates and returns null when coordinates are unavailable", () => {
  assert.equal(calculateAirportDistanceKm(35.5494, 139.7798, "HND"), 0);
  assert.ok(calculateAirportDistanceKm(35.6762, 139.6503, "HND") > 0);
  assert.equal(calculateAirportDistanceKm(35.6762, 139.6503, "XXX"), null);
  assert.equal(calculateAirportDistanceKm(null, 139.6503, "HND"), null);
});

test("routes contain no synthetic fallback offers or hardcoded airport distances", () => {
  const flights = readSource("app/api/booking/flights/route.ts");
  const packages = readSource("utils/packageBudgetEngine.ts");
  assert.doesNotMatch(flights, /timeScore\s*=\s*85/);
  assert.doesNotMatch(flights, /airlineCode[^\n]*102/);
  assert.doesNotMatch(packages, /includes\([^\n]*haneda/i);
  assert.doesNotMatch(packages, /(?:1\.5|4\.5|18\.2)/);
});

test("Booking requires a validated draft and has no Tokyo, stale destination, or Duffel fallback", () => {
  const booking = readSource("components/booking/BookingApp.tsx");
  assert.doesNotMatch(booking, /sessionStorage\.getItem\(["']eyria:destination["']\)/);
  assert.doesNotMatch(booking, /readDraft\(\)/);
  assert.doesNotMatch(booking, /["']도쿄["']/);
  assert.doesNotMatch(booking, /Duffel/i);
  assert.match(booking, /여행 목적지 정보가 없습니다\. 일정 페이지에서 목적지를 다시 선택해주세요\./);
});

test("Booking renders empty/error messages and retry controls for both providers", () => {
  const booking = readSource("components/booking/BookingApp.tsx");
  assert.match(booking, /현재 조건에서 검색 가능한 항공편이 없습니다\./);
  assert.match(booking, /현재 조건에서 검색 가능한 숙소가 없습니다\./);
  assert.match(booking, /항공편 다시 조회/);
  assert.match(booking, /숙소 다시 조회/);
  assert.match(booking, /setFlightsError\(null\)/);
  assert.match(booking, /setHotelsError\(null\)/);
  assert.match(booking, /setFlightRetryKey\(\(key\) => key \+ 1\)/);
  assert.match(booking, /setHotelRetryKey\(\(key\) => key \+ 1\)/);
});
