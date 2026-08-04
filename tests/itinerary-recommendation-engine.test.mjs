import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { clusterPlacesByCoordinates } from "../utils/placeClusters.ts";

const source = readFileSync(new URL("../utils/itineraryGenerator.ts", import.meta.url), "utf8");

function runGeneratorAudit() {
  const script = `
    import { generateItinerary } from './utils/itineraryGenerator.ts';
    const cities=['도쿄','후쿠오카','홍콩','파리','뉴욕'];
    const barWords=['izakaya','bar','pub','jazz_bar','rooftop_bar','cocktail_bar','sake','night_life','야타이','포장마차','선술집','술집','이자카야','재즈바','칵테일바','루프탑바'];
    const output=cities.map(destination=>{
      const base={destination,start:'2099-08-10',days:4,pace:2,style:'자연 · 도시',foodPreference:'상관없음',wishList:''};
      const first=generateItinerary({...base,seed:'stable'}),again=generateItinerary({...base,seed:'stable'}),different=generateItinerary({...base,seed:'different'});
      const bar=generateItinerary({...base,style:'미식 중심',foodPreference:'술집',wishList:'술집',seed:'bar'});
      return {destination,stable:JSON.stringify(first)===JSON.stringify(again),different:JSON.stringify(first)!==JSON.stringify(different),shape:first.every(day=>typeof day.label==='string'&&typeof day.date==='string'&&Array.isArray(day.stops)&&day.stops.every(stop=>typeof stop.id==='string'&&typeof stop.placeId==='string')),nearby:first.some(day=>day.stops.some(stop=>stop.nearbyTrip)),duplicate:first.some(day=>new Set(day.stops.map(stop=>stop.placeId)).size!==day.stops.length),core:first.flatMap(day=>day.stops).filter(stop=>stop.isCoreLandmark).length,averageStops:first.reduce((sum,day)=>sum+day.stops.length,0)/first.length,maxDayKm:Math.max(...first.map(day=>day.stops.reduce((sum,stop)=>sum+(stop.distanceFromPrevious||0),0))),maxLegKm:Math.max(...first.flatMap(day=>day.stops.map(stop=>stop.distanceFromPrevious||0))),barDays:bar.filter(day=>day.stops.some(stop=>stop.tags.map(tag=>tag.toLowerCase().replaceAll('-','_').replaceAll(' ','_')).some(tag=>barWords.some(word=>tag.includes(word))))).length};
    }); console.log(JSON.stringify(output));`;
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], { cwd: process.cwd(), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout.trim());
}

test("좌표 클러스터는 인접 장소를 묶고 작은 고립 군집을 가장 가까운 군집에 병합한다", () => {
  const place = (id, latitude, longitude) => ({ id, cityId: "테스트", name: id, category: "culture", latitude, longitude, recommendedDuration: 60, recommendedTime: "any", estimatedCost: 0, description: "", openingHours: "", tags: [], isCoreLandmark: false, district: "", nearbyTrip: false, transportHints: [], estimateStatus: "free" });
  const clusters = clusterPlacesByCoordinates([place("a", 37.5, 127), place("b", 37.505, 127.005), place("c", 37.7, 127.2), place("d", 37.705, 127.205), place("single", 37.51, 127.01)], 2, 2);
  assert.equal(clusters.length, 2);
  assert.equal(clusters.reduce((sum, cluster) => sum + cluster.places.length, 0), 5);
});

test("seed는 새로고침 안정성과 재생성 다양성을 동시에 제공한다", () => {
  for (const result of runGeneratorAudit()) {
    assert.equal(result.stable, true, result.destination);
    assert.equal(result.different, true, result.destination);
    assert.equal(result.shape, true, result.destination);
  }
});

test("확대 후보 풀과 시간 보충을 사용하면서 낮은 완성도와 중복을 방어한다", () => {
  assert.match(source, /maximumStops\*itineraryCandidatePoolMultiplier/);
  assert.match(source, /targetCount\*2/);
  assert.match(source, /scheduledIds/);
  for (const result of runGeneratorAudit()) {
    assert.equal(result.nearby, false, result.destination);
    assert.equal(result.duplicate, false, result.destination);
    assert.ok(result.averageStops >= 3, `${result.destination}: ${result.averageStops}`);
  }
});

test("일일 이동거리와 단일 구간은 보통 pace hard guard를 넘지 않는다", () => {
  for (const result of runGeneratorAudit()) {
    assert.ok(result.maxDayKm <= 15.01, `${result.destination}: ${result.maxDayKm}`);
    assert.ok(result.maxLegKm <= 12.01, `${result.destination}: ${result.maxLegKm}`);
  }
});

test("랜드마크 총량과 술집 핵심 태그를 제어한다", () => {
  for (const result of runGeneratorAudit()) {
    assert.ok(result.core >= 1 && result.core <= 3, `${result.destination}: ${result.core}`);
    assert.equal(result.barDays, 4, `${result.destination}: ${result.barDays}`);
  }
});
