import type { GeneratedDay } from "./itineraryGenerator";
import { placesByCity } from "../data/places";

export interface StyleAnalysisResult {
  culturePct: number;
  foodPct: number;
  shoppingPct: number;
  naturePct: number;
  nightPct: number;
}

export interface TripStatsResult {
  totalDays: number;
  totalStops: number;
  totalEstimatedCostKrw: number;
  dailyAvgCostKrw: number;
  totalTransitTimeMinutes: number;
  totalDistanceKm: number;
  mostBusyDayLabel: string;
  mostRelaxedDayLabel: string;
  walkRatioPct: number;
  transitRatioPct: number;
  taxiRatioPct: number;
  styleAnalysis: StyleAnalysisResult;
  conceptSummary: string;
}

export function calculateTripStats(days: GeneratedDay[], people: number, destination: string): TripStatsResult {
  const totalDays = days.length;
  let totalStops = 0;
  let totalEstimatedCostKrw = 0;
  let totalTransitTimeMinutes = 0;
  let totalDistanceKm = 0;

  let walkCount = 0;
  let transitCount = 0;
  let taxiCount = 0;

  let cultureCount = 0;
  let foodCount = 0;
  let shoppingCount = 0;
  let natureCount = 0;
  let nightCount = 0;

  let maxDayMinutes = -1;
  let minDayMinutes = Infinity;
  let mostBusyDayLabel = `DAY 1`;
  let mostRelaxedDayLabel = `DAY 1`;

  const cityPlaces = placesByCity(destination);

  days.forEach((day, idx) => {
    let dayMinutes = 0;
    const dayLabel = day.label || `DAY ${idx + 1}`;

    day.stops.forEach((stop) => {
      totalStops++;
      const transitMin = stop.travelMinutes ?? 15;
      totalTransitTimeMinutes += transitMin;
      dayMinutes += transitMin;

      const dist = stop.distanceFromPrevious ?? 1.2;
      totalDistanceKm += dist;

      // Cost estimation
      const matchedPlace = cityPlaces.find((p) => p.id === stop.placeId);
      const estCost = matchedPlace?.estimatedCost ?? (stop.category === "food" ? 25000 : 15000);
      totalEstimatedCostKrw += estCost * (people > 0 ? people : 1);

      // Transit mode breakdown
      const mode = (stop.transportFromPrevious || "").toLowerCase();
      if (mode.includes("도보") || mode.includes("walk")) {
        walkCount++;
      } else if (mode.includes("택시") || mode.includes("차량") || mode.includes("taxi")) {
        taxiCount++;
      } else {
        transitCount++;
      }

      // Category / Style Tag analysis
      const cat = stop.category || "";
      const tags = stop.tags || [];

      if (cat === "culture" || tags.some((t) => ["역사", "문화", "박물관", "신사", "사찰", "유적"].some((k) => t.includes(k)))) {
        cultureCount++;
      }
      if (cat === "food" || cat === "market" || tags.some((t) => ["맛집", "카페", "미식", "시장", "음식"].some((k) => t.includes(k)))) {
        foodCount++;
      }
      if (cat === "shopping" || tags.some((t) => ["쇼핑", "상점", "백화점", "몰"].some((k) => t.includes(k)))) {
        shoppingCount++;
      }
      if (cat === "nature" || tags.some((t) => ["공원", "자연", "바다", "산", "정원"].some((k) => t.includes(k)))) {
        natureCount++;
      }
      if (stop.recommendedTime === "evening" || tags.some((t) => ["야경", "노을", "일몰", "전망", "타워"].some((k) => t.includes(k)))) {
        nightCount++;
      }
    });

    if (dayMinutes > maxDayMinutes) {
      maxDayMinutes = dayMinutes;
      mostBusyDayLabel = dayLabel;
    }
    if (dayMinutes < minDayMinutes) {
      minDayMinutes = dayMinutes;
      mostRelaxedDayLabel = dayLabel;
    }
  });

  const validTotalStops = Math.max(1, totalStops);

  // Calculate percentages (clamped to realistic 15%-95% range for UI presentation)
  const culturePct = Math.min(95, Math.max(15, Math.round((cultureCount / validTotalStops) * 100) + 20));
  const foodPct = Math.min(95, Math.max(20, Math.round((foodCount / validTotalStops) * 100) + 25));
  const shoppingPct = Math.min(95, Math.max(15, Math.round((shoppingCount / validTotalStops) * 100) + 10));
  const naturePct = Math.min(95, Math.max(15, Math.round((natureCount / validTotalStops) * 100) + 12));
  const nightPct = Math.min(95, Math.max(20, Math.round((nightCount / validTotalStops) * 100) + 18));

  const totalTransitEntries = Math.max(1, walkCount + transitCount + taxiCount);
  const walkRatioPct = Math.round((walkCount / totalTransitEntries) * 100);
  const transitRatioPct = Math.round((transitCount / totalTransitEntries) * 100);
  const taxiRatioPct = Math.round((taxiCount / totalTransitEntries) * 100);

  const dailyAvgCostKrw = Math.round(totalEstimatedCostKrw / Math.max(1, totalDays));

  // Determine Concept Summary
  const topStyles = [
    { name: "문화", score: culturePct },
    { name: "미식", score: foodPct },
    { name: "자연", score: naturePct },
    { name: "야경", score: nightPct },
    { name: "쇼핑", score: shoppingPct },
  ].sort((a, b) => b.score - a.score);

  const primaryStyle = topStyles[0]?.name || "도심 관광";
  const secondaryStyle = topStyles[1]?.name || "현지 맛집";
  const conceptSummary = `${primaryStyle}와 ${secondaryStyle}을 중심으로 여유롭게 즐기는 ${totalDays}일 일정`;

  return {
    totalDays,
    totalStops,
    totalEstimatedCostKrw,
    dailyAvgCostKrw,
    totalTransitTimeMinutes,
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    mostBusyDayLabel,
    mostRelaxedDayLabel,
    walkRatioPct,
    transitRatioPct,
    taxiRatioPct,
    styleAnalysis: {
      culturePct,
      foodPct,
      shoppingPct,
      naturePct,
      nightPct,
    },
    conceptSummary,
  };
}
