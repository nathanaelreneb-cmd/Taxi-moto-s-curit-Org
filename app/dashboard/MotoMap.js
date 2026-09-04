'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, LayersControl, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const icon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:50%;background:#e8a33d;border:2px solid #101c1e;"></div>',
  iconSize: [14, 14],
});

const CONAKRY = [9.6412, -13.5784];

function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m) {
  if (m == null) return null;
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export default function MotoMap({ points }) {
  const [userPos, setUserPos] = useState(null);
  const [userError, setUserError] = useState('');

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      () => setUserError("Position non partagée — autorisez la localisation pour voir la distance."),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const center = points.length ? [points[0].latitude, points[0].longitude] : CONAKRY;

  return (
    <div>
      {userError && <p className="hint" style={{ marginBottom: 8 }}>{userError}</p>}
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

        {userPos && (
          <CircleMarker
            center={[userPos.lat, userPos.lng]}
            radius={7}
            pathOptions={{ color: '#3a8fd6', fillColor: '#3a8fd6', fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]}>Vous êtes ici</Tooltip>
          </CircleMarker>
        )}

        {points.map((p) => {
          const dist = userPos ? distanceMeters(userPos.lat, userPos.lng, p.latitude, p.longitude) : null;
          return (
            <Marker key={p.uniqueId} position={[p.latitude, p.longitude]} icon={icon}>
              <Tooltip permanent direction="top" offset={[0, -8]} className="moto-label">
                <b>{p.label}</b>
                <br />
                {p.speed != null ? `${Math.round(p.speed * 1.852)} km/h` : 'Vitesse inconnue'}
                {p.accuracy != null ? ` · précision ± ${Math.round(p.accuracy)} m` : ''}
                <br />
                {p.fixTime ? new Date(p.fixTime).toLocaleString('fr-FR') : ''}
                {dist != null && (
                  <>
                    <br />
                    <b>{formatDistance(dist)} de vous</b>
                  </>
                )}
              </Tooltip>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
