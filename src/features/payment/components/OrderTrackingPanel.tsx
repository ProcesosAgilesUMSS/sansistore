import { CheckCircle2, ClipboardList, MapPin, PackageCheck } from 'lucide-react';
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
            Tu compra fue registrada correctamente en el sistema.
          </p>
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border-light p-3">
          <p className="mb-1 text-xs font-semibold text-text-light opacity-60">
            Pedido
          </p>
          <p className="break-all font-bold text-text-light">
            {confirmedOrder.orderCode}
          </p>
          <p className="mt-1 break-all text-xs font-semibold text-text-light opacity-50">
            {confirmedOrder.orderId}
          </p>
        </div>
        <div className="rounded-lg border border-border-light p-3">
          <p className="mb-1 text-xs font-semibold text-text-light opacity-60">
            Metodo de pago
          </p>
          <p className="font-bold text-text-light">
            {confirmedOrder.paymentMethodLabel}
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
          <p className="font-bold text-primary">{confirmedOrder.statusLabel}</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border-light p-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-bold text-text-light">
          <PackageCheck size={16} className="text-primary" />
          Productos comprados
        </p>
        <div className="space-y-2">
          {confirmedOrder.items.map((item) => (
            <div
              key={item.productId}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <span className="text-text-light">
                {item.quantity} x {item.name}
              </span>
              <span className="font-semibold text-text-light">
                {formatMoney(item.subtotal)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2 border-t border-border-light pt-3 text-sm">
          <div className="flex justify-between gap-3 text-text-light opacity-75">
            <span>Productos</span>
            <span>{formatMoney(confirmedOrder.productsTotal)}</span>
          </div>
          <div className="flex justify-between gap-3 text-text-light opacity-75">
            <span>Cargos adicionales</span>
            <span>{formatMoney(confirmedOrder.additionalCharges)}</span>
          </div>
          <div className="flex justify-between gap-3 font-black text-text-light">
            <span>Total del pedido</span>
            <span>{formatMoney(confirmedOrder.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
        <div className="rounded-lg border border-border-light p-3">
          <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-text-light opacity-60">
            <MapPin size={13} />
            Direccion de entrega
          </p>
          <p className="font-bold text-text-light">
            {confirmedOrder.deliveryAddress}
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
      </div>
    </section>
  );
}
