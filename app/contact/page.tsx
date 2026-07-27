"use client";

import Link from "next/link";
import { useState } from "react";
import AccountActions from "../../components/auth/AccountActions";
import Footer from "../../components/layout/Footer";

export default function ContactPage() {
  const [selectedCategory, setSelectedCategory] = useState("bug");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetCity, setTargetCity] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const categories = [
    { id: "bug", title: "버그 제보", desc: "오류나 화면 렌더링 문제" },
    { id: "feature", title: "기능 제안", desc: "추가되었으면 하는 서비스 아이디어" },
    { id: "partnership", title: "제휴 및 협력", desc: "장소 데이터 및 비즈니스 문의" },
    { id: "general", title: "일반 문의", desc: "기타 서비스 이용 관련 질문" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <main className="servicePage contactWrapper">
      {/* Header */}
      <header className="serviceHeader contactHeader">
        <div className="contactHeaderContainer">
          <Link href="/" className="workspaceBrand">
            PLANIT <i>✦</i>
          </Link>
          <nav className="contactNav">
            <Link href="/">새 여행</Link>
            <Link href="/trips">내 여행</Link>
            <Link href="/about">PLANIT 소개</Link>
            <Link href="/contact" className="active">
              고객센터
            </Link>
            <AccountActions />
          </nav>
        </div>
      </header>

      <div className="contactContent">
        {/* Hero */}
        <section className="contactHero">
          <div className="heroBadge">HELP &amp; SUPPORT</div>
          <h1 className="contactHeroTitle">무엇을 도와드릴까요?</h1>
          <p className="contactHeroSubtitle">
            PLANIT 서비스 이용 중 궁금한 점이 있거나 개선 의견이 있으시다면
            언제든 의견을 남겨주세요.
          </p>
        </section>

        {/* Category Cards */}
        <section className="contactCategorySection">
          <div className="categoryGrid">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`categoryCard ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <strong className="categoryTitle">{cat.title}</strong>
                <span className="categoryDesc">{cat.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Form and Contact Channels */}
        <section className="contactFormSection">
          <div className="contactGrid">
            {/* Left: Contact Form */}
            <div className="formCard">
              <h3>문의 보내기</h3>
              <p className="formSubtitle">
                선택한 카테고리: <strong>{categories.find((c) => c.id === selectedCategory)?.title}</strong>
              </p>

              {submitted ? (
                <div className="demoSuccessBox">
                  <h4>소중한 의견이 등록되었습니다</h4>
                  <p>
                    (데모 안내: 현재 실제 이메일 전송 서버가 연결되어 있지 않은 데모 환경입니다.
                    소중한 피드백은 감사히 반영하겠습니다.)
                  </p>
                  <button
                    type="button"
                    className="resetFormButton"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage("");
                    }}
                  >
                    새 문의 작성하기
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="contactForm">
                  <div className="formRow">
                    <label>
                      <span>이름 / 닉네임 *</span>
                      <input
                        type="text"
                        required
                        placeholder="홍길동"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </label>
                    <label>
                      <span>이메일 주소 *</span>
                      <input
                        type="email"
                        required
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </label>
                  </div>

                  <label>
                    <span>관련 도시 / 여행지 (선택)</span>
                    <input
                      type="text"
                      placeholder="예: 제주, 파리, 도쿄"
                      value={targetCity}
                      onChange={(e) => setTargetCity(e.target.value)}
                    />
                  </label>

                  <label>
                    <span>문의 및 의견 내용 *</span>
                    <textarea
                      required
                      rows={5}
                      placeholder="발생한 이슈나 건의사항을 상세히 작성해주세요."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </label>

                  <div className="demoNoticePill">
                    실제 전송 서버 미연결 데모 안내문구가 접수 후 표시됩니다.
                  </div>

                  <button type="submit" className="submitContactButton">
                    문의 보내기 ✦
                  </button>
                </form>
              )}
            </div>

            {/* Right: 4 Direct Channels */}
            <div className="channelCard">
              <h3>공식 연락 채널</h3>
              <p className="channelDesc">
                서비스 이용 및 기능 문의는 아래 공식 채널을 이용하실 수 있습니다.
              </p>

              <div className="channelList">
                <div className="channelItem">
                  <div>
                    <strong>공식 이메일</strong>
                    <span>support@planit.app</span>
                  </div>
                </div>

                <div className="channelItem">
                  <div>
                    <strong>평균 답변 시간</strong>
                    <span>24~48시간</span>
                  </div>
                </div>

                <div className="channelItem">
                  <div>
                    <strong>운영 시간</strong>
                    <span>평일 10:00 ~ 18:00 (KST)</span>
                  </div>
                </div>

                <div className="channelItem">
                  <div>
                    <strong>자주 묻는 질문</strong>
                    <span>FAQ &amp; 가이드 센터</span>
                  </div>
                </div>
              </div>

              <div className="faqBox">
                <strong>현지 정보 확인 안내</strong>
                <p>
                  운영시간, 입장권 예약 등 현지 장소 정보는 각 장소의 공식 웹사이트를 통해
                  최신 정보를 확인하시는 것을 권장합니다.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
