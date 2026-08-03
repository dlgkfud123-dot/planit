import { placesByCity, type Place } from "../data/places";
import type { GeneratedDay, GeneratedStop, GenerateOptions } from "./itineraryGenerator";
import { refreshDay } from "./itineraryGenerator";
import { parseOpeningHoursRule } from "./openingHoursValidator";
import type { DayWeatherInfo } from "./weatherService";
import { distanceKm } from "./distance";
import { chooseTransport, estimatedRouteDistance, transportMinutes } from "./transport";

export type SmartCandidate = {
  place: Place;
  score: number;
  matchReason: string;
  distanceFromCurrentKm: number;
  estimatedTravelMinutes: number;
};

export function findSmartCandidates(
  targetStop: GeneratedStop,
  currentPlan: GeneratedDay[],
  destination: string,
  options: GenerateOptions,
  dayWeather?: DayWeatherInfo,
  activeDayIndex: number = 0,
  targetStopIndex: number = 0
): SmartCandidate[] {
  const usedIds = new Set(currentPlan.flatMap(d => d.stops.map(s => s.placeId)));
  const allCityPlaces = placesByCity(destination);
  const currentDayStops = currentPlan[activeDayIndex]?.stops || [];

  const prevStop = currentDayStops[targetStopIndex - 1];
  const nextStop = currentDayStops[targetStopIndex + 1];

  const targetDuration = Number.parseInt(targetStop.duration) || 90;
  const targetCost = targetStop.cost || 0;

  const candidates: SmartCandidate[] = [];

  for (const place of allCityPlaces) {
    if (usedIds.has(place.id) || place.nearbyTrip) continue;

    let candidateScore = 0;
    const reasons: string[] = [];

    // 1. District matching
    if (place.district === targetStop.district) {
      candidateScore += 45;
      reasons.push(`${place.district} 인접`);
    } else {
      candidateScore += 10;
    }

    // 2. Category & Atmosphere matching
    if (place.category === targetStop.category) {
      candidateScore += 30;
      reasons.push(`${place.category} 카테고리 매칭`);
    }

    // 3. User Style matching
    if (options.style) {
      const styleKey = options.style.toLowerCase();
      if (place.tags.some(t => t.toLowerCase().includes(styleKey))) {
        candidateScore += 25;
        reasons.push("여행 취향 부합");
      }
    }

    // 4. Time slot suitability
    if (place.recommendedTime) {
      const [vH] = targetStop.time.split(":").map(Number);
      const isMorning = vH < 12;
      const isAfternoon = vH >= 12 && vH < 17;
      const isEvening = vH >= 17;

      if ((isMorning && place.recommendedTime === "morning") ||
          (isAfternoon && place.recommendedTime === "afternoon") ||
          (isEvening && place.recommendedTime === "evening")) {
        candidateScore += 20;
        reasons.push("방문 시각대 적합");
      }
    }

    // 5. Duration similarity
    const durDiff = Math.abs(place.recommendedDuration - targetDuration);
    if (durDiff <= 30) {
      candidateScore += 15;
    }

    // 6. Cost difference ratio
    if (targetCost > 0) {
      const costRatio = Math.abs(place.estimatedCost - targetCost) / targetCost;
      if (costRatio <= 0.3) {
        candidateScore += 15;
        reasons.push("비용 수준 유사");
      }
    }

    // 7. Total Route Distance Impact: prev -> candidate -> next
    let routeDistPen = 0;
    if (prevStop) {
      const dPrev = distanceKm({ latitude: prevStop.lat, longitude: prevStop.lng }, { latitude: place.latitude, longitude: place.longitude });
      routeDistPen += dPrev * 4;
    }
    if (nextStop) {
      const dNext = distanceKm({ latitude: place.latitude, longitude: place.longitude }, { latitude: nextStop.lat, longitude: nextStop.lng });
      routeDistPen += dNext * 4;
    }
    candidateScore -= routeDistPen;

    // 8. Weather suitability
    if (dayWeather) {
      if (dayWeather.isRain) {
        if (place.environment === "indoor") { candidateScore += 40; reasons.push("우천 대응 실내"); }
        else if (place.environment === "outdoor") candidateScore -= 50;
      } else if (dayWeather.isClear) {
        if (place.environment === "outdoor") { candidateScore += 25; reasons.push("야외 적합"); }
      }
    }

    // 9. Static Opening Hours validation check
    const validation = parseOpeningHoursRule(place.openingHours, options.start, targetStop.time, destination);
    if (validation.status === "closed") {
      candidateScore -= 100;
    } else if (validation.status === "open") {
      candidateScore += 15;
    }

    if (candidateScore > 0) {
      const directDistanceFromCurrent = distanceKm(
        { latitude: targetStop.lat, longitude: targetStop.lng },
        { latitude: place.latitude, longitude: place.longitude }
      );
      const transport = chooseTransport(
        directDistanceFromCurrent,
        destination,
        [...targetStop.transportHints, ...place.transportHints]
      );
      candidates.push({
        place,
        score: candidateScore,
        matchReason: reasons.join(" · ") || "추천 대체 장소",
        distanceFromCurrentKm: estimatedRouteDistance(directDistanceFromCurrent, destination),
        estimatedTravelMinutes: transportMinutes(directDistanceFromCurrent, transport, destination),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 3);
}

export function replaceSingleStop(
  plan: GeneratedDay[],
  activeDay: number,
  stopIndex: number,
  newPlace: Place,
  destination: string,
  pace: 1 | 2 | 3
): GeneratedDay[] {
  return plan.map((day, dayIdx) => {
    if (dayIdx !== activeDay) return day;

    const stops = [...day.stops];
    const oldStop = stops[stopIndex];
    if (!oldStop) return day;

    const newStop: GeneratedStop = {
      id: `replaced-${newPlace.id}-${Date.now()}`,
      placeId: newPlace.id,
      name: newPlace.name,
      time: oldStop.time,
      cost: newPlace.estimatedCost,
      duration: `${newPlace.recommendedDuration}분`,
      lat: newPlace.latitude,
      lng: newPlace.longitude,
      category: newPlace.category,
      environment: newPlace.environment,
      recommendedTime: newPlace.recommendedTime,
      description: newPlace.description,
      openingHours: newPlace.openingHours,
      tags: newPlace.tags,
      isCoreLandmark: newPlace.isCoreLandmark,
      district: newPlace.district,
      nearbyTrip: newPlace.nearbyTrip,
      transportHints: newPlace.transportHints,
      estimateStatus: newPlace.estimateStatus,
      userAdded: false,
    };

    stops[stopIndex] = newStop;
    return refreshDay({ ...day, stops }, destination, pace);
  });
}
