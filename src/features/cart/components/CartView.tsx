import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, ChevronDown, ChevronRight, ShoppingBag, Trash2, X, MapPin, Loader2 } from 'lucide-react';
import { onAuthStateChanged, type User, signInWithPopup, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { collection, doc, getDoc, setDoc, serverTimestamp, addDoc, writeBatch, increment } from 'firebase/firestore';
import { CartItemRow } from './CartItemRow';
import { AnimatedAmount } from './AnimatedAmount';
import type { CartItemWithProduct } from '../types';
import { useCartContext, CartProvider } from './CartContext';
import { auth, googleProvider, db } from '../../../lib/firebase';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { subscribeToUserLocations } from '../../location/services/locationService';
import type { Location } from '../../location/types';

const INSTITUTIONAL_DOMAIN = '@est.umss.edu';

function generateOrderCode() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  return `order-${timestamp}-${random}`;
}

function generateItemId(orderCode: string, idx: number) {
  return `${orderCode}-item-${idx + 1}`;
}

function LoginModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleLogin() {
    setLoading(true);
    setError(null);
    try {
      googleProvider.setCustomParameters({
        hd: INSTITUTIONAL_DOMAIN.replace('@', ''),
      });
      await setPersistence(auth, browserLocalPersistence);
      const result = await signInWithPopup(auth, googleProvider);

      if (result.user.email && !result.user.email.endsWith(INSTITUTIONAL_DOMAIN)) {
        await signOut(auth);
        setError('Solo se permiten cuentas institucionales.');
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', result.user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const institutionalId = result.user.email!.split('@')[0];
        await setDoc(userRef, {
          uid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || 'Usuario UMSS',
          roles: ['comprador'],
          institutionalId,
          isActive: true,
          createdBy: 'system',
          createdAt: serverTimestamp(),
        });
      }
      onClose();
    } catch (e: unknown) {
      const ignored = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];
      if (!(e instanceof FirebaseError) || !ignored.includes(e.code)) {
        setError('Error al iniciar sesión. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
            >
              <path
                fill="#EA4335"
                d="M12 9.5v5h7.06C18.4 17.57 15.7 19.5 12 19.5a7.5 7.5 0 1 1 0-15c1.85 0 3.52.68 4.82 1.8l3.53-3.53A12 12 0 1 0 24 12c0-.82-.07-1.61-.2-2.36H12Z"
              />
              <path
                fill="#4285F4"
                d="M23.8 9.64H12v4.72h6.67A7.02 7.02 0 0 1 12 19.5c-3.7 0-6.87-2.23-8.22-5.41L.16 16.22A11.97 11.97 0 0 0 12 24c6.63 0 12-5.37 12-12 0-.83-.08-1.63-.2-2.36Z"
              />
              <path
                fill="#FBBC05"
                d="M3.78 14.09A7.49 7.49 0 0 1 3.5 12c0-.73.11-1.43.28-2.09L.16 6.78A12 12 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"
              />
              <path
                fill="#34A853"
                d="m3.78 14.09 2.54-1.96A7.49 7.49 0 0 1 4.5 12c0-.74.11-1.44.28-2.09L1.24 8.66A11.94 11.94 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"
              />
            </svg>
          </div>
          <h2 id="login-title" className="text-lg font-bold text-text-light">
            Iniciar sesión
          </h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-text-light opacity-70">
          Debes iniciar sesión para confirmar tu pedido.
        </p>

        {error && (
          <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border-light bg-white px-4 py-3 text-sm font-semibold text-text-light transition hover:bg-border-light/40 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                >
                  <path
                    fill="#EA4335"
                    d="M12 9.5v5h7.06C18.4 17.57 15.7 19.5 12 19.5a7.5 7.5 0 1 1 0-15c1.85 0 3.52.68 4.82 1.8l3.53-3.53A12 12 0 1 0 24 12c0-.82-.07-1.61-.2-2.36H12Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.8 9.64H12v4.72h6.67A7.02 7.02 0 0 1 12 19.5c-3.7 0-6.87-2.23-8.22-5.41L.16 16.22A11.97 11.97 0 0 0 12 24c6.63 0 12-5.37 12-12 0-.83-.08-1.63-.2-2.36Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M3.78 14.09A7.49 7.49 0 0 1 3.5 12c0-.73.11-1.43.28-2.09L.16 6.78A12 12 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"
                  />
                  <path
                    fill="#34A853"
                    d="m3.78 14.09 2.54-1.96A7.49 7.49 0 0 1 4.5 12c0-.74.11-1.44.28-2.09L1.24 8.66A11.94 11.94 0 0 0 0 12c0 1.92.45 3.73 1.24 5.34l2.54-1.96Z"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-light opacity-70 transition hover:opacity-100 disabled:opacity-30"
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
        included: item.isValid && (includedById[item.productId] ?? true),
        error: errorsById[item.productId],
      })),
    [errorsById, includedById, itemsWithProducts],
  );

  const invalidItems = useMemo(
    () => enriched.filter((item) => !item.isValid),
    [enriched],
  );

  const priceChangedItems = useMemo(
    () => enriched.filter((item) => item.isValid && item.priceChange !== 'none'),
    [enriched],
  );

  const includedItems = useMemo(
    () => enriched.filter((item) => item.included && item.isValid),
    [enriched],
  );

  const subtotal = useMemo(
    () => includedItems.reduce((sum, item) => {
      return sum + Number((item.unitPrice * item.quantity).toFixed(2));
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
        const unitPrice = item.unitPrice;
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500 dark:text-red-400">
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
              className="flex-1 rounded-full border border-border-light bg-transparent px-4 py-3 text-sm font-semibold text-text-light transition hover:bg-secondary-bg-light active:scale-95"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={confirmRemoveItem}
              className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 active:scale-95"
            >
              Eliminar
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav
          aria-label="Ruta de navegación"
          className="flex items-center gap-2 text-sm text-text-light"
        >
          <a href="/" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
            Inicio
          </a>
          <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
          <a href="/productos" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
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
                  const price = item.unitPrice;
                  const lineTotal = Number((price * item.quantity).toFixed(2));
                  const name = item.product?.name ?? item.productId;
                  const showChange =
                    item.priceChange !== 'none' && item.priceAtAdd != null;

                  return (
                    <div key={item.productId} className="flex items-start justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="line-clamp-1 font-medium">{name}</p>
                        <p className="text-xs text-text-light opacity-60">
                          {item.quantity} x {showChange ? (
                            <>
                              <span className="line-through opacity-70">Bs {item.priceAtAdd!.toFixed(2)}</span>{' '}
                              <span className={item.priceChange === 'increased' ? 'text-red-500 font-semibold' : 'text-primary font-semibold'}>
                                Bs {price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <>Bs {price.toFixed(2)}</>
                          )}
                        </p>
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

            {invalidItems.length > 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  Hay {invalidItems.length} {invalidItems.length === 1 ? 'producto no disponible' : 'productos no disponibles'}. Quítalos para continuar.
                </span>
              </div>
            )}

            {priceChangedItems.length > 0 && (
              <div
                role="status"
                className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400"
              >
                <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                <span>
                  {priceChangedItems.length === 1
                    ? '1 producto cambió de precio. Revisa el total antes de confirmar.'
                    : `${priceChangedItems.length} productos cambiaron de precio. Revisa el total antes de confirmar.`}
                </span>
              </div>
            )}

            <button
              type="button"
              disabled={includedItems.length === 0 || invalidItems.length > 0 || creatingOrder}
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