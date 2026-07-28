export type CurrencyCode = "KRW" | "JPY" | "THB" | "EUR" | "GBP" | "USD" | "AUD";

export type CostConfidence = "confirmed" | "estimated" | "free" | "unknown";

export type CostCategoryKey = "transport" | "food" | "cafe" | "admission" | "experience";

export type CategoryCostItem = {
  key: CostCategoryKey;
  label: string;
  localAmount: number;
  krwAmount: number;
  confidence: CostConfidence;
};

export type StopCostBreakdown = {
  localCurrency: CurrencyCode;
  currencySymbol: string;
  admissionLocal: number;
  foodLocal: number;
  cafeLocal: number;
  transportLocal: number;
  experienceLocal: number;
  localTotalPerPerson: number;
  krwTotalPerPerson: number;
  confidence: CostConfidence;
  categories: CategoryCostItem[];
};

export type DayCostSummary = {
  localCurrency: CurrencyCode;
  currencySymbol: string;
  perPersonLocal: number;
  perPersonKrw: number;
  totalGroupLocal: number;
  totalGroupKrw: number;
  confidence: CostConfidence;
  hasUnknown: boolean;
  categories: CategoryCostItem[];
};

export const EXCHANGE_RATES: Record<CurrencyCode, { rateToKrw: number; symbol: string }> = {
  KRW: { rateToKrw: 1.0, symbol: "₩" },
  JPY: { rateToKrw: 9.1, symbol: "¥" },
  THB: { rateToKrw: 37.5, symbol: "฿" },
  EUR: { rateToKrw: 1480.0, symbol: "€" },
  GBP: { rateToKrw: 1750.0, symbol: "£" },
  USD: { rateToKrw: 1380.0, symbol: "$" },
  AUD: { rateToKrw: 910.0, symbol: "A$" },
};

export const EXCHANGE_REFERENCE_DATE = "2026-07-28 기준 참고 환율";

export const CITY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  서울: "KRW", 부산: "KRW", 제주: "KRW",
  도쿄: "JPY", 오사카: "JPY", 후쿠오카: "JPY", 교토: "JPY", 삿포로: "JPY",
  방콕: "THB", 푸껫: "THB", 치앙마이: "THB",
  파리: "EUR", 로마: "EUR", 바르셀로나: "EUR", 니스: "EUR", 암스테르담: "EUR", 마드리드: "EUR",
  런던: "GBP", 에든버러: "GBP",
  뉴욕: "USD", 로스앤젤레스: "USD", 호놀룰루: "USD", 샌프란시스코: "USD", 마이애미: "USD",
  시드니: "AUD", 멜버른: "AUD",
};

export function getCityCurrency(destination: string): CurrencyCode {
  return CITY_CURRENCY_MAP[destination] || "KRW";
}

export function formatCurrency(amount: number, currency: CurrencyCode): string {
  const info = EXCHANGE_RATES[currency] || EXCHANGE_RATES.KRW;
  if (currency === "KRW") {
    return `${Math.round(amount).toLocaleString()}원`;
  }
  return `${info.symbol}${Math.round(amount).toLocaleString()}`;
}

export function formatKrwReference(krwAmount: number): string {
  if (krwAmount <= 0) return "0원";
  if (krwAmount >= 10000) {
    const man = (krwAmount / 10000).toFixed(1).replace(/\.0$/, "");
    return `약 ${man}만원`;
  }
  return `약 ${Math.round(krwAmount).toLocaleString()}원`;
}

// Estimates base transport fare in local currency per leg
export function estimateTransportFare(mode: string | undefined, distanceKm: number, currency: CurrencyCode): number {
  if (!mode || mode === "도보") return 0;
  const info = EXCHANGE_RATES[currency] || EXCHANGE_RATES.KRW;
  const baseKrw = mode === "기차" ? 12000 : mode === "보트·수상교통" ? 8000 : mode === "택시" ? Math.max(5000, 3000 + distanceKm * 1200) : 1600;
  return Math.round(baseKrw / info.rateToKrw);
}

