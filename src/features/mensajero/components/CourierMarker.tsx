import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';

type Position = [number, number];

const myIcon = L.icon({
  iconUrl: 'public/mensajero.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40], 
  popupAnchor: [0, -40],
});

function LocationMarker() {
  const [position, setPosition] = useState<Position | null>(null);
  const map = useMap();

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: Position = [pos.coords.latitude, pos.coords.longitude];
        setPosition(coords);
        map.setView(coords, 17);
      },
      (err) => {
        console.error(err);
        alert('No se pudo obtener la ubicación');
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [map]);

  if (!position) return null;

  return (
    <Marker position={position} icon={myIcon}>
      <Popup>Tu ubicación actual</Popup>
    </Marker>
  );
}
export default LocationMarker;