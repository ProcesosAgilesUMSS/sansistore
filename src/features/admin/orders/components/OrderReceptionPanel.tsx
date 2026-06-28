import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore';
import { CheckCircle, Clock, PackageCheck } from 'lucide-react';
import { db } from '../../../../lib/firebase';

interface AdminOrderReception {
  id: string;
  buyerName: string;
  status: string;
  deliveryStatus: string;
  total: number;
  confirmed: boolean;
  confirmedAt: Date | null;
  updatedAt: Date | null;
}

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeStatus(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[_\s-]+/g, '_');
}

function isDelivered(data: DocumentData) {
  const deliveryStatus = normalizeStatus(data.deliveryStatus);
  const orderStatus = normalizeStatus(data.status);

  return (
    deliveryStatus === 'delivered' ||
    deliveryStatus === 'entregado' ||
    orderStatus === 'entregado' ||
    orderStatus === 'completado'
  );
}

function mapOrder(id: string, data: DocumentData): AdminOrderReception {
  const confirmed = Boolean(data.buyerReceptionConfirmed || data.customerConfirmed);

  return {
    id,
    buyerName: String(
      data.customerName || data.buyerName || data.buyerId || 'Comprador no registrado'
    ),
    status: String(data.status || 'Sin estado'),
    deliveryStatus: String(data.deliveryStatus || 'Sin entrega'),
    total: Number(data.total || 0),
    confirmed,
    confirmedAt: toDate(data.buyerReceptionConfirmedAt ?? data.customerConfirmedAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function formatDate(value: Date | null) {
  if (!value) return 'Sin fecha';

  return value.toLocaleString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const currencyFormatter = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
});

export default function OrderReceptionPanel() {
  const [orders, setOrders] = useState<AdminOrderReception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'orders'), orderBy('updatedAt', 'desc')),
      (snapshot) => {
        setOrders(
          snapshot.docs
            .filter((orderDoc) => isDelivered(orderDoc.data()))
            .map((orderDoc) => mapOrder(orderDoc.id, orderDoc.data()))
        );
        setLoading(false);
        setError(null);
      },
      (snapshotError) => {
        setError(snapshotError.message);
        setLoading(false);
      }
    );
  }, []);

  const confirmedCount = useMemo(
    () => orders.filter((order) => order.confirmed).length,
    [orders]
  );

  return (
    <section className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--theme-text)/45">
            Entregados
          </p>
          <p className="mt-2 text-2xl font-black text-(--theme-text)">{orders.length}</p>
        </div>
        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--theme-text)/45">
            Validados
          </p>
          <p className="mt-2 text-2xl font-black text-primary">
            {confirmedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-(--theme-text)/45">
            Pendientes
          </p>
          <p className="mt-2 text-2xl font-black text-(--theme-text)/70">
            {orders.length - confirmedCount}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-5">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-(--theme-text)">
              Validación de recepción
            </h2>
            <p className="mt-1 text-sm text-(--theme-text)/55">
              Pedidos entregados y confirmación registrada por el comprador.
            </p>
          </div>
          <PackageCheck className="text-primary" size={24} />
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-20 animate-pulse rounded-xl bg-(--theme-secondary-bg)" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-(--theme-error-border) bg-(--theme-error-bg) px-4 py-3 text-sm font-semibold text-(--theme-error)">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-dashed border-(--theme-border) px-5 py-10 text-center text-sm text-(--theme-text)/50">
            Aún no hay pedidos entregados para validar.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-(--theme-border)">
            {orders.map((order) => (
              <article
                key={order.id}
                className="grid gap-3 border-b border-(--theme-border) p-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-(--theme-text)">
                    #{order.id.substring(0, 8).toUpperCase()}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-(--theme-text)/55">
                    {order.buyerName}
                  </p>
                  <p className="mt-1 text-xs text-(--theme-text)/45">
                    Estado: {order.status} / {order.deliveryStatus}
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-(--theme-border) px-3 py-2 text-xs font-bold">
                  {order.confirmed ? (
                    <>
                      <CheckCircle size={15} className="text-primary" />
                      Validado: {formatDate(order.confirmedAt)}
                    </>
                  ) : (
                    <>
                      <Clock size={15} className="text-(--theme-warning)" />
                      Pendiente de comprador
                    </>
                  )}
                </div>

                <p className="text-sm font-black text-primary">
                  {currencyFormatter.format(order.total)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
