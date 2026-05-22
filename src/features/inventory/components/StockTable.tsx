import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { Package, XCircle } from 'lucide-react';
import { ProductDetailModal } from './ProductDetailModal';
import { type InventoryProduct } from '../models/product.model';
import { writeBatch } from 'firebase/firestore'; // 

type LoadingState = 'loading' | 'error' | 'success';

export const StockTable: React.FC = () => {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [status, setStatus] = useState<LoadingState>('loading');
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryProduct | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Traemos productos e inventario para cruzarlos
        const [prodSnap, invSnap] = await Promise.all([
          getDocs(collection(db, 'products')),
          getDocs(collection(db, 'inventory'))
        ]);

        const inventoryMap = Object.fromEntries(
          invSnap.docs.map(doc => [doc.id, doc.data()])
        );

        const data = prodSnap.docs.map((doc) => {
          const productData = doc.data();
          const invData = inventoryMap[doc.id] || { stockAvailable: 0 };
          return {
            id: doc.id,
            ...productData,
            // Inyectamos el stock actual para que el Modal sepa si debe mostrar el botón
            stockAvailable: invData.stockAvailable || 0,
          };
        }) as InventoryProduct[];

        setProducts(data);
        setStatus('success');
      } catch (err) {
        console.error('Error fetching products:', err);
        setStatus('error');
      }
    };

    fetchProducts();
  }, []);

  const handleInitializeStock = async (productId: string, quantity: number) => {
    try {
      const batch = writeBatch(db);
      
      const inventoryRef = doc(db, 'inventory', productId);
      batch.update(inventoryRef, {
        stockAvailable: quantity,
        stockTotal: quantity,
        updatedAt: new Date(),
        enabled: true
      });

      // Registro en inventoryMovements
      const movementRef = doc(collection(db, 'inventoryMovements'));
      batch.set(movementRef, {
        productId,
        type: 'INICIALIZACION',
        quantity,
        reason: 'Carga inicial de stock',
        date: new Date()
      });

      await batch.commit();

      // Actualizar estado local para que el botón desaparezca
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, stockAvailable: quantity } : p
      ));
      if (selectedProduct?.id === productId) {
        setSelectedProduct({ ...selectedProduct, stockAvailable: quantity });
      }

      //alert('¡Stock inicializado con éxito!');
    } catch (err) {
      console.error("Error", err);
      alert('Error al inicializar stock.');
    }
  };


  const handleToggleActive = async () => {
    if (!selectedProduct) return;
    try {
      await updateDoc(doc(db, 'products', selectedProduct.id), {
        active: !selectedProduct.active,
      });
      const updated = { ...selectedProduct, active: !selectedProduct.active };
      setProducts((prev) =>
        prev.map((p) => (p.id === selectedProduct.id ? updated : p))
      );
      setSelectedProduct(updated);
    } catch (err) {
      console.error('Error actualizando producto:', err);
      alert('No se pudo actualizar el estado del producto.');
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-20 text-(--theme-text) opacity-40 gap-3">
        <Package className="animate-pulse w-6 h-6" />
        <span>Cargando productos...</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="text-center py-20 text-red-400">
        <XCircle className="w-10 h-10 mx-auto mb-3 opacity-60" />
        <p className="font-bold mb-1">No se pudo cargar el inventario</p>
        <p className="text-sm opacity-70">
          Verifica tu conexión o los permisos de Firestore
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid de productos */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className={`relative flex flex-col items-center p-4 bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl transition-all hover:scale-105 hover:border-primary active:scale-95 ${
              !product.active && 'opacity-60 grayscale'
            }`}
          >
            {/* Badge */}
            {product.badge && (
              <span className="absolute top-2 left-2 bg-primary text-white text-[0.55rem] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                {product.badge}
              </span>
            )}

            <div className="w-24 h-24 mb-3 rounded-xl overflow-hidden bg-white flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Package className="w-10 h-10 opacity-20 text-gray-400" />
              )}
            </div>
            <span className="font-['Outfit'] font-bold text-sm text-(--theme-text) text-center line-clamp-2">
              {product.name}
            </span>
            <span className="text-[0.65rem] uppercase tracking-widest text-(--theme-text) opacity-40 mt-1">
              {product.categoryId}
            </span>
          </button>
        ))}
      </div>

      {/* Panel de detalle */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onToggleActive={handleToggleActive}
          onInitializeStock={handleInitializeStock} // Nueva prop
        />
      )}

      {status === 'success' && products.length === 0 && (
        <div className="text-center py-20 text-(--theme-text) opacity-30 flex flex-col items-center gap-3">
          <Package className="w-12 h-12" />
          <span>No hay productos registrados.</span>
        </div>
      )}
    </div>
  );
};
