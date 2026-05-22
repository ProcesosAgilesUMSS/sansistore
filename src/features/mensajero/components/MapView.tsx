import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Polygon, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import '../styles/style.css';
import {
  ALLOWED_ZONES,
  getAllowedZonesBounds,
  isLocationValid,
} from '../../location/utils/zoneLimits';
import CourierMarker from './CourierMarker';
import OrderMarker from './OrderMarker';
import OrderPanel from './OrderPanel';
import { useAddress } from '../hooks/useAddress';
import { useMapOrders } from '../hooks/useMapOrders';

export type { MapOrder } from '../hooks/useMapOrders';

type Position = [number, number];

const UMSS_CENTER: Position = [-17.3939, -66.1462];
const UMSS_BOUNDS = getAllowedZonesBounds();

function CenterOnce({ position }: { position: Position }) {
  const map = useMap();
  const centered = useRef(false);

  useEffect(() => {
    if (!centered.current) {
      map.setView(position, 17);
      centered.current = true;
    }
  }, [map, position]);

  return null;
}

export default function MapView() {
  const [open, setOpen] = useState(true);
  const { mapOrder, panelOrder } = useMapOrders();

  const params = new URLSearchParams(window.location.search);
  const paramLat = params.get('lat');
  const paramLng = params.get('lng');
  const addressParam = params.get('location');

  const resolvedLat = paramLat != null ? Number(paramLat) : null;
  const resolvedLng = paramLng != null ? Number(paramLng) : null;
  const geocodedPosition = useAddress(
    resolvedLat == null ? addressParam : null
  );

  const deliveryPosition = useMemo<Position | null>(() => {
    if (Number.isFinite(resolvedLat) && Number.isFinite(resolvedLng)) {
      return [resolvedLat as number, resolvedLng as number];
    }

    if (mapOrder?.deliveryLat != null && mapOrder.deliveryLng != null) {
      return [mapOrder.deliveryLat, mapOrder.deliveryLng];
    }

    return geocodedPosition;
  }, [geocodedPosition, mapOrder, resolvedLat, resolvedLng]);

  const isInsideCampus =
    deliveryPosition != null &&
    isLocationValid(deliveryPosition[0], deliveryPosition[1]);

  const center = deliveryPosition && isInsideCampus ? deliveryPosition : UMSS_CENTER;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapContainer
        center={center}
        maxBounds={UMSS_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={16}
        style={{ height: '100%', width: '100%' }}
        zoom={17}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />

        {ALLOWED_ZONES.map((zone, index) => (
          <Polygon
            key={zone.name}
            pathOptions={{
              color: index === 0 ? '#88b04b' : '#3b82f6',
              fillColor: index === 0 ? '#88b04b' : '#3b82f6',
              fillOpacity: 0.16,
              weight: 3,
            }}
            positions={zone.points}
          />
        ))}

        <CourierMarker />

        {deliveryPosition && isInsideCampus && (
          <>
            <CenterOnce position={deliveryPosition} />
            <OrderMarker position={deliveryPosition} />
          </>
        )}
      </MapContainer>

      <button
        className="absolute left-4 top-4 z-1000 inline-flex items-center gap-2 rounded-2xl border border-border-light bg-card-bg-light px-4 py-2.5 text-sm font-bold text-text-light shadow-[0_4px_16px_rgba(38,33,22,0.14)] transition hover:border-primary hover:text-primary"
        onClick={() => {
          window.location.href = '/courier';
        }}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {deliveryPosition && !isInsideCampus && (
        <div className="absolute left-4 top-20 z-1000 max-w-sm rounded-2xl border border-red-400/40 bg-card-bg-light px-4 py-3 text-sm font-bold text-red-500 shadow-lg">
          La ubicacion del pedido esta fuera de las zonas UMSS permitidas.
        </div>
      )}

      <OrderPanel
        onToggle={() => setOpen((value) => !value)}
        open={open}
        order={panelOrder}
      />
    </div>
  );
}
