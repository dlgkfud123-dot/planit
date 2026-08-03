import test from "node:test";
import assert from "node:assert/strict";
import { GET as getHotels, resetHotelSearchRuntimeForTests } from "../app/api/booking/hotels/route.ts";
import { LITEAPI_MIN_REQUEST_INTERVAL_MS, liteApiFetch, parseLiteApiRateLimit, resetLiteApiRuntimeForTests } from "../utils/liteApiRuntime.ts";

const originalFetch = globalThis.fetch;
const originalKey = process.env.LITEAPI_SANDBOX_KEY;
process.env.LITEAPI_SANDBOX_KEY = "test-key";

const hotelUrl = (overrides = {}) => {
  const params = new URLSearchParams({ city: "FUKUOKA", checkIn: "2099-08-10", checkOut: "2099-08-13", guests: "2", rooms: "1", currency: "KRW", ...overrides });
  return `http://localhost/api/booking/hotels?${params}`;
};

const candidates = Array.from({ length: 20 }, (_, index) => ({
  id: `hotel-${index + 1}`,
  name: `Hotel ${index + 1}`,
  latitude: 33.5902 + index * 0.001,
  longitude: 130.4017 + index * 0.001,
}));

const rates = candidates.slice(0, 10).map((hotel, index) => ({
  hotelId: hotel.id,
  roomTypes: [{
    name: "Standard Room",
    offerRetailRate: { amount: 100_000 + index * 10_000, currency: "KRW" },
    rates: [{ name: "Flexible", retailRate: { total: [{ amount: 100_000 + index * 10_000 }] } }],
  }],
}));

function installSuccessfulProvider({ delayMs = 0 } = {}) {
  const calls = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    if (!url.includes("api.liteapi.travel")) return Response.json({ elements: [] });
    calls.push({ url, init, at: Date.now() });
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (url.includes("/data/hotels?")) return Response.json({ data: candidates });
    if (url.includes("/hotels/rates")) return Response.json({ data: rates });
    const id = new URL(url).searchParams.get("hotelId");
    const source = candidates.find((hotel) => hotel.id === id);
    return Response.json({ data: { ...source, address: `${id} address`, countryCode: "JP" } });
  };
  return calls;
}

const reset = () => {
  resetLiteApiRuntimeForTests();
  resetHotelSearchRuntimeForTests();
};

test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.LITEAPI_SANDBOX_KEY;
  else process.env.LITEAPI_SANDBOX_KEY = originalKey;
});

test("common LiteAPI limiter spaces all endpoint requests at no more than four per second", async () => {
  resetLiteApiRuntimeForTests();
  const starts = [];
  globalThis.fetch = async () => {
    starts.push(Date.now());
    return Response.json({ data: [] });
  };
  await Promise.all(Array.from({ length: 5 }, (_, index) => liteApiFetch(`https://api.liteapi.travel/test/${index}`, {})));
  assert.equal(starts.length, 5);
  for (let index = 1; index < starts.length; index += 1) {
    assert.ok(starts[index] - starts[index - 1] >= LITEAPI_MIN_REQUEST_INTERVAL_MS - 15);
  }
});

test("cold search calls List once, Rates once, and Detail at most five; warm search calls LiteAPI zero times", async () => {
  reset();
  const calls = installSuccessfulProvider();
  const first = await getHotels(new Request(hotelUrl()));
  assert.equal(first.status, 200);
  assert.equal(calls.filter((call) => call.url.includes("/data/hotels?")).length, 1);
  assert.equal(calls.filter((call) => call.url.includes("/hotels/rates")).length, 1);
  assert.equal(calls.filter((call) => call.url.includes("/data/hotel?")).length, 5);
  assert.equal(calls.length, 7);

  calls.length = 0;
  const second = await getHotels(new Request(hotelUrl()));
  assert.equal(second.status, 200);
  assert.equal((await second.json()).cacheHit, true);
  assert.equal(calls.length, 0);
});

test("two concurrent identical searches reuse one in-flight provider request set", async () => {
  reset();
  const calls = installSuccessfulProvider({ delayMs: 20 });
  const [first, second] = await Promise.all([
    getHotels(new Request(hotelUrl())),
    getHotels(new Request(hotelUrl())),
  ]);
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(calls.length, 7);
});

test("rooms are part of cache identity and are represented as one occupancy per room", async () => {
  reset();
  const calls = installSuccessfulProvider();
  const response = await getHotels(new Request(hotelUrl({ guests: "3", rooms: "2" })));
  assert.equal(response.status, 200);
  const ratesCall = calls.find((call) => call.url.includes("/hotels/rates"));
  const body = JSON.parse(ratesCall.init.body);
  assert.deepEqual(body.occupancies.map((occupancy) => occupancy.adults), [2, 1]);

  const ratesBefore = calls.filter((call) => call.url.includes("/hotels/rates")).length;
  await getHotels(new Request(hotelUrl({ guests: "3", rooms: "1" })));
  assert.equal(calls.filter((call) => call.url.includes("/hotels/rates")).length, ratesBefore + 1);
});

test("429 reset metadata is parsed, cooldown blocks provider retry, and response is not cached", async () => {
  reset();
  const now = Date.now();
  const metadata = parseLiteApiRateLimit(new Response("{}", { status: 429, headers: { "X-RateLimit-Limit": "5", "X-RateLimit-Reset": String(Math.ceil((now + 1000) / 1000)), "X-RateLimit-Remaining": "0" } }), now);
  assert.equal(metadata.rateLimitLimit, 5);
  assert.equal(metadata.rateLimitRemaining, 0);
  assert.ok(metadata.retryAfterSeconds >= 1);

  let providerCalls = 0;
  globalThis.fetch = async (input) => {
    if (!String(input).includes("api.liteapi.travel")) return Response.json({ elements: [] });
    providerCalls += 1;
    if (providerCalls === 1) {
      return new Response(JSON.stringify({ error: { code: 4290 } }), {
        status: 429,
        headers: { "X-RateLimit-Reset": String(Math.ceil((Date.now() + 1000) / 1000)), "X-RateLimit-Remaining": "0" },
      });
    }
    return Response.json({ data: [] });
  };
  const limited = await getHotels(new Request(hotelUrl()));
  assert.equal(limited.status, 429);
  const limitedBody = await limited.json();
  assert.equal(limitedBody.providerStatus, "RATE_LIMITED");
  assert.ok(limitedBody.retryAt);

  const blocked = await getHotels(new Request(hotelUrl()));
  assert.equal(blocked.status, 429);
  assert.equal(providerCalls, 1);
  await new Promise((resolve) => setTimeout(resolve, Math.max(0, Date.parse(limitedBody.retryAt) - Date.now()) + 50));
  const retried = await getHotels(new Request(hotelUrl()));
  assert.equal(retried.status, 200);
  assert.equal(providerCalls, 2);
});

test("failed in-flight entries are removed and no mock hotels are generated", async () => {
  reset();
  let calls = 0;
  globalThis.fetch = async (input) => {
    if (!String(input).includes("api.liteapi.travel")) return Response.json({ elements: [] });
    calls += 1;
    if (calls === 1) return new Response("{}", { status: 500 });
    return Response.json({ data: [] });
  };
  const failed = await getHotels(new Request(hotelUrl()));
  assert.equal(failed.status, 502);
  const retried = await getHotels(new Request(hotelUrl()));
  assert.equal(retried.status, 200);
  const body = await retried.json();
  assert.equal(calls, 2);
  assert.deepEqual(body.liteApiHotels, []);
});
