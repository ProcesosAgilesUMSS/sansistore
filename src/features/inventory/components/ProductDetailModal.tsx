import React, { useState } from 'react';
import {
  X,
  Tag,
  DollarSign,
  CheckCircle,
  XCircle,
  ExternalLink,
  Hash,
  Layers,
  ImageOff,
  CheckCircle2,
} from 'lucide-react';
import { type InventoryProduct } from '../models/product.model';
import { ProductThumb } from './ProductThumb';

interface Props {
  product: InventoryProduct;
  onClose: () => void;
  onToggleActive: () => void;
  onInitializeStock: (productId: string, quantity: number) => Promise<void>;
  onAdjustStock: (productId: string, quantityChange: number) => Promise<void>;
  canAdjustStock?: boolean;
}

export const ProductDetailModal: React.FC<Props> = ({
  product,
  onClose,
  onToggleActive,
  onInitializeStock,
  onAdjustStock,
  canAdjustStock = true,
}) => {
  const [initialQty, setInitialQty] = useState<number | ''>('');
  const [isInitializing, setIsInitializing] = useState(false);
  
  const [successQty, setSuccessQty] = useState<number | null>(null);
  const [hasInitializedLocal, setHasInitializedLocal] = useState(false);

  const [adjustQty, setAdjustQty] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  const handleInitialize = async () => {
    if (initialQty === '' || initialQty <= 0) return;
    
    setIsInitializing(true);
    try {
      await onInitializeStock(product.id, Number(initialQty));
      
      setSuccessQty(Number(initialQty));
      
      setHasInitializedLocal(true);
      
      setTimeout(() => {
        setSuccessQty(null);
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handleAdjust = async () => {
    const qty = Number(adjustQty);
    if (isNaN(qty) || qty === 0) return;

    setIsAdjusting(true);
    try {
      await onAdjustStock(product.id, qty);
      setAdjustQty('');
      // Mostrar feedback visual
      setSuccessQty(qty > 0 ? qty : qty); // Se puede reusar successQty para mostrar la alerta
      setTimeout(() => {
        setSuccessQty(null);
      }, 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      {successQty !== null && (
        <div className="absolute z-[60] flex flex-col items-center justify-center bg-(--theme-card-bg) border border-primary/30 shadow-2xl rounded-2xl p-6 animate-in zoom-in-95 fade-in duration-200">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="font-display font-bold text-lg text-(--theme-text)">¡Éxito!</p>
          <p className="text-sm text-(--theme-text) opacity-70 text-center mt-1">
            Operación realizada con <strong className="text-primary">{Math.abs(successQty)} unidades</strong>.
          </p>
        </div>
      )}

      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="relative h-48 bg-(--theme-secondary-bg) flex items-center justify-center overflow-hidden shrink-0">
          <ProductThumb
            src={product.imageUrl}
            alt={product.name}
            fallbackIcon={ImageOff}
            fallbackClassName="w-14 h-14 opacity-20 text-(--theme-text)"
          />

          {product.badge && (
            <span className="absolute top-3 left-3 bg-primary text-white text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {product.badge}
            </span>
          )}

          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-(--theme-text) opacity-40 mb-1">
              <Layers className="w-3 h-3" />
              {product.categoryId}
            </div>

            <h3 className="font-display font-bold text-lg text-(--theme-text) leading-tight">
              {product.name}
            </h3>

            {product.slug && (
              <div className="flex items-center gap-1 mt-0.5">
                <Hash className="w-3 h-3 opacity-30 text-(--theme-text)" />
                <span className="text-xs text-(--theme-text) opacity-30">
                  {product.slug}
                </span>
              </div>
            )}
          </div>

          {product.description && (
            <p className="text-sm text-(--theme-text) opacity-60 leading-relaxed">
              {product.description}
            </p>
          )}

          {/* Precio */}
          <div className="flex items-center gap-3">
            <DollarSign className="w-4 h-4 opacity-40 text-(--theme-text) shrink-0" />

            {product.hasOffer && product.offerPrice ? (
              <>
                <span className="font-display font-bold text-2xl text-primary">
                  ${product.offerPrice.toFixed(2)}
                </span>
                <span className="text-base text-(--theme-text) opacity-40 line-through">
                  ${product.price.toFixed(2)}
                </span>
                <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  -{Math.round(((product.price - product.offerPrice) / product.price) * 100)}%
                </span>
              </>
            ) : (
              <span className="font-display font-bold text-2xl text-(--theme-text)">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          <hr className="border-(--theme-border)" />

          {product.stockAvailable === 0 && !hasInitializedLocal && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-widest font-bold text-primary mb-2">
                  Inicialice Stock
                </span>
                <p className="text-xs opacity-70 mb-3 text-(--theme-text)">
                  Este producto no tiene existencias todavia. Ingresa el stock inicial contado físicamente.
                </p>
                
                <div className="flex flex-col gap-2.5">
                  <input
                    type="number"
                    min="0"
                    value={initialQty}
                    onChange={(e) => setInitialQty(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Cantidad inicial..."
                    className="w-full bg-(--theme-secondary-bg) border border-(--theme-border) text-(--theme-text) rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    disabled={isInitializing || initialQty === '' || initialQty <= 0}
                    onClick={handleInitialize}
                    className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-xs hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all shadow-md shadow-primary/10"
                  >
                    {isInitializing ? 'Cargando...' : 'Inicializar Stock'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ajuste de Stock */}
          {canAdjustStock && (product.stockAvailable > 0 || hasInitializedLocal) && (
            <div className="flex items-center gap-3 bg-(--theme-secondary-bg) p-3 rounded-2xl border border-(--theme-border)">
              <div className="flex flex-col flex-1">
                <span className="text-xs uppercase tracking-widest opacity-50 mb-1">Stock Actual</span>
                <span className="font-bold text-lg text-(--theme-text)">{product.stockAvailable} u.</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="+ / -"
                  className="w-20 bg-(--theme-card-bg) border border-(--theme-border) text-(--theme-text) rounded-xl px-2 py-2 text-sm focus:outline-none focus:border-primary text-center"
                />
                <button
                  onClick={handleAdjust}
                  disabled={isAdjusting || adjustQty === '' || Number(adjustQty) === 0}
                  className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs hover:brightness-110 disabled:opacity-50 transition-all shadow-md shadow-primary/10"
                >
                  {isAdjusting ? '...' : 'Guardar'}
                </button>
              </div>
            </div>
          )}

          {/* Estado */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-(--theme-text) opacity-60">
              Estado del producto
            </span>

            <span
              className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full flex items-center gap-1.5 ${
                product.active
                  ? 'bg-primary/10 text-primary'
                  : 'bg-(--theme-error-bg) text-(--theme-error)'
              }`}
            >
              {product.active ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {product.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {product.sourceUrl && (
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-(--theme-text) opacity-40 hover:opacity-70 underline truncate transition-opacity"
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              {product.sourceUrl}
            </a>
          )}
        </div>
        
        <div className="px-5 py-4 border-t border-(--theme-border) shrink-0">
          <button
            onClick={onToggleActive}
            className={`w-full py-2.5 border rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center ${
              product.active
                ? 'border-(--theme-error-border) text-(--theme-error)'
                : 'border-primary/30 text-primary'
            }`}
          >
            {product.active ? 'Deshabilitar' : 'Habilitar'}
          </button>
        </div>
      </div>
    </div>
  );
};