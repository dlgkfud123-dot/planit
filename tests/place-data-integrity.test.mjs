import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const source = readFileSync(new URL("../data/places.ts", import.meta.url), "utf8");

function auditPlaces() {
  const script = `
    import { places } from './data/places.ts';
    const normalize = value => String(value ?? '')
      .normalize('NFKC')
      .trim()
      .toLocaleLowerCase('ko-KR')
      .replace(/[\\s·・.,()'’&\\-]/g, '');
    const duplicateCount = keyOf => {
      const counts = new Map();
      for (const place of places) {
        const key = keyOf(place);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return [...counts.values()].filter(count => count > 1).length;
    };
    console.log(JSON.stringify({
      total: places.length,
      uniqueIds: new Set(places.map(place => place.id)).size,
      duplicateIds: duplicateCount(place => place.id),
      duplicateNames: duplicateCount(place => place.cityId + '::' + normalize(place.name)),
      invalidBordeaux: places.filter(place => place.cityId === 'bordeaux').length,
      canonicalBordeaux: places.filter(place => place.id === 'bordeaux-quinconces' && place.cityId === '보르도').length,
    }));
  `;
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

test("curated place data has unique identities and canonical city IDs", () => {
  const audit = auditPlaces();
  assert.equal(audit.total, 5776);
  assert.equal(audit.uniqueIds, 5776);
  assert.equal(audit.duplicateIds, 0);
  assert.equal(audit.duplicateNames, 0);
  assert.equal(audit.invalidBordeaux, 0);
  assert.equal(audit.canonicalBordeaux, 1);
});

test("all 32 place batches remain connected to the final place array", () => {
  for (let batch = 1; batch <= 32; batch += 1) {
    assert.match(source, new RegExp(`curatedBatch\\(${batch},batch`), `batch ${batch}`);
  }
});
