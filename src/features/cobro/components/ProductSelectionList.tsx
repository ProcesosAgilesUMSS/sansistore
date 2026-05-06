import { Minus, Package, Plus } from 'lucide-react';
import type { CashOnDeliveryOrderItem, CobroProduct } from '../types';
import { formatMoney, getProductPrice } from '../utils/money';

interface ProductSelectionListProps {
  loading: boolean;
  products: CobroProduct[];
  quantities: Record<string, number>;
  selectedItems: CashOnDeliveryOrderItem[];
  onQuantityChange: (productId: string, nextQuantity: number) => void;
}

export function ProductSelectionList({
  loading,
  products,
  quantities,
  selectedItems,
  onQuantityChange,
}: ProductSelectionListProps) {
  return (
    <div className="rounded-lg border border-border-light bg-card-bg-light p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-text-light">
          Productos para el pedido
        </h3>
        <span className="text-sm font-semibold text-text-light opacity-60">
          {selectedItems.length} seleccionados
        </span>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-lg bg-secondary-bg-light"
            />
          ))}
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="flex min-h-40 flex-col items-center justify-center rounded-lg border border-dashed border-border-light text-center">
          <Package size={32} className="mb-2 text-text-light opacity-30" />
          <p className="text-sm font-semibold text-text-light">
            No hay productos disponibles para crear el pedido.
          </p>
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((product) => {
            const quantity = quantities[product.id] ?? 0;

            return (
              <article
                key={product.id}
                className="grid grid-cols-[72px_1fr] gap-3 rounded-lg border border-border-light p-3"
              >
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-md bg-secondary-bg-light">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package size={24} className="text-text-light opacity-30" />
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="truncate text-sm font-bold text-text-light">
                    {product.name}
                  </h4>
                  <p className="mt-1 text-sm font-semibold text-primary">
                    {formatMoney(getProductPrice(product))}
                  </p>

                  <div className="mt-3 flex h-9 w-32 items-center justify-between rounded-full border border-border-light">
                    <button
                      type="button"
                      aria-label={`Disminuir ${product.name}`}
                      onClick={() => onQuantityChange(product.id, quantity - 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-text-light transition hover:text-primary"
                    >
                      <Minus size={15} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-text-light">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Aumentar ${product.name}`}
                      onClick={() => onQuantityChange(product.id, quantity + 1)}
                      className="flex h-9 w-9 items-center justify-center rounded-full text-text-light transition hover:text-primary"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
