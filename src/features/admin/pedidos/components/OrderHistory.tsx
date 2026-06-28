// src/features/admin/pedidos/components/OrderHistory.tsx

import { useState } from 'react';
import {
  Search, Loader2, AlertCircle, CheckCircle2,
  XCircle, AlertTriangle, Info, ChevronDown,
} from 'lucide-react';
import { useOrderHistory } from '@features/admin/pedidos/hooks/useAdminOrderHistory';
import { useOrdersList } from '@features/admin/pedidos/hooks/useOrdersList';
import type { OrderHistory as OrderHistoryType, TimelineEvent } from '@features/admin/pedidos/types';
import { paymentMethodLabel } from '@/features/admin/pedidos/utils';
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

// Divide el orderId en uuid + friendlyId
function parseOrderId(orderId: string): { uuid: string; friendly: string } {
  const idx = orderId.indexOf('_');
  if (idx === -1) return { uuid: orderId, friendly: '' };
  return { uuid: orderId.slice(0, idx), friendly: orderId.slice(idx + 1) };
}

function statusLabel(s: string): { text: string; color: string } {
  const map: Record<string, { text: string; color: string }> = {
    CREADO:      { text: 'Creado',       color: 'text-(--theme-info) bg-(--theme-info-bg)' },
    RESERVADO:   { text: 'Reservado',    color: 'text-(--theme-info) bg-(--theme-info-bg)' },
    CONFIRMADO:  { text: 'Confirmado',   color: 'text-(--theme-info) bg-(--theme-info-bg)' },
    ACEPTADO:    { text: 'Aceptado',     color: 'text-(--theme-info) bg-(--theme-info-bg)' },
    EN_CAMINO:   { text: 'En camino',    color: 'text-(--theme-warning) bg-(--theme-warning-bg)' },
    ENTREGADO:   { text: 'Entregado',    color: 'text-primary bg-primary/10' },
    CANCELADO:   { text: 'Cancelado',    color: 'text-(--theme-error) bg-(--theme-error-bg)' },
    VERIFICADO:  { text: 'Verificado',   color: 'text-primary bg-primary/10' },
    COMPLETADO:  { text: 'Completado',   color: 'text-primary bg-primary/10' },
    PENDIENTE:   { text: 'Pendiente',    color: 'text-(--theme-warning) bg-(--theme-warning-bg)' },
    PAGADO:      { text: 'Pagado',       color: 'text-primary bg-primary/10' },
    pending:     { text: 'Pendiente',    color: 'text-(--theme-warning) bg-(--theme-warning-bg)' },
    delivered:   { text: 'Entregado',    color: 'text-primary bg-primary/10' },
    cancelled:   { text: 'Cancelado',    color: 'text-(--theme-error) bg-(--theme-error-bg)' },
    assigned:    { text: 'Asignada',     color: 'text-(--theme-info) bg-(--theme-info-bg)' },
    accepted:    { text: 'Aceptada',     color: 'text-(--theme-info) bg-(--theme-info-bg)' },
    in_transit:  { text: 'En camino',    color: 'text-(--theme-warning) bg-(--theme-warning-bg)' },
    failed:      { text: 'Fallida',      color: 'text-(--theme-error) bg-(--theme-error-bg)' },
    verified:    { text: 'Verificado',   color: 'text-primary bg-primary/10' },
  };
  return map[s] ?? { text: s, color: 'text-(--theme-text)/50 bg-(--theme-secondary-bg)' };
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
    <div className="bg-(--theme-card-bg) border border-primary/15 rounded-xl p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-(--theme-text)/40 mb-4">
        {title}
      </p>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-(--theme-border) last:border-0">
      <span className="text-sm text-(--theme-text)/50">{label}</span>
      <span className="text-sm font-medium text-(--theme-text) text-right max-w-[60%]">{value}</span>
    </div>
  );
}

