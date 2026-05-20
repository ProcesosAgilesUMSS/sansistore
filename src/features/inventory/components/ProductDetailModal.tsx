import React, { useState } from 'react'; // 1. Agregado useState al import
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
} from 'lucide-react';
import { type InventoryProduct } from '../models/product.model';

interface Props {
  product: InventoryProduct;
  onClose: () => void;
  onToggleActive: () => void;
  onInitializeStock: (productId: string, quantity: number) => Promise<void>;
}

export const ProductDetailModal: React.FC<Props> = ({
  product,
  onClose,
  onToggleActive,
  onInitializeStock
}) => {
  // 2. Los Hooks movidos DENTRO de la función del componente
  const [initialQty, setInitialQty] = useState<number>(0);
  const [isInitializing, setIsInitializing] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* ── Imagen hero ── */}
        <div className="relative h-48 bg-(--theme-secondary-bg) flex items-center justify-center overflow-hidden shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="object-cover w-full h-full"
            />
          ) : (
            <ImageOff className="w-14 h-14 opacity-20 text-(--theme-text)" />
          )}

          {/* Badge */}
          {product.badge && (
            <span className="absolute top-3 left-3 bg-primary text-white text-[0.6rem] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              {product.badge}
            </span>
          )}

          {/* Botón cerrar */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Contenido scrolleable ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Nombre, slug y categoría */}
          <div>
            <div className="flex items-center gap-1.5 text-[0.65rem] uppercase tracking-widest text-(--theme-text) opacity-40 mb-1">
              <Layers className="w-3 h-3" />
              {product.categoryId}
            </div>

            <h3 className="font-['Outfit'] font-bold text-xl text-(--theme-text) leading-tight">
              {product.name}
            </h3>

            {product.slug && (
              <div className="flex items-center gap-1 mt-0.5">
                <Hash className="w-3 h-3 opacity-30 text-(--theme-text)" />
                <span className="text-[0.65rem] text-(--theme-text) opacity-30">
                  {product.slug}
                </span>
              </div>
            )}
          </div>

          {/* Descripción */}
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
                <span className="font-['Outfit'] font-bold text-2xl text-green-500">
                  ${product.offerPrice.toFixed(2)}
                </span>

                <span className="text-base text-(--theme-text) opacity-40 line-through">
                  ${product.price.toFixed(2)}
                </span>

                <span className="text-[0.65rem] bg-green-500/15 text-green-500 font-bold px-2 py-0.5 rounded-full">
                  -
                  {Math.round(
                    ((product.price - product.offerPrice) / product.price) * 100
                  )}
                  %
                </span>
              </>
            ) : (
              <span className="font-['Outfit'] font-bold text-2xl text-(--theme-text)">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Divider */}
          <hr className="border-(--theme-border)" />

          {/* Formulario de Inicialización (US #60) */}
          {product.stockAvailable === 0 && (
            <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
              <div className="flex flex-col">
                <span className="text-[0.65rem] uppercase tracking-widest font-bold text-primary mb-2">
                  Inicialice Stock
                </span>
                <p className="text-[0.7rem] opacity-70 mb-3">
                  Este producto no tiene existencias todavia. Ingresa el stock inicial contado físicamente.
                </p>
                
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={initialQty}
                    onChange={(e) => setInitialQty(Number(e.target.value))}
                    placeholder="Cantidad..."
                    className="flex-1 bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  />
                  <button
                    disabled={isInitializing || initialQty <= 0}
                    onClick={async () => {
                      setIsInitializing(true);
                      await onInitializeStock(product.id, initialQty);
                      setIsInitializing(false);
                    }}
                    className="bg-primary text-white px-4 py-2 rounded-xl font-bold text-xs hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all"
                  >
                    {isInitializing ? 'Cargando...' : 'Inicializar'}
                  </button>
                </div>
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
                  ? 'bg-green-500/15 text-green-500'
                  : 'bg-red-500/15 text-red-500'
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

          {/* Source URL */}
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
        
        {/* ── Acciones fijas al fondo ── */}
        <div className="px-5 py-4 border-t border-(--theme-border) shrink-0">
          <button
            onClick={onToggleActive}
            className={`w-full py-2.5 border rounded-full font-bold text-xs uppercase tracking-wider flex items-center justify-center ${
              product.active
                ? 'border-red-400 text-red-400'
                : 'border-green-500 text-green-500'
            }`}
          >
            {product.active ? 'Deshabilitar' : 'Habilitar'}
          </button>
        </div>
      </div>
    </div>
  );
};