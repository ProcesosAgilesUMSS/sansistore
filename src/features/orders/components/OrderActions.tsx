import { useState } from "react";
import type { Order } from "../types";
import { reserveOrder, readyOrder } from "../services/ordersService";

export default function OrderActions({ order, onSuccess }: { order: Order; onSuccess?: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (actionFn: () => Promise<void>) => {
    setLoading(true);
    try {
      await actionFn();
      onSuccess?.();
    } catch (error) {
      console.error("Error performing order action:", error);
      alert("Hubo un error al procesar la acción.");
    } finally {
      setLoading(false);
    }
  };


  if (order.status === "EMPAQUETADO") {
    return (
      <button
        disabled={loading}
        onClick={() => handleAction(() => readyOrder(order.id))}
        className="bg-[#059669] text-white rounded-lg disabled:opacity-50 transition-opacity tracking-tight px-4 py-0.5 cursor-pointer text-sm"
      >
        {loading ? "Procesando..." : "ORDEN LISTA"}
      </button>
    );
  }

  if (order.status === "CREADO") {
    return (
      <button
        disabled={loading}
        onClick={() => handleAction(() => reserveOrder(order.id))}
        className="bg-[#2071F5] text-white rounded-lg disabled:opacity-50 transition-opacity tracking-tight px-4 py-0.5 cursor-pointer text-sm"
      >
        {loading ? "Procesando..." : "Reservar"}
      </button>
    );
  }

  return null;
}
