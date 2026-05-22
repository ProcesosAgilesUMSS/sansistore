import React, { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { PackageOpen, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState('');

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
    setErrorMessage('');
    setSuccessMessage('');

    // Validación 1: Datos completos y motivo de 10 caracteres
    if (!selectedProductId || quantity <= 0) return;
    if (reason.trim().length < 10) {
      setErrorMessage('El motivo debe tener al menos 10 caracteres.');
      return;
    }

    setIsSubmitting(true);

    try {
      const inventoryRef = doc(db, 'inventory', selectedProductId);
      
      // Validación 2: Evitar stock negativo si es SALIDA (Ajuste/Merma)
      if (movementType === 'SALIDA') {
        const invSnap = await getDoc(inventoryRef);
        const currentStock = invSnap.exists() ? (invSnap.data().stockTotal || 0) : 0;
        
        if (currentStock < quantity) {
          throw new Error(`Insuficiente stock físico. (Actual: ${currentStock}, Intento de salida: ${quantity})`);
        }
      }

      const batch = writeBatch(db);
      const movementRef = doc(collection(db, 'inventoryMovements'));

      const qtyChange = movementType === 'ENTRADA' ? quantity : -quantity;

      // Actualización atómica
      batch.set(inventoryRef, {
        stockTotal: increment(qtyChange),
        stockAvailable: increment(qtyChange),
        updatedAt: serverTimestamp(),
        enabled: true
      }, { merge: true });

      // Registro en el historial
      batch.set(movementRef, {
        productId: selectedProductId,
        type: movementType,
        quantity: quantity, 
        operatorId: 'operador_sansi', // Esto debería venir de la sesión del usuario idealmente
        reason: reason.trim(), // Enviamos el motivo obligatorio limpio de espacios
        date: serverTimestamp()
      });

      await batch.commit();

      setSuccessMessage(`¡${movementType} registrada con éxito!`);
      setQuantity(0);
      setReason('');
      setSelectedProductId('');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Error al registrar el movimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center opacity-50 py-10">Cargando productos...</div>;
  }

  // Validación para habilitar el botón
  const isFormValid = selectedProductId && quantity > 0 && reason.trim().length >= 10;

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-6 border-b border-(--theme-border) pb-4">
        <PackageOpen className="w-5 h-5 text-primary" />
        <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">
          Registrar Ajuste / Operación
        </h2>
      </div>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-bold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="text-xs uppercase tracking-wider font-bold opacity-60">
              Motivo (Obligatorio)
            </label>
            <input
              type="text"
              required
              minLength={10}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={`w-full bg-(--theme-secondary-bg) border rounded-xl px-4 py-3 text-sm focus:outline-none ${
                reason.length > 0 && reason.length < 10 ? 'border-red-500 focus:border-red-500' : 'border-(--theme-border) focus:border-primary'
              }`}
              placeholder={movementType === 'ENTRADA' ? 'Ej. Lote nuevo o pedidos cancelados' : 'Ej. Mermas o defectos'}
            />
            {reason.length > 0 && reason.length < 10 && (
              <p className="text-[10px] text-red-500 mt-1">Faltan {10 - reason.length} caracteres.</p>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isFormValid}
          className={`w-full mt-2 text-white py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
            movementType === 'ENTRADA' ? 'bg-green-500 hover:bg-green-400' : 'bg-red-500 hover:bg-red-400'
          } disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed`}
        >
          {isSubmitting ? <RefreshCw className="animate-spin w-4 h-4" /> : 'Confirmar Operación'}
        </button>
      </form>
    </div>
  );
};