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
  }[] = [
    {
      key: 'all',
      label: 'Todos',
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
      activeClass: 'bg-(--theme-primary) text-white border-transparent',
    },
    {
      key: 'low',
      label: 'Stock Bajo',
      icon: <AlertTriangle className="w-3.5 h-3.5" />,
      activeClass: 'bg-amber-500/20 text-amber-500 border-amber-500/40',
    },
    {
      key: 'normal',
      label: 'Normal',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      activeClass: 'bg-green-500/20 text-green-500 border-green-500/40',
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
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              border transition-all duration-150 cursor-pointer
              ${
                isActive
                  ? opt.activeClass
                  : 'border-transparent text-(--theme-text) opacity-50 hover:opacity-80 hover:bg-(--theme-card-bg)'
              }
            `}
          >
            {opt.icon}
            {opt.label}
            {count !== undefined && (
              <span
                className={`
                ml-0.5 px-1.5 py-0.5 rounded-full text-[0.6rem] font-bold
                ${isActive ? 'bg-white/20' : 'bg-(--theme-border)'}
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
