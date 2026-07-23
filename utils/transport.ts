import {defaultTransitProfile,transitCities,transitProfiles} from "../data/travelRules";

export type TransportMode="도보"|"대중교통"|"택시·자동차"|"기차·장거리 교통"|"보트·수상교통";

export function estimatedRouteDistance(distance:number,city:string){
  const profile=transitProfiles[city]||defaultTransitProfile;
  return Math.round(distance*profile.routeFactor*10)/10;
}

export function chooseTransport(distance:number,city:string,hints:string[]=[]):TransportMode{
  const profile=transitProfiles[city]||defaultTransitProfile;
  const routeDistance=estimatedRouteDistance(distance,city);
  const prefersWater=hints.some(hint=>hint.includes("보트")||hint.includes("페리")||hint.includes("수상")||hint.includes("아브라"));
  const prefersRail=hints.some(hint=>hint.includes("기차")||hint.includes("장거리")||hint.includes("산악철도")||hint.includes("산악열차")||hint.includes("케이블카")||hint.includes("모노레일"));
  if(prefersWater)return "보트·수상교통";
  if(prefersRail)return "기차·장거리 교통";
  if(routeDistance<=profile.walkMaxKm)return "도보";
  if(routeDistance>=profile.railMinKm)return "기차·장거리 교통";
  if(transitCities.has(city)&&routeDistance<=profile.transitMaxKm)return "대중교통";
  return "택시·자동차";
}

export function transportMinutes(distance:number,mode:TransportMode,city=""){
  const profile=transitProfiles[city]||defaultTransitProfile;
  const routeDistance=estimatedRouteDistance(distance,city);
  const speed=mode==="도보"?profile.walkSpeed:mode==="대중교통"?profile.transitSpeed:mode==="택시·자동차"?profile.carSpeed:mode==="보트·수상교통"?24:profile.railSpeed;
  const overhead=mode==="도보"?0:mode==="대중교통"?profile.transitOverhead:mode==="택시·자동차"?profile.carOverhead:mode==="보트·수상교통"?15:profile.railOverhead;
  return Math.max(5,Math.ceil((routeDistance/speed*60+overhead)/5)*5);
}
