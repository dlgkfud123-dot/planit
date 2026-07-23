"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Map as LeafletMap,
  Marker as LeafletMarker,
  Polyline as LeafletPolyline,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TravelCity } from "../../data/cities";

type Props = {
  cities: TravelCity[];
  focusedCountry: string | null;
  citiesVisible: boolean;
  hoveredCity: string | null;
  selected: TravelCity | null;
  showRoute: boolean;
  onCountrySelect: (country: string) => void;
  onSelect: (city: TravelCity) => void;
  onCityHover: (city: string | null) => void;
  onMoveComplete: () => void;
};
type WorldView = { center: [number, number]; zoom: number; minZoom: number };

function getWorldView(): WorldView {
  const width = window.innerWidth;
  if (width <= 700) return { center: [12, 18], zoom: 1.2, minZoom: 1.15 };
  if (width <= 900) return { center: [8, 25], zoom: 2.12, minZoom: 1.9 };
  if (width <= 1100) return { center: [18, 25], zoom: 2.5, minZoom: 2 };
  return { center: [30, 30], zoom: 2.78, minZoom: 2 };
}

const countryViews: Record<string, [number, number, number]> = {
  일본: [36.2, 138.2, 5], 태국: [15.8, 101, 5], 베트남: [16.2, 106.5, 5],
  프랑스: [46.5, 2.2, 5], 영국: [54, -2, 5], 이탈리아: [42.7, 12.5, 5],
  스위스: [46.8, 8.2, 7], 미국: [30, -98, 4], 캐나다: [56, -106, 4],
  브라질: [-14, -51, 4], 아랍에미리트: [24.4, 54.4, 7], 호주: [-25, 134, 4],
  뉴질랜드: [-41, 172, 5], 대한민국: [36.2, 127.8, 7], 싱가포르: [1.35, 103.82, 10],
  대만: [23.7, 121, 7], 인도네시아: [-2, 118, 4], 스페인: [40, -4, 5],
  네덜란드: [52.2, 5.3, 7], 튀르키예: [39, 35, 5], 이집트: [27, 30, 5],
  남아프리카공화국: [-30, 24, 5], 중국: [35, 104, 4], 몽골: [46.8, 103.8, 5],
  러시아: [58, 82, 3],
};

function cityMarkup(city: TravelCity, active: boolean) {
  return `<div class="cityMarker${active ? " active" : ""}"><div class="landmarkPreview"><img src="${city.image}" alt="${city.name} 랜드마크" onerror="this.parentElement.classList.add('imageUnavailable');this.remove()"/><strong>${city.name}</strong><small>${city.country}</small></div><span></span><b>${city.en}</b></div>`;
}

function countryMarkup(country: string, cities: TravelCity[]) {
  const first = cities[0];
  return `<div class="countryMarker"><div class="countryPreview"><img src="${first.image}" alt="${country} 여행 풍경" onerror="this.parentElement.classList.add('imageUnavailable');this.remove()"/><strong>${country}</strong><small>여행지 ${cities.length}곳</small></div><span></span><b>${country}</b></div>`;
}

