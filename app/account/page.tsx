"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import Footer from "../../components/layout/Footer";
import { useAuth } from "../../components/auth/AuthProvider";
import styles from "./AccountSettings.module.css";

export default function AccountPage() {
  const router = useRouter();
  const { user, ready, updateAccount } = useAuth();
  const [displayNameEdit, setDisplayNameEdit] = useState<{ userId: string; value: string } | null>(null);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const defaultDisplayName = user?.user_metadata?.full_name || user?.user_metadata?.name || "";
  const displayName =
    user && displayNameEdit?.userId === user.id ? displayNameEdit.value : defaultDisplayName;

  useEffect(() => {
    if (ready && !user) {
      router.replace("/login");
      return;
    }
  }, [ready, router, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (password && password.length < 8) {
      setMessage("새 비밀번호는 8자 이상 입력해주세요.");
      return;
    }
    if (password !== passwordConfirm) {
      setMessage("새 비밀번호가 서로 일치하지 않습니다.");
      return;
    }
    setBusy(true);
    const result = await updateAccount({ displayName, password: password || undefined });
    setBusy(false);
    if (result.error) {
      setMessage(result.error);
      return;
    }
    setPassword("");
    setPasswordConfirm("");
    setMessage("계정 정보를 저장했습니다.");
  };

  return (
    <>
      <Header activeNav="none" />
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.heading}>
            <span>ACCOUNT</span>
            <h1>계정 정보 수정</h1>
            <p>EYRIA에서 사용할 이름과 로그인 정보를 관리합니다.</p>
          </div>

          {!ready ? (
            <p className={styles.loading}>계정 정보를 불러오는 중입니다.</p>
          ) : user ? (
            <form onSubmit={submit} className={styles.form}>
              <label>
                이메일
                <input value={user.email || ""} readOnly aria-readonly="true" />
                <small>로그인 이메일은 이 화면에서 변경할 수 없습니다.</small>
              </label>
              <label>
                표시 이름
                <input
                  value={displayName}
                  onChange={(event) => setDisplayNameEdit({ userId: user.id, value: event.target.value })}
                  placeholder="표시 이름"
                  autoComplete="name"
                />
              </label>
              <div className={styles.divider} />
              <label>
                새 비밀번호
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="변경할 때만 입력"
                  autoComplete="new-password"
                />
              </label>
              <label>
                새 비밀번호 확인
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="새 비밀번호 다시 입력"
                  autoComplete="new-password"
                />
              </label>
              {message && <p className={styles.message} role="status">{message}</p>}
              <button type="submit" disabled={busy}>
                {busy ? "저장 중..." : "변경사항 저장"}
              </button>
            </form>
          ) : null}
        </section>
      </main>
      <Footer />
    </>
  );
}
