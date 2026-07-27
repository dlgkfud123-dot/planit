"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { readDraft, readSavedTrips, type TripSnapshot } from "../../utils/tripStorage";
import { useTripPersistence } from "../planner/useTripPersistence";
import { useAuth } from "../auth/AuthProvider";
import AccountActions from "../auth/AccountActions";
import { cityByName } from "../../data/cities";

function formatTimeAgo(dateString: string) {
  if (!dateString) return "방금 전";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "어제";
  if (diffDays < 30) return `${diffDays}일 전`;
  return date.toLocaleDateString("ko-KR");
}

export default function SavedTrips() {
  const { signInWithGoogle } = useAuth();
  const {
    user,
    authReady,
    configured,
    list,
    remove,
    importLocal,
    clearImportedLocal,
  } = useTripPersistence();

  const [trips, setTrips] = useState<TripSnapshot[]>([]);
  const [draft, setDraft] = useState<TripSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showImport, setShowImport] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string> | null>(null);

  const load = useCallback(async () => {
    if (!authReady) return;
    setLoading(true);
    try {
      setTrips(await list());
      setMessage("");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "일정을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
    setDraft(user ? null : readDraft());
    const local = readSavedTrips();
    setShowImport(
      Boolean(
        user &&
          local.length &&
          !localStorage.getItem(`planit:local-only:${user.id}`) &&
          !sessionStorage.getItem(`planit:import-later:${user.id}`)
      )
    );
  }, [authReady, list, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const removeTrip = async (id: string) => {
    try {
      await remove(id);
      await load();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "일정을 삭제하지 못했습니다."
      );
    }
  };

  const doImport = async () => {
    const result = await importLocal();
    setImportedIds(new Set(result.importedIds));
    setMessage(
      `${result.imported}개 일정을 계정으로 가져왔습니다.${
        result.failed ? ` ${result.failed}개는 실패했습니다.` : ""
      }`
    );
    setShowImport(false);
    await load();
  };

  const deferImport = () => {
    if (user) sessionStorage.setItem(`planit:import-later:${user.id}`, "1");
    setShowImport(false);
  };

  const keepLocal = () => {
    if (user) localStorage.setItem(`planit:local-only:${user.id}`, "1");
    setShowImport(false);
  };

  const clearLocalCopies = () => {
    if (!importedIds) return;
    clearImportedLocal(importedIds);
    setImportedIds(null);
    setMessage("계정으로 가져온 로컬 사본을 삭제했습니다.");
  };

  return (
    <main className="servicePage myJourneysWrapper">
      <header className="serviceHeader myJourneysHeader">
        <div className="myJourneysHeaderContainer">
          <Link href="/" className="workspaceBrand">
            PLANIT <i>✦</i>
          </Link>
          <nav className="myJourneysNav">
            <Link href="/">새 여행</Link>
            <Link href="/about">서비스 소개</Link>
            <AccountActions />
          </nav>
        </div>
      </header>

      <div className="myJourneysContent">
        {/* 1. Hero Section - Prominent Travel Banner */}
        <section className="myJourneysHero">
          <div className="heroTextColumn">
            <span className="myJourneysTag">MY JOURNEYS</span>
            <h1 className="myJourneysTitle">내 여행 ✦</h1>
            <p className="myJourneysSubtitle">
              저장한 여행을 한눈에 보고, 이어서 편집해 보세요.
            </p>
          </div>
          <div className="heroRightImageFrame" aria-hidden="true">
            <img
              src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80"
              alt="Minimalist Airplane Wing Flight"
            />
          </div>
        </section>

        {/* 2. Unauthenticated Login Value Card */}
        {configured && !user && authReady && (
          <section className="loginValueCard">
            <div className="loginValueLeft">
              <div className="cloudIconBadge">☁️</div>
              <div className="loginValueText">
                <h2>로그인하고 더 편리하게 여행을 관리하세요</h2>
                <p>여행은 소중하니까, PLANIT이 안전하게 보관해 드릴게요.</p>
              </div>
              <div className="loginFeatureGrid">
                <div className="featureCard">
                  <span className="featureIcon">☁️</span>
                  <span className="featureText">모든 기기 자동 동기화</span>
                </div>
                <div className="featureCard">
                  <span className="featureIcon">🗺️</span>
                  <span className="featureText">언제든 이어서 편집</span>
                </div>
                <div className="featureCard">
                  <span className="featureIcon">🔒</span>
                  <span className="featureText">안전한 여행 보관</span>
                </div>
              </div>
            </div>
            <div className="loginValueRight">
              <div className="loginCtaBox">
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="googleCtaButton"
                >
                  <span className="googleLogoIcon">G</span> Google로 계속
                </button>
                <Link href="/login" className="emailCtaButton">
                  ✉️ 이메일로 계속
                </Link>
                <div className="loginCardSubtext">
                  이미 계정이 있으신가요? <Link href="/login">로그인</Link>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Banners for Local Import Prompt */}
        {showImport && (
          <section className="localImportPrompt">
            <h2>이 브라우저의 일정을 계정으로 가져올까요?</h2>
            <p>업로드 전에는 로컬 일정을 삭제하지 않습니다.</p>
            <div>
              <button onClick={() => void doImport()}>계정으로 가져오기</button>
              <button onClick={deferImport}>나중에 하기</button>
              <button onClick={keepLocal}>로컬만 유지</button>
            </div>
          </section>
        )}

        {importedIds && importedIds.size > 0 && (
          <section className="localImportPrompt">
            <h2>계정으로 가져오기가 완료됐습니다.</h2>
            <p>로컬 사본을 계속 유지하거나 지금 삭제할 수 있습니다.</p>
            <div>
              <button onClick={clearLocalCopies}>가져온 로컬 사본 삭제</button>
              <button onClick={() => setImportedIds(null)}>로컬 사본 유지</button>
            </div>
          </section>
        )}

        {message && (
          <section className="localImportPrompt" role="status">
            <p>{message}</p>
          </section>
        )}

        {/* 3. Auto-saved Draft Resume Card (Album Style with Image) */}
        {draft && (() => {
          const cityInfo = cityByName[draft.destination];
          const countryName = cityInfo ? cityInfo.country : "여행지";
          const imgUrl =
            cityInfo?.image ||
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";

          return (
            <section className="draftAlbumCard">
              <div className="journeyCardImage">
                <img src={imgUrl} alt={draft.destination} loading="lazy" />
              </div>
              <div className="journeyCardContent">
                <div className="draftBadgeHeader">
                  <span className="draftBadge">⚡ 자동 저장된 최근 작성 일정</span>
                  <span className="journeyLocation">📍 {countryName} · {draft.destination}</span>
                </div>
                <h3 className="journeyTitle">{draft.title}</h3>
                <div className="journeyMeta">
                  📅 {draft.start} ~ {draft.end} · {draft.people}명
                </div>
              </div>
              <div className="journeyCardActions">
                <Link href="/planner?draft=1" className="continueEditButton">
                  이어서 편집하기 →
                </Link>
              </div>
            </section>
          );
        })()}

        {/* 4. Recent Trips Section & Cards */}
        <section className="recentTripsSection">
          <div className="recentTripsHeader">
            <div className="sectionTitleGroup">
              <h2>최근 여행</h2>
              <span className="tripCountBadge">{trips.length}</span>
            </div>
            {trips.length > 0 && (
              <Link href="/" className="newJourneyLink">
                새 여행 만들기 →
              </Link>
            )}
          </div>

          {loading && (
            <div className="savedLoadingState">
              <div className="spinnerPulse">✦</div>
              <p>여행 일정을 가져오는 중입니다...</p>
            </div>
          )}

          {!loading && trips.length > 0 && (
            <div className="journeyCardList">
              {trips.map((trip) => {
                const cityInfo = cityByName[trip.destination];
                const countryName = cityInfo ? cityInfo.country : "여행지";
                const imgUrl =
                  cityInfo?.image ||
                  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80";

                return (
                  <article className="journeyCard" key={trip.id}>
                    <div className="journeyCardImage">
                      <img
                        src={imgUrl}
                        alt={trip.destination}
                        loading="lazy"
                      />
                    </div>
                    <div className="journeyCardContent">
                      <div className="journeyLocation">
                        📍 {countryName} · {trip.destination}
                      </div>
                      <h3 className="journeyTitle">{trip.title}</h3>
                      <div className="journeyMeta">
                        📅 {trip.start} ~ {trip.end} · {trip.people}명
                      </div>
                      <div className="journeyTimeAgo">
                        마지막 수정 · {formatTimeAgo(trip.updatedAt)}
                      </div>
                    </div>
                    <div className="journeyCardActions">
                      <Link
                        href={`/planner?saved=${encodeURIComponent(trip.id)}`}
                        className="continueEditButton"
                      >
                        계속 편집 →
                      </Link>
                      <button
                        type="button"
                        className="deleteJourneyButton"
                        aria-label="일정 삭제"
                        title="일정 삭제"
                        onClick={() => void removeTrip(trip.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* 5. Empty State */}
          {!loading && trips.length === 0 && (
            <div className="emptyJourneysState">
              <div className="luggageIconBadge">🧳</div>
              <h2>아직 저장한 여행이 없어요</h2>
              <p>AI와 함께 나만의 완벽한 여행을 만들어 보세요.</p>
              <Link href="/" className="createJourneyButton">
                새 여행 만들기 ✦
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
