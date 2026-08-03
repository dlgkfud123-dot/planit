"use client";

import React from "react";
import type { TripStatsResult } from "../../utils/summaryCalculator";

interface Props {
  stats: TripStatsResult;
}

export default function FinalTripStats({ stats }: Props) {
  const stylesList = [
    { label: "문화", pct: stats.styleAnalysis.culturePct },
    { label: "미식", pct: stats.styleAnalysis.foodPct },
    { label: "쇼핑", pct: stats.styleAnalysis.shoppingPct },
    { label: "자연", pct: stats.styleAnalysis.naturePct },
    { label: "야경", pct: stats.styleAnalysis.nightPct },
  ];

  return (
    <section className="finalTripStatsSection">
      <div className="sectionHeaderLine">
        <h2>여행 상세 통계 & 스타일 분석</h2>
        <span className="subtitleTag">실제 연산 데이터 분석</span>
      </div>

      {/* Enhanced Statistics Grid */}
      <div className="statsGrid">
        <div className="statCard">
          <span className="statCardLabel">총 일정 일수</span>
          <span className="statCardValue">{stats.totalDays}일</span>
        </div>
        <div className="statCard">
          <span className="statCardLabel">총 방문 장소</span>
          <span className="statCardValue">{stats.totalStops}개소</span>
        </div>
        <div className="statCard">
          <span className="statCardLabel">총 예상 경비</span>
          <span className="statCardValue">약 {Math.round(stats.totalEstimatedCostKrw / 10000)}만원</span>
        </div>
        <div className="statCard">
          <span className="statCardLabel">하루 평균 경비</span>
          <span className="statCardValue">약 {Math.round(stats.dailyAvgCostKrw / 10000)}만원</span>
        </div>
        <div className="statCard">
          <span className="statCardLabel">총 이동 거리</span>
          <span className="statCardValue">약 {stats.totalDistanceKm}km</span>
        </div>
        <div className="statCard">
          <span className="statCardLabel">총 이동 시간</span>
          <span className="statCardValue">약 {stats.totalTransitTimeMinutes}분</span>
        </div>
        <div className="statCard highlightCard">
          <span className="statCardLabel">이동 최다 DAY</span>
          <span className="statCardValue textHighlight">{stats.mostBusyDayLabel}</span>
        </div>
        <div className="statCard highlightCard">
          <span className="statCardLabel">가장 여유로운 DAY</span>
          <span className="statCardValue textHighlight">{stats.mostRelaxedDayLabel}</span>
        </div>
      </div>

      {/* EYRIA Travel Style Analysis Card (Horizontal Progress Bars Only) */}
      <div className="styleAnalysisCard">
        <div className="cardTitleRow">
          <h3>EYRIA 여행 스타일 분석</h3>
          <span className="cardSubNote">장소 카테고리 비중 분석</span>
        </div>

        <div className="styleBarsList">
          {stylesList.map((item) => (
            <div key={item.label} className="styleBarRow">
              <div className="styleBarMeta">
                <span className="styleLabel">{item.label}</span>
                <span className="styleValue">{item.pct}%</span>
              </div>
              <div className="styleTrack">
                <div className="styleFill" style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Transit Breakdown Bar */}
      <div className="transitBreakdownCard">
        <h3>이동수단 비중</h3>
        <div className="transitBarTrack">
          <div className="transitBarSegment walk" style={{ width: `${stats.walkRatioPct}%` }} />
          <div className="transitBarSegment transit" style={{ width: `${stats.transitRatioPct}%` }} />
          <div className="transitBarSegment taxi" style={{ width: `${stats.taxiRatioPct}%` }} />
        </div>
        <div className="transitLegendRow">
          <span className="legendItem walk">도보 이동 {stats.walkRatioPct}%</span>
          <span className="legendItem transit">대중교통 {stats.transitRatioPct}%</span>
          <span className="legendItem taxi">택시/차량 {stats.taxiRatioPct}%</span>
        </div>
      </div>
    </section>
  );
}
