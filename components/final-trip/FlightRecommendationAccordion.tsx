"use client";

import React, { useState } from "react";

interface Props {
  destination: string;
  start: string;
  end: string;
  people: number;
}

export default function FlightRecommendationAccordion({ destination, start, end, people }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="accordionSection flightAccordionSection">
      <button
        type="button"
        className="accordionHeaderBtn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="accordionTitleText">AI 추천 항공권</span>
        <span className="chevronIcon">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="accordionBodyContent">
          <div className="flightParamsCard">
            <h4>항공권 검색 조회 파라미터</h4>
            <div className="paramsGrid">
              <div className="paramItem">
                <span>출발지</span>
                <strong>인천 / 서울 (ICN / SEL)</strong>
              </div>
              <div className="paramItem">
                <span>목적지</span>
                <strong>{destination || "목적지"}</strong>
              </div>
              <div className="paramItem">
                <span>출국일 ~ 귀국일</span>
                <strong>{start && end ? `${start} ~ ${end}` : "일정 미지정"}</strong>
              </div>
              <div className="paramItem">
                <span>탑승 인원</span>
                <strong>{people > 0 ? `${people}명` : "1명"}</strong>
              </div>
            </div>
          </div>

          <div className="apiIntegrationNoticeBox">
            <div className="providerNoticeText">
              <strong>Google Flights Live Search (SerpAPI) 실시간 연동 중입니다</strong>
              <p>
                검색 조건에 맞춰 실시간으로 정규화된 왕복 항공권 스케줄 및 가격 정보가 조회되며, 패키지 엔진 계산에 반영됩니다.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
