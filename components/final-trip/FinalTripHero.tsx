"use client";

import React from "react";
import { cityByName } from "../../data/cities";

interface Props {
  destination: string;
  start: string;
  end: string;
  people: number;
  budget: number;
  conceptSummary?: string;
}

export default function FinalTripHero({ destination, start, end, people, budget, conceptSummary }: Props) {
  const cityData = cityByName[destination];
  const cityHeroPhoto = cityData?.heroImage || cityData?.image || "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1600&q=82";

  return (
    <section className="finalTripHeroPremium">
      {/* Background City Hero Image (Supporting element) */}
      <div className="heroImageWrap">
        <img src={cityHeroPhoto} alt={destination} className="heroCityImg" />
        <div className="heroGradientOverlay" />
      </div>

      {/* Typography-Centric Content (Main protagonist) */}
      <div className="heroContentBox">
        <div className="heroStepBadgeRow">
          <span className="stepBadgeText">STEP 4 • TRIP SUMMARY</span>
          {conceptSummary && <span className="conceptTagBadge">{conceptSummary}</span>}
        </div>

        <h1 className="heroMainTitle">
          {destination || "여행"} 여행 준비가 완료되었습니다.
        </h1>

        <p className="heroSubDescription">
          AI 추천 일정과 동선 분석이 완료된 {destination} 전용 여행서입니다.
        </p>

        <div className="heroMetaPillRow">
          <div className="metaPill">
            <span className="pillLabel">여행 기간</span>
            <strong className="pillValue">{start && end ? `${start} ~ ${end}` : "기간 미지정"}</strong>
          </div>

          <div className="metaPill">
            <span className="pillLabel">여행 인원</span>
            <strong className="pillValue">{people > 0 ? `${people}명` : "2명"}</strong>
          </div>

          <div className="metaPill">
            <span className="pillLabel">여행 예산</span>
            <strong className="pillValue">{budget > 0 ? `${budget}만원` : "120만원"}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
