import { useReservations } from '../hooks/useReservations';
import { StatusPill } from './StatusPill';
import { formatCurrency } from '../utils/currency';
import { formatDate } from '../utils/formatDate';

export default function ReservationsListPanel() {
  const { reservations, loading, error } = useReservations();

  return (
    <div className="min-h-screen bg-(--theme-bg) px-4 pb-10 pt-10 md:px-8 xl:px-10">
      <header className="mb-8 rounded-[1.75rem] border border-(--theme-border) bg-(--theme-card-bg) px-6 py-6 shadow-sm backdrop-blur-sm">
        <p
          className="mb-3 text-xs font-800 uppercase tracking-[0.25em]"
          style={{ color: 'var(--color-primary)' }}
        >
          Sección Reservas
        </p>

        <h1
          className="text-2xl font-900 leading-tight text-(--theme-text) md:text-2xl"
        >
          Reserva de Productos
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--theme-text) opacity-70 md:text-base">
          Visualización en tiempo real de los productos reservados para preparar los
          pedidos.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2
              className="text-lg font-800 text-(--theme-text)"
            >
              Lista de reservas
            </h2>

            <p className="mt-1 text-sm text-(--theme-text) opacity-60">
              Esta lista se actualiza automáticamente cuando una reserva cambia.
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) px-4 py-2 text-sm font-700 text-(--theme-text)">
            {reservations.length} reservas
          </span>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-(--theme-border) p-4"
              >
                <div className="mb-3 h-5 w-1/3 rounded bg-(--theme-secondary-bg)" />
                <div className="mb-2 h-4 w-1/2 rounded bg-(--theme-secondary-bg)" />
                <div className="h-4 w-1/4 rounded bg-(--theme-secondary-bg)" />
              </div>
            ))}
          </div>
        ) : reservations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-(--theme-border) px-6 py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--theme-secondary-bg)">
              <svg
                className="h-6 w-6 opacity-40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6"
                />
              </svg>
            </div>

            <p className="font-700 text-(--theme-text)">
              No hay reservas existentes.
            </p>

            <p className="mt-2 max-w-md text-sm text-(--theme-text) opacity-50">
              Cuando un pedido sea reservado, aparecerá automáticamente en esta
              sección.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {reservations.map((reservation) => (
              <article
                key={reservation.orderId}
                className="rounded-[1.25rem] border border-(--theme-border) bg-(--theme-card-bg) p-4 transition hover:-translate-y-px hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className="font-800 text-lg tracking-tight text-(--theme-text)"
                      >
                        Reserva #{reservation.orderId}
                      </h3>

                      <StatusPill status={reservation.status} />
                    </div>

                    <p className="mt-1 text-sm text-(--theme-text) opacity-60">
                      Comprador:{' '}
                      <span className="font-700">
                        {reservation.buyerName ?? 'Comprador no registrado'}
                      </span>
                    </p>

                    <p className="mt-1 text-sm text-(--theme-text) opacity-60">
                      Fecha:{' '}
                      <span className="font-700">
                        {formatDate(
                          reservation.confirmedAt ?? reservation.createdAt,
                        )}
                      </span>
                    </p>

                    {reservation.locationLabel && (
                      <p className="mt-1 text-sm text-(--theme-text) opacity-60">
                        Ubicación:{' '}
                        <span className="font-700">
                          {reservation.locationLabel}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="rounded-2xl bg-(--theme-secondary-bg) px-4 py-3 text-left lg:text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-(--theme-text) opacity-40">
                      Total del pedido
                    </p>

                    <p className="font-800 text-lg tracking-tight text-primary">
                      {formatCurrency(reservation.total)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t border-(--theme-border) pt-4">
                  <p className="mb-3 text-xs font-800 uppercase tracking-[0.18em] text-(--theme-text) opacity-50">
                    Productos reservados
                  </p>

                  {reservation.items && reservation.items.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {reservation.items.map((item) => (
                        <div
                          key={item.itemId}
                          className="rounded-xl border border-(--theme-border) p-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-700 text-sm text-(--theme-text)">
                                {item.productName}
                              </p>

                              <p className="mt-1 text-xs text-(--theme-text) opacity-50">
                                Cantidad reservada: {item.quantity}
                              </p>
                            </div>

                            <p className="whitespace-nowrap text-sm font-700 text-primary">
                              {formatCurrency(item.subtotal)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-xl border border-dashed border-(--theme-border) px-4 py-4 text-sm text-(--theme-text) opacity-50">
                      Esta reserva no tiene productos registrados.
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}