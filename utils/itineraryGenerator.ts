import {placesByCity,type Place,type PlaceEnvironment} from "../data/places";
import {dailyTravelBudgetKm,itineraryCandidatePoolMultiplier,itineraryWeightedChoiceSize,maximumSingleLegKm,paceRules,preferredTimeOrder,stylePriority} from "../data/travelRules";
import {distanceKm} from "./distance";
import {clusterPlacesByCoordinates,createPlaceClusterLookup} from "./placeClusters";
import {chooseTransport,estimatedRouteDistance,transportMinutes,type TransportMode} from "./transport";
import type {WeatherDataResponse,DayWeatherInfo} from "./weatherService";
import {calculateStopCost,type StopCostBreakdown} from "./costEngine";

export type GeneratedStop={id:string;placeId:string;name:string;time:string;cost:number;duration:string;lat:number;lng:number;category:Place["category"];environment?:PlaceEnvironment;costBreakdown?:StopCostBreakdown;recommendedTime?:Place["recommendedTime"];description:string;openingHours:string;tags:string[];isCoreLandmark:boolean;district:string;nearbyTrip:boolean;transportHints:string[];estimateStatus:Place["estimateStatus"];userAdded?:boolean;transportFromPrevious?:TransportMode;distanceFromPrevious?:number;travelMinutes?:number};
export type GeneratedDay={label:string;date:string;theme:string;stops:GeneratedStop[]};
export type GenerateOptions={destination:string;start:string;days:number;style:string;foodPreference:string;pace:1|2|3;wishList:string;seed?:string|number;weatherData?:WeatherDataResponse|null};

const hashSeed=(value:string)=>{let hash=2166136261;for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619)}return hash>>>0};
const createSeededRandom=(seed:string|number)=>{let state=typeof seed==="number"?seed>>>0:hashSeed(seed);return()=>{state+=0x6d2b79f5;let value=state;value=Math.imul(value^value>>>15,value|1);value^=value+Math.imul(value^value>>>7,value|61);return((value^value>>>14)>>>0)/4294967296}};
const defaultSeed=(options:GenerateOptions)=>[options.destination,options.start,options.days,options.style,options.foodPreference,options.pace,options.wishList].join("|");
const weightedIndex=(orderedIndexes:number[],random:()=>number)=>{const choices=orderedIndexes.slice(0,itineraryWeightedChoiceSize);const weights=choices.map((_,index)=>(choices.length-index)**2);const total=weights.reduce((sum,value)=>sum+value,0);let cursor=random()*total;for(let index=0;index<choices.length;index++){cursor-=weights[index];if(cursor<=0)return choices[index]}return choices[choices.length-1]};

const timeText=(minutes:number)=>`${Math.floor(minutes/60).toString().padStart(2,"0")}:${(minutes%60).toString().padStart(2,"0")}`;
const wishes=(value:string)=>value.split(",").map(item=>item.trim().toLowerCase()).filter(Boolean);
const matchesWish=(place:Place,keywords:string[])=>keywords.some(keyword=>place.name.toLowerCase().includes(keyword)||place.tags.some(tag=>tag.toLowerCase().includes(keyword)));
const supplementMatches=[
  (place:Place)=>place.category==="food"||place.category==="market",
  (place:Place)=>place.tags.some(tag=>tag.includes("카페")),
  (place:Place)=>place.tags.some(tag=>["야경","노을","전망","일몰"].some(word=>tag.includes(word))),
  (place:Place)=>place.category==="shopping",
  (place:Place)=>place.category==="nature",
  (place:Place)=>place.category==="culture"
];
const barTagWords=["izakaya","bar","pub","jazz_bar","rooftop_bar","cocktail_bar","sake","night_life","야타이","포장마차","선술집","술집","이자카야","재즈바","칵테일바","루프탑바"];
const isBarPlace=(place:Pick<Place,"tags">)=>place.tags.map(tag=>tag.toLowerCase().replaceAll("-","_").replaceAll(" ","_")).some(tag=>barTagWords.some(word=>tag.includes(word)));

