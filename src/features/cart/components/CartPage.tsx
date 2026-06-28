import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Package, ShoppingBag, Trash2 } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import {
  formatMoney,
  getUserCartItems,
  removeCartItem,
} from '../services/cartService';
import type { CartDisplayItem } from '../types';

function RemoveItemModal({
  item,
  isLoading,
  onConfirm,
  onCancel,
}: {
  item: CartDisplayItem;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isLoading) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isLoading, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-item-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={isLoading ? undefined : onCancel}
      />

      <div className="relative z-10 w-full max-w-sm animate-in zoom-in-95 fade-in duration-200 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600">
            <Trash2 size={18} />
          </div>
          <h2
            id="remove-item-title"
            className="text-lg font-bold text-(--theme-text)"
          >
            Eliminar producto
          </h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-(--theme-text) opacity-70">
          ¿Seguro que querés eliminar{' '}
          <span className="font-semibold text-(--theme-text) opacity-100">
            {item.name}
          </span>{' '}
          del carrito?
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-full border border-(--theme-border) px-4 py-3 text-sm font-medium text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>
                Eliminando…
              </span>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function AvailabilityPill({ item }: { item: CartDisplayItem }) {
  const available = item.isAvailable;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        available
          ? 'border border-(--theme-border) bg-primary/10 text-primary'
          : 'border border-red-200 bg-red-500/10 text-red-600'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${available ? 'bg-primary' : 'bg-red-500'}`}
      />
      {available ? 'Disponible' : item.availabilityMessage}
    </span>
  );
}

function CartItemCard({
  item,
  removing,
  onRemove,
}: {
  item: CartDisplayItem;
  removing: boolean;
  onRemove: (item: CartDisplayItem) => void;
}) {
  return (
    <article className="rounded-xl border border-(--theme-border) bg-(--theme-card-bg) p-4 transition hover:border-(--theme-text)/20">
      <div className="grid gap-4 sm:grid-cols-[88px_1fr_auto] sm:items-start">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg)">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={26} className="text-(--theme-text) opacity-40" />
          )}
        </div>

        <div className="min-w-0">
          <h2 className="font-semibold text-(--theme-text)">{item.name}</h2>

          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm text-(--theme-text) opacity-60">
            <dt>Cantidad</dt>
            <dd className="text-(--theme-text) opacity-90">{item.quantity}</dd>
            <dt>Precio unitario</dt>
            <dd className="text-(--theme-text) opacity-90">
              {item.unitPrice > 0 ? formatMoney(item.unitPrice) : 'No disponible'}
            </dd>
            <dt>Stock</dt>
            <dd className="text-(--theme-text) opacity-90">{item.stockAvailable}</dd>
          </dl>

          <div className="mt-3">
            <AvailabilityPill item={item} />
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
          <div className="text-left sm:text-right">
            <p className="text-xs uppercase text-(--theme-text) opacity-50">
              Subtotal
            </p>
            <p className="font-bold text-primary">{formatMoney(item.subtotal)}</p>
          </div>

          <button
            type="button"
            onClick={() => onRemove(item)}
            disabled={removing}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--theme-border) text-red-600 transition hover:border-red-300 hover:bg-red-500/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={`Eliminar ${item.name}`}
            title="Eliminar producto"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

function CartSummary({ items }: { items: CartDisplayItem[] }) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = 0;
  const total = subtotal + shipping;
  const hasUnavailableItems = items.some((item) => !item.isAvailable);
  const hasItems = items.length > 0;

  return (
    <aside className="cart-summary sticky top-4 h-fit overflow-hidden rounded-[1.25rem] border border-(--theme-border) bg-(--theme-card-bg) p-5">
      <div className="mb-5 flex items-center gap-2">
        <ShoppingBag size={18} className="text-primary" />
        <h2 className="text-lg font-bold text-(--theme-text)">
          Resumen del pedido
        </h2>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between gap-3 text-(--theme-text) opacity-70">
          <span>Subtotal</span>
          <span className="font-medium">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex justify-between gap-3 text-(--theme-text) opacity-70">
          <span>Envío</span>
          <span className="font-medium">{formatMoney(shipping)}</span>
        </div>
      </div>

      <div className="my-4 h-px bg-(--theme-border)" />

      <div className="mb-5 flex items-end justify-between gap-3">
        <span className="text-xs uppercase text-(--theme-text) opacity-50">
          Total de compra
        </span>
        <span
          data-testid="cart-total"
          className="text-2xl font-bold text-primary"
        >
          {formatMoney(total)}
        </span>
      </div>

      {hasUnavailableItems && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-500/10 p-3 text-xs font-medium text-red-600">
          Hay productos que no pudieron calcularse. Revisa el carrito antes de
          confirmar.
        </p>
      )}

      <button
        type="button"
        disabled={!hasItems || hasUnavailableItems}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirmar pedido
      </button>
    </aside>
  );
}

function EmptyCart() {
  return (
    <section className="rounded-lg border border-border-light bg-bg-light p-6 py-12">
      <h2 className="text-lg font-semibold">Mi Carrito</h2>
      <p className="mt-4">Tu carrito está vacío</p>
      <div className="mt-6 max-w-sm rounded-lg border border-border-light p-4">
        <div className="flex justify-between text-lg font-bold">
          <span>Total de compra</span>
          <span>{formatMoney(0)}</span>
        </div>
      </div>
      <a href="/productos" className="mt-4 inline-block font-semibold text-primary">
        Ver productos
      </a>
    </section>
  );
}

export default function CartPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [items, setItems] = useState<CartDisplayItem[]>([]);
  const [error, setError] = useState('');
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [itemToRemove, setItemToRemove] = useState<CartDisplayItem | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setItems([]);
      setError('');
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!authReady || !user) return;

    let ignore = false;

    getUserCartItems(user.uid)
      .then((cartItems) => {
        if (!ignore) setItems(cartItems);
      })
      .catch(() => {
        if (!ignore) setError('Error al cargar el carrito');
      });

    return () => {
      ignore = true;
    };
  }, [authReady, user]);

  const sortedItems = useMemo(
    () => [...(items ?? [])].sort((left, right) => left.name.localeCompare(right.name)),
    [items],
  );

  const handleRemoveItem = (item: CartDisplayItem) => {
    if (!user || removingItemId) return;
    setItemToRemove(item);
  };

  const confirmRemoveItem = async () => {
    if (!user || !itemToRemove) return;

    setRemovingItemId(itemToRemove.id);
    setError('');

    try {
      await removeCartItem(user.uid, itemToRemove.id);
      setItems((currentItems) =>
        currentItems
          ? currentItems.filter((cartItem) => cartItem.id !== itemToRemove.id)
          : currentItems,
      );
      setItemToRemove(null);
    } catch {
      setError('No se pudo eliminar el producto del carrito');
    } finally {
      setRemovingItemId(null);
    }
  };

  if (!authReady || (user && items.length === 0 && !error && !items)) {
    return <div id="cart-status">Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="error-message">
        <p>No autenticado</p>
        <a href="/iniciar-sesion">Iniciar sesión</a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message">
        <p>{error}</p>
      </div>
    );
  }

  if (sortedItems.length === 0) {
    return <EmptyCart />;
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-3">
        <section className="space-y-3 md:col-span-2">
          {sortedItems.map((item) => (
            <CartItemCard
              key={item.id}
              item={item}
              removing={removingItemId === item.id}
              onRemove={handleRemoveItem}
            />
          ))}
        </section>
        <CartSummary items={sortedItems} />
      </div>

      {itemToRemove && (
        <RemoveItemModal
          item={itemToRemove}
          isLoading={removingItemId === itemToRemove.id}
          onConfirm={confirmRemoveItem}
          onCancel={() => setItemToRemove(null)}
        />
      )}
    </>
  );
}
