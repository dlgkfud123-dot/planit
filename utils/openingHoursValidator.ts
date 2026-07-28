import type { GeneratedStop } from "./itineraryGenerator";

export type ConflictResolutionProposal =
  | { type: "time_adjust"; newTime: string; label: string; description: string }
  | { type: "reorder"; targetIndex: number; targetName: string; label: string; description: string }
  | { type: "smart_replace"; label: string; description: string };

export type OpeningValidationResult = {
  isValid: boolean;
  status: "open" | "closed" | "closing_soon" | "unknown";
  message?: string;
  proposals: ConflictResolutionProposal[];
};

export const CITY_TIMEZONE_MAP: Record<string, string> = {
  서울: "Asia/Seoul", 부산: "Asia/Seoul", 제주: "Asia/Seoul",
  도쿄: "Asia/Tokyo", 오사카: "Asia/Tokyo", 후쿠오카: "Asia/Tokyo", 교토: "Asia/Tokyo", 삿포로: "Asia/Tokyo",
  방콕: "Asia/Bangkok", 푸껫: "Asia/Bangkok", 치앙마이: "Asia/Bangkok",
  파리: "Europe/Paris", 로마: "Europe/Rome", 바르셀로나: "Europe/Madrid", 니스: "Europe/Paris", 암스테르담: "Europe/Amsterdam", 마드리드: "Europe/Madrid",
  런던: "Europe/London", 에든버러: "Europe/London",
  뉴욕: "America/New_York", 로스앤젤레스: "America/Los_Angeles", 호놀룰루: "Pacific/Honolulu", 샌프란시스코: "America/Los_Angeles", 마이애미: "America/New_York",
  시드니: "Australia/Sydney", 멜버른: "Australia/Melbourne",
};

export function getCityTimezone(destination: string): string {
  return CITY_TIMEZONE_MAP[destination] || "Asia/Seoul";
}

const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function parseOpeningHoursRule(
  openingHoursText: string,
  dateStr: string,
  timeStr: string,
  destination: string = "서울"
): { status: "open" | "closed" | "closing_soon" | "unknown"; message?: string } {
  if (!openingHoursText || openingHoursText.trim() === "" || openingHoursText.includes("변동") || openingHoursText.includes("사전 문의")) {
    return { status: "unknown", message: "정적 데이터 기준 운영시간 정보 미비" };
  }

  if (openingHoursText.includes("상시") || openingHoursText.includes("24시간")) {
    return { status: "open" };
  }

  const timeZone = getCityTimezone(destination);
  let targetDayOfWeek = -1;

  try {
    const d = new Date(`${dateStr}T${timeStr}:00`);
    if (!isNaN(d.getTime())) {
      const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "narrow", timeZone });
      const dayStr = dayFormatter.format(d);
      const dayMap: Record<string, number> = { S: 0, M: 1, T: 2, W: 3, Th: 4, F: 5, Sa: 6 };
      targetDayOfWeek = d.getDay(); // fallback
    }
  } catch {
    targetDayOfWeek = -1;
  }

  if (targetDayOfWeek >= 0) {
    const dayName = DAY_NAMES[targetDayOfWeek];
    if (openingHoursText.includes(`${dayName} 휴무`) || openingHoursText.includes(`${dayName.replace("요일", "")}요일 휴무`)) {
      return { status: "closed", message: `${dayName} 정기 휴무일입니다. (정적 데이터 기준)` };
    }
    if (targetDayOfWeek === 1 && openingHoursText.includes("월요일 휴무")) {
      return { status: "closed", message: "월요일 정기 휴무일입니다. (정적 데이터 기준)" };
    }
    if (targetDayOfWeek === 2 && openingHoursText.includes("화요일 휴무")) {
      return { status: "closed", message: "화요일 정기 휴무일입니다. (정적 데이터 기준)" };
    }
  }

  const match = openingHoursText.match(/(\d{1,2}:\d{2})\s*[–~-]\s*(\d{1,2}:\d{2})/);
  if (!match) {
    return { status: "unknown", message: "운영시간 문자열 구문 미해석 (안전 처리)" };
  }

  const [, openTime, closeTime] = match;
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  const [visitHour, visitMin] = timeStr.split(":").map(Number);
  const visitMinutes = visitHour * 60 + visitMin;
  const openMinutes = openHour * 60 + openMin;
  let closeMinutes = closeHour * 60 + closeMin;

  // Handle midnight / overnight (e.g., 18:00 - 02:00 next day)
  if (closeMinutes < openMinutes) {
    closeMinutes += 24 * 60;
  }

  let effectiveVisitMinutes = visitMinutes;
  if (visitMinutes < openMinutes && visitMinutes < 6 * 60 && closeMinutes > 24 * 60) {
    effectiveVisitMinutes += 24 * 60;
  }

  if (effectiveVisitMinutes < openMinutes) {
    return { status: "closed", message: `운영시간 전입니다. (${openTime} 개장 정적 기준)` };
  }

  if (effectiveVisitMinutes >= closeMinutes) {
    return { status: "closed", message: `운영시간이 종료되었습니다. (${closeTime} 마감 정적 기준)` };
  }

  if (closeMinutes - effectiveVisitMinutes <= 45) {
    return { status: "closing_soon", message: `방문 예정 시간에 마감이 임박합니다. (${closeTime} 마감 정적 기준)` };
  }

  return { status: "open" };
}

