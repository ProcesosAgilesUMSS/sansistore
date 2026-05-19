import { useState } from 'react';
import { useDailySales } from '../hooks/useDailySales';

const formatCurrency = (amount: number) =>
  `Bs. ${amount.toLocaleString('es-BO', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  })}`;

export default function DailySales() {
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { summary, dailySales, loading, error } = useDailySales(startDate, endDate);

  const applyFilter = () => {
    setStartDate(startDateInput);
    setEndDate(endDateInput);
  };

  return (
    /* Contenedor principal centrado y con ancho máximo para que no se estire */
    <div className="max-w-5xl mx-auto space-y-8 pb-10">

      {/* Se eliminó el Header duplicado. Tu Layout ya lo maneja. */}

      {/* Filters */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--theme-text)]/50 uppercase tracking-wider">
          Filtrar por rango de fechas
        </h3>

        <div className="flex flex-col md:flex-row gap-4">
          {/* Input Fecha Inicio con Label integrado */}
          <div className="flex-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)] px-4 py-2 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-[var(--theme-text)]/50 uppercase">Fecha de inicio</span>
            <input
              type="date"
              value={startDateInput}
              onChange={(event) => setStartDateInput(event.target.value)}
              className="w-full bg-transparent text-sm outline-none text-[var(--theme-text)] mt-0.5"
            />
          </div>

          {/* Input Fecha Fin con Label integrado */}
          <div className="flex-1 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)] px-4 py-2 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-[var(--theme-text)]/50 uppercase">Fecha de fin</span>
            <input
              type="date"
              value={endDateInput}
              onChange={(event) => setEndDateInput(event.target.value)}
              className="w-full bg-transparent text-sm outline-none text-[var(--theme-text)] mt-0.5"
            />
          </div>

          <button
            onClick={applyFilter}
            className="px-8 py-3 rounded-xl bg-[#88b04b] hover:bg-[#7aa03f] transition-colors text-white text-sm font-medium"
          >
            Aplicar filtro
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[var(--theme-text)]/50 uppercase tracking-wider">
          Resumen del período
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Tarjetas sin borde, fondo gris suave y texto centrado como en el mockup */}
          <div className="bg-black/5 rounded-2xl p-6 text-center flex flex-col justify-center">
            <p className="text-3xl font-bold text-[#88b04b] mb-1">
              {formatCurrency(summary.totalSales)}
            </p>
            <span className="text-[10px] font-bold text-[var(--theme-text)]/40 uppercase tracking-wider">
              Ventas totales
            </span>
          </div>

          <div className="bg-black/5 rounded-2xl p-6 text-center flex flex-col justify-center">
            <p className="text-3xl font-bold text-[var(--theme-text)] mb-1">
              {summary.totalOrders}
            </p>
            <span className="text-[10px] font-bold text-[var(--theme-text)]/40 uppercase tracking-wider">
              Órdenes
            </span>
          </div>

          <div className="bg-black/5 rounded-2xl p-6 text-center flex flex-col justify-center">
            <p className="text-3xl font-bold text-[#88b04b] mb-1">
              {formatCurrency(summary.dailyAverage)}
            </p>
            <span className="text-[10px] font-bold text-[var(--theme-text)]/40 uppercase tracking-wider">
              Promedio diario
            </span>
          </div>

          <div className="bg-black/5 rounded-2xl p-6 text-center flex flex-col justify-center">
            <p className="text-3xl font-bold text-[#88b04b] mb-1">
              {summary.daysWithSales}
            </p>
            <span className="text-[10px] font-bold text-[var(--theme-text)]/40 uppercase tracking-wider">
              Días con ventas
            </span>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-[var(--theme-text)]/50 uppercase tracking-wider">
            Ventas por día
          </h3>
          <span className="text-xs text-[#88b04b] font-medium flex items-center gap-1">
            {/* Ícono de recargar simple en SVG */}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualización en tiempo real
          </span>
        </div>

        <div className="bg-[var(--theme-card-bg)] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-black/5">
              <tr className="text-left text-[11px] font-bold text-[var(--theme-text)]/50 uppercase tracking-wider">
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Órdenes</th>
                <th className="px-5 py-4">Monto total</th>
                <th className="px-5 py-4">Promedio</th>
              </tr>
            </thead>

            <tbody>
              {dailySales.map((sale, index) => (
                <tr
                  key={sale.date}
                  className={index !== 0 ? "border-t border-[var(--theme-border)]/50" : ""}
                >
                  <td className="px-5 py-4 text-[var(--theme-text)]/80">{sale.date}</td>
                  <td className="px-5 py-4 text-[var(--theme-text)]/80">{sale.orders}</td>
                  <td className="px-5 py-4 text-[#88b04b] font-medium">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="px-5 py-4 text-[var(--theme-text)]/80">{formatCurrency(sale.average)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Info Box Firestore */}
        <div className="bg-[#f2f7eb] border border-[#dcedc8] rounded-2xl p-5 mt-4">
          <h4 className="text-sm font-bold text-gray-800 mb-1">Datos en tiempo real</h4>
          <p className="text-xs text-gray-600">
            La información se actualiza automáticamente desde Firestore.<br/>
            Solo se incluyen órdenes confirmadas o completadas.
          </p>
        </div>
      </div>

      {/* Empty State */}
      {!loading && !error && dailySales.length === 0 && (
        <div className="border-2 border-dashed border-[var(--theme-border)] rounded-2xl p-10 flex flex-col items-center justify-center text-center">
          <p className="text-sm font-bold text-[var(--theme-text)]">
            No se encontraron ventas en el rango seleccionado.
          </p>
          <p className="text-xs text-[var(--theme-text)]/50 mt-2">
            Intenta con un rango de fechas diferente.
          </p>
        </div>
      )}

    </div>
  );
}
