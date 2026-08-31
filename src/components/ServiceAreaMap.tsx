"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Circle, MapContainer, Marker, TileLayer, Tooltip } from "react-leaflet";

const HQ: [number, number] = [30.4394, -97.62];
const RADIUS_METERS = 70000;

const cities: { name: string; coords: [number, number]; hq?: boolean }[] = [
  { name: "Pflugerville (HQ)", coords: HQ, hq: true },
  { name: "Austin", coords: [30.2672, -97.7431] },
  { name: "Round Rock", coords: [30.5083, -97.6789] },
  { name: "Georgetown", coords: [30.6333, -97.677] },
  { name: "Cedar Park", coords: [30.5052, -97.8203] },
  { name: "Hutto", coords: [30.5427, -97.5467] },
  { name: "Kyle", coords: [29.9891, -97.8767] },
  { name: "Buda", coords: [30.0838, -97.8403] },
  { name: "San Marcos", coords: [29.8833, -97.9414] },
  { name: "Dripping Springs", coords: [30.1902, -98.0867] },
];

const hqIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:#e8a33d;border:3px solid #0c2d4d;box-shadow:0 0 0 4px rgba(232,163,61,0.3)"></span>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

const cityIcon = L.divIcon({
  className: "",
  html: `<span style="display:block;width:10px;height:10px;border-radius:9999px;background:#1d6fbf;border:2px solid white;box-shadow:0 1px 3px rgba(12,45,77,0.4)"></span>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5],
});

export default function ServiceAreaMap() {
  return (
    <MapContainer
      center={HQ}
      zoom={8}
      scrollWheelZoom={false}
      className="h-full w-full"
      style={{ background: "#f6f4ef" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle
        center={HQ}
        radius={RADIUS_METERS}
        pathOptions={{ color: "#1d6fbf", fillColor: "#1d6fbf", fillOpacity: 0.12, weight: 2 }}
      />
      {cities.map((city) => (
        <Marker key={city.name} position={city.coords} icon={city.hq ? hqIcon : cityIcon}>
          <Tooltip direction="top" offset={[0, -6]}>
            {city.name}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
