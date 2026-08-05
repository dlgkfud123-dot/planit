import type { HotelOffer } from "../types/hotel";
import type { FlightOffer, TravelBudgetSummary, ExchangeRateInfo } from "../types/flight";
import { getAirportCoordinates } from "../data/airports.ts";

export type PackageCostBreakdown = {
  flightTotal: number;
  hotelPayableTotal: number;
  foodBudget: number;
  localTransportBudget: number;
  activityBudget: number;
  reserveBudget: number;
  estimatedGrandTotal: number;
  totalBudget: number;
  remainingBudget: number;
};

export type PackageComparison = {
  baselinePackageId: string;
  alternativePackageId: string;
  changedComponents: Array<"flight" | "hotel">;
  flightDifference: number;
  hotelDifference: number;
  totalDifference: number;
  savingsAmount: number;
  additionalCost: number;
  comparisonText: string;
};

export type PackageComboBadge = "balanced" | "cheapest" | "best_location" | "premium_alternative" | "rank_1st" | "least_excess";

export type PackageCombo = {
  packageId: string;
  badges: PackageComboBadge[];
  title: string;
  flight: FlightOffer;
  hotel: HotelOffer;
  hotelDetailId: string;
  rateHotelId: string;
  costBreakdown: PackageCostBreakdown;
  packageScore: number;
  packageScoreGrade: "S · Excellent" | "A · Very Good" | "B · Good" | "C · Fair" | "D · Low Match";
  comparison: PackageComparison;
  comparisonMode: "recommendation_baseline" | "current_selection";
  distanceFromCityCenterKm: number;
  distanceFromAirportKm: number | null;
  avgDistanceFromItineraryKm: number;
  recommendationReasons: string[];
};

export type OverBudgetAlternative = {
  alternativePackageId: string;
  baselinePackageId: string;
  type: "hotel_change" | "flight_change" | "both_change";
  title: string;
  description: string;
  changedComponents: Array<"flight" | "hotel">;
  flightSavings: number;
  hotelSavings: number;
  totalSavings: number;
  additionalCost: number;
  newGrandTotal: number;
  isWithinBudget: boolean;
  alternativeFlight?: FlightOffer;
  alternativeHotel?: HotelOffer;
};

export function getPackageScoreGrade(score: number): PackageCombo["packageScoreGrade"] {
  if (score >= 90) return "S · Excellent";
  if (score >= 80) return "A · Very Good";
  if (score >= 70) return "B · Good";
  if (score >= 60) return "C · Fair";
  return "D · Low Match";
}

