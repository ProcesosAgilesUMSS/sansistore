import React from 'react';
import { Package } from 'lucide-react';

import type { DashboardProduct } from '../types';

import { Metric } from './Metric';
import { Divider } from './Divider';
import { StockBadge } from './StockBadge';

interface Props {
  item: DashboardProduct;
}

export const InventoryItemCard: React.FC<Props> = ({ item }) => {
  const isLowStock = item.stockAvailable <= item.minStock;

  return (
    <div
      className={`
        w-full bg-(--theme-card-bg)
        border border-(--theme-border)
        rounded-2xl

        px-5 py-4

        flex flex-col gap-3

        sm:grid sm:items-center sm:gap-x-6

        transition-colors
        hover:bg-primary/5

        ${
          isLowStock
            ? `
              border-l-[3px]
              border-l-amber-500
              rounded-l-none
              bg-amber-500/5
            `
            : ''
        }
      `}
      style={
        {
          gridTemplateColumns: '1fr auto',
        } as React.CSSProperties
      }
    >
      {/* info */}
      <div>
        <p className="text-sm font-medium text-(--theme-text) m-0 flex items-center gap-2">
          <Package
            className={`w-4 h-4 shrink-0 ${
              isLowStock ? 'text-amber-500' : 'opacity-30'
            }`}
          />

          {item.name}
        </p>

        <span className="mt-1 inline-block text-[11px] uppercase tracking-wider opacity-60 bg-(--theme-secondary-bg) px-2 py-0.5 rounded">
          {item.categoryId}
        </span>
      </div>

      {/* métricas */}
      <div
        className="
          grid grid-cols-2
          gap-x-4 gap-y-3

          pt-3
          border-t border-(--theme-border)

          sm:flex
          sm:flex-row
          sm:items-center
          sm:justify-end
          sm:gap-5
          sm:pt-0
          sm:border-t-0
        "
      >
        <Metric label="Mín" value={item.minStock} dim />

        <Divider className="hidden sm:block" />

        <Metric label="Físico" value={item.stockTotal} />

        <Divider className="hidden sm:block" />

        <Metric label="Reservado" value={item.stockReserved} blue />

        <Divider className="hidden sm:block" />

        <StockBadge value={item.stockAvailable} low={isLowStock} />
      </div>
    </div>
  );
};
