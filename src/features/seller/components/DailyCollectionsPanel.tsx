import { CalendarDays, DollarSign, ReceiptText, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { useDailyCollections } from '@features/seller/hooks/useDailyCollections';
import { parseOrderId } from '@features/cart/services/orderService';

const currencyFormatter = new Intl.NumberFormat('es-BO', {
  style: 'currency',
  currency: 'BOB',
  minimumFractionDigits: 2,
});

function formatDate(value?: string) {
  if (!value) return 'Hoy';
  return new Date(`${value}T00:00:00-04:00`).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value: string | null) {
  if (!value) return 'Sin hora';
  return new Date(value).toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getTodayInBolivia() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function formatPaymentMethod(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'cash_on_delivery') return 'Contra entrega';
  return value || 'No registrado';
}

export default function DailyCollectionsPanel({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayInBolivia);
  const {
    summary: dailyCollections,
    loading: collectionsLoading,
    error: collectionsError,
  } = useDailyCollections(selectedDate);

  const orders = dailyCollections?.orders ?? [];
  const confirmedCount = dailyCollections?.confirmedByBuyerCount ?? 0;

  return (
    <div
      className={
        embedded
          ? 'min-w-0'
          : 'min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10'
      }
    >
      <header className="mb-8 rounded-[1.75rem] border border-(--theme-border) bg-(--theme-card-bg) px-6 py-6 shadow-sm backdrop-blur-sm">
        <h1
          className="text-2xl font-900 leading-tight text-(--theme-text) md:text-2xl"
        >
          Pagos registrados por mensajeros
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--theme-text) opacity-70 md:text-base">
          Verifica los cobros contra entrega registrados en backend por cada
          mensajero para el control financiero del vendedor.
        </p>
      </header>

      <section className="mb-8 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-55">
                Total cobrado
              </p>
              <p
                className="mt-2 text-2xl font-900 leading-tight text-(--theme-text) md:text-2xl"
              >
                {collectionsLoading
                  ? 'Calculando...'
                  : currencyFormatter.format(
                      dailyCollections?.totalCollected ?? 0
                    )}
              </p>
              <p className="mt-2 text-sm font-600 text-(--theme-text) opacity-65">
                {collectionsError
                  ? collectionsError
                  : `Rendicion del ${formatDate(dailyCollections?.date)}`}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-(--theme-secondary-bg) text-(--theme-text)">
              <ReceiptText size={21} />
            </div>

            <div>
              <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-55">
                Pedidos cobrados
              </p>
              <p
                className="mt-2 text-2xl font-900 leading-tight text-(--theme-text)"
              >
                {collectionsLoading
                  ? '...'
                  : (dailyCollections?.orderCount ?? 0)}
              </p>
              <p className="mt-2 text-sm font-600 text-(--theme-text) opacity-65">
                Solo pedidos del vendedor actual.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <UserCheck size={21} />
            </div>

            <div>
              <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-55">
                Confirmados
              </p>
              <p
                className="mt-2 text-2xl font-900 leading-tight text-(--theme-text)"
              >
                {collectionsLoading ? '...' : confirmedCount}
              </p>
              <p className="mt-2 text-sm font-600 text-(--theme-text) opacity-65">
                Recepcion validada por comprador.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-(--theme-border) px-5 py-4">
          <div>
            <h2 className="text-lg font-900 tracking-[0.12em] text-(--theme-text)">
              Registro de cobros
            </h2>
            <p className="mt-1 text-sm font-600 text-(--theme-text) opacity-60">
              Cruce real de pedidos, pagos, entregas y usuario mensajero.
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-2 text-sm font-700 text-(--theme-text)">
            <CalendarDays size={17} className="text-primary" />
            <input
              type="date"
              value={selectedDate}
              max={getTodayInBolivia()}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="bg-transparent font-700 outline-none"
              aria-label="Fecha de cobros"
            />
          </label>
        </div>

        {collectionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-20 animate-pulse rounded-2xl bg-(--theme-secondary-bg)"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
            <p className="text-sm text-(--theme-text) opacity-50">
              No hay pagos registrados por mensajeros para esta fecha.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                key={order.orderId}
                className="grid gap-4 rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/35 p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(13rem,0.8fr)_auto] lg:items-center"
              >
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 truncate">
                    {parseOrderId(order.orderId).uuid}
                  </p>
                  <p className="text-lg font-bold">
                    {parseOrderId(order.orderId).friendlyName}
                  </p>
                  <p className="mt-1 truncate text-sm font-700 text-(--theme-text) opacity-70">
                    Cliente: {order.customerName}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs font-800 uppercase tracking-[0.12em] text-primary">
                      {order.paymentStatusLabel || order.paymentStatus}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs font-800 uppercase tracking-[0.12em] ${
                        order.buyerReceptionConfirmed
                          ? 'border-primary/30 bg-primary/10 text-primary'
                          : 'border-(--theme-border) text-(--theme-text) opacity-60'
                      }`}
                    >
                      {order.buyerReceptionConfirmed
                        ? 'Recibido por comprador'
                        : 'Sin validacion comprador'}
                    </span>
                  </div>
                </div>
                <div className="min-w-0 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) px-4 py-3">
                  <p className="truncate text-sm font-900 text-(--theme-text)">
                    {order.courierName}
                  </p>
                  <p className="mt-1 truncate text-xs font-600 text-(--theme-text) opacity-55">
                    {order.courierEmail ?? order.courierId ?? 'Sin usuario vinculado'}
                  </p>
                  <p className="mt-2 text-xs font-800 uppercase tracking-[0.14em] text-primary">
                    {formatPaymentMethod(order.paymentMethod)} - {formatTime(order.collectedAt)}
                  </p>
                  {order.paymentId && (
                    <p className="mt-1 truncate text-xs text-(--theme-text) opacity-50">
                      Pago: {order.paymentId}
                    </p>
                  )}
                </div>
                <div className="text-left lg:text-right">
                  <p className="text-lg font-900 text-primary">
                    {currencyFormatter.format(order.total)}
                  </p>
                  <p className="mt-1 text-xs font-700 text-(--theme-text) opacity-55">
                    Entrega: {order.deliveryId ?? 'No vinculada'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
