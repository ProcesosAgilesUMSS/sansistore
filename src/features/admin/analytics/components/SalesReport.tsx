// SalesReport.tsx
// HU #161 — Reportes de ventas por fecha
// Área 7: Administración & Analítica — Nova 2.0

import { useState } from 'react';
import { getSalesByDateRange } from '../services/salesService';
import type { SalesSummary } from '../types';

// ── Helpers ─────────────────────────────────────────────────────

// Formatea una fecha a dd/mm/yyyy para mostrar en la tabla
const formatDate = (date: Date): string =>
  date.toLocaleDateString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

// Formatea un número como moneda boliviana
const formatCurrency = (amount: number): string =>
  `Bs. ${amount.toFixed(2)}`;

// Badge de estado con colores según el status del pedido
const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    ENTREGADO: 'bg-[rgba(136,176,75,0.15)] text-[#5E7E2F]',
    CANCELADO: 'bg-red-500/10 text-red-500',
    RESERVADO: 'bg-yellow-500/10 text-yellow-700',
    CONFIRMADO: 'bg-blue-500/10 text-blue-700',
    EN_CAMINO: 'bg-purple-500/10 text-purple-700',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {status}
    </span>
  );
};

export default function SalesReport() {
  // ── Estado del formulario ──────────────────────────────────────
  // Valores por defecto: primer día del mes actual hasta hoy
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const toInputDate = (d: Date) => d.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(toInputDate(firstDayOfMonth));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [dateError, setDateError] = useState('');

  // ── Estado del reporte ─────────────────────────────────────────
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // ── Validación de fechas ───────────────────────────────────────
  // Regla: fecha inicio no puede ser posterior a fecha fin
  const validate = (): boolean => {
    if (!startDate || !endDate) {
      setDateError('Ambas fechas son obligatorias.');
      return false;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setDateError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return false;
    }
    setDateError('');
    return true;
  };

  // ── Generar reporte ────────────────────────────────────────────
  // Llama al salesService con el rango de fechas seleccionado
  const handleGenerate = async () => {
    if (!validate()) return;
    setLoading(true);
    setError('');
    setSummary(null);
    setHasSearched(true);

    try {
      const data = await getSalesByDateRange({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
      setSummary(data);
    } catch {
      setError('Error al consultar los datos. Verificá tu conexión e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">

      {/* ── Título ───────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-[15px] font-semibold text-[var(--theme-text)]">
          Reportes de ventas
        </h2>
        <p className="text-[11px] text-[var(--theme-text)]/50 mt-0.5">
          Consultá las ventas del sistema por rango de fechas
        </p>
      </div>

      {/* ── Sección: filtro de fechas ─────────────────────────── */}
      <p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
        Seleccionar período
      </p>

      <div className="flex flex-wrap gap-4 mb-5">
        {/* Fecha inicio */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
            Fecha de inicio *
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setDateError(''); }}
            className={`bg-[var(--theme-secondary-bg)] border rounded-lg px-3 py-2.5 text-[13px] text-[var(--theme-text)] outline-none transition-colors ${
              dateError ? 'border-red-400' : 'border-[var(--theme-border)] focus:border-[#88B04B]'
            }`}
          />
        </div>

        {/* Fecha fin */}
        <div>
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
            Fecha de fin *
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setDateError(''); }}
            className={`bg-[var(--theme-secondary-bg)] border rounded-lg px-3 py-2.5 text-[13px] text-[var(--theme-text)] outline-none transition-colors ${
              dateError ? 'border-red-400' : 'border-[var(--theme-border)] focus:border-[#88B04B]'
            }`}
          />
        </div>

        {/* Botón generar */}
        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-[#88B04B] text-white text-[13px] font-semibold px-6 py-2.5 rounded-full hover:bg-[#5E7E2F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Consultando...' : 'Generar reporte'}
          </button>
        </div>
      </div>

      {/* Error de validación de fechas */}
      {dateError && (
        <p className="text-[11px] text-red-500 mb-4">{dateError}</p>
      )}

      {/* ── Loading skeleton ──────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-16 bg-[var(--theme-secondary-bg)] rounded-xl animate-pulse" />
            ))}
          </div>
          <div className="h-48 bg-[var(--theme-secondary-bg)] rounded-xl animate-pulse" />
        </div>
      )}

      {/* ── Error de consulta ─────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium bg-red-500/10 border border-red-500/20 text-red-500 mb-4">
          <span className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">!</span>
          {error}
        </div>
      )}

      {/* ── Resultado del reporte ─────────────────────────────── */}
      {summary && !loading && (
        <>
          {/* Sección KPIs */}
          <p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
            Resumen del período ({new Date(startDate).toLocaleDateString('es-BO')} – {new Date(endDate).toLocaleDateString('es-BO')})
          </p>

          {/* 4 KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
              <p className="text-[22px] font-semibold text-[#88B04B] leading-none">
                {formatCurrency(summary.totalIncome)}
              </p>
              <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">
                Ingresos totales
              </p>
            </div>
            <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
              <p className="text-[22px] font-semibold text-[var(--theme-text)] leading-none">
                {summary.totalOrders}
              </p>
              <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">
                Total pedidos
              </p>
            </div>
            <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
              <p className="text-[22px] font-semibold text-[#88B04B] leading-none">
                {summary.completedOrders}
              </p>
              <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">
                Completados
              </p>
            </div>
            <div className="bg-[var(--theme-secondary-bg)] rounded-xl px-4 py-3">
              <p className="text-[22px] font-semibold text-red-500 leading-none">
                {summary.cancelledOrders}
              </p>
              <p className="text-[9px] text-[var(--theme-text)]/40 mt-1.5 uppercase tracking-wide">
                Cancelados
              </p>
            </div>
          </div>

          {/* Sección tabla */}
          <p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
            Detalle de pedidos
          </p>

          {/* Estado vacío */}
          {summary.orders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
              <p className="text-[13px] text-[var(--theme-text)]/40">
                No se encontraron pedidos en el rango de fechas seleccionado.
              </p>
              <p className="text-[11px] text-[var(--theme-text)]/30 mt-1">
                Intentá con un rango de fechas diferente.
              </p>
            </div>
          ) : (
            <div className="border border-[var(--theme-border)] rounded-xl overflow-hidden">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[var(--theme-secondary-bg)]">
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">ID Pedido</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Fecha</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Comprador</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Total</th>
                    <th className="text-left text-[9px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-wide px-4 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.orders.map((order, i) => (
                    <tr
                      key={order.orderId}
                      className={i % 2 === 0 ? 'bg-[var(--theme-card-bg)]' : 'bg-[var(--theme-secondary-bg)]/50'}
                    >
                      <td className="px-4 py-2.5 font-mono text-[10px] text-[var(--theme-text)]/50">
                        {order.orderId}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[var(--theme-text)]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] text-[var(--theme-text)]">
                        {order.buyerId}
                      </td>
                      <td className={`px-4 py-2.5 text-[12px] font-medium ${
                        order.status === 'ENTREGADO' ? 'text-[#88B04B]' : 'text-[var(--theme-text)]/50'
                      }`}>
                        {formatCurrency(order.total)}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={order.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Estado inicial — antes de buscar */}
      {!hasSearched && !loading && (
        <div className="text-center py-12 border border-dashed border-[var(--theme-border)] rounded-xl">
          <p className="text-[13px] text-[var(--theme-text)]/40">
            Seleccioná un rango de fechas y presioná Generar reporte
          </p>
        </div>
      )}

    </div>
  );
}