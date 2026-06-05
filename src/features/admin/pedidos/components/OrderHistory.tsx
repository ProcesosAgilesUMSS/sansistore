// src/features/admin/pedidos/components/OrderHistory.tsx

import { useState } from 'react';
import {
  Search, Loader2, AlertCircle, CheckCircle2,
  XCircle, AlertTriangle, Info, ChevronDown,
} from 'lucide-react';
import { useOrderHistory } from '../hooks/useAdminOrderHistory';
import { useOrdersList } from '../hooks/useOrdersList';
import type { OrderHistory as OrderHistoryType, OrderSummary, TimelineEvent } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

// Fecha + hora completa para la línea de tiempo
function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit', month: 'short', year: 'numeric',
  }) + ' · ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

// Fecha completa para campos como "Asignado"
function fmtFull(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

// Siempre 2 decimales: Bs. 19.40
function formatMoney(n: number): string {
  return `Bs. ${n.toFixed(2)}`;
}

// Traduce métodos de pago internos a texto legible
function paymentMethodLabel(method: string): string {
  const map: Record<string, string> = {
    cash_on_delivery: 'Contra entrega',
    cash:             'Efectivo',
    transfer:         'Transferencia',
    qr:               'QR',
    card:             'Tarjeta',
  };
  return map[method] ?? method;
}

// Divide el orderId en uuid + friendlyId
function parseOrderId(orderId: string): { uuid: string; friendly: string } {
  const idx = orderId.indexOf('_');
  if (idx === -1) return { uuid: orderId, friendly: '' };
  return { uuid: orderId.slice(0, idx), friendly: orderId.slice(idx + 1) };
}

function statusLabel(s: string): { text: string; color: string } {
  const map: Record<string, { text: string; color: string }> = {
    CREADO:      { text: 'Creado',       color: 'text-blue-600 bg-blue-50' },
    RESERVADO:   { text: 'Reservado',    color: 'text-blue-600 bg-blue-50' },
    CONFIRMADO:  { text: 'Confirmado',   color: 'text-blue-600 bg-blue-50' },
    ACEPTADO:    { text: 'Aceptado',     color: 'text-blue-600 bg-blue-50' },
    EN_CAMINO:   { text: 'En camino',    color: 'text-orange-600 bg-orange-50' },
    ENTREGADO:   { text: 'Entregado',    color: 'text-[#88b04b] bg-[#88b04b]/10' },
    CANCELADO:   { text: 'Cancelado',    color: 'text-red-500 bg-red-50' },
    VERIFICADO:  { text: 'Verificado',   color: 'text-[#88b04b] bg-[#88b04b]/10' },
    COMPLETADO:  { text: 'Completado',   color: 'text-[#88b04b] bg-[#88b04b]/10' },
    PENDIENTE:   { text: 'Pendiente',    color: 'text-yellow-600 bg-yellow-50' },
    PAGADO:      { text: 'Pagado',       color: 'text-[#88b04b] bg-[#88b04b]/10' },
    pending:     { text: 'Pendiente',    color: 'text-yellow-600 bg-yellow-50' },
    delivered:   { text: 'Entregado',    color: 'text-[#88b04b] bg-[#88b04b]/10' },
    cancelled:   { text: 'Cancelado',    color: 'text-red-500 bg-red-50' },
    assigned:    { text: 'Asignada',     color: 'text-blue-600 bg-blue-50' },
    accepted:    { text: 'Aceptada',     color: 'text-blue-600 bg-blue-50' },
    in_transit:  { text: 'En camino',    color: 'text-orange-600 bg-orange-50' },
    failed:      { text: 'Fallida',      color: 'text-red-500 bg-red-50' },
    verified:    { text: 'Verificado',   color: 'text-[#88b04b] bg-[#88b04b]/10' },
  };
  return map[s] ?? { text: s, color: 'text-gray-500 bg-gray-100' };
}

const STATUS_FILTERS = [
  { label: 'Todos',      value: null },
  { label: 'Creados',    value: 'CREADO' },
  { label: 'Reservados', value: 'RESERVADO' },
  { label: 'En camino',  value: 'EN_CAMINO' },
  { label: 'Entregados', value: 'ENTREGADO' },
  { label: 'Cancelados', value: 'CANCELADO' },
];

// ── Subcomponentes ────────────────────────────────────────────────────────────

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${color}`}>
      {text}
    </span>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[rgba(136,176,75,0.15)] rounded-xl p-5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-4">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ── Timeline dot por tipo ─────────────────────────────────────────────────────

function TimelineDot({ type }: { type?: TimelineEvent['type'] }) {
  const configs = {
    success: { bg: 'bg-[#88b04b]/15 border-[#88b04b]/40', icon: <CheckCircle2 size={10} className="text-[#88b04b]" /> },
    error:   { bg: 'bg-red-50 border-red-200',             icon: <XCircle size={10} className="text-red-400" /> },
    warning: { bg: 'bg-yellow-50 border-yellow-200',       icon: <AlertTriangle size={10} className="text-yellow-500" /> },
    info:    { bg: 'bg-blue-50 border-blue-200',           icon: <Info size={10} className="text-blue-400" /> },
  };
  const cfg = configs[type ?? 'info'];
  return (
    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${cfg.bg}`}>
      {cfg.icon}
    </div>
  );
}

