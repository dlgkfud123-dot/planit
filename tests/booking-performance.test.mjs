import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const readSource = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("Booking starts hotel and flight searches independently", () => {
  const source = readSource("components/booking/BookingApp.tsx");
  assert.match(source, /fetch\("\/api\/booking\/hotels"/);
  assert.match(source, /fetch\(url, \{ signal: controller\.signal \}\)/);
  assert.match(source, /hotelsLoading/);
  assert.match(source, /flightsLoading/);
});

test("seller options have lazy loading, empty, error, and retry states", () => {
  const source = readSource("components/booking/BookingApp.tsx");
  for (const text of ["예약 옵션 보기", "예약 옵션을 불러오는 중입니다.", "현재 제공되는 판매처 옵션이 없습니다.", "예약 옵션 다시 조회"]) {
    assert.ok(source.includes(text));
  }
  assert.match(source, /method: "POST"/);
});

test("Booking loading placeholders contain no decorative icons", () => {
  const source = readSource("components/booking/BookingApp.tsx");
  assert.match(source, /bookingCardSkeleton/);
  for (const icon of ["✈️", "🏨", "📍", "⭐", "💰", "🔥", "✅", "🚀", "🎯", "🛒", "⏱️", "📊"]) {
    assert.equal(source.includes(icon), false, `decorative icon remains: ${icon}`);
  }
});
