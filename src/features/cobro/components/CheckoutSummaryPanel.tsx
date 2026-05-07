import { AlertCircle, CheckCircle2, CreditCard, ShoppingBag } from 'lucide-react';
import type {
  CashOnDeliveryOrderItem,
  CashPaymentMethod,
  ConfirmedCashOrder,
} from '../types';
import { formatMoney } from '../utils/money';

interface CheckoutSummaryPanelProps {
  items: CashOnDeliveryOrderItem[];
  productsTotal: number;
  additionalCharges: number;
  orderTotal: number;
  paymentMethod: CashPaymentMethod;
  saving: boolean;
  errorMessage: string;
  successMessage: string;
  confirmedOrder: ConfirmedCashOrder | null;
  onPaymentMethodChange: (method: CashPaymentMethod) => void;
  onConfirmOrder: () => void;
}

export function CheckoutSummaryPanel({
  items,
  productsTotal,
  additionalCharges,
  orderTotal,
  paymentMethod,
  saving,
  errorMessage,
  successMessage,
  confirmedOrder,
  onPaymentMethodChange,
  onConfirmOrder,
}: CheckoutSummaryPanelProps) {
  const hasSelectedProducts = items.length > 0;
  const isCashOnDelivery = paymentMethod === 'cash_on_delivery';

  return (
    <aside className="rounded-lg border border-border-light bg-card-bg-light p-5 lg:sticky lg:top-20 lg:self-start">
      <div className="mb-5 flex items-center gap-2">
        <ShoppingBag size={18} className="text-primary" />
        <h3 className="text-lg font-bold text-text-light">Confirmar pedido</h3>
      </div>

      <div className="mb-4 rounded-lg border border-primary/30 bg-primary/10 p-4">
        <p className="mb-1 text-xs font-semibold text-text-light opacity-70">
          Total a pagar al recibir
        </p>
        <p className="text-3xl font-black text-primary">
          {formatMoney(orderTotal)}
        </p>
        <p className="mt-1 text-xs font-semibold text-text-light opacity-70">
          El monto queda pendiente hasta que el mensajero registre el cobro.
        </p>
      </div>

      <div className="space-y-3 border-b border-border-light pb-4">
        {items.length === 0 ? (
          <p className="text-sm text-text-light opacity-60">
            Seleccione al menos un producto para habilitar la confirmación.
          </p>
        ) : (
          items.map((item) => (
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
          ))
        )}
      </div>

      <div className="space-y-2 border-b border-border-light py-4 text-sm">
        <div className="flex justify-between gap-3 text-text-light">
          <span>Productos</span>
          <span className="font-semibold">{formatMoney(productsTotal)}</span>
        </div>
        <div className="flex justify-between gap-3 text-text-light">
          <span>Cargos adicionales</span>
          <span className="font-semibold">{formatMoney(additionalCharges)}</span>
        </div>
        <div className="flex justify-between gap-3 pt-2 text-base font-black text-text-light">
          <span>Total del pedido</span>
          <span>{formatMoney(orderTotal)}</span>
        </div>
      </div>

      <div className="space-y-3 border-b border-border-light py-4">
        <p className="text-sm font-bold text-text-light">Método de pago</p>
        <button
          type="button"
          aria-pressed={isCashOnDelivery}
          onClick={() => onPaymentMethodChange('cash_on_delivery')}
          className="flex w-full items-start gap-3 rounded-lg border border-primary bg-primary/10 p-3 text-left transition hover:bg-primary/15"
        >
          <CreditCard size={18} className="mt-0.5 text-primary" />
          <span>
            <span className="block text-sm font-bold text-text-light">
              Pago contra entrega
            </span>
            <span className="block text-xs font-semibold text-text-light opacity-65">
              Paga en efectivo cuando recibas el pedido.
            </span>
          </span>
        </button>
        <div className="flex justify-between gap-3 text-sm text-text-light">
          <span>Estado del pago</span>
          <span className="font-bold text-primary">Pendiente de cobro</span>
        </div>
      </div>

      {errorMessage && (
        <div className="my-3 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          id="seguimiento-pedido"
          className="my-3 rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm text-text-light"
        >
          <div className="mb-2 flex gap-2 font-bold">
            <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" />
            <span>{successMessage}</span>
          </div>
          {confirmedOrder && (
            <div className="space-y-1 text-xs font-semibold opacity-80">
              <p>Pedido: {confirmedOrder.orderId}</p>
              <p>Pago asociado: {confirmedOrder.paymentId}</p>
              <p>Total pendiente: {formatMoney(confirmedOrder.total)}</p>
              <p>Estado: Pendiente de cobro</p>
            </div>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={onConfirmOrder}
        disabled={!hasSelectedProducts || saving}
        className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-primary-action px-4 text-sm font-bold text-bg-light transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {saving ? 'Registrando pedido...' : 'Confirmar pedido'}
      </button>
    </aside>
  );
}
