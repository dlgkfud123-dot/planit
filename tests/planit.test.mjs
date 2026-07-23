import assert from "node:assert/strict";
import test,{beforeEach} from "node:test";
import {decodeSharedTrip,encodeSharedTrip,getLastTripRestoreError,isTripSnapshot,readDraft,readSavedTrips,restoreTripSnapshot,tripSchemaVersion} from "../utils/tripStorage.ts";
import {paceForTempo,tempoForPace} from "../utils/plannerPace.ts";

class MemoryStorage{
  #values=new Map();
  getItem(key){return this.#values.has(key)?this.#values.get(key):null}
  setItem(key,value){this.#values.set(key,String(value))}
  removeItem(key){this.#values.delete(key)}
  clear(){this.#values.clear()}
}
globalThis.localStorage=new MemoryStorage();

const stop={id:"stop-1",placeId:"place-1",name:"경복궁",time:"09:00",cost:3000,duration:"90분",lat:37.5796,lng:126.977,category:"culture",recommendedTime:"morning",description:"조선 왕궁",openingHours:"방문 전 확인",tags:["문화","역사"],isCoreLandmark:true,district:"종로",nearbyTrip:false,transportHints:["지하철"],estimateStatus:"estimated"};
const snapshot={schemaVersion:tripSchemaVersion,id:"trip-1",title:"서울 1일 여행",destination:"서울",origin:"서울 (ICN)",start:"2026-08-14",end:"2026-08-14",people:2,budget:120,tempo:"균형 있게",interest:"문화 · 예술",food:"현지 맛집 중심",stay:"편안한 호텔",pace:2,plan:[{label:"DAY 1",date:"2026-08-14",theme:"서울의 역사",stops:[stop]}],createdAt:"2026-07-22T00:00:00.000Z",updatedAt:"2026-07-22T00:00:00.000Z"};

beforeEach(()=>localStorage.clear());

test("v1 저장 데이터를 schema v2로 마이그레이션한다",()=>{
  const{schemaVersion,...legacy}=snapshot;
  const restored=restoreTripSnapshot(legacy);
  assert.ok(restored);
  assert.equal(restored.schemaVersion,2);
  assert.equal(restored.destination,"서울");
  assert.deepEqual(restored.plan,snapshot.plan);
});

test("손상된 자동 저장 데이터는 제거하고 복원 실패를 기록한다",()=>{
  localStorage.setItem("planit:auto-draft:v1","{broken-json");
  assert.equal(readDraft(),null);
  assert.equal(localStorage.getItem("planit:auto-draft:v1"),null);
  assert.match(getLastTripRestoreError()??"",/손상|복원/);
});

test("저장 목록에서 유효하지 않은 항목만 제외한다",()=>{
  localStorage.setItem("planit:saved-trips:v1",JSON.stringify([snapshot,{...snapshot,id:"bad",plan:[{label:"DAY 1"}]}]));
  const restored=readSavedTrips();
  assert.equal(restored.length,1);
  assert.equal(restored[0].id,"trip-1");
  assert.match(getLastTripRestoreError()??"",/일부/);
});

test("공유 데이터는 유효한 일정만 디코딩한다",async()=>{
  const encoded=await encodeSharedTrip(snapshot);
  assert.deepEqual(await decodeSharedTrip(encoded),snapshot);
  assert.equal(await decodeSharedTrip("not-a-valid-gzip-payload"),null);
  assert.match(getLastTripRestoreError()??"",/공유 일정을 복원/);
});

test("공유 데이터 type guard가 누락 필드와 잘못된 pace를 거부한다",()=>{
  assert.equal(isTripSnapshot(snapshot),true);
  assert.equal(isTripSnapshot({...snapshot,pace:4}),false);
  assert.equal(isTripSnapshot({...snapshot,plan:[{...snapshot.plan[0],stops:[{...stop,lat:"37.5"}]}]}),false);
});

test("tempo는 pace의 파생값이며 양방향 매핑이 일관된다",()=>{
  assert.deepEqual([tempoForPace(1),tempoForPace(2),tempoForPace(3)],["여유롭게","균형 있게","알차게"]);
  assert.deepEqual([paceForTempo("여유롭게"),paceForTempo("균형 있게"),paceForTempo("알차게")],[1,2,3]);
  assert.equal(paceForTempo("알 수 없는 값"),2);
});
