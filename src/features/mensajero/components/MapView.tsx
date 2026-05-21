import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { ArrowLeft, MapPin, Phone, Package, Wallet, ChevronRight, ChevronLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import LocationMarker from './LocationMarker';

const deliveryIcon = L.icon({
  iconUrl: '/usuario.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

type MapOrder = {
  buyerName: string;
  deliveryZone: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  total: number;
};

const mockOrder = {
  customerName: 'María López',
  phone: '70012345',
  address: 'Av. Ayacucho #456, entre Heroínas y Sucre',
  city: 'Cochabamba',
  reference: 'Edificio azul, 2do piso',
  cashToCollect: 180,
  paymentMethod: 'cash_on_delivery' as const,
  items: [
    { name: 'Shampoo Sedal 400ml', quantity: 2 },
    { name: 'Crema Nivea', quantity: 1 },
  ],
};
/*
const umssBounds: [[number, number], [number, number]] = [
  [-17.3965, -66.1500], // suroeste
  [-17.3900, -66.1400], // noreste
];
*/
type Position = [number, number];

function DeliveryMarker({ position, name, zone }: { position: Position; name: string; zone: string }) {
  return (
    <Marker position={position} icon={deliveryIcon}>
      <Popup>
        <strong>{name}</strong><br />{zone}
      </Popup>
    </Marker>
  );
}

async function geocodeAddress(address: string): Promise<Position | null> {
  const apiKey = import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
    );
    const data = await res.json();
    if (data.results?.length > 0) {
      const { lat, lng } = data.results[0].geometry.location;
      return [lat, lng];
    }
  } catch { /* ignore */ }
  return null;
}

function readOrderFromStorage(): MapOrder | null {
  try {
    const raw = localStorage.getItem('courier_map_order');
    if (!raw) return null;
    return JSON.parse(raw) as MapOrder;
  } catch {
    return null;
  }
}

export default function MapView() {
  const [open, setOpen] = useState(true);
  const [order, setOrder] = useState<MapOrder | null>(null);

  const [deliveryPosition, setDeliveryPosition] = useState<Position | null>(null);

  useEffect(() => {
    const stored = readOrderFromStorage();
    setOrder(stored);

    if (stored?.deliveryLat != null && stored?.deliveryLng != null) {
      setDeliveryPosition([stored.deliveryLat, stored.deliveryLng]);
    } else {
      const address = `${mockOrder.address}, ${mockOrder.city}, Bolivia`;
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
        //minZoom={16}
        //maxZoom={18}
        //maxBounds={umssBounds}
        maxBoundsViscosity={1.0}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker/>
        {deliveryPosition && (
          <DeliveryMarker
            position={deliveryPosition}
            name={order?.buyerName ?? ''}
            zone={order?.deliveryZone ?? ''}
          />
        )}
      </MapContainer>

      {/* Back button */}
      <button
        type="button"
        onClick={() => {
          window.location.href = "/courier";
        }}
        className="absolute left-4 top-4 z-1000 inline-flex items-center gap-2 rounded-2xl border border-border-light bg-card-bg-light px-4 py-2.5 text-sm font-bold text-text-light shadow-[0_4px_16px_rgba(38,33,22,0.14)] transition hover:border-primary hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="absolute top-1/2 z-1000 flex h-10 w-10 items-center justify-center rounded-2xl border border-border-light bg-card-bg-light shadow-[0_4px_16px_rgba(38,33,22,0.14)] transition hover:border-primary hover:text-primary"
        style={{ right: open ? '358px' : '16px' }}
      >
        {open ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      {/* Order panel */}
      <div className={`absolute bottom-4 right-4 top-4 z-999 flex w-80 flex-col rounded-[28px] border border-border-light bg-card-bg-light shadow-[0_14px_30px_rgba(38,33,22,0.14)] transition-all duration-300 ${open ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'}`}>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                Pedido en camino
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-text-light">
                {mockOrder.customerName}
              </h2>
            </div>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
              Bs {mockOrder.cashToCollect}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-light opacity-50" />
              <div>
                <p className="text-sm font-semibold text-text-light">{mockOrder.address}</p>
                {mockOrder.reference && (
                  <p className="mt-0.5 text-xs font-medium text-text-light opacity-55">{mockOrder.reference}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-text-light opacity-50" />
              <p className="text-sm font-semibold text-text-light">{mockOrder.phone}</p>
            </div>

            <div className="flex items-start gap-3">
              <Package className="mt-0.5 h-4 w-4 shrink-0 text-text-light opacity-50" />
              <div className="space-y-1">
                {mockOrder.items.map((item) => (
                  <p key={item.name} className="text-sm font-semibold text-text-light">
                    {item.name} <span className="opacity-55">x{item.quantity}</span>
                  </p>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Wallet className="h-4 w-4 shrink-0 text-text-light opacity-50" />
              <p className="text-sm font-semibold text-text-light">
                Cobro contra entrega —{' '}
                <span className="font-black text-primary">Bs {mockOrder.cashToCollect}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
