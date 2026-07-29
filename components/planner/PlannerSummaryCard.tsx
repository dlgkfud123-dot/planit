"use client";

import AccountActions from "../auth/AccountActions";
import BrandLogo from "../common/BrandLogo";
import styles from "./PlannerDesktop.module.css";

type Props = {
  destination: string;
  start: string;
  end: string;
  people: number;
  budget: number;
  saveStatus: string;
  onOpenSettings: () => void;
  onSave: () => void;
  onShare: () => void;
};

export default function PlannerSummaryCard({
  destination,
  start,
  end,
  people,
  budget,
  saveStatus,
  onOpenSettings,
  onSave,
  onShare,
}: Props) {
  return (
    <header className={`${styles.summaryCard} workspaceHeader v2Header`}>
      <BrandLogo />
      <div className={styles.tripIdentity}>
        <strong>{destination || "여행지"}</strong>
        <span>{start && end ? `${start} ~ ${end}` : "기간 미지정"}</span>
      </div>
      <div className={styles.tripMeta} aria-label="여행 보조 정보">
        <span>{people > 0 ? `${people}명` : "-명"}</span>
        <span>{budget > 0 ? `${budget}만원` : "-만원"}</span>
      </div>
      <div className={styles.summaryActions}>
        <button type="button" onClick={onOpenSettings}>설정 수정</button>
        <button type="button" onClick={onSave} disabled={saveStatus === "saving"}>
          {saveStatus === "saving" ? "저장 중..." : "저장"}
        </button>
        <button type="button" onClick={onShare}>공유</button>
        <AccountActions />
      </div>
    </header>
  );
}