export function validateStopOpening(
  stop: GeneratedStop,
  dateStr: string,
  dayStops: GeneratedStop[],
  stopIndex: number,
  destination: string = "서울"
): OpeningValidationResult {
  const result = parseOpeningHoursRule(stop.openingHours, dateStr, stop.time, destination);

  if (result.status === "open" || result.status === "unknown") {
    return { isValid: true, status: result.status, message: result.message, proposals: [] };
  }

  const proposals: ConflictResolutionProposal[] = [];
  const isProtected = stop.userAdded || stop.isCoreLandmark;

  const match = stop.openingHours.match(/(\d{1,2}:\d{2})\s*[–~-]\s*(\d{1,2}:\d{2})/);
  if (match) {
    const [, openTime] = match;
    const [openH, openM] = openTime.split(":").map(Number);
    const targetStartMins = openH * 60 + openM;

    const prevStop = dayStops[stopIndex - 1];
    const nextStop = dayStops[stopIndex + 1];

    let canAdjust = true;
    if (prevStop) {
      const [prevH, prevM] = prevStop.time.split(":").map(Number);
      const prevEnd = prevH * 60 + prevM + (Number.parseInt(prevStop.duration) || 90);
      if (targetStartMins < prevEnd + 15) canAdjust = false;
    }
    if (nextStop) {
      const [nextH, nextM] = nextStop.time.split(":").map(Number);
      const stopDuration = Number.parseInt(stop.duration) || 90;
      if (targetStartMins + stopDuration > nextH * 60 + nextM - 15) canAdjust = false;
    }

    if (canAdjust) {
      const suggestedTime = `${openH.toString().padStart(2, "0")}:${openM.toString().padStart(2, "0")}`;
      proposals.push({
        type: "time_adjust",
        newTime: suggestedTime,
        label: `${suggestedTime}로 시간 조정 제안`,
        description: `운영시간 개장 시각인 ${suggestedTime}으로 변경을 제안합니다.`,
      });
    }
  }

  if (!isProtected && dayStops.length > 1) {
    dayStops.forEach((otherStop, idx) => {
      if (idx !== stopIndex && !otherStop.userAdded && !otherStop.isCoreLandmark) {
        const otherRule = parseOpeningHoursRule(stop.openingHours, dateStr, otherStop.time, destination);
        if (otherRule.status === "open") {
          proposals.push({
            type: "reorder",
            targetIndex: idx,
            targetName: otherStop.name,
            label: `${otherStop.name}와 순서 변경 제안`,
            description: `${otherStop.time} 시간대의 ${otherStop.name}과 순서 교체를 제안합니다.`,
          });
        }
      }
    });
  }

  proposals.push({
    type: "smart_replace",
    label: "다른 장소 추천 (Smart Replace)",
    description: "같은 권역 및 테마의 대체 장소 3곳을 제안합니다.",
  });

  return {
    isValid: false,
    status: result.status,
    message: result.message || "방문 예정 시간대 운영 불일치 (정적 데이터 기준)",
    proposals,
  };
}
