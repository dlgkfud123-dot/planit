"use client";

import {useEffect,useRef,useState} from "react";
import type {LayerGroup,Map as LeafletMap,Marker} from "leaflet";
import "leaflet/dist/leaflet.css";
import type {TransportMode} from "../../utils/transport";

export type PlanStop={id:string;name:string;time:string;cost:number;duration:string;lat:number;lng:number;transportFromPrevious?:TransportMode};
type Props={stops:PlanStop[];allDays:{stops:PlanStop[]}[];activeDay:number;activeIndex:number;onSelect:(index:number)=>void};

const valid=(stop:PlanStop)=>Number.isFinite(stop.lat)&&Number.isFinite(stop.lng);
const escapeHtml=(value:string)=>value.replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]!));

export default function PlannerMap({stops,allDays,activeDay,activeIndex,onSelect}:Props){
  const el=useRef<HTMLDivElement>(null),mapRef=useRef<LeafletMap|null>(null);
  const inactiveLayerRef=useRef<LayerGroup|null>(null),routeLayerRef=useRef<LayerGroup|null>(null),markerLayerRef=useRef<LayerGroup|null>(null);
  const markersRef=useRef<Marker[]>([]),selectRef=useRef(onSelect),stopsRef=useRef(stops),activeRef=useRef(activeIndex);
  const[approximate,setApproximate]=useState(false),[mapReady,setMapReady]=useState(false);

  useEffect(()=>{selectRef.current=onSelect},[onSelect]);
  useEffect(()=>{stopsRef.current=stops},[stops]);
  useEffect(()=>{activeRef.current=activeIndex},[activeIndex]);

  useEffect(()=>{let disposed=false,map:LeafletMap|null=null,observer:ResizeObserver|null=null;void import("leaflet").then(({default:L})=>{if(disposed||!el.current)return;const initial=stopsRef.current[0];map=L.map(el.current,{zoomControl:false,attributionControl:false}).setView(initial&&valid(initial)?[initial.lat,initial.lng]:[35,135],13);L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",{subdomains:"abcd"}).addTo(map);mapRef.current=map;setMapReady(true);observer=new ResizeObserver(entries=>{const size=entries[0]?.contentRect;if(!map||!size||size.width<1||size.height<1)return;map.invalidateSize({pan:false})});observer.observe(el.current)});return()=>{disposed=true;observer?.disconnect();map?.remove();mapRef.current=null}},[]);

  // Other DAY paths only change when the itinerary or active DAY changes.
  useEffect(()=>{if(!mapReady)return;let cancelled=false;void import("leaflet").then(({default:L})=>{const map=mapRef.current;if(!map||cancelled)return;inactiveLayerRef.current?.remove();const group=L.layerGroup().addTo(map);inactiveLayerRef.current=group;allDays.forEach((day,dayIndex)=>{if(dayIndex===activeDay)return;const points=day.stops.filter(valid);if(points.length>1)L.polyline(points.map(stop=>[stop.lat,stop.lng]),{color:"#8fa5b8",weight:2,opacity:.22,dashArray:"4 10",className:"inactiveDayRoute"}).addTo(group)})});return()=>{cancelled=true}},[allDays,activeDay,mapReady]);

  // Markers are rebuilt only when stop data changes, never for hover selection.
  useEffect(()=>{if(!mapReady)return;let cancelled=false;Promise.all([import("leaflet"),import("leaflet.markercluster")]).then(([{default:L}])=>{const map=mapRef.current;if(!map||cancelled)return;markerLayerRef.current?.remove();markersRef.current=[];const validStops=stops.filter(valid);if(!validStops.length)return;const clusterGroup=L.markerClusterGroup({showCoverageOnHover:false,zoomToBoundsOnClick:true,spiderfyOnMaxZoom:true,maxClusterRadius:35,spiderfyDistanceMultiplier:1.4,iconCreateFunction:(cluster)=>{const count=cluster.getChildCount();return L.divIcon({className:"planClusterShell",html:`<button class="planClusterMarker" aria-label="장소 ${count}개 그룹"><span>${count}</span></button>`,iconSize:[44,44],iconAnchor:[22,22]})}});markerLayerRef.current=clusterGroup;validStops.forEach((stop,index)=>{const marker=L.marker([stop.lat,stop.lng],{icon:L.divIcon({className:"planPinShell",html:`<button class="planPin${index===activeRef.current?" active":""}" aria-label="${escapeHtml(stop.name)}">${index+1}</button>`,iconSize:[44,44],iconAnchor:[22,22]})}).on("click",()=>selectRef.current(index));clusterGroup.addLayer(marker);markersRef.current.push(marker)});map.addLayer(clusterGroup);const active=stopsRef.current[activeRef.current];if(active&&valid(active)){map.invalidateSize({pan:false});map.setView([active.lat,active.lng],15,{animate:false})}});return()=>{cancelled=true}},[stops,mapReady]);

  // Route generation and OSRM requests are tied to stop data, not activeIndex.
  useEffect(()=>{if(!mapReady)return;let cancelled=false;const controller=new AbortController();void import("leaflet").then(async({default:L})=>{const map=mapRef.current;if(!map||cancelled)return;routeLayerRef.current?.remove();const group=L.layerGroup().addTo(map),validStops=stops.filter(valid);routeLayerRef.current=group;const needsApproximation=validStops.some((stop,index)=>index>0&&stop.transportFromPrevious!=="택시·자동차");setApproximate(validStops.length>1&&needsApproximation);if(validStops.length<2)return;const fallback=()=>L.polyline(validStops.map(stop=>[stop.lat,stop.lng]),{color:"#326cff",weight:4,opacity:.88,dashArray:"7 8",className:"approxRoute activeDayRoute"}).addTo(group);if(needsApproximation){fallback();return}try{const points=validStops.map(stop=>`${stop.lng},${stop.lat}`).join(";"),response=await fetch(`https://router.project-osrm.org/route/v1/driving/${points}?overview=full&geometries=geojson`,{signal:controller.signal});if(!response.ok)throw new Error("Route request failed");const data:unknown=await response.json(),coordinates=routeCoordinates(data);if(!cancelled&&coordinates.length)L.polyline(coordinates.map(point=>[point[1],point[0]]),{color:"#326cff",weight:5,opacity:.92,className:"roadRoute activeDayRoute"}).addTo(group);else if(!cancelled){setApproximate(true);fallback()}}catch{if(!cancelled){setApproximate(true);fallback()}}});return()=>{cancelled=true;controller.abort()}},[stops,mapReady]);

  // Hover/selection only toggles marker styling and pans the existing map.
  useEffect(()=>{if(!mapReady)return;markersRef.current.forEach((marker,index)=>marker.getElement()?.querySelector(".planPin")?.classList.toggle("active",index===activeIndex));const active=stops[activeIndex],map=mapRef.current,container=el.current;if(active&&map&&container&&container.offsetWidth>0&&container.offsetHeight>0&&valid(active)){map.stop();map.panTo([active.lat,active.lng],{animate:false})}},[activeIndex,stops,mapReady]);

  return <div className="plannerMapFrame"><div ref={el} className="realPlannerMap" aria-label="여행 일정 지도"/>{approximate&&<p className="routeApproxNotice">점선은 이동수단을 반영한 근사 경로입니다.</p>}</div>
}

function routeCoordinates(value:unknown):[number,number][]{
  if(!value||typeof value!=="object"||!("routes" in value)||!Array.isArray(value.routes))return[];
  const first=value.routes[0];
  if(!first||typeof first!=="object"||!("geometry" in first)||!first.geometry||typeof first.geometry!=="object"||!("coordinates" in first.geometry)||!Array.isArray(first.geometry.coordinates))return[];
  return first.geometry.coordinates.filter((point:unknown):point is [number,number]=>Array.isArray(point)&&point.length>=2&&typeof point[0]==="number"&&typeof point[1]==="number");
}
