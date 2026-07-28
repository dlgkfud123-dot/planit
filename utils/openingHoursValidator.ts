import type { GeneratedStop, GeneratedDay } from "./itineraryGenerator";

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

const DAY_NAMES = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

export function parseOpeningHoursRule(openingHoursText: string, dateStr: string, timeStr: string): {
  status: "open" | "closed" | "closing_soon" | "unknown";
  message?: string;
} {
  if (!openingHoursText || openingHoursText.includes("상시") || openingHoursText.includes("24시간")) {
    return { status: "open" };
  }

  // Parse Day of Week Closed Days
  let targetDayOfWeek = -1;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      targetDayOfWeek = d.getDay();
    }
  } catch {
    // ignore
  }

  if (targetDayOfWeek >= 0) {
    const dayName = DAY_NAMES[targetDayOfWeek];
    if (openingHoursText.includes(`${dayName} 휴무`) || openingHoursText.includes(`${dayName.replace("요일", "")}요일 휴무`)) {
      return { status: "closed", message: `${dayName} 정기 휴무일입니다.` };
    }
    if (openingHoursText.includes("연중무휴")) {
      // open
    } else if (targetDayOfWeek === 1 && openingHoursText.includes("월요일 휴무")) {
      return { status: "closed", message: "월요일 정기 휴무일입니다." };
    } else if (targetDayOfWeek === 2 && openingHoursText.includes("화요일 휴무")) {
      return { status: "closed", message: "화요일 정기 휴무일입니다." };
    }
  }

  // Parse Opening Time Range (e.g. "09:00–18:00")
  const match = openingHoursText.match(/(\d{1,2}:\d{2})\s*[–~-]\s*(\d{1,2}:\d{2})/);
  if (!match) {
    return { status: "unknown" }; // Cannot parse exact range safely
  }

  const [, openTime, closeTime] = match;
  const [openHour, openMin] = openTime.split(":").map(Number);
  const [closeHour, closeMin] = closeTime.split(":").map(Number);

  const [visitHour, visitMin] = timeStr.split(":").map(Number);
  const visitMinutes = visitHour * 60 + visitMin;
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  if (visitMinutes < openMinutes) {
    return { status: "closed", message: `운영시간 전입니다. (${openTime} 개장)` };
  }

  if (visitMinutes >= closeMinutes) {
    return { status: "closed", message: `운영시간이 종료되었습니다. (${closeTime} 마감)` };
  }

  if (closeMinutes - visitMinutes <= 45) {
    return { status: "closing_soon", message: `방문 예정 시간에 마감이 임박합니다. (${closeTime} 마감)` };
  }

  return { status: "open" };
}

export function validateStopOpening(
  stop: GeneratedStop,
  dateStr: string,
  dayStops: GeneratedStop[],
  stopIndex: number
): OpeningValidationResult {
  const result = parseOpeningHoursRule(stop.openingHours, dateStr, stop.time);

  if (result.status === "open") {
    return { isValid: true, status: "open", proposals: [] };
  }

  if (result.status === "unknown") {
    return { isValid: true, status: "unknown", proposals: [] };
  }

  const proposals: ConflictResolutionProposal[] = [];

  // Safety constraint: Protected stops (user-added or core landmark)
  const isProtected = stop.userAdded || stop.isCoreLandmark;

  // Tier 1: Time Auto-Adjust Proposal
  const match = stop.openingHours.match(/(\d{1,2}:\d{2})\s*[–~-]\s*(\d{1,2}:\d{2})/);
  if (match) {
    const [, openTime] = match;
    const [openH, openM] = openTime.split(":").map(Number);
    const targetStartMins = openH * 60 + openM;

    // Check if shifting time to openTime creates a conflict with previous/next stop
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
        description: `운영시간 시작인 ${suggestedTime}에 맞춰 시간을 변경합니다.`,
      });
    }
  }

  // Tier 2: Same-Day Reorder Proposal (only if not protected or if swapping with unprotected stop)
  if (!isProtected && dayStops.length > 1) {
    dayStops.forEach((otherStop, idx) => {
      if (idx !== stopIndex && !otherStop.userAdded && !otherStop.isCoreLandmark) {
        const otherRule = parseOpeningHoursRule(stop.openingHours, dateStr, otherStop.time);
        if (otherRule.status === "open") {
          proposals.push({
            type: "reorder",
            targetIndex: idx,
            targetName: otherStop.name,
            label: `${otherStop.name}와 순서 변경 제안`,
            description: `${otherStop.time} 시간대의 ${otherStop.name}과 순서를 교체합니다.`,
          });
        }
      }
    });
  }

  // Tier 3: Smart Replace Proposal
  proposals.push({
    type: "smart_replace",
    label: "다른 장소 추천 (Smart Replace)",
    description: "같은 권역/테마의 운영 중인 대체 장소를 추천합니다.",
  });

  return {
    isValid: false,
    status: result.status,
    message: result.message || "방문 예정 시간에는 운영하지 않습니다.",
    proposals,
  };
}