function reserveSupplementCandidates(source:Place[],options:GenerateOptions){
  const reserved=new Set<string>();
  for(const matches of supplementMatches){
    const candidates=source.filter(place=>matches(place)&&!place.isCoreLandmark).sort((a,b)=>score(a,options)-score(b,options));
    for(const place of candidates.slice(0,3))reserved.add(place.id);
  }
  return source.filter(place=>!reserved.has(place.id));
}

function getNormalizedBase(name: string) {
  return name.toLowerCase().replace(/정원|공원|사찰|신사|박물관|미술관|타워|전망대|백화점|아울렛|시장|스카이|테라스|\s+/g, "");
}

function isDuplicateOrNearPlace(candidate: Place, selected: Place[]) {
  return selected.some(p => {
    if (p.id === candidate.id) return true;
    const baseA = getNormalizedBase(p.name);
    const baseB = getNormalizedBase(candidate.name);
    if (baseA.length >= 2 && baseB.length >= 2 && (baseA === baseB || (baseA.length >= 3 && baseB.length >= 3 && (baseA.includes(baseB) || baseB.includes(baseA))))) {
      return true;
    }
    const dist = distanceKm(p, candidate);
    if (dist < 0.25 && (p.category === candidate.category || p.district === candidate.district)) return true;
    return false;
  });
}

function deduplicateRuntimePlaces(source:Place[]){
  const unique:Place[]=[],idIndex=new Map<string,number>(),nameIndex=new Map<string,number>();
  for(const place of source){
    const normalized=`${place.cityId}|${getNormalizedBase(place.name)}`;
    const existingIndex=idIndex.get(place.id)??nameIndex.get(normalized);
    if(existingIndex!==undefined){if(place.isCoreLandmark&&!unique[existingIndex].isCoreLandmark)unique[existingIndex]=place;continue}
    idIndex.set(place.id,unique.length);nameIndex.set(normalized,unique.length);unique.push(place);
  }
  return unique;
}

function score(place:Place,options:GenerateOptions,dayWeather?:DayWeatherInfo){
  const order=stylePriority[options.style]||stylePriority["자연 · 도시"];
  const categoryIndex=order.indexOf(place.category);
  const styleScore=(order.length-(categoryIndex<0?order.length:categoryIndex))*12;
  
  const isGeneralMix = options.style === "자연 · 도시" && options.foodPreference === "상관없음" && !options.wishList;
  const generalMixScore = isGeneralMix && (place.isCoreLandmark || place.category === "landmark" || place.category === "culture" || place.category === "food" || place.category === "shopping") ? 20 : 0;

  const foodFocused=options.style.includes("미식")||options.foodPreference.includes("맛집")||options.foodPreference.includes("미식");
  const foodScore=foodFocused&&(place.category==="food"||place.category==="market")?24:0;

  const isNightFocused = options.wishList.includes("야경") || options.wishList.includes("전망") || options.style.includes("야경");
  const nightScore = isNightFocused && place.tags.some(t => ["야경", "전망", "viewpoint", "night_view", "루프탑", "노을", "야시장"].some(w => t.includes(w))) ? 70 : 0;

  const isBarFocused = options.foodPreference.includes("술집") || options.foodPreference.includes("이자카야") || options.wishList.includes("이자카야") || options.wishList.includes("술집");
  const barScore = isBarFocused && isBarPlace(place) ? 65 : 0;

  const healthyScore=options.foodPreference.includes("건강")&&(place.category==="nature"||place.tags.some(tag=>tag.includes("산책")))?10:0;
  const wishScore=matchesWish(place,wishes(options.wishList))?100:0;
  const relaxed=options.pace===1&&(place.category==="nature"||place.tags.some(tag=>tag.includes("카페")||tag.includes("산책")))?16:0;
  
  let base = styleScore + generalMixScore + foodScore + nightScore + barScore + healthyScore + wishScore + relaxed;
  if(dayWeather){
    if(dayWeather.isRain){
      if(place.environment==="indoor")base+=45;
      else if(place.environment==="outdoor")base-=50;
      else if(place.environment==="mixed")base+=15;
    }else if(dayWeather.isClear){
      if(place.environment==="outdoor")base+=30;
      else if(place.environment==="mixed")base+=10;
    }
  }
  return base;
}

