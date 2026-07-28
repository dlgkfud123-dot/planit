export type CurrencyCode = "KRW" | "JPY" | "THB" | "EUR" | "GBP" | "USD" | "AUD";

export type CostConfidence = "confirmed" | "estimated" | "free" | "unknown";

export type CostCategoryKey = "transport" | "food" | "cafe" | "admission" | "experience";

export type CostSource = "explicit_price" | "category_average" | "free_entry" | "missing_data";

export type CategoryCostItem = {
  key: CostCategoryKey;
  label: string;
  localAmount: number | null;
  krwAmount: number | null;
  confidence: CostConfidence;
  source: CostSource;
};

export type StopCostBreakdown = {
  localCurrency: CurrencyCode;
  currencySymbol: string;
  admissionLocal: number | null;
  foodLocal: number | null;
  cafeLocal: number | null;
  transportLocal: number | null;
  experienceLocal: number | null;
  localTotalPerPerson: number | null;
  krwTotalPerPerson: number | null;
  confidence: CostConfidence;
  categories: CategoryCostItem[];
};

export type DayCostSummary = {
  localCurrency: CurrencyCode;
  currencySymbol: string;
  perPersonLocal: number | null;
  perPersonKrw: number | null;
  totalGroupLocal: number | null;
  totalGroupKrw: number | null;
  confidence: CostConfidence;
  hasUnknown: boolean;
  categories: CategoryCostItem[];
};

