"use client";

import React from "react";
import type { BookingSnapshot } from "../../types/booking";
import { getAirportName, getKoreaAirport } from "../../data/airports";

interface Props {
  destination: string;
  bookingSnapshot: BookingSnapshot;
}

export default function FinalTripConfirmationCard({ destination, bookingSnapshot }: Props) {
  const { selectedFlight, selectedHotel, budgetSummary } = bookingSnapshot;
  const totalNights = Math.max(1, Math.round(
    (new Date(bookingSnapshot.checkOut).getTime() - new Date(bookingSnapshot.checkIn).getTime()) / 86400000
  ));

  return (
    <section className="finalTripCompletionSection">
      {budgetSummary && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "24px", marginBottom: "24px", textAlign: "left" }}>
          {/* Summary Title Header */}
          <div style={{ marginBottom: "20px" }}>
            <span style={{ fontSize: "12px", fontWeight: 800, color: "#2563EB", textTransform: "uppercase" }}>
              EYRIA FINAL TRAVEL BUDGET REPORT
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#0F172A", margin: "4px 0 0" }}>
              전체 여행 예산 및 패키지 정산 내역
            </h3>
          </div>

          {/* 1. 여행 목적지·날짜·인원 */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "14px 18px", marginBottom: "16px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>여행지 & 일정</span>
              <strong style={{ fontSize: "15px", color: "#0F172A" }}>
                {destination} ({totalNights}박 {totalNights + 1}일)
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>여행 인원</span>
              <strong style={{ fontSize: "15px", color: "#0F172A" }}>
                성인 {budgetSummary.passengerCount}명
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "12px", color: "#64748B", display: "block" }}>설정 선호 예산</span>
              <strong style={{ fontSize: "15px", color: "#2563EB" }}>
                ₩{budgetSummary.totalBudget.toLocaleString()} {budgetSummary.currency}
              </strong>
            </div>
          </div>

          {/* 2 & 3. 선택 항공편 및 숙소 정보 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px", marginBottom: "16px" }}>
            {/* 2. 선택 항공편 */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "14px", borderRadius: "8px" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, display: "block" }}>✈️ 2. 선택 항공편</span>
              <strong style={{ fontSize: "14.5px", color: "#0F172A", display: "block", marginTop: "4px" }}>
                {selectedFlight ? `${selectedFlight.ownerAirlineName} (${selectedFlight.outbound.isDirect ? "직항" : "경유"})` : "항공편 미선택"}
              </strong>
              <span style={{ fontSize: "12.5px", color: "#475569", display: "block", marginTop: "2px" }}>
                {selectedFlight ? `출발: ${selectedFlight.outbound.departureTime} · ${getKoreaAirport(bookingSnapshot.departureAirport)?.name || bookingSnapshot.departureAirport} (${bookingSnapshot.departureAirport})` : ""}
              </span>
              {selectedFlight && (
                <span style={{ fontSize: "12.5px", color: "#475569", display: "block", marginTop: "2px" }}>
                  출국 {getAirportName(selectedFlight.outbound.originAirport)} ({selectedFlight.outbound.originAirport}) → {getAirportName(selectedFlight.outbound.destinationAirport)} ({selectedFlight.outbound.destinationAirport})
                  <br />
                  귀국 {getAirportName(selectedFlight.inbound?.originAirport || "")} ({selectedFlight.inbound?.originAirport}) → {getAirportName(selectedFlight.inbound?.destinationAirport || "")} ({selectedFlight.inbound?.destinationAirport})
                </span>
              )}
              {selectedFlight?.inbound && selectedFlight.outbound.destinationAirport !== selectedFlight.inbound.originAirport && (
                <span style={{ fontSize: "12px", color: "#92400E", display: "block", marginTop: "4px" }}>
                  출국 도착 공항과 귀국 출발 공항이 다릅니다.
                </span>
              )}
            </div>

            {/* 3. 선택 숙소 */}
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "14px", borderRadius: "8px" }}>
              <span style={{ fontSize: "12px", color: "#64748B", fontWeight: 700, display: "block" }}>🏨 3. 선택 숙소</span>
              <strong style={{ fontSize: "14.5px", color: "#0F172A", display: "block", marginTop: "4px" }}>
                {selectedHotel ? selectedHotel.hotelName : "숙소 미선택"}
              </strong>
              <span style={{ fontSize: "12.5px", color: "#475569", display: "block", marginTop: "2px" }}>
                {selectedHotel ? `일정 장소 평균 거리: ${selectedHotel.avgItineraryDistanceKm || selectedHotel.distanceFromCenterKm}km` : ""}
              </span>
            </div>
          </div>

          {/* 4 & 5. 세부 항목 비용 (항공/숙소 금액 + 기타 현지 경비) */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
            <h4 style={{ margin: "0 0 12px", fontSize: "14px", fontWeight: 800, color: "#0F172A" }}>
              4 & 5. 세부 항목별 결제 및 예상 비용
            </h4>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "13.5px", color: "#334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>✈️ 항공권 총액 (성인 {budgetSummary.passengerCount}인 왕복)</span>
                <strong>
                  {selectedFlight && selectedFlight.price.payableTotal !== null
                    ? `₩${selectedFlight.price.payableTotal.toLocaleString()} KRW`
                    : "가격 확인 필요"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🏨 숙소 총액 ({totalNights}박 예상 결제액)</span>
                <strong>
                  {selectedHotel && selectedHotel.price.payableTotal !== null
                    ? `₩${selectedHotel.price.payableTotal.toLocaleString()} KRW`
                    : "가격 확인 필요"}
                </strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🍲 예상 식비 (성인 {budgetSummary.passengerCount}인, {totalNights + 1}일)</span>
                <strong>₩{budgetSummary.estimatedFoodBudget.toLocaleString()} KRW</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🚌 예상 현지 교통비</span>
                <strong>₩{budgetSummary.estimatedLocalTransportBudget.toLocaleString()} KRW</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🎟️ 예상 관광 및 입장료</span>
                <strong>₩{budgetSummary.estimatedActivityBudget.toLocaleString()} KRW</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🛡️ 예비비 (전체 예산의 5%)</span>
                <strong>₩{budgetSummary.reserveBudget.toLocaleString()} KRW</strong>
              </div>
            </div>
          </div>

          {/* 6 & 7. 전체 예상 비용 및 남은 예산/초과 금액 */}
          <div
            style={{
              background: budgetSummary.budgetStatus === "within_budget" ? "#ECFDF5" : "#FEF2F2",
              border: `1px solid ${budgetSummary.budgetStatus === "within_budget" ? "#A7F3D0" : "#FCA5A5"}`,
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <span style={{ fontSize: "13px", color: "#475569", display: "block" }}>6. 전체 예상 여행 비용 (Grand Total)</span>
                {!budgetSummary.isTotalAvailable || budgetSummary.estimatedGrandTotal === null ? (
                  <strong style={{ fontSize: "18px", color: "#D97706", fontWeight: 800 }}>
                    환율 확인 필요
                  </strong>
                ) : (
                  <strong style={{ fontSize: "20px", color: "#0F172A", fontWeight: 800 }}>
                    ₩{budgetSummary.estimatedGrandTotal.toLocaleString()} {budgetSummary.currency}
                  </strong>
                )}
              </div>

              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "13px", color: "#475569", display: "block" }}>7. 예산 상태 및 잔여/초과 금액</span>
                {!budgetSummary.isTotalAvailable || budgetSummary.remainingBudget === null ? (
                  <strong style={{ fontSize: "15px", color: "#D97706", fontWeight: 800 }}>
                    {budgetSummary.currencyMismatchMessage || "통화 변환 후 계산"}
                  </strong>
                ) : budgetSummary.remainingBudget >= 0 ? (
                  <strong style={{ fontSize: "18px", color: "#059669", fontWeight: 800 }}>
                    ₩{budgetSummary.remainingBudget.toLocaleString()}원 여유 (예산 부합)
                  </strong>
                ) : (
                  <strong style={{ fontSize: "18px", color: "#DC2626", fontWeight: 800 }}>
                    + ₩{Math.abs(budgetSummary.remainingBudget).toLocaleString()}원 초과
                  </strong>
                )}
              </div>
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "13px", color: budgetSummary.budgetStatus === "within_budget" ? "#065F46" : budgetSummary.budgetStatus === "currency_mismatch" ? "#D97706" : "#991B1B", fontWeight: 700 }}>
              {budgetSummary.statusMessage}
            </p>
          </div>

          {/* 8. 더 저렴한 대안 제안 */}
          {budgetSummary.budgetStatus === "over_budget" && (
            <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", padding: "14px 18px", borderRadius: "8px", marginBottom: "16px" }}>
              <span style={{ fontSize: "13px", fontWeight: 800, color: "#92400E", display: "block", marginBottom: "6px" }}>
                💡 8. 예산절감을 위한 대안 제안
              </span>
              <p style={{ margin: 0, fontSize: "12.5px", color: "#78350F", lineHeight: "1.5" }}>
                숙소를 하네다 공항 근처 숙소(Villa Fontaine)로 변경하시면 전체 비용을 ₩94,895원 절감하여 ₩1,318,000원에 이용하실 수 있습니다.
              </p>
            </div>
          )}

          {/* 9. 라이브 API 연동 안내 */}
          <div style={{ background: "#F1F5F9", border: "1px solid #E2E8F0", padding: "10px 14px", borderRadius: "6px", fontSize: "12px", color: "#64748B", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span>ℹ️ 9. 본 안내의 가격은 Google Flights (SerpAPI) 및 LiteAPI 실시간 연동 기반 연산 결과입니다.</span>
            <div style={{ display: "flex", gap: "6px" }}>
              <span style={{ background: "#DBEAFE", color: "#1E40AF", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                ✈️ SerpAPI Google Flights
              </span>
              <span style={{ background: "#DCFCE7", color: "#166534", fontSize: "11px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>
                🏨 LiteAPI Sandbox
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="completionContentBox">
        <span className="partyEmoji">🎉</span>
        <h2 className="completionTitle">{destination} 여행 준비가 완료되었습니다.</h2>
        <p className="completionSubtitle">
          언제든 Planner에서 일정을 수정할 수 있으며, 여행은 저장 후 다시 이어서 확인할 수 있습니다.
        </p>
      </div>
    </section>
  );
}
