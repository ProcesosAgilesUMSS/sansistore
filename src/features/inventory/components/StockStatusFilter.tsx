import React from 'react';
import { AlertTriangle, CheckCircle, LayoutGrid } from 'lucide-react';
import type { StockFilter } from '../types';

interface StockStatusFilterProps {
  value: StockFilter;
  onChange: (value: StockFilter) => void;
  lowCount?: number;
  normalCount?: number;
}

export const StockStatusFilter = ({
  value,
  onChange,
  lowCount,
  normalCount,
}: StockStatusFilterProps) => {
  const options: {
    key: StockFilter;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
    activeBadgeClass: string; //-
  }[] = [
    {
      key: 'all',
      label: 'Todos',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      activeClass: 'bg-primary text-white border-transparent shadow-sm',
      activeBadgeClass: 'bg-white/25 text-white',
    },
    {
      key: 'low',
      label: 'Stock Bajo',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      activeClass: 'bg-(--theme-warning) text-white border-transparent shadow-sm',
      activeBadgeClass: 'bg-white/25 text-white',
    },
    {
      key: 'normal',
      label: 'Normal',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-primary text-white border-transparent shadow-sm',
      activeBadgeClass: 'bg-white/25 text-white',
    },
  ];

  const counts: Record<StockFilter, number | undefined> = {
    all:
      lowCount !== undefined && normalCount !== undefined
        ? lowCount + normalCount
        : undefined,
    low: lowCount,
    normal: normalCount,
  };

  return (
    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-(--theme-secondary-bg) border border-(--theme-border)">
      {options.map((opt) => {
        const isActive = value === opt.key;
        const count = counts[opt.key];

        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
              border transition-all duration-150 cursor-pointer select-none
              ${
                isActive
                  ? opt.activeClass
                  : 'border-transparent text-(--theme-text) opacity-60 hover:opacity-100 hover:bg-(--theme-card-bg)'
              }
            `}
          >
            {opt.icon}
            {opt.label}
            {count !== undefined && (
              <span
                className={`
                  ml-1 px-1.5 py-0.5 rounded-full text-xs font-black tracking-wide transition-colors
                  /* Aquí lee dinámicamente la clase correspondiente al badge activo */
                  ${isActive ? opt.activeBadgeClass : 'bg-(--theme-border) text-(--theme-text) opacity-80'}
                `}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};