// SellerActivityPanel.tsx — HU #160: Monitoreo de actividad de vendedores
// Área 7: Administración & Analítica

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSellerActivityLogs, getSellersFromLogs } from '../services/sellerActivityService';
import type { SellerActivityLog, SellerActivityFilter, SellerActionType } from '../types_monitoring';
import { ACTION_LABELS } from '../types_monitoring';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔧 MODO DEMO: cambiar a false para usar datos reales
const USE_MOCK_DATA = false;
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const MOCK_SELLERS = [
  { sellerId: 'seller-1', sellerName: 'María López' },
  { sellerId: 'seller-2', sellerName: 'Carlos Quispe' },
  { sellerId: 'seller-3', sellerName: 'Ana Torrez' },
];

const MOCK_LOGS: SellerActivityLog[] = [
  {
    logId: '1', sellerId: 'seller-1', sellerName: 'María López', sellerEmail: 'maria@sansi.com',
    actionType: 'MARCAR_PAGADA', orderId: 'ORD-0847', previousStatus: 'ENTREGADO', newStatus: 'PAGADO',
    timestamp: new Date('2026-06-05T14:32:18'),
  },
  {
    logId: '2', sellerId: 'seller-2', sellerName: 'Carlos Quispe', sellerEmail: 'carlos@sansi.com',
    actionType: 'ASIGNAR', orderId: 'ORD-0845', previousStatus: 'LISTO', newStatus: 'ASIGNADO',
    timestamp: new Date('2026-06-05T14:28:05'),
  },
  {
    logId: '3', sellerId: 'seller-3', sellerName: 'Ana Torrez', sellerEmail: 'ana@sansi.com',
    actionType: 'MARCAR_LISTO', orderId: 'ORD-0843', previousStatus: 'EMPAQUETADO', newStatus: 'LISTO',
    timestamp: new Date('2026-06-05T14:15:42'),
  },
  {
    logId: '4', sellerId: 'seller-1', sellerName: 'María López', sellerEmail: 'maria@sansi.com',
    actionType: 'RESERVAR', orderId: 'ORD-0841', previousStatus: 'CREADO', newStatus: 'RESERVADO',
    timestamp: new Date('2026-06-05T13:58:30'),
  },
  {
    logId: '5', sellerId: 'seller-2', sellerName: 'Carlos Quispe', sellerEmail: 'carlos@sansi.com',
    actionType: 'CANCELAR', orderId: 'ORD-0840', previousStatus: 'RESERVADO', newStatus: 'CANCELADO',
    timestamp: new Date('2026-06-05T13:45:12'),
  },
  {
    logId: '6', sellerId: 'seller-3', sellerName: 'Ana Torrez', sellerEmail: 'ana@sansi.com',
    actionType: 'REASIGNAR', orderId: 'ORD-0838', previousStatus: 'ASIGNADO', newStatus: 'ASIGNADO',
    timestamp: new Date('2026-06-05T13:30:55'),
  },
  {
    logId: '7', sellerId: 'seller-1', sellerName: 'María López', sellerEmail: 'maria@sansi.com',
    actionType: 'MARCAR_DEVUELTA', orderId: 'ORD-0835', previousStatus: 'NO ENTREGADO', newStatus: 'DEVUELTA',
    timestamp: new Date('2026-06-05T12:20:08'),
  },
  {
    logId: '8', sellerId: 'seller-2', sellerName: 'Carlos Quispe', sellerEmail: 'carlos@sansi.com',
    actionType: 'RESERVAR', orderId: 'ORD-0833', previousStatus: 'CREADO', newStatus: 'RESERVADO',
    timestamp: new Date('2026-06-05T11:48:22'),
  },
  {
    logId: '9', sellerId: 'seller-3', sellerName: 'Ana Torrez', sellerEmail: 'ana@sansi.com',
    actionType: 'ASIGNAR', orderId: 'ORD-0830', previousStatus: 'LISTO', newStatus: 'ASIGNADO',
    timestamp: new Date('2026-06-05T11:15:40'),
  },
  {
    logId: '10', sellerId: 'seller-1', sellerName: 'María López', sellerEmail: 'maria@sansi.com',
    actionType: 'MARCAR_LISTO', orderId: 'ORD-0828', previousStatus: 'EMPAQUETADO', newStatus: 'LISTO',
    timestamp: new Date('2026-06-05T10:50:15'),
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

// Badge de acción con color por tipo
const ACTION_STYLES: Record<SellerActionType, string> = {
  RESERVAR: 'bg-[rgba(93,75,221,0.12)] text-[#534AB7]',
  CANCELAR: 'bg-red-500/10 text-red-600',
  MARCAR_LISTO: 'bg-[rgba(136,176,75,0.15)] text-[#5E7E2F]',
  ASIGNAR: 'bg-blue-500/10 text-blue-600',
  REASIGNAR: 'bg-orange-500/10 text-orange-600',
  MARCAR_PAGADA: 'bg-teal-500/10 text-teal-700',
  MARCAR_DEVUELTA: 'bg-amber-500/10 text-amber-700',
};

const ActionBadge = ({ action }: { action: SellerActionType }) => (
  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${ACTION_STYLES[action]}`}>
    {ACTION_LABELS[action]?.toUpperCase() ?? action}
  </span>
);

export default function SellerActivityPanel() {
  const [logs, setLogs] = useState<SellerActivityLog[]>([]);
  const [sellers, setSellers] = useState<{ sellerId: string; sellerName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const toInputDate = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(toInputDate(firstDay));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [sellerFilter, setSellerFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState<SellerActionType | 'ALL'>('ALL');

  const hasFetched = useRef(false);

  const fetchLogs = useCallback(async (filter?: SellerActivityFilter) => {
    if (USE_MOCK_DATA) {
      setLoading(true);
      setTimeout(() => {
        let filtered = [...MOCK_LOGS];
        if (filter?.sellerId && filter.sellerId !== 'todos') {
          filtered = filtered.filter((l) => l.sellerId === filter.sellerId);
        }
        if (filter?.actionType && filter.actionType !== 'ALL') {
          filtered = filtered.filter((l) => l.actionType === filter.actionType);
        }
        setSellers(MOCK_SELLERS);
        setLogs(filtered);
        setLoading(false);
      }, 400);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [data, sellerList] = await Promise.all([
        getSellerActivityLogs(filter),
        getSellersFromLogs(),
      ]);
      setLogs(data);
      setSellers(sellerList);
    } catch {
      setError('Error al cargar la bitácora. Verificá tu conexión.');
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
      startDate: startDate ? parseLocalDate(startDate) : undefined,
      endDate: endDate ? parseLocalDate(endDate) : undefined,
      sellerId: sellerFilter,
      actionType: actionFilter,
    });
  };

  return (
    <div className="max-w-5xl">

      {/* Título */}
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
          Actividad de vendedores
        </h2>
        <p className="text-[11px] text-[var(--theme-text)]/50 mt-0.5">
          Registro de acciones realizadas por vendedores sobre pedidos
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
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Vendedor</label>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          >
            <option value="todos">Todos los vendedores</option>
            {sellers.map((s) => (
              <option key={s.sellerId} value={s.sellerId}>{s.sellerName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Acción</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as SellerActionType | 'ALL')}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          >
            <option value="ALL">Todas las acciones</option>
            {(Object.keys(ACTION_LABELS) as SellerActionType[]).map((key) => (
              <option key={key} value={key}>{ACTION_LABELS[key]}</option>
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

      {/* Tabla de actividad */}
      {!loading && (
        <>
          <p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
            Registros ({logs.length})
          </p>

          {logs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
              <p className="text-[13px] text-[var(--theme-text)]/40">
                No se encontraron registros con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="border border-[var(--theme-border)] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-[var(--theme-secondary-bg)]">
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Vendedor</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Acción</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Pedido</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Cambio de estado</th>
                      <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr
                        key={log.logId}
                        className={i % 2 === 0 ? 'bg-[var(--theme-card-bg)]' : 'bg-[var(--theme-secondary-bg)]/50'}
                      >
                        <td className="px-4 py-2.5">
                          <div className="text-[12px] font-medium text-[var(--theme-text)]">{log.sellerName}</div>
                          <div className="text-[10px] text-[var(--theme-text)]/40">{log.sellerEmail}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <ActionBadge action={log.actionType} />
                        </td>
                        <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--theme-text)]/70">
                          {log.orderId}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 text-[11px]">
                            <span className="text-[var(--theme-text)]/40">{log.previousStatus}</span>
                            <span className="text-[var(--theme-text)]/30 text-[9px]">→</span>
                            <span className="font-medium text-[var(--theme-text)]">{log.newStatus}</span>
                          </div>
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
