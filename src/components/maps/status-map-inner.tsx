"use client";

import { useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { Layers } from "lucide-react";

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

interface StatusPoint {
  id: string;
  lat: number;
  lng: number;
  label: string;
  color: string;
  details?: { label: string; value: string }[];
}

export default function StatusMapInner({ points }: { points: StatusPoint[] }) {
  const [mapType, setMapType] = useState<"street" | "satellite">("street");
  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : [31.7917, -7.0926];

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
        zoom={points.length > 0 ? 15 : 5}
        style={{ height: "480px", width: "100%", borderRadius: "16px", zIndex: 0 }}
      >
        <TileLayer key={mapType} attribution={TILE_LAYERS[mapType].attribution} url={TILE_LAYERS[mapType].url} />
        {points.map((p) => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={7}
            pathOptions={{ color: "#ffffff", weight: 2, fillColor: p.color, fillOpacity: 0.9 }}
          >
            <Popup>
              <div dir="rtl" style={{ minWidth: 170, textAlign: "right" }}>
                <b>{p.label}</b>
                {p.details && p.details.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    {p.details.map((d) => (
                      <div key={d.label}>
                        <b>{d.label}:</b> {d.value || "—"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
