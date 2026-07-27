"use client";

import Link from "next/link";
import AccountActions from "../../components/auth/AccountActions";
import Footer from "../../components/layout/Footer";

export default function AboutPage() {
  return (
    <main className="servicePage aboutWrapper">
      {/* Header */}
      <header className="serviceHeader aboutHeader">
        <div className="aboutHeaderContainer">
          <Link href="/" className="workspaceBrand">
            PLANIT <i>✦</i>
          </Link>
          <nav className="aboutNav">
            <Link href="/">새 여행</Link>
            <Link href="/trips">내 여행</Link>
            <Link href="/about" className="active">
              PLANIT 소개
            </Link>
            <Link href="/contact">고객센터</Link>
            <AccountActions />
          </nav>
        </div>
      </header>

      <div className="aboutContent">
        {/* 1. Hero Section */}
        <section className="aboutHero">
          <div className="heroBadge">
            <span>✦</span> INTELLIGENT TRAVEL ARCHITECTURE
          </div>
          <h1 className="aboutHeroTitle">
            여행의 시작을 가장 가볍고 <br className="desktopOnlyBreak" />
            스마트하게 설계합니다
          </h1>
          <p className="aboutHeroSubtitle">
            PLANIT은 2,500개 이상의 검증된 장소 데이터와 실시간 도로 경로(OpenRouteService)
            엔진을 기반으로 복잡한 여행 준비를 3초 만에 완벽한 일정 초안으로 완성합니다.
          </p>
        </section>

        {/* 2. Brand Intro Section */}
        <section className="aboutBrandSection">
          <div className="brandGrid">
            <div className="brandCard">
              <span className="brandCardIcon">🚀</span>
              <h3>초안은 AI가, 완성은 당신이</h3>
              <p>
                복잡한 블로그 탐색과 지도 핑퐁 없이, AI가 목적지에 맞는 검증된 동선과
                시간 배치를 제안합니다. 제안된 일정은 내 마음대로 자유롭게 다듬을 수 있습니다.
              </p>
            </div>
            <div className="brandCard">
              <span className="brandCardIcon">🗺️</span>
              <h3>실제 이동 경로에 기반한 최적화</h3>
              <p>
                단순 직선 거리가 아닌 도보, 대중교통, 차량 이동 시간을 계산하여 무리 없는
                여유로운 타임라인을 설계합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Core Features Section */}
        <section className="aboutFeaturesSection">
          <div className="sectionHeader">
            <span className="sectionTag">CORE FEATURES</span>
            <h2>PLANIT이 제공하는 핵심 기능</h2>
          </div>
          <div className="featuresGrid">
            <div className="featureCardItem">
              <div className="featureIcon">📍</div>
              <h4>2,500+ 엄선 장소 큐레이션</h4>
              <p>
                전 세계 주요 25개국 100여 개 도시의 대표 명소, 맛집, 카페, 숙소 정보를
                체계적으로 큐레이션하여 제공합니다.
              </p>
            </div>
            <div className="featureCardItem">
              <div className="featureIcon">🛣️</div>
              <h4>실시간 도로 경로 계산</h4>
              <p>
                OpenRouteService API를 연동하여 실제 도로 네트워크 기반의 이동 경로와
                예상 이동 소요 시간을 정밀하게 산출합니다.
              </p>
            </div>
            <div className="featureCardItem">
              <div className="featureIcon">✏️</div>
              <h4>자유로운 드래그 앤 드롭 편집</h4>
              <p>
                DAY 순서 변경, 장소 추가 및 삭제, 시간 조정까지 직관적인 UI로 손쉽게
                수정하고 커스텀 일정을 만듭니다.
              </p>
            </div>
            <div className="featureCardItem">
              <div className="featureIcon">☁️</div>
              <h4>모든 기기 클라우드 자동 동기화</h4>
              <p>
                Supabase 데이터베이스 연동으로 PC에서 계획한 일정을 스마트폰과 태블릿에서
                언제든 이어서 확인하고 저장할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 4. AI Workflow Section */}
        <section className="aboutWorkflowSection">
          <div className="sectionHeader">
            <span className="sectionTag">WORKFLOW</span>
            <h2>여행 일정이 만들어지는 4단계 과정</h2>
          </div>
          <div className="workflowSteps">
            <div className="workflowStep">
              <div className="stepNumber">01</div>
              <div className="stepContent">
                <h4>목적지 & 여행 조건 선택</h4>
                <p>여행할 국가와 도시, 시작일/종료일, 예산, 동행자 및 여행 스타일을 선택합니다.</p>
              </div>
            </div>
            <div className="workflowArrow">→</div>
            <div className="workflowStep">
              <div className="stepNumber">02</div>
              <div className="stepContent">
                <h4>AI 동선 배치 & 경로 산출</h4>
                <p>위도/경도 기반 장소 핑 및 OpenRouteService 알고리즘으로 동선을 최적화합니다.</p>
              </div>
            </div>
            <div className="workflowArrow">→</div>
            <div className="workflowStep">
              <div className="stepNumber">03</div>
              <div className="stepContent">
                <h4>DAY별 타임라인 자동 생성</h4>
                <p>오전/오후/저녁 시간대별 추천 방문 장소와 이동 소요 시간이 조합됩니다.</p>
              </div>
            </div>
            <div className="workflowArrow">→</div>
            <div className="workflowStep">
              <div className="stepNumber">04</div>
              <div className="stepContent">
                <h4>나만의 커스텀 다듬기 & 클라우드 저장</h4>
                <p>필요한 장소를 자유롭게 편집한 후 내 여행 보관함에 저장하거나 공유합니다.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Statistics Counter Section */}
        <section className="aboutStatsSection">
          <div className="statsGrid">
            <div className="statItem">
              <strong className="statNumber">25+</strong>
              <span className="statLabel">지원 국가</span>
            </div>
            <div className="statItem">
              <strong className="statNumber">100+</strong>
              <span className="statLabel">커버리지 도시</span>
            </div>
            <div className="statItem">
              <strong className="statNumber">2,500+</strong>
              <span className="statLabel">큐레이션 장소</span>
            </div>
            <div className="statItem">
              <strong className="statNumber">3초</strong>
              <span className="statLabel">평균 일정 생성 시간</span>
            </div>
          </div>
        </section>

        {/* 6. Final CTA Section */}
        <section className="aboutCtaSection">
          <div className="ctaBox">
            <h2>지금 나만의 완벽한 여행을 시작해보세요</h2>
            <p>PLANIT과 함께라면 몇 번의 클릭만으로 잊지 못할 여정이 완성됩니다.</p>
            <Link href="/" className="ctaButton">
              ✦ 여행 일정 만들기
            </Link>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
