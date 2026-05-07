

import React, { useState } from 'react';
// import { getInventoryFromFirebase } from '../inventoryService'; /

// 1. Definimos una Interface
interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  enabled: boolean;
}

// 2. DATOS SIMULADO
const mockData: InventoryProduct[] = [
  { id: 'prod1', name: 'Galletas de Avena Sansi', category: 'Snacks', stockTotal: 120, stockAvailable: 110, stockReserved: 10, enabled: true },
  { id: 'prod2', name: 'Refresco Cola 500ml', category: 'Bebidas', stockTotal: 50, stockAvailable: 50, stockReserved: 0, enabled: true },
  { id: 'prod3', name: 'Sándwich Jamón/Queso', category: 'Alimentos Prep.', stockTotal: 15, stockAvailable: 5, stockReserved: 10, enabled: false }, // Agotado/Deshabilitado
  { id: 'prod4', name: 'Agua Vital 1L', category: 'Bebidas', stockTotal: 200, stockAvailable: 200, stockReserved: 0, enabled: true },
];

export const StockTable: React.FC = () => {
  // mockData.
  const [products] = useState<InventoryProduct[]>(mockData);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-auto text-sm text-left">
        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
          <tr>
            <th scope="col" className="px-6 py-3 rounded-l-lg">Producto</th>
            <th scope="col" className="px-6 py-3">Categoría</th>
            <th scope="col" className="px-6 py-3 text-center">Stock Físico</th>
            <th scope="col" className="px-6 py-3 text-center">Disponible</th>
            <th scope="col" className="px-6 py-3 text-center">Reservado</th>
            <th scope="col" className="px-6 py-3 text-center">Estado</th>
            <th scope="col" className="px-6 py-3 rounded-r-lg">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
              <td className="px-6 py-4 font-medium text-gray-900">{product.name}</td>
              <td className="px-6 py-4 text-gray-600">{product.category}</td>
              <td className="px-6 py-4 text-center font-semibold">{product.stockTotal}</td>
              <td className="px-6 py-4 text-center">
                <span className={`font-bold ${product.stockAvailable < 10 ? 'text-red-600' : 'text-green-700'}`}>
                    {product.stockAvailable}
                </span>
              </td>
              <td className="px-6 py-4 text-center text-gray-500">{product.stockReserved}</td>
              <td className="px-6 py-4 text-center">
                {product.enabled ? (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Activo</span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Inactivo/Agotado</span>
                )}
              </td>
              <td className="px-6 py-4 space-x-2">
                <button className="text-blue-600 hover:underline">Ajustar</button>
                <button className={`${product.enabled ? 'text-red-600' : 'text-green-600'} hover:underline`}>
                    {product.enabled ? 'Deshabilitar' : 'Habilitar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {products.length === 0 && (
          <div className="text-center py-10 text-gray-500">No hay productos registrados en el inventario.</div>
      )}
    </div>
  );
};