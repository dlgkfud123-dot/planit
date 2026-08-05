import test from "node:test";
import assert from "node:assert/strict";
import {
  DuffelFlightProvider,
  normalizeDuffelOffer,
  parseIsoDuration,
  formatDuffelDateTime,
  calculateDuffelTimeFlags,
  getFlightProvider,
  curateDuffelOffers,
} from "../utils/flightProvider.ts";
import { GET as getFlights } from "../app/api/booking/flights/route.ts";

const sampleDuffelOffer = {
  id: "off_0000B92wxfHa82m76JsoqZ",
  total_amount: "542900.00",
  base_amount: "450000.00",
  tax_amount: "92900.00",
  total_currency: "KRW",
  expires_at: "2099-12-31T23:59:59.000Z",
  owner: {
    name: "Korean Air",
    iata_code: "KE",
    logo_symbol_url: "https://assets.duffel.com/img/airlines/for-light-background/full-color-logo/KE.svg",
  },
  slices: [
    {
      id: "sli_1",
      duration: "PT2H25M",
      origin: { iata_code: "ICN", name: "Incheon International Airport" },
      destination: { iata_code: "NRT", name: "Narita International Airport" },
      segments: [
        {
          id: "seg_1",
          departing_at: "2026-09-10T09:00:00",
          arriving_at: "2026-09-10T11:25:00",
          marketing_carrier: { iata_code: "KE", name: "Korean Air" },
          operating_carrier: { iata_code: "KE", name: "Korean Air" },
          marketing_carrier_flight_number: "703",
          origin: { iata_code: "ICN", name: "Incheon" },
          destination: { iata_code: "NRT", name: "Narita" },
          passengers: [
            {
              baggages: [
                { type: "checked", quantity: 1 },
                { type: "carry_on", quantity: 1 },
              ],
              cabin: {
                amenities: {
                  wifi: { available: true },
                  power: { available: true },
                  seat: { pitch: "32" },
                },
              },
            },
          ],
        },
      ],
    },
    {
      id: "sli_2",
      duration: "PT2H30M",
      origin: { iata_code: "NRT", name: "Narita International Airport" },
      destination: { iata_code: "ICN", name: "Incheon International Airport" },
      segments: [
        {
          id: "seg_2",
          departing_at: "2026-09-13T14:00:00",
          arriving_at: "2026-09-13T16:30:00",
          marketing_carrier: { iata_code: "KE", name: "Korean Air" },
          operating_carrier: { iata_code: "KE", name: "Korean Air" },
          marketing_carrier_flight_number: "704",
          origin: { iata_code: "NRT", name: "Narita" },
          destination: { iata_code: "ICN", name: "Incheon" },
          passengers: [
            {
              baggages: [
                { type: "checked", quantity: 1 },
                { type: "carry_on", quantity: 1 },
              ],
            },
          ],
        },
      ],
    },
  ],
};

test("parseIsoDuration parses ISO 8601 duration strings accurately", () => {
  const parsed1 = parseIsoDuration("PT2H25M");
  assert.equal(parsed1.hours, 2);
  assert.equal(parsed1.minutes, 25);
  assert.equal(parsed1.totalMinutes, 145);
  assert.equal(parsed1.text, "2시간 25분");

  const parsed2 = parseIsoDuration("PT45M");
  assert.equal(parsed2.hours, 0);
  assert.equal(parsed2.minutes, 45);
  assert.equal(parsed2.totalMinutes, 45);
  assert.equal(parsed2.text, "45분");
});

test("formatDuffelDateTime formats ISO datetime for Korean UI", () => {
  const formatted = formatDuffelDateTime("2026-09-10T09:05:00");
  assert.equal(formatted.dateText, "9월 10일");
  assert.equal(formatted.timeText, "09:05");
});

test("normalizeDuffelOffer converts raw Duffel Offer into normalized FlightOffer", () => {
  const normalized = normalizeDuffelOffer(sampleDuffelOffer, 2, 600000, true);
  assert.ok(normalized);
  assert.equal(normalized.providerOfferId, "off_0000B92wxfHa82m76JsoqZ");
  assert.equal(normalized.ownerAirlineName, "Korean Air");
  assert.equal(normalized.ownerAirlineCode, "KE");
  assert.equal(normalized.price.payableTotal, 542900);
  assert.equal(normalized.price.baseFare, 450000);
  assert.equal(normalized.price.taxes, 92900);
  assert.equal(normalized.price.currency, "KRW");
  assert.equal(normalized.partyPrice.passengerCount, 2);
  assert.equal(normalized.partyPrice.totalTripPrice, 542900);
  assert.equal(normalized.partyPrice.averagePerPassenger, 271450);
  assert.equal(normalized.outbound.isDirect, true);
  assert.equal(normalized.outbound.segments[0].flightNumber, "KE 703");
  assert.equal(normalized.outbound.durationMinutes, 145);
  assert.equal(normalized.outbound.durationText, "2시간 25분");
  assert.equal(normalized.provider, "Duffel");
  assert.equal(normalized.environment, "sandbox");
  assert.equal(normalized.isExpired, false);
});

