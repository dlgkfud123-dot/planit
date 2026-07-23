import Link from "next/link";

export default function NotFound() {
  return (
    <main className="servicePage releaseStatePage">
      <section className="savedEmpty releaseState" aria-labelledby="not-found-title">
        <i aria-hidden="true">✦</i>
        <span>404</span>
        <h1 id="not-found-title">페이지를 찾을 수 없습니다.</h1>
        <p>주소가 변경되었거나 더 이상 제공되지 않는 페이지입니다.</p>
        <div className="releaseStateActions">
          <Link href="/">PLANIT 홈으로</Link>
        </div>
      </section>
    </main>
  );
}
