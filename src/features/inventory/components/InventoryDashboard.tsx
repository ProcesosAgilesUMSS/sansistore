import React, { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { RefreshCw, Package } from 'lucide-react';

import { db } from '../../../lib/firebase';

import type { DashboardProduct, SortConfig, StockFilter } from '../types';

import { applyInventoryFilters } from '../utils/applyInventoryFilters';

import { StockStatusFilter } from './StockStatusFilter';
import { CategoryFilter } from './CategoryFilter';
import { InventoryItemCard } from './InventoryItemCard';

const DEFAULT_SORT: SortConfig = {
  field: 'name',
  direction: 'asc',
};

export const InventoryDashboard: React.FC = () => {
  const [inventory, setInventory] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [stockFilter, setStockFilter] = useState<StockFilter>('all');

  const [category, setCategory] = useState<string>('all');

  // categorías únicas
  const uniqueCategories = useMemo(
    () => [...new Set(inventory.map((i) => i.categoryId))].sort(),
    [inventory]
  );

  // métricas memoizadas
  const lowCount = useMemo(
    () => inventory.filter((i) => i.stockAvailable <= i.minStock).length,
    [inventory]
  );

  const normalCount = useMemo(
    () => inventory.length - lowCount,
    [inventory, lowCount]
  );

  // filtros
  const filtered = useMemo(
    () =>
      applyInventoryFilters(inventory, {
        stockFilter,
        category,
        sort: DEFAULT_SORT,
      }),
    [inventory, stockFilter, category]
  );

  // realtime listeners
  useEffect(() => {
    const productsQuery = query(collection(db, 'products'));
    const inventoryQuery = query(collection(db, 'inventory'));

    let productsData: any[] = [];
    let inventoryData: Record<string, any> = {};

    const mergeAndSet = () => {
      const merged: DashboardProduct[] = productsData.map((prod) => {
        const inv = inventoryData[prod.id] || {};

        return {
          id: prod.id,
          name: prod.name || 'Sin nombre',
          categoryId: prod.categoryId || 'General',

          stockAvailable: inv.stockAvailable ?? 0,

          stockReserved: inv.stockReserved ?? 0,

          stockTotal: inv.stockTotal ?? 0,

          minStock: inv.minStock ?? 5,
        };
      });

      setInventory(merged);
      setLoading(false);
    };

    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      productsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      mergeAndSet();
    });

    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
      inventoryData = Object.fromEntries(
        snapshot.docs.map((doc) => [doc.id, doc.data()])
      );

      mergeAndSet();
    });

    return () => {
      unsubProducts();
      unsubInventory();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-(--theme-text) opacity-40 gap-3">
        <RefreshCw className="animate-spin w-5 h-5" />

        <span>Cargando tablero operativo...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* filtros */}
      <div className="flex flex-wrap items-center gap-3 justify-end">
        <StockStatusFilter
          value={stockFilter}
          onChange={setStockFilter}
          lowCount={lowCount}
          normalCount={normalCount}
        />

        <CategoryFilter
          value={category}
          onChange={setCategory}
          categories={uniqueCategories}
        />
      </div>

      {/* lista */}
      <div className="flex flex-col gap-2">
        {filtered.map((item) => (
          <InventoryItemCard key={item.id} item={item} />
        ))}

        {/* estado vacío */}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-16 text-(--theme-text) opacity-40 gap-2 text-sm">
            <Package className="w-4 h-4" />

            <span>Sin productos para los filtros seleccionados</span>
          </div>
        )}
      </div>
    </div>
  );
};
