// 14B8A6

import type { Order } from "../types";
import { STATUS_LABELS } from "../types";
import LoadingMessage from "./LoadingMessage";
import { reserveOrder } from "../services/ordersService";
import { useState } from "react";

interface CreatedOrderItemProps {
  order: Order;
  onOrderReserved: () => void; // Callback opcional para actualizar la lista
}

export default function CreatedOrderItem({ order, onOrderReserved }: CreatedOrderItemProps) {
  const isCreated = order.status.toUpperCase() === 'CREADO';
  console.log(order.status);

  const [isReserving, setIsReserving] = useState(false);

  const handleReserve = async () => {
    if (!isCreated || isReserving) return;

    setIsReserving(true);
    try {
      await reserveOrder(order.id);
      // Notificar al componente padre que la orden fue confirmada
      onOrderReserved?.();
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("Error al confirmar el pedido. Por favor intenta de nuevo.");
    } finally {
      setIsReserving(false);
    }
  };

  return (
    <li className="grid grid-cols-subgrid col-span-full border-b items-center py-[10px] min-[760px]:py-0">
      <div className="col-span-full min-[760px]:col-start-1 min-[760px]:col-end-3 text-sm flex items-center gap-[8px] text-xs">
        <div className="size-1.5 bg-[#1e1e1e]" />
        {order.id}
      </div>
      <div className="col-start-1 col-end-9 min-[760px]:col-start-3 min-[760px]:col-end-12 text-[calc(.78125vw+14.5px)] truncate min-[960px]:col-end-14">
        {order.delivery.destination}
      </div>

      {isCreated ? (
        <>
          <div
            className="min-[960px]:col-start-15 min-[960px]:col-end-19 min-[760px]:col-start-12 min-[760px]:col-end-13 text-sm flex items-center"
            aria-label={`Estado: ${STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || order.status}`}
          >
            <div
              className="uppercase text-xs p-[2px_5px_2.5px] rounded flex items-center w-[11ch] justify-between"
              style={{
                backgroundImage: `repeating-linear-gradient(90deg, #1e1e1e44 0, #1e1e1e44 4px, transparent 4px, transparent 8px),
                                repeating-linear-gradient(0deg, #1e1e1e44 0, #1e1e1e44 4px, transparent 4px, transparent 8px),
                                repeating-linear-gradient(90deg, #1e1e1e44 0, #1e1e1e44 4px, transparent 4px, transparent 8px),
                                repeating-linear-gradient(0deg, #1e1e1e44 0, #1e1e1e44 4px, transparent 4px, transparent 8px)`,
                backgroundSize: `100% 1px, 1px 100%, 100% 1px, 1px 100%`,
                backgroundPosition: `0 0, 100% 0, 0 100%, 0 0`,
                backgroundRepeat: `no-repeat`
              }}
            >
              <span className="truncate">{STATUS_LABELS[order.status as keyof typeof STATUS_LABELS] || 'creado'}</span>
              <div className="size-2 rounded-full bg-[#f97316] shrink-0 ml-2" />
            </div>
          </div>
          <button
            onClick={handleReserve}
            disabled={isReserving}
            className="col-start-7 col-end-9 min-[760px]:col-start-14 min-[760px]:col-end-17 cursor-pointer text-sm min-[960px]:col-start-19 min-[960px]:col-end-23 border text-center w-fit px-2 border-black/33 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isReserving ? "Reservando..." : "Reservar"}
          </button>
        </>
      ) : (
        <div className="flex col-start-1 col-end-5 min-[760px]:col-start-12 min-[760px]:col-end-17 min-[960px]:col-start-15 min-[960px]:col-end-21 items-center gap-2">
          <GridSpinner />
          <LoadingMessage text={order.status} />
        </div>
      )}
    </li>
  );
}

function GridSpinner() {
  return (
    <div className="grid grid-cols-3 size-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="bg-black/90 animate-pulse"
          style={{
            animationDelay: `${(i * 137.5) % 600}ms`,
            animationDuration: "800ms",
          }}
        />
      ))}
    </div>
  );
}
