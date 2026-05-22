import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../styles/style.css';
import CourierMarker from './CourierMarker';
import OrderMarker from './OrderMarker';
import OrderPanel from './OrderPanel';
import { useAddress } from '../hooks/useAddress';
import { useMapOrders } from '../hooks/useMapOrders';

export type { MapOrder } from '../hooks/useMapOrders';

function CenterOnce({ position }: { position: [number, number] }) {
  const map = useMap();
  const centered = useRef(false);
  useEffect(() => {
    if (!centered.current) {
      map.setView(position, 57);
      centered.current = true;
    }
  }, [map, position]);
  return null;
}

const umssBounds: [[number, number], [number, number]] = [
  [-17.3965, -66.1550], // suroeste
  [-17.3820, -66.1400],  // noreste más arriba
];

export default function MapView() {
  const [open, setOpen] = useState(true);
  const { panelOrder } = useMapOrders();

  const params = new URLSearchParams(window.location.search);
  const paramLat = params.get('lat');
  const paramLng = params.get('lng');
  const addressParam = params.get('location');

  const resolvedLat = paramLat != null ? parseFloat(paramLat) : null;
  const resolvedLng = paramLng != null ? parseFloat(paramLng) : null;

  const geocodedPosition = useAddress(
    resolvedLat == null ? addressParam : null
  );

  const deliveryPosition =
    resolvedLat != null && resolvedLng != null && !isNaN(resolvedLat) && !isNaN(resolvedLng)
      ? ([resolvedLat, resolvedLng] as [number, number])
      : geocodedPosition;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapContainer
        center={[-17.3917, -66.1497]}
        zoom={15}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        maxBounds={umssBounds}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        <CourierMarker />
        {deliveryPosition && (
          <>
            <CenterOnce position={deliveryPosition} />
            <OrderMarker position={deliveryPosition} />
          </>
        )}
      </MapContainer>

      <button
        type="button"
        onClick={() => { window.location.href = '/courier'; }}
        className="absolute left-4 top-4 z-1000 inline-flex items-center gap-2 rounded-2xl border border-border-light bg-card-bg-light px-4 py-2.5 text-sm font-bold text-text-light shadow-[0_4px_16px_rgba(38,33,22,0.14)] transition hover:border-primary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <OrderPanel open={open} onToggle={() => setOpen((v) => !v)} order={panelOrder} />
    </div>
  );
}
