"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthProvider";

export default function AccountActions() {
  const { user, configured, signOut } = useAuth();
  const [open, setOpen] = useState(false);
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

  if (!configured) return null;

  if (!user) {
    return (
      <Link href="/login" className="loginHeaderLink">
        로그인
      </Link>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
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
        {avatarUrl ? (
          <img src={avatarUrl} alt="프로필" className="userAvatarImg" />
        ) : (
          <span className="userAvatarInitial">{initial}</span>
        )}
      </button>

      {open && (
        <div className="userDropdownMenu" role="menu">
          <div className="dropdownHeader">
            <span className="dropdownEmail">{user.email}</span>
            <span className="dropdownBadge">PLANIT Member</span>
          </div>
          <hr className="dropdownDivider" />
          <Link
            href="/trips"
            className="dropdownItem"
            onClick={() => setOpen(false)}
          >
            🧳 내 여행 (My Journeys)
          </Link>
          <Link
            href="/"
            className="dropdownItem"
            onClick={() => setOpen(false)}
          >
            ✦ 새 여행 만들기
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
            🚪 로그아웃
          </button>
        </div>
      )}
    </div>
  );
}
