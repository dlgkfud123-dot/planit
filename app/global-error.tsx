"use client";

import Link from "next/link";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ko">
      <body>
        <main className="servicePage releaseStatePage">
          <section className="savedEmpty releaseState" role="alert" aria-labelledby="global-error-title">
            <i aria-hidden="true">!</i>
            <span>PLANIT</span>
            <h1 id="global-error-title">서비스를 불러오지 못했습니다.</h1>
            <p>잠시 후 다시 시도하거나 홈으로 이동해주세요.</p>
            <div className="releaseStateActions">
              <button type="button" onClick={reset}>다시 시도</button>
              <Link href="/">홈으로 이동</Link>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
