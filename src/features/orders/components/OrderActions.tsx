import { useState } from "react";
import { cancelOrder, paidOrder, readyOrder, reserveOrder, returnOrder } from "../services/ordersService";
import type { Order } from "../types";

const ACTIONS = {
  EMPAQUETADO: { label: "Marcar como listo", color: "bg-[#7C3AED]", handler: readyOrder, successMsg: "Pedido marcado como listo." },
  CREADO: { label: "Reservar", color: "bg-[#2071F5]", handler: reserveOrder, successMsg: "Pedido reservado con éxito." },
  "NO ENTREGADO": { label: "Devolver orden", color: "bg-[#D97706]", handler: returnOrder, successMsg: "Orden devuelta." },
  ENTREGADO: { label: "Validar pago", color: "bg-[#16A34A]", handler: paidOrder, successMsg: "Pago validado correctamente." },
} as const;

export default function OrderActions({
  order,
  onSuccess,
  onNotification
}: {
  order: Order;
  onSuccess?: () => void;
  onNotification?: (type: "success" | "error", message: string) => void;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  const handleAction = async (action: () => Promise<void>, successMsg?: string) => {
    setIsSubmitting(true);
    try {
      await action();
      if (successMsg) onNotification?.("success", successMsg);

      onSuccess?.();
    } catch (error) {
      console.error("Error al ejecutar la acción:", error);
      onNotification?.("error", "Error al ejecutar la acción.");
    } finally {
      setIsSubmitting(false);
      setShowPaymentConfirm(false);
    }
  };

  if (order.status === "RESERVADO") {
    return <CancelOrderSection order={order} onSuccess={onSuccess} onNotification={onNotification} />;
  }

  const config = ACTIONS[order.status as keyof typeof ACTIONS];
  if (!config) return null;

  return (
    <div className="text-right">
      <button
        className={`text-white rounded tracking-tight px-4 py-1.5 ${config.color} leading-[100%] cursor-pointer disabled:opacity-50`}
        onClick={() => {
          if (order.status === "ENTREGADO") {
            setShowPaymentConfirm(true);
          } else {
            handleAction(() => config.handler(order.id), config.successMsg);
          }
        }}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Procesando..." : config.label}
      </button>

      {/* Modal de confirmación de pago (Lógica de main) */}
      {showPaymentConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl text-left">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <span className="text-xl font-bold">$</span>
            </div>
            <h3 className="text-[1.6rem] font-semibold text-[#222]">Validar pago del pedido</h3>
            <p className="mt-3 text-[1rem] leading-7 text-[#666]">
              Este pedido se marcará como pagado y se actualizará el inventario.
            </p>
            <div className="mt-5 rounded-2xl border border-[#e7e2d8] px-4 py-3 text-sm text-[#777]">
              Esta acción no se puede deshacer.
            </div>
            <div className="mt-7 flex gap-3">
              <button
                onClick={() => setShowPaymentConfirm(false)}
                className="flex-1 rounded-full border border-[#ddd6c7] px-5 py-3 text-sm font-medium text-[#333] transition hover:bg-[#f7f4ee]"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction(() => paidOrder(order.id), ACTIONS.ENTREGADO.successMsg)}
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:opacity-50"
              >
                {isSubmitting ? "Validando..." : "Confirmar"}
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
  onNotification
}: {
  order: Order;
  onSuccess?: () => void;
  onNotification?: (type: "success" | "error", message: string) => void;
}) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [incidentNotes, setIncidentNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!incidentNotes.trim()) {
      alert("Por favor, ingresa el motivo de la cancelación en las notas.");
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelOrder(order.id, "Reserva cancelada por vendedor", incidentNotes);
      setShowCancelForm(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error al cancelar la orden:", error);
      alert("Error al cancelar la orden.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCancelForm) {
    return (
      <div className="flex flex-col gap-2 mt-2">
        <textarea
          className="w-full p-2 border border-black/20 rounded text-sm outline-none focus:border-red-500"
          placeholder="Escribe el motivo de la cancelación..."
          value={incidentNotes}
          onChange={(e) => setIncidentNotes(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-1 text-sm text-black/50 hover:text-black border border-black/20 rounded"
            onClick={() => setShowCancelForm(false)}
            disabled={isSubmitting}
          >
            Cerrar
          </button>
          <button
            className="text-white rounded px-2 py-1 bg-red-600 text-sm disabled:opacity-50"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cancelando..." : "Confirmar cancelación"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-right">
      <button
        className="text-white rounded tracking-tight px-3 py-1.5 bg-red-600 leading-[100%] cursor-pointer"
        onClick={() => setShowCancelForm(true)}
      >
        Cancelar orden
      </button>
    </div>
  );
}
