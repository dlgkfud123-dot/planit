import Link from "next/link";

export default function Footer() {
  return (
    <footer className="globalFooter">
      <div className="footerContainer">
        <div className="footerBrandCol">
          <Link href="/" className="footerLogo">
            PLANIT <i>✦</i>
          </Link>
          <p className="footerTagline">
            AI 기반 여행 일정 설계 & 실시간 경로 최적화 플랫폼
          </p>
          <span className="footerCopyright">
            © 2026 PLANIT. All rights reserved.
          </span>
        </div>

        <div className="footerNavGrid">
          <div className="footerNavCol">
            <strong>서비스</strong>
            <Link href="/">새 여행 만들기</Link>
            <Link href="/trips">내 여행 (My Journeys)</Link>
            <Link href="/about">PLANIT 소개 (About)</Link>
          </div>

          <div className="footerNavCol">
            <strong>고객지원</strong>
            <Link href="/contact">고객센터 / 문의 (Contact)</Link>
            <a
              href="https://github.com/dlgkfud123-dot/planit"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Repository
            </a>
          </div>

          <div className="footerNavCol">
            <strong>약관 및 정책</strong>
            <Link href="/privacy">개인정보 처리방침 (Privacy)</Link>
            <Link href="/terms">이용약관 (Terms)</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