export function calculateStopCost(
  placeCost: number, // raw cost from Place
  category: string,
  tags: string[],
  estimateStatus: "free" | "estimated" | "variable",
  transportMode: string | undefined,
  distanceFromPrevious: number | undefined,
  destination: string
): StopCostBreakdown {
  const currency = getCityCurrency(destination);
  const info = EXCHANGE_RATES[currency];

  const transportLocal = estimateTransportFare(transportMode, distanceFromPrevious || 0, currency);
  let admissionLocal = 0;
  let foodLocal = 0;
  let cafeLocal = 0;
  let experienceLocal = 0;

  let confidence: CostConfidence = "estimated";

  if (estimateStatus === "free" || placeCost === 0) {
    confidence = "free";
  } else if (estimateStatus === "estimated") {
    confidence = "confirmed";
  } else {
    confidence = "estimated";
  }

  // Local currency conversion if placeCost is in KRW or local
  const costInLocal = currency === "KRW" ? placeCost : Math.round(placeCost / info.rateToKrw);

  if (category === "food" || category === "market") {
    foodLocal = costInLocal > 0 ? costInLocal : Math.round(20000 / info.rateToKrw);
  } else if (tags.some(t => t.includes("카페"))) {
    cafeLocal = costInLocal > 0 ? costInLocal : Math.round(8000 / info.rateToKrw);
  } else if (category === "culture" || category === "landmark") {
    admissionLocal = costInLocal;
  } else {
    experienceLocal = costInLocal;
  }

  const localTotalPerPerson = admissionLocal + foodLocal + cafeLocal + transportLocal + experienceLocal;
  const krwTotalPerPerson = Math.round(localTotalPerPerson * info.rateToKrw);

  const categories: CategoryCostItem[] = [
    { key: "transport", label: "교통비", localAmount: transportLocal, krwAmount: Math.round(transportLocal * info.rateToKrw), confidence: transportLocal > 0 ? "estimated" : "free" },
    { key: "food", label: "식사", localAmount: foodLocal, krwAmount: Math.round(foodLocal * info.rateToKrw), confidence: foodLocal > 0 ? confidence : "free" },
    { key: "cafe", label: "카페/디저트", localAmount: cafeLocal, krwAmount: Math.round(cafeLocal * info.rateToKrw), confidence: cafeLocal > 0 ? confidence : "free" },
    { key: "admission", label: "입장료", localAmount: admissionLocal, krwAmount: Math.round(admissionLocal * info.rateToKrw), confidence: admissionLocal > 0 ? confidence : "free" },
    { key: "experience", label: "체험/기타", localAmount: experienceLocal, krwAmount: Math.round(experienceLocal * info.rateToKrw), confidence: experienceLocal > 0 ? confidence : "free" },
  ];

  return {
    localCurrency: currency,
    currencySymbol: info.symbol,
    admissionLocal,
    foodLocal,
    cafeLocal,
    transportLocal,
    experienceLocal,
    localTotalPerPerson,
    krwTotalPerPerson,
    confidence,
    categories,
  };
}

export function calculateDayCostSummary(
  stops: { costBreakdown?: StopCostBreakdown }[],
  peopleCount: number,
  destination: string
): DayCostSummary {
  const currency = getCityCurrency(destination);
  const info = EXCHANGE_RATES[currency];

  let totalTransport = 0;
  let totalFood = 0;
  let totalCafe = 0;
  let totalAdmission = 0;
  let totalExperience = 0;
  let hasUnknown = false;

  for (const stop of stops) {
    if (!stop.costBreakdown) continue;
    totalTransport += stop.costBreakdown.transportLocal;
    totalFood += stop.costBreakdown.foodLocal;
    totalCafe += stop.costBreakdown.cafeLocal;
    totalAdmission += stop.costBreakdown.admissionLocal;
    totalExperience += stop.costBreakdown.experienceLocal;
    if (stop.costBreakdown.confidence === "unknown") hasUnknown = true;
  }

  const perPersonLocal = totalTransport + totalFood + totalCafe + totalAdmission + totalExperience;
  const perPersonKrw = Math.round(perPersonLocal * info.rateToKrw);
  const totalGroupLocal = perPersonLocal * peopleCount;
  const totalGroupKrw = perPersonKrw * peopleCount;

  const categories: CategoryCostItem[] = [
    { key: "transport", label: "교통비", localAmount: totalTransport, krwAmount: Math.round(totalTransport * info.rateToKrw), confidence: "estimated" },
    { key: "food", label: "식사", localAmount: totalFood, krwAmount: Math.round(totalFood * info.rateToKrw), confidence: "estimated" },
    { key: "cafe", label: "카페/디저트", localAmount: totalCafe, krwAmount: Math.round(totalCafe * info.rateToKrw), confidence: "estimated" },
    { key: "admission", label: "입장료", localAmount: totalAdmission, krwAmount: Math.round(totalAdmission * info.rateToKrw), confidence: "estimated" },
    { key: "experience", label: "체험/기타", localAmount: totalExperience, krwAmount: Math.round(totalExperience * info.rateToKrw), confidence: "estimated" },
  ];

  return {
    localCurrency: currency,
    currencySymbol: info.symbol,
    perPersonLocal,
    perPersonKrw,
    totalGroupLocal,
    totalGroupKrw,
    confidence: hasUnknown ? "unknown" : "estimated",
    hasUnknown,
    categories,
  };
}
