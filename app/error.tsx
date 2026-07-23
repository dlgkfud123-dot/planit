"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="servicePage releaseStatePage">
      <section className="savedEmpty releaseState" role="alert" aria-labelledby="error-title">
        <i aria-hidden="true">!</i>
        <span>잠시 문제가 발생했습니다.</span>
        <h1 id="error-title">화면을 불러오지 못했습니다.</h1>
        <p>다시 시도하거나 PLANIT 홈으로 이동해주세요.</p>
        <div className="releaseStateActions">
          <button type="button" onClick={reset}>다시 시도</button>
          <Link href="/">홈으로 이동</Link>
        </div>
      </section>
    </main>
  );
}
