import type {PlaceCategory} from "./places";

export const stylePriority:Record<string,PlaceCategory[]>={
  "미식 중심":["food","market","culture","shopping","nature","landmark"],
  "휴양 · 미식":["food","market","nature","landmark","culture","shopping"],
  "문화 중심":["culture","landmark","market","nature","food","shopping"],
  "문화 · 예술":["culture","landmark","market","nature","food","shopping"],
  "자연 중심":["nature","landmark","culture","market","food","shopping"],
  "자연 · 도시":["landmark","culture","food","shopping","nature","market"],
  "쇼핑 중심":["shopping","market","food","landmark","culture","nature"],
  "쇼핑 · 트렌드":["shopping","market","food","landmark","culture","nature"]
};

export const paceRules={
  1:{startHour:10,endHour:19,placesPerDay:3,breakMinutes:40,maxDailyTravelKm:12},
  2:{startHour:9,endHour:20,placesPerDay:4,breakMinutes:25,maxDailyTravelKm:18},
  3:{startHour:8,endHour:22,placesPerDay:5,breakMinutes:15,maxDailyTravelKm:26}
} as const;

export const itineraryCandidatePoolMultiplier = 4;
export const itineraryWeightedChoiceSize = 8;
export const dailyTravelBudgetKm: Record<1 | 2 | 3, number> = { 1: 10, 2: 15, 3: 20 };
export const maximumSingleLegKm: Record<1 | 2 | 3, number> = { 1: 8, 2: 12, 3: 15 };

export const preferredTimeOrder:Record<"morning"|"afternoon"|"evening"|"any",number>={morning:0,any:1,afternoon:2,evening:3};

export type TransitProfile={
  routeFactor:number;
  walkMaxKm:number;
  transitMaxKm:number;
  railMinKm:number;
  walkSpeed:number;
  transitSpeed:number;
  carSpeed:number;
  railSpeed:number;
  transitOverhead:number;
  carOverhead:number;
  railOverhead:number;
};

const denseTransit:TransitProfile={routeFactor:1.24,walkMaxKm:1.35,transitMaxKm:24,railMinKm:38,walkSpeed:4.4,transitSpeed:22,carSpeed:24,railSpeed:68,transitOverhead:9,carOverhead:7,railOverhead:22};
const compactTransit:TransitProfile={...denseTransit,routeFactor:1.2,walkMaxKm:1.6,transitMaxKm:18,railMinKm:32,transitSpeed:20};
const spreadTransit:TransitProfile={routeFactor:1.3,walkMaxKm:1.15,transitMaxKm:16,railMinKm:45,walkSpeed:4.4,transitSpeed:25,carSpeed:34,railSpeed:72,transitOverhead:10,carOverhead:8,railOverhead:24};

export const defaultTransitProfile:TransitProfile={routeFactor:1.27,walkMaxKm:1.2,transitMaxKm:12,railMinKm:40,walkSpeed:4.3,transitSpeed:19,carSpeed:30,railSpeed:65,transitOverhead:10,carOverhead:8,railOverhead:24};
export const transitProfiles:Record<string,TransitProfile>={
  서울:denseTransit,후쿠오카:compactTransit,오사카:compactTransit,방콕:{...denseTransit,walkMaxKm:.9,carSpeed:20},
  도쿄:denseTransit,파리:compactTransit,런던:denseTransit,뉴욕:denseTransit,시드니:spreadTransit,싱가포르:{...compactTransit,walkMaxKm:1.4,transitSpeed:24},
  부산:{...spreadTransit,transitMaxKm:28,railMinKm:45},제주:{...spreadTransit,walkMaxKm:.6,transitMaxKm:0,railMinKm:999,carSpeed:42,routeFactor:1.32},
  교토:{...denseTransit,walkMaxKm:1.5,transitMaxKm:26,transitSpeed:18},삿포로:{...spreadTransit,walkMaxKm:1.3,transitMaxKm:24,railMinKm:32},타이베이:{...denseTransit,walkMaxKm:1.3,transitMaxKm:26,transitSpeed:23},
  홍콩:{...denseTransit,walkMaxKm:1.4,transitMaxKm:30,transitSpeed:24},상하이:{...denseTransit,walkMaxKm:1.3,transitMaxKm:30,transitSpeed:25},
  치앙마이:{...spreadTransit,walkMaxKm:1.1,transitMaxKm:18,transitSpeed:18,carSpeed:28},푸껫:{...spreadTransit,walkMaxKm:.7,transitMaxKm:0,railMinKm:999,carSpeed:32,routeFactor:1.35},발리:{...spreadTransit,walkMaxKm:.6,transitMaxKm:0,railMinKm:999,carSpeed:27,routeFactor:1.38},
  다낭:{...spreadTransit,walkMaxKm:.8,transitMaxKm:0,railMinKm:999,carSpeed:32,routeFactor:1.32},하노이:{...denseTransit,walkMaxKm:1.4,transitMaxKm:20,transitSpeed:18},호찌민:{...spreadTransit,walkMaxKm:1.1,transitMaxKm:14,carSpeed:25},로마:compactTransit,바르셀로나:{...denseTransit,walkMaxKm:1.5,transitMaxKm:26,transitSpeed:22},
  로스앤젤레스:{...spreadTransit,walkMaxKm:.7,transitMaxKm:0,railMinKm:999,carSpeed:22,carOverhead:16,routeFactor:1.4},호놀룰루:{...spreadTransit,walkMaxKm:1.2,transitMaxKm:18,railMinKm:999,carSpeed:28,routeFactor:1.34},멜버른:{...denseTransit,walkMaxKm:1.4,transitMaxKm:30,railMinKm:45,transitSpeed:24},두바이:{...spreadTransit,walkMaxKm:1,transitMaxKm:30,railMinKm:70,carSpeed:36,routeFactor:1.32},인터라켄:{...compactTransit,walkMaxKm:1.4,transitMaxKm:10,railMinKm:15,transitSpeed:18,railSpeed:45,railOverhead:18,routeFactor:1.25}
};
export const transitCities=new Set(Object.keys(transitProfiles));
