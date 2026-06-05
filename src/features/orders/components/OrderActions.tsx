import { useState } from "react";
import { cancelOrder, paidOrder, readyOrder, reserveOrder, returnOrder } from "../services/ordersService";
import type { Order } from "../types";

const ACTIONS = {
  EMPAQUETADO: { label: "Marcar como listo", color: "bg-[#7C3AED]", handler: readyOrder },
  CREADO: { label: "Reservar", color: "bg-[#2071F5]", handler: reserveOrder },
  "NO ENTREGADO": { label: "Devolver orden", color: "bg-[#D97706]", handler: returnOrder },
  ENTREGADO: { label: "Marcar como pagado", color: "bg-[#16A34A]", handler: paidOrder },
} as const;

export default function OrderActions({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAction = async (action: () => Promise<void>) => {
    setIsSubmitting(true);
    try {
      await action();
      onSuccess?.();
    } catch (error) {
      console.error("Error al ejecutar la acción:", error);
      alert("Error al ejecutar la acción.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (order.status === "RESERVADO") {
    return <CancelOrderSection order={order} onSuccess={onSuccess} />;
  }

  const config = ACTIONS[order.status as keyof typeof ACTIONS];
  if (!config) return null;

  return (
    <div className="text-right">
      <button
        className={`text-white rounded tracking-tight px-4 py-1.5 ${config.color} leading-[100%] cursor-pointer disabled:opacity-50`}
        onClick={() => handleAction(() => config.handler(order.id))}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Procesando..." : config.label}
      </button>
    </div>
  );
}

function CancelOrderSection({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
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
