'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
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
      zoom={points.length ? 13 : 7}
      style={{ height: 360, width: '100%', borderRadius: 6 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {points.map((p) => (
        <Marker key={p.uniqueId} position={[p.latitude, p.longitude]} icon={icon}>
          <Popup>
            <b>{p.label}</b>
            <br />
            {p.speed != null ? `${Math.round(p.speed * 1.852)} km/h` : 'Vitesse inconnue'}
            <br />
            {p.fixTime ? new Date(p.fixTime).toLocaleString('fr-FR') : ''}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
