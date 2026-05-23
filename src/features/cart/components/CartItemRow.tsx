import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Check, Minus, Plus, Trash2 } from 'lucide-react';
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
  const [imageFailed, setImageFailed] = useState(false);

  const product = item.product;
  const price = item.unitPrice;
  const name = product?.name ?? item.productId;
  const imageUrl = product?.imageUrl ?? '';
  const productUrl = `/productos/${item.product?.slug ?? item.productId}`;
  const isInvalid = !item.isValid;
  const showPriceChange = item.priceChange !== 'none' && item.isValid;

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

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
      className={`flex gap-3 py-4 border-b border-border-light last:border-0 transition-opacity ${
        isInvalid ? 'opacity-70' : item.included ? 'opacity-100' : 'opacity-65'
      }`}
    >
      <label className={`inline-flex h-14 w-8 shrink-0 items-start justify-center pt-1 ${isInvalid ? 'cursor-not-allowed' : ''}`}>
        <input
          type="checkbox"
          checked={item.included && !isInvalid}
          disabled={isInvalid}
          onChange={(event) => onToggleIncluded(event.target.checked)}
          className="sr-only"
          aria-label={`Incluir ${name} en el total`}
        />
        <span
          className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
            isInvalid
              ? 'border-border-light bg-secondary-bg-light text-transparent'
              : item.included
              ? 'border-primary bg-primary text-white'
              : 'border-primary/45 bg-card-bg-light text-transparent shadow-[inset_0_0_0_1px_rgba(136,176,75,0.18)]'
          }`}
          aria-hidden="true"
        >
          <Check size={13} strokeWidth={3} className="text-white" />
        </span>
      </label>

      <a href={productUrl} className="shrink-0">
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={name}
            data-testid={`cart-item-image-${item.productId}`}
            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            data-testid={`cart-item-image-fallback-${item.productId}`}
            className="w-14 h-14 sm:w-16 sm:h-16 bg-secondary-bg-light rounded-lg flex items-center justify-center opacity-40"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
      </a>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <a href={productUrl} className="block line-clamp-1 font-semibold text-sm sm:text-base hover:text-primary transition-colors">
            {name}
          </a>
          <AnimatedAmount
            value={isInvalid ? 0 : price * item.quantity}
            className={`text-sm sm:text-base font-bold shrink-0 ${isInvalid ? 'text-text-light/40 line-through' : 'text-text-light'}`}
          />
        </div>
        <p className="text-xs sm:text-sm text-text-light opacity-50 mt-0.5">
          {showPriceChange && item.priceAtAdd != null ? (
            <>
              <span className="line-through opacity-60">Bs {item.priceAtAdd.toFixed(2)}</span>{' '}
              <span className={`font-semibold ${item.priceChange === 'increased' ? 'text-red-500' : 'text-primary'}`}>
                Bs {price.toFixed(2)}
              </span>
            </>
          ) : (
            <>Bs {price.toFixed(2)}</>
          )}
          {' / u'}
          <span className="opacity-60"> · Stock: {stock}</span>
        </p>

        {isInvalid && item.availabilityMessage && (
          <div
            role="alert"
            className="mt-2 flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-600 dark:text-red-400"
          >
            <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>{item.availabilityMessage}</span>
          </div>
        )}

        {showPriceChange && item.priceAtAdd != null && (
          <div
            role="status"
            className={`mt-2 flex items-start gap-2 rounded-md border px-2.5 py-1.5 text-xs ${
              item.priceChange === 'increased'
                ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                : 'border-primary/30 bg-primary/10 text-primary'
            }`}
          >
            {item.priceChange === 'increased' ? (
              <ArrowUpRight size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <ArrowDownRight size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              {item.priceChange === 'increased' ? 'El precio subió' : 'El precio bajó'} de Bs {item.priceAtAdd.toFixed(2)} a Bs {price.toFixed(2)}.
            </span>
          </div>
        )}
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={onDecrement}
              disabled={isInvalid || item.quantity <= 1}
              className="w-8 h-8 rounded-full border border-primary/40 bg-primary/10 text-primary inline-flex items-center justify-center hover:border-primary hover:bg-primary/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Disminuir cantidad"
            >
              <Minus size={14} strokeWidth={3} aria-hidden="true" />
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
                className="w-10 text-center text-sm sm:text-base font-semibold bg-transparent border border-primary rounded outline-none"
              />
            ) : (
              <button
                onClick={() => { setEditing(true); setDraft(String(item.quantity)); }}
                className="w-8 text-center text-sm sm:text-base font-semibold hover:text-primary transition-colors"
              >
                {item.quantity}
              </button>
            )}
            <button
              onClick={onIncrement}
              disabled={isInvalid || item.quantity >= stock}
              className="w-8 h-8 rounded-full border border-primary/40 bg-primary/10 text-primary inline-flex items-center justify-center hover:border-primary hover:bg-primary/20 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              aria-label="Aumentar cantidad"
            >
              <Plus size={14} strokeWidth={3} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary transition hover:border-primary hover:bg-primary/15 active:scale-95"
            aria-label={`Eliminar ${name}`}
            title="Eliminar producto"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
