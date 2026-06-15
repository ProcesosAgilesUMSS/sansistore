import { useState } from 'react';
import {
  cancelOrder,
  markOrderAsPaid,
  paidOrder,
  readyOrder,
  reserveOrder,
  returnOrder,
} from '../services/ordersService';
import type { Order } from '../types';

const ACTIONS = {
  EMPAQUETADO: {
    label: 'Marcar como listo',
    color: 'bg-primary',
    handler: readyOrder,
    successMsg: 'Pedido marcado como listo.',
  },
  CREADO: {
    label: 'Reservar',
    color: 'bg-primary',
    handler: reserveOrder,
    successMsg: 'Pedido reservado con éxito.',
  },
  'NO ENTREGADO': {
    label: 'Devolver orden',
    color: 'bg-(--theme-warning)',
    handler: returnOrder,
    successMsg: 'Orden devuelta.',
  },
  ENTREGADO: {
    label: 'Validar pago',
    color: 'bg-primary',
    handler: paidOrder,
    successMsg: 'Pago validado correctamente.',
  },
} as const;

const PAYMENT_VALIDATED_STATUSES = new Set([
  'pagado',
  'paid',
  'validado',
  'verified',
]);

function normalizeStatus(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function isPaymentValidated(order: Order): boolean {
  return (
    normalizeStatus(order.status) === 'pagado' ||
    PAYMENT_VALIDATED_STATUSES.has(normalizeStatus(order.paymentStatus))
  );
}

function canValidatePayment(order: Order): boolean {
  const orderStatus = normalizeStatus(order.status);
  const deliveryStatus = normalizeStatus(order.deliveryStatus);
  const isDeliveredOrCompleted =
    orderStatus === 'entregado' ||
    orderStatus === 'completado' ||
    deliveryStatus === 'delivered';

  return isDeliveredOrCompleted && !isPaymentValidated(order);
}

export default function OrderActions({
  order,
  onSuccess,
  onNotification,
}: {
  order: Order;
  onSuccess?: () => void;
  onNotification?: (type: 'success' | 'error', message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const handleAction = async (
    action: () => Promise<void>,
    successMsg?: string
  ) => {
    setIsSubmitting(true);
    try {
      await action();
      if (successMsg) onNotification?.('success', successMsg);

      onSuccess?.();
    } catch (error) {
      console.error('Error al ejecutar la acción:', error);
      onNotification?.('error', 'Error al ejecutar la acción.');
    } finally {
      setIsSubmitting(false);
      setShowPaymentConfirm(false);
    }
  };

  if (order.status === 'RESERVADO') {
    return <CancelOrderSection order={order} onSuccess={onSuccess} />;
  }

  if (order.status === 'RECHAZADO') {
    return (
      <RejectedOrderSection
        order={order}
        onSuccess={onSuccess}
        onNotification={onNotification}
      />
    );
  }

  const showPaymentValidation = canValidatePayment(order);
  const config = showPaymentValidation
    ? ACTIONS.ENTREGADO
    : ACTIONS[order.status as keyof typeof ACTIONS];
  if (!config) return null;

  return (
    <div className="text-right">
      <button
        className={`text-white rounded-full font-semibold px-5 py-2.5 text-sm ${config.color} cursor-pointer transition hover:opacity-90 disabled:opacity-50`}
        onClick={() => {
          if (showPaymentValidation) {
            setShowPaymentConfirm(true);
          } else {
            handleAction(() => config.handler(order.id), config.successMsg);
          }
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Procesando...' : config.label}
      </button>

      {showPaymentConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-(--theme-card-bg) border border-(--theme-border) p-6 shadow-2xl text-left text-(--theme-text)">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <span className="text-xl font-bold">$</span>
            </div>
            <h3 className="text-[1.6rem] font-semibold text-(--theme-text)">
              Validar pago del pedido
            </h3>
            <p className="mt-3 text-[1rem] leading-7 text-(--theme-text) opacity-70">
              Este pedido se marcará como pagado y se actualizará el inventario.
            </p>
            <div className="mt-5 rounded-2xl border border-(--theme-border) px-4 py-3 text-sm text-(--theme-text) opacity-60">
              Esta acción no se puede deshacer.
            </div>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setShowPaymentConfirm(false)}
                className="flex-1 rounded-full border border-(--theme-border) px-5 py-3 text-sm font-medium text-(--theme-text) transition hover:bg-(--theme-secondary-bg)"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleAction(
                    () => paidOrder(order.id),
                    ACTIONS.ENTREGADO.successMsg
                  )
                }
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Validando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CancelOrderSection({
  order,
  onSuccess,
}: {
  order: Order;
  onSuccess?: () => void;
}) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [incidentNotes, setIncidentNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!incidentNotes.trim()) {
      alert('Por favor, ingresa el motivo de la cancelación en las notas.');
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelOrder(
        order.id,
        'Reserva cancelada por vendedor',
        incidentNotes
      );
      setShowCancelForm(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error al cancelar la orden:', error);
      alert('Error al cancelar la orden.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCancelForm) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <textarea
          className="w-full p-2 border border-(--theme-border) bg-(--theme-bg) text-(--theme-text) rounded-xl text-sm outline-none focus:border-primary transition-colors"
          placeholder="Escribe el motivo de la cancelación..."
          value={incidentNotes}
          onChange={(e) => setIncidentNotes(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 text-sm text-(--theme-text) opacity-60 hover:opacity-100 hover:bg-(--theme-secondary-bg) border border-(--theme-border) rounded-full transition-colors"
            onClick={() => setShowCancelForm(false)}
            disabled={isSubmitting}
          >
            Cerrar
          </button>
          <button
            className="text-white rounded-full px-4 py-2 bg-(--theme-danger) text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Cancelando...' : 'Confirmar cancelación'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        className="text-white rounded-full tracking-tight px-5 py-2.5 bg-(--theme-danger) text-sm font-semibold transition hover:opacity-90 cursor-pointer"
        onClick={() => setShowCancelForm(true)}
      >
        Cancelar orden
      </button>
    </div>
  );
}

function RejectedOrderSection({
  order,
  onSuccess,
  onNotification,
}: {
  order: Order;
  onSuccess?: () => void;
  onNotification?: (type: 'success' | 'error', message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDeny = async () => {
    setIsSubmitting(true);
    try {
      await markOrderAsPaid(order.id);
      onNotification?.('success', 'Orden marcada como pagada.');
      onSuccess?.();
    } catch (error) {
      console.error('Error al denegar rechazo:', error);
      onNotification?.('error', 'Error al procesar la acción.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefund = () => {
    alert(
      'Para procesar la devolución del dinero, por favor contacta al administrador o sigue el proceso de reembolso correspondiente.'
    );
  };

  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={handleRefund}
        className="rounded-full border border-(--theme-border) px-5 py-2.5 text-sm font-medium text-(--theme-text) transition hover:bg-(--theme-secondary-bg) cursor-pointer"
      >
        Devolver dinero
      </button>
      <button
        onClick={handleDeny}
        disabled={isSubmitting}
        className="rounded-full bg-(--theme-danger) px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? 'Procesando...' : 'Denegar'}
      </button>
    </div>
  );
}
