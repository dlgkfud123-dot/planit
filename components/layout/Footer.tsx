import BrandLogo from "../common/BrandLogo";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="globalFooter">
      <div className="footerContainer">
        <div className="footerLinks">
          <Link href="/privacy">개인정보 처리방침</Link>
          <span className="footerDot">·</span>
          <Link href="/about">EYRIA 소개</Link>
          <span className="footerDot">·</span>
          <Link href="/terms">이용약관</Link>
          <span className="footerDot">·</span>
          <Link href="/contact">고객센터</Link>
        </div>
        <div className="footerCopyright">
          © 2026 EYRIA. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
