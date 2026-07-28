"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";

export default function AuthForm() {
  const { user, configured, signIn, signUp, signInWithGoogle, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const result =
      mode === "login"
        ? await signIn(email, password)
        : await signUp(email, password);
    setBusy(false);
    setMessage(
      result.error ??
        (mode === "login"
          ? "로그인했습니다."
          : "회원가입이 완료되었습니다.")
    );
  };

  const handleGoogleLogin = async () => {
    setMessage("");
    const result = await signInWithGoogle();
    if (result.error) {
      setMessage(result.error);
    }
  };

  if (!configured)
    return (
      <div className="authCard">
        <span>ACCOUNT</span>
        <h1>계정 저장은 설정 후 사용할 수 있어요.</h1>
        <p>현재는 기존처럼 이 브라우저에 안전하게 일정을 저장합니다.</p>
        <Link href="/">EYRIA으로 돌아가기</Link>
      </div>
    );

  if (user)
    return (
      <div className="authCard">
        <span>WELCOME</span>
        <h1>{user.email}</h1>
        <p>이 계정으로 저장한 여행을 모든 기기에서 다시 볼 수 있습니다.</p>
        <div>
          <Link href="/trips">내 여행 보기</Link>
          <button onClick={() => void signOut()}>로그아웃</button>
        </div>
      </div>
    );

  return (
    <form className="authCard" onSubmit={submit}>
      <span>EYRIA ACCOUNT</span>
      <h1>
        {mode === "login"
          ? "다시 여행을 이어가세요."
          : "나만의 여행 계정을 만드세요."}
      </h1>

      {/* Google Direct OAuth Button */}
      <button
        type="button"
        className="googleCtaButton"
        style={{ marginBottom: "16px" }}
        onClick={() => void handleGoogleLogin()}
      >
        <span className="googleLogoIcon">G</span> Google로 계속
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "8px 0 16px", color: "#94a3b8", fontSize: "13px" }}>
        <hr style={{ flex: 1, border: 0, borderTop: "1px solid #e2e8f0" }} />
        <span>또는 이메일로 계속</span>
        <hr style={{ flex: 1, border: 0, borderTop: "1px solid #e2e8f0" }} />
      </div>

      <label>
        이메일
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label>
        비밀번호
        <input
          type="password"
          required
          minLength={6}
          autoComplete={
            mode === "login" ? "current-password" : "new-password"
          }
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {message && <p role="status">{message}</p>}
      <button disabled={busy}>
        {busy ? "처리 중…" : mode === "login" ? "로그인" : "회원가입"}
      </button>
      <button
        type="button"
        className="authMode"
        onClick={() => {
          setMode((value) => (value === "login" ? "signup" : "login"));
          setMessage("");
        }}
      >
        {mode === "login"
          ? "처음이신가요? 회원가입"
          : "이미 계정이 있나요? 로그인"}
      </button>
      <Link href="/">계정 없이 계속하기</Link>
    </form>
  );
}