export default function MapCanvas({ cities, focusedCountry, citiesVisible, hoveredCity, selected, showRoute, onCountrySelect, onSelect, onCityHover, onMoveComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const routeRef = useRef<LeafletPolyline | null>(null);
  const selectRef = useRef(onSelect);
  const countryRef = useRef(onCountrySelect);
  const hoverRef = useRef(onCityHover);
  const moveRef = useRef(onMoveComplete);
  const selectedRef = useRef(selected);
  const hoveredRef = useRef(hoveredCity);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    selectRef.current = onSelect;
    countryRef.current = onCountrySelect;
    hoverRef.current = onCityHover;
    moveRef.current = onMoveComplete;
    selectedRef.current = selected;
    hoveredRef.current = hoveredCity;
  }, [onSelect, onCountrySelect, onCityHover, onMoveComplete, selected, hoveredCity]);

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;
    void import("leaflet").then(({ default: L }) => {
      if (disposed || !containerRef.current) return;
      const worldView = getWorldView();
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      const bounds = L.latLngBounds([[-85.0511, -100000], [85.0511, 100000]]);
      map = L.map(containerRef.current, {
        center: worldView.center, zoom: worldView.zoom, minZoom: worldView.minZoom,
        maxZoom: 9, zoomSnap: 0.1, zoomControl: false, attributionControl: false,
        worldCopyJump: true, maxBounds: bounds, maxBoundsViscosity: 1, tap: true,
      });
      const keep = () => {
        const responsiveView = getWorldView();
        const z = mobile
          ? Math.max(responsiveView.minZoom, Math.log2(map!.getSize().x / 256) + 0.12)
          : Math.max(responsiveView.minZoom, Math.log2(map!.getSize().y / 256) + 0.22);
        map!.setMinZoom(z);
        if (map!.getZoom() < z) map!.setZoom(z, { animate: false });
        map!.panInsideBounds(bounds, { animate: false });
      };
      keep();
      map.on("zoomend resize", keep);
      let dragLat = map.getCenter().lat;
      map.on("dragstart", () => { dragLat = map!.getCenter().lat; });
      map.on("drag", () => {
        const center = map!.getCenter();
        map!.setView([dragLat, center.lng], map!.getZoom(), { animate: false });
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd" }).addTo(map);
      mapRef.current = map;
      setMapReady(true);
    });
    return () => {
      disposed = true;
      markersRef.current = [];
      routeRef.current = null;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      if (!map || cancelled) return;
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      routeRef.current?.remove();
      routeRef.current = null;
      if (focusedCountry) {
        const list = cities.filter((city) => city.country === focusedCountry);
        const view = countryViews[focusedCountry] || [list[0]?.lat || 20, list[0]?.lon || 0, 5];
        const targetZoom = mobile ? Math.min(view[2], 4.7) : view[2];
        if (citiesVisible) {
          markersRef.current = list.map((city) => L.marker([city.lat, city.lon], {
            icon: L.divIcon({
              className: "cityMarkerShell",
              html: cityMarkup(city, selectedRef.current?.en === city.en || hoveredRef.current === city.en),
              iconSize: [104, 42], iconAnchor: [52, 21],
            }),
          }).addTo(map).on("click", () => selectRef.current(city)).on("mouseover", () => hoverRef.current(city.en)).on("mouseout", () => hoverRef.current(null)));
        } else {
          markersRef.current = [L.marker([view[0], view[1]], {
            icon: L.divIcon({ className: "countryMarkerShell", html: countryMarkup(focusedCountry, list), iconSize: [112, 46], iconAnchor: [56, 23] }),
          }).addTo(map)];
        }
        if (!selectedRef.current) map.flyTo([view[0], view[1]], targetZoom, { duration: 1.05 });
      } else {
        const groups = Object.entries(cities.reduce<Record<string, TravelCity[]>>((all, city) => {
          (all[city.country] ??= []).push(city);
          return all;
        }, {}));
        markersRef.current = groups.map(([country, list]) => {
          const view = countryViews[country] || [list[0].lat, list[0].lon, 4];
          return L.marker([view[0], view[1]], {
            icon: L.divIcon({ className: "countryMarkerShell", html: countryMarkup(country, list), iconSize: [112, 46], iconAnchor: [56, 23] }),
          }).addTo(map).on("click", () => countryRef.current(country));
        });
        const worldView = getWorldView();
        map.flyTo(worldView.center, Math.max(map.getMinZoom(), worldView.zoom), { duration: 1 });
      }
    });
    return () => { cancelled = true; };
  }, [cities, focusedCountry, citiesVisible, mapReady]);

  useEffect(() => {
    if (!mapReady || !citiesVisible) return;
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      if (!mapRef.current || cancelled) return;
      const countryCities = cities.filter((city) => city.country === focusedCountry);
      markersRef.current.forEach((marker, index) => {
        const city = countryCities[index];
        if (city) marker.setIcon(L.divIcon({
          className: "cityMarkerShell",
          html: cityMarkup(city, selected?.en === city.en || hoveredCity === city.en),
          iconSize: [104, 42], iconAnchor: [52, 21],
        }));
      });
    });
    return () => { cancelled = true; };
  }, [cities, focusedCountry, citiesVisible, hoveredCity, selected, mapReady]);

  useEffect(() => {
    if (!mapReady || !citiesVisible || !selected) return;
    const map = mapRef.current;
    if (!map) return;
    const onMoveEnd = () => moveRef.current();
    map.once("moveend", onMoveEnd);
    map.flyTo([selected.lat, selected.lon], window.matchMedia("(max-width: 700px)").matches ? 5.25 : 6.2, { animate: true, duration: 1.1 });
    return () => { map.off("moveend", onMoveEnd); };
  }, [selected, citiesVisible, mapReady]);

  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      if (!map || cancelled) return;
      routeRef.current?.remove();
      routeRef.current = null;
      if (selected && showRoute) routeRef.current = L.polyline([[37.5665, 126.978], [selected.lat, selected.lon]], { color: "#316bff", weight: 2.2, opacity: 0.9, dashArray: "8 9", className: "flightPath" }).addTo(map);
    });
    return () => { cancelled = true; };
  }, [selected, showRoute, mapReady]);

  return <div ref={containerRef} className="travelMap" aria-label="국가와 도시를 탐색하는 인터랙티브 세계지도" />;
}
