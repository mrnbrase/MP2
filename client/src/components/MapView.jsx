import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from 'react-leaflet';

export default function MapView({ countryId, pendingEvents }) {
  const [geojson, setGeojson] = useState(null);

  useEffect(() => {
    // Fetch the country’s GeoJSON once
    async function loadGeo() {
      try {
        const res = await fetch(`/api/countries/${countryId}`);
        const country = await res.json();
        setGeojson(country.geojson);
      } catch (err) {
        console.error('Failed to load country geometry', err);
      }
    }
    if (countryId) loadGeo();
  }, [countryId]);

  // Center map on country’s bounding box, or fallback coords
  const center = geojson
    ? [
        (geojson.features[0].bbox?.[1] + geojson.features[0].bbox?.[3]) / 2,
        (geojson.features[0].bbox?.[0] + geojson.features[0].bbox?.[2]) / 2
      ]
    : [0, 0];

  return (
    <div style={{ height: 400, width: '100%' }}>
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {geojson && (
          <GeoJSON data={geojson} style={{ fillColor: '#8888ff', weight: 2, fillOpacity: 0.3 }} />
        )}

        {pendingEvents.map(ev => (
          <Marker
            key={ev._id}
            position={[
              ev.location?.lat || center[0],        // if you store lat/lng on events
              ev.location?.lng || center[1]
            ]}
          >
            <Popup>
              {ev.type.toUpperCase()}<br/>
              Arrives at {new Date(ev.arrivesAt).toLocaleString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
