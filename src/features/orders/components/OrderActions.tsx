import { useState } from "react";
import type { Order } from "../types";
import { reserveOrder, readyOrder, paidOrder, cancelOrder } from "../services/ordersService";

export default function OrderActions({ order, onUpdate }: { order: Order; onUpdate?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleAction = async (actionFn: () => Promise<void>, closeModal = true) => {
    setLoading(true);
    try {
      await actionFn();
      onUpdate?.();
    } catch (error) {
      console.error("Error performing order action:", error);
      alert("Hubo un error al procesar la acción.");
    } finally {
      // Only reset prompt state if the action was successful or even on error
      // This ensures we clean up the prompt state correctly.
      setLoading(false);
      setShowCancelPrompt(false);
      setCancelReason("");
    }
  };

  const isProtectedStatus = ["CANCELADO", "ENTREGADO", "PAGADO", "CREADO"].includes(order.status);

  return (
    <div className="flex gap-2">
      {showCancelPrompt ? (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Motivo de cancelación"
            className="border rounded px-2 py-0.5 text-sm"
          />
          <button
            disabled={loading || !cancelReason}
            onClick={() => handleAction(() => cancelOrder(order.id, cancelReason), false)}
            className="bg-red-600 text-white rounded-lg disabled:opacity-50 transition-opacity tracking-tight px-2 py-0.5 cursor-pointer text-sm"
          >
            Confirmar
          </button>
          <button
            onClick={() => setShowCancelPrompt(false)}
            className="bg-gray-400 text-white rounded-lg px-2 py-0.5 cursor-pointer text-sm"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <>
          {order.status === "EMPAQUETADO" && (
            <button
              disabled={loading}
              onClick={() => handleAction(() => readyOrder(order.id))}
              className="bg-[#059669] text-white rounded-lg disabled:opacity-50 transition-opacity tracking-tight px-4 py-0.5 cursor-pointer text-sm"
            >
              {loading ? "Procesando..." : "ORDEN LISTA"}
            </button>
          )}

          {order.status === "CREADO" && (
            <button
              disabled={loading}
              onClick={() => handleAction(() => reserveOrder(order.id))}
              className="bg-[#2071F5] text-white rounded-lg disabled:opacity-50 transition-opacity tracking-tight px-4 py-0.5 cursor-pointer text-sm"
            >
              {loading ? "Procesando..." : "Reservar"}
            </button>
          )}

          {order.status === "ENTREGADO" && (
            <button
              disabled={loading}
              onClick={() => handleAction(() => paidOrder(order.id))}
              className="bg-[#2071F5] text-white rounded-lg disabled:opacity-50 transition-opacity tracking-tight px-4 py-0.5 cursor-pointer text-sm"
            >
              {loading ? "Procesando..." : "Pagado"}
            </button>
          )}

          {!isProtectedStatus && order.status !== "CANCELADO" && (
            <button
              disabled={loading}
              onClick={() => setShowCancelPrompt(true)}
              className="bg-red-600 text-white rounded-lg disabled:opacity-50 transition-opacity tracking-tight px-4 py-0.5 cursor-pointer text-sm"
            >
              Cancelar
            </button>
          )}
        </>
      )}
    </div>
  );
}
