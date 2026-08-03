import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { getWeekdayInTimeZone } from "../utils/openingHoursValidator.ts";

const readSource = (relativePath) =>
  fs.readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("client component directives are the first statements", () => {
  for (const file of [
    "components/auth/AuthForm.tsx",
    "components/map/InteractiveMapIntro.tsx",
  ]) {
    const source = readSource(file).replace(/^\uFEFF/, "");
    assert.equal(source.startsWith('"use client";'), true, file);
  }
});

test("Planner restore effect tracks day and stop setters", () => {
  const source = readSource("components/planner/PlannerApp.tsx");
  assert.match(source, /setActiveDay\(validDay\);\s*setActiveStop\(targetStop\);/);
  assert.match(
    source,
    /\[authReady, find, hydrate, setActiveDay, setActiveStop, setMobileTab, setPlan, setSavedTripId, setSource, setStatus\]/
  );
});

test("FinalTrip statistics use the current snapshot plan as a memo dependency", () => {
  const source = readSource("components/final-trip/FinalTripPage.tsx");
  assert.match(source, /const days = snapshot\.plan;/);
  assert.match(
    source,
    /useMemo\(\(\) => calculateTripStats\(days, people, destination\), \[days, people, destination\]\)/
  );

  assert.equal(source.includes("snapshot.plan || []"), false);
});

test("flight travelStyle is not advertised to a score model that does not support it", () => {
  const route = readSource("app/api/booking/flights/route.ts");
  const booking = readSource("components/booking/BookingApp.tsx");
  assert.equal(route.includes('searchParams.get("travelStyle")'), false);
  assert.equal(booking.includes("&travelStyle=${travelStyle}"), false);
  assert.match(
    route,
    /priceScore \* 0\.40 \+ timeScore \* 0\.25 \+ directScore \* 0\.20 \+ baggageScore \* 0\.15/
  );
});

test("weekday calculation is independent of server timezone and distinguishes Tuesday from Thursday", () => {
  const previousTimeZone = process.env.TZ;
  process.env.TZ = "UTC";
  try {
    assert.equal(getWeekdayInTimeZone("2026-08-04", "12:00", "Asia/Tokyo"), 2);
    assert.equal(getWeekdayInTimeZone("2026-08-06", "12:00", "Asia/Tokyo"), 4);
  } finally {
    if (previousTimeZone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimeZone;
  }
});

test("weekday calculation handles midnight and DST date boundaries", () => {
  assert.equal(getWeekdayInTimeZone("2026-08-05", "23:59", "Asia/Tokyo"), 3);
  assert.equal(getWeekdayInTimeZone("2026-08-06", "00:01", "Asia/Tokyo"), 4);
  assert.equal(getWeekdayInTimeZone("2026-03-08", "01:30", "America/New_York"), 0);
  assert.equal(getWeekdayInTimeZone("2026-03-08", "03:30", "America/New_York"), 0);
});
