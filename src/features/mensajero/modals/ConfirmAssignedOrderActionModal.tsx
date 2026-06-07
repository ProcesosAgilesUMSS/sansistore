import { CheckCircle2, LoaderCircle, PackageCheck, X, XCircle } from 'lucide-react';
import { parseOrderId } from '../../cart/services/orderService';
import type { MessengerOrder } from '../types';
import { formatBolivianos } from '../utils/money';

type AssignedOrderAction = 'accept' | 'reject';

interface ConfirmAssignedOrderActionModalProps {
  order: MessengerOrder;
  action: AssignedOrderAction;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const actionConfig = {
  accept: {
    title: 'Aceptar pedido asignado',
    description: 'Confirma que tomarás este pedido para continuar con la entrega.',
    buttonLabel: 'Confirmar',
    Icon: CheckCircle2,
    iconClassName: 'bg-primary/15 text-primary',
    buttonClassName: 'bg-primary text-black hover:opacity-90',
    warning:
      'El pedido pasará a Pedidos aceptados y quedará bajo tu responsabilidad.',
  },
  reject: {
    title: 'Rechazar pedido asignado',
    description: 'Confirma que no podrás atender este pedido asignado.',
    buttonLabel: 'Confirmar',
    Icon: XCircle,
    iconClassName: 'bg-red-500/10 text-red-600',
    buttonClassName: 'bg-red-600 text-white hover:bg-red-700',
    warning:
      'El pedido quedará pendiente de reasignación para que el vendedor seleccione otro mensajero.',
  },
} satisfies Record<
  AssignedOrderAction,
  {
    title: string;
    description: string;
    buttonLabel: string;
    Icon: typeof CheckCircle2;
    iconClassName: string;
    buttonClassName: string;
    warning: string;
  }
>;

export type { AssignedOrderAction };

export default function ConfirmAssignedOrderActionModal({
  order,
  action,
  isSaving,
  onClose,
  onConfirm,
}: ConfirmAssignedOrderActionModalProps) {
  const config = actionConfig[action];
  const { friendlyName } = parseOrderId(order.id);
  const Icon = config.Icon;

  const confirmAction = async () => {
    if (isSaving) return;
    await onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assigned-order-action-title"
    >
      <section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-border-light bg-card-bg-light text-text-light shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
          <div className="flex items-center gap-4">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-2xl ${config.iconClassName}`}
            >
              <Icon size={24} />
            </span>

            <div>
              <h2
                className="text-xl font-black tracking-normal"
                id="assigned-order-action-title"
              >
                {config.title}
              </h2>
              <p className="text-sm font-medium opacity-70">
                {config.description}
              </p>
            </div>
          </div>

          <button
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase opacity-50">Pedido</p>
              <p className="mt-1 text-sm font-bold">{friendlyName}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase opacity-50">Cliente</p>
              <p className="mt-1 text-sm font-bold">{order.customerName}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase opacity-50">Zona</p>
              <p className="mt-1 text-sm font-bold">{order.city}</p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase opacity-50">
                Monto a cobrar
              </p>
              <p className="mt-1 text-sm font-bold">
                {formatBolivianos(order.cashToCollect)}
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 text-sm font-semibold">
            <PackageCheck className="mt-0.5 shrink-0 text-primary" size={18} />
            <p>{config.warning}</p>
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-border-light bg-secondary-bg-light/50 px-6 py-5 sm:flex-row">
          <button
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isSaving}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>

          <button
            className={`inline-flex h-12 flex-[1.4] items-center justify-center gap-2 rounded-full px-5 text-sm font-black uppercase transition disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClassName}`}
            disabled={isSaving}
            onClick={confirmAction}
            type="button"
          >
            {isSaving ? (
              <LoaderCircle className="animate-spin" size={16} />
            ) : (
              <Icon size={16} />
            )}
            {config.buttonLabel}
          </button>
        </footer>
      </section>
    </div>
  );
}
