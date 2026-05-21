import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ShoppingBag } from 'lucide-react';
import { CartItemRow } from './CartItemRow';
import { AnimatedAmount } from './AnimatedAmount';
import type { CartItemWithProduct } from '../types';
import { useCartContext, CartProvider } from './CartContext';

function CartViewInner() {
  const { itemsWithProducts, loading, updateQuantity, removeItem } = useCartContext();
  const [includedById, setIncludedById] = useState<Record<string, boolean>>({});
  const [errorsById, setErrorsById] = useState<Record<string, string | undefined>>({});
  const [summaryOpen, setSummaryOpen] = useState(true);

  useEffect(() => {
    setIncludedById((current) => {
      const next: Record<string, boolean> = {};
      for (const item of itemsWithProducts) {
        next[item.productId] = current[item.productId] ?? true;
      }
      return next;
    });
    setErrorsById((current) => {
      const next: Record<string, string | undefined> = {};
      for (const item of itemsWithProducts) {
        next[item.productId] = current[item.productId];
      }
      return next;
    });
  }, [itemsWithProducts]);

  const enriched = useMemo(
    () =>
      itemsWithProducts.map((item) => ({
        ...item,
        included: includedById[item.productId] ?? true,
        error: errorsById[item.productId],
      })),
    [errorsById, includedById, itemsWithProducts],
  );

  const includedItems = useMemo(
    () => enriched.filter((item) => item.included),
    [enriched],
  );

  const subtotal = useMemo(
    () => includedItems.reduce((sum, item) => {
      const price = item.product?.hasOffer && item.product?.offerPrice != null
        ? item.product.offerPrice
        : item.product?.price ?? 0;
      return sum + price * item.quantity;
    }, 0),
    [includedItems],
  );

  const shippingFee = includedItems.length > 0 ? 0 : 0;
  const total = subtotal + shippingFee;

  async function handleIncrement(productId: string, stock: number) {
    const ok = await updateQuantity(productId, 1, stock);
    if (!ok) {
      setErrorsById((prev) => ({
        ...prev,
        [productId]: 'No puedes agregar más unidades.',
      }));
      setTimeout(() => {
        setErrorsById((prev) => ({
          ...prev,
          [productId]: undefined,
        }));
      }, 3000);
    }
  }

  async function handleDecrement(productId: string, stock: number) {
    await updateQuantity(productId, -1, stock);
  }

  async function handleRemove(productId: string) {
    await removeItem(productId);
    setIncludedById((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
    setErrorsById((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }

  function handleToggleIncluded(productId: string, included: boolean) {
    setIncludedById((current) => ({
      ...current,
      [productId]: included,
    }));
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
    <div className="grid gap-6 md:grid-cols-3 md:items-start">
      <section className="min-w-0 rounded-xl border border-border-light bg-card-bg-light p-4 md:col-span-2">
        <h2 className="mb-2 text-lg font-semibold">Productos ({enriched.length})</h2>
        {enriched.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            stock={item.product?.stockAvailable ?? 999}
            error={item.error}
            onIncrement={() => handleIncrement(item.productId, item.product?.stockAvailable ?? 999)}
            onDecrement={() => handleDecrement(item.productId, item.product?.stockAvailable ?? 999)}
            onToggleIncluded={(included) => handleToggleIncluded(item.productId, included)}
            onRemove={() => handleRemove(item.productId)}
          />
        ))}
      </section>

      <aside className="sticky top-4 h-fit rounded-xl border border-border-light bg-card-bg-light p-4 shadow-sm md:col-span-1">
        <details open={summaryOpen} onToggle={(event) => setSummaryOpen((event.currentTarget as HTMLDetailsElement).open)}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg outline-none">
            <span className="flex items-center gap-2 text-lg font-semibold">
              <ShoppingBag size={18} className="text-primary" />
              Resumen de pago
            </span>
            <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${summaryOpen ? 'rotate-180' : ''}`} />
          </summary>

          <div className="mt-4 space-y-4">
            <div className="space-y-3 rounded-xl border border-border-light bg-bg-light/60 p-4">
              {includedItems.length > 0 ? (
                includedItems.map((item) => {
                  const price = item.product?.hasOffer && item.product?.offerPrice != null
                    ? item.product.offerPrice
                    : item.product?.price ?? 0;
                  const lineTotal = price * item.quantity;
                  const name = item.product?.name ?? item.productId;

                  return (
                    <div key={item.productId} className="flex items-start justify-between gap-3 text-sm">
                      <div>
                        <p className="line-clamp-1 font-medium">{name}</p>
                        <p className="text-xs text-text-light opacity-60">{item.quantity} x Bs {price.toFixed(2)}</p>
                      </div>
                      <AnimatedAmount value={lineTotal} className="font-semibold text-primary" />
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-text-light opacity-70">
                  No hay ítems incluidos.
                </p>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-3 text-text-light opacity-80">
                <span>Subtotal</span>
                <AnimatedAmount value={subtotal} className="font-semibold" />
              </div>
              <div className="flex items-center justify-between gap-3 text-text-light opacity-80">
                <span>Fee de envío</span>
                <AnimatedAmount value={shippingFee} className="font-semibold" />
              </div>
            </div>

            <div className="h-px bg-border-light" />

            <div className="flex items-end justify-between gap-3">
              <span className="text-xs uppercase tracking-wide text-text-light opacity-60">Total final</span>
              <AnimatedAmount value={total} className="text-2xl font-bold text-primary" />
            </div>

            <button
              type="button"
              disabled={includedItems.length === 0}
              className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar pedido
            </button>
          </div>
        </details>
      </aside>
    </div>
  );
}

export function CartView() {
  return (
    <CartProvider>
      <CartViewInner />
    </CartProvider>
  );
}