const separatedDistrictGroups:Record<string,string[][]>={
  부산:[["해운대·광안리"],["남포동·자갈치","감천문화마을","송도·영도","초량"]],
  제주:[["애월","한림"],["성산","동부"]],
  교토:[["아라시야마"],["후시미"],["북부 사찰"]],
  상하이:[["푸둥·루자쭈이"],["프랑스 조계지","톈즈팡"]],
  푸껫:[["빠통","카말라"],["푸껫 올드타운"],["카론·카타","라와이","프롬텝곶"],["북부 해변"]],
  발리:[["스미냑","짱구","꾸따"],["우붓"],["울루와뚜","누사두아"],["사누르"]],
  로스앤젤레스:[["다운타운 LA"],["산타모니카","베니스"],["말리부"],["유니버설·버뱅크"],["게티"]],
  호놀룰루:[["와이키키","알라모아나"],["진주만"],["하나우마베이","동부 해안"],["노스쇼어"]],
  멜버른:[["CBD","사우스뱅크","플린더스·페더레이션스퀘어"],["피츠로이","칼튼"],["세인트킬다","브라이튼"],["그레이트오션로드"],["필립아일랜드"]],
  두바이:[["다운타운 두바이","부르즈 할리파·두바이몰"],["올드 두바이","데이라"],["두바이 마리나","JBR","팜 주메이라"],["사막 투어"],["아부다비"]],
  인터라켄:[["인터라켄 중심","회에마테"],["하더쿨룸"],["툰호수"],["브리엔츠호수","이젤트발트"],["라우터브루넨"],["그린델발트"],["융프라우요흐"],["뮈렌"]]
  ,로마:[["바티칸"],["콜로세움","포로로마노"]],바르셀로나:[["몬주익"],["사그라다파밀리아","구엘공원"]]
};
function districtSeparationPenalty(city:string,a:string,b:string){
  if(a===b)return 0;
  const groups=separatedDistrictGroups[city]||[];
  const aGroup=groups.findIndex(group=>group.includes(a)),bGroup=groups.findIndex(group=>group.includes(b));
  return aGroup>=0&&bGroup>=0&&aGroup!==bGroup?140:0;
}

