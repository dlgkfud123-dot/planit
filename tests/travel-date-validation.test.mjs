import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { getLocalDateString, isDateBeforeMinimum, shouldClearEndDate, validateTravelDateRange } from "../utils/travelDateValidation.ts";

test("오늘은 허용하고 어제와 출발일보다 빠른 귀국일은 거부한다", () => {
  const today = "2026-08-04";
  assert.deepEqual(validateTravelDateRange(today, today, today), { valid: true });
  assert.equal(validateTravelDateRange("2026-08-03", today, today).code, "PAST_DATE");
  assert.equal(validateTravelDateRange("2026-08-05", today, today).code, "INVALID_ORDER");
});

test("출발일 변경으로 기존 귀국일이 무효가 되면 귀국일을 비워야 한다", () => {
  assert.equal(shouldClearEndDate("2026-08-07", "2026-08-06"), true);
  assert.equal(shouldClearEndDate("2026-08-07", "2026-08-07"), false);
  assert.equal(isDateBeforeMinimum("2026-08-06", "2026-08-07"), true);
  assert.equal(isDateBeforeMinimum("2026-08-07", "2026-08-07"), false);
});

test("URL, localStorage, draft에서 온 잘못된 문자열도 동일한 검증으로 거부한다", () => {
  const today = "2026-08-04";
  for (const externalValue of [
    { start: "2026-02-30", end: "2026-03-02" },
    { start: "2026-08-05", end: "2026-08-04" },
    { start: "2025-12-01", end: "2025-12-03" },
  ]) {
    assert.equal(validateTravelDateRange(externalValue.start, externalValue.end, today).valid, false);
  }
});

test("로컬 날짜 생성은 UTC ISO 절단 대신 한국 시간 자정 경계를 따른다", () => {
  const moduleUrl = pathToFileURL(resolve("utils/travelDateValidation.ts")).href;
  const output = execFileSync(process.execPath, [
    "--experimental-strip-types",
    "--input-type=module",
    "-e",
    `import { getLocalDateString } from ${JSON.stringify(moduleUrl)}; console.log(getLocalDateString(new Date("2026-08-03T14:55:00Z"))); console.log(getLocalDateString(new Date("2026-08-03T15:05:00Z")));`,
  ], { env: { ...process.env, TZ: "Asia/Seoul" }, encoding: "utf8" });
  assert.deepEqual(output.trim().split(/\r?\n/), ["2026-08-03", "2026-08-04"]);
  assert.equal(getLocalDateString(new Date(2026, 7, 4, 0, 5)), "2026-08-04");
});

test("desktop과 mobile 날짜 input은 오늘 및 출발일 min을 공유한다", async () => {
  const [desktopSource, mobileSource] = await Promise.all([
    import("node:fs/promises").then(({ readFile }) => readFile("components/map/InteractiveMapIntro.tsx", "utf8")),
    import("node:fs/promises").then(({ readFile }) => readFile("components/map/MobileIntroExperience.tsx", "utf8")),
  ]);
  assert.match(desktopSource, /min=\{today\}/);
  assert.match(desktopSource, /min=\{start \|\| today\}/);
  assert.match(desktopSource, /validateTravelDateRange\(start, end, getLocalDateString\(\)\)/);
  assert.match(mobileSource, /min=\{props\.today\}/);
  assert.match(mobileSource, /min=\{props\.start \|\| props\.today\}/);
});
