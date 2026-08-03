"use client";

import React, { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { findCity, type CityProfileLevel, type CityTravelProfile } from "../../data/cities";

interface Props {
  cityName: string;
  onClose: () => void;
  onSelectCity?: (cityName: string) => void;
}

function formatLevelLabel(level: CityProfileLevel) {
  switch (level) {
    case "very-high":
      return "매우 높음";
    case "high":
      return "높음";
    case "medium":
      return "보통";
    case "low":
      return "낮음";
  }
}

function getLevelPercent(level: CityProfileLevel) {
  switch (level) {
    case "very-high":
      return 92;
    case "high":
      return 72;
    case "medium":
      return 48;
    case "low":
      return 24;
  }
}

export default function CityDetailModal({ cityName, onClose, onSelectCity }: Props) {
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );
  const city = findCity(cityName);

  useEffect(() => {
    // Prevent body scrolling behind modal
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Escape key listener for fast closing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  if (!mounted) return null;

  const modalContent = (
    <div
      className="cityModalOverlay"
      onClick={onClose}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(15, 23, 42, 0.72)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        zIndex: 999999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    >
      <div
        className="cityModalContainer"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          zIndex: 1000000,
        }}
      >
        {/* Header Bar */}
        <div className="cityModalHeader">
          <div className="titleGroup">
            <span className="cityCountryTag">{city ? `${city.country} · ${city.en}` : "여행지 큐레이션"}</span>
            <h2>{city ? city.name : cityName}</h2>
          </div>
          <button type="button" onClick={onClose} className="cityModalCloseBtn" aria-label="닫기">
            ✕
          </button>
        </div>

        {!city ? (
          <div className="cityModalBody" style={{ padding: "40px 24px", textAlign: "center" }}>
            <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "20px" }}>
              요청하신 도시({cityName})의 상세 정보를 확인할 수 없습니다.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#0F172A",
                color: "#FFFFFF",
                padding: "12px 28px",
                borderRadius: "14px",
                border: "none",
                fontWeight: "750",
                cursor: "pointer",
              }}
            >
              닫기
            </button>
          </div>
        ) : (
          <>
            {/* Hero Image Section */}
            <div className="cityHeroFrame">
              <Image
                src={city.heroImage || city.image}
                alt={city.name}
                fill
                unoptimized
                priority
                className="cityHeroImg"
              />
              {city.tagline && (
                <div className="cityTaglineOverlay">
                  <p>{city.tagline}</p>
                </div>
              )}
            </div>

            {/* Content Section */}
            <div className="cityModalBody">
              {/* cityMood: 도시 분위기 키워드 (Pill 태그 형태) */}
              {city.cityMood && city.cityMood.length > 0 && (
                <div className="cityMoodRow" aria-label="도시 분위기 키워드">
                  {city.cityMood.map((mood) => (
                    <span key={mood} className="moodPillTag">
                      #{mood}
                    </span>
                  ))}
                </div>
              )}

              {/* 1. 이 도시가 잘 맞는 여행 스타일 (recommendedFor) */}
              {city.recommendedFor && (
                <div className="recommendedForBlock">
                  <div className="recBlockHeader">
                    <span className="recBadge">추천 여행자 유형</span>
                    <span className="recSubtag">이 도시가 잘 맞는 여행 스타일</span>
                  </div>
                  <div className="recTargetList">
                    <ul>
                      {city.recommendedFor.reasons.map((reason, idx) => (
                        <li key={idx}>• {reason}</li>
                      ))}
                    </ul>
                  </div>
                  <p className="recSummaryNote">{city.recommendedFor.summary}</p>
                </div>
              )}

              {/* 2. 도시 소개 개요 */}
              <div className="cityDescBlock">
                <h3>도시 큐레이션 개요</h3>
                <p className="cityDescText">
                  {city.description ||
                    `${city.name}은(는) ${city.country}의 독특한 문화와 풍경을 간직한 도시로, 도심 탐방과 인근 권역 이동이 잘 짜여진 여행지입니다.`}
                </p>
              </div>

              {/* 3. 핵심 정보 그리드 */}
              <div className="cityMetaGrid">
                <div className="cityMetaItem spanTwo">
                  <div className="metaHeadRow">
                    <span className="metaLabel">권장 체류 기간</span>
                    <strong className="metaValue">{city.recommendedDays || "3~5일"}</strong>
                  </div>
                  {city.recommendedDaysReason && (
                    <p className="metaSubReason">{city.recommendedDaysReason}</p>
                  )}
                </div>

                <div className="cityMetaItem">
                  <span className="metaLabel">추천 여행 시기</span>
                  <strong className="metaValue">{city.bestSeason || "사계절"}</strong>
                </div>

                <div className="cityMetaItem">
                  <span className="metaLabel">대표 권역</span>
                  <strong className="metaValue">{(city.keyAreas || [city.name]).join(" · ")}</strong>
                </div>
              </div>

              {/* 4. 여행 특성 강도 (travelProfile) */}
              {city.travelProfile && city.travelProfile.length > 0 && (
                <div className="cityTravelProfileBlock">
                  <div className="sectionHeadRow">
                    <h3>여행 특성 강도</h3>
                    <span className="sectionNotice">도시 간 비교를 위한 표준 특성 지표입니다.</span>
                  </div>
                  <div className="travelProfileGrid">
                    {city.travelProfile.map((item: CityTravelProfile) => (
                      <div key={item.label} className="profileCard">
                        <div className="profileInfoRow">
                          <span className="profileLabel">{item.label}</span>
                          <span className={`profileLevelBadge level-${item.level}`}>
                            {formatLevelLabel(item.level)}
                          </span>
                        </div>
                        <div className="profileTrack">
                          <div
                            className={`profileBar level-${item.level}`}
                            style={{ width: `${getLevelPercent(item.level)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. 도시 핵심 특징 3가지 (Highlights) */}
              {city.highlights && city.highlights.length > 0 && (
                <div className="cityHighlightsBlock">
                  <h3>도시 핵심 특징 3가지</h3>
                  <ul className="highlightsList">
                    {city.highlights.map((highlight, idx) => (
                      <li key={idx} className="highlightItem">
                        <span className="numTag">0{idx + 1}</span>
                        <span className="text">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 6. 여행 전 알아두기 (travelNotes) */}
              {city.travelNotes && city.travelNotes.length > 0 && (
                <div className="cityNotesBlock">
                  <span className="subNoteTitle">여행 전 알아두기 (현장 팁)</span>
                  <ul className="notesList">
                    {city.travelNotes.map((note, idx) => (
                      <li key={idx} className="noteItem">
                        • {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Footer */}
              <div className="cityModalFooter">
                {onSelectCity ? (
                  <button
                    type="button"
                    className="selectCityPrimaryBtn"
                    onClick={() => {
                      onSelectCity(city.name);
                      onClose();
                    }}
                  >
                    {city.name} 일정 생성하기
                  </button>
                ) : (
                  <button
                    type="button"
                    className="selectCityPrimaryBtn"
                    onClick={onClose}
                    style={{ background: "#0F172A", color: "#FFFFFF" }}
                  >
                    ✕ {city.name} 도시 정보 닫기
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
