import BrandLogo from "../common/BrandLogo";
"use client";

import { DragEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {generateItinerary,refreshDay,type GeneratedDay,type GeneratedStop} from "../../utils/itineraryGenerator";
import {fetchWeatherData,type WeatherDataResponse} from "../../utils/weatherService";
import {calculateDayCostSummary,formatCurrency,formatKrwReference,EXCHANGE_RATE_METADATA} from "../../utils/costEngine";
import {validateStopOpening} from "../../utils/openingHoursValidator";
import {findSmartCandidates,replaceSingleStop,type SmartCandidate} from "../../utils/smartReplaceEngine";
import {supportedCityIds} from "../../data/cities";
import {placesByCity,type Place} from "../../data/places";
import {KOREA_AIRPORTS} from "../../data/airports";
import {
  DESTINATION_COUNTRIES,
  POPULAR_CITIES,
  addRecentDestination,
  getRecentDestinations,
  searchDestinations,
} from "../../data/destinationData";

const PlannerMap = dynamic(() => import("./PlannerMap"), {
  ssr: false,
  loading: () => <div className="realPlannerMap" style={{ width: "100%", height: "100%", background: "#f8fafc" }} />
});
import {decodeSharedTrip,downloadText,encodeSharedTrip,readDraft,readDraftById,writeDraft,writeDraftById,type TripSnapshot} from "../../utils/tripStorage";
import {usePlannerState,usePlannerUiState} from "./usePlannerState";
import {useTripPersistence} from "./useTripPersistence";
import AccountActions from "../auth/AccountActions";
import {saveWithFallback} from "../../utils/tripPersistence";

function nightsFrom(value:string){const n=parseInt(value);return Number.isFinite(n)?Math.min(Math.max(n,1),14):4}
const informationReferenceDate="2026년 7월 22일";
function recommendationReason(stop:GeneratedStop,interest:string,food:string){
  if(stop.userAdded)return "직접 추가한 장소";
  if(stop.nearbyTrip)return "근교 여행 선호 반영";
  if(interest.includes("문화")&&(stop.category==="culture"||stop.tags.some(tag=>tag.includes("역사")||tag.includes("예술"))))return "문화 취향 반영";
  if(interest.includes("자연")&&stop.category==="nature")return "자연 취향 반영";
  if(interest.includes("쇼핑")&&(stop.category==="shopping"||stop.category==="market"))return "쇼핑 취향 반영";
  if((interest.includes("미식")||food.includes("맛집")||food.includes("미식"))&&(stop.category==="food"||stop.category==="market"))return "음식 취향 반영";
  if(stop.recommendedTime==="evening"||stop.tags.some(tag=>["야경","노을","전망","일몰"].some(word=>tag.includes(word))))return "추천 시간대 반영";
  if((stop.distanceFromPrevious??99)<=2)return "이동 동선 최소화";
  if(stop.isCoreLandmark)return "도시 핵심 명소";
  return `${stop.tags[0]||"여행"} 관심사 반영`;
}
const categoryNames:Record<Place["category"],string>={landmark:"명소",culture:"문화",food:"미식",nature:"자연",shopping:"쇼핑",market:"시장"};
export default function PlannerApp(){
  const{destination,setDestination,origin,setOrigin,start,setStart,end,setEnd,people,setPeople,budget,setBudget,tempo,setTempo,interest,setInterest,food,setFood,stay,setStay,wish,setWish,pace,setPace,hydrate}=usePlannerState();
  const{status,setStatus,loadingStep,setLoadingStep,plan,setPlan,generationError,setGenerationError,activeDay,setActiveDay,activeStop,setActiveStop,mobileTab,setMobileTab,addOpen,setAddOpen,placeQuery,setPlaceQuery,editNotice,setEditNotice,historyDepth,setHistoryDepth,editingStop,setEditingStop,openStopMenu,setOpenStopMenu,savedTripId,setSavedTripId,saveStatus,setSaveStatus,shareUrl,setShareUrl,source,setSource}=usePlannerUiState();
  const{authReady,isRemote,ensureId,save,find}=useTripPersistence();
  const historyRef=useRef<GeneratedDay[][]>([]),dragRef=useRef<{day:number;placeId:string}|null>(null),addedIdRef=useRef(0),initializedRef=useRef(false),draftIdRef=useRef<string|null>(null);

  const getPlaceDetailUrl=(stopPlaceId:string,stopIdx:number)=>{
    const currentDraftId=savedTripId||draftIdRef.current||(draftIdRef.current=`draft_${Date.now()}_${Math.random().toString(36).substring(2,7)}`);
    const snapshot:TripSnapshot={
      schemaVersion:2,
      id:currentDraftId,
      title:`${destination} 여행`,
      destination,origin,start,end,people,budget,tempo,interest,food,stay,pace,plan,
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    writeDraftById(currentDraftId,snapshot,activeDay,stopIdx);
    const params=new URLSearchParams();
    params.set("id",stopPlaceId);
    params.set("draft",currentDraftId);
    params.set("day",String(activeDay+1));
    params.set("stop",String(stopIdx));
    params.set("dest",destination);
    if(savedTripId)params.set("saved",savedTripId);
    return `/place?${params.toString()}`;
  };

  useEffect(()=>{
    if(!authReady||initializedRef.current)return;
    initializedRef.current=true;
    let active=true;
    const timer=window.setTimeout(async()=>{
      const q=new URLSearchParams(location.search);
      const shared=q.get("share"),saved=q.get("saved");
      const draftParam=q.get("draft")||(typeof sessionStorage!=="undefined"?sessionStorage.getItem("eyria:active-draft-id"):null);
      const dayParam=q.get("day"),stopParam=q.get("stop"),replaceParam=q.get("replace");
      const isExistingTrip=Boolean(shared||saved||draftParam);
      setSource(shared?"shared":saved?"saved":draftParam?"draft":"new");

      const snapshot:(TripSnapshot&{activeDay?:number;activeStop?:number})|null=shared?await decodeSharedTrip(shared):saved?await find(saved):draftParam?readDraftById(draftParam):null;
      if(!active)return;
      if(snapshot&&isExistingTrip&&snapshot.plan&&snapshot.plan.length>0){
        if(draftParam)draftIdRef.current=draftParam;
        setSavedTripId(saved?snapshot.id:null);
        hydrate({destination:snapshot.destination,origin:snapshot.origin,start:snapshot.start,end:snapshot.end,people:snapshot.people,budget:snapshot.budget,tempo:snapshot.tempo,interest:snapshot.interest,food:snapshot.food,stay:snapshot.stay,wish:"",pace:snapshot.pace});
        setPlan(snapshot.plan);
        setStatus("complete");
        setMobileTab("schedule");

        const targetDay=dayParam?Math.max(0,Number(dayParam)-1):snapshot.activeDay??0;
        const targetStop=stopParam?Math.max(0,Number(stopParam)):snapshot.activeStop??0;
        const validDay=Math.min(targetDay,snapshot.plan.length-1);
        setActiveDay(validDay);
        setActiveStop(targetStop);

        window.setTimeout(()=>{
          const stopElems=document.querySelectorAll(".timelineList li");
          const targetElem=stopElems[targetStop];
          if(targetElem){
            targetElem.scrollIntoView({behavior:"smooth",block:"center"});
          }
        },300);
        return;
      }
      const dest=q.get("destination"),s=q.get("style");
      hydrate({destination:dest||"",origin:"",start:"",end:"",people:0,budget:0,wish:"",...(s?{interest:s}:{})});
      setStatus("empty");
    },0);
    return()=>{active=false;window.clearTimeout(timer)};
  },[authReady,find,hydrate,setMobileTab,setPlan,setSavedTripId,setSource,setStatus]);
  useEffect(()=>{if(!editNotice)return;const timer=window.setTimeout(()=>setEditNotice(""),3200);return()=>window.clearTimeout(timer)},[editNotice,setEditNotice]);
  useEffect(()=>{
    if(!openStopMenu||window.matchMedia("(max-width: 700px)").matches)return;
    let frame=0;
    const menu=document.querySelector<HTMLElement>(".stopActionMenu");
    const button=document.querySelector<HTMLElement>('.stopMenuButton[aria-expanded="true"]');
    const boundary=button?.closest<HTMLElement>(".timelineColumn");
    if(!menu||!button)return;
    const placeMenu=()=>{
      window.cancelAnimationFrame(frame);
      frame=window.requestAnimationFrame(()=>{
        menu.classList.remove("opensAbove");
        menu.style.maxHeight="";
        menu.style.overflowY="";
        const buttonRect=button.getBoundingClientRect(),boundaryRect=boundary?.getBoundingClientRect();
        const upper=Math.max(12,boundaryRect?.top??12),lower=Math.min(window.innerHeight-12,boundaryRect?.bottom??window.innerHeight-12);
        const requiredHeight=menu.scrollHeight,spaceBelow=Math.max(0,lower-buttonRect.bottom-4),spaceAbove=Math.max(0,buttonRect.top-upper-4);
        const opensAbove=spaceBelow<requiredHeight&&spaceAbove>spaceBelow;
        const available=Math.max(72,Math.floor(opensAbove?spaceAbove:spaceBelow));
        menu.classList.toggle("opensAbove",opensAbove);
        if(available<requiredHeight){menu.style.maxHeight=`${available}px`;menu.style.overflowY="auto"}
      });
    };
    placeMenu();
    window.addEventListener("resize",placeMenu);
    boundary?.addEventListener("scroll",placeMenu,{passive:true});
    return()=>{window.cancelAnimationFrame(frame);window.removeEventListener("resize",placeMenu);boundary?.removeEventListener("scroll",placeMenu)};
  },[openStopMenu]);
  const nights=Math.max(1,Math.round((new Date(end).getTime()-new Date(start).getTime())/86400000));
  const current=plan[activeDay];
  const totals=useMemo(()=>{const duration=plan.reduce((sum,day)=>{if(!day.stops.length)return sum;const first=day.stops[0],last=day.stops.at(-1)!,startMinute=Number(first.time.slice(0,2))*60+Number(first.time.slice(3,5)),endMinute=Number(last.time.slice(0,2))*60+Number(last.time.slice(3,5))+(Number.parseInt(last.duration)||0);return sum+Math.max(0,endMinute-startMinute)},0);return{cost:plan.flatMap(d=>d.stops).reduce((s,p)=>s+p.cost,0)*people,distance:Math.round(plan.flatMap(d=>d.stops).reduce((s,p)=>s+(p.distanceFromPrevious||0),0)*10)/10,stops:plan.flatMap(d=>d.stops).length,duration}},[plan,people]);
  const snapshotFor=useCallback((id:string):TripSnapshot=>({schemaVersion:2,id,title:`${destination} ${plan.length}일 여행`,destination,origin,start,end,people,budget,tempo,interest,food,stay,pace,plan,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}),[destination,plan,origin,start,end,people,budget,tempo,interest,food,stay,pace]);
  useEffect(()=>{if(status!=="complete"||!plan.length||source==="shared")return;let active=true;const timer=window.setTimeout(async()=>{const id=ensureId(savedTripId),snapshot=snapshotFor(id);writeDraft(snapshot);if(!isRemote){if(active)setSaveStatus("saved");return}setSaveStatus("saving");const result=await saveWithFallback(()=>save(snapshot),snapshot,writeDraft);if(!active)return;if(result.saved){setSavedTripId(id);setSaveStatus("saved")}else{setSaveStatus("idle");setEditNotice(`${result.error.message} 로컬 초안은 유지했습니다.`)}},650);return()=>{active=false;window.clearTimeout(timer)}},[status,plan,savedTripId,snapshotFor,setSaveStatus,setSavedTripId,setEditNotice,ensureId,isRemote,save,source]);
  const clonePlan=(value:GeneratedDay[])=>value.map(day=>({...day,stops:day.stops.map(stop=>({...stop,tags:[...stop.tags]}))}));
  const commitEdit=(next:GeneratedDay[],notice:string)=>{const beforeIds=plan.flatMap(day=>day.stops.map(stop=>`${day.label}:${stop.placeId}`)).join("|"),afterIds=next.flatMap(day=>day.stops.map(stop=>`${day.label}:${stop.placeId}`)).join("|");if(beforeIds===afterIds)return false;historyRef.current=[...historyRef.current.slice(-19),clonePlan(plan)];setHistoryDepth(historyRef.current.length);setPlan(next);setEditNotice(notice);return true};
  const undoEdit=()=>{const previous=historyRef.current.pop();if(!previous)return;setPlan(previous);setHistoryDepth(historyRef.current.length);setActiveDay(day=>Math.min(day,Math.max(0,previous.length-1)));setActiveStop(0);setEditNotice("직전 편집을 실행 취소했습니다.")};
  const [weatherResult, setWeatherResult] = useState<WeatherDataResponse | null>(null);
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [smartReplaceStopId, setSmartReplaceStopId] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [changeDestinationOpen, setChangeDestinationOpen] = useState(false);
  const [budgetScope, setBudgetScope] = useState<"total" | "local">("total");
  const [destSearchQuery, setDestSearchQuery] = useState("");
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
  const [recentDestinations, setRecentDestinations] = useState<string[]>([]);

  useEffect(() => {
    if (changeDestinationOpen) {
      setRecentDestinations(getRecentDestinations());
    }
  }, [changeDestinationOpen]);

  const handleSelectCity = (cityName: string) => {
    setDestination(cityName);
    addRecentDestination(cityName);
    setChangeDestinationOpen(false);
    setDestSearchQuery("");
    if (status === "unsupported") setStatus("empty");
  };
  const isFormValid = Boolean(origin && destination && start && end && people > 0 && budget > 0);
  const dayCostSummary = useMemo(() => current ? calculateDayCostSummary(current.stops, people, destination) : null, [current, people, destination]);
  const executeSmartReplace = (stopIndex: number, newPlace: Place) => {
    const next = replaceSingleStop(plan, activeDay, stopIndex, newPlace, destination, pace);
    if (commitEdit(next, `${newPlace.name}(으)로 장소를 교체하고 동선과 경비를 재계산했습니다.`)) {
      setSmartReplaceStopId(null);
      setOpenStopMenu(null);
    }
  };
  const generationTimers=useRef<number[]>([]);
  const generate=(e:FormEvent)=>{e.preventDefault();generationTimers.current.forEach(window.clearTimeout);generationTimers.current=[];setGenerationError("");setStatus("loading");setLoadingStep(0);const weatherPromise=fetchWeatherData(destination,start,end);[1,2,3,4].forEach(step=>generationTimers.current.push(window.setTimeout(()=>setLoadingStep(step),step*450)));generationTimers.current.push(window.setTimeout(async()=>{generationTimers.current=[];const weatherRes=await weatherPromise;setWeatherResult(weatherRes);const next=generateItinerary({destination,start,days:nights+1,style:interest,foodPreference:food,pace,wishList:wish,weatherData:weatherRes});if(!next.length){setStatus("unsupported");setGenerationError(`${destination}의 검증된 장소 데이터가 아직 준비되지 않았습니다.`);setMobileTab("schedule");return}historyRef.current=[];setHistoryDepth(0);setPlan(next);setActiveDay(0);setActiveStop(0);setStatus("complete");setMobileTab("schedule");setEditNotice(`${destination} 여행 일정이 완성되었습니다.`)},2300))};
  const updateStop=(index:number,field:"name"|"time",value:string)=>setPlan(old=>old.map((d,di)=>di===activeDay?{...d,stops:d.stops.map((s,si)=>si===index?{...s,[field]:value}:s)}:d));
  const removeStop=(index:number)=>{const next=plan.map((day,dayIndex)=>dayIndex===activeDay?refreshDay({...day,stops:day.stops.filter((_,stopIndex)=>stopIndex!==index)},destination,pace):day);if(commitEdit(next,"장소를 삭제하고 이동 시간을 다시 계산했습니다."))setActiveStop(0)};
  const usedIds=new Set(plan.flatMap(day=>day.stops.map(stop=>stop.placeId)));const recommendations=placesByCity(destination).filter(place=>!usedIds.has(place.id)).slice(0,3);
  const placeToStop=(place:Place,userAdded=false):GeneratedStop=>({id:`added-${place.id}-${++addedIdRef.current}`,placeId:place.id,name:place.name,time:"09:00",cost:place.estimatedCost,duration:`${place.recommendedDuration}분`,lat:place.latitude,lng:place.longitude,category:place.category,recommendedTime:place.recommendedTime,description:place.description,openingHours:place.openingHours,tags:place.tags,isCoreLandmark:place.isCoreLandmark,district:place.district,nearbyTrip:place.nearbyTrip,transportHints:place.transportHints,estimateStatus:place.estimateStatus,userAdded});
  const addPlace=(place:Place,targetDay=activeDay,targetIndex?:number)=>{if(usedIds.has(place.id)){setEditNotice(`${place.name}은(는) 이미 일정에 포함되어 있습니다.`);return}const isDayTrip=place.nearbyTrip,eligibleDays=plan.map((day,index)=>({day,index})).filter(item=>!item.day.stops.some(stop=>stop.userAdded)),resolvedDay=isDayTrip&&targetIndex===undefined?(eligibleDays.length?eligibleDays.reduce((best,item)=>item.day.stops.length<best.day.stops.length?item:best).index:targetDay):targetDay;let removedForDayTrip=0;const next=plan.map((day,dayIndex)=>{if(dayIndex!==resolvedDay)return day;let stops=[...day.stops];if(isDayTrip){const protectedStops=stops.filter(stop=>stop.userAdded&&stop.nearbyTrip&&stop.district===place.district);removedForDayTrip=stops.length-protectedStops.length;stops=[placeToStop(place,true),...protectedStops]}else{const automaticIndex=place.recommendedTime==="morning"?0:place.recommendedTime==="evening"?stops.length:Math.ceil(stops.length/2);stops.splice(targetIndex??automaticIndex,0,placeToStop(place,true))}return refreshDay({...day,stops},destination,pace)});const notice=isDayTrip?`${place.name}을(를) ${next[resolvedDay].label}의 근교 하루 일정으로 배치했습니다.${removedForDayTrip?` 충돌하는 AI 장소 ${removedForDayTrip}곳은 추천 목록으로 이동했습니다.`:""}`:`${place.name}을(를) 추가하고 동선을 다시 계산했습니다.`;if(commitEdit(next,notice)){setActiveDay(resolvedDay);setActiveStop(0);setAddOpen(false);setPlaceQuery("")}};
  const addRecommendation=(place:Place)=>addPlace(place);
  const moveStop=(fromDay:number,fromIndex:number,toDay:number,toIndex:number)=>{if(!plan[fromDay]||!plan[toDay]||!plan[fromDay].stops[fromIndex])return;const next=plan.map(day=>({...day,stops:[...day.stops]})),[moved]=next[fromDay].stops.splice(fromIndex,1);let insertIndex=toIndex;if(fromDay===toDay&&fromIndex<toIndex)insertIndex--;next[toDay].stops.splice(Math.max(0,Math.min(insertIndex,next[toDay].stops.length)),0,moved);next[fromDay]=refreshDay(next[fromDay],destination,pace);if(toDay!==fromDay)next[toDay]=refreshDay(next[toDay],destination,pace);if(commitEdit(next,"장소 순서와 이동 시간, 지도 경로를 갱신했습니다.")){setActiveDay(toDay);setActiveStop(0)}};
  const handleDrop=(event:DragEvent,dayIndex:number,stopIndex:number)=>{event.preventDefault();const source=dragRef.current,sourceIndex=source?plan[source.day]?.stops.findIndex(stop=>stop.placeId===source.placeId):-1;if(source&&sourceIndex>=0)moveStop(source.day,sourceIndex,dayIndex,stopIndex);dragRef.current=null};
  const moveWithinDay=(index:number,direction:-1|1)=>{const target=index+direction;if(target<0||target>=currentStops.length)return;const next=plan.map(day=>({...day,stops:[...day.stops]})),stops=next[activeDay].stops,[moved]=stops.splice(index,1);stops.splice(target,0,moved);next[activeDay]=refreshDay(next[activeDay],destination,pace);if(commitEdit(next,"장소 순서와 이동 시간을 갱신했습니다."))setActiveStop(target)};
  const quickStyles=[{key:"food",label:"🍜 미식 위주"},{key:"cafe",label:"☕ 카페 위주"},{key:"night",label:"🌙 야경 위주"},{key:"shopping",label:"🛍 쇼핑 위주"},{key:"nature",label:"🌿 자연 위주"},{key:"culture",label:"🏛 문화 위주"}] as const;
  const styleMatch=(place:{category:Place["category"];tags:string[]},key:(typeof quickStyles)[number]["key"])=>key==="food"?place.category==="food"||place.category==="market":key==="cafe"?place.tags.some(tag=>tag.includes("카페")):key==="night"?place.tags.some(tag=>["야경","노을","전망","일몰"].some(word=>tag.includes(word))):key==="shopping"?place.category==="shopping":key==="nature"?place.category==="nature":place.category==="culture";
  const timeMismatch=(stop:GeneratedStop)=>{const hour=Number.parseInt(stop.time);return stop.recommendedTime==="morning"?hour>=13:stop.recommendedTime==="afternoon"?hour<12||hour>=18:stop.recommendedTime==="evening"?hour<17:false};
  const replacementScore=(stop:GeneratedStop,key:(typeof quickStyles)[number]["key"])=>{if(stop.userAdded)return Number.POSITIVE_INFINITY;return(styleMatch(stop,key)?120:0)+(stop.isCoreLandmark?90:0)+(timeMismatch(stop)?-45:0)};
  const applyQuickStyle=(key:(typeof quickStyles)[number]["key"],label:string)=>{const used=new Set(plan.flatMap(day=>day.stops.map(stop=>stop.placeId))),candidate=placesByCity(destination).find(place=>!used.has(place.id)&&styleMatch(place,key)),activeStops=plan[activeDay]?.stops||[],rankedVictims=activeStops.map((stop,index)=>({index,score:replacementScore(stop,key)})).filter(item=>Number.isFinite(item.score)).sort((a,b)=>a.score-b.score),replaceIndex=rankedVictims[0]?.index??-1;if(candidate){const next=plan.map(day=>({...day,stops:[...day.stops]}));if(replaceIndex>=0)next[activeDay].stops.splice(replaceIndex,1,placeToStop(candidate));else next[activeDay].stops.push(placeToStop(candidate));next[activeDay]=refreshDay(next[activeDay],destination,pace);if(commitEdit(next,replaceIndex>=0?`${label}로 관련성이 낮은 장소 1곳을 보완했습니다.`:`${label} 장소를 빈 일정에 추가했습니다.`))setActiveStop(0);return}const donorDay=plan.findIndex((day,dayIndex)=>dayIndex!==activeDay&&day.stops.some(stop=>!stop.userAdded&&styleMatch(stop,key)));if(donorDay>=0&&replaceIndex>=0){const next=plan.map(day=>({...day,stops:[...day.stops]})),donorIndex=next[donorDay].stops.findIndex(stop=>!stop.userAdded&&styleMatch(stop,key)),donorStop=next[donorDay].stops[donorIndex],victim=next[activeDay].stops[replaceIndex];next[activeDay].stops.splice(replaceIndex,1,donorStop);next[donorDay].stops.splice(donorIndex,1,victim);next[activeDay]=refreshDay(next[activeDay],destination,pace);next[donorDay]=refreshDay(next[donorDay],destination,pace);if(commitEdit(next,`${label}에 맞춰 관련성이 낮은 장소를 다른 DAY와 교체했습니다.`))setActiveStop(0);return}setEditNotice(`${label.replace(/^\S+\s/,"")}에 맞는 장소가 이미 포함되어 있거나 직접 추가한 장소만 남아 있습니다.`)};
  const availablePlaces=placesByCity(destination).filter(place=>!usedIds.has(place.id)&&(place.name.includes(placeQuery.trim())||place.tags.some(tag=>tag.includes(placeQuery.trim()))));
  const saveCurrentTrip=async()=>{const fromShare=source==="shared",id=fromShare?crypto.randomUUID():ensureId(savedTripId),snapshot=snapshotFor(id);setSaveStatus("saving");const result=await saveWithFallback(()=>save(snapshot),snapshot,writeDraft);if(result.saved){setSource("saved");setSavedTripId(id);setSaveStatus("saved");setEditNotice("일정을 내 여행에 저장했습니다.")}else{setSaveStatus("idle");setEditNotice(`${result.error.message} 로컬 초안은 유지했습니다.`)}};
  const shareCurrentTrip=async()=>{const url=`${location.origin}/planner?share=${await encodeSharedTrip(snapshotFor(savedTripId||"shared"))}`;setShareUrl(url);try{await navigator.clipboard.writeText(url);setEditNotice("공유 링크를 복사했습니다.")}catch{setEditNotice("공유 링크를 직접 복사해주세요.")}};
  const exportCalendar=()=>{const pad=(value:number)=>value.toString().padStart(2,"0"),format=(date:Date)=>`${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}00Z`,escape=(value:string)=>value.replaceAll("\\","\\\\").replaceAll(",","\\,").replaceAll(";","\\;").replaceAll("\n","\\n"),events=plan.flatMap((day,dayIndex)=>day.stops.map(stop=>{const date=new Date(`${start}T00:00:00`);date.setDate(date.getDate()+dayIndex);const[hour,minute]=stop.time.split(":").map(Number);date.setHours(hour,minute,0,0);const finish=new Date(date.getTime()+(Number.parseInt(stop.duration)||90)*60000);return["BEGIN:VEVENT",`UID:${stop.id}@eyria.local`,`DTSTAMP:${format(new Date())}`,`DTSTART:${format(date)}`,`DTEND:${format(finish)}`,`SUMMARY:${escape(stop.name)}`,`DESCRIPTION:${escape(`${stop.description} · ${stop.openingHours}`)}`,`LOCATION:${stop.lat},${stop.lng}`,"END:VEVENT"].join("\r\n")})),ics=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//EYRIA//Travel Planner//KO",`X-WR-CALNAME:${destination} 여행`,...events,"END:VCALENDAR"].join("\r\n");downloadText(`EYRIA-${destination}-일정.ics`,ics,"text/calendar;charset=utf-8")};
  return <main className="plannerWorkspace">
    <header className="workspaceHeader"><BrandLogo /><div><strong>{destination} 여행</strong><span>{start} — {end} · {people}명</span><Link href="/trips">내 여행</Link><Link href="/">목적지 변경</Link><AccountActions/></div></header>
    <nav className="mobilePlannerNav"><button className={mobileTab==="conditions"?"active":""} onClick={()=>setMobileTab("conditions")}>여행 조건</button><button className={mobileTab==="schedule"?"active":""} onClick={()=>setMobileTab("schedule")}>일정</button><button className={mobileTab==="map"?"active":""} onClick={()=>setMobileTab("map")}>지도</button></nav>
    <div className="workspaceBody">
      <aside className={`conditionPanel mobile-${mobileTab}`}>
        <div className="conditionHeading">
          <span>AI TRIP BUILDER</span>
          <h1>{destination ? `${destination} 여행을` : "여행 계획을"}<br/>함께 설계해볼까요?</h1>
          <p>조건을 바꾸면 AI가 동선과 예산을 다시 계산합니다.</p>
        </div>
        <form onSubmit={generate}>
          {/* 1. 출발지 */}
          <label>
            출발 공항
            <select value={origin} onChange={e => setOrigin(e.target.value)}>
              <option value="">출발 공항 선택</option>
              {KOREA_AIRPORTS.map(apt => (
                <option key={apt.iata} value={apt.label}>{apt.label}</option>
              ))}
            </select>
          </label>

          {/* 2. 목적지 (입력 필드 클릭 시 레이어 오픈, [목적지 변경] 버튼 제거) */}
          <label className="destinationSelectLabel">
            목적지
            <div className="destinationValueBox">
              <input
                readOnly
                value={destination}
                placeholder="도시 선택"
                className="destinationInputSelect"
                onClick={() => setChangeDestinationOpen(v => !v)}
              />
            </div>
          </label>

          {changeDestinationOpen && (
            <div className="destinationPickerTray">
              <div className="destPickerHeader">
                <strong>목적지 도시 선택</strong>
                <button type="button" className="closeTrayBtn" onClick={() => setChangeDestinationOpen(false)}>×</button>
              </div>

              {/* 검색창 */}
              <div className="destSearchWrap">
                <input
                  type="text"
                  className="destSearchInput"
                  placeholder="도시 또는 국가 검색"
                  value={destSearchQuery}
                  onChange={e => setDestSearchQuery(e.target.value)}
                />
              </div>

              <div className="destPickerScrollContent">
                {destSearchQuery.trim() ? (
                  /* 검색 결과 */
                  <div className="destSearchResultsList">
                    {searchDestinations(destSearchQuery).map(city => (
                      <button
                        key={city.id}
                        type="button"
                        className={`destSearchResultItem ${destination === city.name ? "selected" : ""}`}
                        onClick={() => handleSelectCity(city.name)}
                      >
                        <span className="cityName">{city.name}</span>
                        <span className="countryBadge">{city.countryName}</span>
                      </button>
                    ))}
                    {searchDestinations(destSearchQuery).length === 0 && (
                      <p className="noDestSearchText">검색 결과가 없습니다.</p>
                    )}
                  </div>
                ) : (
                  /* 검색 미입력 시: 최근 선택 -> 인기 여행지 -> 국가별 여행지 (Collapsible) */
                  <>
                    {/* 최근 선택 */}
                    {recentDestinations.length > 0 && (
                      <div className="destTraySection">
                        <span className="destTraySectionTitle">최근 선택</span>
                        <div className="recentDestGrid">
                          {recentDestinations.map(name => (
                            <button
                              key={name}
                              type="button"
                              className={`recentDestCard ${destination === name ? "active" : ""}`}
                              onClick={() => handleSelectCity(name)}
                            >
                              {name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 인기 여행지 */}
                    <div className="destTraySection">
                      <span className="destTraySectionTitle">인기 여행지</span>
                      <div className="popularDestGrid">
                        {POPULAR_CITIES.map(city => (
                          <button
                            key={city.id}
                            type="button"
                            className={`popularDestCard ${destination === city.name ? "active" : ""}`}
                            onClick={() => handleSelectCity(city.name)}
                          >
                            <span className="cityName">{city.name}</span>
                            <span className="countryName">{city.countryName}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 전체 국가별 도시 (Collapsible) */}
                    <div className="destTraySection">
                      <span className="destTraySectionTitle">전체 국가별 도시</span>
                      <div className="countryAccordionList">
                        {DESTINATION_COUNTRIES.map(country => {
                          const isExpanded = expandedCountries.has(country.code);
                          return (
                            <div key={country.code} className="countryAccordionGroup">
                              <button
                                type="button"
                                className={`countryHeaderBtn ${isExpanded ? "open" : ""}`}
                                onClick={() => {
                                  setExpandedCountries(prev => {
                                    const next = new Set(prev);
                                    if (next.has(country.code)) next.delete(country.code);
                                    else next.add(country.code);
                                    return next;
                                  });
                                }}
                              >
                                <span className="countryNameText">{country.name}</span>
                                <span className="cityCountTag">{country.cities.length}</span>
                                <span className="accordionChevron">{isExpanded ? "▲" : "▼"}</span>
                              </button>
                              {isExpanded && (
                                <div className="countryCityGrid">
                                  {country.cities.map(city => (
                                    <button
                                      key={city.id}
                                      type="button"
                                      className={`countryCityCard ${destination === city.name ? "active" : ""}`}
                                      onClick={() => handleSelectCity(city.name)}
                                    >
                                      <span className="cityName">{city.name}</span>
                                      <span className="cityEn">{city.en}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* 3. 시작일 / 종료일 */}
          <div className="plannerFormRow">
            <label>
              시작일
              <input
                type="date"
                value={start}
                onChange={e => {
                  setStart(e.target.value);
                  if (end && e.target.value > end) setEnd("");
                }}
              />
            </label>
            <label>
              종료일
              <input
                type="date"
                min={start || undefined}
                value={end}
                onChange={e => setEnd(e.target.value)}
              />
            </label>
          </div>

          {/* 4. 인원 / 예산 */}
          <div className="plannerFormRow">
            <label>
              인원 (명)
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                placeholder="-"
                value={people === 0 ? "" : people}
                onChange={e => setPeople(e.target.value ? Math.max(1, +e.target.value) : 0)}
              />
            </label>
            <label>
              예산 (만원)
              <input
                type="number"
                min="1"
                step="1"
                placeholder="-"
                value={budget === 0 ? "" : budget}
                onChange={e => setBudget(e.target.value ? Math.max(1, +e.target.value) : 0)}
              />
            </label>
          </div>

          {/* 5. 여행 템포 */}
          <label>
            여행 템포
            <div className="segmented">
              {["여유롭게", "균형 있게", "알차게"].map((v, i) => (
                <button
                  type="button"
                  className={tempo === v ? "active" : ""}
                  onClick={() => { setTempo(v); setPace((i + 1) as 1 | 2 | 3); }}
                  key={v}
                >
                  {v}
                </button>
              ))}
            </div>
          </label>

          {/* 6. 가고 싶은 장소 */}
          <label>
            꼭 가고 싶은 장소
            <input
              value={wish}
              onChange={e => setWish(e.target.value)}
              placeholder="장소를 쉼표로 구분해 입력 (선택)"
            />
          </label>

          {/* 7. 상세 설정 (접이식) */}
          <div className="advancedSettingsToggleWrap">
            <button
              type="button"
              className="toggleAdvancedBtn"
              onClick={() => setShowAdvancedSettings(v => !v)}
            >
              {showAdvancedSettings ? "상세 설정 접기 ▲" : "상세 설정 (선택) ▾"}
            </button>
          </div>

          {showAdvancedSettings && (
            <div className="advancedSettingsTray">
              <label>
                예산 적용 범위
                <select value={budgetScope} onChange={e => setBudgetScope(e.target.value as "total" | "local")}>
                  <option value="total">항공·숙박 포함 총예산</option>
                  <option value="local">현지에서 사용할 여행 경비</option>
                </select>
              </label>
              <label>
                관심 테마
                <select value={interest} onChange={e => setInterest(e.target.value)}>
                  <option>자연 · 도시</option>
                  <option>휴양 · 미식</option>
                  <option>문화 · 예술</option>
                  <option>쇼핑 · 트렌드</option>
                </select>
              </label>
              <div className="plannerFormRow">
                <label>
                  음식 취향
                  <select value={food} onChange={e => setFood(e.target.value)}>
                    <option>현지 맛집 중심</option>
                    <option>미식 경험</option>
                    <option>가볍고 건강하게</option>
                    <option>채식 위주</option>
                  </select>
                </label>
                <label>
                  숙소 취향
                  <select value={stay} onChange={e => setStay(e.target.value)}>
                    <option>편안한 호텔</option>
                    <option>감성 숙소</option>
                    <option>가성비 숙소</option>
                    <option>럭셔리 리조트</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* 8. 버튼 disabled 처리 및 validation 안내 */}
          <button
            className="createPlanButton"
            disabled={status === "loading" || !isFormValid}
          >
            {status === "loading" ? "AI가 여행을 설계하고 있습니다..." : "✦ AI 일정 만들기"}
          </button>
          {!isFormValid && (
            <p className="formValidationNotice">
              출발지, 목적지, 일정 날짜, 인원, 예산을 모두 입력해 주세요.
            </p>
          )}
        </form>
      </aside>
      <section className={`scheduleWorkspace mobile-${mobileTab}`}>
        {status==="empty"&&<div className="plannerWelcome"><div className="welcomeRoute"><i/><i/><i/></div><span>EYRIA AI PLANNER</span><h2>여행 조건을 알려주시면<br/>이동까지 자연스러운 하루를 만들어요.</h2><p>{generationError||"일정은 언제든 직접 수정할 수 있습니다."}</p></div>}
        {status==="unsupported"&&<div className="plannerUnsupported"><span>장소 데이터 준비 중</span><h2>{destination} 일정은 아직 만들 수 없어요.</h2><p>{generationError}<br/>가짜 장소를 만들지 않고, 실제 장소가 준비된 도시만 안내하고 있습니다.</p><strong>현재 일정 생성 가능 도시</strong><div>{supportedCityIds.map(city=><button key={city} onClick={()=>{setDestination(city);setStatus("empty");setGenerationError("")}}>{city}</button>)}</div></div>}
        {status==="loading"&&<div className="plannerLoading"><div className="aiPulse">✦</div><h2>{loadingStep>=4?"여행 계획이 준비되었습니다.":"EYRIA가 여행을 설계하고 있습니다..."}</h2><div className="plannerLoadingStepList">{["여행 스타일 분석","이동 동선 최적화","운영시간 확인","최적 일정 생성"].map((s,i)=>{const done=i<loadingStep,active=i===loadingStep;return <div key={s} className={`plannerLoadingStepItem ${done?"done":active?"active":"pending"}`}><span className="stepSymbol">{done?"✓":"○"}</span><span>{s}</span></div>})}</div></div>}
        {status==="complete"&&current&&<><div className="planHeader"><div><span>YOUR TRIP TO</span><h2>{destination}, {nights+1}일의 여행</h2><p>{start} — {end} · {people}명 · {tempo} · {interest}</p></div><button onClick={()=>setStatus("empty")}>조건 다시 보기</button></div>{weatherResult?.hasRain&&<div className="weatherBanner">✦ 비 예보를 반영해 실내 장소를 우선 배치했습니다.</div>}{!weatherResult?.hasRain&&weatherResult?.hasClear&&<div className="weatherBanner">✦ 맑은 날씨를 고려해 야외 일정을 중심으로 구성했습니다.</div>}<div className="serviceActions"><span className={`saveIndicator ${saveStatus}`}>{saveStatus==="saving"?"저장 중…":saveStatus==="saved"?"✓ 자동 저장됨":"자동 저장 준비"}</span><div className="actionButtonsGroup"><button onClick={()=>void saveCurrentTrip()}>{source==="shared"?"내 일정으로 저장":"일정 저장"}</button><button onClick={shareCurrentTrip}>링크 공유</button><button onClick={()=>window.print()}>PDF로 저장</button><button onClick={exportCalendar}>캘린더 내보내기</button>{current.stops[activeStop]&&<Link href={`/place?id=${encodeURIComponent(current.stops[activeStop].placeId)}`}>선택 장소 상세</Link>}</div></div>
          <div className="planMetrics">
            <span><small>방문 장소</small><strong>{totals.stops}곳</strong></span>
            <span><small>예상 이동거리</small><strong>{totals.distance} km</strong></span>
            <span><small>예상 체류시간</small><strong>{Math.floor(totals.duration/60)}시간 {totals.duration%60}분</strong></span>
            <span>
              <small>DAY {activeDay+1} 1인당 경비 ({dayCostSummary?.currencySymbol})</small>
              <strong>{dayCostSummary ? formatCurrency(dayCostSummary.perPersonLocal, dayCostSummary.localCurrency) : `${Math.round(totals.cost/10000)}만원`}</strong>
              {dayCostSummary && dayCostSummary.localCurrency !== "KRW" && (
                <small className="krwRefText">({formatKrwReference(dayCostSummary.perPersonKrw)})</small>
              )}
            </span>
            <span>
              <small>{people}인 총 예상 경비 ({dayCostSummary?.currencySymbol})</small>
              <strong>{dayCostSummary ? formatCurrency(dayCostSummary.totalGroupLocal, dayCostSummary.localCurrency) : `${Math.max(0,budget-Math.round(totals.cost/10000))}만원`}</strong>
              {dayCostSummary && dayCostSummary.localCurrency !== "KRW" && (
                <small className="krwRefText">({formatKrwReference(dayCostSummary.totalGroupKrw)})</small>
              )}
            </span>
            <button type="button" className="toggleCostDetailsBtn" onClick={() => setShowCostDetails(v => !v)}>
              {showCostDetails ? "비용 세부 닫기 ▲" : "비용 세부보기 ▾"}
            </button>
          </div>

          {showCostDetails && dayCostSummary && (
            <div className="costCategoryDetailsTray">
              <div className="costCategoryHeader">
                <strong>DAY {activeDay+1} 항목별 예상 비용 ({people}인 기준)</strong>
                <span>{EXCHANGE_RATE_METADATA.disclaimerLabel}</span>
              </div>
              <div className="costCategoryGrid">
                {dayCostSummary.categories.map(cat => (
                  <div key={cat.key} className="costCategoryItem">
                    <span className="catLabel">{cat.label}</span>
                    <strong className="catAmount">{formatCurrency(cat.localAmount !== null ? cat.localAmount * people : null, dayCostSummary.localCurrency)}</strong>
                    {dayCostSummary.localCurrency !== "KRW" && cat.krwAmount !== null && (
                      <small className="catKrw">({formatKrwReference(cat.krwAmount * people)})</small>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="estimateDisclaimer">운영시간·비용·이동 정보는 정적 데이터 기준 추정값이며, 현지 사정에 따라 달라질 수 있습니다.</p>
          <div className="quickStyleBar"><strong>현재 일정을 가볍게 보완</strong>{quickStyles.map(style=><button key={style.key} onClick={()=>applyQuickStyle(style.key,style.label)}>{style.label}</button>)}<button className="undoButton" disabled={!historyDepth} onClick={undoEdit}>↶ 실행 취소{historyDepth>1?` (${historyDepth})`:""}</button></div>
          <div className="planMain"><div className="timelineColumn"><div className="dayScroller">{plan.map((d,i)=><button className={i===activeDay?"active":""} onClick={()=>{setActiveDay(i);setActiveStop(0);setEditingStop(null);setOpenStopMenu(null)}} onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const source=dragRef.current,sourceIndex=source?plan[source.day]?.stops.findIndex(stop=>stop.placeId===source.placeId):-1;if(source&&sourceIndex>=0)moveStop(source.day,sourceIndex,i,d.stops.length);dragRef.current=null}} key={d.label}>{d.label}<small>{d.date}</small></button>)}</div><div className="dayIntro"><div><h3>{current.theme}</h3><p>{current.stops.length}개 실제 장소 · 손잡이를 끌어 순서를 바꿔보세요</p></div><button onClick={()=>setAddOpen(open=>!open)}>＋ 장소 검색</button></div>{addOpen&&<div className="placeFinder"><input autoFocus value={placeQuery} onChange={event=>setPlaceQuery(event.target.value)} placeholder={`${destination}의 장소 또는 태그 검색`}/><div>{availablePlaces.slice(0,6).map(place=><button key={place.id} onClick={()=>addPlace(place)}><strong>{place.name}</strong><span>{place.description}</span></button>)}{availablePlaces.length===0&&<p>검색 결과가 없거나 이미 일정에 포함된 장소입니다.</p>}</div></div>}
          <ol className="timelineList">{current.stops.map((stop,i)=>{
            const validation = validateStopOpening(stop, current.date, current.stops, i, destination);
            const candidates = smartReplaceStopId === stop.id ? findSmartCandidates(stop, plan, destination, { destination, start, days: nights + 1, style: interest, foodPreference: food, pace, wishList: wish, weatherData: weatherResult }, weatherResult?.daily?.[activeDay], activeDay, i) : [];
            return <li className={`${i===activeStop?"active":""} ${editingStop===stop.id?"editing":""}`} onClick={()=>setActiveStop(i)} onMouseEnter={()=>setActiveStop(i)} onDragOver={event=>event.preventDefault()} onDrop={event=>handleDrop(event,activeDay,i)} key={stop.id}>
              <span className="dragHandle" draggable onDragStart={()=>{dragRef.current={day:activeDay,placeId:stop.placeId}}} onDragEnd={()=>{dragRef.current=null}} aria-label={`${stop.name} 순서 이동`} title="드래그해 순서 변경">⠿</span>
              <div className="stopTimeCard">{editingStop===stop.id?<input className="stopTime" value={stop.time} onChange={e=>updateStop(i,"time",e.target.value)} aria-label={`${stop.name} 시간 수정`}/>:<strong>{stop.time}</strong>}<small>{stop.recommendedTime==="morning"?"오전":stop.recommendedTime==="evening"?"저녁":"오후"}</small></div>
              <i>{i+1}</i>
              <div className="stopCardBody">
                {editingStop===stop.id?<input className="stopName stopEditInput" value={stop.name} onChange={e=>updateStop(i,"name",e.target.value)} aria-label="장소명 수정"/>:<div className="stopTitleRow"><Link href={getPlaceDetailUrl(stop.placeId,i)} onClick={()=>getPlaceDetailUrl(stop.placeId,i)}><strong>{stop.name}</strong></Link><span>{categoryNames[stop.category]}</span></div>}
                <p className="stopMeta">{stop.transportFromPrevious&&`${stop.transportFromPrevious} ${stop.travelMinutes}분 · `}{stop.duration} · 약 {stop.costBreakdown ? formatCurrency(stop.costBreakdown.localTotalPerPerson, stop.costBreakdown.localCurrency) : `${stop.cost.toLocaleString()}원`}{stop.userAdded?" · 직접 추가":""}</p>
                <em className="recommendationReason">✦ {recommendationReason(stop,interest,food)}</em>

                {!validation.isValid && (
                  <div className="openingHoursNotice">
                    <div className="noticeTitle">정적 운영시간 검증: {validation.message}</div>
                    <div className="proposalActionGroup">
                      {validation.proposals.map((prop, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          className="proposalBtn"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (prop.type === "time_adjust") {
                              updateStop(i, "time", prop.newTime);
                              setEditNotice(`${prop.newTime}로 시간을 조정했습니다.`);
                            } else if (prop.type === "reorder") {
                              moveWithinDay(i, prop.targetIndex > i ? 1 : -1);
                            } else if (prop.type === "smart_replace") {
                              setSmartReplaceStopId(smartReplaceStopId === stop.id ? null : stop.id);
                            }
                          }}
                        >
                          {prop.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {smartReplaceStopId === stop.id && (
                  <div className="smartReplaceTray" onClick={e=>e.stopPropagation()}>
                    <div className="smartReplaceHeader">
                      <strong>✦ {stop.name} 대체 추천 장소</strong>
                      <button type="button" onClick={()=>setSmartReplaceStopId(null)}>×</button>
                    </div>
                    <div className="smartCandidateList">
                      {candidates.map(cand => (
                        <div key={cand.place.id} className="smartCandidateCard">
                          <div>
                            <strong>{cand.place.name}</strong>
                            <small>{cand.matchReason} · {cand.place.district}</small>
                          </div>
                          <button type="button" onClick={()=>executeSmartReplace(i, cand.place)}>이 장소로 교체</button>
                        </div>
                      ))}
                      {candidates.length === 0 && <p className="noCandidateText">대체할 인접 장소가 없습니다.</p>}
                    </div>
                  </div>
                )}

                {editingStop===stop.id&&<button type="button" className="finishEditButton" onClick={event=>{event.stopPropagation();setEditingStop(null)}}>편집 완료</button>}
                <span className="touchReorder"><button disabled={i===0} onClick={event=>{event.stopPropagation();moveWithinDay(i,-1)}} aria-label={`${stop.name} 위로 이동`}>↑</button><button disabled={i===current.stops.length-1} onClick={event=>{event.stopPropagation();moveWithinDay(i,1)}} aria-label={`${stop.name} 아래로 이동`}>↓</button></span>
              </div>
              <div className="stopMenuWrap">
                <button type="button" className="stopMenuButton" aria-label={`${stop.name} 일정 메뉴`} aria-expanded={openStopMenu===stop.id} onClick={event=>{event.stopPropagation();setOpenStopMenu(openStopMenu===stop.id?null:stop.id)}}>•••</button>
                {openStopMenu===stop.id&&<div className="stopActionMenu" onClick={event=>event.stopPropagation()}>
                  <button type="button" onClick={()=>{setSmartReplaceStopId(stop.id);setOpenStopMenu(null)}}>✦ 다른 장소 추천 (Smart Replace)</button>
                  <button type="button" onClick={()=>{setEditingStop(stop.id);setOpenStopMenu(null)}}>✎ 장소 편집</button>
                  <label>↪ 다른 DAY<select value="" onChange={event=>{if(event.target.value==="")return;const target=Number(event.target.value);if(Number.isInteger(target))moveStop(activeDay,i,target,plan[target].stops.length);setOpenStopMenu(null)}} aria-label={`${stop.name} 다른 날짜로 이동`}><option value="">선택</option>{plan.map((day,dayIndex)=>dayIndex!==activeDay&&<option value={dayIndex} key={day.label}>{day.label}</option>)}</select></label>
                  <button type="button" className="danger" onClick={()=>{removeStop(i);setOpenStopMenu(null)}}>× 일정에서 삭제</button>
                </div>}
              </div>
            </li>;
          })}{current.stops.length>0&&<li className="timelineDropEnd" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const source=dragRef.current,sourceIndex=source?plan[source.day]?.stops.findIndex(stop=>stop.placeId===source.placeId):-1;if(source&&sourceIndex>=0)moveStop(source.day,sourceIndex,activeDay,current.stops.length);dragRef.current=null}}>맨 아래로 이동</li>}</ol>{current.stops.length===0&&<div className="emptyDay"><strong>이 DAY는 비어 있습니다.</strong><span>장소 검색으로 추가하거나 다른 DAY에서 장소를 옮겨보세요.</span></div>}</div><div className="plannerMapColumn"><PlannerMap stops={current.stops} allDays={plan} activeDay={activeDay} activeIndex={activeStop} onSelect={setActiveStop}/></div></div>
          {recommendations.length>0&&<div className="aiSuggestions"><strong>✦ 일정에 없는 실제 추천 장소</strong>{recommendations.map(place=><button onClick={()=>addRecommendation(place)} key={place.id}>{place.name}<span>＋ 일정에 추가</span></button>)}</div>}<section className="printItinerary"><h1>EYRIA · {destination} 여행</h1><p>{start} — {end} · {people}명 · {interest}</p>{plan.map(day=><article key={day.label}><h2>{day.label} · {day.date}</h2><h3>{day.theme}</h3>{day.stops.map(stop=><div key={stop.id}><strong>{stop.time}　{stop.name}</strong><span>{stop.duration} · {stop.transportFromPrevious?`${stop.transportFromPrevious} ${stop.travelMinutes}분`:"첫 장소"} · 약 {stop.cost.toLocaleString()}원</span><small>{stop.description}</small></div>)}</article>)}<footer>운영시간·비용·이동 정보는 {informationReferenceDate} 기준 추정값입니다.</footer></section></>}
      </section>
    </div>
    {shareUrl&&<div className="shareDialog" role="dialog" aria-modal="true" aria-label="일정 공유 링크"><div><button className="shareClose" onClick={()=>setShareUrl("")} aria-label="공유 창 닫기">×</button><span>SHARE EYRIA</span><h2>이 링크로 일정을 함께 볼 수 있어요.</h2><p>링크 안에 현재 일정 정보가 포함됩니다.</p><input readOnly value={shareUrl} onFocus={event=>event.currentTarget.select()} aria-label="공유 링크"/><button onClick={async()=>{await navigator.clipboard.writeText(shareUrl);setEditNotice("공유 링크를 복사했습니다.")}}>링크 복사</button></div></div>}{editNotice&&<div className="plannerToast" role="status" aria-live="polite"><i aria-hidden="true">✓</i><span>{editNotice}</span></div>}
  </main>
}
