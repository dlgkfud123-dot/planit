"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import BrandLogo from "../common/BrandLogo";
import AccountActions from "../auth/AccountActions";

interface HeaderProps {
  activeNav?: "home" | "trips" | "about" | "contact" | "none";
}

export default function Header({ activeNav }: HeaderProps) {
  const rawPathname = usePathname();
  const pathname = rawPathname || (typeof window !== "undefined" ? window.location.pathname : "");

  const currentActive =
    activeNav ||
    (pathname === "/"
      ? "home"
      : pathname === "/trips"
      ? "trips"
      : pathname === "/about"
      ? "about"
      : pathname === "/contact"
      ? "contact"
      : "none");

  const isMainLanding = pathname === "/";

  if (isMainLanding) {
    return (
      <header className="mapHeader">
        <div className="headerContainer">
          <BrandLogo />
          <nav className="homeServiceNav">
            <AccountActions />
          </nav>
        </div>
      </header>
    );
  }

  return (
    <header className="serviceHeader aboutHeader contactHeader privacyHeader termsHeader">
      <div className="serviceHeaderContainer aboutHeaderContainer contactHeaderContainer privacyHeaderContainer termsHeaderContainer">
        <BrandLogo />
        <nav className="aboutNav contactNav privacyNav termsNav serviceNav">
          <Link href="/">새 여행</Link>
          <Link href="/trips" className={currentActive === "trips" ? "active" : ""}>
            내 여행
          </Link>
          <Link href="/contact" className={currentActive === "contact" ? "active" : ""}>
            고객센터
          </Link>
          <AccountActions />
        </nav>
      </div>
    </header>
  );
}
