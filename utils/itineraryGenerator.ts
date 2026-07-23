import {placesByCity,type Place} from "../data/places";
import {paceRules,preferredTimeOrder,stylePriority} from "../data/travelRules";
import {distanceKm} from "./distance";
import {chooseTransport,estimatedRouteDistance,transportMinutes,type TransportMode} from "./transport";

export type GeneratedStop={id:string;placeId:string;name:string;time:string;cost:number;duration:string;lat:number;lng:number;category:Place["category"];recommendedTime?:Place["recommendedTime"];description:string;openingHours:string;tags:string[];isCoreLandmark:boolean;district:string;nearbyTrip:boolean;transportHints:string[];estimateStatus:Place["estimateStatus"];userAdded?:boolean;transportFromPrevious?:TransportMode;distanceFromPrevious?:number;travelMinutes?:number};
export type GeneratedDay={label:string;date:string;theme:string;stops:GeneratedStop[]};
export type GenerateOptions={destination:string;start:string;days:number;style:string;foodPreference:string;pace:1|2|3;wishList:string};

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

function reserveSupplementCandidates(source:Place[],options:GenerateOptions){
  const reserved=new Set<string>();
  for(const matches of supplementMatches){
    const candidates=source.filter(place=>matches(place)&&!place.isCoreLandmark).sort((a,b)=>score(a,options)-score(b,options));
    for(const place of candidates.slice(0,3))reserved.add(place.id);
  }
  return source.filter(place=>!reserved.has(place.id));
}

