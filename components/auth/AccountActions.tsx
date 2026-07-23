"use client";
import Link from "next/link";
import {useAuth} from "./AuthProvider";
export default function AccountActions(){const{user,configured,signOut}=useAuth();if(!configured)return null;return user?<><span className="accountEmail">{user.email}</span><button onClick={()=>void signOut()}>로그아웃</button></>:<Link href="/login">로그인</Link>}
