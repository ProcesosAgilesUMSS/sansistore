import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  value: number;
  low: boolean;
}

export const StockBadge: React.FC<Props> = ({ value, low }) => {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-(--theme-text) opacity-40 mb-1">
        Disponible
      </p>

      {low ? (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500">
          <AlertTriangle className="w-3 h-3" />
          {value} Bajo
        </span>
      ) : (
        <span className="text-sm font-semibold font-mono text-green-500">
          {value}
        </span>
      )}
    </div>
  );
};