function selectDayPlaces(remaining:Place[],count:number,options:GenerateOptions,clusterLookup:Map<string,number>,preferredCluster:number|undefined,random:()=>number,remainingCoreBudget:number,requireCore:boolean,dayWeather?:DayWeatherInfo){
  if(!remaining.length||count<=0)return [];
  const selected:Place[]=[];
  const ranked=[...remaining].sort((a,b)=>score(b,options,dayWeather)-score(a,options,dayWeather));
  
  // Pick daytime anchor for start of day if possible
  const isBarFocused=options.foodPreference.includes("술집")||options.foodPreference.includes("이자카야")||options.wishList.includes("술집")||options.wishList.includes("이자카야");
  const anchorSuitable=(place:Place)=>requireCore?(place.isCoreLandmark&&place.recommendedTime!=="evening"):isBarFocused?isBarPlace(place):place.recommendedTime!=="evening";
  const anchorCandidates=ranked.map((place,index)=>({place,index})).filter(({place})=>anchorSuitable(place)&&(!place.isCoreLandmark||remainingCoreBudget>0)&& (preferredCluster===undefined||clusterLookup.get(place.id)===preferredCluster));
  const fallbackAnchors=ranked.map((place,index)=>({place,index})).filter(({place})=>anchorSuitable(place)&&(!place.isCoreLandmark||remainingCoreBudget>0));
  const anchors=anchorCandidates.length?anchorCandidates:fallbackAnchors;
  const bestAnchorScore=anchors.length?score(anchors[0].place,options,dayWeather):-Infinity;
  const qualityAnchors=anchors.filter(({place})=>score(place,options,dayWeather)>=bestAnchorScore-36);
  const firstIndex=qualityAnchors.length?weightedIndex(qualityAnchors.map(entry=>entry.index),random):0;
  selected.push(ranked.splice(firstIndex, 1)[0]);

  let routeDistance=0;

  const isGeneralMix = options.style === "자연 · 도시" && options.foodPreference === "상관없음" && !options.wishList;
  const isNightFocused = options.wishList.includes("야경") || options.wishList.includes("전망") || options.style.includes("야경");

  while(ranked.length&&selected.length<count){
    const current=selected[selected.length-1];
    let bestIndex=-1;
    let bestValue=Infinity;
    const values: Array<{index:number;value:number}>=[];
    ranked.forEach((candidate,index)=>{
      if (isDuplicateOrNearPlace(candidate, selected)) return;
      if(candidate.isCoreLandmark&&selected.some(place=>place.isCoreLandmark))return;
      if(candidate.isCoreLandmark&&remainingCoreBudget<=selected.filter(place=>place.isCoreLandmark).length)return;

      const leg=estimatedRouteDistance(distanceKm(current,candidate),options.destination);
      const travelBudget=dailyTravelBudgetKm[options.pace];
      const singleLegBudget=maximumSingleLegKm[options.pace];
      const relaxed=selected.length<2;
      if(leg>singleLegBudget*(relaxed?1.2:1))return;
      if(routeDistance+leg>travelBudget*(relaxed?1.15:1))return;
      const categoryRepeats=selected.filter(place=>place.category===candidate.category).length;
      
      let repeatPenaltyWeight = isGeneralMix ? 1500 : 25;

      if (isNightFocused) {
        const hasObservatory = selected.some(p => p.name.includes("타워") || p.name.includes("전망대") || p.name.includes("스카이트리") || p.name.includes("스카이"));
        const candidateIsObservatory = candidate.name.includes("타워") || candidate.name.includes("전망대") || candidate.name.includes("스카이트리") || candidate.name.includes("스카이");
        if (hasObservatory && candidateIsObservatory) {
          repeatPenaltyWeight += 1000;
        }
      }

      const excessPenalty=0;
      const districtPenalty=candidate.district===current.district?-14:selected.some(place=>place.district===candidate.district)?-5:8;
      const candidateCluster=clusterLookup.get(candidate.id),currentCluster=clusterLookup.get(current.id);
      const clusterPenalty=candidateCluster===currentCluster?-14:preferredCluster!==undefined&&candidateCluster!==preferredCluster?20:0;
      const separationPenalty=Math.max(...selected.map(place=>districtSeparationPenalty(options.destination,place.district,candidate.district)),0);
      if(separationPenalty>0)return;
      const value=leg*5+categoryRepeats*repeatPenaltyWeight+districtPenalty+clusterPenalty+separationPenalty+excessPenalty-score(candidate,options,dayWeather)*.6;
      values.push({index,value});
      if(value<bestValue){bestValue=value;bestIndex=index}
    });
    if(bestIndex<0)break;
    values.sort((a,b)=>a.value-b.value);
    bestIndex=weightedIndex(values.map(entry=>entry.index),random);
    const next=ranked.splice(bestIndex,1)[0];
    routeDistance+=estimatedRouteDistance(distanceKm(current,next),options.destination);
    selected.push(next);
  }
  return selected.sort((a,b)=>preferredTimeOrder[a.recommendedTime]-preferredTimeOrder[b.recommendedTime]);
}

function preferredStart(place:Place,currentMinute:number,isLastStop:boolean){
  if(place.recommendedTime==="afternoon" && currentMinute < 13*60)return 13*60;
  if(place.recommendedTime==="evening" && (isLastStop || currentMinute >= 16*60) && currentMinute < 17*60+30)return 17*60+30;
  if((place.category==="food"||place.category==="market")&&currentMinute>=11*60&&currentMinute<12*60)return 12*60;
  return currentMinute;
}

