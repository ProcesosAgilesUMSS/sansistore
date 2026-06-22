import { useMemo, useState } from 'react';
import {
  DollarSign,
  HandMetal,
  LoaderCircle,
  MapPinOff,
  MoreHorizontal,
  PackageX,
  ShieldAlert,
  UserX,
  X,
} from 'lucide-react';
import type { MessengerOrder } from '../types';

interface UndeliveredModalProps {
  order: MessengerOrder;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => Promise<void>;
}

const reasons = [
  { id: 'cliente_ausente', label: 'Cliente ausente', icon: UserX },
  {
    id: 'direccion_incorrecta',
    label: 'Direccion incorrecta',
    icon: MapPinOff,
  },
  {
    id: 'acceso_restringido',
    label: 'Acceso restringido',
    icon: ShieldAlert,
  },
  {
    id: 'falta_pago_cliente',
    label: 'Falta de pago del cliente',
    icon: DollarSign,
  },
  { id: 'cliente_rechazo', label: 'Cliente rechazo pedido', icon: HandMetal },
  { id: 'otro', label: 'Otro motivo', icon: MoreHorizontal },
];

export default function UndeliveredModal({
  order,
  isSaving,
  onClose,
  onConfirm,
}: UndeliveredModalProps) {
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');

  const currentDate = useMemo(
    () =>
      new Intl.DateTimeFormat('es-BO', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date()),
    []
  );

  const reasonText =
    selectedReason === 'otro'
      ? otherReason.trim()
      : reasons.find((reason) => reason.id === selectedReason)?.label || '';
  const canSubmit =
    reasonText.length > 0 &&
    (selectedReason !== 'otro' || otherReason.trim().length > 3);

  const confirmIncident = async () => {
    if (!canSubmit || isSaving) return;
    await onConfirm(reasonText, notes.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/65 p-2 backdrop-blur-sm sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="my-2 flex max-h-[calc(100dvh-1rem)] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-border-light bg-card-bg-light text-text-light shadow-2xl sm:my-0 sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px]">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border-light px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary sm:h-12 sm:w-12">
              <PackageX size={24} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-black leading-tight tracking-normal sm:text-xl">
                Problema de entrega
              </h2>
              <p className="text-sm font-medium leading-snug opacity-70">
                Registra el motivo por el que no se pudo entregar el pedido
              </p>
            </div>
          </div>

          <button
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
          <div className="grid gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase opacity-50">Cliente</p>
              <p className="mt-1 text-sm font-bold">{order.customerName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-50">Zona</p>
              <p className="mt-1 text-sm font-bold">{order.city}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase opacity-50">Fecha</p>
              <p className="mt-1 text-sm font-bold">{currentDate}</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] opacity-60">
              Selecciona el problema
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {reasons.map((reason) => {
                const Icon = reason.icon;
                const active = selectedReason === reason.id;

                return (
                  <button
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-bold transition ${
                      active
                        ? 'border-primary bg-primary/15 text-primary'
                        : 'border-border-light bg-card-bg-light hover:border-primary/50'
                    }`}
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    type="button"
                  >
                    <Icon size={18} />
                    {reason.label}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedReason === 'otro' && (
            <label className="block text-sm font-bold">
              Describe el motivo
              <textarea
                className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-border-light bg-secondary-bg-light px-4 py-3 text-sm font-medium outline-none focus:border-primary"
                onChange={(event) => setOtherReason(event.target.value)}
                placeholder="Ej: El edificio estaba cerrado..."
                value={otherReason}
              />
            </label>
          )}

          <label className="block text-sm font-bold">
            Observaciones adicionales
            <textarea
              className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-border-light bg-secondary-bg-light px-4 py-3 text-sm font-medium outline-none focus:border-primary"
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Ej: Se intento llamar 2 veces..."
              value={notes}
            />
          </label>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-border-light bg-secondary-bg-light/50 px-4 py-3 sm:flex-row sm:px-6 sm:py-4">
          <button
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex min-h-12 flex-[1.2] items-center justify-center gap-2 rounded-full bg-primary px-5 py-2 text-center text-sm font-black uppercase leading-tight text-primary-action transition disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit || isSaving}
            onClick={confirmIncident}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <PackageX size={16} />
            )}
            Registrar como no entregado
          </button>
        </footer>
      </section>
    </div>
  );
}
