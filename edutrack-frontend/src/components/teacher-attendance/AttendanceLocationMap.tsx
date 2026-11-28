
"use client";

import { useEffect } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type Props = {
  latitude: number | null;
  longitude: number | null;
  radius: number;
  onLocationChange: (latitude: number, longitude: number) => void;
};

const schoolMarker = L.divIcon({
  className: "attendance-map-marker",
  html: '<div class="attendance-map-marker-pin"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange: Props["onLocationChange"];
}) {
  useMapEvents({
    click(event) {
      onLocationChange(
        Number(event.latlng.lat.toFixed(7)),
        Number(event.latlng.lng.toFixed(7))
      );
    },
  });

  return null;
}

function MapRecenter({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 16));
    }
  }, [latitude, longitude, map]);

  return null;
}

export default function AttendanceLocationMap({
  latitude,
  longitude,
  radius,
  onLocationChange,
}: Props) {
  const hasLocation =
    latitude !== null && longitude !== null;

  const center: [number, number] = hasLocation
    ? [latitude, longitude]
    : [9.082, 8.6753];

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <MapContainer
        center={center}
        zoom={hasLocation ? 16 : 6}
        scrollWheelZoom
        className="h-[380px] w-full"
        style={{ background: "#e2e8f0" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onLocationChange={onLocationChange} />

        <MapRecenter
          latitude={latitude}
          longitude={longitude}
        />

        {hasLocation && (
          <>
            <Marker
              position={[latitude, longitude]}
              icon={schoolMarker}
              draggable
              eventHandlers={{
                dragend(event) {
                  const position = event.target.getLatLng();
                  onLocationChange(
                    Number(position.lat.toFixed(7)),
                    Number(position.lng.toFixed(7))
                  );
                },
              }}
            />

            <Circle
              center={[latitude, longitude]}
              radius={radius}
              pathOptions={{
                color: "#0891b2",
                fillColor: "#06b6d4",
                fillOpacity: 0.15,
              }}
            />
          </>
        )}
      </MapContainer>
    </div>
  );
}