function score(place:Place,options:GenerateOptions){
  const order=stylePriority[options.style]||stylePriority["자연 · 도시"];
  const categoryIndex=order.indexOf(place.category);
  const styleScore=(order.length-(categoryIndex<0?order.length:categoryIndex))*12;
  const foodFocused=options.style.includes("미식")||options.foodPreference.includes("맛집")||options.foodPreference.includes("미식");
  const foodScore=foodFocused&&(place.category==="food"||place.category==="market")?24:0;
  const healthyScore=options.foodPreference.includes("건강")&&(place.category==="nature"||place.tags.some(tag=>tag.includes("산책")))?10:0;
  const wishScore=matchesWish(place,wishes(options.wishList))?100:0;
  const relaxed=options.pace===1&&(place.category==="nature"||place.tags.some(tag=>tag.includes("카페")||tag.includes("산책")))?16:0;
  return styleScore+foodScore+healthyScore+wishScore+relaxed;
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

function selectDayPlaces(remaining:Place[],count:number,options:GenerateOptions,maxDailyTravelKm:number){
  if(!remaining.length||count<=0)return [];
  const selected:Place[]=[];
  const ranked=[...remaining].sort((a,b)=>score(b,options)-score(a,options));
  selected.push(ranked.shift()!);
  let routeDistance=0;
  while(ranked.length&&selected.length<count){
    const current=selected[selected.length-1];
    let bestIndex=-1;
    let bestValue=Infinity;
    ranked.forEach((candidate,index)=>{
      const leg=estimatedRouteDistance(distanceKm(current,candidate),options.destination);
      const categoryRepeats=selected.filter(place=>place.category===candidate.category).length;
      const excessPenalty=routeDistance+leg>maxDailyTravelKm?35:0;
      const districtPenalty=candidate.district===current.district?-14:selected.some(place=>place.district===candidate.district)?-5:8;
      const separationPenalty=Math.max(...selected.map(place=>districtSeparationPenalty(options.destination,place.district,candidate.district)),0);
      if(separationPenalty>0)return;
      const value=leg*5+categoryRepeats*9+districtPenalty+separationPenalty+excessPenalty-score(candidate,options)*.08;
      if(value<bestValue){bestValue=value;bestIndex=index}
    });
    if(bestIndex<0)break;
    const next=ranked.splice(bestIndex,1)[0];
    routeDistance+=estimatedRouteDistance(distanceKm(current,next),options.destination);
    selected.push(next);
  }
  return selected.sort((a,b)=>preferredTimeOrder[a.recommendedTime]-preferredTimeOrder[b.recommendedTime]);
}

function preferredStart(place:Place,currentMinute:number){
  if(place.recommendedTime==="afternoon")return Math.max(currentMinute,13*60);
  if(place.recommendedTime==="evening")return Math.max(currentMinute,17*60+30);
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
    const directDistance=previous?distanceKm({latitude:previous.lat,longitude:previous.lng},{latitude:stop.lat,longitude:stop.lng}):0;
    const routeDistance=previous?estimatedRouteDistance(directDistance,destination):0;
    const transport=previous?chooseTransport(directDistance,destination,[...previous.transportHints,...stop.transportHints]):undefined;
    const travel=transport?transportMinutes(directDistance,transport,destination):0;
    if(previous)minute+=travel;
    if(stop.recommendedTime==="afternoon")minute=Math.max(minute,13*60);
    if(stop.recommendedTime==="evening")minute=Math.max(minute,17*60+30);
    const next={...stop,time:timeText(minute),transportFromPrevious:transport,distanceFromPrevious:previous?routeDistance:undefined,travelMinutes:previous?travel:undefined};
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
  const available=placesByCity(options.destination).filter(place=>!place.nearbyTrip);
  const source=reserveSupplementCandidates(available,options);
  if(!source.length)return [];
  const rule=paceRules[options.pace];
  const isLeisureCity=["푸껫","발리","다낭","호놀룰루","인터라켄"].includes(options.destination);
  const dayCount=Math.max(1,Math.min(options.days,14));
  const paceUtilization=options.pace===1 ? 0.75 : 1;
  const maximumStops=Math.min(Math.max(1,Math.ceil(source.length*paceUtilization)),dayCount*rule.placesPerDay);
  const remaining=[...source].sort((a,b)=>score(b,options)-score(a,options)).slice(0,maximumStops);
  const days:GeneratedDay[]=[];

  for(let day=0;day<dayCount;day++){
    const remainingDays=dayCount-day;
    const leisureLimit=isLeisureCity?Math.max(2,rule.placesPerDay-1):rule.placesPerDay;
    const targetCount=Math.min(leisureLimit,Math.ceil(remaining.length/remainingDays));
    const selected=selectDayPlaces(remaining,targetCount,options,rule.maxDailyTravelKm);
    const selectedIds=new Set(selected.map(place=>place.id));
    for(let index=remaining.length-1;index>=0;index--)if(selectedIds.has(remaining[index].id))remaining.splice(index,1);

    let minute=rule.startHour*60;
    let previous:Place|undefined;
    const stops:GeneratedStop[]=[];
    for(const place of selected){
      const beachDay=isLeisureCity&&(place.tags.some(tag=>tag.includes("해변"))||stops.some(stop=>stop.tags.some(tag=>tag.includes("해변"))));
      const plannedDuration=stops.reduce((sum,stop)=>sum+Number.parseInt(stop.duration),0)+place.recommendedDuration;
      if(beachDay&&plannedDuration>480&&stops.length)continue;
      const densityLimit=options.destination==="로스앤젤레스"?600:options.destination==="인터라켄"?520:options.destination==="호놀룰루"?500:Infinity;
      if(plannedDuration>densityLimit&&stops.length)continue;
      const directDistance=previous?distanceKm(previous,place):0;
      const routeDistance=previous?estimatedRouteDistance(directDistance,options.destination):0;
      const transport=previous?chooseTransport(directDistance,options.destination,[...previous.transportHints,...place.transportHints]):undefined;
      const travel=transport?transportMinutes(directDistance,transport,options.destination):0;
      if(previous)minute+=travel;
      minute=preferredStart(place,minute);
      if(minute+place.recommendedDuration>rule.endHour*60&&stops.length)continue;
      stops.push({id:`${day}-${place.id}`,placeId:place.id,name:place.name,time:timeText(minute),cost:place.estimatedCost,duration:`${Math.round(place.recommendedDuration/10)*10}분`,lat:place.latitude,lng:place.longitude,category:place.category,recommendedTime:place.recommendedTime,description:place.description,openingHours:place.openingHours,tags:place.tags,isCoreLandmark:place.isCoreLandmark,district:place.district,nearbyTrip:place.nearbyTrip,transportHints:place.transportHints,estimateStatus:place.estimateStatus,transportFromPrevious:transport,distanceFromPrevious:previous?routeDistance:undefined,travelMinutes:previous?travel:undefined});
      minute+=place.recommendedDuration+rule.breakMinutes;
      previous=place;
    }

    const date=new Date(`${options.start}T12:00:00`);
    date.setDate(date.getDate()+day);
    days.push({label:`DAY ${day+1}`,date:date.toLocaleDateString("ko-KR",{month:"short",day:"numeric",weekday:"short"}),theme:dayTheme(stops),stops});
  }
  return days;
}
