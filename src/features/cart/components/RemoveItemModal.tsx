import { Trash2, X } from 'lucide-react';
import type { CartItemWithProduct } from '../types';

interface Props {
  item: CartItemWithProduct;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveItemModal({ item, onClose, onConfirm }: Props) {
  const productName = item.product?.name ?? item.productId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-item-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500 dark:text-red-400">
            <Trash2 size={18} />
          </div>
          <h2
            id="remove-item-title"
            className="text-lg font-bold text-text-light"
          >
            Eliminar producto
          </h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-text-light opacity-70">
          ¿Está seguro/a de que quieres eliminar este producto?
          <span className="mt-1 block font-semibold text-text-light opacity-100">
            {productName}
          </span>
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-full border border-border-light bg-transparent px-4 py-3 text-sm font-semibold text-text-light transition hover:bg-secondary-bg-light active:scale-95"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
          >
            Eliminar
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-light opacity-70 transition hover:opacity-100"
          aria-label="Cerrar modal"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
