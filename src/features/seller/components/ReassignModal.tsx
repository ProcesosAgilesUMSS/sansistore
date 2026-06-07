import { createPortal } from 'react-dom';
import { X, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { fetchDeliveryData } from '../services/sellerServices';
import type { Messenger, Order } from '../types';
import { ErrorMessage } from './ErrorMessage';

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

export function ReassignModal({
  order,
  messengers,
  selectedCourierId,
  messengersLoading,
  isLoading,
  onSelectCourier,
  onConfirm,
  onClose,
}: Props) {
  const [rejectingCourierId, setRejectingCourierId] = useState<string | null>(null);
  const [rejectingCourierName, setRejectingCourierName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!order.deliveryId) {
        setError('El pedido no tiene un ID de entrega asociado.');
      };
      try {
        const d = await fetchDeliveryData(db, order.deliveryId);
        if (!mounted) return;
        setRejectingCourierId((d as any)?.courierId ?? null);
        setRejectingCourierName((d as any)?.deliveryCourierName ?? null);
      } catch {
        setError('No se pudo obtener la información de la entrega');
      }
    })();

    return () => { mounted = false; };
  }, [order.deliveryId, order.orderId]);

  return createPortal(
    (
      <div
        className="fixed inset-0 z-999 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reassign-messenger-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-(--theme-border) bg-(--theme-card-bg) shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-(--theme-border) px-6 py-5">
            <div>
              <h2 id="reassign-messenger-title" className="mt-2 text-2xl font-bold tracking-tight text-(--theme-text)" style={{ fontFamily: 'Outfit, sans-serif' }}>
                #{order.orderId}
              </h2>
              <p className="mt-1 text-sm text-(--theme-text) opacity-70">El mensajero que rechazó no puede ser seleccionado.</p>
            </div>

            <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) transition hover:border-primary hover:text-primary" aria-label="Cerrar modal">
              <X size={18} />
            </button>
          </header>

          {
            error && (
              <ErrorMessage message={error} />
            )
          }
          <div className="p-6">
            <div className="rounded-3xl border border-(--theme-border) bg-(--theme-secondary-bg)/50 p-4">
              <p className="text-[11px] font-800 uppercase tracking-[0.24em] text-(--theme-text) opacity-45">Pedido pendiente</p>
              <p className="mt-1 text-lg font-900 text-(--theme-text)">{order.buyerName ?? 'Comprador desconocido'}</p>
              <p className="mt-1 text-sm text-(--theme-text) opacity-70">{order.locationLabel ?? 'Ubicación no registrada'}</p>
            </div>

            <div className="mt-5 grid gap-3">
              {rejectingCourierName && (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-4 text-sm text-(--theme-text) opacity-80">
                  <p className="text-xs font-800 opacity-60">Mensajero que rechazó</p>
                  <p className="mt-1 font-700">{rejectingCourierName}</p>
                </div>
              )}

              {messengersLoading ? (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50">Cargando mensajeros…</div>
              ) : messengers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-(--theme-border) px-4 py-6 text-sm text-(--theme-text) opacity-50">No hay mensajeros disponibles.</div>
              ) : (
                messengers.map((messenger) => {
                  const isRejecting = rejectingCourierId === messenger.uid;
                  const isSelected = selectedCourierId === messenger.uid;

                  return (
                    <button
                      key={messenger.uid}
                      type="button"
                      onClick={() => !isRejecting && onSelectCourier(order.orderId, messenger.uid)}
                      disabled={isRejecting || !!error}
                      className={`flex items-center justify-between rounded-2xl border px-4 py-4 text-left transition hover:border-primary hover:bg-(--theme-secondary-bg) ${isSelected ? 'border-primary bg-primary/10 text-primary' : 'border-(--theme-border) bg-(--theme-card-bg) text-(--theme-text)'} ${isRejecting ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-(--theme-secondary-bg)'}`}>
                          <UserRound size={16} />
                        </span>
                        <div>
                          <p className="font-800">{messenger.displayName}</p>
                          <p className="text-xs opacity-55">{messenger.institutionalId || 'Sin CI institucional'}</p>
                        </div>
                      </div>

                      <span className="text-sm font-semibold  opacity-70">{isRejecting ? 'Rechazó' : isSelected ? 'Seleccionado' : 'Elegir'}</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} disabled={isLoading} className="rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-700 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={onConfirm} disabled={!selectedCourierId || isLoading || messengersLoading || !!error} className="rounded-full bg-primary px-5 py-2.5 text-sm font-800 text-white transition hover:opacity-90 disabled:opacity-50">{isLoading ? 'Reasignando…' : 'Confirmar reasignación'}</button>
            </div>
          </div>
        </section>
      </div>
    ),
    document.body,
  );
}

export default ReassignModal;
