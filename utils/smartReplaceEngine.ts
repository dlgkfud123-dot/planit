import { placesByCity, type Place } from "../data/places";
import type { GeneratedDay, GeneratedStop, GenerateOptions } from "./itineraryGenerator";
import { refreshDay } from "./itineraryGenerator";
import { parseOpeningHoursRule } from "./openingHoursValidator";
import type { DayWeatherInfo } from "./weatherService";

export type SmartCandidate = {
  place: Place;
  score: number;
  matchReason: string;
};

export function findSmartCandidates(
  targetStop: GeneratedStop,
  currentPlan: GeneratedDay[],
  destination: string,
  options: GenerateOptions,
  dayWeather?: DayWeatherInfo
): SmartCandidate[] {
  const usedIds = new Set(currentPlan.flatMap(d => d.stops.map(s => s.placeId)));
  const allCityPlaces = placesByCity(destination);

  const candidates: SmartCandidate[] = [];

  for (const place of allCityPlaces) {
    if (usedIds.has(place.id) || place.nearbyTrip) continue;

    let candidateScore = 0;
    const reasons: string[] = [];

    // District matching
    if (place.district === targetStop.district) {
      candidateScore += 45;
      reasons.push(`${place.district} 인접`);
    } else {
      candidateScore += 10;
    }

    // Category & Atmosphere matching
    if (place.category === targetStop.category) {
      candidateScore += 35;
      reasons.push(`${place.category === "food" ? "미식" : place.category === "culture" ? "문화" : place.category === "nature" ? "자연" : "쇼핑"} 테마`);
    }

    // Weather suitability matching
    if (dayWeather) {
      if (dayWeather.isRain) {
        if (place.environment === "indoor") { candidateScore += 40; reasons.push("우천 대응 실내"); }
        else if (place.environment === "outdoor") candidateScore -= 50;
      } else if (dayWeather.isClear) {
        if (place.environment === "outdoor") { candidateScore += 30; reasons.push("맑은 날씨 야외"); }
      }
    }

    // Opening hours check
    const validation = parseOpeningHoursRule(place.openingHours, options.start, targetStop.time);
    if (validation.status === "closed") {
      candidateScore -= 100; // Penalize closed places
    } else if (validation.status === "open") {
      candidateScore += 20;
    }

    // Core landmark protection
    if (place.isCoreLandmark) {
      candidateScore += 15;
    }

    if (candidateScore > 0) {
      candidates.push({
        place,
        score: candidateScore,
        matchReason: reasons.join(" · ") || "추천 대체 장소",
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
