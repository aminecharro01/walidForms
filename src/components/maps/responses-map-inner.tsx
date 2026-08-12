"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Point {
  id: string;
  lat: number;
  lng: number;
  label: string;
}

export default function ResponsesMapInner({ points }: { points: Point[] }) {
  const center: [number, number] =
    points.length > 0 ? [points[0].lat, points[0].lng] : [31.7917, -7.0926]; // centre du Maroc par défaut

  return (
    <MapContainer
      center={center}
      zoom={points.length > 0 ? 6 : 5}
      style={{ height: "420px", width: "100%", borderRadius: "16px", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={markerIcon}>
          <Popup>{p.label}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
