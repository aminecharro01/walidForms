"use client";

import { useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Layers } from "lucide-react";

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

interface Point {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export default function ResponsesMapInner({ points }: { points: Point[] }) {
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : [31.7917, -7.0926]; // centre du Maroc par défaut

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
        center={center}
        zoom={points.length > 0 ? 6 : 5}
        style={{ height: "420px", width: "100%", borderRadius: "16px", zIndex: 0 }}
      >
        <TileLayer key={mapType} attribution={TILE_LAYERS[mapType].attribution} url={TILE_LAYERS[mapType].url} />
        {points.map((p) => (
          <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
            <Popup>{p.label}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