export function calculateAirportDistanceKm(
  hotelLatitude: number | null,
  hotelLongitude: number | null,
  arrivalAirport: string
): number | null {
  const airport = getAirportCoordinates(arrivalAirport);
  if (hotelLatitude === null || hotelLongitude === null || !airport) return null;
  const toRadians = (value: number) => value * Math.PI / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(airport.latitude - hotelLatitude);
  const dLon = toRadians(airport.longitude - hotelLongitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(hotelLatitude)) * Math.cos(toRadians(airport.latitude)) *
    Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

export function calculatePackageCostBreakdown(
  flightTotal: number,
  hotelPayableTotal: number,
  totalBudget: number,
  passengerCount: number,
  nights: number
): PackageCostBreakdown {
  const numDays = nights + 1;
  const foodBudget = Math.round(passengerCount * numDays * 40000);
  const localTransportBudget = Math.round(passengerCount * numDays * 15000);
  const activityBudget = Math.round(passengerCount * numDays * 20000);
  const reserveBudget = Math.round(totalBudget * 0.05);

  const estimatedGrandTotal = flightTotal + hotelPayableTotal + foodBudget + localTransportBudget + activityBudget + reserveBudget;
  const remainingBudget = totalBudget - estimatedGrandTotal;

  const sumCheck = flightTotal + hotelPayableTotal + foodBudget + localTransportBudget + activityBudget + reserveBudget;
  if (sumCheck !== estimatedGrandTotal) {
    throw new Error(`PackageCostBreakdown assertion failed: sumCheck (${sumCheck}) !== estimatedGrandTotal (${estimatedGrandTotal})`);
  }

  return {
    flightTotal,
    hotelPayableTotal,
    foodBudget,
    localTransportBudget,
    activityBudget,
    reserveBudget,
    estimatedGrandTotal,
    totalBudget,
    remainingBudget,
  };
}

export function calculateTravelBudgetSummary(
  totalBudget: number,
  passengerCount: number,
  selectedFlight: FlightOffer | null,
  selectedHotel: HotelOffer | null,
  nights: number,
  exchangeRateInfo?: ExchangeRateInfo | null
): TravelBudgetSummary {
  const flightRawTotal = selectedFlight?.price.payableTotal ?? null;
  const hotelRawTotal = selectedHotel?.price.payableTotal ?? null;

  const flightCurrency = selectedFlight?.price.currency || "KRW";
  const hotelCurrency = selectedHotel?.price.currency || "KRW";

  const hasFlight = selectedFlight !== null && flightRawTotal !== null;
  const hasHotel = selectedHotel !== null && hotelRawTotal !== null;
  const isCurrencyMismatch = hasFlight && hasHotel && flightCurrency.toUpperCase() !== hotelCurrency.toUpperCase();

  if (isCurrencyMismatch) {
    if (exchangeRateInfo && exchangeRateInfo.rate > 0) {
      let flightTotalInTarget = flightRawTotal;
      let hotelTotalInTarget = hotelRawTotal;

      if (exchangeRateInfo.baseCurrency === flightCurrency.toUpperCase() && exchangeRateInfo.targetCurrency === hotelCurrency.toUpperCase()) {
        flightTotalInTarget = Math.round(flightRawTotal * exchangeRateInfo.rate);
      } else if (exchangeRateInfo.baseCurrency === hotelCurrency.toUpperCase() && exchangeRateInfo.targetCurrency === flightCurrency.toUpperCase()) {
        hotelTotalInTarget = Math.round(hotelRawTotal * exchangeRateInfo.rate);
      }

      const breakdown = calculatePackageCostBreakdown(flightTotalInTarget, hotelTotalInTarget, totalBudget, passengerCount, nights);
      const remainingBudget = breakdown.remainingBudget;

      let budgetStatus: TravelBudgetSummary["budgetStatus"] = "within_budget";
      let statusMessage = "";

      const tenPercentThreshold = totalBudget * 0.1;

      if (remainingBudget > tenPercentThreshold) {
        budgetStatus = "within_budget";
        statusMessage = `전체 예산 안에서 여행이 가능합니다 (환율 1 ${exchangeRateInfo.baseCurrency} = ${exchangeRateInfo.rate.toLocaleString()} ${exchangeRateInfo.targetCurrency} 변환 기준). 약 ₩${remainingBudget.toLocaleString()}원 여유가 있습니다.`;
      } else if (remainingBudget >= 0 && remainingBudget <= tenPercentThreshold) {
        budgetStatus = "near_limit";
        statusMessage = `예산에 거의 맞습니다 (여유 ₩${remainingBudget.toLocaleString()}원, 환율 변환 기준).`;
      } else {
        budgetStatus = "over_budget";
        const overAmount = Math.abs(remainingBudget);
        statusMessage = `현재 예산보다 약 ₩${overAmount.toLocaleString()}원 초과합니다 (환율 변환 기준).`;
      }

      return {
        totalBudget,
        passengerCount,
        selectedFlightTotal: flightRawTotal,
        selectedHotelTotal: hotelRawTotal,
        selectedFlightCurrency: flightCurrency,
        selectedHotelCurrency: hotelCurrency,
        estimatedFoodBudget: breakdown.foodBudget,
        estimatedLocalTransportBudget: breakdown.localTransportBudget,
        estimatedActivityBudget: breakdown.activityBudget,
        reserveBudget: breakdown.reserveBudget,
        committedTotal: flightTotalInTarget + hotelTotalInTarget,
        estimatedGrandTotal: breakdown.estimatedGrandTotal,
        remainingBudget: breakdown.remainingBudget,
        isTotalAvailable: true,
        currencyMismatch: true,
        conversionPending: false,
        currencyMismatchMessage: null,
        exchangeRateInfo,
        budgetStatus,
        statusMessage,
        currency: hotelCurrency,
      };
    }

    return {
      totalBudget,
      passengerCount,
      selectedFlightTotal: flightRawTotal,
      selectedHotelTotal: hotelRawTotal,
      selectedFlightCurrency: flightCurrency,
      selectedHotelCurrency: hotelCurrency,
      estimatedFoodBudget: 0,
      estimatedLocalTransportBudget: 0,
      estimatedActivityBudget: 0,
      reserveBudget: 0,
      committedTotal: null,
      estimatedGrandTotal: null,
      remainingBudget: null,
      isTotalAvailable: false,
      currencyMismatch: true,
      conversionPending: true,
      currencyMismatchMessage: `항공 ${flightCurrency}와 숙소 ${hotelCurrency}의 통화 변환 후 총액이 계산됩니다.`,
      exchangeRateInfo: null,
      budgetStatus: "currency_mismatch",
      statusMessage: "환율 확인 필요",
      currency: "KRW",
    };
  }

  const currency = flightCurrency || hotelCurrency || "KRW";

  if (flightRawTotal === null || hotelRawTotal === null) {
    const knownCommitted = (flightRawTotal || 0) + (hotelRawTotal || 0);
    return {
      totalBudget,
      passengerCount,
      selectedFlightTotal: flightRawTotal,
      selectedHotelTotal: hotelRawTotal,
      selectedFlightCurrency: flightCurrency,
      selectedHotelCurrency: hotelCurrency,
      estimatedFoodBudget: 0,
      estimatedLocalTransportBudget: 0,
      estimatedActivityBudget: 0,
      reserveBudget: 0,
      committedTotal: knownCommitted,
      estimatedGrandTotal: knownCommitted,
      remainingBudget: totalBudget - knownCommitted,
      isTotalAvailable: true,
      currencyMismatch: false,
      conversionPending: false,
      currencyMismatchMessage: null,
      budgetStatus: "incomplete",
      statusMessage: "항공 또는 숙소 가격이 아직 확정되지 않아 전체 예산을 계산할 수 없습니다.",
      currency,
    };
  }

  const breakdown = calculatePackageCostBreakdown(flightRawTotal, hotelRawTotal, totalBudget, passengerCount, nights);

  let budgetStatus: TravelBudgetSummary["budgetStatus"] = "within_budget";
  let statusMessage = "";

  const tenPercentThreshold = totalBudget * 0.1;

  if (breakdown.remainingBudget > tenPercentThreshold) {
    budgetStatus = "within_budget";
    statusMessage = `전체 예산 안에서 여행이 가능합니다. 약 ₩${breakdown.remainingBudget.toLocaleString()}원 여유가 있습니다.`;
  } else if (breakdown.remainingBudget >= 0 && breakdown.remainingBudget <= tenPercentThreshold) {
    budgetStatus = "near_limit";
    statusMessage = `예산에 거의 맞습니다 (여유 ₩${breakdown.remainingBudget.toLocaleString()}원). 예상치 변동에 대비해 추가 여유가 필요합니다.`;
  } else {
    budgetStatus = "over_budget";
    const overAmount = Math.abs(breakdown.remainingBudget);
    statusMessage = `현재 조건에서 전체 예산에 맞는 항공·숙소 조합이 없습니다. (가장 적게 초과하는 조합은 ₩${overAmount.toLocaleString()}원 높습니다)`;
  }

  return {
    totalBudget,
    passengerCount,
    selectedFlightTotal: flightRawTotal,
    selectedHotelTotal: hotelRawTotal,
    selectedFlightCurrency: flightCurrency,
    selectedHotelCurrency: hotelCurrency,
    estimatedFoodBudget: breakdown.foodBudget,
    estimatedLocalTransportBudget: breakdown.localTransportBudget,
    estimatedActivityBudget: breakdown.activityBudget,
    reserveBudget: breakdown.reserveBudget,
    committedTotal: breakdown.flightTotal + breakdown.hotelPayableTotal,
    estimatedGrandTotal: breakdown.estimatedGrandTotal,
    remainingBudget: breakdown.remainingBudget,
    isTotalAvailable: true,
    currencyMismatch: false,
    conversionPending: false,
    currencyMismatchMessage: null,
    budgetStatus,
    statusMessage,
    currency,
  };
}

export function calculatePackageCombos(
  flights: FlightOffer[],
  hotels: HotelOffer[],
  totalBudget: number,
  passengerCount: number,
  nights: number,
  currentSelectedPackageId: string | null = null
): PackageCombo[] {
  const validFlights = flights.filter((f) => f.price.payableTotal !== null);
  const validHotels = hotels.filter((h) => h.price.payableTotal !== null);

  if (validFlights.length === 0 || validHotels.length === 0) return [];

  const comboMap = new Map<string, {
    packageId: string;
    flight: FlightOffer;
    hotel: HotelOffer;
    hotelDetailId: string;
    rateHotelId: string;
    breakdown: PackageCostBreakdown;
    packageScore: number;
    cityCenterKm: number;
    airportKm: number | null;
    itineraryKm: number;
  }>();

  validFlights.forEach((f) => {
    validHotels.forEach((h) => {
      const fTotal = f.price.payableTotal!;
      const hPayable = h.price.payableTotal!;

      const hotelDetailId = h.providerHotelId;
      const rateHotelId = h.providerHotelId;
      if (h.providerHotelId !== hotelDetailId || hotelDetailId !== rateHotelId) return;

      const comboKey = `pkg_${f.providerOfferId}_${h.providerHotelId}`;
      if (comboMap.has(comboKey)) return;

      const breakdown = calculatePackageCostBreakdown(fTotal, hPayable, totalBudget, passengerCount, nights);
      const rem = breakdown.remainingBudget;

      let budgetFitScore = 50;
      if (rem >= 0) {
        budgetFitScore = Math.min(100, 80 + Math.round((rem / totalBudget) * 40));
      } else {
        const overRatio = Math.abs(rem) / totalBudget;
        budgetFitScore = Math.max(0, Math.round(50 - overRatio * 150));
      }

      const cityCenterKm = h.distanceFromCenterKm;
      const airportKm = calculateAirportDistanceKm(
        h.latitude,
        h.longitude,
        f.outbound.destinationAirport
      );
      const itineraryKm = h.avgItineraryDistanceKm || cityCenterKm;

      const usabilityScore = (f.outbound.isDirect ? 50 : 30) + (itineraryKm < 3 ? 50 : 30);
      const packageScore = Math.round(
        budgetFitScore * 0.40 +
        f.flightScore * 0.25 +
        h.tripScore * 0.25 +
        usabilityScore * 0.10
      );

      comboMap.set(comboKey, {
        packageId: comboKey,
        flight: f,
        hotel: h,
        hotelDetailId,
        rateHotelId,
        breakdown,
        packageScore,
        cityCenterKm,
        airportKm,
        itineraryKm,
      });
    });
  });

  const allUniqueCombos = Array.from(comboMap.values());
  if (allUniqueCombos.length === 0) return [];

  const sortedByScore = [...allUniqueCombos].sort((a, b) => b.packageScore - a.packageScore);
  const balancedRaw = sortedByScore[0];

  const sortedByPrice = [...allUniqueCombos].sort((a, b) => a.breakdown.estimatedGrandTotal - b.breakdown.estimatedGrandTotal);
  const cheapestRaw = sortedByPrice[0];

  const sortedByLocation = [...allUniqueCombos].sort((a, b) => (a.itineraryKm + (a.flight.outbound.isDirect ? 0 : 5)) - (b.itineraryKm + (b.flight.outbound.isDirect ? 0 : 5)));
  const bestLocationRaw = sortedByLocation[0];

  // Baseline for Comparison: If user explicitly selected a package, compare against current selection; otherwise compare against cheapest baseline.
  let baselineRaw = balancedRaw;
  let comparisonMode: PackageCombo["comparisonMode"] = "recommendation_baseline";

  if (currentSelectedPackageId && comboMap.has(currentSelectedPackageId)) {
    baselineRaw = comboMap.get(currentSelectedPackageId)!;
    comparisonMode = "current_selection";
  }

  const baselineGrandTotal = baselineRaw.breakdown.estimatedGrandTotal;
  const isOverBudgetGlobal = allUniqueCombos.every((c) => c.breakdown.remainingBudget < 0);

  const resultPackageMap = new Map<string, PackageCombo>();

  function registerOrMergeCombo(
    raw: typeof balancedRaw,
    badge: PackageComboBadge,
    defaultTitle: string
  ) {
    const existing = resultPackageMap.get(raw.packageId);

    const fDiff = raw.flight.price.payableTotal! - baselineRaw.flight.price.payableTotal!;
    const hDiff = raw.hotel.price.payableTotal! - baselineRaw.hotel.price.payableTotal!;
    const totalDiff = raw.breakdown.estimatedGrandTotal - baselineGrandTotal;

    const changedComponents: Array<"flight" | "hotel"> = [];
    if (raw.flight.providerOfferId !== baselineRaw.flight.providerOfferId) changedComponents.push("flight");
    if (raw.hotel.providerHotelId !== baselineRaw.hotel.providerHotelId) changedComponents.push("hotel");

    const savingsAmount = totalDiff < 0 ? Math.abs(totalDiff) : 0;
    const additionalCost = totalDiff > 0 ? totalDiff : 0;

    let comparisonText = "";
    if (comparisonMode === "current_selection") {
      if (raw.packageId === baselineRaw.packageId) {
        comparisonText = "현재 선택된 조합입니다.";
      } else if (savingsAmount > 0) {
        comparisonText = `'${raw.hotel.hotelName}' 조합으로 변경하면 ₩${savingsAmount.toLocaleString()}원 절약됩니다.`;
      } else {
        comparisonText = `'${raw.hotel.hotelName}' 조합으로 변경하면 ₩${additionalCost.toLocaleString()}원 추가됩니다.`;
      }
    } else {
      if (savingsAmount > 0) {
        comparisonText = `기준 대비 ₩${savingsAmount.toLocaleString()}원 절감됩니다.`;
      } else if (additionalCost > 0) {
        comparisonText = `기준 대비 ₩${additionalCost.toLocaleString()}원 추가됩니다.`;
      } else {
        comparisonText = "기준 추천 조합입니다.";
      }
    }

    const comparison: PackageComparison = {
      baselinePackageId: baselineRaw.packageId,
      alternativePackageId: raw.packageId,
      changedComponents,
      flightDifference: fDiff,
      hotelDifference: hDiff,
      totalDifference: totalDiff,
      savingsAmount,
      additionalCost,
      comparisonText,
    };

    const rem = raw.breakdown.remainingBudget;
    const reasons: string[] = [];
    if (badge === "balanced" || badge === "rank_1st") {
      reasons.push(`현재 조회된 조합 중 Package Score가 가장 높습니다 (${raw.packageScore}점).`);
    } else if (badge === "cheapest") {
      reasons.push(`현재 조회된 조합 중 전체 예상 비용이 가장 낮습니다 (₩${raw.breakdown.estimatedGrandTotal.toLocaleString()}원).`);
    } else if (badge === "best_location") {
      reasons.push(`현재 조회된 조합 중 일정 장소 평균 거리가 가장 짧습니다 (${raw.itineraryKm}km).`);
    } else {
      reasons.push(`현재 조회된 조합 중 우수한 대안입니다 (${raw.packageScore}점).`);
    }

    if (rem >= 0) {
      reasons.push(`전체 예산(₩${totalBudget.toLocaleString()}원) 내 ₩${rem.toLocaleString()}원 여유가 있습니다.`);
    } else {
      reasons.push(`현재 전체 예산을 ₩${Math.abs(rem).toLocaleString()}원 초과합니다.`);
    }

    // Refined title when over budget
    let title = defaultTitle;
    if (isOverBudgetGlobal && badge === "balanced") {
      title = "예산을 가장 적게 초과하는 조합";
    }

    const grade = getPackageScoreGrade(raw.packageScore);

    if (existing) {
      if (!existing.badges.includes(badge)) {
        existing.badges.push(badge);
        if (badge === "cheapest") {
          existing.recommendationReasons.unshift(`현재 조회된 조합 중 전체 예상 비용이 가장 낮습니다 (₩${raw.breakdown.estimatedGrandTotal.toLocaleString()}원).`);
        } else if (badge === "best_location") {
          existing.recommendationReasons.unshift(`현재 조회된 조합 중 일정 장소 평균 거리가 가장 짧습니다 (${raw.itineraryKm}km).`);
        }
      }
    } else {
      const badgesList: PackageComboBadge[] = [badge];
      if (raw.packageId === balancedRaw.packageId && !badgesList.includes("rank_1st")) {
        badgesList.push("rank_1st");
      }

      resultPackageMap.set(raw.packageId, {
        packageId: raw.packageId,
        badges: badgesList,
        title,
        flight: raw.flight,
        hotel: raw.hotel,
        hotelDetailId: raw.hotelDetailId,
        rateHotelId: raw.rateHotelId,
        costBreakdown: raw.breakdown,
        packageScore: raw.packageScore,
        packageScoreGrade: grade,
        comparison,
        comparisonMode,
        distanceFromCityCenterKm: raw.cityCenterKm,
        distanceFromAirportKm: raw.airportKm,
        avgDistanceFromItineraryKm: raw.itineraryKm,
        recommendationReasons: reasons,
      });
    }
  }

  // Register balanced
  registerOrMergeCombo(balancedRaw, "balanced", "가장 균형 잡힌 AI 추천 조합");

  // Register cheapest
  registerOrMergeCombo(cheapestRaw, "cheapest", "가장 저렴한 가성비 조합");

  // Register best location
  registerOrMergeCombo(bestLocationRaw, "best_location", "동선 및 입지가 가장 좋은 조합");

  return Array.from(resultPackageMap.values());
}

export function calculateBudgetAlternatives(
  selectedFlight: FlightOffer | null,
  selectedHotel: HotelOffer | null,
  flights: FlightOffer[],
  hotels: HotelOffer[],
  totalBudget: number,
  passengerCount: number,
  nights: number
): OverBudgetAlternative[] {
  if (!selectedFlight || !selectedHotel || selectedFlight.price.payableTotal === null || selectedHotel.price.payableTotal === null) {
    return [];
  }

  const baselineFlightPayable = selectedFlight.price.payableTotal!;
  const baselineHotelPayable = selectedHotel.price.payableTotal!;
  const baselineBreakdown = calculatePackageCostBreakdown(baselineFlightPayable, baselineHotelPayable, totalBudget, passengerCount, nights);

  if (baselineBreakdown.estimatedGrandTotal <= totalBudget) return [];

  const baselinePackageId = `pkg_${selectedFlight.providerOfferId}_${selectedHotel.providerHotelId}`;
  const alternatives: OverBudgetAlternative[] = [];

  const validHotels = hotels.filter((h) => h.providerHotelId !== selectedHotel.providerHotelId && h.price.payableTotal !== null && h.price.payableTotal < baselineHotelPayable);
  const validFlights = flights.filter((f) => f.providerOfferId !== selectedFlight.providerOfferId && f.price.payableTotal !== null && f.price.payableTotal < baselineFlightPayable);

  if (validHotels.length > 0) {
    const altH = validHotels.sort((a, b) => a.price.payableTotal! - b.price.payableTotal!)[0];
    const hotelSavings = baselineHotelPayable - altH.price.payableTotal!;
    const altBreakdown = calculatePackageCostBreakdown(baselineFlightPayable, altH.price.payableTotal!, totalBudget, passengerCount, nights);
    const altId = `pkg_${selectedFlight.providerOfferId}_${altH.providerHotelId}`;

    const totalDiff = altBreakdown.estimatedGrandTotal - baselineBreakdown.estimatedGrandTotal;
    const savingsAmount = totalDiff < 0 ? Math.abs(totalDiff) : 0;
    const additionalCost = totalDiff > 0 ? totalDiff : 0;

    alternatives.push({
      alternativePackageId: altId,
      baselinePackageId,
      type: "hotel_change",
      title: "숙소 변경 대안",
      description: `숙소를 '${altH.hotelName}'(으)로 변경하면 ₩${hotelSavings.toLocaleString()}원 절약됩니다.`,
      changedComponents: ["hotel"],
      flightSavings: 0,
      hotelSavings,
      totalSavings: savingsAmount,
      additionalCost,
      newGrandTotal: altBreakdown.estimatedGrandTotal,
      isWithinBudget: altBreakdown.estimatedGrandTotal <= totalBudget,
      alternativeHotel: altH,
    });
  }

  if (validFlights.length > 0) {
    const altF = validFlights.sort((a, b) => a.price.payableTotal! - b.price.payableTotal!)[0];
    const flightSavings = baselineFlightPayable - altF.price.payableTotal!;
    const altBreakdown = calculatePackageCostBreakdown(altF.price.payableTotal!, baselineHotelPayable, totalBudget, passengerCount, nights);
    const altId = `pkg_${altF.providerOfferId}_${selectedHotel.providerHotelId}`;

    const totalDiff = altBreakdown.estimatedGrandTotal - baselineBreakdown.estimatedGrandTotal;
    const savingsAmount = totalDiff < 0 ? Math.abs(totalDiff) : 0;
    const additionalCost = totalDiff > 0 ? totalDiff : 0;

    alternatives.push({
      alternativePackageId: altId,
      baselinePackageId,
      type: "flight_change",
      title: "항공편 변경 대안",
      description: `항공편을 '${altF.ownerAirlineName}'(으)로 변경하면 ₩${flightSavings.toLocaleString()}원 절약됩니다.`,
      changedComponents: ["flight"],
      flightSavings,
      hotelSavings: 0,
      totalSavings: savingsAmount,
      additionalCost,
      newGrandTotal: altBreakdown.estimatedGrandTotal,
      isWithinBudget: altBreakdown.estimatedGrandTotal <= totalBudget,
      alternativeFlight: altF,
    });
  }

  if (validHotels.length > 0 && validFlights.length > 0) {
    const altH = validHotels.sort((a, b) => a.price.payableTotal! - b.price.payableTotal!)[0];
    const altF = validFlights.sort((a, b) => a.price.payableTotal! - b.price.payableTotal!)[0];
    const hotelSavings = baselineHotelPayable - altH.price.payableTotal!;
    const flightSavings = baselineFlightPayable - altF.price.payableTotal!;
    const altBreakdown = calculatePackageCostBreakdown(altF.price.payableTotal!, altH.price.payableTotal!, totalBudget, passengerCount, nights);
    const altId = `pkg_${altF.providerOfferId}_${altH.providerHotelId}`;

    const totalDiff = altBreakdown.estimatedGrandTotal - baselineBreakdown.estimatedGrandTotal;
    const savingsAmount = totalDiff < 0 ? Math.abs(totalDiff) : 0;
    const additionalCost = totalDiff > 0 ? totalDiff : 0;

    alternatives.push({
      alternativePackageId: altId,
      baselinePackageId,
      type: "both_change",
      title: "항공 & 숙소 동시 변경 대안",
      description: `항공편('${altF.ownerAirlineName}')과 숙소('${altH.hotelName}')를 함께 변경 시 총 ₩${savingsAmount.toLocaleString()}원 절약됩니다.`,
      changedComponents: ["flight", "hotel"],
      flightSavings,
      hotelSavings,
      totalSavings: savingsAmount,
      additionalCost,
      newGrandTotal: altBreakdown.estimatedGrandTotal,
      isWithinBudget: altBreakdown.estimatedGrandTotal <= totalBudget,
      alternativeFlight: altF,
      alternativeHotel: altH,
    });
  }

  return alternatives;
}
