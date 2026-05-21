import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ShoppingBag, Trash2, X, MapPin, Loader2 } from 'lucide-react';
import { type User } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, writeBatch, increment, collection } from 'firebase/firestore';
import { CartItemRow } from './CartItemRow';
import { AnimatedAmount } from './AnimatedAmount';
import type { CartItemWithProduct } from '../types';
import { useCartContext, CartProvider } from './CartContext';
import { db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { subscribeToUserLocations } from '../../location/services/locationService';
import type { Location } from '../../location/types';

function generateOrderCode() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `order-${timestamp}-${random}`;
}

function generateItemId(orderCode: string, idx: number) {
  return `${orderCode}-item-${idx + 1}`;
}

function LoginModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h2 id="login-title" className="text-lg font-bold text-text-light">
            Iniciar sesión
          </h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-text-light opacity-70">
          Debes iniciar sesión para confirmar tu pedido.
        </p>

        <div className="mt-6">
          <a
            href="/login"
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Ir a iniciar sesión
          </a>
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

function LocationSelectorModal({
  user,
  onClose,
  onConfirm,
}: {
  user: User;
  onClose: () => void;
  onConfirm: (location: Location) => void;
}) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToUserLocations(user.uid, (locs) => {
      setLocations(locs);
      setLoading(false);
      const defaultLoc = locs.find((l) => l.isDefault);
      if (defaultLoc?.id) {
        setSelectedId(defaultLoc.id);
      }
    });
    return () => unsub();
  }, [user.uid]);

  function handleConfirm() {
    const selected = locations.find((l) => l.id === selectedId);
    if (selected) {
      onConfirm(selected);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MapPin size={18} />
          </div>
          <h2 id="location-title" className="text-lg font-bold text-text-light">
            Seleccionar ubicación
          </h2>
        </div>

        <div className="mt-4 flex max-h-60 flex-col gap-3 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center gap-3 py-12 text-text-light/40">
              <Loader2 size={28} className="animate-spin text-primary/60" />
              <p className="text-sm font-bold">Cargando ubicaciones...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-text-light/40">
              <MapPin size={32} className="text-primary/40" />
              <p className="text-sm font-bold">No hay ubicaciones guardadas</p>
              <a
                href="/location"
                className="text-xs font-semibold text-primary hover:underline"
              >
                Agregar ubicación
              </a>
            </div>
          ) : (
            locations.map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => setSelectedId(loc.id ?? null)}
                className={`w-full rounded-xl border p-3 text-left transition ${
                  selectedId === loc.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border-light hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-semibold text-text-light">{loc.label}</p>
                <p className="mt-1 text-xs text-text-light opacity-60 capitalize">
                  {loc.type}
                  {loc.isDefault && ' (Predeterminada)'}
                </p>
              </button>
            ))
          )}
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedId}
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Confirmar ubicación
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

function OrderSuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 id="success-title" className="text-lg font-bold text-text-light">
            ¡Pedido confirmado!
          </h2>
          <p className="text-sm text-text-light opacity-70">
            Tu pedido ha sido creado exitosamente.
          </p>
        </div>

        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

function CartViewInner() {
  const { itemsWithProducts, loading, updateQuantity, setQuantity, removeItem, items } = useCartContext();
  const { user, authReady } = useAuthUser();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [includedById, setIncludedById] = useState<Record<string, boolean>>({});
  const [errorsById, setErrorsById] = useState<Record<string, string | undefined>>({});
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [itemToRemove, setItemToRemove] = useState<CartItemWithProduct | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);

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
      return sum + Number((price * item.quantity).toFixed(2));
    }, 0),
    [includedItems],
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

  async function handleSetQuantity(productId: string, quantity: number, stock: number) {
    const clamped = Math.max(1, Math.min(quantity, stock));
    const ok = await setQuantity(productId, clamped, stock);
    if (!ok) {
      setErrorsById((prev) => ({
        ...prev,
        [productId]: errorsById[productId] || 'No se pudo actualizar la cantidad.',
      }));
    }
  }

  async function handleRemove(productId: string) {
    const item = itemsWithProducts.find((current) => current.productId === productId) ?? null;
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

  async function handleLocationSelected(location: Location) {
    if (!user || creatingOrder) return;

    setCreatingOrder(true);
    setShowLocationModal(false);

    try {
      const orderCode = generateOrderCode();
      const paymentCode = orderCode.replace('order', 'payment');
      const deliveryCode = orderCode.replace('order', 'delivery');

      const orderItems = includedItems.map((item, idx) => {
        const unitPrice = item.product?.hasOffer && item.product?.offerPrice != null
          ? item.product.offerPrice
          : item.product?.price ?? 0;
        const lineSubtotal = Number((unitPrice * item.quantity).toFixed(2));
        return {
          itemId: generateItemId(orderCode, idx),
          productId: item.productId,
          productName: item.product?.name ?? item.productId,
          unitPrice,
          quantity: item.quantity,
          subtotal: lineSubtotal,
        };
      });

      const batch = writeBatch(db);

      const ordersRef = doc(db, 'orders', orderCode);
      batch.set(ordersRef, {
        orderId: orderCode,
        buyerId: user.uid,
        sellerId: null,
        status: 'CREADO',
        incidentReason: null,
        total,
        locationId: location.id,
        paymentStatus: 'PENDIENTE',
        deliveryStatus: 'created',
        deliveryId: null,
        paymentId: paymentCode,
        confirmedAt: serverTimestamp(),
        cancelledAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      for (const orderItem of orderItems) {
        const orderItemRef = doc(db, `orders/${orderCode}/orderItems`, orderItem.itemId);
        batch.set(orderItemRef, orderItem);
      }

      for (const orderItem of orderItems) {
        const inventoryRef = doc(db, 'inventory', orderItem.productId);
        batch.update(inventoryRef, {
          stockAvailable: increment(-orderItem.quantity),
          stockReserved: increment(orderItem.quantity),
          updatedAt: serverTimestamp(),
        });

        const movementRef = doc(collection(db, 'inventoryMovements'));
        batch.set(movementRef, {
          movementId: movementRef.id,
          productId: orderItem.productId,
          operatorId: user.uid,
          type: 'salida_venta',
          quantity: orderItem.quantity,
          orderId: orderCode,
          createdAt: serverTimestamp(),
        });
      }

      const paymentsRef = doc(db, 'payments', paymentCode);
      batch.set(paymentsRef, {
        paymentId: paymentCode,
        orderId: orderCode,
        amount: total,
        method: 'cash_on_delivery',
        status: 'PENDIENTE',
        registeredBy: user.uid,
        verifiedBy: null,
        registeredAt: serverTimestamp(),
        verifiedAt: null,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

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

  function RemoveItemModal() {
    if (!itemToRemove) return null;

    const productName = itemToRemove.product?.name ?? itemToRemove.productId;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-item-title"
      >
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setItemToRemove(null)}
        />

        <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Trash2 size={18} />
            </div>
            <h2 id="remove-item-title" className="text-lg font-bold text-text-light">
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
              onClick={() => setItemToRemove(null)}
              className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
            >
              No
            </button>

            <button
              type="button"
              onClick={confirmRemoveItem}
              className="flex-1 rounded-full border border-primary bg-white px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary/5 active:scale-95"
            >
              Sí
            </button>
          </div>

          <button
            type="button"
            onClick={() => setItemToRemove(null)}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-light opacity-70 transition hover:opacity-100"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg sm:text-xl font-bold text-text-light">Mi Carrito</h1>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-full border border-border-light bg-card-bg-light px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-text-light transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft size={16} />
          Atrás
        </button>
      </div>

      <div className="grid gap-4 md:gap-6 md:grid-cols-3 md:items-start">
      <section className="min-w-0 rounded-xl border border-border-light bg-card-bg-light p-3 sm:p-4 md:col-span-2">
        <h2 className="mb-2 text-base sm:text-lg font-semibold">Productos ({enriched.length})</h2>
        {enriched.map((item) => (
          <CartItemRow
            key={item.productId}
            item={item}
            stock={item.product?.stockAvailable ?? 999}
            onIncrement={() => handleIncrement(item.productId, item.product?.stockAvailable ?? 999)}
            onDecrement={() => handleDecrement(item.productId, item.product?.stockAvailable ?? 999)}
            onSetQuantity={(qty) => handleSetQuantity(item.productId, qty, item.product?.stockAvailable ?? 999)}
            onToggleIncluded={(included) => handleToggleIncluded(item.productId, included)}
            onRemove={() => handleRemove(item.productId)}
          />
        ))}
      </section>

      <aside className="rounded-xl border border-border-light bg-card-bg-light p-3 sm:p-4 shadow-sm md:sticky md:top-4 md:h-fit md:col-span-1">
        <details open={summaryOpen} onToggle={(event) => setSummaryOpen((event.currentTarget as HTMLDetailsElement).open)}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-lg outline-none">
            <span className="flex items-center gap-2 text-base sm:text-lg font-semibold">
              <ShoppingBag size={16} className="text-primary" />
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
                  const lineTotal = Number((price * item.quantity).toFixed(2));
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
              <AnimatedAmount value={total} className="text-xl sm:text-2xl font-bold text-primary" />
            </div>

            <button
              type="button"
              disabled={includedItems.length === 0 || creatingOrder}
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

      <RemoveItemModal />
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      {user && showLocationModal && (
        <LocationSelectorModal
          user={user}
          onClose={() => setShowLocationModal(false)}
          onConfirm={handleLocationSelected}
        />
      )}
      {showSuccessModal && <OrderSuccessModal onClose={() => setShowSuccessModal(false)} />}
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