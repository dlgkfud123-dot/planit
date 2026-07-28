import type {GeneratedDay,GeneratedStop} from "./itineraryGenerator";

export const tripSchemaVersion=2 as const;
export type TripSnapshot={
  schemaVersion:typeof tripSchemaVersion;id:string;title:string;destination:string;origin:string;start:string;end:string;people:number;budget:number;tempo:string;interest:string;food:string;stay:string;pace:1|2|3;plan:GeneratedDay[];createdAt:string;updatedAt:string;
};

const savedKey="eyria:saved-trips:v1",draftKey="eyria:auto-draft:v1";
let lastRestoreError:string|null=null;
export const getLastTripRestoreError=()=>lastRestoreError;

const object=(value:unknown):value is Record<string,unknown>=>typeof value==="object"&&value!==null;
const string=(value:unknown):value is string=>typeof value==="string";
const finite=(value:unknown):value is number=>typeof value==="number"&&Number.isFinite(value);
const stringArray=(value:unknown):value is string[]=>Array.isArray(value)&&value.every(string);

function isGeneratedStop(value:unknown):value is GeneratedStop{
  if(!object(value))return false;
  return string(value.id)&&string(value.placeId)&&string(value.name)&&string(value.time)&&finite(value.cost)&&string(value.duration)&&finite(value.lat)&&finite(value.lng)&&string(value.category)&&string(value.description)&&string(value.openingHours)&&stringArray(value.tags)&&typeof value.isCoreLandmark==="boolean"&&string(value.district)&&typeof value.nearbyTrip==="boolean"&&stringArray(value.transportHints)&&string(value.estimateStatus);
}

function isGeneratedDay(value:unknown):value is GeneratedDay{
  return object(value)&&string(value.label)&&string(value.date)&&string(value.theme)&&Array.isArray(value.stops)&&value.stops.every(isGeneratedStop);
}

export function isTripSnapshot(value:unknown):value is TripSnapshot{
  if(!object(value))return false;
  return value.schemaVersion===tripSchemaVersion&&string(value.id)&&string(value.title)&&string(value.destination)&&string(value.origin)&&string(value.start)&&string(value.end)&&finite(value.people)&&finite(value.budget)&&string(value.tempo)&&string(value.interest)&&string(value.food)&&string(value.stay)&&(value.pace===1||value.pace===2||value.pace===3)&&Array.isArray(value.plan)&&value.plan.every(isGeneratedDay)&&string(value.createdAt)&&string(value.updatedAt);
}

export function restoreTripSnapshot(value:unknown):TripSnapshot|null{
  if(!object(value))return null;
  const migrated=value.schemaVersion===undefined?{...value,schemaVersion:tripSchemaVersion}:value;
  return isTripSnapshot(migrated)?migrated:null;
}

export const readSavedTrips=():TripSnapshot[]=>{
  try{
    const parsed:unknown=JSON.parse(localStorage.getItem(savedKey)||"[]");
    if(!Array.isArray(parsed))throw new Error("Saved trip list is invalid");
    const trips=parsed.map(restoreTripSnapshot).filter((trip):trip is TripSnapshot=>trip!==null);
    lastRestoreError=trips.length===parsed.length?null:"일부 저장 일정의 형식이 올바르지 않아 제외했습니다.";
    return trips;
  }catch{lastRestoreError="저장 일정을 복원하지 못했습니다.";return[]}
};
export const writeSavedTrips=(trips:TripSnapshot[])=>localStorage.setItem(savedKey,JSON.stringify(trips));
export const saveTrip=(trip:TripSnapshot)=>{const trips=readSavedTrips(),index=trips.findIndex(item=>item.id===trip.id);if(index>=0)trips[index]=trip;else trips.unshift(trip);writeSavedTrips(trips);return trip};
export const removeSavedTrip=(id:string)=>writeSavedTrips(readSavedTrips().filter(trip=>trip.id!==id));
export const writeDraft=(trip:TripSnapshot)=>localStorage.setItem(draftKey,JSON.stringify(trip));
export const readDraft=():TripSnapshot|null=>{
  try{const restored=restoreTripSnapshot(JSON.parse(localStorage.getItem(draftKey)||"null"));if(!restored&&localStorage.getItem(draftKey)){localStorage.removeItem(draftKey);lastRestoreError="자동 저장 일정을 복원하지 못해 안전하게 초기화했습니다."}return restored}
  catch{localStorage.removeItem(draftKey);lastRestoreError="자동 저장 일정이 손상되어 안전하게 초기화했습니다.";return null}
};
export const encodeSharedTrip=async(trip:TripSnapshot)=>{const compressed=await new Response(new Blob([JSON.stringify(trip)]).stream().pipeThrough(new CompressionStream("gzip"))).arrayBuffer(),binary=Array.from(new Uint8Array(compressed),byte=>String.fromCharCode(byte)).join("");return btoa(binary).replaceAll("+","-").replaceAll("/","_").replaceAll("=","")};
export const decodeSharedTrip=async(value:string):Promise<TripSnapshot|null>=>{try{const padded=value.replaceAll("-","+").replaceAll("_","/")+"=".repeat((4-value.length%4)%4),binary=atob(padded),bytes=Uint8Array.from(binary,char=>char.charCodeAt(0)),decompressed=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))).text(),restored=restoreTripSnapshot(JSON.parse(decompressed));if(!restored)lastRestoreError="공유 일정의 형식이 올바르지 않습니다.";return restored}catch{lastRestoreError="공유 일정을 복원하지 못했습니다.";return null}};
export const downloadText=(filename:string,content:string,type:string)=>{const url=URL.createObjectURL(new Blob([content],{type})),anchor=document.createElement("a");anchor.href=url;anchor.download=filename;anchor.click();URL.revokeObjectURL(url)};
