// PaymentAuditPanel.tsx — HU #145: Auditoría de cobros
// Área 7: Administración & Analítica

import { useCallback, useEffect, useRef, useState } from 'react';
import { getPaymentAuditLogs, getCollectorsFromLogs } from '../services/paymentAuditService';
import type { PaymentAuditLog, PaymentAuditFilter, PaymentMethod, PaymentStatus } from '../types_payment_audit';
import { PAYMENT_METHOD_LABELS } from '../types_payment_audit';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 MODO DEMO: cambiar a false para usar datos reales
const USE_MOCK_DATA = true;
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MOCK_COLLECTORS = [
  { id: 'seller-1', name: 'Pedro Quiroga', role: 'vendedor' },
  { id: 'seller-2', name: 'Ana Torrez', role: 'vendedor' },
  { id: 'courier-1', name: 'Luis Mamani', role: 'mensajero' },
];

const MOCK_LOGS: PaymentAuditLog[] = [
  {
    logId: '1', orderId: 'ORD-0892',
    collectedById: 'seller-1', collectedByName: 'Pedro Quiroga', collectedByEmail: 'pedro@est.umss.edu', collectedByRole: 'vendedor',
    amount: 145.00, paymentMethod: 'EFECTIVO', status: 'VERIFICADO',
    timestamp: new Date('2026-06-16T14:32:18'),
  },
  {
    logId: '2', orderId: 'ORD-0889',
    collectedById: 'courier-1', collectedByName: 'Luis Mamani', collectedByEmail: 'luis@est.umss.edu', collectedByRole: 'mensajero',
    amount: 78.50, paymentMethod: 'QR', status: 'VERIFICADO',
    timestamp: new Date('2026-06-16T13:15:42'),
  },
  {
    logId: '3', orderId: 'ORD-0885',
    collectedById: 'seller-2', collectedByName: 'Ana Torrez', collectedByEmail: 'ana@est.umss.edu', collectedByRole: 'vendedor',
    amount: 210.00, paymentMethod: 'TRANSFERENCIA', status: 'PENDIENTE',
    timestamp: new Date('2026-06-16T12:28:05'),
  },
  {
    logId: '4', orderId: 'ORD-0881',
    collectedById: 'seller-1', collectedByName: 'Pedro Quiroga', collectedByEmail: 'pedro@est.umss.edu', collectedByRole: 'vendedor',
    amount: 52.00, paymentMethod: 'EFECTIVO', status: 'VERIFICADO',
    timestamp: new Date('2026-06-15T16:45:12'),
  },
  {
    logId: '5', orderId: 'ORD-0878',
    collectedById: 'courier-1', collectedByName: 'Luis Mamani', collectedByEmail: 'luis@est.umss.edu', collectedByRole: 'mensajero',
    amount: 320.00, paymentMethod: 'TARJETA', status: 'VERIFICADO',
    timestamp: new Date('2026-06-15T15:30:55'),
  },
  {
    logId: '6', orderId: 'ORD-0875',
    collectedById: 'seller-2', collectedByName: 'Ana Torrez', collectedByEmail: 'ana@est.umss.edu', collectedByRole: 'vendedor',
    amount: 95.00, paymentMethod: 'QR', status: 'RECHAZADO',
    timestamp: new Date('2026-06-15T12:20:08'),
  },
  {
    logId: '7', orderId: 'ORD-0870',
    collectedById: 'seller-1', collectedByName: 'Pedro Quiroga', collectedByEmail: 'pedro@est.umss.edu', collectedByRole: 'vendedor',
    amount: 167.50, paymentMethod: 'EFECTIVO', status: 'VERIFICADO',
    timestamp: new Date('2026-06-14T11:48:22'),
  },
  {
    logId: '8', orderId: 'ORD-0865',
    collectedById: 'courier-1', collectedByName: 'Luis Mamani', collectedByEmail: 'luis@est.umss.edu', collectedByRole: 'mensajero',
    amount: 430.00, paymentMethod: 'TRANSFERENCIA', status: 'VERIFICADO',
    timestamp: new Date('2026-06-14T10:15:33'),
  },
];

// ── Helpers ──────────────────────────────────────────────────────

const formatDateTime = (date: Date): string =>
  date.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const formatCurrency = (amount: number): string =>
  `Bs. ${amount.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHOD_STYLES: Record<PaymentMethod, string> = {
  EFECTIVO: 'bg-[rgba(136,176,75,0.15)] text-[#5E7E2F]',
  QR: 'bg-[rgba(93,75,221,0.12)] text-[#534AB7]',
  TRANSFERENCIA: 'bg-blue-500/10 text-blue-600',
  TARJETA: 'bg-orange-500/10 text-orange-600',
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  VERIFICADO: 'bg-teal-500/10 text-teal-700',
  PENDIENTE: 'bg-amber-500/10 text-amber-700',
  RECHAZADO: 'bg-red-500/10 text-red-600',
};

const MethodBadge = ({ method }: { method: PaymentMethod }) => (
  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${METHOD_STYLES[method]}`}>
    {PAYMENT_METHOD_LABELS[method]?.toUpperCase() ?? method}
  </span>
);

const StatusBadge = ({ status }: { status: PaymentStatus }) => (
  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
    {status}
  </span>
);

