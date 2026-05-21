import { useEffect, useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import LocationMarker from './LocationMarker';
import DeliveryMarker from './DeliveryMarker';
import OrderPanel from './OrderPanel';
import type { PanelOrder } from './OrderPanel';

export type MapOrder = {
  buyerName: string;
  deliveryZone: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  total: number;
};

type Position = [number, number];

const mockAddress = 'Torres Del Prado, Cochabamba';

async function geocodeAddress(address: string): Promise<Position | null> {
  const apiKey = import.meta.env.PUBLIC_GEOCODE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://geocode.maps.co/search?q=${address}&api_key=${apiKey}`
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const cercado = data.find((r: { address?: { county?: string } }) => r.address?.county === 'Cercado');
    const best = cercado ?? data[0];
    return [parseFloat(best.lat), parseFloat(best.lon)];
  } catch { /* ignore */ }
  return null;
}

function readMapOrderFromStorage(): MapOrder | null {
  try {
    const raw = localStorage.getItem('courier_map_order');
    if (!raw) return null;
    return JSON.parse(raw) as MapOrder;
  } catch {
    return null;
  }
}

function readPanelOrderFromStorage(): PanelOrder | null {
  try {
    const raw = localStorage.getItem('courier_panel_order');
    if (!raw) return null;
    return JSON.parse(raw) as PanelOrder;
  } catch {
    return null;
  }
}

export default function MapView() {
  const [open, setOpen] = useState(true);
  const [mapOrder, setMapOrder] = useState<MapOrder | null>(null);
  const [panelOrder, setPanelOrder] = useState<PanelOrder | null>(null);
  const [deliveryPosition, setDeliveryPosition] = useState<Position | null>(null);

  useEffect(() => {
    const stored = readMapOrderFromStorage();
    setMapOrder(stored);
    setPanelOrder(readPanelOrderFromStorage());

    if (stored?.deliveryLat != null && stored?.deliveryLng != null) {
      setDeliveryPosition([stored.deliveryLat, stored.deliveryLng]);
    } else {
      const params = new URLSearchParams(window.location.search);
      const address = params.get('address') ?? mockAddress;
      geocodeAddress(address).then((pos) => {
        if (pos) setDeliveryPosition(pos);
      });
    }
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MapContainer
        center={[-17.3917, -66.1497]}
        zoom={17}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
        {deliveryPosition && (
          <DeliveryMarker
            position={deliveryPosition}
            name={mapOrder?.buyerName ?? ''}
            zone={mapOrder?.deliveryZone ?? ''}
          />
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
