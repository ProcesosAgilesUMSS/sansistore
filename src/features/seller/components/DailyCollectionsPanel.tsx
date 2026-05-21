import { DollarSign, ReceiptText } from 'lucide-react';
import { useDailyCollections } from '../hooks/useDailyCollections';

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

export default function DailyCollectionsPanel({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const {
    summary: dailyCollections,
    loading: collectionsLoading,
    error: collectionsError,
  } = useDailyCollections();

  const orders = dailyCollections?.orders ?? [];

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
          className="text-3xl font-900 leading-tight text-(--theme-text) md:text-4xl"
          style={{ fontFamily: 'Outfit, sans-serif' }}
        >
          Rendicion del dia
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--theme-text) opacity-70 md:text-base">
          Revisa los pedidos entregados y cobrados por mensajeria para rendir
          cuentas y cerrar la venta.
        </p>
      </header>

      <section className="mb-8 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) px-6 py-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign size={22} />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-800 uppercase tracking-[0.22em] text-(--theme-text) opacity-55">
                Cobrado hoy
              </p>
              <p
                className="mt-2 text-3xl font-900 leading-tight text-(--theme-text) md:text-4xl"
                style={{ fontFamily: 'Outfit, sans-serif' }}
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
                className="mt-2 text-3xl font-900 leading-tight text-(--theme-text)"
                style={{ fontFamily: 'Outfit, sans-serif' }}
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
      </section>

      <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-(--theme-border) px-5 py-4">
          <div>
            <h2 className="text-xl font-900 tracking-[0.12em] text-(--theme-text)">
              Pedidos para rendicion
            </h2>
            <p className="mt-1 text-sm font-600 text-(--theme-text) opacity-60">
              Estados del flujo: ENTREGADO / PAGADO.
            </p>
          </div>
          <span className="rounded-full border border-(--theme-border) px-4 py-2 text-sm font-800 text-(--theme-text)">
            {collectionsLoading ? '...' : orders.length}
          </span>
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
              Aun no hay pedidos cobrados para rendir hoy.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article
                key={order.orderId}
                className="grid gap-3 rounded-2xl border border-(--theme-border) bg-(--theme-secondary-bg)/35 p-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-900 text-(--theme-text)">
                    {order.orderId}
                  </p>
                  <p className="mt-1 text-xs font-700 uppercase tracking-[0.16em] text-primary">
                    Entregado y cobrado
                  </p>
                </div>
                <p className="text-sm font-700 text-(--theme-text) opacity-65">
                  {formatTime(order.collectedAt)}
                </p>
                <p className="text-lg font-900 text-primary">
                  {currencyFormatter.format(order.total)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
