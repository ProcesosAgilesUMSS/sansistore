import { useMemo, useState } from 'react';
import {
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
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-border-light bg-card-bg-light text-text-light shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <PackageX size={24} />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-normal">
                Problema de entrega
              </h2>
              <p className="text-sm font-medium opacity-70">
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

        <div className="space-y-6 px-6 py-6">
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

        <footer className="flex flex-col gap-3 border-t border-border-light bg-secondary-bg-light/50 px-6 py-5 sm:flex-row">
          <button
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase"
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex h-12 flex-[1.2] items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-black uppercase text-primary-action transition disabled:cursor-not-allowed disabled:opacity-50"
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
