"use client";

import React, { useEffect, useState } from "react";
import { readDraftById, type TripSnapshot } from "../../utils/tripStorage";
import type { BookingSnapshot } from "../../types/booking";
import { readBookingSnapshot } from "../../utils/bookingSnapshot";
import FinalTripPage from "../../components/final-trip/FinalTripPage";

export default function SummaryRoutePage() {
  const [snapshot, setSnapshot] = useState<TripSnapshot | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [bookingSnapshot, setBookingSnapshot] = useState<BookingSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
    if (cancelled) return;
    if (typeof window === "undefined") return;

    const q = new URLSearchParams(window.location.search);
    const draftParam = q.get("draft");

    if (draftParam) {
      const data = readDraftById(draftParam);
      const booking = readBookingSnapshot(sessionStorage, draftParam);
      const matchesTrip = Boolean(
        data && booking && data.id === draftParam && data.plan.length > 0 &&
        data.destination === booking.destinationId &&
        data.start === booking.checkIn && data.end === booking.checkOut &&
        data.people === booking.passengerCount
      );
      if (data && booking && matchesTrip) {
        setDraftId(draftParam);
        setSnapshot(data);
        setBookingSnapshot(booking);
        setLoaded(true);
        return;
      }
    }
    setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded) return null;

  if (!snapshot || !bookingSnapshot) {
    return (
      <div style={{ padding: "80px", textAlign: "center", background: "#F8FAFC", minHeight: "100vh" }}>
        <h2 style={{ fontSize: "18px", color: "#64748B" }}>확정된 여행 정보가 없습니다. 항공편과 숙소를 선택한 뒤 다시 시도해주세요.</h2>
      </div>
    );
  }

  return <FinalTripPage snapshot={snapshot} draftId={draftId} bookingSnapshot={bookingSnapshot} />;
}
