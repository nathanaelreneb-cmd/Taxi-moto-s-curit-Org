'use client';

import { MapContainer, TileLayer, Marker, Tooltip, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#e8a33d;border:2px solid #101c1e;"></div>',
  iconSize: [14, 14],
});

const CONAKRY = [9.6412, -13.5784];

export default function MotoMap({ points }) {
  const center = points.length ? [points[0].latitude, points[0].longitude] : CONAKRY;

  return (
    <MapContainer
      center={center}
      zoom={points.length ? 16 : 7}
      style={{ height: 420, width: '100%', borderRadius: 6 }}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Plan">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      {points.map((p) => (
        <Marker key={p.uniqueId} position={[p.latitude, p.longitude]} icon={icon}>
          <Tooltip permanent direction="top" offset={[0, -8]} className="moto-label">
            <b>{p.label}</b>
            <br />
            {p.speed != null ? `${Math.round(p.speed * 1.852)} km/h` : 'Vitesse inconnue'}
            <br />
            {p.fixTime ? new Date(p.fixTime).toLocaleString('fr-FR') : ''}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
