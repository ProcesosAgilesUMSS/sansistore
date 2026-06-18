import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { CartItemRow } from './CartItemRow';
import { AnimatedAmount } from './AnimatedAmount';
import { LoginModal } from './LoginModal';
import { LocationSelectorModal } from './LocationSelectorModal';
import { PaymentConfirmModal } from './PaymentConfirmModal';
import { OrderSuccessModal } from './OrderSuccessModal';
import { RemoveItemModal } from './RemoveItemModal';
import { ClearCartModal } from './ClearCartModal';
import type { CartItemWithProduct } from '../types';
import { useCartContext, CartProvider } from './CartContext';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import type { Location } from '../../location/types';
import { createOrder } from '../services/orderService';

function CartViewInner() {
  const {
    itemsWithProducts,
    loading,
    updateQuantity,
    setQuantity,
    removeItem,
    clearCart,
    items,
  } = useCartContext();
  const { user, authReady } = useAuthUser();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [includedById, setIncludedById] = useState<Record<string, boolean>>({});
  const [errorsById, setErrorsById] = useState<
    Record<string, string | undefined>
  >({});
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [itemToRemove, setItemToRemove] = useState<CartItemWithProduct | null>(
    null
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showClearCartModal, setShowClearCartModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  useEffect(() => {
    if (!user) {
      setUserRoles([]);
      return;
    }

    getDoc(doc(db, 'users', user.uid))
      .then((userSnap) => {
        const roles = userSnap.data()?.roles;
        setUserRoles(Array.isArray(roles) ? roles : []);
      })
      .catch(() => setUserRoles([]));
  }, [user]);

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
        included: item.isValid && (includedById[item.productId] ?? true),
        error: errorsById[item.productId],
      })),
    [errorsById, includedById, itemsWithProducts]
  );

  const invalidItems = useMemo(
    () => enriched.filter((item) => !item.isValid),
    [enriched]
  );

  const priceChangedItems = useMemo(
    () =>
      enriched.filter((item) => item.isValid && item.priceChange !== 'none'),
    [enriched]
  );

  const includedItems = useMemo(
    () => enriched.filter((item) => item.included && item.isValid),
    [enriched]
  );

  const subtotal = useMemo(
    () =>
      includedItems.reduce((sum, item) => {
        return sum + Number((item.unitPrice * item.quantity).toFixed(2));
      }, 0),
    [includedItems]
  );

  const shippingFee = includedItems.length > 0 ? 0 : 0;
  const total = Number((subtotal + shippingFee).toFixed(2));

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

  async function handleSetQuantity(
    productId: string,
    quantity: number,
    stock: number
  ) {
    const clamped = Math.max(1, Math.min(quantity, stock));
    const ok = await setQuantity(productId, clamped, stock);
    if (!ok) {
      setErrorsById((prev) => ({
        ...prev,
        [productId]:
          errorsById[productId] || 'No se pudo actualizar la cantidad.',
      }));
    }
  }

  function handleRemove(productId: string) {
    const item =
      itemsWithProducts.find((current) => current.productId === productId) ??
      null;
    setItemToRemove(item);
  }

  async function confirmRemoveItem() {
    if (!itemToRemove) return;

    const productId = itemToRemove.productId;
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
    setItemToRemove(null);
  }

  function handleToggleIncluded(productId: string, included: boolean) {
    setIncludedById((current) => ({
      ...current,
      [productId]: included,
    }));
  }

  async function handleConfirmOrder() {
    if (!authReady) return;

    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const isComprador = userRoles.includes('comprador');
    if (!isComprador) {
      return;
    }

    setShowLocationModal(true);
  }

  function handleLocationSelected(location: Location) {
    setSelectedLocation(location);
    setShowLocationModal(false);
    setShowPaymentConfirmModal(true);
  }

  async function handlePaymentConfirm() {
    if (!user || creatingOrder || !selectedLocation) return;

    setCreatingOrder(true);
    setShowPaymentConfirmModal(false);

    try {
      await createOrder({
        user,
        selectedLocation,
        total,
        includedItems: includedItems as CartItemWithProduct[],
      });

      for (const item of items) {
        await removeItem(item.productId);
      }

      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setCreatingOrder(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (enriched.length === 0 && !showSuccessModal) {
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Ruta de navegación"
          className="flex items-center gap-2 text-sm text-text-light"
        >
          <a
            href="/"
            className="font-semibold opacity-70 transition-opacity hover:opacity-100"
          >
            Inicio
          </a>
          <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
          <a
            href="/productos"
            className="font-semibold opacity-70 transition-opacity hover:opacity-100"
          >
            Productos
          </a>
          <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
          <span className="font-bold text-primary" aria-current="page">
            Carrito
          </span>
        </nav>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 self-start rounded-full border border-border-light bg-card-bg-light px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-text-light transition-colors hover:border-primary hover:text-primary sm:self-auto"
        >
          <ArrowLeft size={16} />
          Atrás
        </button>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-3 md:items-start">
        <section className="min-w-0 rounded-xl border border-border-light bg-card-bg-light p-3 sm:p-4 md:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-border-light pb-2">
            <h2 className="text-base sm:text-lg font-semibold">
              Productos ({enriched.length})
            </h2>
            <button
              type="button"
              onClick={() => setShowClearCartModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 size={14} />
              Vaciar carrito
            </button>
          </div>
          {enriched.map((item) => {
            const effectiveStock = Math.max(
              0,
              (item.product?.stockAvailable ?? 0) -
              (item.product?.stockReserved ?? 0)
            );
            return (
              <CartItemRow
                key={item.productId}
                item={item}
                stock={effectiveStock}
                onIncrement={() =>
                  handleIncrement(item.productId, effectiveStock)
                }
                onDecrement={() =>
                  handleDecrement(item.productId, effectiveStock)
                }
                onSetQuantity={(qty) =>
                  handleSetQuantity(item.productId, qty, effectiveStock)
                }
                onToggleIncluded={(included) =>
                  handleToggleIncluded(item.productId, included)
                }
                onRemove={() => handleRemove(item.productId)}
              />
            );
          })}
        </section>

        <aside className="rounded-xl border border-border-light bg-card-bg-light p-3 sm:p-4 shadow-sm md:sticky md:top-4 md:h-fit md:col-span-1">
          <details
            open={summaryOpen}
            onToggle={(event) =>
              setSummaryOpen((event.currentTarget as HTMLDetailsElement).open)
            }
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg outline-none">
              <span className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                <ShoppingBag size={16} className="text-primary" />
                Resumen de pago
              </span>
              <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform ${summaryOpen ? 'rotate-180' : ''}`}
              />
            </summary>

            <div className="mt-4 space-y-4">
              <div className="space-y-3 rounded-xl border border-border-light bg-bg-light/60 p-4">
                {includedItems.length > 0 ? (
                  includedItems.map((item) => {
                    const price = item.unitPrice;
                    const lineTotal = Number(
                      (price * item.quantity).toFixed(2)
                    );
                    const name = item.product?.name ?? item.productId;
                    const showChange =
                      item.priceChange !== 'none' && item.priceAtAdd != null;

                    return (
                      <div
                        key={item.productId}
                        className="flex items-start justify-between gap-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-1 font-medium">{name}</p>
                          <p className="text-xs text-text-light opacity-60">
                            {item.quantity} x{' '}
                            {showChange ? (
                              <>
                                <span className="line-through opacity-70">
                                  Bs {item.priceAtAdd!.toFixed(2)}
                                </span>{' '}
                                <span
                                  className={
                                    item.priceChange === 'increased'
                                      ? 'text-red-500 font-semibold'
                                      : 'text-primary font-semibold'
                                  }
                                >
                                  Bs {price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <>Bs {price.toFixed(2)}</>
                            )}
                          </p>
                        </div>
                        <AnimatedAmount
                          value={lineTotal}
                          className="font-semibold text-primary"
                        />
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
                  <AnimatedAmount
                    value={shippingFee}
                    className="font-semibold"
                  />
                </div>
              </div>

              <div className="h-px bg-border-light" />

              <div className="flex items-end justify-between gap-3">
                <span className="text-xs uppercase tracking-wide text-text-light opacity-60">
                  Total final
                </span>
                <AnimatedAmount
                  value={total}
                  className="text-xl sm:text-2xl font-bold text-primary"
                />
              </div>

              {invalidItems.length > 0 && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
                >
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    Hay {invalidItems.length}{' '}
                    {invalidItems.length === 1
                      ? 'producto no disponible'
                      : 'productos no disponibles'}
                    . Quítalos para continuar.
                  </span>
                </div>
              )}

              {priceChangedItems.length > 0 && (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
                >
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    {priceChangedItems.length === 1
                      ? '1 producto cambió de precio. Revisa el total antes de confirmar.'
                      : `${priceChangedItems.length} productos cambiaron de precio. Revisa el total antes de confirmar.`}
                  </span>
                </div>
              )}

              <button
                type="button"
                disabled={
                  includedItems.length === 0 ||
                  invalidItems.length > 0 ||
                  creatingOrder
                }
                onClick={handleConfirmOrder}
                className="flex w-full items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingOrder ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  'Confirmar pedido'
                )}
              </button>
            </div>
          </details>
        </aside>

        {itemToRemove && (
          <RemoveItemModal
            item={itemToRemove}
            onClose={() => setItemToRemove(null)}
            onConfirm={confirmRemoveItem}
          />
        )}
        {showLoginModal && (
          <LoginModal onClose={() => setShowLoginModal(false)} />
        )}
        {user && showLocationModal && (
          <LocationSelectorModal
            user={user}
            onClose={() => setShowLocationModal(false)}
            onConfirm={handleLocationSelected}
          />
        )}
        {showPaymentConfirmModal && selectedLocation && (
          <PaymentConfirmModal
            location={selectedLocation}
            total={total}
            onClose={() => setShowPaymentConfirmModal(false)}
            onConfirm={handlePaymentConfirm}
            loading={creatingOrder}
          />
        )}
        {showSuccessModal && (
          <OrderSuccessModal onClose={() => setShowSuccessModal(false)} />
        )}
        {showClearCartModal && (
          <ClearCartModal
            onClose={() => setShowClearCartModal(false)}
            onConfirm={async () => {
              await clearCart();
              setShowClearCartModal(false);
            }}
          />
        )}
      </div>
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
