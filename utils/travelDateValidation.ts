export type TravelDateValidationCode =
  | "MISSING_DATE"
  | "INVALID_DATE"
  | "PAST_DATE"
  | "INVALID_ORDER";

export type TravelDateValidationResult =
  | { valid: true }
  | { valid: false; code: TravelDateValidationCode; message: string };

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isValidCalendarDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day, 12, 0, 0, 0);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

export function isDateBeforeMinimum(value: string, minimum: string): boolean {
  return !isValidCalendarDate(value) || !isValidCalendarDate(minimum) || value < minimum;
}

export function shouldClearEndDate(start: string, end: string): boolean {
  return Boolean(start && end && end < start);
}

export function validateTravelDateRange(
  start: string,
  end: string,
  today = getLocalDateString()
): TravelDateValidationResult {
  if (!start || !end) return { valid: false, code: "MISSING_DATE", message: "출발일과 귀국일을 모두 선택해주세요." };
  if (!isValidCalendarDate(start) || !isValidCalendarDate(end) || !isValidCalendarDate(today)) {
    return { valid: false, code: "INVALID_DATE", message: "여행 날짜 형식을 확인해주세요." };
  }
  if (start < today || end < today) {
    return { valid: false, code: "PAST_DATE", message: "오늘 이전 날짜는 선택할 수 없습니다." };
  }
  if (end < start) {
    return { valid: false, code: "INVALID_ORDER", message: "귀국일은 출발일보다 빠를 수 없습니다." };
  }
  return { valid: true };
}
