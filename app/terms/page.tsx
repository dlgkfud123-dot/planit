"use client";

import Link from "next/link";
import AccountActions from "../../components/auth/AccountActions";
import Footer from "../../components/layout/Footer";

export default function TermsPage() {
  return (
    <main className="servicePage termsWrapper">
      {/* Header */}
      <header className="serviceHeader termsHeader">
        <div className="termsHeaderContainer">
          <Link href="/" className="workspaceBrand">
            EYRIA <i>✦</i>
          </Link>
          <nav className="termsNav">
            <Link href="/">새 여행</Link>
            <Link href="/trips">내 여행</Link>
            <Link href="/about">EYRIA 소개</Link>
            <Link href="/contact">고객센터</Link>
            <AccountActions />
          </nav>
        </div>
      </header>

      <div className="termsContent">
        {/* Hero */}
        <section className="termsHero">
          <div className="heroBadge">
            <span>✦</span> TERMS OF SERVICE
          </div>
          <h1 className="termsHeroTitle">서비스 이용약관</h1>
          <p className="termsHeroSubtitle">
            EYRIA 서비스를 이용해주셔서 감사합니다. 본 약관은 EYRIA가 제공하는 여행 일정 설계 서비스의
            이용 조건 및 절차, 이용자와 서비스 간의 권리와 의무 사항을 안내합니다.
          </p>
          <span className="lastUpdated">최종 수정일: 2026년 7월 27일</span>
        </section>

        {/* Terms Grid Cards */}
        <section className="policyGridSection">
          <div className="policyGrid">
            {/* Card 1: 서비스 목적 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">Service Purpose</span>
                  <h3>1. 서비스의 목적 및 개요</h3>
                </div>
              </div>
              <p className="policyDesc">
                EYRIA는 목적지 및 여행 조건을 바탕으로 장소 큐레이션 및 경로 최적화 알고리즘을 활용하여
                사용자에게 맞춤형 여행 일정 초안을 제공하고 편집할 수 있도록 돕는 서비스입니다.
              </p>
            </div>

            {/* Card 2: 사용자 책임 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">User Responsibilities</span>
                  <h3>2. 사용자의 의무 및 책임</h3>
                </div>
              </div>
              <p className="policyDesc">
                이용자는 관계 법령, 본 약관의 규정, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 하며,
                타인의 권리를 침해하거나 서비스 운영을 방해하는 행위를 해서는 안 됩니다.
              </p>
            </div>

            {/* Card 3: 여행 정보 참고용 안내 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">Information Disclaimer</span>
                  <h3>3. 여행 정보의 참고용 성격 고지</h3>
                </div>
              </div>
              <p className="policyDesc">
                EYRIA에서 제공되는 장소 운영시간, 예상 이동시간, 추정 비용 등의 정보는 정적 데이터베이스에 기반한
                <strong>참고용 데이터</strong>입니다.
              </p>
              <ul className="policyList">
                <li>현지 기상 상황, 교통 체증, 각 장소의 임시 휴무 등에 따라 실제 상황과 다를 수 있습니다.</li>
                <li>실제 장소 방문 및 대중교통 이용 전에는 각 기관 및 시설의 <strong>공식 안내 채널을 반드시 재확인</strong>해주시기 바랍니다.</li>
              </ul>
            </div>

            {/* Card 4: 예약 서비스 미제공 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">No Booking Services</span>
                  <h3>4. 결제 및 예약 서비스 미제공</h3>
                </div>
              </div>
              <p className="policyDesc">
                EYRIA는 일정 기획 및 동선 구성 도구이며, 항공권, 숙박, 티켓 등의 <strong>직접적인 결제나 예약 중개 서비스를 제공하지 않습니다.</strong>
              </p>
              <ul className="policyList">
                <li>예약 및 결제 건은 각 항공사, 호텔, 여행사 등 해당 공식 판매처를 이용하셔야 합니다.</li>
                <li>EYRIA는 제3자 예약 거래 시 발생하는 분쟁에 대해 책임을 지지 않습니다.</li>
              </ul>
            </div>

            {/* Card 5: 서비스 변경 및 중단 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">Service Updates</span>
                  <h3>5. 서비스의 변경 및 업데이트</h3>
                </div>
              </div>
              <p className="policyDesc">
                EYRIA는 향상된 서비스 제공을 위해 서비스 내용의 일부 또는 전부를 수정하거나 업데이트할 수 있으며,
                중대한 변경 사항이 있는 경우 웹사이트 공지를 통해 안내합니다.
              </p>
            </div>
          </div>
        </section>

        {/* Contact & Support Box */}
        <section className="privacyContactSection">
          <div className="privacyContactBox">
            <div className="contactBoxContent">
              <h3>약관 관련 문의</h3>
              <p>
                본 이용약관에 대해 문의 사항이나 개선 의견이 있으신 경우 언제든 고객지원 팀으로 연락주시기 바랍니다.
              </p>
              <div className="contactEmailPill">
                <strong>문의 이메일:</strong> support@eyria.app
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