// ── Timeline dot por tipo ─────────────────────────────────────────────────────

function TimelineDot({ type }: { type?: TimelineEvent['type'] }) {
  const configs = {
    success: { bg: 'bg-primary/15 border-primary/40', icon: <CheckCircle2 size={10} className="text-primary" /> },
    error:   { bg: 'bg-(--theme-error-bg) border-(--theme-error-border)',             icon: <XCircle size={10} className="text-(--theme-error)" /> },
    warning: { bg: 'bg-(--theme-warning-bg) border-(--theme-warning-border)',       icon: <AlertTriangle size={10} className="text-(--theme-warning)" /> },
    info:    { bg: 'bg-(--theme-info-bg) border-(--theme-info-border)',           icon: <Info size={10} className="text-(--theme-info)" /> },
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
    <div className="bg-(--theme-card-bg) border border-primary/15 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-(--theme-border)">
        <p className="text-xs font-semibold uppercase tracking-widest text-(--theme-text)/40 mb-3">
          Pedidos recientes
        </p>
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={String(f.value)}
              onClick={() => filterByStatus(f.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeStatus === f.value
                  ? 'bg-primary text-white'
                  : 'bg-(--theme-secondary-bg) text-(--theme-text)/50 hover:bg-(--theme-border)'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 px-5 py-4 text-sm text-(--theme-error)">
          <AlertCircle size={15} /> {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-(--theme-text)/30">No hay pedidos</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="grid grid-cols-5 gap-3 px-5 py-2.5
                bg-(--theme-secondary-bg) border-b border-(--theme-border) text-xs font-semibold uppercase
                tracking-wider text-(--theme-text)/40">
                <span>Cliente</span>
                <span>ID amigable</span>
                <span>Total</span>
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
                    className={`w-full grid grid-cols-5 gap-3 px-5 py-3
                      border-b border-(--theme-border) last:border-0 text-left transition-colors
                      ${isSelected
                        ? 'bg-primary/10 border-l-2 border-l-primary'
                        : 'hover:bg-(--theme-secondary-bg)'
                      }`}
                  >
                    <span className="text-sm text-(--theme-text) font-medium truncate">
                      {order.customerName}
                    </span>
                    <span className="text-xs text-(--theme-text)/50 font-mono truncate">
                      {friendly || order.orderId.slice(0, 8) + '…'}
                    </span>
<span className="text-sm font-semibold text-(--theme-text)/70">
                  {formatMoney(order.total)}
                    </span>
                    <span><Badge text={st.text} color={st.color} /></span>
                    <span className="text-xs text-(--theme-text)/40">{fmtDate(order.createdAt)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {hasMore && (
            <div className="px-5 py-3 border-t border-(--theme-border)">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 text-sm text-primary font-medium
                  hover:text-primary disabled:opacity-50 transition-colors"
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
    <div className="space-y-6">

      {/* Buscador */}
      <div className="flex gap-3">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Buscar por ID de pedido..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-primary/25
            bg-(--theme-card-bg) text-sm text-(--theme-text) placeholder:text-(--theme-text)/30
            focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
            transition-all"
        />
        <button
          onClick={handleSearch}
          disabled={loadingDetail || !inputValue.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm
            font-semibold rounded-xl hover:bg-primary/90 disabled:opacity-50
            disabled:cursor-not-allowed transition-colors"
        >
          {loadingDetail ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
          Buscar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-(--theme-error-bg) border border-(--theme-error-border)
          rounded-xl text-sm text-(--theme-error)">
          <AlertCircle size={16} className="flex-shrink-0" /> {error}
        </div>
      )}

      {loadingDetail && (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={22} className="animate-spin text-primary" />
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
          <div className="py-1.5 border-b border-(--theme-border)">
            <p className="text-xs text-(--theme-text)/40 mb-1">ID de pedido</p>
            <p className="text-xs font-mono text-(--theme-text)/40 break-all leading-relaxed">{uuid}</p>
            {friendly && (
              <p className="text-sm font-semibold text-(--theme-text)/70 mt-0.5">{friendly}</p>
            )}
          </div>
          <Row label="Cliente"   value={data.customerName ?? data.buyerName} />
          {data.customerPhone && <Row label="Teléfono"   value={data.customerPhone} />}
          {data.address        && <Row label="Dirección"  value={data.address} />}
          <Row label="Vendedor"  value={data.sellerName} />
          <Row label="Total"     value={<span className="text-primary font-bold">{formatMoney(data.total)}</span>} />
          <Row label="Estado"    value={<Badge {...statusLabel(data.status)} />} />
          <Row label="Fecha"     value={fmt(data.createdAt)} />
          {data.incidentReason && (
            <Row label="Incidente" value={<span className="text-(--theme-error) text-xs">{data.incidentReason}</span>} />
          )}
        </Card>

        {/* Productos con decimales */}
        <Card title="Productos">
          <div className="space-y-3">
            {data.items.map((item) => (
              <div key={item.itemId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center
                    justify-center text-primary text-xs font-bold flex-shrink-0">
                    {item.productName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-(--theme-text)">{item.productName}</p>
                    <p className="text-xs text-(--theme-text)/40">
                      x{item.quantity} · Bs. {item.unitPrice.toFixed(2)} c/u
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-(--theme-text)/70">
                  {formatMoney(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-(--theme-border) flex justify-between">
            <span className="text-sm text-(--theme-text)/50">Total</span>
            <span className="text-sm font-bold text-primary">{formatMoney(data.total)}</span>
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
              <Row label="Monto"   value={<span className="text-primary font-bold">{formatMoney(data.payment.amount)}</span>} />
              <Row label="Estado"  value={<Badge {...statusLabel(data.payment.status)} />} />
              {data.payment.registeredAt && <Row label="Registrado"     value={fmtFull(data.payment.registeredAt)} />}
              {data.payment.verifiedAt   && <Row label="Verificado"     value={fmtFull(data.payment.verifiedAt)} />}
              {data.payment.verifiedBy   && <Row label="Verificado por" value={data.payment.verifiedBy} />}
            </>
          ) : (
            <p className="text-sm text-(--theme-text)/40 py-2">Sin información de pago</p>
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
                  <span className="font-mono text-xs bg-(--theme-secondary-bg) px-2 py-0.5 rounded">
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
                <Row label="Incidente" value={<span className="text-(--theme-error) text-xs">{data.delivery.incidentReason}</span>} />
              )}
              {data.delivery.customerConfirmed && (
                <Row label="Confirmado cliente" value={<Badge text="Sí" color="text-primary bg-primary/10" />} />
              )}
            </>
          ) : (
            <p className="text-sm text-(--theme-text)/40 py-2">Sin información de entrega</p>
          )}
        </Card>
      </div>

      {/* Línea de tiempo — fecha + hora completa */}
      <Card title="Línea de tiempo">
        {data.timeline.length === 0 ? (
          <p className="text-sm text-(--theme-text)/40 py-2">Sin eventos registrados</p>
        ) : (
          <div className="space-y-0">
            {data.timeline.map((event, i) => (
              <div key={i} className="flex gap-4 relative">
                {i < data.timeline.length - 1 && (
                  <div className="absolute left-[11px] top-6 bottom-0 w-[1.5px] bg-(--theme-secondary-bg)" />
                )}
                <TimelineDot type={event.type} />
                <div className="pb-5">
                  <p className="text-sm font-semibold text-(--theme-text)">{event.label}</p>
                  {event.detail && (
                    <p className="text-xs text-(--theme-text)/50 mt-0.5">{event.detail}</p>
                  )}
                  {/* Fecha + hora completa */}
                  <p className="text-xs text-(--theme-text)/50 mt-0.5">{fmtDateTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}