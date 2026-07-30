"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

function DefaultAvatarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="currentColor"
      className="defaultAvatarSvg"
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
    </svg>
  );
}

export default function AccountActions() {
  const { user, ready, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!ready) return <span className="accountActionsPlaceholder" aria-hidden="true" />;

  if (!user) {
    return (
      <Link href="/login" className="loginHeaderLink">
        로그인
      </Link>
    );
  }

  // Extract avatar URL from all possible Supabase / Google OAuth metadata properties
  const rawAvatarUrl =
    user.user_metadata?.avatar_url ||
    user.user_metadata?.picture ||
    user.user_metadata?.photoURL ||
    user.user_metadata?.avatar ||
    user.identities?.[0]?.identity_data?.avatar_url ||
    user.identities?.[0]?.identity_data?.picture;

  const showImage = rawAvatarUrl && !imgError;
  const initial = (user.email?.[0] || "U").toUpperCase();

  return (
    <div className="userMenuWrapper" ref={dropdownRef}>
      <button
        type="button"
        className="userAvatarTrigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-label="사용자 메뉴"
      >
        {showImage ? (
          <img
            src={rawAvatarUrl}
            alt="프로필"
            className="userAvatarImg"
            onError={() => setImgError(true)}
          />
        ) : initial ? (
          <span className="userAvatarInitial">{initial}</span>
        ) : (
          <DefaultAvatarIcon />
        )}
      </button>

      {open && (
        <div className="userDropdownMenu" role="menu">
          <div className="dropdownHeader">
            <span className="dropdownEmail">{user.email}</span>
            <span className="dropdownBadge">EYRIA Member</span>
          </div>
          <hr className="dropdownDivider" />
          <Link
            href="/trips"
            className="dropdownItem"
            onClick={() => setOpen(false)}
          >
            내 여행
          </Link>
          <Link
            href="/account"
            className="dropdownItem"
            onClick={() => setOpen(false)}
          >
            계정 정보 수정
          </Link>
          <Link
            href="/"
            className="dropdownItem"
            onClick={() => setOpen(false)}
          >
            새 여행 만들기
          </Link>
          <hr className="dropdownDivider" />
          <button
            type="button"
            className="dropdownItem signOutItem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
          >
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
