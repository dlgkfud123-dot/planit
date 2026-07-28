"use client";

import Link from "next/link";
import AccountActions from "../../components/auth/AccountActions";
import Footer from "../../components/layout/Footer";

export default function PrivacyPage() {
  return (
    <main className="servicePage privacyWrapper">
      {/* Header */}
      <header className="serviceHeader privacyHeader">
        <div className="privacyHeaderContainer">
          <Link href="/" className="workspaceBrand">
            EYRIA <i>✦</i>
          </Link>
          <nav className="privacyNav">
            <Link href="/">새 여행</Link>
            <Link href="/trips">내 여행</Link>
            <Link href="/about">EYRIA 소개</Link>
            <Link href="/contact">고객센터</Link>
            <AccountActions />
          </nav>
        </div>
      </header>

      <div className="privacyContent">
        {/* Hero */}
        <section className="privacyHero">
          <div className="heroBadge">
            <span>✦</span> LEGAL & PRIVACY POLICY
          </div>
          <h1 className="privacyHeroTitle">개인정보 처리방침</h1>
          <p className="privacyHeroSubtitle">
            EYRIA는 사용자의 개인정보를 소중히 다루며, 투명하고 안전한 서비스를 제공하기 위해 최선을 다합니다.
            본 방침은 Google OAuth 로그인 및 Supabase 기반 서비스 이용 시 수집되는 데이터와 보호 정책을 안내합니다.
          </p>
          <span className="lastUpdated">최종 수정일: 2026년 7월 27일</span>
        </section>

        {/* Policy Grid Cards */}
        <section className="policyGridSection">
          <div className="policyGrid">
            {/* Card 1: 수집 항목 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">Required &amp; Optional Data</span>
                  <h3>1. 수집하는 개인정보 항목</h3>
                </div>
              </div>
              <p className="policyDesc">
                EYRIA는 원활한 회원 서비스 제공 및 기기 간 여행 데이터 동기화를 위해
                Google OAuth 로그인 시 아래 최소한의 정보만을 수집합니다.
              </p>
              <ul className="policyList">
                <li><strong>Google 계정 이메일 (Email)</strong>: 필수 회원 식별자 및 로그인 인증 정보</li>
                <li><strong>Google 프로필 이름 (Name)</strong>: 서비스 내 사용자 닉네임 표시용</li>
                <li><strong>Google 프로필 이미지 (Avatar URL)</strong>: 프로필 사진 표시용 (선택)</li>
                <li><strong>사용자 생성 여행 일정 데이터</strong>: 저장한 여행 도시, 일자, 커스텀 동선 장소 정보</li>
              </ul>
            </div>

            {/* Card 2: 이용 목적 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">Purpose of Use</span>
                  <h3>2. 개인정보 이용 목적</h3>
                </div>
              </div>
              <p className="policyDesc">
                수집된 정보는 다음의 목적 이외의 용도로는 사용되지 않으며, 이용 목적이 변경될 시 사전 동의를 구합니다.
              </p>
              <ul className="policyList">
                <li><strong>사용자 본인 인증 및 계정 관리</strong>: Google OAuth를 통한 안전한 로그인 상태 유지</li>
                <li><strong>여행 일정 저장 및 클라우드 동기화</strong>: PC, 스마트폰, 태블릿 등 멀티 디바이스 간 여행 일정 유지</li>
                <li><strong>서비스 향상 및 고객 지원</strong>: 이용 관련 문의 응대 및 서비스 오류 개선</li>
              </ul>
            </div>

            {/* Card 3: 데이터 저장 및 보안 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">Infrastructure &amp; Security</span>
                  <h3>3. 데이터 저장 및 보안 관리</h3>
                </div>
              </div>
              <p className="policyDesc">
                EYRIA는 세계적인 클라우드 인프라 기반의 보안 환경을 활용하여 회원 데이터를 암호화하여 저장합니다.
              </p>
              <ul className="policyList">
                <li><strong>인증 처리 (Supabase Authentication)</strong>: Google OAuth 토큰 인증 및 보안 처리</li>
                <li><strong>데이터베이스 (Supabase Database)</strong>: 암호화된 보안 DB를 통해 사용자의 저장 일정을 보호</li>
                <li><strong>보안 통신 (TLS/HTTPS)</strong>: 모든 데이터 전송은 SSL/TLS 보안 암호화 프로토콜을 통과합니다.</li>
              </ul>
            </div>

            {/* Card 4: 제3자 제공 및 판매 금지 */}
            <div className="policyCard">
              <div className="policyCardHeader">
                <div>
                  <span className="policyTag">Third-Party &amp; Sale Prohibition</span>
                  <h3>4. 개인정보의 제3자 제공 및 판매 금지</h3>
                </div>
              </div>
              <p className="policyDesc">
                EYRIA는 사용자의 개인정보를 제3자에게 판매, 임대, 마케팅 용도로 제공하거나 공유하지 않습니다.
              </p>
              <ul className="policyList">
                <li>원칙적으로 이용자의 개인정보를 외부에 판매하거나 상업적 용도로 제공하지 않습니다.</li>
                <li>법령의 규정에 의거하거나 수사 목적으로 법률에 정해진 절차와 방법에 따라 요구되는 경우에만 예외로 합니다.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Contact & Rights Box */}
        <section className="privacyContactSection">
          <div className="privacyContactBox">
            <div className="contactBoxContent">
              <h3>개인정보 관련 문의 및 회원 권리</h3>
              <p>
                사용자는 언제든지 자신의 개인정보 조회, 수정, 삭제(회원 탈퇴)를 요청할 수 있습니다.
                개인정보 처리방침에 관한 질문이나 데이터 삭제 요청은 아래 문의 채널로 연락주시면 즉시 조치해드립니다.
              </p>
              <div className="contactEmailPill">
                <strong>문의 이메일:</strong> privacy@eyria.app / support@eyria.app
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
