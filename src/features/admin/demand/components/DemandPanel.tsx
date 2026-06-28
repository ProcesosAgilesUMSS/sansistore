// DemandPanel.tsx — HU #149: Análisis de demanda por horarios
// Área 7: Administración & Analítica — Nova 2.0

import { useEffect, useRef, useState } from 'react';
import { getDemandByHour } from '../services/demandService';
import type { DemandSummary } from '../types';

const toInputDate = (d: Date) => d.toISOString().split('T')[0];

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const barColor = (count: number, max: number): string => {
  if (max === 0) return 'var(--theme-border)';
  const ratio = count / max;
  if (ratio >= 0.6) return 'var(--color-primary)';
  if (ratio <= 0.15) return 'var(--theme-border)';
  return 'var(--theme-info)';
};

export default function DemandPanel() {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(toInputDate(firstDay));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [categoryId, setCategoryId] = useState('todas');
  const [summary, setSummary] = useState<DemandSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const hasFetched = useRef(false);

  const fetchDemand = async (sDate: string, eDate: string, cat: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await getDemandByHour({
        startDate: parseLocalDate(sDate),
        endDate: parseLocalDate(eDate),
        categoryId: cat,
      });
      setSummary(result);
    } catch {
      setError('Error al cargar los datos. Verificá tu conexión.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void fetchDemand(startDate, endDate, categoryId);
  }, []);

  const handleGenerate = () => {
    void fetchDemand(startDate, endDate, categoryId);
  };

  const maxCount = summary ? Math.max(...summary.byHour.map((h) => h.count)) : 0;

  return (
    <div>

      {/* Título */}
      <div className="mb-6">
        <h2 className="text-base font-semibold text-(--theme-text)">
          Demanda por horarios
        </h2>
        <p className="text-xs text-(--theme-text)/50 mt-0.5">
          Análisis de pedidos agrupados por franja horaria
        </p>
      </div>

      {/* KPIs */}
      {summary && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
            <p className="text-xs text-(--theme-text)/40 uppercase tracking-wide mb-1.5">Hora pico</p>
            <p className="text-base font-semibold text-primary leading-none">
              {String(summary.peakHour).padStart(2, '0')}:00 – {String(summary.peakHour + 1).padStart(2, '0')}:00
            </p>
          </div>
          <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
            <p className="text-xs text-(--theme-text)/40 uppercase tracking-wide mb-1.5">Total pedidos</p>
            <p className="text-2xl font-semibold text-(--theme-text) leading-none">{summary.totalOrders}</p>
          </div>
          <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
            <p className="text-xs text-(--theme-text)/40 uppercase tracking-wide mb-1.5">Promedio / hora</p>
            <p className="text-2xl font-semibold text-(--theme-text) leading-none">{summary.avgPerHour}</p>
          </div>
          <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
            <p className="text-xs text-(--theme-text)/40 uppercase tracking-wide mb-1.5">Hora más baja</p>
            <p className="text-base font-semibold text-(--theme-text)/60 leading-none">
              {String(summary.minHour).padStart(2, '0')}:00 – {String(summary.minHour + 1).padStart(2, '0')}:00
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <p className="text-xs font-semibold text-(--theme-text)/40 uppercase tracking-widest mb-3 pb-2 border-b border-(--theme-border)">
        Filtros
      </p>
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Fecha inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Fecha fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Categoría
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary transition-colors"
          >
            <option value="todas">Todas las categorías</option>
            <option value="lacteos">Lácteos</option>
            <option value="abarrotes">Abarrotes</option>
            <option value="bebidas">Bebidas</option>
            <option value="hogar">Hogar</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Generar reporte'}
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
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-(--theme-secondary-bg) rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Sin datos */}
      {!loading && summary && summary.totalOrders === 0 && (
        <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-xl">
          <p className="text-sm text-(--theme-text)/40">
            No se encontraron pedidos en el rango de fechas seleccionado.
          </p>
          <p className="text-xs text-(--theme-text)/30 mt-1">
            Intentá con un rango de fechas diferente.
          </p>
        </div>
      )}

      {/* Contenido principal */}
      {!loading && summary && summary.totalOrders > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Histograma */}
          <div className="md:col-span-2 bg-(--theme-secondary-bg) rounded-xl p-5">
            <p className="text-sm font-semibold text-(--theme-text) mb-1">
              Pedidos por franja horaria
            </p>
            <p className="text-xs text-(--theme-text)/40 mb-4">
              {startDate} — {endDate}
            </p>

            <div className="w-full overflow-x-auto">
              <svg viewBox="0 0 480 180" className="w-full" style={{ minWidth: '320px' }}>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
                  <line
                    key={i}
                    x1="32" y1={10 + (1 - ratio) * 140}
                    x2="478" y2={10 + (1 - ratio) * 140}
                    stroke="var(--theme-border)" strokeWidth="0.5"
                  />
                ))}
                {summary.byHour.map((h, i) => {
                  const barH = maxCount > 0 ? (h.count / maxCount) * 130 : 0;
                  const x = 36 + i * 18.5;
                  const color = barColor(h.count, maxCount);
                  return (
                    <g key={h.hour}>
                      <rect x={x} y={150 - barH} width="14" height={barH} rx="2" fill={color} />
                      <title>{h.label}: {h.count} pedidos</title>
                    </g>
                  );
                })}
                {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => (
                  <text
                    key={h}
                    x={36 + h * 18.5 + 7}
                    y="168"
                    textAnchor="middle"
                    fontSize="8"
                    fill="var(--theme-text)"
                    opacity="0.4"
                  >
                    {String(h).padStart(2, '0')}
                  </text>
                ))}
              </svg>
            </div>

            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
                <span className="text-xs text-(--theme-text)/50">Alta demanda</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-(--theme-info)" />
                <span className="text-xs text-(--theme-text)/50">Normal</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-(--theme-border)" />
                <span className="text-xs text-(--theme-text)/50">Baja demanda</span>
              </div>
            </div>
          </div>

          {/* Top 5 horas pico */}
          <div className="bg-(--theme-secondary-bg) rounded-xl p-5">
            <p className="text-sm font-semibold text-(--theme-text) mb-1">
              Horas pico
            </p>
            <p className="text-xs text-(--theme-text)/40 mb-4">
              Top 5 franjas con más pedidos
            </p>
            <div className="flex flex-col gap-2">
              {summary.top5.map((item) => {
                const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                const color = barColor(item.count, maxCount);
                return (
                  <div key={item.hour} className="bg-(--theme-bg) rounded-lg px-3 py-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-(--theme-text)">
                        {String(item.hour).padStart(2, '0')}:00 – {String(item.hour + 1).padStart(2, '0')}:00
                      </span>
                      <span className="text-xs text-(--theme-text)/50">
                        {item.count} pedidos
                      </span>
                    </div>
                    <div className="h-1.5 bg-(--theme-border) rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
