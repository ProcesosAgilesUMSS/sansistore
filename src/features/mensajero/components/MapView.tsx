import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer } from 'react-leaflet';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Package,
  Phone,
  Wallet,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
  ALLOWED_ZONES,
  getAllowedZonesBounds,
  getCurrentZone,
  isLocationValid,
} from '../../location/utils/zoneLimits';
import LocationMarker from './LocationMarker';

type Position = [number, number];

type MapOrderItem = {
  id?: string;
  name: string;
  quantity: number;
  price?: number;
};

type MapOrder = {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  reference?: string;
  deliveryZone: string;
  deliveryLat: number | null;
  deliveryLng: number | null;
  cashToCollect: number;
  items: MapOrderItem[];
};

const UMSS_CENTER: Position = [-17.3939, -66.1462];
const UMSS_BOUNDS = getAllowedZonesBounds();

const deliveryIcon = L.icon({
  iconUrl: '/usuario.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

function readOrderFromStorage(): MapOrder | null {
  try {
    const raw = localStorage.getItem('courier_map_order');
    if (!raw) return null;
    return JSON.parse(raw) as MapOrder;
  } catch {
    return null;
  }
}

function formatBolivianos(amount: number) {
  return `Bs ${amount}`;
}

export default function MapView() {
  const [open, setOpen] = useState(true);
  const [order, setOrder] = useState<MapOrder | null>(null);

  useEffect(() => {
    setOrder(readOrderFromStorage());
  }, []);

  const deliveryPosition = useMemo<Position | null>(() => {
    if (order?.deliveryLat == null || order.deliveryLng == null) return null;
    return [order.deliveryLat, order.deliveryLng];
  }, [order]);

  const isInsideCampus =
    deliveryPosition != null &&
    isLocationValid(deliveryPosition[0], deliveryPosition[1]);
  const currentZone = deliveryPosition
    ? getCurrentZone(deliveryPosition[0], deliveryPosition[1])
    : null;
  const center = deliveryPosition && isInsideCampus ? deliveryPosition : UMSS_CENTER;

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-bg-light text-text-light">
      <MapContainer
        center={center}
        maxBounds={UMSS_BOUNDS}
        maxBoundsViscosity={1}
        minZoom={16}
        style={{ height: '100%', width: '100%' }}
        zoom={17}
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

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

        <LocationMarker />

        {deliveryPosition && isInsideCampus && order && (
          <Marker icon={deliveryIcon} position={deliveryPosition}>
            <Popup>
              <strong>{order.customerName}</strong>
              <br />
              {order.address}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <button
        className="absolute left-4 top-4 z-[1000] inline-flex items-center gap-2 rounded-2xl border border-border-light bg-card-bg-light px-4 py-2.5 text-sm font-bold text-text-light shadow-[0_4px_16px_rgba(38,33,22,0.14)] transition hover:border-primary hover:text-primary"
        onClick={() => {
          window.location.href = '/courier';
        }}
        type="button"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <button
        className="absolute top-1/2 z-[1000] flex h-10 w-10 items-center justify-center rounded-2xl border border-border-light bg-card-bg-light shadow-[0_4px_16px_rgba(38,33,22,0.14)] transition hover:border-primary hover:text-primary"
        onClick={() => setOpen((value) => !value)}
        style={{ right: open ? '358px' : '16px' }}
        type="button"
      >
        {open ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      <aside
        className={`absolute bottom-4 right-4 top-4 z-[999] flex w-80 flex-col rounded-[28px] border border-border-light bg-card-bg-light shadow-[0_14px_30px_rgba(38,33,22,0.14)] transition-all duration-300 ${
          open
            ? 'translate-x-0 opacity-100'
            : 'pointer-events-none translate-x-[110%] opacity-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Ubicacion de entrega
          </p>

          {!order ? (
            <p className="mt-4 rounded-2xl border border-border-light bg-secondary-bg-light p-4 text-sm font-semibold">
              Abre el mapa desde un pedido para ver su ubicacion.
            </p>
          ) : (
            <>
              <div className="mb-5 mt-1 flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-normal text-text-light">
                    {order.customerName}
                  </h1>
                  <p className="mt-1 text-xs font-bold text-text-light/55">
                    #{order.id}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                  {formatBolivianos(order.cashToCollect)}
                </span>
              </div>

              {!deliveryPosition && (
                <p className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm font-semibold text-amber-700">
                  Este pedido no tiene coordenadas registradas.
                </p>
              )}

              {deliveryPosition && !isInsideCampus && (
                <p className="mb-4 rounded-2xl border border-red-400/40 bg-red-400/10 p-4 text-sm font-semibold text-red-500">
                  La ubicacion del pedido esta fuera de las zonas UMSS
                  permitidas.
                </p>
              )}

              {currentZone && (
                <p className="mb-4 rounded-2xl border border-primary/30 bg-primary/10 p-3 text-xs font-bold text-primary">
                  {currentZone}
                </p>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-light opacity-50" />
                  <div>
                    <p className="text-sm font-semibold text-text-light">
                      {order.address}
                    </p>
                    {order.reference && (
                      <p className="mt-0.5 text-xs font-medium text-text-light opacity-55">
                        {order.reference}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 shrink-0 text-text-light opacity-50" />
                  <p className="text-sm font-semibold text-text-light">
                    {order.phone}
                  </p>
                </div>

                <div className="flex items-start gap-3">
                  <Package className="mt-0.5 h-4 w-4 shrink-0 text-text-light opacity-50" />
                  <div className="space-y-1">
                    {order.items.length > 0 ? (
                      order.items.map((item) => (
                        <p
                          className="text-sm font-semibold text-text-light"
                          key={item.id || item.name}
                        >
                          {item.name}{' '}
                          <span className="opacity-55">x{item.quantity}</span>
                        </p>
                      ))
                    ) : (
                      <p className="text-sm font-semibold text-text-light">
                        Sin productos visibles.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Wallet className="h-4 w-4 shrink-0 text-text-light opacity-50" />
                  <p className="text-sm font-semibold text-text-light">
                    Cobro contra entrega -{' '}
                    <span className="font-black text-primary">
                      {formatBolivianos(order.cashToCollect)}
                    </span>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
