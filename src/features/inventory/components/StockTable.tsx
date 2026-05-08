import React, { useState } from 'react';

interface InventoryProduct {
  id: string;
  name: string;
  category: string;
  stockTotal: number;
  stockAvailable: number;
  stockReserved: number;
  enabled: boolean;
  image?: string; // campo de imagen
}

const mockData: InventoryProduct[] = [
  { id: 'prod1', name: 'Galletas de Avena Sansi', category: 'Snacks', stockTotal: 120, stockAvailable: 110, stockReserved: 10, enabled: true, image: 'https://via.placeholder.com/150' },
  { id: 'prod2', name: 'Refresco Cola 500ml', category: 'Bebidas', stockTotal: 50, stockAvailable: 50, stockReserved: 0, enabled: true, image: 'https://via.placeholder.com/150' },
  { id: 'prod3', name: 'Sándwich Jamón/Queso', category: 'Alimentos Prep.', stockTotal: 15, stockAvailable: 5, stockReserved: 10, enabled: false, image: 'https://via.placeholder.com/150' },
  { id: 'prod4', name: 'Agua Vital 1L', category: 'Bebidas', stockTotal: 200, stockAvailable: 200, stockReserved: 0, enabled: true, image: 'https://via.placeholder.com/150' },
];

export const StockTable: React.FC = () => {
  const [products] = useState<InventoryProduct[]>(mockData);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);

  return (
    <div className="space-y-6">
      {/* Grid de "Burbujitas" Rectangulares */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className={`flex flex-col items-center p-4 bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl transition-all hover:scale-105 hover:border-primary active:scale-95 ${!product.enabled && 'opacity-60 grayscale'}`}
          >
            {/* Imagen del producto */}
            <div className="w-24 h-24 mb-3 rounded-xl overflow-hidden bg-white flex items-center justify-center">
               <img src={product.image} alt={product.name} className="object-cover w-full h-full" />
            </div>
            
            {/* Nombre y Categoría */}
            <span className="font-['Outfit'] font-bold text-sm text-(--theme-text) text-center line-clamp-2">
              {product.name}
            </span>
            <span className="text-[0.65rem] uppercase tracking-widest text-(--theme-text) opacity-40 mt-1">
              {product.category}
            </span>
          </button>
        ))}
      </div>

      {/* "Modal" o Panel de Detalle (Se activa al pulsar una burbuja) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-4">
               <h3 className="font-['Outfit'] font-bold text-xl text-(--theme-text)">Detalles del Stock</h3>
               <button onClick={() => setSelectedProduct(null)} className="text-2xl text-(--theme-text) opacity-50">&times;</button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between border-b border-(--theme-border) pb-2">
                <span className="text-sm opacity-60">Stock Físico:</span>
                <span className="font-bold">{selectedProduct.stockTotal}</span>
              </div>
              <div className="flex justify-between border-b border-(--theme-border) pb-2">
                <span className="text-sm opacity-60">Disponible:</span>
                <span className={`font-bold ${selectedProduct.stockAvailable < 10 ? 'text-red-500' : 'text-green-500'}`}>
                  {selectedProduct.stockAvailable}
                </span>
              </div>
              <div className="flex justify-between border-b border-(--theme-border) pb-2">
                <span className="text-sm opacity-60">Reservado:</span>
                <span className="font-bold">{selectedProduct.stockReserved}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
               <button className="py-2.5 bg-primary text-white rounded-full font-bold text-xs uppercase tracking-wider">Ajustar</button>
               <button className="py-2.5 border border-(--theme-border) text-(--theme-text) rounded-full font-bold text-xs uppercase tracking-wider">
                 {selectedProduct.enabled ? 'Deshabilitar' : 'Habilitar'}
               </button>
            </div>
          </div>
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-20 text-(--theme-text) opacity-30">No hay productos.</div>
      )}
    </div>
  );
};