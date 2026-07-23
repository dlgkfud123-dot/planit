import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import test,{beforeEach} from "node:test";
import {signInWithEmail,signOutUser,signUpWithEmail} from "../utils/supabaseAuth.ts";
import {LocalTripRepository} from "../utils/localTripRepository.ts";
import {SupabaseTripRepository} from "../utils/supabaseTripRepository.ts";
import {hasPersistableDates} from "../utils/tripRepository.ts";
import {importTrips,saveWithFallback} from "../utils/tripPersistence.ts";

class MemoryStorage{#values=new Map();getItem(key){return this.#values.get(key)??null}setItem(key,value){this.#values.set(key,String(value))}removeItem(key){this.#values.delete(key)}clear(){this.#values.clear()}}
globalThis.localStorage=new MemoryStorage();

const stop={id:"stop-1",placeId:"place-1",name:"경복궁",time:"09:00",cost:3000,duration:"90분",lat:37.5796,lng:126.977,category:"culture",recommendedTime:"morning",description:"조선 왕궁",openingHours:"방문 전 확인",tags:["문화","역사"],isCoreLandmark:true,district:"종로",nearbyTrip:false,transportHints:["지하철"],estimateStatus:"estimated"};
const trip=id=>({schemaVersion:2,id,title:"서울 1일 여행",destination:"서울",origin:"서울",start:"2026-08-14",end:"2026-08-14",people:2,budget:120,tempo:"균형 있게",interest:"문화",food:"현지 맛집 중심",stay:"호텔",pace:2,plan:[{label:"DAY 1",date:"2026-08-14",theme:"역사",stops:[stop]}],createdAt:"2026-07-22T00:00:00.000Z",updatedAt:"2026-07-22T00:00:00.000Z"});

beforeEach(()=>localStorage.clear());

test("이메일 회원가입·로그인·로그아웃은 비밀번호를 Supabase Auth에만 전달한다",async()=>{
  const calls=[];
  const client={auth:{signUp:async input=>{calls.push(["signup",input]);return{error:null}},signInWithPassword:async input=>{calls.push(["login",input]);return{error:null}},signOut:async()=>{calls.push(["logout"]);return{error:null}}}};
  assert.equal((await signUpWithEmail(client,"a@planit.test","secret12")).error,null);
  assert.equal((await signInWithEmail(client,"a@planit.test","secret12")).error,null);
  assert.equal((await signOutUser(client)).error,null);
  assert.deepEqual(calls,[['signup',{email:"a@planit.test",password:"secret12"}],['login',{email:"a@planit.test",password:"secret12"}],['logout']]);
});

test("비로그인 Repository는 기존 localStorage 저장을 유지한다",async()=>{
  const repository=new LocalTripRepository(),snapshot=trip("local-1");
  await repository.save(snapshot);
  assert.deepEqual(await repository.find("local-1"),snapshot);
  assert.equal((await repository.list()).length,1);
  await repository.remove("local-1");
  assert.equal((await repository.list()).length,0);
});

test("서버 저장 실패 시 동일 snapshot을 fallback에 보존한다",async()=>{
  const snapshot=trip("fallback-1"),fallback=[];
  const result=await saveWithFallback(async()=>{throw new Error("network down")},snapshot,value=>fallback.push(value));
  assert.equal(result.saved,false);
  assert.equal(result.error.message,"network down");
  assert.deepEqual(fallback,[snapshot]);
});

test("로컬 일정 가져오기는 성공한 ID와 실패한 ID를 분리한다",async()=>{
  const repository={list:async()=>[],find:async()=>null,remove:async()=>{},save:async snapshot=>{if(snapshot.id==="bad")throw new Error("blocked");return snapshot}};
  const result=await importTrips(repository,[trip("good"),trip("bad")]);
  assert.deepEqual(result,{imported:1,failed:1,importedIds:["good"],failedIds:["bad"]});
});

test("서버 저장은 유효한 날짜만 허용하고 user_id를 전송하지 않는다",async()=>{
  let inserted;
  const client={from:()=>({upsert:async row=>{inserted=row;return{error:null}}})};
  const repository=new SupabaseTripRepository(client),snapshot=trip("00000000-0000-4000-8000-000000000001");
  assert.equal(hasPersistableDates(snapshot),true);
  assert.equal(hasPersistableDates({...snapshot,start:""}),false);
  await repository.save(snapshot);
  assert.equal("user_id" in inserted,false);
  assert.deepEqual(inserted.snapshot,snapshot);
  await assert.rejects(()=>repository.save({...snapshot,start:""}),/시작일과 종료일/);
});

test("SQL migration은 사용자별 SELECT·INSERT·UPDATE·DELETE RLS를 강제한다",async()=>{
  const sql=await readFile(new URL("../supabase/migrations/001_create_trips.sql",import.meta.url),"utf8");
  assert.match(sql,/enable row level security/i);
  for(const operation of ["select","insert","update","delete"])assert.match(sql,new RegExp(`for ${operation}`,'i'));
  assert.ok((sql.match(/auth\.uid\(\) = user_id/g)??[]).length>=5);
  assert.match(sql,/user_id uuid not null default auth\.uid\(\)/i);
});