export const EXCHANGE_RATE_METADATA = {
  baseCurrency: "KRW" as CurrencyCode,
  referenceDate: "2026-07-28",
  source: "한국수출입은행 및 주요 은행 매매기준율 참고",
  disclaimerLabel: "2026-07-28 기준 참고 환율 (참고 환산액)",
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

export function formatCurrency(amount: number | null, currency: CurrencyCode): string {
  if (amount === null) return "정보 없음";
  const info = EXCHANGE_RATES[currency] || EXCHANGE_RATES.KRW;
  if (amount === 0) return currency === "KRW" ? "0원 (무료)" : `${info.symbol}0 (무료)`;
  if (currency === "KRW") {
    return `${Math.round(amount).toLocaleString()}원`;
  }
  return `${info.symbol}${Math.round(amount).toLocaleString()}`;
}

export function formatKrwReference(krwAmount: number | null): string {
  if (krwAmount === null) return "정보 없음";
  if (krwAmount === 0) return "무료";
  if (krwAmount >= 10000) {
    const man = (krwAmount / 10000).toFixed(1).replace(/\.0$/, "");
    return `약 ${man}만원`;
  }
  return `약 ${Math.round(krwAmount).toLocaleString()}원`;
}

export function estimateTransportFare(mode: string | undefined, distanceKm: number, currency: CurrencyCode): number {
  if (!mode || mode === "도보") return 0;
  const info = EXCHANGE_RATES[currency] || EXCHANGE_RATES.KRW;
  const baseKrw = mode === "기차" ? 12000 : mode === "보트·수상교통" ? 8000 : mode === "택시" ? Math.max(5000, 3000 + distanceKm * 1200) : 1600;
  return Math.round(baseKrw / info.rateToKrw);
}

export function calculateStopCost(
  placeCost: number,
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
  
  let admissionLocal: number | null = null;
  let foodLocal: number | null = null;
  let cafeLocal: number | null = null;
  let experienceLocal: number | null = null;

  let admissionConf: CostConfidence = "unknown";
  let foodConf: CostConfidence = "unknown";
  let cafeConf: CostConfidence = "unknown";
  let expConf: CostConfidence = "unknown";

  let admissionSource: CostSource = "missing_data";
  let foodSource: CostSource = "missing_data";
  let cafeSource: CostSource = "missing_data";
  let expSource: CostSource = "missing_data";

  const costInLocal = currency === "KRW" ? placeCost : Math.round(placeCost / info.rateToKrw);

  if (estimateStatus === "free") {
    admissionLocal = 0;
    admissionConf = "free";
    admissionSource = "free_entry";
  } else if (category === "food" || category === "market") {
    foodLocal = costInLocal > 0 ? costInLocal : Math.round(20000 / info.rateToKrw);
    foodConf = costInLocal > 0 ? (estimateStatus === "estimated" ? "confirmed" : "estimated") : "estimated";
    foodSource = costInLocal > 0 ? "explicit_price" : "category_average";
  } else if (tags.some(t => t.includes("카페"))) {
    cafeLocal = costInLocal > 0 ? costInLocal : Math.round(8000 / info.rateToKrw);
    cafeConf = costInLocal > 0 ? (estimateStatus === "estimated" ? "confirmed" : "estimated") : "estimated";
    cafeSource = costInLocal > 0 ? "explicit_price" : "category_average";
  } else if (category === "culture" || category === "landmark") {
    if (placeCost > 0) {
      admissionLocal = costInLocal;
      admissionConf = estimateStatus === "estimated" ? "confirmed" : "estimated";
      admissionSource = "explicit_price";
    } else if (estimateStatus === "variable") {
      admissionLocal = null;
      admissionConf = "unknown";
      admissionSource = "missing_data";
    }
  } else {
    if (placeCost > 0) {
      experienceLocal = costInLocal;
      expConf = estimateStatus === "estimated" ? "confirmed" : "estimated";
      expSource = "explicit_price";
    }
  }

  const knownLocals = [admissionLocal, foodLocal, cafeLocal, transportLocal, experienceLocal].filter((v): v is number => v !== null);
  const localTotalPerPerson = knownLocals.reduce((sum, v) => sum + v, 0);
  const krwTotalPerPerson = Math.round(localTotalPerPerson * info.rateToKrw);

  const hasUnknown = admissionLocal === null && foodLocal === null && cafeLocal === null && experienceLocal === null;
  const overallConfidence: CostConfidence = hasUnknown ? "unknown" : (estimateStatus === "free" ? "free" : "estimated");

  const categories: CategoryCostItem[] = [
    {
      key: "transport",
      label: "교통비",
      localAmount: transportLocal,
      krwAmount: Math.round(transportLocal * info.rateToKrw),
      confidence: transportLocal > 0 ? "estimated" : "free",
      source: transportLocal > 0 ? "category_average" : "free_entry",
    },
    {
      key: "food",
      label: "식사",
      localAmount: foodLocal,
      krwAmount: foodLocal !== null ? Math.round(foodLocal * info.rateToKrw) : null,
      confidence: foodConf,
      source: foodSource,
    },
    {
      key: "cafe",
      label: "카페/디저트",
      localAmount: cafeLocal,
      krwAmount: cafeLocal !== null ? Math.round(cafeLocal * info.rateToKrw) : null,
      confidence: cafeConf,
      source: cafeSource,
    },
    {
      key: "admission",
      label: "입장료",
      localAmount: admissionLocal,
      krwAmount: admissionLocal !== null ? Math.round(admissionLocal * info.rateToKrw) : null,
      confidence: admissionConf,
      source: admissionSource,
    },
    {
      key: "experience",
      label: "체험/기타",
      localAmount: experienceLocal,
      krwAmount: experienceLocal !== null ? Math.round(experienceLocal * info.rateToKrw) : null,
      confidence: expConf,
      source: expSource,
    },
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
    confidence: overallConfidence,
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
  let totalFood: number | null = 0;
  let totalCafe: number | null = 0;
  let totalAdmission: number | null = 0;
  let totalExperience: number | null = 0;
  let hasUnknown = false;

  for (const stop of stops) {
    if (!stop.costBreakdown) continue;

    if (stop.costBreakdown.transportLocal !== null) totalTransport += stop.costBreakdown.transportLocal;

    if (stop.costBreakdown.foodLocal === null) { if (totalFood === 0) totalFood = null; }
    else if (totalFood !== null) totalFood += stop.costBreakdown.foodLocal;

    if (stop.costBreakdown.cafeLocal === null) { if (totalCafe === 0) totalCafe = null; }
    else if (totalCafe !== null) totalCafe += stop.costBreakdown.cafeLocal;

    if (stop.costBreakdown.admissionLocal === null) { if (totalAdmission === 0) totalAdmission = null; }
    else if (totalAdmission !== null) totalAdmission += stop.costBreakdown.admissionLocal;

    if (stop.costBreakdown.experienceLocal === null) { if (totalExperience === 0) totalExperience = null; }
    else if (totalExperience !== null) totalExperience += stop.costBreakdown.experienceLocal;

    if (stop.costBreakdown.confidence === "unknown") hasUnknown = true;
  }

  const knownList = [totalTransport, totalFood, totalCafe, totalAdmission, totalExperience].filter((v): v is number => v !== null);
  const perPersonLocal = knownList.reduce((s, v) => s + v, 0);
  const perPersonKrw = Math.round(perPersonLocal * info.rateToKrw);
  const totalGroupLocal = perPersonLocal * peopleCount;
  const totalGroupKrw = perPersonKrw * peopleCount;

  const categories: CategoryCostItem[] = [
    { key: "transport", label: "교통비", localAmount: totalTransport, krwAmount: Math.round(totalTransport * info.rateToKrw), confidence: "estimated", source: "category_average" },
    { key: "food", label: "식사", localAmount: totalFood, krwAmount: totalFood !== null ? Math.round(totalFood * info.rateToKrw) : null, confidence: totalFood !== null ? "estimated" : "unknown", source: totalFood !== null ? "category_average" : "missing_data" },
    { key: "cafe", label: "카페/디저트", localAmount: totalCafe, krwAmount: totalCafe !== null ? Math.round(totalCafe * info.rateToKrw) : null, confidence: totalCafe !== null ? "estimated" : "unknown", source: totalCafe !== null ? "category_average" : "missing_data" },
    { key: "admission", label: "입장료", localAmount: totalAdmission, krwAmount: totalAdmission !== null ? Math.round(totalAdmission * info.rateToKrw) : null, confidence: totalAdmission !== null ? "estimated" : "unknown", source: totalAdmission !== null ? "explicit_price" : "missing_data" },
    { key: "experience", label: "체험/기타", localAmount: totalExperience, krwAmount: totalExperience !== null ? Math.round(totalExperience * info.rateToKrw) : null, confidence: totalExperience !== null ? "estimated" : "unknown", source: totalExperience !== null ? "explicit_price" : "missing_data" },
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
