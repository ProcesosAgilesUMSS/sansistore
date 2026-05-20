import { useState, useEffect } from 'react';
import { CartItemRow } from './CartItemRow';
import type { CartItemWithProduct } from '../types';
import { useCartContext, CartProvider } from './CartContext';

function CartViewInner() {
  const { itemsWithProducts, loading, updateQuantity } = useCartContext();
  const [enriched, setEnriched] = useState<(CartItemWithProduct & { error?: string })[]>([]);

  useEffect(() => {
    setEnriched(itemsWithProducts.map((i) => ({ ...i, error: undefined })));
  }, [itemsWithProducts]);

  async function handleIncrement(productId: string, stock: number) {
    const ok = await updateQuantity(productId, 1, stock);
    if (!ok) {
      setEnriched((prev) => prev.map((i) => {
        if (i.productId === productId) {
          return { ...i, error: 'No puedes agregar más unidades.' };
        }
        return i;
      }));
      setTimeout(() => {
        setEnriched((prev) => prev.map((i) => {
          if (i.productId === productId) {
            return { ...i, error: undefined };
          }
          return i;
        }));
      }, 3000);
    }
  }

  async function handleDecrement(productId: string, stock: number) {
    await updateQuantity(productId, -1, stock);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (enriched.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-30"
        >
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
        <p className="text-lg font-medium opacity-60">Tu carrito está vacío</p>
        <a
          href="/productos"
          className="inline-flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Comprar ahora
        </a>
      </div>
    );
  }

  return (
    <section className="bg-card-bg-light rounded-xl border border-border-light p-4">
      <h2 className="text-lg font-semibold mb-2">Productos ({enriched.length})</h2>
      {enriched.map((item) => (
        <CartItemRow
          key={item.productId}
          item={item}
          stock={item.product?.stockAvailable ?? 999}
          error={item.error}
          onIncrement={() => handleIncrement(item.productId, item.product?.stockAvailable ?? 999)}
          onDecrement={() => handleDecrement(item.productId, item.product?.stockAvailable ?? 999)}
        />
      ))}
    </section>
  );
}

export function CartView() {
  return (
    <CartProvider>
      <CartViewInner />
    </CartProvider>
  );
}