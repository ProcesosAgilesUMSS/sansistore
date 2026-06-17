import { UserRound, X } from "lucide-react";
import { createPortal } from "react-dom";
import { parseOrderId } from "@/features/cart/services/orderService";
import type { Messenger, Order } from "../types";

interface Props {
  order: Order;
  messengers: Messenger[];
  selectedCourierId?: string;
  messengersLoading: boolean;
  isLoading: boolean;
  onSelectCourier: (orderId: string, courierId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function AssignMessengerModal({
  order,
  messengers,
  selectedCourierId,
  messengersLoading,
  isLoading,
  onSelectCourier,
  onConfirm,
  onClose,
}: Props) {
  const availableCount = messengers.filter((m) => m.isAvailable).length;

  return createPortal(
    (
      <div
        className="fixed inset-0 z-999 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-messenger-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-(--theme-border) bg-(--theme-card-bg) shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-(--theme-border) px-6 py-5">
            <div>
              <h2
                id="order-details-title"
                className="mt-2 text-2xl font-bold tracking-tight text-(--theme-text)"
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {parseOrderId(order.orderId).friendlyName}
              </h2>
              <p className="mt-1 text-sm text-(--theme-text) opacity-70">
                Selecciona un mensajero disponible y confirma la asignación.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) transition hover:border-primary hover:text-primary"
              aria-label="Cerrar modal"
            >
              <X size={18} />
            </button>
          </header>

          <div className="p-6">
            <div className="rounded-3xl border border-(--theme-border) bg-(--theme-secondary-bg)/50 p-4">
              <p className="text-[11px] font-800 uppercase tracking-[0.24em] text-(--theme-text) opacity-45">
                Pedido listo
              </p>
              <p className="mt-1 text-lg font-900 text-(--theme-text)">
                {order.buyerName ?? 'Comprador desconocido'}
              </p>
              <p className="mt-1 text-sm text-(--theme-text) opacity-70">
                {order.locationLabel ?? 'Ubicación no registrada'}
              </p>
            </div>

            {!messengersLoading && messengers.length > 0 && (
              <p className="mt-4 text-xs text-(--theme-text) opacity-50">
                {availableCount} de {messengers.length} mensajeros disponibles
              </p>
            )}

            <div className="mt-3 grid gap-3">
              {messengersLoading ? (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50">
                  Cargando mensajeros…
                </div>
              ) : messengers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50">
                  No hay mensajeros registrados.
                </div>
              ) : availableCount === 0 ? (
                <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-6 text-sm text-amber-700 dark:border-amber-700/40 dark:bg-amber-900/20 dark:text-amber-300">
                  Todos los mensajeros están ocupados en este momento. Intenta nuevamente en unos minutos.
                </div>
              ) : (
                messengers.map((messenger) => {
                  const isSelected = selectedCourierId === messenger.uid;
                  const isDisabled = !messenger.isAvailable;

                  return (
                    <button
                      key={messenger.uid}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => onSelectCourier(order.orderId, messenger.uid)}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${isDisabled
                        ? 'cursor-not-allowed border-(--theme-border) bg-(--theme-secondary-bg)/40 opacity-50'
                        : isSelected
                          ? 'border-primary bg-primary/10 text-primary hover:border-primary hover:bg-(--theme-secondary-bg)'
                          : 'border-(--theme-border) bg-(--theme-card-bg) text-(--theme-text) hover:border-primary hover:bg-(--theme-secondary-bg)'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-10 w-10 items-center justify-center rounded-full ${isSelected && !isDisabled ? 'bg-primary text-primary-action' : 'bg-(--theme-secondary-bg)'
                            }`}
                        >
                          <UserRound size={16} />
                        </span>
                        <div>
                          <p className="font-800 flex items-center gap-2">
                            {messenger.displayName}
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-700 uppercase tracking-wide ${messenger.isAvailable
                                ? 'bg-success-bg text-success border border-success-border'
                                : 'bg-danger-bg text-danger border border-danger-border'
                                }`}
                            >
                              {messenger.isAvailable ? 'Disponible' : 'Ocupado'}
                            </span>
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-semibold opacity-70">
                        {isDisabled ? '' : isSelected ? 'Seleccionado' : 'Elegir'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={!selectedCourierId || isLoading || messengersLoading}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-primary-action transition hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? 'Asignando…' : 'Confirmar asignación'}
              </button>
            </div>
          </div>
        </section>
      </div>
    ),
    document.body,
  );
}
