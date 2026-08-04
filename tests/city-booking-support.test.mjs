import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cities, findCity } from "../data/cities.ts";
import {
  CITY_AIRPORT_GROUPS,
  getCanonicalArrivalAirportCandidates,
  getCityAirportGroup,
  isBookingReadyAirportGroup,
} from "../data/airports.ts";
import { validateHotelInput } from "../utils/bookingValidation.ts";
import { resolveBookingDestinationContext } from "../utils/bookingDestinationContext.ts";

const validContext = (destination) => resolveBookingDestinationContext({
  draftRequested: true,
  draftFound: true,
  destination,
  checkIn: "2099-08-10",
  checkOut: "2099-08-13",
  travelers: 2,
  budget: 2_000_000,
  today: "2099-01-01",
});

const plannerPlaceSources = readdirSync(new URL("../data", import.meta.url))
  .filter((name) => /^places(?:Batch\d+)?\.ts$/.test(name))
  .map((name) => readFileSync(join(new URL("../data", import.meta.url).pathname.slice(1), name), "utf8"))
  .join("\n");

test("74개 도시의 canonical lookup, 장소, 좌표, 공항 그룹, 호텔 cityId가 완전하다", () => {
  assert.equal(cities.length, 74);
  assert.equal(CITY_AIRPORT_GROUPS.length, 74);
  for (const city of cities) {
    assert.equal(findCity(city.name)?.name, city.name, `${city.name} canonical lookup`);
    assert.equal(findCity(city.en)?.name, city.name, `${city.name} English lookup`);
    assert.ok(Number.isFinite(city.lat) && Number.isFinite(city.lon), `${city.name} coordinates`);
    assert.ok(plannerPlaceSources.includes(city.name), `${city.name} planner places`);
    assert.ok(getCityAirportGroup(city.name), `${city.name} airport group`);
    assert.equal(validateHotelInput({ cityId: city.name, checkIn: "2099-08-10", checkOut: "2099-08-13", guests: 1, rooms: 1, budget: 1 }, new Date("2099-01-01T00:00:00Z")), null, `${city.name} hotel mapping`);
  }
});

test("신규 선택 가능한 모든 도시는 Planner에서 Booking까지 복원 가능한 공항 그룹을 가진다", () => {
  const selectable = cities.filter((city) => isBookingReadyAirportGroup(city.name));
  assert.equal(selectable.length, 27);
  for (const city of selectable) {
    const context = validContext(city.name);
    assert.equal(context.ok, true, `${city.name} Booking context`);
    if (context.ok) assert.ok(context.arrivalAirports.length > 0);
  }
});

test("미검증 47개 도시는 목적지 누락이 아닌 AIRPORT_GROUP_UNVERIFIED로 구분된다", () => {
  const unverified = cities.filter((city) => !isBookingReadyAirportGroup(city.name));
  assert.equal(unverified.length, 47);
  for (const city of unverified) {
    const context = validContext(city.name);
    assert.deepEqual(context.ok ? null : context.code, "AIRPORT_GROUP_UNVERIFIED", city.name);
  }
});

test("베트남 canonical cityId와 별칭은 검증된 단일 공항으로 수렴한다", () => {
  const cases = [
    { canonical: "호찌민", aliases: ["호찌민", "호치민", "Ho Chi Minh City", "Ho Chi Minh"], airport: "SGN" },
    { canonical: "하노이", aliases: ["하노이", "Hanoi"], airport: "HAN" },
    { canonical: "다낭", aliases: ["다낭", "Da Nang", "Danang"], airport: "DAD" },
  ];
  for (const entry of cases) {
    for (const alias of entry.aliases) {
      assert.equal(findCity(alias)?.name, entry.canonical, alias);
      assert.equal(getCityAirportGroup(alias)?.classification, "SINGLE_AIRPORT_CITY", alias);
      assert.deepEqual(getCanonicalArrivalAirportCandidates(alias), [entry.airport], alias);
      const context = validContext(alias);
      assert.equal(context.ok, true, alias);
      if (context.ok) {
        assert.equal(context.canonicalCityId, entry.canonical);
        assert.deepEqual(context.arrivalAirports, [entry.airport]);
      }
    }
  }
});

test("기존 복수 공항 및 단일 공항 도시는 회귀하지 않는다", () => {
  assert.deepEqual(getCanonicalArrivalAirportCandidates("도쿄"), ["HND", "NRT"]);
  assert.deepEqual(getCanonicalArrivalAirportCandidates("후쿠오카"), ["FUK"]);
  assert.deepEqual(getCanonicalArrivalAirportCandidates("뉴욕"), ["EWR", "JFK", "LGA"]);
});

test("Booking 오류 상태는 draft, 목적지, 지원, 공항, 날짜, 인원을 구분한다", () => {
  const base = { draftRequested: true, draftFound: true, destination: "도쿄", checkIn: "2099-08-10", checkOut: "2099-08-13", travelers: 1, budget: 1_000_000, today: "2099-01-01" };
  assert.equal(resolveBookingDestinationContext({ ...base, draftFound: false }).code, "DRAFT_NOT_FOUND");
  assert.equal(resolveBookingDestinationContext({ ...base, destination: "" }).code, "DESTINATION_MISSING");
  assert.equal(resolveBookingDestinationContext({ ...base, destination: "등록되지 않은 도시" }).code, "UNSUPPORTED_CITY");
  assert.equal(resolveBookingDestinationContext({ ...base, destination: "인터라켄" }).code, "AIRPORT_GROUP_UNVERIFIED");
  assert.equal(resolveBookingDestinationContext({ ...base, checkOut: "2099-08-09" }).code, "INVALID_DATES");
  assert.equal(resolveBookingDestinationContext({ ...base, travelers: 0 }).code, "INVALID_TRAVELERS");
});