export default function PaymentAuditPanel() {
  const [logs, setLogs] = useState<PaymentAuditLog[]>([]);
  const [collectors, setCollectors] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const toInputDate = (d: Date) => d.toISOString().split('T')[0];

  const [orderSearch, setOrderSearch] = useState('');
  const [startDate, setStartDate] = useState(toInputDate(firstDay));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [collectorFilter, setCollectorFilter] = useState('todos');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');

  const hasFetched = useRef(false);

  const fetchLogs = useCallback(async (filter?: PaymentAuditFilter) => {
    if (USE_MOCK_DATA) {
      setLoading(true);
      setTimeout(() => {
        let filtered = [...MOCK_LOGS];
        if (filter?.orderId && filter.orderId.trim()) {
          const search = filter.orderId.toLowerCase().trim();
          filtered = filtered.filter((l) => l.orderId.toLowerCase().includes(search));
        }
        if (filter?.collectedById && filter.collectedById !== 'todos') {
          filtered = filtered.filter((l) => l.collectedById === filter.collectedById);
        }
        if (filter?.paymentMethod && filter.paymentMethod !== 'ALL') {
          filtered = filtered.filter((l) => l.paymentMethod === filter.paymentMethod);
        }
        setCollectors(MOCK_COLLECTORS);
        setLogs(filtered);
        setLoading(false);
      }, 400);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [data, collectorList] = await Promise.all([
        getPaymentAuditLogs(filter),
        getCollectorsFromLogs(),
      ]);
      setLogs(data);
      setCollectors(collectorList);
    } catch {
      setError('Error al cargar el historial de cobros. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void fetchLogs();
  }, []);

  const handleFilter = () => {
    const parseLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    void fetchLogs({
      orderId: orderSearch,
      startDate: startDate ? parseLocalDate(startDate) : undefined,
      endDate: endDate ? parseLocalDate(endDate) : undefined,
      collectedById: collectorFilter,
      paymentMethod: methodFilter,
    });
  };

  return (
    <div className="max-w-5xl">

      {/* Título */}
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
          Historial de cobros
        </h2>
        <p className="text-[11px] text-[var(--theme-text)]/50 mt-0.5">
          Registro de pagos confirmados por vendedores y mensajeros
        </p>
      </div>

      {/* Demo banner */}
      {USE_MOCK_DATA && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium bg-amber-500/10 border border-amber-500/20 text-amber-700 mb-4">
          <span className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">!</span>
          Modo demo activo — Cambia <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] mx-1">USE_MOCK_DATA</code> a <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] mx-1">false</code> para usar Firestore.
        </div>
      )}

      {/* Filtros */}
      <p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
        Filtros
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Buscar pedido</label>
          <input
            type="text"
            placeholder="ID del pedido..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B] w-[130px] placeholder:text-[var(--theme-text)]/30"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Fecha inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Fecha fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Encargado</label>
          <select
            value={collectorFilter}
            onChange={(e) => setCollectorFilter(e.target.value)}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          >
            <option value="todos">Todos</option>
            {collectors.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Método de pago</label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'ALL')}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          >
            <option value="ALL">Todos</option>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => (
              <option key={key} value={key}>{PAYMENT_METHOD_LABELS[key]}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={handleFilter}
            disabled={loading}
            className="bg-[#88B04B] text-white text-[13px] font-semibold px-5 py-2 rounded-full hover:bg-[#5E7E2F] transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Filtrar'}
          </button>
          <button
            onClick={handleFilter}
            disabled={loading}
            title="Actualizar registros"
            className="border border-[var(--theme-border)] text-[var(--theme-text)]/60 text-[13px] font-semibold px-3 py-2 rounded-full hover:border-[#88B04B] hover:text-[#88B04B] transition-colors disabled:opacity-60"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium bg-red-500/10 border border-red-500/20 text-red-500 mb-4">
          <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</span>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-[var(--theme-secondary-bg)] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Tabla de cobros */}
      {!loading && (
        <>
          <p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
            Registros ({logs.length})
          </p>

          {logs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
              <p className="text-[13px] text-[var(--theme-text)]/40">
                No se encontraron cobros con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="border border-[var(--theme-border)] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-[var(--theme-secondary-bg)]">
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Pedido</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Encargado</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Monto</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Método</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Estado</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr
                        key={log.logId}
                        className={i % 2 === 0 ? 'bg-[var(--theme-card-bg)]' : 'bg-[var(--theme-secondary-bg)]/50'}
                      >
                        <td className="px-4 py-2.5 font-mono text-[11px] font-medium text-[var(--theme-text)]">
                          {log.orderId}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-[12px] font-medium text-[var(--theme-text)]">{log.collectedByName}</div>
                          <div className="text-[10px] text-[var(--theme-text)]/40">{log.collectedByEmail}</div>
                          <div className="text-[8px] text-[var(--theme-text)]/30 uppercase tracking-wide">{log.collectedByRole}</div>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] font-medium text-[var(--theme-text)]">
                          {formatCurrency(log.amount)}
                        </td>
                        <td className="px-4 py-2.5">
                          <MethodBadge method={log.paymentMethod} />
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="px-4 py-2.5 text-[11px] text-[var(--theme-text)]/70">
                          {formatDateTime(log.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
