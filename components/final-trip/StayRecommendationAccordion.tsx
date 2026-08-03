"use client";

import React, { useState } from "react";
import type { DayCentroidResult } from "../../utils/centroidEngine";

interface Props {
  centroids: DayCentroidResult[];
}

type PreferenceMode = "distance" | "price" | "rating" | "night";

export default function StayRecommendationAccordion({ centroids }: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [preference, setPreference] = useState<PreferenceMode>("distance");

  const preferenceMatrix = {
    distance: { label: "이동거리 우선", distW: 60, priceW: 20, ratingW: 20, nightW: 0 },
    price: { label: "가격 우선", distW: 20, priceW: 60, ratingW: 20, nightW: 0 },
    rating: { label: "평점 우선", distW: 20, priceW: 20, ratingW: 60, nightW: 0 },
    night: { label: "야간 일정 우선", distW: 30, priceW: 20, ratingW: 0, nightW: 50 },
  };

  const activePref = preferenceMatrix[preference];

  return (
    <section className="accordionSection stayAccordionSection">
      <button
        type="button"
        className="accordionHeaderBtn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="accordionTitleText">AI 동선 맞춤 숙소 추천</span>
        <span className="chevronIcon">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="accordionBodyContent">
          {/* Preference Toggles */}
          <div className="preferenceToggleRow">
            <span className="prefRowLabel">추천 기준 선택</span>
            <div className="prefBtnGroup">
              {(Object.keys(preferenceMatrix) as PreferenceMode[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`prefToggleBtn ${preference === key ? "active" : ""}`}
                  onClick={() => setPreference(key)}
                >
                  {preferenceMatrix[key].label}
                </button>
              ))}
            </div>
          </div>

          {/* Centroid Analysis Summary per DAY */}
          <div className="centroidAnalysisBlock">
            <h4>DAY별 동선 중심점(Centroid) 및 반경 연산 결과</h4>
            <div className="centroidCardsGrid">
              {centroids.map((c) => (
                <div key={c.dayIndex} className="centroidSummaryCard">
                  <div className="centroidCardHead">
                    <strong>{c.dayLabel}</strong>
                    {/* Confidence UI: Text + Color ONLY, NO ICONS */}
                    <div className="confidenceTag" style={{ color: c.confidenceColor, borderColor: c.confidenceColor }}>
                      추천 신뢰도 {c.confidenceLevel}
                    </div>
                  </div>

                  <div className="centroidCardMetrics">
                    <div className="metricRow">
                      <span>중심 좌표</span>
                      <strong>{c.centroidLat}, {c.centroidLng}</strong>
                    </div>
                    <div className="metricRow">
                      <span>일정 분산도</span>
                      <strong>{c.dispersionKm}km</strong>
                    </div>
                    <div className="metricRow">
                      <span>자동 결정 반경</span>
                      <strong className="radiusHighlight">{c.autoRadiusLabel}</strong>
                    </div>
                  </div>

                  <div className="stopsMicroList">
                    <span>대상 장소: {c.stopNames.join(" · ")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skeleton / Integration Notice Structure (NO FAKE HOTELS) */}
          <div className="apiIntegrationNoticeBox">
            <div className="providerNoticeText">
              <strong>실시간 Hotel Provider API 연동 준비 단계입니다</strong>
              <p>
                선택하신 기준({activePref.label}: 거리 {activePref.distW}% / 가격 {activePref.priceW}% / 평점 {activePref.ratingW}%)과 연산된 중심 좌표를 바탕으로 실제 숙소 API 연동 후 추천 리스트가 표시됩니다.
              </p>
            </div>

            <div className="skeletonPreviewTrack">
              <div className="skeletonCardPlaceholder" />
              <div className="skeletonCardPlaceholder" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
