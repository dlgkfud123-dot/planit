"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap } from "leaflet";
import type { HotelLocation } from "../../types/hotel";

type Props = {
  hotelLocation: HotelLocation;
  itineraryPlaces: { name: string; latitude: number; longitude: number }[];
};

export default function BookingMap({ hotelLocation, itineraryPlaces }: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (typeof window === "undefined") return;
    if (!hotelLocation.latitude || !hotelLocation.longitude) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const lat = hotelLocation.latitude;
      const lng = hotelLocation.longitude;

      const map = L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const hotelIcon = L.divIcon({
        className: "customHotelPin",
        html: `
          <div class="hotelBubble">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="display:inline-block;vertical-align:middle;margin-right:4px;color:#ffffff;">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
            <span class="hotelLabel">숙소 위치: ${hotelLocation.name}</span>
          </div>
        `,
        iconSize: [180, 42],
        iconAnchor: [90, 42],
      });

      L.marker([lat, lng], { icon: hotelIcon })
        .addTo(map)
        .bindPopup(`<strong>${hotelLocation.name}</strong><br/>${hotelLocation.address || "주소 미등록"}`);

      itineraryPlaces.forEach((place) => {
        const placeIcon = L.divIcon({
          className: "customPlaceSpotPin",
          html: `
            <div class="spotBubble">
              <span class="spotDot"></span>
              <span class="spotLabel">${place.name}</span>
            </div>
          `,
          iconSize: [120, 32],
          iconAnchor: [60, 32],
        });

        L.marker([place.latitude, place.longitude], { icon: placeIcon })
          .addTo(map)
          .bindPopup(`<strong>일정 장소: ${place.name}</strong>`);
      });

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [hotelLocation, itineraryPlaces]);

  return (
    <div className="bookingMapWrapper">
      <div ref={mapContainerRef} className="bookingMapContainer" />
      <style jsx global>{`
        .bookingMapWrapper {
          position: relative;
          width: 100%;
          height: 380px;
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .bookingMapContainer {
          width: 100%;
          height: 100%;
        }
        .customHotelPin, .customPlaceSpotPin {
          background: transparent;
          border: none;
        }
        .hotelBubble {
          display: inline-flex;
          align-items: center;
          background: #316bff;
          color: #ffffff;
          padding: 7px 14px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 800;
          box-shadow: 0 4px 14px rgba(49, 107, 255, 0.4);
          white-space: nowrap;
          transform: translateY(-4px);
        }
        .hotelLabel {
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .spotBubble {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #ffffff;
          color: #1e293b;
          border: 1px solid #cbd5e1;
          padding: 4px 10px;
          border-radius: 14px;
          font-size: 11.5px;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
          white-space: nowrap;
        }
        .spotDot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #64748b;
        }
        .spotLabel {
          max-width: 90px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
