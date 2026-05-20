import type { CartItemWithProduct } from '../types';

interface Props {
  item: CartItemWithProduct;
  stock: number;
  onIncrement: () => void;
  onDecrement: () => void;
  error?: string | null;
}

export function CartItemRow({ item, stock, onIncrement, onDecrement, error }: Props) {
  const product = item.product;
  const price = product?.hasOffer && product?.offerPrice != null ? product.offerPrice : product?.price ?? 0;
  const name = product?.name ?? item.productId;
  const imageUrl = product?.imageUrl ?? '';
  const productUrl = `/productos/${item.product?.slug ?? item.productId}`;

  return (
    <div className="flex gap-3 items-center py-4 border-b border-border-light last:border-0">
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
        <a href={productUrl} className="block font-semibold text-base truncate hover:text-primary transition-colors">
          {name}
        </a>
        <p className="text-sm text-text-light opacity-50 mt-0.5">Bs {price.toFixed(2)} / u</p>
        {error && (
          <p className="text-xs text-red-500 mt-1">{error}</p>
        )}
        <div className="flex items-center gap-1.5 mt-2">
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
      </div>
      <span className="text-base font-bold text-text-light shrink-0">
        Bs {(price * item.quantity).toFixed(2)}
      </span>
    </div>
  );
}