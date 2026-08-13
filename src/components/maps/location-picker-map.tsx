"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Layers } from "lucide-react";

// إصلاح مسارات أيقونات Leaflet الافتراضية مع bundlers مثل Next.js
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
};

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
  const [mapType, setMapType] = useState<"street" | "satellite">("street");

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setMapType((m) => (m === "street" ? "satellite" : "street"))}
        className="absolute left-2 top-2 z-[1000] flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-md hover:bg-slate-50"
      >
        <Layers className="h-3.5 w-3.5" />
        {mapType === "street" ? "Satellite" : "Street"}
      </button>
      <MapContainer
        center={[latitude, longitude]}
        zoom={draggable ? 17 : 15}
        style={{ height: "220px", width: "100%", borderRadius: "12px", zIndex: 0 }}
        scrollWheelZoom={false}
      >
        <TileLayer key={mapType} attribution={TILE_LAYERS[mapType].attribution} url={TILE_LAYERS[mapType].url} />
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
    </div>
  );
}
