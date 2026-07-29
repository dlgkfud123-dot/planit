"use client";

import { useEffect, useRef, useState } from "react";
import type {
  GeoJSON as LeafletGeoJSON,
  Layer as LeafletLayer,
  Map as LeafletMap,
  Marker as LeafletMarker,
  Path as LeafletPath,
  Polyline as LeafletPolyline,
} from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import type { TravelCity } from "../../data/cities";

type Props = {
  cities: TravelCity[];
  focusedCountry: string | null;
  citiesVisible: boolean;
  hoveredCity: string | null;
  selected: TravelCity | null;
  showRoute: boolean;
  variant?: "default" | "intro";
  searchExpanded?: boolean;
  onCountrySelect: (country: string) => void;
  onSelect: (city: TravelCity) => void;
  onCityHover: (city: string | null) => void;
  onMoveComplete: () => void;
};
type WorldView = { center: [number, number]; zoom: number; minZoom: number };
type IntroPlace = {
  name: string;
  lat: number;
  lon: number;
  capital: boolean;
  population: number;
};

function getWorldView(variant: "default" | "intro" = "default"): WorldView {
  const width = typeof window !== "undefined" ? window.innerWidth : 1200;
  if (variant === "intro" && width > 1200) {
    return { center: [8, 0], zoom: 1.45, minZoom: 1 };
  }
  if (width <= 480) return { center: [18, 0], zoom: 0.35, minZoom: 0.25 };
  if (width <= 700) return { center: [18, 10], zoom: 0.75, minZoom: 0.5 };
  if (width <= 900) return { center: [8, 25], zoom: 2.12, minZoom: 1.9 };
  if (width <= 1200) return { center: [18, 25], zoom: 2.3, minZoom: 1.9 };
  return { center: [25, 20], zoom: 2.2, minZoom: 1.8 };
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

type LabelOffset = { x: number; y: number; position: "left" | "right" | "above" | "below" };

const introCityLabelOffsets: Record<string, LabelOffset> = {
  OSAKA: { x: -9, y: 8, position: "left" },
  KYOTO: { x: 9, y: -8, position: "right" },
  ZURICH: { x: -8, y: -7, position: "left" },
  LUCERNE: { x: 9, y: 8, position: "right" },
};

const introCountryIso: Record<string, string> = {
  일본: "JPN", 태국: "THA", 베트남: "VNM", 프랑스: "FRA", 영국: "GBR",
  이탈리아: "ITA", 스위스: "CHE", 미국: "USA", 캐나다: "CAN", 브라질: "BRA",
  아랍에미리트: "ARE", 호주: "AUS", 뉴질랜드: "NZL", 대한민국: "KOR",
  싱가포르: "SGP", 대만: "TWN", 인도네시아: "IDN", 스페인: "ESP",
  네덜란드: "NLD", 튀르키예: "TUR", 이집트: "EGY", 남아프리카공화국: "ZAF",
  중국: "CHN", 몽골: "MNG", 러시아: "RUS",
};

function escapeMapLabel(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character] ?? character);
}

function cityMarkup(city: TravelCity, active: boolean, index: number, variant: "default" | "intro") {
  const variantClass = variant === "intro" ? " introCityMarker" : "";
  const offset = variant === "intro" ? introCityLabelOffsets[city.en] : undefined;
  const offsetStyle = offset ? `--label-x:${offset.x}px;--label-y:${offset.y}px` : "--label-x:0px;--label-y:0px";
  const positionClass = offset ? ` label-${offset.position}` : " label-below";
  return `<div class="cityMarker${variantClass}${positionClass}${active ? " active" : ""}" style="${offsetStyle};animation-delay: ${index * 60}ms"><span></span><b>${city.name}</b></div>`;
}

function countryMarkup(country: string, cities: TravelCity[], index: number, isSelected: boolean, hasSelection: boolean, variant: "default" | "intro") {
  const activeClass = isSelected ? " active" : "";
  const fadedClass = hasSelection && !isSelected ? " faded" : "";
  const variantClass = variant === "intro" ? " introCountryMarker" : "";
  return `<div class="countryMarker${variantClass}${activeClass}${fadedClass}" style="animation-delay: ${index * 35}ms"><span></span><b>${country}</b></div>`;
}

