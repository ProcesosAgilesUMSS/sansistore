// src/features/admin/pedidos/components/OrderHistory.tsx

import { useState } from 'react';
import { Search, Loader2, AlertCircle, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useOrderHistory } from '../hooks/useAdminOrderHistory';
import type { OrderHistory as OrderHistoryType, TimelineEvent } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

function formatMoney(n: number): string {
  return `Bs. ${n.toFixed(0)}`;
}

function statusLabel(s: string): { text: string; color: string } {
  const map: Record<string, { text: string; color: string }> = {
    pending:    { text: 'Pendiente',   color: 'text-yellow-600 bg-yellow-50' },
    reserved:   { text: 'Reservado',   color: 'text-blue-600 bg-blue-50' },
    confirmed:  { text: 'Confirmado',  color: 'text-blue-600 bg-blue-50' },
    in_transit: { text: 'En camino',   color: 'text-orange-600 bg-orange-50' },
    delivered:  { text: 'Entregado',   color: 'text-[#88b04b] bg-[#88b04b]/10' },
    cancelled:  { text: 'Cancelado',   color: 'text-red-500 bg-red-50' },
    verified:   { text: 'Verificado',  color: 'text-[#88b04b] bg-[#88b04b]/10' },
    completed:  { text: 'Completado',  color: 'text-[#88b04b] bg-[#88b04b]/10' },
    paid:       { text: 'Pagado',      color: 'text-[#88b04b] bg-[#88b04b]/10' },
    unpaid:     { text: 'Sin pagar',   color: 'text-yellow-600 bg-yellow-50' },
    assigned:   { text: 'Asignada',    color: 'text-blue-600 bg-blue-50' },
    failed:     { text: 'Fallida',     color: 'text-red-500 bg-red-50' },
  };
  return map[s] ?? { text: s, color: 'text-gray-500 bg-gray-100' };
}

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
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%] truncate">{value}</span>
    </div>
  );
}

// ── Timeline dot por tipo ─────────────────────────────────────────────────────

function TimelineDot({ type }: { type?: TimelineEvent['type'] }) {
  const configs = {
    success: {
      bg: 'bg-[#88b04b]/15 border-[#88b04b]/40',
      icon: <CheckCircle2 size={10} className="text-[#88b04b]" />,
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <XCircle size={10} className="text-red-400" />,
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: <AlertTriangle size={10} className="text-yellow-500" />,
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Info size={10} className="text-blue-400" />,
    },
  };
  const cfg = configs[type ?? 'info'];
  return (
    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 ${cfg.bg}`}>
      {cfg.icon}
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function OrderHistory() {
  const { data, loading, error, search } = useOrderHistory();
  const [inputValue, setInputValue] = useState('');

  function handleSearch() {
    search(inputValue);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleSearch();
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
          disabled={loading || !inputValue.trim()}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#88b04b] text-white text-sm
            font-semibold rounded-xl hover:bg-[#7aa043] disabled:opacity-50
            disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? <Loader2 size={15} className="animate-spin" />
            : <Search size={15} />}
          Buscar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-100
          rounded-xl text-sm text-red-600">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Resultados */}
      {data && <HistoryResult data={data} />}

      {/* Estado vacío */}
      {!data && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-300 select-none">
          <Search size={40} strokeWidth={1.2} />
          <p className="mt-3 text-sm">Ingresa un ID de pedido para consultar su historial</p>
        </div>
      )}
    </div>
  );
}

// ── Vista con datos ───────────────────────────────────────────────────────────

function HistoryResult({ data }: { data: OrderHistoryType }) {
  return (
    <div className="space-y-4">

      {/* Fila 1: Datos generales + Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <Card title={`Datos generales — #${data.orderId}`}>
          {/* Usa customerName si existe, si no buyerName */}
          <Row label="Cliente"   value={data.customerName ?? data.buyerName} />
          {data.customerPhone && <Row label="Teléfono"  value={data.customerPhone} />}
          {data.address        && <Row label="Dirección" value={data.address} />}
          <Row label="Vendedor"  value={data.sellerName} />
          <Row
            label="Total"
            value={<span className="text-[#88b04b] font-bold">{formatMoney(data.total)}</span>}
          />
          <Row
            label="Estado pedido"
            value={<Badge {...statusLabel(data.status)} />}
          />
          {data.paymentStatus && (
            <Row
              label="Estado pago"
              value={<Badge {...statusLabel(data.paymentStatus)} />}
            />
          )}
          {data.deliveryStatus && (
            <Row
              label="Estado entrega"
              value={<Badge {...statusLabel(data.deliveryStatus)} />}
            />
          )}
          <Row label="Fecha" value={fmt(data.createdAt)} />
          {data.incidentReason && (
            <Row
              label="Incidente"
              value={<span className="text-red-500 text-xs">{data.incidentReason}</span>}
            />
          )}
        </Card>

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
                      x{item.quantity} · Bs. {item.unitPrice} c/u
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

        <Card title="Pago">
          {data.payment ? (
            <>
              <Row label="Método"         value={data.payment.method} />
              <Row
                label="Monto"
                value={
                  <span className="text-[#88b04b] font-bold">
                    {formatMoney(data.payment.amount)}
                  </span>
                }
              />
              <Row label="Estado"         value={<Badge {...statusLabel(data.payment.status)} />} />
              {data.payment.registeredAt && (
                <Row label="Registrado"   value={fmt(data.payment.registeredAt)} />
              )}
              {data.payment.verifiedAt && (
                <Row label="Verificado"   value={fmt(data.payment.verifiedAt)} />
              )}
              {data.payment.verifiedBy && (
                <Row label="Verificado por" value={data.payment.verifiedBy} />
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 py-2">Sin información de pago</p>
          )}
        </Card>

        <Card title="Entrega">
          {data.delivery ? (
            <>
              <Row label="Mensajero"      value={data.delivery.courierName ?? data.delivery.courierId} />
              <Row
                label="Estado"
                value={<Badge {...statusLabel(data.delivery.status)} />}
              />
              {data.delivery.deliveryCode && (
                <Row label="Código"       value={
                  <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {data.delivery.deliveryCode}
                  </span>
                } />
              )}
              {data.delivery.assignedAt  && <Row label="Asignado"   value={fmtTime(data.delivery.assignedAt)} />}
              {data.delivery.pickedUpAt  && <Row label="Recogido"    value={fmtTime(data.delivery.pickedUpAt)} />}
              {data.delivery.inTransitAt && <Row label="En tránsito" value={fmtTime(data.delivery.inTransitAt)} />}
              {data.delivery.deliveredAt && <Row label="Entregado"   value={fmtTime(data.delivery.deliveredAt)} />}
              {data.delivery.attemptNumber != null && (
                <Row label="Intentos"    value={data.delivery.attemptNumber} />
              )}
              {data.delivery.incidentReason && (
                <Row label="Incidente"   value={
                  <span className="text-red-500 text-xs">{data.delivery.incidentReason}</span>
                } />
              )}
              {data.delivery.customerConfirmed && (
                <Row label="Confirmado cliente" value={
                  <Badge text="Sí" color="text-[#88b04b] bg-[#88b04b]/10" />
                } />
              )}
            </>
          ) : (
            <p className="text-sm text-gray-400 py-2">Sin información de entrega</p>
          )}
        </Card>
      </div>

      {/* Línea de tiempo */}
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
                    <p className="text-xs text-gray-400 mt-0.5">{event.detail}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">{fmtTime(event.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

    </div>
  );
}