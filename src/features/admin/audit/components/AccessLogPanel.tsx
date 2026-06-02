// AccessLogPanel.tsx — HU #159: Bitácora de accesos al sistema
// Área 7: Administración & Analítica — Nova 2.0

import { useCallback, useEffect, useRef, useState } from 'react';
// useRef solo se usa para hasFetched
import { getAccessLogs } from '../services/accessLogService';
import type { AccessLog, AccessLogFilter } from '../types';

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

// Badge de rol con color
const RoleBadge = ({ role }: { role: string }) => {
  const styles: Record<string, string> = {
    vendedor: 'bg-blue-500/10 text-blue-600',
    operador_inv: 'bg-purple-500/10 text-purple-600',
    mensajero: 'bg-orange-500/10 text-orange-600',
    admin: 'bg-[rgba(136,176,75,0.15)] text-[#5E7E2F]',
    comprador: 'bg-gray-100 text-gray-500',
  };
  return (
    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${styles[role] ?? 'bg-gray-100 text-gray-500'}`}>
      {role}
    </span>
  );
};

// Badge de acción LOGIN/LOGOUT
const ActionBadge = ({ action }: { action: string }) => (
  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
    action === 'LOGIN'
      ? 'bg-[rgba(136,176,75,0.15)] text-[#5E7E2F]'
      : 'bg-red-500/10 text-red-500'
  }`}>
    {action}
  </span>
);

// Badge de estado ACTIVO/CERRADO
const StatusBadge = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full ${
    status === 'ACTIVO'
      ? 'bg-[rgba(136,176,75,0.15)] text-[#5E7E2F]'
      : 'bg-gray-100 text-gray-500'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVO' ? 'bg-[#88B04B]' : 'bg-gray-400'}`} />
    {status}
  </span>
);

export default function AccessLogPanel() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const toInputDate = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(toInputDate(firstDay));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [roleFilter, setRoleFilter] = useState('todos');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'LOGIN' | 'LOGOUT'>('ALL');

  const hasFetched = useRef(false);

  // ── Cargar bitácora ─────────────────────────────────────────
  const fetchLogs = useCallback(async (filter?: AccessLogFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAccessLogs(filter);
      setLogs(data);
    } catch {
      setError('Error al cargar la bitácora. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      role: roleFilter,
      action: actionFilter,
    });
  };

  // Calcular estadísticas rápidas

  // Sesiones activas: toma el último registro de cada usuario
  // y verifica si su estado es ACTIVO
  const activeUsers = (() => {
    const lastByUser = new Map<string, AccessLog>();
    logs.forEach((l) => {
      const existing = lastByUser.get(l.uid);
      if (!existing || l.timestamp > existing.timestamp) {
        lastByUser.set(l.uid, l);
      }
    });
    return [...lastByUser.values()].filter((l) => l.status === 'ACTIVO').length;
  })();

  const todayLogins = logs.filter((l) => {
    const logDate = new Date(l.timestamp);
    return (
      l.action === 'LOGIN' &&
      logDate.toDateString() === new Date().toDateString()
    );
  }).length;

  // Usuarios únicos por rol (no cuenta múltiples registros del mismo usuario)
  const vendedores = new Set(
    logs
      .filter((l) => l.roles.includes('vendedor'))
      .map((l) => l.uid)
  ).size;
  const operadores = new Set(
    logs
      .filter((l) => l.roles.includes('operador_inv'))
      .map((l) => l.uid)
  ).size;

  return (
    <div className="max-w-5xl">

      {/* Título */}
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
          Bitácora de accesos
        </h2>
        <p className="text-[11px] text-[var(--theme-text)]/50 mt-0.5">
          Registro de entradas y salidas al sistema — colección accessLogs
        </p>
      </div>

      {/* KPIs rápidos */}
      {!loading && logs.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
            <p className="text-[22px] font-semibold text-[#88B04B] leading-none">{activeUsers}</p>
            <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">Sesiones activas</p>
          </div>
          <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
            <p className="text-[22px] font-semibold text-[var(--theme-text)] leading-none">{todayLogins}</p>
            <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">Logins hoy</p>
          </div>
          <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
            <p className="text-[22px] font-semibold text-blue-600 leading-none">{vendedores}</p>
            <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">Accesos vendedor</p>
          </div>
          <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
            <p className="text-[22px] font-semibold text-purple-600 leading-none">{operadores}</p>
            <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">Accesos operador</p>
          </div>
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
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Rol</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          >
            <option value="todos">Todos los roles</option>
            <option value="vendedor">Vendedor ⭐</option>
            <option value="operador_inv">Operador ⭐</option>
            <option value="mensajero">Mensajero</option>
            <option value="admin">Admin</option>
            <option value="comprador">Comprador</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">Acción</label>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value as 'ALL' | 'LOGIN' | 'LOGOUT')}
            className="bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2 text-[13px] text-[var(--theme-text)] outline-none focus:border-[#88B04B]"
          >
            <option value="ALL">Todas las acciones</option>
            <option value="LOGIN">Solo LOGIN</option>
            <option value="LOGOUT">Solo LOGOUT</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleFilter}
            disabled={loading}
            className="bg-[#88B04B] text-white text-[13px] font-semibold px-5 py-2 rounded-full hover:bg-[#5E7E2F] transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Filtrar'}
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
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-12 bg-[var(--theme-secondary-bg)] rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Tabla de bitácora */}
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--theme-secondary-bg)]">
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Usuario</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Rol</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Acción</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Fecha y hora</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Estado sesión</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr
                      key={log.logId}
                      className={i % 2 === 0 ? 'bg-[var(--theme-card-bg)]' : 'bg-[var(--theme-secondary-bg)]/50'}
                    >
                      <td className="px-4 py-2.5">
                        <div className="text-[12px] font-medium text-[var(--theme-text)]">{log.displayName}</div>
                        <div className="text-[10px] text-[var(--theme-text)]/40">{log.email}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {log.roles.map((role) => (
                            <RoleBadge key={role} role={role} />
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-2.5 text-[11px] text-[var(--theme-text)]/70">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={log.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}