// ── Lista de pedidos ──────────────────────────────────────────────────────────

function OrdersList({
  onSelect,
  selectedId,
}: {
  onSelect: (orderId: string) => void;
  selectedId: string | null;
}) {
  const { orders, loading, loadingMore, error, hasMore, loadMore, filterByStatus, activeStatus } =
    useOrdersList();

  return (
    <div className="bg-white border border-[rgba(136,176,75,0.15)] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-3">
          Pedidos recientes
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => filterByStatus(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeStatus === f.value
                  ? 'bg-[#88b04b] text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-[#88b04b]" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-red-500">
          <AlertCircle size={15} /> {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-300">No hay pedidos</div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_110px_90px_100px_90px] gap-3 px-5 py-2.5
            bg-gray-50 border-b border-gray-100 text-[10px] font-semibold uppercase
            tracking-wider text-gray-400">
            <span>Cliente</span>
            <span>ID amigable</span>
            <span className="text-right">Total</span>
            <span>Estado</span>
            <span>Fecha</span>
          </div>

          {orders.map((order) => {
            const isSelected = order.orderId === selectedId;
            const st = statusLabel(order.status);
            const { friendly } = parseOrderId(order.orderId);
            return (
              <button
                key={order.orderId}
                onClick={() => onSelect(order.orderId)}
                className={`w-full grid grid-cols-[1fr_110px_90px_100px_90px] gap-3 px-5 py-3
                  border-b border-gray-50 last:border-0 text-left transition-colors
                  ${isSelected
                    ? 'bg-[#88b04b]/8 border-l-2 border-l-[#88b04b]'
                    : 'hover:bg-gray-50'
                  }`}
              >
                <span className="text-sm text-gray-800 font-medium truncate">
                  {order.customerName}
                </span>
                <span className="text-xs text-gray-500 font-mono truncate">
                  {friendly || order.orderId.slice(0, 8) + '…'}
                </span>
                <span className="text-sm font-semibold text-gray-700 text-right">
                  {formatMoney(order.total)}
                </span>
                <span><Badge text={st.text} color={st.color} /></span>
                <span className="text-xs text-gray-400">{fmtDate(order.createdAt)}</span>
              </button>
            );
          })}

          {hasMore && (
            <div className="px-5 py-3 border-t border-gray-50">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 text-sm text-[#88b04b] font-medium
                  hover:text-[#7aa043] disabled:opacity-50 transition-colors"
              >
                {loadingMore ? <Loader2 size={14} className="animate-spin" /> : <ChevronDown size={14} />}
                Cargar más
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function OrderHistory() {
  const { data, loading: loadingDetail, error, search } = useOrderHistory();
  const [inputValue, setInputValue] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSearch() {
    if (!inputValue.trim()) return;
    setSelectedId(inputValue.trim());
    search(inputValue.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
  }

  function handleSelectOrder(orderId: string) {
    setSelectedId(orderId);
    setInputValue(orderId);
    search(orderId);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Buscador */}
      <div className="flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por ID de pedido..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-[rgba(136,176,75,0.25)]
            bg-white text-sm text-gray-800 placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-[#88b04b]/30 focus:border-[#88b04b]
            transition-all"
        />
        <button
          onClick={handleSearch}
          disabled={loadingDetail || !inputValue.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#88b04b] text-white text-sm
            font-semibold rounded-xl hover:bg-[#7aa043] disabled:opacity-50
            disabled:cursor-not-allowed transition-colors"
        >
          {loadingDetail ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Buscar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100
          rounded-xl text-sm text-red-600">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      {loadingDetail && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-[#88b04b]" />
        </div>
      )}

      {data && !loadingDetail && <HistoryResult data={data} />}

      <OrdersList onSelect={handleSelectOrder} selectedId={selectedId} />
    </div>
  );
}

// ── Vista detalle ─────────────────────────────────────────────────────────────

function HistoryResult({ data }: { data: OrderHistoryType }) {
  const { uuid, friendly } = parseOrderId(data.orderId);

  return (
    <div className="space-y-4">

      {/* Fila 1: Datos generales + Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Datos generales — sin paymentStatus ni deliveryStatus */}
        <Card title="Datos generales">
          {/* ID dividido en uuid + friendly */}
          <div className="py-1.5 border-b border-gray-50">
            <p className="text-xs text-gray-400 mb-1">ID de pedido</p>
            <p className="text-xs font-mono text-gray-400 break-all leading-relaxed">{uuid}</p>
            {friendly && (
              <p className="text-sm font-semibold text-gray-700 mt-0.5">{friendly}</p>
            )}
          </div>
          <Row label="Cliente"   value={data.customerName ?? data.buyerName} />
          {data.customerPhone && <Row label="Teléfono"   value={data.customerPhone} />}
          {data.address        && <Row label="Dirección"  value={data.address} />}
          <Row label="Vendedor"  value={data.sellerName} />
          <Row label="Total"     value={<span className="text-[#88b04b] font-bold">{formatMoney(data.total)}</span>} />
          <Row label="Estado"    value={<Badge {...statusLabel(data.status)} />} />
          <Row label="Fecha"     value={fmt(data.createdAt)} />
          {data.incidentReason && (
            <Row label="Incidente" value={<span className="text-red-500 text-xs">{data.incidentReason}</span>} />
          )}
        </Card>

        {/* Productos con decimales */}
        <Card title="Productos">
          <div className="space-y-3">
            {data.items.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#88b04b]/10 flex items-center
                    justify-center text-[#88b04b] text-xs font-bold flex-shrink-0">
                    {item.productName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.productName}</p>
                    <p className="text-xs text-gray-400">
                      x{item.quantity} · Bs. {item.unitPrice.toFixed(2)} c/u
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {formatMoney(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-sm font-bold text-[#88b04b]">{formatMoney(data.total)}</span>
          </div>
        </Card>
      </div>

      {/* Fila 2: Pago + Entrega */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Pago — con estado propio y método traducido */}
        <Card title="Pago">
          {data.payment ? (
            <>
              <Row label="Método"  value={paymentMethodLabel(data.payment.method)} />
              <Row label="Monto"   value={<span className="text-[#88b04b] font-bold">{formatMoney(data.payment.amount)}</span>} />
              <Row label="Estado"  value={<Badge {...statusLabel(data.payment.status)} />} />
              {data.payment.registeredAt && <Row label="Registrado"     value={fmtFull(data.payment.registeredAt)} />}
              {data.payment.verifiedAt   && <Row label="Verificado"     value={fmtFull(data.payment.verifiedAt)} />}
              {data.payment.verifiedBy   && <Row label="Verificado por" value={data.payment.verifiedBy} />}
            </>
          ) : (
            <p className="text-sm text-gray-400 py-2">Sin información de pago</p>
          )}
        </Card>

        {/* Entrega — "Asignado" con fecha completa, estado propio */}
        <Card title="Entrega">
          {data.delivery ? (
            <>
              <Row label="Mensajero"    value={data.delivery.courierName ?? data.delivery.courierId} />
              <Row label="Estado"       value={<Badge {...statusLabel(data.delivery.status)} />} />
              {data.delivery.deliveryCode && (
                <Row label="Código" value={
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {data.delivery.deliveryCode}
                  </span>
                } />
              )}
              {/* Fecha completa, no solo hora */}
              {data.delivery.assignedAt  && <Row label="Asignado"    value={fmtFull(data.delivery.assignedAt)} />}
              {data.delivery.pickedUpAt  && <Row label="Recogido"     value={fmtFull(data.delivery.pickedUpAt)} />}
              {data.delivery.inTransitAt && <Row label="En tránsito"  value={fmtFull(data.delivery.inTransitAt)} />}
              {data.delivery.deliveredAt && <Row label="Entregado"    value={fmtFull(data.delivery.deliveredAt)} />}
              {data.delivery.attemptNumber != null && <Row label="Intentos" value={data.delivery.attemptNumber} />}
              {data.delivery.incidentReason && (
                <Row label="Incidente" value={<span className="text-red-500 text-xs">{data.delivery.incidentReason}</span>} />
              )}
              {data.delivery.customerConfirmed && (
                <Row label="Confirmado cliente" value={<Badge text="Sí" color="text-[#88b04b] bg-[#88b04b]/10" />} />
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 py-2">Sin información de entrega</p>
          )}
        </Card>
      </div>

      {/* Línea de tiempo — fecha + hora completa */}
      <Card title="Línea de tiempo">
        {data.timeline.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">Sin eventos registrados</p>
        ) : (
          <div className="space-y-0">
            {data.timeline.map((event, i) => (
              <div key={i} className="flex gap-4 relative">
                {i < data.timeline.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-[1.5px] bg-gray-100" />
                )}
                <TimelineDot type={event.type} />
                <div className="pb-5">
                  <p className="text-sm font-semibold text-gray-800">{event.label}</p>
                  {event.detail && (
                    <p className="text-xs text-gray-500 mt-0.5">{event.detail}</p>
                  )}
                  {/* Fecha + hora completa */}
                  <p className="text-xs text-gray-500 mt-0.5">{fmtDateTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}