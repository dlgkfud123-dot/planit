"use client";

import React, { useMemo } from "react";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import type { TripSnapshot } from "../../utils/tripStorage";
import type { BookingSnapshot } from "../../types/booking";
import { calculateTripStats } from "../../utils/summaryCalculator";

import FinalTripHero from "./FinalTripHero";
import FinalTripSummaryText from "./FinalTripSummaryText";
import FinalTripDayCards from "./FinalTripDayCards";
import FinalTripStats from "./FinalTripStats";
import FinalTripConfirmationCard from "./FinalTripConfirmationCard";
import FinalTripActions from "./FinalTripActions";

interface Props {
  snapshot: TripSnapshot;
  draftId?: string | null;
  bookingSnapshot: BookingSnapshot;
}

export default function FinalTripPage({ snapshot, draftId, bookingSnapshot }: Props) {
  const days = snapshot.plan;
  const destination = snapshot.destination || "여행지";
  const start = snapshot.start || "";
  const end = snapshot.end || "";
  const people = snapshot.people || 1;
  const budget = snapshot.budget || 0;

  // Real calculations (NO FAKE DATA)
  const stats = useMemo(() => calculateTripStats(days, people, destination), [days, people, destination]);

  return (
    <div className="finalTripSummaryPageWrapper">
      <Header />

      <main className="finalTripSummaryMainContainer">
        {/* 1. Premium Final Trip Hero (Includes City Hero Image + Typography) */}
        <FinalTripHero
          destination={destination}
          start={start}
          end={end}
          people={people}
          budget={budget}
          conceptSummary={stats.conceptSummary}
        />

        {/* 2. AI 여행 총평 */}
        <FinalTripSummaryText destination={destination} days={days} />

        {/* 3. DAY별 일정 요약 (Bullet points + Expand/Collapse) */}
        <FinalTripDayCards destination={destination} days={days} />

        {/* 4. 여행 상세 통계 & EYRIA 여행 스타일 분석 리포트 */}
        <FinalTripStats stats={stats} />

        {/* 5. 여행 준비 완료 Completion Section */}
        <FinalTripConfirmationCard destination={destination} bookingSnapshot={bookingSnapshot} />

        {/* 6. 하단 Primary Action (여행 저장하기 강조) */}
        <FinalTripActions draftId={draftId} />
      </main>

      <Footer />
    </div>
  );
}