const dayTheme=(stops:GeneratedStop[])=>{
  if(!stops.length)return "여유롭게 자유 시간을 즐기는 날";
  const categories=stops.map(stop=>stop.category);
  if(categories.filter(category=>category==="food"||category==="market").length>=2)return `${stops[0].name}에서 시작하는 로컬 미식 하루`;
  if(categories.filter(category=>category==="culture").length>=2)return `${stops[0].name} 주변의 문화와 역사를 만나는 하루`;
  if(categories.includes("nature"))return `${stops[0].name}과 가까운 풍경을 천천히 잇는 하루`;
  return `${stops[0].name} 주변을 자연스럽게 잇는 하루`;
};

export function recalculateStops(stops:GeneratedStop[],destination:string,pace:1|2|3){
  const rule=paceRules[pace];
  let minute=rule.startHour*60;
  return stops.map((stop,index)=>{
    const previous=stops[index-1];
    const isLast = index === stops.length - 1;
    const directDistance=previous?distanceKm({latitude:previous.lat,longitude:previous.lng},{latitude:stop.lat,longitude:stop.lng}):0;
    const routeDistance=previous?estimatedRouteDistance(directDistance,destination):0;
    const transport=previous?chooseTransport(directDistance,destination,[...previous.transportHints,...stop.transportHints]):undefined;
    const travel=transport?transportMinutes(directDistance,transport,destination):0;
    if(previous)minute+=travel;
    minute=preferredStart({recommendedTime: stop.recommendedTime, category: stop.category} as Place, minute, isLast);
    const costBreakdown=calculateStopCost(stop.cost,stop.category,stop.tags,stop.estimateStatus,transport,previous?routeDistance:undefined,destination);
    const next={...stop,time:timeText(minute),transportFromPrevious:transport,distanceFromPrevious:previous?routeDistance:undefined,travelMinutes:previous?travel:undefined,costBreakdown};
    minute+=Number.parseInt(stop.duration)||90;
    minute+=rule.breakMinutes;
    return next;
  });
}

export function refreshDay(day:GeneratedDay,destination:string,pace:1|2|3){
  const stops=recalculateStops(day.stops,destination,pace);
  return {...day,theme:dayTheme(stops),stops};
}

