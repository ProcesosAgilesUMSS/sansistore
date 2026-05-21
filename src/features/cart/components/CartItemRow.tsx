import { useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { AnimatedAmount } from './AnimatedAmount';
import type { CartItemWithProduct } from '../types';

interface Props {
  item: CartItemWithProduct;
  stock: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onSetQuantity: (quantity: number) => void;
  onToggleIncluded: (included: boolean) => void;
  onRemove: () => void;
}

export function CartItemRow({
  item,
  stock,
  onIncrement,
  onDecrement,
  onSetQuantity,
  onToggleIncluded,
  onRemove,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(item.quantity));

  const product = item.product;
  const price = product?.hasOffer && product?.offerPrice != null ? product.offerPrice : product?.price ?? 0;
  const name = product?.name ?? item.productId;
  const imageUrl = product?.imageUrl ?? '';
  const productUrl = `/productos/${item.product?.slug ?? item.productId}`;

  function commitQuantity() {
    setEditing(false);
    const n = parseInt(draft, 10);
    if (Number.isFinite(n) && n >= 1 && n <= stock) {
      onSetQuantity(n);
    } else if (n < 1) {
      onSetQuantity(1);
    } else {
      onSetQuantity(stock);
    }
    setDraft(String(item.quantity));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitQuantity();
    if (e.key === 'Escape') { setEditing(false); setDraft(String(item.quantity)); }
  }

  return (
    <div
      className={`flex gap-3 items-center py-4 border-b border-border-light last:border-0 transition-opacity ${
        item.included ? 'opacity-100' : 'opacity-65'
      }`}
    >
      <label className="inline-flex h-16 w-8 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={item.included}
          onChange={(event) => onToggleIncluded(event.target.checked)}
          className="sr-only"
          aria-label={`Incluir ${name} en el total`}
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            item.included
              ? 'border-primary bg-primary text-white'
              : 'border-primary/45 bg-card-bg-light text-transparent shadow-[inset_0_0_0_1px_rgba(136,176,75,0.18)]'
          }`}
          aria-hidden="true"
        >
          <Check size={13} strokeWidth={3} className="text-white" />
        </span>
      </label>

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
        <a href={productUrl} className="block line-clamp-1 font-semibold text-base hover:text-primary transition-colors">
          {name}
        </a>
        <p className="text-sm text-text-light opacity-50 mt-0.5">Bs {price.toFixed(2)} / u <span className="opacity-60">· Stock: {stock}</span></p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDecrement}
              disabled={item.quantity <= 1}
              className="w-7 h-7 rounded-full border border-border-light flex items-center justify-center text-sm hover:border-primary hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              −
            </button>
            {editing ? (
              <input
                type="text"
                inputMode="numeric"
                value={draft}
                onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ''))}
                onBlur={commitQuantity}
                onKeyDown={handleKeyDown}
                autoFocus
                className="w-10 text-center text-base font-semibold bg-transparent border border-primary rounded outline-none"
              />
            ) : (
              <button
                onClick={() => { setEditing(true); setDraft(String(item.quantity)); }}
                className="w-7 text-center text-base font-semibold hover:text-primary transition-colors"
              >
                {item.quantity}
              </button>
            )}
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition hover:border-primary hover:bg-primary/15 active:scale-95"
            aria-label={`Eliminar ${name}`}
            title="Eliminar producto"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
      <AnimatedAmount value={price * item.quantity} className="text-base font-bold text-text-light shrink-0" />
    </div>
  );
}