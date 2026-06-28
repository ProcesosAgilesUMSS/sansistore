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
  RESERVAR: 'bg-(--theme-info-bg) text-(--theme-info)',
  CANCELAR: 'bg-(--theme-error)/10 text-(--theme-error)',
  MARCAR_LISTO: 'bg-primary/15 text-primary',
  ASIGNAR: 'bg-(--theme-info-bg) text-(--theme-info)',
  REASIGNAR: 'bg-(--theme-warning-bg) text-(--theme-warning)',
  MARCAR_PAGADA: 'bg-(--theme-success-bg) text-(--theme-success)',
  MARCAR_DEVUELTA: 'bg-(--theme-warning-bg) text-(--theme-warning)',
};

const ActionBadge = ({ action }: { action: SellerActionType }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_STYLES[action]}`}>
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
    <div>

      {/* Título */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-(--theme-text)">
          Actividad de vendedores
        </h2>
        <p className="text-xs text-(--theme-text)/50 mt-0.5">
          Registro de acciones realizadas por vendedores sobre pedidos
        </p>
      </div>


      {/* Filtros */}
      <p className="text-xs font-semibold text-(--theme-text)/40 uppercase tracking-widest mb-3 pb-2 border-b border-(--theme-border)">
        Filtros
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">Fecha inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">Fecha fin</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">Vendedor</label>
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
          >
            <option value="todos">Todos los vendedores</option>
            {sellers.map((s) => (
              <option key={s.sellerId} value={s.sellerId}>{s.sellerName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">Acción</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as SellerActionType | 'ALL')}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
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
            className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Filtrar'}
          </button>
          <button
            onClick={handleFilter}
            disabled={loading}
            title="Actualizar registros"
            className="border border-(--theme-border) text-(--theme-text)/60 text-sm font-semibold px-3 py-2 rounded-full hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error) mb-4">
          <span className="w-5 h-5 rounded-full bg-(--theme-error) flex items-center justify-center text-white text-xs font-bold">!</span>
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-(--theme-secondary-bg) rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Tabla de actividad */}
      {!loading && (
        <>
          <p className="text-xs font-semibold text-(--theme-text)/40 uppercase tracking-widest mb-3 pb-2 border-b border-(--theme-border)">
            Registros ({logs.length})
          </p>

          {logs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-xl">
              <p className="text-sm text-(--theme-text)/40">
                No se encontraron registros con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="border border-(--theme-border) rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[640px]">
                  <thead>
                    <tr className="bg-(--theme-secondary-bg)">
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Vendedor</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Acción</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Pedido</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Cambio de estado</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr
                        key={log.logId}
                        className={i % 2 === 0 ? 'bg-(--theme-card-bg)' : 'bg-(--theme-secondary-bg)/50'}
                      >
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-medium text-(--theme-text)">{log.sellerName}</div>
                          <div className="text-xs text-(--theme-text)/40">{log.sellerEmail}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <ActionBadge action={log.actionType} />
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-(--theme-text)/70">
                          {log.orderId}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="text-(--theme-text)/40">{log.previousStatus}</span>
                            <span className="text-(--theme-text)/30 text-xs">→</span>
                            <span className="font-medium text-(--theme-text)">{log.newStatus}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-(--theme-text)/70">
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
