import { Trash2 } from 'lucide-react';
import { AnimatedAmount } from './AnimatedAmount';
import type { CartItemWithProduct } from '../types';

interface Props {
  item: CartItemWithProduct;
  stock: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onToggleIncluded: (included: boolean) => void;
  onRemove: () => void;
  error?: string | null;
}

export function CartItemRow({
  item,
  stock,
  onIncrement,
  onDecrement,
  onToggleIncluded,
  onRemove,
  error,
}: Props) {
  const product = item.product;
  const price = product?.hasOffer && product?.offerPrice != null ? product.offerPrice : product?.price ?? 0;
  const name = product?.name ?? item.productId;
  const imageUrl = product?.imageUrl ?? '';
  const productUrl = `/productos/${item.product?.slug ?? item.productId}`;

  return (
    <div
      className={`flex gap-3 items-center py-4 border-b border-border-light last:border-0 transition-opacity ${
        item.included ? 'opacity-100' : 'opacity-65'
      }`}
    >
      <a href={productUrl} className="shrink-0">
        {imageUrl ? (
          <img src={imageUrl} alt={name} className="w-16 h-16 object-cover rounded-lg" />
        ) : (
          <div className="w-16 h-16 bg-secondary-bg-light rounded-lg flex items-center justify-center opacity-40">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </a>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <a href={productUrl} className="block font-semibold text-base truncate hover:text-primary transition-colors">
            {name}
          </a>
          <label className="inline-flex items-center gap-2 text-xs font-medium text-text-light shrink-0">
            <input
              type="checkbox"
              checked={item.included}
              onChange={(event) => onToggleIncluded(event.target.checked)}
              className="h-4 w-4 rounded border-border-light text-primary focus:ring-primary"
              aria-label={`Incluir ${name} en el total`}
            />
            Incluir
          </label>
        </div>
        <p className="text-sm text-text-light opacity-50 mt-0.5">Bs {price.toFixed(2)} / u</p>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDecrement}
              disabled={item.quantity <= 1}
              className="w-7 h-7 rounded-full border border-border-light flex items-center justify-center text-sm hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            <span className="w-7 text-center text-base font-semibold">{item.quantity}</span>
            <button
              onClick={onIncrement}
              disabled={item.quantity >= stock}
              className="w-7 h-7 rounded-full border border-border-light flex items-center justify-center text-sm hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              +
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 rounded-full border border-border-light px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-500/10"
            aria-label={`Eliminar ${name}`}
            title="Eliminar producto"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      </div>
      <AnimatedAmount value={price * item.quantity} className="text-base font-bold text-text-light shrink-0" />
    </div>
  );
}