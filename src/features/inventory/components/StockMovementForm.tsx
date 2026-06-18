import React, { useState, useEffect } from 'react';
import { collection, getDocs, writeBatch, doc, getDoc, serverTimestamp, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../../../lib/firebase';
import { PackageOpen, CheckCircle2, RefreshCw, AlertCircle, TrendingUp, X } from 'lucide-react';

interface ProductOption {
  id: string;
  name: string;
  categoryId: string;
  currentPrice: number; // Agregamos el precio actual del producto
}

interface CategoryOption {
  id: string;
  name: string;
}

export const StockMovementForm: React.FC = () => {
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState('TODAS');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [movementType, setMovementType] = useState<'ENTRADA' | 'SALIDA'>('ENTRADA');
  const [quantity, setQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [totalCost, setTotalCost] = useState<number>(0); 
  
  // Estados para el Modal de Precio
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [newSalesPrice, setNewSalesPrice] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const ENTRADA_REASONS = ['Lote nuevo', 'Devolución de pedido', 'Corrección de inventario'];
  const SALIDA_REASONS = ['Mermas o defectos', 'Corrección de inventario', 'Robo / Pérdida'];

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const [categoriesSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, 'categories')),
          getDocs(collection(db, 'products'))
        ]);

        const loadedCategories = categoriesSnap.docs
          .map(doc => ({
            id: doc.id,
            name: doc.data().name || 'Sin nombre',
            active: doc.data().active ?? true
          }))
          .filter(cat => cat.active);

        const loadedProducts = productsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.id,
          categoryId: doc.data().categoryId || '',
          currentPrice: doc.data().price || 0 // Capturamos el precio de BD
        }));

        setCategories(loadedCategories);
        setProducts(loadedProducts);
      } catch (error) {
        setErrorMessage("Error al cargar los productos y categorías.");
      } finally {
        setLoading(false);
      }
    };
    fetchFormData();
  }, []);

  const handleMovementTypeChange = (type: 'ENTRADA' | 'SALIDA') => {
    setMovementType(type);
    setReason('');
    setTotalCost(0);
  };

  const selectedProductData = products.find(p => p.id === selectedProductId);
  const isNewBatch = movementType === 'ENTRADA' && reason === 'Lote nuevo';

  // Paso 1: Interceptar el botón Confirmar para abrir el Modal si es Lote Nuevo
  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (isNewBatch) {
      if (totalCost <= 0) {
        setErrorMessage('Por favor, define un precio válido y mayor a 0 para el nuevo lote.');
        return;
      }
      // Inicializar el nuevo precio con el precio actual por defecto
      setNewSalesPrice(selectedProductData?.currentPrice || 0);
      setShowPriceModal(true);
    } else {
      // Si no es lote nuevo, ejecutamos el guardado normal directamente
      executeSubmit();
    }
  };

  // Paso 2: Ejecución real en Firebase (Batch atómico)
  const executeSubmit = async () => {
    setIsSubmitting(true);
    setShowPriceModal(false); // Cerramos modal si estaba abierto

    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("No hay una sesión activa. Por favor, inicia sesión.");

      const inventoryRef = doc(db, 'inventory', selectedProductId);
      const productRef = doc(db, 'products', selectedProductId);
      
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

      // 1. Actualizar Inventario
      batch.set(inventoryRef, {
        stockTotal: increment(qtyChange),
        stockAvailable: increment(qtyChange),
        updatedAt: serverTimestamp(),
        enabled: true
      }, { merge: true });

      // 2. Registrar el Historial de Movimiento
      const movementData: any = {
        productId: selectedProductId,
        type: movementType,
        quantity: quantity, 
        operatorId: currentUser.uid,
        reason: reason,
        createdAt: serverTimestamp(),
        sequence: 1
      };

      if (isNewBatch) {
        movementData.totalCost = totalCost; // Inversión total
        movementData.unitCost = Number((totalCost / quantity).toFixed(2)); // Ayuda contable futura
      }

      batch.set(movementRef, movementData);

      // 3. Actualizar el Precio de Venta en el Catálogo de Productos (Requerimiento del docente)
      if (isNewBatch && newSalesPrice > 0) {
        batch.update(productRef, {
          price: newSalesPrice
        });
      }

      await batch.commit();

      // Actualizar el estado local del producto para que el dropdown muestre el nuevo precio sin recargar
      if (isNewBatch && newSalesPrice > 0) {
        setProducts(products.map(p => p.id === selectedProductId ? { ...p, currentPrice: newSalesPrice } : p));
      }

      setSuccessMessage(`¡Operación registrada con éxito!`);
      setQuantity(0);
      setReason('');
      setTotalCost(0);
      setSelectedProductId('');
      setSelectedCategoryId('TODAS');
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: any) {
      setErrorMessage(error.message || "Error al registrar el movimiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="text-center opacity-50 py-10">Cargando catálogo...</div>;

  const filteredProducts = selectedCategoryId === 'TODAS' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategoryId);

  const isFormValid = selectedProductId && quantity > 0 && reason !== '' && (!isNewBatch || totalCost > 0);

  // Cálculo de ayuda para el Modal
  const unitCostCalculation = quantity > 0 ? (totalCost / quantity).toFixed(2) : '0.00';

  return (
    <div className="relative">
      {/* --- FORMULARIO PRINCIPAL --- */}
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

        <form onSubmit={handlePreSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-3 p-1 bg-(--theme-secondary-bg) rounded-xl border border-(--theme-border)">
            <button
              type="button"
              onClick={() => handleMovementTypeChange('ENTRADA')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                movementType === 'ENTRADA' ? 'bg-green-500 text-white shadow-md' : 'text-(--theme-text) opacity-50 hover:opacity-100'
              }`}
            >
              ENTRADA
            </button>
            <button
              type="button"
              onClick={() => handleMovementTypeChange('SALIDA')}
              className={`py-2 text-sm font-bold rounded-lg transition-all ${
                movementType === 'SALIDA' ? 'bg-red-500 text-white shadow-md' : 'text-(--theme-text) opacity-50 hover:opacity-100'
              }`}
            >
              SALIDA
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60">Categoría</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setSelectedProductId(''); 
                }}
                className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none text-(--theme-text)"
              >
                <option value="TODAS">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60">Producto</label>
              <select
                required
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none text-(--theme-text)"
              >
                <option value="">Selecciona un producto...</option>
                {filteredProducts.map(prod => (
                  <option key={prod.id} value={prod.id}>{prod.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${isNewBatch ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60">Cantidad (Unidades)</label>
              <input
                type="number"
                required 
                min="1"
                value={quantity || ''}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none text-(--theme-text)"
                placeholder="Ej. 50"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60">Motivo</label>
              <select
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none text-(--theme-text)"
              >
                <option value="">Selecciona un motivo...</option>
                {(movementType === 'ENTRADA' ? ENTRADA_REASONS : SALIDA_REASONS).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            {isNewBatch && (
              <div className="space-y-1 animate-[fadeIn_0.2s_ease-out]">
                <label className="text-xs uppercase tracking-wider font-bold text-green-500">
                  Precio Total Compra Lote (Bs.)
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={totalCost || ''}
                  onChange={(e) => setTotalCost(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-(--theme-secondary-bg) border border-green-500/40 rounded-xl px-4 py-3 text-sm focus:border-green-500 focus:outline-none text-(--theme-text)"
                  placeholder="Ej. 450.00"
                />
              </div>
            )}
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

      {/* --- MODAL DE CONFIRMACIÓN DE PRECIO DE VENTA --- */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 w-full max-w-md shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2 text-primary">
                <TrendingUp className="w-6 h-6" />
                <h3 className="font-['Outfit'] font-bold text-xl text-(--theme-text)">Margen y Venta</h3>
              </div>
              <button onClick={() => setShowPriceModal(false)} className="opacity-50 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm opacity-80 mb-6">
              Estás registrando un nuevo lote de <strong>{selectedProductData?.name}</strong>. Revisa los costos y ajusta el precio de venta al público si es necesario.
            </p>

            <div className="bg-(--theme-secondary-bg) rounded-xl p-4 mb-6 space-y-3 border border-(--theme-border)">
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Costo Total del Lote:</span>
                <span className="font-bold">{totalCost} Bs.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Cantidad de Unidades:</span>
                <span className="font-bold">{quantity} u.</span>
              </div>
              <div className="pt-2 mt-2 border-t border-(--theme-border) flex justify-between text-sm">
                <span className="font-bold text-orange-500">Costo Unitario (Compra):</span>
                <span className="font-bold text-orange-500">{unitCostCalculation} Bs. c/u</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="opacity-70">Precio de Venta Actual:</span>
                <span className="font-bold">{selectedProductData?.currentPrice || 0} Bs.</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              <label className="text-xs uppercase tracking-wider font-bold opacity-60">
                Nuevo Precio de Venta al Público (Bs.)
              </label>
              <input
                type="number"
                min={unitCostCalculation} // Evita que venda por debajo del costo
                step="0.10"
                value={newSalesPrice}
                onChange={(e) => setNewSalesPrice(Number(e.target.value))}
                className="w-full bg-(--theme-secondary-bg) border-2 border-primary rounded-xl px-4 py-3 text-lg font-bold focus:outline-none"
              />
              <p className="text-[11px] opacity-60 text-center">
                El precio debe ser mayor al costo unitario para generar ganancia.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-500/20 hover:bg-gray-500/30 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={executeSubmit}
                disabled={isSubmitting || newSalesPrice <= 0}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-green-500 hover:bg-green-400 text-white transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};