"use client";

import Link from "next/link";

interface BrandLogoProps {
  href?: string | null;
  className?: string;
  size?: "normal" | "large" | "small";
}

export function EyriaSparkleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`eyriaSparkleIcon ${className}`}
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function BrandLogo({
  href = "/",
  className = "",
  size = "normal",
}: BrandLogoProps) {
  const content = (
    <span className={`brandLogo brandLogo--${size} ${className}`}>
      <span className="brandLogoText">EYRIA</span>
      <EyriaSparkleIcon />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="brandLogoLink" aria-label="EYRIA 홈">
        {content}
      </Link>
    );
  }

  return content;
}
