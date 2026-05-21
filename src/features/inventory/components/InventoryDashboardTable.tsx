import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Package, AlertTriangle, RefreshCw } from 'lucide-react';

interface DashboardProduct {
  id: string;
  name: string;
  categoryId: string;
  stockAvailable: number;
  stockReserved: number;
  stockTotal: number;
  minStock: number;
}

export const InventoryDashboardTable: React.FC = () => {
  const [inventory, setInventory] = useState<DashboardProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    //Escucha activa en tiempo real (onSnapshot)
    const productsQuery = query(collection(db, 'products'));
    const inventoryQuery = query(collection(db, 'inventory'));

    let productsData: any[] = [];
    let inventoryData: Record<string, any> = {};

    const mergeAndSet = () => {
      const merged = productsData.map((prod) => {
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

    // Escucha en tiempo real para Productos
    const unsubProducts = onSnapshot(productsQuery, (snapshot) => {
      productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      mergeAndSet();
    });

    // Escucha en tiempo real para Inventario
    const unsubInventory = onSnapshot(inventoryQuery, (snapshot) => {
      inventoryData = Object.fromEntries(
        snapshot.docs.map(doc => [doc.id, doc.data()])
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
    <div className="w-full bg-(--theme-card-bg) border border-(--theme-border) rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-(--theme-secondary-bg) border-b border-(--theme-border) text-[0.7rem] uppercase tracking-widest text-(--theme-text) opacity-60">
              <th className="px-6 py-4 font-bold">Producto</th>
              <th className="px-6 py-4 font-bold">Categoría</th>
              <th className="px-6 py-4 font-bold text-center">Mín. Requerido</th>
              <th className="px-6 py-4 font-bold text-center">Físico (Total)</th>
              <th className="px-6 py-4 font-bold text-center">Reservado</th>
              <th className="px-6 py-4 font-bold text-center">Disponible</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--theme-border) text-sm text-(--theme-text)">
            {inventory.map((item) => {
              //Alerta visual si está por debajo del stock mínimo
              const isLowStock = item.stockAvailable <= item.minStock;

              return (
                <tr 
                  key={item.id} 
                  className={`transition-colors hover:bg-primary/5 ${
                    isLowStock ? 'bg-amber-500/5' : ''
                  }`}
                >
                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center gap-2">
                      <Package className={`w-4 h-4 ${isLowStock ? 'text-amber-500' : 'opacity-40'}`} />
                      <span>{item.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs uppercase tracking-wider opacity-60 bg-(--theme-secondary-bg) px-2 py-1 rounded-md">
                      {item.categoryId}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center opacity-70 font-mono">{item.minStock}</td>
                  <td className="px-6 py-4 text-center font-mono">{item.stockTotal}</td>
                  <td className="px-6 py-4 text-center font-mono text-blue-400">{item.stockReserved}</td>
                  <td className="px-6 py-4 text-center font-mono font-bold">
                    {isLowStock ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-500">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.stockAvailable} (Bajo)
                      </span>
                    ) : (
                      <span className="text-green-500">{item.stockAvailable}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};