export function generateItinerary(options:GenerateOptions):GeneratedDay[]{
  const available=deduplicateRuntimePlaces(placesByCity(options.destination).filter(place=>!place.nearbyTrip));
  const source=reserveSupplementCandidates(available,options);
  if(!source.length)return [];
  const rule=paceRules[options.pace];
  const isLeisureCity=["푸껫","발리","다낭","호놀룰루","인터라켄"].includes(options.destination);
  const dayCount=Math.max(1,Math.min(options.days,14));
  const paceUtilization=options.pace===1 ? 0.75 : 1;
  const maximumStops=Math.min(Math.max(1,Math.ceil(source.length*paceUtilization)),dayCount*rule.placesPerDay);
  
  const isGeneralMix = options.style === "자연 · 도시" && options.foodPreference === "상관없음" && !options.wishList;
  const isNightFocused = options.wishList.includes("야경") || options.wishList.includes("전망") || options.style.includes("야경");

  let remaining: Place[] = [];
  const candidatePoolSize=Math.min(source.length,Math.max(maximumStops,maximumStops*itineraryCandidatePoolMultiplier));

  if (isGeneralMix) {
    // Interleave top candidates across all categories for a balanced mix
    const cats: Place["category"][] = ["landmark", "culture", "food", "shopping", "nature"];
    const catPools: Record<string, Place[]> = {};
    for (const c of cats) {
      catPools[c] = source.filter(p => p.category === c).sort((a,b) => score(b, options) - score(a, options));
    }
    const mix: Place[] = [];
    const maxLen = Math.max(...Object.values(catPools).map(p => p.length));
    for (let i = 0; i < maxLen; i++) {
      for (const c of cats) {
        if (catPools[c][i]) mix.push(catPools[c][i]);
      }
    }
    remaining = mix.slice(0, candidatePoolSize);
  } else if (isNightFocused) {
    // Interleave night view observatories with daytime landmarks, culture & food
    const nightPool = source.filter(p => p.tags.some(t => ["야경", "전망", "viewpoint", "night_view", "루프탑", "노을", "야시장"].some(w => t.includes(w)))).sort((a,b) => score(b, options) - score(a, options));
    const dayPool = source.filter(p => !nightPool.includes(p)).sort((a,b) => score(b, options) - score(a, options));
    
    const mix: Place[] = [];
    const maxLen = Math.max(nightPool.length, dayPool.length);
    for (let i = 0; i < maxLen; i++) {
      if (dayPool[i * 2]) mix.push(dayPool[i * 2]);
      if (dayPool[i * 2 + 1]) mix.push(dayPool[i * 2 + 1]);
      if (nightPool[i]) mix.push(nightPool[i]);
    }
    remaining = mix.slice(0, candidatePoolSize);
  } else {
    remaining = [...source].sort((a,b)=>score(b,options)-score(a,options)).slice(0,candidatePoolSize);
  }
  const days:GeneratedDay[]=[];
  const random=createSeededRandom(options.seed??defaultSeed(options));
  const clusters=clusterPlacesByCoordinates(remaining);
  const clusterLookup=createPlaceClusterLookup(clusters);
  const usedClusters=new Set<number>();
  const strongPreference=!isGeneralMix&&(options.style.includes("미식")||options.style.includes("쇼핑")||options.style.includes("자연")||options.foodPreference.includes("술집")||options.foodPreference.includes("카페"));
  const baseCoreBudget=dayCount<=2?2:dayCount<=4?3:4;
  const totalCoreBudget=strongPreference?Math.max(1,Math.ceil(baseCoreBudget/2)):baseCoreBudget;
  let usedCoreLandmarks=0;

  for(let day=0;day<dayCount;day++){
    const dayWeather=options.weatherData?.daily?.[day];
    const remainingDays=dayCount-day;
    const leisureLimit=isLeisureCity?Math.max(2,rule.placesPerDay-1):rule.placesPerDay;
    const targetCount=Math.min(leisureLimit,Math.ceil(remaining.length/remainingDays));
    const clusterChoices=clusters.filter(cluster=>cluster.places.some(place=>remaining.some(candidate=>candidate.id===place.id))).sort((a,b)=>{
      const usedDelta=Number(usedClusters.has(a.id))-Number(usedClusters.has(b.id));
      if(usedDelta!==0)return usedDelta;
      const aScore=Math.max(...a.places.filter(place=>remaining.some(candidate=>candidate.id===place.id)).map(place=>score(place,options,dayWeather)),-Infinity);
      const bScore=Math.max(...b.places.filter(place=>remaining.some(candidate=>candidate.id===place.id)).map(place=>score(place,options,dayWeather)),-Infinity);
      return bScore-aScore;
    });
    const preferredCluster=clusterChoices.length?clusterChoices[weightedIndex(clusterChoices.slice(0,4).map((_,index)=>index),random)]?.id:undefined;
    const selected=selectDayPlaces(remaining,Math.min(remaining.length,targetCount*2),options,clusterLookup,preferredCluster,random,totalCoreBudget-usedCoreLandmarks,isGeneralMix&&usedCoreLandmarks===0&&day===0,dayWeather);

    let minute=rule.startHour*60;
    let previous:Place|undefined;
    const stops:GeneratedStop[]=[];
    const barFocusedDay=options.foodPreference.includes("술집")||options.foodPreference.includes("이자카야")||options.wishList.includes("술집")||options.wishList.includes("이자카야");
    const coreRequiredDay=isGeneralMix&&usedCoreLandmarks===0&&day===0;
    for(let i=0; i<selected.length; i++){
      if(stops.length>=targetCount)break;
      const place = selected[i];
      if(barFocusedDay&&stops.length===targetCount-1&&!stops.some(isBarPlace)&&!isBarPlace(place))continue;
      if(coreRequiredDay&&stops.length===targetCount-1&&!stops.some(stop=>stop.isCoreLandmark)&&!place.isCoreLandmark)continue;
      const isLast = i === selected.length - 1;
      const beachDay=isLeisureCity&&(place.tags.some(tag=>tag.includes("해변"))||stops.some(stop=>stop.tags.some(tag=>tag.includes("해변"))));
      const plannedDuration=stops.reduce((sum,stop)=>sum+Number.parseInt(stop.duration),0)+place.recommendedDuration;
      if(beachDay&&plannedDuration>480&&stops.length)continue;
      const densityLimit=options.destination==="로스앤젤레스"?600:options.destination==="인터라켄"?520:options.destination==="호놀룰루"?500:Infinity;
      if(plannedDuration>densityLimit&&stops.length)continue;
      const directDistance=previous?distanceKm(previous,place):0;
      const routeDistance=previous?estimatedRouteDistance(directDistance,options.destination):0;
      const accumulatedDistance=stops.reduce((sum,stop)=>sum+(stop.distanceFromPrevious||0),0);
      if(previous&&(routeDistance>maximumSingleLegKm[options.pace]||accumulatedDistance+routeDistance>dailyTravelBudgetKm[options.pace]))continue;
      const transport=previous?chooseTransport(directDistance,options.destination,[...previous.transportHints,...place.transportHints]):undefined;
      const travel=transport?transportMinutes(directDistance,transport,options.destination):0;
      if(previous)minute+=travel;
      minute=preferredStart(place,minute,isLast);
      const maxAllowedMinute = (place.recommendedTime === "evening" || place.tags.some(t => ["야경", "술집", "이자카야", "바", "pub"].some(w => t.includes(w)))) ? (rule.endHour * 60 + 120) : (rule.endHour * 60);
      if(minute+place.recommendedDuration > maxAllowedMinute && stops.length)continue;
      const costBreakdown=calculateStopCost(place.estimatedCost,place.category,place.tags,place.estimateStatus,transport,previous?routeDistance:undefined,options.destination);
      stops.push({id:`${day}-${place.id}`,placeId:place.id,name:place.name,time:timeText(minute),cost:place.estimatedCost,duration:`${Math.round(place.recommendedDuration/10)*10}분`,lat:place.latitude,lng:place.longitude,category:place.category,environment:place.environment,costBreakdown,recommendedTime:place.recommendedTime,description:place.description,openingHours:place.openingHours,tags:place.tags,isCoreLandmark:place.isCoreLandmark,district:place.district,nearbyTrip:place.nearbyTrip,transportHints:place.transportHints,estimateStatus:place.estimateStatus,transportFromPrevious:transport,distanceFromPrevious:previous?routeDistance:undefined,travelMinutes:previous?travel:undefined});
      minute+=place.recommendedDuration+rule.breakMinutes;
      previous=place;
    }

    const scheduledIds=new Set(stops.map(stop=>stop.placeId));
    for(let index=remaining.length-1;index>=0;index--)if(scheduledIds.has(remaining[index].id))remaining.splice(index,1);
    usedCoreLandmarks+=stops.filter(stop=>stop.isCoreLandmark).length;
    const mainCluster=stops.map(stop=>clusterLookup.get(stop.placeId)).find((cluster):cluster is number=>cluster!==undefined);
    if(mainCluster!==undefined)usedClusters.add(mainCluster);

    const date=new Date(`${options.start}T12:00:00`);
    date.setDate(date.getDate()+day);
    days.push({label:`DAY ${day+1}`,date:date.toLocaleDateString("ko-KR",{month:"short",day:"numeric",weekday:"short"}),theme:dayTheme(stops),stops});
  }
  return days;
}
