// CancelledOrdersReport.tsx — HU #163: Reporte de pedidos cancelados
// Área 7: Administración & Analítica

import { useState, useEffect } from 'react';
import type { PeriodFilter, CancelledOrder, CancelledOrdersSummary } from '../types';
import { getCancelledOrdersByPeriod, getCancelledOrdersSummary } from '../services/cancelledOrdersService';

export default function CancelledOrdersReport() {
  const [period, setPeriod] = useState<PeriodFilter>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orders, setOrders] = useState<CancelledOrder[]>([]);
  const [summary, setSummary] = useState<CancelledOrdersSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Cargar resumen global al montar el componente
  useEffect(() => {
    const loadSummary = async () => {
      try {
        const summaryData = await getCancelledOrdersSummary();
        setSummary(summaryData);
      } catch (err) {
        console.error('Error cargando resumen:', err);
      }
    };
    loadSummary();
  }, []);

  const periodNote: Record<PeriodFilter, string> = {
    day: 'Mostrando cancelados de hoy',
    week: 'Mostrando cancelados de los últimos 7 días',
    month: 'Mostrando cancelados del mes actual',
  };

  const formatShortDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const tableTitle = () => {
  if (startDate && endDate) {
    return `Pedidos cancelados del ${formatShortDate(startDate)} al ${formatShortDate(endDate)}`;
  }
  if (period === 'day') return 'Pedidos cancelados de hoy';
  if (period === 'week') return 'Pedidos cancelados de esta semana';
  return 'Pedidos cancelados de este mes';
};

  const handleGenerate = async () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const filter = {
        period,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate + 'T23:59:59') : undefined,
      };

      const data = await getCancelledOrdersByPeriod(filter);
      setOrders(data);
    } catch (err) {
      setError('Error al obtener los datos. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString('es-BO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

return (
    <div className="p-6">

      {/* --- ZONA DE FILTROS (Fila en Desktop, Columna en Mobile) --- */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8 bg-(--theme-card-bg) p-4 rounded-xl border border-(--theme-border) shadow-sm">
        
        {/* 1. Selector de período */}
        <div className="flex-shrink-0">
          <p className="text-xs font-bold text-(--theme-text)/50 mb-3 uppercase tracking-widest">
            Seleccionar período
          </p>
          <div className="flex gap-3 mb-2">
            {(['day', 'week', 'month'] as PeriodFilter[]).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPeriod(p);
                  setStartDate('');
                  setEndDate('');
                }}
                className={`px-5 py-2 rounded-full text-sm font-semibold border transition-all ${
                  period === p && !startDate && !endDate
                    ? 'bg-primary text-white border-primary'
                    : 'bg-(--theme-card-bg) text-(--theme-text)/60 border-(--theme-border) hover:border-primary'
                }`}
              >
                {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
          {/* Nota dinámica */}
          <p className="text-xs text-(--theme-text)/40 italic">
            {startDate && endDate
              ? `Mostrando cancelados del ${startDate} al ${endDate}`
              : periodNote[period]}
          </p>
        </div>

        {/* 2. Filtro personalizado de fechas */}
        <div className="flex-shrink-0">
          <p className="text-xs font-bold text-(--theme-text)/50 mb-3 uppercase tracking-widest">
            Filtro personalizado por fecha
          </p>
          <div className="flex gap-4 flex-wrap sm:flex-nowrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-(--theme-text)/50 font-bold uppercase">
                Fecha de inicio
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-(--theme-border) rounded-lg px-4 py-2.5 text-sm text-(--theme-text)/70
                focus:outline-none focus:border-primary w-full sm:w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-(--theme-text)/50 font-bold uppercase">
                Fecha de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-(--theme-border) rounded-lg px-4 py-2.5 text-sm text-(--theme-text)/70
                focus:outline-none focus:border-primary w-full sm:w-40"
              />
            </div>
          </div>
        </div>

        {/* 3. Botón generar */}
        <div className="flex flex-col justify-end lg:mt-6 w-full lg:w-auto">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full lg:w-auto bg-primary hover:bg-primary/90 text-white font-bold px-8 py-2.5
            rounded-full transition-all disabled:opacity-60 whitespace-nowrap lg:h-[42px] mt-auto"
          >
            {loading ? 'Cargando...' : 'Generar reporte'}
          </button>
        </div>

      </div>
      {/* --- FIN ZONA DE FILTROS --- */}

      {/* Resumen global — siempre visible */}
      {summary && (
        <div className="mb-8">
          <p className="text-xs font-bold text-(--theme-text)/50 mb-3 uppercase tracking-widest">
            Resumen global
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-(--theme-error)">
                {summary.totalCancelled}
              </p>
              <p className="text-xs text-(--theme-text)/50 mt-1 uppercase tracking-wide">
                Total cancelados
              </p>
            </div>
            <div className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl p-5 text-center">
              <p className="text-2xl font-bold text-(--theme-error)">
                {summary.cancellationPercentage}%
              </p>
              <p className="text-xs text-(--theme-text)/50 mt-1 uppercase tracking-wide">
                % del total de pedidos
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Estado de carga */}
      {loading && (
        <div className="mb-6 bg-(--theme-success-bg) border border-(--theme-success-border) rounded-xl p-4
        text-primary text-sm font-medium">
          ⟳ Cargando datos desde Firestore...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 bg-(--theme-error-bg) border border-(--theme-error-border) rounded-xl p-4
        text-(--theme-error) text-sm font-medium">
          ✕ {error}
        </div>
      )}

      {/* Tabla */}
      {hasSearched && !loading && !error && (
        <div>
          <p className="text-xs font-bold text-(--theme-text)/50 mb-3 uppercase tracking-widest">
            {tableTitle()}
          </p>

          {orders.length === 0 ? (
            <div className="border-2 border-dashed border-(--theme-border) rounded-xl p-10
            text-center bg-(--theme-secondary-bg)">
              <p className="text-(--theme-text)/60 font-medium">
                No se encontraron pedidos cancelados en el período seleccionado.
              </p>
              <p className="text-(--theme-text)/40 text-sm mt-1">
                Intenta con un período diferente.
              </p>
            </div>
         ) : (
            <>
              {/* --- VERSIÓN DESKTOP (Tabla con ID corto y botón copiar - se oculta en móviles) --- */}
              <div className="hidden md:block bg-(--theme-card-bg) rounded-xl overflow-hidden border border-(--theme-border) shadow-sm">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-(--theme-secondary-bg)">
                      <th className="text-left px-4 py-3 text-xs font-bold text-(--theme-text)/50 uppercase whitespace-nowrap">
                        ID Pedido
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-(--theme-text)/50 uppercase whitespace-nowrap">
                        Fecha
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-(--theme-text)/50 uppercase whitespace-nowrap">
                        Cliente
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-(--theme-text)/50 uppercase whitespace-nowrap">
                        Total
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-(--theme-text)/50 uppercase whitespace-nowrap">
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order, i) => (
                      <tr
                        key={order.orderId}
                        className={i % 2 === 0 ? 'bg-(--theme-card-bg)' : 'bg-(--theme-secondary-bg)'}
                      >
                        {/* ID Corto + Copiar adaptado para la celda de la tabla */}
                        <td className="px-4 py-3 text-(--theme-text)/70 font-mono text-xs whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="bg-(--theme-secondary-bg) px-2 py-0.5 rounded font-bold text-(--theme-text)/70">
                              #{order.orderId.slice(0, 4)}...{order.orderId.slice(-4)}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(order.orderId);
                                alert(`¡ID de pedido copiado al portapapeles!`);
                              }}
                              title="Copiar ID completo"
                              className="text-(--theme-text)/40 hover:text-primary p-1 transition-colors"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-(--theme-text)/50 whitespace-nowrap">
                          {formatDate(order.cancelledAt)}
                        </td>
                        <td className="px-4 py-3 text-(--theme-text) font-medium">
                          {order.customerName}
                        </td>
                        <td className="px-4 py-3 text-(--theme-text)/70 whitespace-nowrap">
                          Bs. {order.total.toFixed(2)}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-(--theme-secondary-bg) text-(--theme-text)/60 text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap">
                            {order.incidentReason ?? 'Sin motivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* --- VERSIÓN MOBILE (Tarjetas apiladas con ID corto y botón de copiar - se oculta en PC) --- */}
              <div className="grid grid-cols-1 gap-4 md:hidden">
                {orders.map((order) => (
                  <div key={order.orderId} className="bg-(--theme-card-bg) p-4 rounded-xl border border-(--theme-border) shadow-sm flex flex-col">
                    
                    {/* Cabecera de la tarjeta: ID Corto + Copiar y Fecha */}
                    <div className="flex justify-between items-start border-b border-(--theme-border) pb-3 mb-3">
                      <div className="overflow-hidden pr-2 flex-1">
                        <p className="text-xs font-bold text-(--theme-text)/40 uppercase tracking-wider mb-1">ID Pedido</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-(--theme-text)/70 bg-(--theme-secondary-bg) px-2 py-0.5 rounded font-bold">
                            #{order.orderId.slice(0, 4)}...{order.orderId.slice(-4)}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(order.orderId);
                              alert(`¡ID de pedido copiado al portapapeles!`);
                            }}
                            title="Copiar ID completo"
                            className="text-(--theme-text)/40 hover:text-primary p-1 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-xs font-bold text-(--theme-text)/40 uppercase tracking-wider mb-1">Fecha</p>
                        <p className="text-xs text-(--theme-text)/50 font-medium">{formatDate(order.cancelledAt)}</p>
                      </div>
                    </div>
                    
                    {/* Cuerpo de la tarjeta: Cliente y Total */}
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <p className="text-xs font-bold text-(--theme-text)/40 uppercase tracking-wider mb-1">Cliente</p>
                        <p className="text-sm font-bold text-(--theme-text)">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-(--theme-text)/40 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-sm font-bold text-(--theme-text)">Bs. {order.total.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Pie de la tarjeta: Motivo */}
                    <div className="bg-(--theme-secondary-bg) p-3 rounded-lg border border-(--theme-border) mt-auto">
                      <p className="text-xs font-bold text-(--theme-text)/40 uppercase tracking-wider mb-1">Motivo de cancelación</p>
                      <p className="text-sm text-(--theme-error) font-medium">{order.incidentReason ?? 'Sin motivo'}</p>
                    </div>
                    
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}