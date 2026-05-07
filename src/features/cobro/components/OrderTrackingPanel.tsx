import { CheckCircle2, ClipboardList } from 'lucide-react';
import type { ConfirmedCashOrder } from '../types';
import { formatMoney } from '../utils/money';

interface OrderTrackingPanelProps {
  confirmedOrder: ConfirmedCashOrder | null;
}

export function OrderTrackingPanel({ confirmedOrder }: OrderTrackingPanelProps) {
  if (!confirmedOrder) {
    return null;
  }

  return (
    <section
      id="seguimiento-pedido"
      className="mt-6 rounded-lg border border-primary/30 bg-card-bg-light p-5"
    >
      <div className="mb-4 flex items-start gap-3">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-primary" />
        <div>
          <h3 className="text-lg font-bold text-text-light">
            Pedido confirmado
          </h3>
          <p className="mt-1 text-sm font-semibold text-text-light opacity-70">
            El pago sera realizado al momento de la entrega.
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border-light p-3">
          <p className="mb-1 text-xs font-semibold text-text-light opacity-60">
            Pedido
          </p>
          <p className="break-all font-bold text-text-light">
            {confirmedOrder.orderId}
          </p>
        </div>
        <div className="rounded-lg border border-border-light p-3">
          <p className="mb-1 text-xs font-semibold text-text-light opacity-60">
            Pago asociado
          </p>
          <p className="break-all font-bold text-text-light">
            {confirmedOrder.paymentId}
          </p>
        </div>
        <div className="rounded-lg border border-border-light p-3">
          <p className="mb-1 text-xs font-semibold text-text-light opacity-60">
            Total pendiente
          </p>
          <p className="font-bold text-primary">
            {formatMoney(confirmedOrder.total)}
          </p>
        </div>
        <div className="rounded-lg border border-border-light p-3">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-text-light opacity-60">
            <ClipboardList size={13} />
            Estado
          </p>
          <p className="font-bold text-primary">Pendiente de cobro</p>
        </div>
      </div>
    </section>
  );
}
