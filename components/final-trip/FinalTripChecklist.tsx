"use client";

import React from "react";

export default function FinalTripChecklist() {
  const checklistItems = [
    { title: "여권 유효기간 확인", desc: "출국일 기준 유효기간이 6개월 이상 남아있는지 확인하세요." },
    { title: "항공편 및 숙소 바우처 확인", desc: "예약한 항공권 E-티켓과 숙소 바우처를 미리 출력하거나 저장하세요." },
    { title: "현지 교통수단 및 결제 수단 준비", desc: "교통카드(SUICA, PASMO 등) 및 현지 통화/트래블카드를 사전 준비하세요." },
    { title: "여행자 보험 가입 여부 확인", desc: "만약의 상해나 도난 사고에 대비해 여행자 보험 가입 상태를점검하세요." },
    { title: "방문 도시 날씨 및 준비물 확인", desc: "현지 기온 및 우천 가능성에 맞는 옷차림과 상비약을 준비하세요." },
  ];

  return (
    <section className="finalTripChecklistSection">
      <div className="sectionHeaderLine">
        <h2>여행 전 체크리스트</h2>
        <span className="subtitleTag">안전한 여행 준비</span>
      </div>

      <div className="checklistGrid">
        {checklistItems.map((item, i) => (
          <div key={i} className="checklistItemCard">
            <span className="checkNumber">0{i + 1}</span>
            <div className="checkTextWrap">
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
