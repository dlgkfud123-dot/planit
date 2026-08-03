"use client";

import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import type { TransportMode } from "../../utils/transport";

export type PlanStop = {
  id: string;
  name: string;
  time: string;
  cost: number;
  duration: string;
  lat: number;
  lng: number;
  transportFromPrevious?: TransportMode;
};

type Props = {
  stops: PlanStop[];
  allDays: { stops: PlanStop[] }[];
  activeDay: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  onOpenDetail?: (index: number) => void;
  viewportPadding?: { top: number; right: number; bottom: number; left: number };
};

const valid = (stop: PlanStop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng);
const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]!));

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function isRouteValid(coords: [number, number][], startLat: number, startLng: number, endLat: number, endLng: number): boolean {
  if (!coords || coords.length < 2) return false;
  const directDist = distanceKm(startLat, startLng, endLat, endLng);
  let routeDist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    routeDist += distanceKm(coords[i][1], coords[i][0], coords[i + 1][1], coords[i + 1][0]);
  }
  if (directDist > 1.0 && routeDist > 4.5 * directDist) return false;
  if (directDist < 30.0 && routeDist > 200.0) return false;
  return true;
}

function resolveOrsMode(mode?: TransportMode, distKm = 0): "foot-walking" | "driving-car" {
  if (mode === "도보") return "foot-walking";
  if (mode === "대중교통") return distKm <= 1.5 ? "foot-walking" : "driving-car";
  return "driving-car";
}

const segmentCache = new Map<string, [number, number][] | null>();

async function fetchSegmentRoute(
  startLng: number,
  startLat: number,
  endLng: number,
  endLat: number,
  mode: "foot-walking" | "driving-car",
  signal?: AbortSignal
): Promise<[number, number][] | null> {
  const cacheKey = `${startLng.toFixed(5)},${startLat.toFixed(5)}_${endLng.toFixed(5)},${endLat.toFixed(5)}_${mode}`;
  if (segmentCache.has(cacheKey)) {
    return segmentCache.get(cacheKey)!;
  }

  try {
    const res = await fetch("/api/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: [startLng, startLat], end: [endLng, endLat], mode }),
      signal,
    });
    if (!res.ok) {
      segmentCache.set(cacheKey, null);
      return null;
    }
    const data = await res.json();
    if (data.ok && Array.isArray(data.coordinates) && isRouteValid(data.coordinates, startLat, startLng, endLat, endLng)) {
      segmentCache.set(cacheKey, data.coordinates);
      return data.coordinates;
    }
  } catch {
    // Ignore fetch error / abort signal
  }
  segmentCache.set(cacheKey, null);
  return null;
}

