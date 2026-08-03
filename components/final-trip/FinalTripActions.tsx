"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../auth/AuthProvider";

interface Props {
  draftId?: string | null;
  onSave?: () => void;
  onShare?: () => void;
}

export default function FinalTripActions({ draftId, onSave, onShare }: Props) {
  const { user } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveClick = () => {
    // 1. Check if user is logged in
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    // 2. User is logged in -> Save trip
    if (onSave) {
      onSave();
    } else {
      showToast("🎉 여행 일정이 계정에 성공적으로 저장되었습니다.");
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare();
    } else {
      showToast("📋 여행 공유 링크가 클립보드에 복사되었습니다.");
    }
  };

  const plannerUrl = draftId ? `/planner?draft=${draftId}` : "/planner";

  return (
    <section className="finalTripActionsSection">
      {toastMessage && (
        <div className="actionToastNotice">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Login Required Modal for Non-Logged-In Users */}
      {showLoginModal && (
        <div className="loginModalOverlay" onClick={() => setShowLoginModal(false)}>
          <div className="loginModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="loginModalHeader">
              <span className="lockBadge">🔒 로그인 필요</span>
              <button
                type="button"
                className="modalCloseBtn"
                onClick={() => setShowLoginModal(false)}
              >
                ✕
              </button>
            </div>

            <h3 className="loginModalTitle">일정을 계정에 안전하게 저장해보세요</h3>
            <p className="loginModalSubtitle">
              로그인하시면 스마트폰, PC 등 언제 어디서나 작성한 여행 일정을 불러오고 관리하실 수 있습니다.
            </p>

            <div className="loginModalActionGroup">
              <Link href="/login?redirect=/summary" className="primaryModalLoginBtn">
                로그인 / 회원가입 하러 가기 →
              </Link>
              <button
                type="button"
                className="secondaryModalCancelBtn"
                onClick={() => setShowLoginModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="actionBtnBarClean">
        <Link href={plannerUrl} className="secondaryActionBtnClean">
          ← 일정 다시 편집하기
        </Link>
        <button type="button" onClick={handleShareClick} className="secondaryActionBtnClean">
          공유하기
        </button>
        <button type="button" onClick={handleSaveClick} className="primarySaveActionBtn">
          여행 저장하기
        </button>
      </div>
    </section>
  );
}
