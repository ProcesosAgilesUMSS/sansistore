import React, { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { PackageOpen, CheckCircle2, RefreshCw } from 'lucide-react';

interface ProductOption {
  id: string;
  name: string;
}

export const StockMovementForm: React.FC = () => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const snap = await getDocs(collection(db, 'products'));
        setProducts(snap.docs.map(doc => ({ id: doc.id, name: doc.data().name || doc.id })));
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const batch = writeBatch(db);
      const inventoryRef = doc(db, 'inventory', selectedProductId);
      const movementRef = doc(collection(db, 'inventoryMovements'));

      // Si es salida, el incremento es negativo
      const qtyChange = movementType === 'ENTRADA' ? quantity : -quantity;

      // Actualizar el inventario de manera atómica (merge por si el doc no existe)
      batch.set(inventoryRef, {
        stockTotal: increment(qtyChange),
        stockAvailable: increment(qtyChange),
        updatedAt: serverTimestamp(),
        enabled: true
      }, { merge: true });

      // Registrar en el historial
      batch.set(movementRef, {
        productId: selectedProductId,
        type: movementType,
        quantity: quantity, // guardamos el valor absoluto
        operatorId: 'operador_sansi',
        reason: reason || (movementType === 'ENTRADA' ? 'Abastecimiento de stock' : 'Salida de stock'),
        date: serverTimestamp()
      });

      await batch.commit();

      setSuccessMessage(`¡${movementType} registrada con éxito!`);
      setQuantity(0);
      setReason('');
      setSelectedProductId('');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center opacity-50 py-10">Cargando productos...</div>;
  }

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b border-(--theme-border) pb-4">
        <PackageOpen className="w-5 h-5 text-primary" />
        <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">
          Registrar Operación
        </h2>
      </div>

      {successMessage && (
        <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Selector de Tipo (Preparado para la siguiente US) */}
        <div className="grid grid-cols-2 gap-3 p-1 bg-(--theme-secondary-bg) rounded-xl border border-(--theme-border)">
          <button
            type="button"
            onClick={() => setMovementType('ENTRADA')}
            className={`py-2 text-sm font-bold rounded-lg transition-all ${
              movementType === 'ENTRADA' ? 'bg-green-500 text-white shadow-md' : 'text-(--theme-text) opacity-50 hover:opacity-100'
            }`}
          >
            ENTRADA
          </button>
          <button
            type="button"
            onClick={() => setMovementType('SALIDA')}
            className={`py-2 text-sm font-bold rounded-lg transition-all ${
              movementType === 'SALIDA' ? 'bg-red-500 text-white shadow-md' : 'text-(--theme-text) opacity-50 hover:opacity-100'
            }`}
          >
            SALIDA
          </button>
        </div>

        <div className="space-y-1">
          <label className="text-xs uppercase tracking-wider font-bold opacity-60">Producto</label>
          <select
            required
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Selecciona un producto...</option>
            {products.map(prod => (
              <option key={prod.id} value={prod.id}>{prod.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-bold opacity-60">Cantidad</label>
            <input
              type="number"
              required min="1"
              value={quantity || ''}
              onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
              className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none"
              placeholder="Ej. 50"
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs uppercase tracking-wider font-bold opacity-60">Motivo (Opcional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none"
              placeholder={movementType === 'ENTRADA' ? 'Ej. Lote nuevo' : 'Ej. Venta'}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedProductId || quantity <= 0}
          className={`w-full mt-2 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            movementType === 'ENTRADA' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'
          } disabled:opacity-50 disabled:grayscale`}
        >
          {isSubmitting ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Confirmar Operación'}
        </button>
      </form>
    </div>
  );
};