"use client";

import React, { useState } from "react";
import type { GeneratedDay } from "../../utils/itineraryGenerator";
import { formatDayWeather, type DayWeatherInfo } from "../../utils/weatherService";

interface Props {
  destination: string;
  days: GeneratedDay[];
  weatherList?: DayWeatherInfo[];
}

export default function FinalTripDayCards({ destination, days, weatherList }: Props) {
  // Toggle states for expand/collapse per day
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});

  const toggleDayExpand = (idx: number) => {
    setExpandedDays((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <section className="finalTripDayCardsSection">
      <div className="sectionHeaderLine">
        <h2>DAY별 일정 요약</h2>
        <span className="subtitleTag">하루 단위 한눈에 보기</span>
      </div>

      <div className="dayCardsListClean">
        {days.map((day, idx) => {
          const isExpanded = Boolean(expandedDays[idx]);
          const displayStops = isExpanded ? day.stops : day.stops.slice(0, 3);
          const hasMore = day.stops.length > 3;
          const weather = weatherList && weatherList[idx] ? weatherList[idx] : null;

          return (
            <article key={day.label || idx} className="summaryDayRowCard">
              <div className="dayRowHeader">
                <div className="dayBadgeTitleRow">
                  <span className="dayNumberBadge">{day.label || `DAY ${idx + 1}`}</span>
                  <h3 className="dayThemeText">{day.theme || `${destination} 핵심 스팟 탐방`}</h3>
                </div>

                <div className="dayHeaderRightMeta">
                  <span className="stopsCountPill">총 {day.stops.length}곳</span>
                  {weather && <span className="weatherPill">{formatDayWeather(weather)}</span>}
                </div>
              </div>

              {/* Bullet Points of Stops */}
              <div className="dayStopsSummaryList">
                <ul className="bulletList">
                  {displayStops.map((stop) => (
                    <li key={stop.id} className="bulletItem">
                      <span className="bulletDot">•</span>
                      <strong className="stopTitle">{stop.name}</strong>
                      <span className="stopCategoryTag">{stop.time}</span>
                    </li>
                  ))}
                </ul>

                {hasMore && (
                  <button
                    type="button"
                    className="toggleExpandBtn"
                    onClick={() => toggleDayExpand(idx)}
                  >
                    {isExpanded ? "▲ 일정 접기" : `▼ 외 ${day.stops.length - 3}곳 일정 더보기`}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
