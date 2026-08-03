"use client";

import React from "react";
import type { GeneratedDay } from "../../utils/itineraryGenerator";

interface Props {
  destination: string;
  days: GeneratedDay[];
}

export default function FinalTripSummaryText({ destination, days }: Props) {
  const dayCount = days.length;
  const totalStops = days.reduce((sum, d) => sum + d.stops.length, 0);

  return (
    <section className="finalTripSummaryTextSection">
      <div className="sectionHeaderLine">
        <h2>AI 여행 총평</h2>
        <span className="subtitleTag">일정 분석 리포트</span>
      </div>
      <div className="summaryTextBlock">
        <p>
          {destination} {dayCount}일간의 일정으로 총 {totalStops}곳의 대표 명소와 현지 경험을 무리 없는 동선으로 구성했습니다.
        </p>
        <p>
          낮에는 주요 관광지를 중심으로 이동하고, 저녁에는 여유로운 일정이 이어지도록 안정적인 시각대 배치를 반영했습니다.
        </p>
      </div>
    </section>
  );
}
