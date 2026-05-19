import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { Package, ShoppingBag } from 'lucide-react';
import { auth } from '../../../lib/firebase';
import { formatMoney, getUserCartItems } from '../services/cartService';
import type { CartItem } from '../types';

function CartItemCard({ item }: { item: CartItem }) {
  return (
    <article className="border-b border-border-light py-4 last:border-b-0">
      <div className="grid gap-4 sm:grid-cols-[88px_1fr_auto] sm:items-start">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-secondary-bg-light">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package size={26} className="text-text-light opacity-40" />
          )}
        </div>

        <div>
          <h2 className="font-semibold text-text-light">{item.name}</h2>
          <p className="mt-1 text-sm text-text-light opacity-70">
            Cantidad: {item.quantity}
          </p>
          <p className="mt-1 text-sm text-text-light opacity-70">
            Precio unitario:{' '}
            {item.unitPrice > 0 ? formatMoney(item.unitPrice) : 'No disponible'}
          </p>
          <p className="mt-1 text-sm text-text-light opacity-70">
            Stock disponible: {item.stockAvailable}
          </p>
          {item.isAvailable ? (
            <p className="mt-2 text-sm font-semibold text-primary">
              Disponible para confirmar
            </p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-red-600">
              {item.availabilityMessage}
            </p>
          )}
        </div>

        <div className="text-left sm:text-right">
          <p className="text-sm text-text-light opacity-70">Subtotal</p>
          <p className="font-bold text-text-light">{formatMoney(item.subtotal)}</p>
        </div>
      </div>
    </article>
  );
}

function CartSummary({ items }: { items: CartItem[] }) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = 0;
  const total = subtotal + shipping;
  const hasUnavailableItems = items.some((item) => !item.isAvailable);
  const hasItems = items.length > 0;

  return (
    <aside className="cart-summary rounded-lg border border-border-light bg-bg-light p-4">
      <div className="mb-4 flex items-center gap-2">
        <ShoppingBag size={18} className="text-primary" />
        <h2 className="text-lg font-semibold">Resumen del pedido</h2>
      </div>

      <div className="flex justify-between gap-3 mb-2">
        <span>Subtotal</span>
        <span>{formatMoney(subtotal)}</span>
      </div>
      <div className="flex justify-between gap-3 mb-2">
        <span>Envío</span>
        <span>{formatMoney(shipping)}</span>
      </div>
      <hr className="my-3" />
      <div className="flex justify-between gap-3 text-lg font-bold mb-4">
        <span>Total de compra</span>
        <span>{formatMoney(total)}</span>
      </div>

      {hasUnavailableItems && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          Hay productos que no pudieron calcularse. Revisa el carrito antes de
          confirmar.
        </p>
      )}

      <button
        type="button"
        disabled={!hasItems || hasUnavailableItems}
        className="w-full rounded-lg bg-primary py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Confirmar pedido
      </button>
    </aside>
  );
}

function EmptyCart() {
  return (
    <section className="rounded-lg border border-border-light bg-bg-light p-6 py-12">
      <h2 className="text-xl font-semibold">Mi Carrito</h2>
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
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setItems(null);
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

  if (!authReady || (user && items === null && !error)) {
    return <div id="cart-status">Cargando...</div>;
  }

  if (!user) {
    return (
      <div className="error-message">
        <p>No autenticado</p>
        <a href="/login">Iniciar sesión</a>
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
    <div className="grid gap-8 md:grid-cols-3">
      <section className="rounded-lg border border-border-light bg-bg-light p-4 md:col-span-2">
        {sortedItems.map((item) => (
          <CartItemCard key={item.id} item={item} />
        ))}
      </section>
      <CartSummary items={sortedItems} />
    </div>
  );
}
