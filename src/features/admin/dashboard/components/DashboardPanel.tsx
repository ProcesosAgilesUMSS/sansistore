// DashboardPanel.tsx — Dashboard principal del panel administrativo
// Área 7: Administración & Analítica — Nova 2.0

import { useEffect, useRef, useState } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  BarChart2,
  FileText,
  Settings,
  Activity,
  ClipboardList,
  ChevronRight,
} from 'lucide-react';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { getSalesByDateRange } from '../../analytics/services/salesService';
import { getAccessLogs } from '../../audit/services/accessLogService';
import { getDemandByHour } from '../../demand/services/demandService';

interface DashboardProps {
  onNavigate: (section: string) => void;
  userName: string;
}

interface DashboardStats {
  todayOrders: number;
  todayIncome: number;
  reservedOrders: number;
  activeSessions: number;
  peakHour: number;
  cancelledToday: number;
}

export default function DashboardPanel({ onNavigate, userName }: DashboardProps) {
  const hasFetched = useRef(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<{ id: string; buyer: string; total: number; status: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      // ── 1. Ventas de hoy ──
      const salesPromise = getSalesByDateRange({
        startDate: today,
        endDate: todayEnd,
      });

      // ── 2. Pedidos RESERVADO activos ──
      const reservedPromise = getDocs(query(
        collection(db, 'orders'),
        where('status', '==', 'RESERVADO')
      ));

      // ── 3. Sesiones activas (bitácora hoy) ──
      const logsPromise = getAccessLogs({
        startDate: today,
        endDate: todayEnd,
      });

      // ── 4. Hora pico de hoy ──
      const demandPromise = getDemandByHour({
        startDate: today,
        endDate: todayEnd,
      });

      // ── 5. Últimos 5 pedidos ──
      const recentPromise = getDocs(query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(today)),
        where('createdAt', '<=', Timestamp.fromDate(todayEnd))
      ));

      const [sales, reserved, logs, demand, recent] = await Promise.all([
        salesPromise,
        reservedPromise,
        logsPromise,
        demandPromise,
        recentPromise,
      ]);

      // Calcular sesiones activas
      const lastByUser = new Map<string, { status: string; timestamp: Date }>();
      logs.forEach((l) => {
        const existing = lastByUser.get(l.uid);
        if (!existing || l.timestamp > existing.timestamp) {
          lastByUser.set(l.uid, { status: l.status, timestamp: l.timestamp });
        }
      });
      const activeSessions = [...lastByUser.values()].filter((l) => l.status === 'ACTIVO').length;

      setStats({
        todayOrders: sales.totalOrders,
        todayIncome: sales.totalIncome,
        reservedOrders: reserved.size,
        activeSessions,
        peakHour: demand.totalOrders > 0 ? demand.peakHour : -1,
        cancelledToday: sales.cancelledOrders,
      });

      // Últimos 5 pedidos ordenados por fecha
      const recentList = recent.docs
        .map((doc) => {
          const data = doc.data();
          const date: Date = data.createdAt?.toDate() ?? new Date();
          return {
            id: doc.id,
            buyer: data.buyerId ?? 'Desconocido',
            total: data.total ?? 0,
            status: data.status ?? '',
            time: date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }),
          };
        })
        .sort((a, b) => b.time.localeCompare(a.time))
        .slice(0, 5);

      setRecentOrders(recentList);
    } catch {
      setError('Error al cargar el dashboard. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statusColor: Record<string, string> = {
    RESERVADO:   'text-amber-500',
    CONFIRMADO:  'text-blue-500',
    COMPLETADO:  'text-primary',
    CANCELADO:   'text-(--theme-error)',
    ENTREGADO:   'text-primary',
    PAGADO:      'text-primary',
    CREADO:      'text-(--theme-text)/50',
    EMPAQUETADO: 'text-blue-400',
    LISTO:       'text-blue-500',
    ASIGNADO:    'text-indigo-500',
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = userName.split(' ')[0];

  // Accesos rápidos
  const quickAccess = [
    { label: 'Pedidos',          icon: <ShoppingBag size={16} />,   section: 'pedidos' },
    { label: 'Reportes',         icon: <FileText size={16} />,      section: 'reportes' },
    { label: 'Bitácora',         icon: <ClipboardList size={16} />, section: 'bitacora' },
    { label: 'Demanda',          icon: <BarChart2 size={16} />,     section: 'demanda-horarios' },
    { label: 'Monitoreo',        icon: <Activity size={16} />,      section: 'monitoreo' },
    { label: 'Parámetros',       icon: <Settings size={16} />,      section: 'parametros' },
  ];

  return (
    <div className="max-w-6xl">

      {/* Saludo */}
      <div className="mb-6">
        <h2 className="text-[18px] font-bold text-(--theme-text)">
          {greeting}, {firstName} 👋
        </h2>
        <p className="text-[12px] text-(--theme-text)/40 mt-0.5">
          {new Date().toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error) mb-4">
          <AlertTriangle size={14} />
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1,2,3,4].map((i) => (
            <div key={i} className="h-20 bg-(--theme-secondary-bg) rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* KPIs */}
      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">

            {/* Pedidos hoy */}
            <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingBag size={13} className="text-(--theme-text)/30" />
                <p className="text-[9px] text-(--theme-text)/40 uppercase tracking-wide">Pedidos hoy</p>
              </div>
              <p className="text-[24px] font-bold text-(--theme-text) leading-none">{stats.todayOrders}</p>
            </div>

            {/* Ingresos hoy */}
            <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={13} className="text-(--theme-text)/30" />
                <p className="text-[9px] text-(--theme-text)/40 uppercase tracking-wide">Ingresos hoy</p>
              </div>
              <p className="text-[24px] font-bold text-primary leading-none">
                Bs. {stats.todayIncome.toFixed(2)}
              </p>
            </div>

            {/* Sesiones activas */}
            <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Users size={13} className="text-(--theme-text)/30" />
                <p className="text-[9px] text-(--theme-text)/40 uppercase tracking-wide">Sesiones activas</p>
              </div>
              <p className="text-[24px] font-bold text-(--theme-text) leading-none">{stats.activeSessions}</p>
            </div>

            {/* Hora pico */}
            <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={13} className="text-(--theme-text)/30" />
                <p className="text-[9px] text-(--theme-text)/40 uppercase tracking-wide">Hora pico hoy</p>
              </div>
              <p className="text-[18px] font-bold text-primary leading-none">
                {stats.peakHour >= 0
                  ? `${String(stats.peakHour).padStart(2, '0')}:00`
                  : '—'}
              </p>
            </div>
          </div>

          {/* Alertas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">

            {/* Pedidos RESERVADO */}
            {stats.reservedOrders > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('pedidos')}
                className="flex items-center gap-3 px-4 py-3 bg-(--theme-warning-bg) border border-(--theme-warning-border) rounded-xl text-left hover:opacity-80 transition-opacity"
              >
                <AlertTriangle size={16} className="text-(--theme-warning) flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-(--theme-warning)">
                    {stats.reservedOrders} pedido{stats.reservedOrders > 1 ? 's' : ''} en estado RESERVADO
                  </p>
                  <p className="text-[10px] text-(--theme-warning)/70">
                    Pueden cancelarse automáticamente si vence el tiempo límite
                  </p>
                </div>
                <ChevronRight size={14} className="text-(--theme-warning)/50" />
              </button>
            )}

            {/* Cancelados hoy */}
            {stats.cancelledToday > 0 && (
              <button
                type="button"
                onClick={() => onNavigate('reportes-cancelados')}
                className="flex items-center gap-3 px-4 py-3 bg-(--theme-error-bg) border border-(--theme-error-border) rounded-xl text-left hover:opacity-80 transition-opacity"
              >
                <AlertTriangle size={16} className="text-(--theme-error) flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[12px] font-semibold text-(--theme-error)">
                    {stats.cancelledToday} pedido{stats.cancelledToday > 1 ? 's' : ''} cancelado{stats.cancelledToday > 1 ? 's' : ''} hoy
                  </p>
                  <p className="text-[10px] text-(--theme-error)/70">
                    Ver reporte de cancelados para más detalle
                  </p>
                </div>
                <ChevronRight size={14} className="text-(--theme-error)/50" />
              </button>
            )}
          </div>

          {/* Contenido principal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Últimos pedidos */}
            <div className="md:col-span-2 bg-(--theme-secondary-bg) rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[13px] font-semibold text-(--theme-text)">Últimos pedidos de hoy</p>
                <button
                  type="button"
                  onClick={() => onNavigate('pedidos')}
                  className="text-[11px] text-primary hover:underline"
                >
                  Ver todos
                </button>
              </div>

              {recentOrders.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-[12px] text-(--theme-text)/30">No hay pedidos hoy todavía.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center gap-3 bg-(--theme-bg) rounded-lg px-3 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-(--theme-text)/40 truncate">{order.id.slice(0, 16)}...</p>
                        <p className="text-[12px] font-medium text-(--theme-text) truncate">{order.buyer}</p>
                      </div>
                      <p className="text-[12px] font-semibold text-(--theme-text) whitespace-nowrap">
                        Bs. {order.total.toFixed(2)}
                      </p>
                      <span className={`text-[10px] font-semibold whitespace-nowrap ${statusColor[order.status] ?? 'text-(--theme-text)/50'}`}>
                        {order.status}
                      </span>
                      <span className="text-[10px] text-(--theme-text)/30 whitespace-nowrap">{order.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accesos rápidos */}
            <div className="bg-(--theme-secondary-bg) rounded-xl p-5">
              <p className="text-[13px] font-semibold text-(--theme-text) mb-4">Accesos rápidos</p>
              <div className="flex flex-col gap-2">
                {quickAccess.map((item) => (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => onNavigate(item.section)}
                    className="flex items-center gap-3 px-3 py-2.5 bg-(--theme-bg) rounded-lg hover:bg-primary/5 hover:text-primary transition-colors text-left group"
                  >
                    <span className="text-(--theme-text)/40 group-hover:text-primary transition-colors">
                      {item.icon}
                    </span>
                    <span className="flex-1 text-[12px] font-medium text-(--theme-text) group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                    <ChevronRight size={12} className="text-(--theme-text)/20 group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}