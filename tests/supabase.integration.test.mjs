import assert from "node:assert/strict";
import test from "node:test";
import {createClient} from "@supabase/supabase-js";
import {SupabaseTripRepository} from "../utils/supabaseTripRepository.ts";

const required=["SUPABASE_TEST_URL","SUPABASE_TEST_PUBLISHABLE_KEY","SUPABASE_TEST_USER_A_EMAIL","SUPABASE_TEST_USER_A_PASSWORD","SUPABASE_TEST_USER_B_EMAIL","SUPABASE_TEST_USER_B_PASSWORD"];
const missing=required.filter(key=>!process.env[key]);

test("실제 Supabase RLS가 사용자별 일정을 분리한다",{skip:missing.length?`통합 테스트 환경변수 누락: ${missing.join(", ")}`:false},async()=>{
  const make=()=>createClient(process.env.SUPABASE_TEST_URL,process.env.SUPABASE_TEST_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}}),clientA=make(),clientB=make();
  assert.equal((await clientA.auth.signInWithPassword({email:process.env.SUPABASE_TEST_USER_A_EMAIL,password:process.env.SUPABASE_TEST_USER_A_PASSWORD})).error,null);
  assert.equal((await clientB.auth.signInWithPassword({email:process.env.SUPABASE_TEST_USER_B_EMAIL,password:process.env.SUPABASE_TEST_USER_B_PASSWORD})).error,null);
  const id=crypto.randomUUID(),snapshot={schemaVersion:2,id,title:"RLS test",destination:"서울",origin:"서울",start:"2026-08-14",end:"2026-08-14",people:1,budget:10,tempo:"균형 있게",interest:"문화",food:"현지",stay:"호텔",pace:2,plan:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},repoA=new SupabaseTripRepository(clientA),repoB=new SupabaseTripRepository(clientB);
  try{await repoA.save(snapshot);assert.equal((await repoA.find(id))?.id,id);assert.equal(await repoB.find(id),null)}finally{await repoA.remove(id);await clientA.auth.signOut();await clientB.auth.signOut()}
});
