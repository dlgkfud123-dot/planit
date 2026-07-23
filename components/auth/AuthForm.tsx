"use client";

import {FormEvent,useState} from "react";
import Link from "next/link";
import {useAuth} from "./AuthProvider";

export default function AuthForm(){
  const{user,configured,signIn,signUp,signOut}=useAuth(),[email,setEmail]=useState(""),[password,setPassword]=useState(""),[mode,setMode]=useState<"login"|"signup">("login"),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
  const submit=async(event:FormEvent)=>{event.preventDefault();setBusy(true);setMessage("");const result=mode==="login"?await signIn(email,password):await signUp(email,password);setBusy(false);setMessage(result.error??(mode==="login"?"로그인했습니다.":"회원가입이 완료되었습니다."))};
  if(!configured)return <div className="authCard"><span>ACCOUNT</span><h1>계정 저장은 설정 후 사용할 수 있어요.</h1><p>현재는 기존처럼 이 브라우저에 안전하게 일정을 저장합니다.</p><Link href="/">PLANIT으로 돌아가기</Link></div>;
  if(user)return <div className="authCard"><span>WELCOME</span><h1>{user.email}</h1><p>이 계정으로 저장한 여행을 모든 기기에서 다시 볼 수 있습니다.</p><div><Link href="/trips">내 여행 보기</Link><button onClick={()=>void signOut()}>로그아웃</button></div></div>;
  return <form className="authCard" onSubmit={submit}><span>PLANIT ACCOUNT</span><h1>{mode==="login"?"다시 여행을 이어가세요.":"나만의 여행 계정을 만드세요."}</h1><label>이메일<input type="email" required autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)}/></label><label>비밀번호<input type="password" required minLength={6} autoComplete={mode==="login"?"current-password":"new-password"} value={password} onChange={event=>setPassword(event.target.value)}/></label>{message&&<p role="status">{message}</p>}<button disabled={busy}>{busy?"처리 중…":mode==="login"?"로그인":"회원가입"}</button><button type="button" className="authMode" onClick={()=>{setMode(value=>value==="login"?"signup":"login");setMessage("")}}>{mode==="login"?"처음이신가요? 회원가입":"이미 계정이 있나요? 로그인"}</button><Link href="/">계정 없이 계속하기</Link></form>
}
