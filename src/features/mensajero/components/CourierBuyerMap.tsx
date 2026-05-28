import { ArrowLeft, Banknote, MapPin, Package, Phone } from 'lucide-react';
import L from 'leaflet';
import { useMemo, useState } from 'react';
import { MapContainer, Marker, Polygon, TileLayer, ZoomControl } from 'react-leaflet';
import { ALLOWED_ZONES } from '../../location/utils/zoneLimits';
import 'leaflet/dist/leaflet.css';

const defaultIcon = L.icon({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

type BuyerMapItem = {
  name: string;
  quantity: number;
};

type BuyerMapOrder = {
  customerName: string;
  phone: string;
  address: string;
  reference?: string;
  items: BuyerMapItem[];
  cashToCollect: number;
};

const FALLBACK_POSITION: [number, number] = [-17.394, -66.1473];

function readOrderFromStorage(): BuyerMapOrder | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('courier_panel_order');
    return raw ? (JSON.parse(raw) as BuyerMapOrder) : null;
  } catch {
    return null;
  }
}

export default function CourierBuyerMap() {
  const [order] = useState<BuyerMapOrder | null>(() => readOrderFromStorage());

  const position = useMemo<[number, number]>(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = Number(params.get('lat'));
    const lng = Number(params.get('lng'));

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }

    return FALLBACK_POSITION;
  }, []);

  return (
    <main className="relative h-screen overflow-hidden bg-bg-light text-text-light">
      <MapContainer
        center={position}
        zoom={17}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ZoomControl position="bottomleft" />

        {ALLOWED_ZONES.map((zone, index) => (
          <Polygon
            key={zone.name}
            positions={zone.points}
            pathOptions={{
              color: index === 0 ? '#88b04b' : '#3b82f6',
              fillColor: index === 0 ? '#88b04b' : '#3b82f6',
              fillOpacity: 0.16,
              weight: 2,
            }}
          />
        ))}

        <Marker position={position} />
      </MapContainer>

      <a
        href="/courier"
        className="absolute left-4 top-4 z-[500] inline-flex h-11 w-11 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-text-light shadow-lg transition hover:border-primary hover:text-primary"
        aria-label="Volver a entregas"
      >
        <ArrowLeft size={20} />
      </a>

      <aside className="absolute inset-x-4 bottom-4 z-[500] rounded-[28px] border border-border-light bg-card-bg-light/95 p-5 text-text-light shadow-2xl backdrop-blur md:bottom-auto md:left-auto md:right-6 md:top-1/2 md:w-[360px] md:-translate-y-1/2">
        <p className="mb-1 text-xs font-bold uppercase text-primary">
          Pedido del comprador
        </p>
        <h1 className="text-2xl font-black tracking-normal">
          {order?.customerName ?? 'Cliente no registrado'}
        </h1>

        <div className="mt-5 space-y-4 text-sm">
          <p className="flex items-start gap-3">
            <MapPin className="mt-0.5 shrink-0 text-primary" size={18} />
            <span>
              <span className="block font-bold">
                {order?.address ?? 'Direccion no registrada'}
              </span>
              {order?.reference && (
                <span className="mt-1 block text-xs opacity-70">
                  {order.reference}
                </span>
              )}
            </span>
          </p>

          <p className="flex items-center gap-3">
            <Phone className="shrink-0 text-primary" size={18} />
            <span className="font-bold">{order?.phone ?? 'Sin telefono'}</span>
          </p>

          <div className="flex items-start gap-3">
            <Package className="mt-0.5 shrink-0 text-primary" size={18} />
            <div className="min-w-0 space-y-2">
              {(order?.items?.length ?? 0) > 0 ? (
                order?.items.map((item) => (
                  <p key={`${item.name}-${item.quantity}`}>
                    {item.quantity}x {item.name}
                  </p>
                ))
              ) : (
                <p>Productos no registrados</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-primary/50 bg-primary/10 p-4">
            <p className="flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <Banknote size={16} />
              Cobro
            </p>
            <p className="mt-2 text-3xl font-black">
              Bs {order?.cashToCollect ?? 0}
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}