export default function PlannerMap({ stops, allDays, activeDay, activeIndex, onSelect, onOpenDetail, viewportPadding }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const inactiveLayerRef = useRef<LayerGroup | null>(null);
  const routeLayerRef = useRef<LayerGroup | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const selectRef = useRef(onSelect);
  const openDetailRef = useRef(onOpenDetail);
  const stopsRef = useRef(stops);
  const activeRef = useRef(activeIndex);
  const userInteractedRef = useRef(false);
  const programmaticMoveRef = useRef(false);
  const framedDayRef = useRef<number | null>(null);
  const framedStopsRef = useRef("");
  const [approximate, setApproximate] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    selectRef.current = onSelect;
  }, [onSelect]);
  useEffect(() => {
    openDetailRef.current = onOpenDetail;
  }, [onOpenDetail]);
  useEffect(() => {
    stopsRef.current = stops;
  }, [stops]);
  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    let disposed = false;
    let map: LeafletMap | null = null;
    let observer: ResizeObserver | null = null;
    void import("leaflet").then(({ default: L }) => {
      if (disposed || !el.current) return;
      const initial = stopsRef.current[0];
      map = L.map(el.current, { zoomControl: false, attributionControl: false }).setView(
        initial && valid(initial) ? [initial.lat, initial.lng] : [35, 135],
        13
      );
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", { subdomains: "abcd" }).addTo(map);
      map.on("dragstart zoomstart", () => {
        if (!programmaticMoveRef.current) userInteractedRef.current = true;
      });
      mapRef.current = map;
      map.invalidateSize({ pan: false });
      setMapReady(true);
      observer = new ResizeObserver((entries) => {
        const size = entries[0]?.contentRect;
        if (!map || !size || size.width < 1 || size.height < 1) return;
        map.invalidateSize({ pan: false });
      });
      observer.observe(el.current);
    });
    return () => {
      disposed = true;
      observer?.disconnect();
      map?.remove();
      mapRef.current = null;
    };
  }, []);

  // Other DAY paths only change when the itinerary or active DAY changes.
  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      if (!map || cancelled) return;
      inactiveLayerRef.current?.remove();
      const group = L.layerGroup().addTo(map);
      inactiveLayerRef.current = group;
      allDays.forEach((day, dayIndex) => {
        if (dayIndex === activeDay) return;
        const points = day.stops.filter(valid);
        if (points.length > 1) {
          L.polyline(points.map((stop) => [stop.lat, stop.lng]), {
            color: "#8fa5b8",
            weight: 2,
            opacity: 0.22,
            dashArray: "4 10",
            className: "inactiveDayRoute",
          }).addTo(group);
        }
      });
    });
    return () => {
      cancelled = true;
    };
  }, [allDays, activeDay, mapReady]);

  // Markers are rebuilt only when stop data changes, never for hover selection.
  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    void import("leaflet").then(({ default: L }) => {
      const map = mapRef.current;
      if (!map || cancelled) return;
      markerLayerRef.current?.remove();
      const group = L.layerGroup().addTo(map);
      const validStops = stops.filter(valid);
      markerLayerRef.current = group;
      markersRef.current = validStops.map((stop, index) =>
        L.marker([stop.lat, stop.lng], {
          icon: L.divIcon({
            className: "planPinShell",
            html: `<button class="planPin" aria-label="${escapeHtml(stop.name)}">${index + 1}</button>`,
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          }),
        })
          .addTo(group)
          .on("click", () => {
            selectRef.current(index);
            openDetailRef.current?.(index);
          })
      );
      const active = stopsRef.current[activeRef.current];
      if (validStops.length === 1 && active && valid(active)) {
        map.invalidateSize({ pan: false });
        programmaticMoveRef.current = true;
        map.setView([active.lat, active.lng], 15, { animate: false });
        programmaticMoveRef.current = false;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [stops, mapReady]);

  // Frame a DAY only when it is first shown or its actual stop composition changes.
  // Card selection continues to use the existing panTo behavior below.
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    const validStops = stops.filter(valid);
    if (!map || validStops.length < 2) return;
    const signature = validStops.map((stop) => `${stop.id}:${stop.lat}:${stop.lng}`).join("|");
    const dayChanged = framedDayRef.current !== activeDay;
    const stopsChanged = framedStopsRef.current !== signature;
    if (!dayChanged && (!stopsChanged || userInteractedRef.current)) return;

    void import("leaflet").then(({ default: L }) => {
      if (!mapRef.current) return;
      const bounds = L.latLngBounds(validStops.map((stop) => L.latLng(stop.lat, stop.lng)));
      const padding = viewportPadding ?? { top: 24, right: 24, bottom: 24, left: 24 };
      programmaticMoveRef.current = true;
      mapRef.current.fitBounds(bounds, {
        animate: false,
        maxZoom: 15,
        paddingTopLeft: [padding.left, padding.top],
        paddingBottomRight: [padding.right, padding.bottom],
      });
      programmaticMoveRef.current = false;
      framedDayRef.current = activeDay;
      framedStopsRef.current = signature;
      userInteractedRef.current = false;
    });
  }, [activeDay, mapReady, stops, viewportPadding]);

  // Route generation: Segment-by-segment ORS / OSRM routing with per-segment fallback.
  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    const controller = new AbortController();

    void import("leaflet").then(async ({ default: L }) => {
      const map = mapRef.current;
      if (!map || cancelled) return;

      routeLayerRef.current?.remove();
      const group = L.layerGroup().addTo(map);
      routeLayerRef.current = group;

      const validStops = stops.filter(valid);
      if (validStops.length < 2) {
        setApproximate(false);
        return;
      }

      const segmentRequests: { prev: PlanStop; curr: PlanStop; mode: "foot-walking" | "driving-car" }[] = [];
      for (let i = 1; i < validStops.length; i++) {
        const prev = validStops[i - 1];
        const curr = validStops[i];
        const dist = distanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
        const orsMode = resolveOrsMode(curr.transportFromPrevious, dist);
        segmentRequests.push({ prev, curr, mode: orsMode });
      }

      const results = await Promise.all(
        segmentRequests.map((req) =>
          fetchSegmentRoute(req.prev.lng, req.prev.lat, req.curr.lng, req.curr.lat, req.mode, controller.signal)
        )
      );

      if (cancelled || !mapRef.current) return;

      let hasFallbackSegment = false;

      results.forEach((coords, idx) => {
        const { prev, curr } = segmentRequests[idx];
        if (coords && coords.length > 1) {
          L.polyline(
            coords.map((pt) => [pt[1], pt[0]]),
            {
              color: "#326cff",
              weight: 5,
              opacity: 0.92,
              className: "roadRoute activeDayRoute",
            }
          ).addTo(group);
        } else {
          hasFallbackSegment = true;
          L.polyline(
            [
              [prev.lat, prev.lng],
              [curr.lat, curr.lng],
            ],
            {
              color: "#326cff",
              weight: 4,
              opacity: 0.88,
              dashArray: "7 8",
              className: "approxRoute activeDayRoute",
            }
          ).addTo(group);
        }
      });

      setApproximate(hasFallbackSegment);
    });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [stops, mapReady]);

  // Hover/selection only toggles marker styling and pans the existing map.
  useEffect(() => {
    if (!mapReady) return;
    markersRef.current.forEach((marker, index) =>
      marker.getElement()?.querySelector(".planPin")?.classList.toggle("active", index === activeIndex)
    );
    const active = stops[activeIndex];
    const map = mapRef.current;
    const container = el.current;
    if (active && map && container && container.offsetWidth > 0 && container.offsetHeight > 0 && valid(active)) {
      map.stop();
      programmaticMoveRef.current = true;
      map.panTo([active.lat, active.lng], { animate: false });
      programmaticMoveRef.current = false;
    }
  }, [activeIndex, stops, mapReady]);

  return (
    <div className="plannerMapFrame">
      <div ref={el} className="realPlannerMap" aria-label="여행 일정 지도" />
      {approximate && <p className="routeApproxNotice">일부 구간은 이동수단을 반영한 근사 경로입니다.</p>}
    </div>
  );
}
