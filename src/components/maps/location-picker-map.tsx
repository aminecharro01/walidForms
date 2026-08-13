"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// إصلاح مسارات أيقونات Leaflet الافتراضية مع bundlers مثل Next.js
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LocationPickerMap({
  latitude,
  longitude,
  accuracy,
  draggable = false,
  onPositionChange,
}: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
}) {
  return (
    <MapContainer
      center={[latitude, longitude]}
      zoom={draggable ? 17 : 15}
      style={{ height: "220px", width: "100%", borderRadius: "12px", zIndex: 0 }}
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[latitude, longitude]}
        icon={markerIcon}
        draggable={draggable}
        eventHandlers={
          draggable && onPositionChange
            ? {
                dragend: (e) => {
                  const { lat, lng } = (e.target as L.Marker).getLatLng();
                  onPositionChange(lat, lng);
                },
              }
            : undefined
        }
      >
        {accuracy && (
          <Popup>
            دقة الموقع: {Math.round(accuracy)} متر
          </Popup>
        )}
      </Marker>
    </MapContainer>
  );
}
