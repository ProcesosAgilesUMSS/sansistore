import type { OrderFilters, OrderStatus } from "../types";

const STATUS_OPTIONS: Array<OrderStatus | "TODOS"> = [
  "TODOS",
  "CREADO",
  "PENDIENTE",
  "RESERVADO",
  "EMPAQUETADO",
  "EN CAMINO",
  "ENTREGADO",
  "PAGADO",
  "NO ENTREGADO",
  "CANCELADO",
];

interface OrdersFiltersProps {
  filters: OrderFilters;
  onChange: (filters: OrderFilters) => void;
  onRefresh: () => void;
}

export default function OrdersFilters({
  filters,
  onChange,
  onRefresh,
}: OrdersFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3 items-end mb-6">
      {/* Búsqueda */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
          Búsqueda
        </label>
        <input
          type="text"
          placeholder="ID o nombre de cliente…"
          value={filters.search}
          onChange={(e) =>
            onChange({ ...filters, search: e.target.value })
          }
          className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) placeholder:text-(--theme-text)/30 focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-[220px]"
        />
      </div>

      {/* Estado */}
      <div className="flex flex-col gap-1">
        <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
          Estado
        </label>
        <select
          value={filters.status}
          onChange={(e) =>
            onChange({
              ...filters,
              status: e.target.value as OrderStatus | "TODOS",
            })
          }
          className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Botón refrescar */}
      <button
        type="button"
        onClick={onRefresh}
        className="px-4 py-2 rounded-lg border border-(--theme-border) text-sm text-(--theme-text)/60 hover:text-(--theme-text) hover:bg-(--theme-text)/5 transition-colors"
        title="Recargar órdenes"
      >
        ↺
      </button>
    </div>
  );
}