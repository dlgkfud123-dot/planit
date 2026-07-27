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
            AI 기반 여행 일정 설계 &amp; 실시간 경로 최적화 플랫폼
          </p>
          <span className="footerCopyright">
            © 2026 PLANIT. All rights reserved.
          </span>
        </div>

        <div className="footerNavGrid">
          <div className="footerNavCol">
            <strong>서비스</strong>
            <Link href="/trips">내 여행</Link>
          </div>

          <div className="footerNavCol">
            <strong>브랜드</strong>
            <Link href="/about">PLANIT 소개</Link>
            <Link href="/contact">Contact</Link>
          </div>

          <div className="footerNavCol">
            <strong>약관 및 정책</strong>
            <Link href="/privacy">개인정보 처리방침</Link>
            <Link href="/terms">이용약관</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