export default function MapCanvas({ cities, focusedCountry, citiesVisible, hoveredCity, selected, showRoute, variant = "default", searchExpanded, onCountrySelect, onSelect, onCityHover, onMoveComplete }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
  const routeRef = useRef<LeafletPolyline | null>(null);
  const introCountriesLayerRef = useRef<LeafletGeoJSON | null>(null);
  const detailLayersRef = useRef<LeafletLayer[]>([]);
  const detailPlaceMarkersRef = useRef<LeafletMarker[]>([]);
  const detailRequestIdRef = useRef(0);
  const transitionTimersRef = useRef<number[]>([]);
  const transitionIdRef = useRef(0);
  const selectRef = useRef(onSelect);
  const countryRef = useRef(onCountrySelect);
  const hoverRef = useRef(onCityHover);
  const moveRef = useRef(onMoveComplete);
  const selectedRef = useRef(selected);
  const hoveredRef = useRef(hoveredCity);
  const focusedCountryRef = useRef(focusedCountry);
  const hasUserInteractedRef = useRef(false);
  const hasAppliedInitialBoundsRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    selectRef.current = onSelect;
    countryRef.current = onCountrySelect;
    hoverRef.current = onCityHover;
    moveRef.current = onMoveComplete;
    selectedRef.current = selected;
    hoveredRef.current = hoveredCity;
    focusedCountryRef.current = focusedCountry;
  }, [onSelect, onCountrySelect, onCityHover, onMoveComplete, selected, hoveredCity, focusedCountry]);

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;
    void import("leaflet").then(({ default: L }) => {
      if (disposed || !containerRef.current) return;
      const worldView = getWorldView(variant);
      const bounds = L.latLngBounds(variant === "intro" ? [[-90, -180], [90, 180]] : [[-85.0511, -180], [85.0511, 180]]);
      map = L.map(containerRef.current, {
        center: worldView.center, zoom: worldView.zoom, minZoom: worldView.minZoom,
        maxZoom: 9, zoomSnap: 0.1, zoomControl: false, attributionControl: false,
        crs: variant === "intro" ? L.CRS.EPSG4326 : L.CRS.EPSG3857,
        worldCopyJump: true, maxBounds: bounds, maxBoundsViscosity: 1, tap: true,
      });

      map.on("zoomstart movestart dragstart", () => {
        hasUserInteractedRef.current = true;
      });

      const keep = () => {
        const responsiveView = getWorldView(variant);
        const z = responsiveView.minZoom;
        map!.setMinZoom(z);
        map!.panInsideBounds(bounds, { animate: false });
      };
      keep();
      map.on("zoomend resize", keep);

      if (variant === "intro") {
        const vectorPane = map.createPane("introVectorPane");
        vectorPane.classList.add("introVectorPane");
        vectorPane.style.zIndex = "200";
        vectorPane.style.pointerEvents = "auto";
        const detailPane = map.createPane("introDetailPane");
        detailPane.classList.add("introDetailPane");
        detailPane.style.zIndex = "250";
        detailPane.style.pointerEvents = "none";
        const placePane = map.createPane("introPlacePane");
        placePane.classList.add("introPlacePane");
        placePane.style.zIndex = "450";
        placePane.style.pointerEvents = "none";

        void Promise.all([
          fetch("/maps/world-countries-50m.geojson").then((response) => {
            if (!response.ok) throw new Error("국가 경계 데이터를 불러오지 못했습니다.");
            return response.json() as Promise<GeoJsonObject>;
          }),
          fetch("/maps/world-coastline-50m.geojson").then((response) => {
            if (!response.ok) throw new Error("해안선 데이터를 불러오지 못했습니다.");
            return response.json() as Promise<GeoJsonObject>;
          }),
          fetch("/maps/world-lakes-50m.geojson").then((response) => {
            if (!response.ok) throw new Error("호수 데이터를 불러오지 못했습니다.");
            return response.json() as Promise<GeoJsonObject>;
          }),
        ]).then(([countries, coastline, lakes]) => {
          if (disposed || !map) return;
          const countryByIso = new Map(Object.entries(introCountryIso).map(([country, iso]) => [iso, country]));
          const getIso = (feature?: { properties?: Record<string, unknown> } | null) => {
            const properties = feature?.properties;
            return String(properties?.ADM0_A3 || properties?.ISO_A3 || properties?.ISO_A3_EH || properties?.ADM0_TLC || "");
          };
          const countriesLayer = L.geoJSON(countries, {
            pane: "introVectorPane",
            interactive: true,
            style: (feature) => ({
              pane: "introVectorPane",
              className: "introCountryPath",
              fillColor: focusedCountryRef.current && getIso(feature) === introCountryIso[focusedCountryRef.current]
                ? "#eaf0ff"
                : "#f6f5ee",
              fillOpacity: 1,
              color: "#c5d5dc",
              opacity: 1,
              weight: 0.55,
              lineCap: "round",
              lineJoin: "round",
            }),
            onEachFeature: (feature, layer) => {
              const country = countryByIso.get(getIso(feature));
              if (country) layer.on("click", () => countryRef.current(country));
            },
          }).addTo(map);
          introCountriesLayerRef.current = countriesLayer;
          L.geoJSON(lakes, {
            pane: "introVectorPane",
            interactive: false,
            style: {
              pane: "introVectorPane",
              className: "introLakePath",
              fill: true,
              fillColor: "#edf7fa",
              fillOpacity: 1,
              color: "#bcd6e0",
              opacity: 1,
              weight: 0.5,
              lineCap: "round",
              lineJoin: "round",
            },
          }).addTo(map);
          L.geoJSON(coastline, {
            pane: "introVectorPane",
            interactive: false,
            style: {
              pane: "introVectorPane",
              className: "introCoastlinePath",
              fill: false,
              color: "#a9c4d2",
              opacity: 1,
              weight: 0.8,
              lineCap: "round",
              lineJoin: "round",
            },
          }).addTo(map);
        }).catch(() => {
          // The intro map deliberately has no raster fallback: a failed vector
          // request must not reintroduce the gray rectangular ocean tile.
        });
      } else {
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd" }).addTo(map);
      }
      mapRef.current = map;
      map.invalidateSize();
      setTimeout(() => { map?.invalidateSize(); }, 100);
      setTimeout(() => { map?.invalidateSize(); }, 300);
      setTimeout(() => { map?.invalidateSize(); }, 600);
      setMapReady(true);
    });
    return () => {
      disposed = true;
      transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      transitionTimersRef.current = [];
      transitionIdRef.current += 1;
      detailRequestIdRef.current += 1;
      detailLayersRef.current = [];
      detailPlaceMarkersRef.current = [];
      introCountriesLayerRef.current = null;
      markersRef.current = [];
      routeRef.current = null;
      if (map) map.remove();
      mapRef.current = null;
    };
  }, [variant]);

  /* ResizeObserver to handle container width changes and invalidate Leaflet size smoothly */
  useEffect(() => {
    if (!mapReady || !containerRef.current) return;
    const container = containerRef.current;
    const observer = new ResizeObserver(() => {
      const map = mapRef.current;
      if (map) {
        map.invalidateSize();
        void import("leaflet").then(({ default: L }) => {
          if (!hasUserInteractedRef.current && !hasAppliedInitialBoundsRef.current && !focusedCountry) {
            if (variant === "intro" && window.innerWidth > 1200) {
              map.setView([8, 0], 1.45, { animate: false });
            } else {
              const isMobile = window.innerWidth <= 640;
              const worldBounds = L.latLngBounds(L.latLng(-60, -170), L.latLng(75, 175));
              map.fitBounds(worldBounds, { padding: isMobile ? [4, 4] : [16, 16], animate: false });
            }
            hasAppliedInitialBoundsRef.current = true;
          } else {
            const bounds = L.latLngBounds([[-85.0511, -180], [85.0511, 180]]);
            map.panInsideBounds(bounds, { animate: false });
          }
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [mapReady, focusedCountry, variant]);

  useEffect(() => {
    if (variant !== "intro" || !introCountriesLayerRef.current) return;
    const selectedIso = focusedCountry ? introCountryIso[focusedCountry] : undefined;
    introCountriesLayerRef.current.eachLayer((layer) => {
      const path = layer as LeafletPath & { feature?: { properties?: Record<string, unknown> } };
      const properties = path.feature?.properties;
      const iso = String(properties?.ADM0_A3 || properties?.ISO_A3 || properties?.ISO_A3_EH || properties?.ADM0_TLC || "");
      path.setStyle({
        fillColor: selectedIso && iso === selectedIso ? "#eaf0ff" : "#f6f5ee",
      });
    });
  }, [focusedCountry, variant]);

  useEffect(() => {
    if (!mapReady || variant !== "intro") return;
    let cancelled = false;
    detailRequestIdRef.current += 1;
    const requestId = detailRequestIdRef.current;

    detailLayersRef.current.forEach((layer) => layer.remove());
    detailPlaceMarkersRef.current.forEach((marker) => marker.remove());
    detailLayersRef.current = [];
    detailPlaceMarkersRef.current = [];

    const iso = focusedCountry ? introCountryIso[focusedCountry] : undefined;
    if (!iso) return;

    void Promise.all([
      import("leaflet"),
      fetch(`/maps/detail/${iso}.json`).then((response) => {
        if (!response.ok) throw new Error("상세 지도 데이터를 불러오지 못했습니다.");
        return response.json() as Promise<{
          country: GeoJsonObject;
          admin1: GeoJsonObject;
          places?: IntroPlace[];
        }>;
      }),
    ]).then(([{ default: L }, detail]) => {
      const map = mapRef.current;
      if (!map || cancelled || requestId !== detailRequestIdRef.current) return;

      const countryLayer = L.geoJSON(detail.country, {
        pane: "introDetailPane",
        interactive: false,
        style: {
          pane: "introDetailPane",
          className: "introDetailCountryPath",
          fillColor: "#eaf0ff",
          fillOpacity: 1,
          color: "#a9c4d2",
          opacity: 1,
          weight: 0.8,
          lineCap: "round",
          lineJoin: "round",
        },
      }).addTo(map);

      const adminLayer = L.geoJSON(detail.admin1, {
        pane: "introDetailPane",
        interactive: false,
        style: {
          pane: "introDetailPane",
          className: "introAdminPath",
          fill: false,
          color: "#c5d5dc",
          opacity: 0.95,
          weight: 0.55,
          lineCap: "round",
          lineJoin: "round",
        },
      }).addTo(map);

      detailLayersRef.current = [countryLayer, adminLayer];

      const supportedCities = cities.filter((city) => city.country === focusedCountry);
      const places = (detail.places ?? []).filter((place) =>
        !supportedCities.some((city) =>
          Math.abs(city.lat - place.lat) < 0.28 && Math.abs(city.lon - place.lon) < 0.28
        )
      );
      detailPlaceMarkersRef.current = places.map((place, index) =>
        L.marker([place.lat, place.lon], {
          pane: "introPlacePane",
          interactive: false,
          keyboard: false,
          icon: L.divIcon({
            className: "introPlaceLabelShell",
            html: `<span class="introPlaceLabel${place.capital ? " capital" : ""}" style="animation-delay:${620 + index * 45}ms">${escapeMapLabel(place.name)}</span>`,
            iconSize: [104, 22],
            iconAnchor: [52, 11],
          }),
        }).addTo(map)
      );
    }).catch(() => {
      // The 50m world layer remains visible if optional country detail fails.
    });

    return () => {
      cancelled = true;
    };
  }, [cities, focusedCountry, mapReady, variant]);

  /* Ambient organic camera drift when idle on home map */
  useEffect(() => {
    if (!mapReady || focusedCountry || selected || variant === "intro") return;
    let frameId: number;
    let lastTime = performance.now();
    const step = (now: number) => {
      const map = mapRef.current;
      if (map && !focusedCountry && !selected && !hasUserInteractedRef.current) {
        const dt = now - lastTime;
        if (dt > 50) {
          map.panBy([0.28, 0], { animate: false });
          lastTime = now;
        }
      }
      frameId = requestAnimationFrame(step);
    };
    frameId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameId);
  }, [mapReady, focusedCountry, selected, variant]);

  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      if (!map || cancelled) return;
      const mobile = window.matchMedia("(max-width: 700px)").matches;
      transitionIdRef.current += 1;
      const transitionId = transitionIdRef.current;
      transitionTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      transitionTimersRef.current = [];

      const previousMarkers = markersRef.current;
      markersRef.current = [];
      previousMarkers.forEach((marker) => marker.getElement()?.classList.add("introMarkerLeaving"));
      const removeTimer = window.setTimeout(() => previousMarkers.forEach((marker) => marker.remove()), variant === "intro" ? 180 : 0);
      transitionTimersRef.current.push(removeTimer);
      routeRef.current?.remove();
      routeRef.current = null;

      if (focusedCountry) {
        const list = cities.filter((city) => city.country === focusedCountry);
        const view = countryViews[focusedCountry] || [list[0]?.lat || 20, list[0]?.lon || 0, 5];
        const targetZoom = mobile ? Math.min(view[2], 4.7) : view[2];

        if (variant === "intro" && list.length > 0) {
          const bounds = L.latLngBounds(list.map((city) => L.latLng(city.lat, city.lon)));
          map.flyToBounds(bounds.pad(0.16), {
            animate: true,
            duration: 0.8,
            easeLinearity: 0.2,
            padding: [42, 42],
            maxZoom: 7,
          });
        }

        if (citiesVisible) {
          if (variant === "intro") {
            list.forEach((city, idx) => {
              const timer = window.setTimeout(() => {
                if (cancelled || transitionIdRef.current !== transitionId || !mapRef.current) return;
                const marker = L.marker([city.lat, city.lon], {
                  icon: L.divIcon({
                    className: "cityMarkerShell introCityMarkerShell",
                    html: cityMarkup(city, selectedRef.current?.en === city.en || hoveredRef.current === city.en, 0, variant),
                    iconSize: [96, 44],
                    iconAnchor: [48, 22],
                  }),
                }).addTo(map)
                  .on("click", () => selectRef.current(city))
                  .on("mouseover", () => hoverRef.current(city.en))
                  .on("mouseout", () => hoverRef.current(null));
                markersRef.current.push(marker);
              }, 600 + idx * 60);
              transitionTimersRef.current.push(timer);
            });
          } else {
            markersRef.current = list.map((city, idx) => L.marker([city.lat, city.lon], {
              icon: L.divIcon({
                className: "cityMarkerShell",
                html: cityMarkup(city, selectedRef.current?.en === city.en || hoveredRef.current === city.en, idx, variant),
                iconSize: [104, 42],
                iconAnchor: [52, 21],
              }),
            }).addTo(map).on("click", () => selectRef.current(city)).on("mouseover", () => hoverRef.current(city.en)).on("mouseout", () => hoverRef.current(null)));
          }
        } else {
          markersRef.current = [L.marker([view[0], view[1]], {
            icon: L.divIcon({
              className: "countryMarkerShell",
              html: countryMarkup(focusedCountry, list, 0, true, true, variant),
              iconSize: variant === "intro" ? [44, 36] : [112, 46],
              iconAnchor: variant === "intro" ? [22, 18] : [56, 23],
            }),
          }).addTo(map)];
        }
        if (variant !== "intro" && !selectedRef.current) {
          window.setTimeout(() => {
            if (!cancelled && mapRef.current) {
              mapRef.current.flyTo([view[0], view[1]], targetZoom, { duration: 0.8, easeLinearity: 0.2 });
            }
          }, 160);
        }
      } else {
        const allGroups = Object.entries(cities.reduce<Record<string, TravelCity[]>>((all, city) => {
          (all[city.country] ??= []).push(city);
          return all;
        }, {}));
        const groups = variant === "intro" ? [] : allGroups;
        markersRef.current = groups.map(([country, list], idx) => {
          const view = countryViews[country] || [list[0].lat, list[0].lon, 4];
          const isSelected = focusedCountry === country;
          const hasSelection = Boolean(focusedCountry);
          return L.marker([view[0], view[1]], {
            icon: L.divIcon({
              className: "countryMarkerShell",
              html: countryMarkup(country, list, idx, isSelected, hasSelection, variant),
              iconSize: variant === "intro" ? [44, 36] : [112, 46],
              iconAnchor: variant === "intro" ? [22, 18] : [56, 23],
            }),
          }).addTo(map).on("click", () => countryRef.current(country));
        });
        if (variant === "intro" && !hasAppliedInitialBoundsRef.current && !hasUserInteractedRef.current) {
          map.setView([8, 0], 1.45, { animate: false });
          hasAppliedInitialBoundsRef.current = true;
        } else if (variant === "intro") {
          const worldBounds = L.latLngBounds(L.latLng(-60, -170), L.latLng(75, 175));
          map.flyToBounds(worldBounds, { animate: true, duration: 0.8, easeLinearity: 0.2, padding: [16, 16] });
        } else if (!hasAppliedInitialBoundsRef.current && !hasUserInteractedRef.current) {
          const worldBounds = L.latLngBounds(L.latLng(-55, -175), L.latLng(75, 180));
          map.fitBounds(worldBounds, { padding: [16, 16], animate: false });
          hasAppliedInitialBoundsRef.current = true;
        }
      }
    });
    return () => { cancelled = true; };
  }, [cities, focusedCountry, citiesVisible, mapReady, variant]);

  useEffect(() => {
    if (!mapReady || !citiesVisible) return;
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      if (!mapRef.current || cancelled) return;
      const countryCities = cities.filter((city) => city.country === focusedCountry);
      markersRef.current.forEach((marker, index) => {
        const markerPoint = marker.getLatLng();
        const city = variant === "intro"
          ? countryCities.find((candidate) =>
            Math.abs(candidate.lat - markerPoint.lat) < 0.0001 &&
            Math.abs(candidate.lon - markerPoint.lng) < 0.0001
          )
          : countryCities[index];
        if (city) marker.setIcon(L.divIcon({
          className: variant === "intro" ? "cityMarkerShell introCityMarkerShell" : "cityMarkerShell",
          html: cityMarkup(city, selected?.en === city.en || hoveredCity === city.en, variant === "intro" ? 0 : index, variant),
          iconSize: variant === "intro" ? [96, 44] : [104, 42],
          iconAnchor: variant === "intro" ? [48, 22] : [52, 21],
        }));
      });
    });
    return () => { cancelled = true; };
  }, [cities, focusedCountry, citiesVisible, hoveredCity, selected, mapReady, variant]);

  useEffect(() => {
    if (!mapReady || !citiesVisible || !selected) return;
    const map = mapRef.current;
    if (!map) return;
    if (variant === "intro") {
      map.panTo([selected.lat, selected.lon], { animate: true, duration: 0.35, easeLinearity: 0.25 });
      moveRef.current();
      return;
    }
    const onMoveEnd = () => moveRef.current();
    map.once("moveend", onMoveEnd);
    map.flyTo([selected.lat, selected.lon], window.matchMedia("(max-width: 700px)").matches ? 5.25 : 6.2, { animate: true, duration: 1.35, easeLinearity: 0.18 });
    return () => { map.off("moveend", onMoveEnd); };
  }, [selected, citiesVisible, mapReady, variant]);

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

  return (
    <div
      ref={containerRef}
      className={`travelMap${variant === "intro" ? " travelMap--intro" : ""}`}
      style={{ width: "100%", height: "100%", minHeight: "520px", display: "block", position: "relative", zIndex: 1 }}
      aria-label="국가와 도시를 탐색하는 인터랙티브 세계지도"
    />
  );
}