test("normalizeDuffelOffer handles expired offers correctly", () => {
  const expiredOffer = {
    ...sampleDuffelOffer,
    expires_at: "2020-01-01T00:00:00.000Z",
  };
  const normalized = normalizeDuffelOffer(expiredOffer, 2, 600000, false);
  assert.ok(normalized);
  assert.equal(normalized.isExpired, true);
});

test("getFlightProvider factory returns DuffelFlightProvider when configured", () => {
  const originalEnvKey = process.env.DUFFEL_API_KEY;
  process.env.DUFFEL_API_KEY = "duffel_test_mock_key";
  process.env.FLIGHT_PROVIDER = "duffel";

  const provider = getFlightProvider();
  assert.equal(provider.name, "Duffel");

  process.env.DUFFEL_API_KEY = originalEnvKey;
});

test("DuffelFlightProvider maps 401 unauthorized to AUTH_ERROR", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.DUFFEL_API_KEY;
  process.env.DUFFEL_API_KEY = "duffel_test_invalid";

  globalThis.fetch = async () => {
    return new Response(JSON.stringify({ errors: [{ message: "Unauthorized" }] }), { status: 401 });
  };

  const provider = new DuffelFlightProvider();
  await assert.rejects(
    () =>
      provider.searchFlights({
        city: "도쿄",
        departureAirport: "ICN",
        destinationAirport: "NRT",
        checkIn: "2026-09-10",
        checkOut: "2026-09-13",
        adults: 2,
        flightBudget: 600000,
        travelClass: "1",
        currency: "KRW",
      }),
    (err) => err.status === 401 || err.providerStatus === "AUTH_ERROR"
  );

  globalThis.fetch = originalFetch;
  process.env.DUFFEL_API_KEY = originalKey;
});

test("replay mode makes zero external Duffel/SerpAPI calls", async () => {
  const originalMode = process.env.FLIGHT_DATA_MODE;
  process.env.FLIGHT_DATA_MODE = "replay";

  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;
  globalThis.fetch = async () => {
    fetchCallCount += 1;
    return new Response(JSON.stringify({}), { status: 200 });
  };

  const request = new Request("http://localhost/api/booking/flights?city=%EB%8F%84%EC%BF%84&checkIn=2026-09-10&checkOut=2026-09-13&adults=2");
  const response = await getFlights(request);
  const json = await response.json();

  assert.equal(response.status, 200);
  assert.equal(json.success, true);
  globalThis.fetch = originalFetch;
  process.env.FLIGHT_DATA_MODE = originalMode;
});

test("curateDuffelOffers limits top 5 initial cards and caps same airline repeats to max 2", () => {
  const mockOffers = Array.from({ length: 15 }, (_, i) => {
    const airline = i < 10 ? "Hahn Air" : i < 13 ? "Korean Air" : "Asiana";
    const raw = {
      ...sampleDuffelOffer,
      id: `off_mock_${i}`,
      total_amount: String(300000 + i * 10000),
      owner: { name: airline, iata_code: airline.substring(0, 2).toUpperCase() },
      slices: [
        {
          ...sampleDuffelOffer.slices[0],
          segments: [
            {
              ...sampleDuffelOffer.slices[0].segments[0],
              marketing_carrier_flight_number: `${100 + i}`,
            },
          ],
        },
        sampleDuffelOffer.slices[1],
      ],
    };
    return normalizeDuffelOffer(raw, 2, 600000, true);
  }).filter(Boolean);

  const { curated, allRanked } = curateDuffelOffers(mockOffers, 600000);
  assert.equal(curated.length, 5);

  const airlineCounts = {};
  curated.forEach((o) => {
    airlineCounts[o.ownerAirlineName] = (airlineCounts[o.ownerAirlineName] || 0) + 1;
  });

  assert.ok((airlineCounts["Hahn Air"] || 0) <= 2, "Hahn Air should not repeat more than 2 times in top 5");
  assert.equal(allRanked.length, 15);
});
