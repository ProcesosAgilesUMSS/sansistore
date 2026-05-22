import type { Order } from "../types";
import LoadingMessage from "./LoadingMessage";
import GridSpinner from "./GridSpinner";
import { reserveOrder } from "../services/ordersService";
import { useState } from "react";
import { BookMarkedIcon, Check, Package, Search } from "lucide-react";

interface CreatedOrderItemProps {
  order: Order;
  onOrderReserved: () => void;
}

export default function CreatedOrderItem({ order, onOrderReserved }: CreatedOrderItemProps) {
  const [isReserving, setIsReserving] = useState(false);

  const isCreated = order.status.toUpperCase() === 'CREADO';
  const isReserved = order.status.toUpperCase() === 'RESERVADO';
  const isPending = order.status.toUpperCase() === 'PENDIENTE';
  const isPackaged = order.status.toUpperCase() === 'EMPAQUETADO';

  const handleReserve = async () => {
    if (!isCreated || isReserving) return;

    setIsReserving(true);
    try {
      await reserveOrder(order.id);
      // No reseteamos isReserving aquí.
      // Esperamos a que el cambio de status en las props (vía Firebase)
      // desmonte este componente gracias al cambio de 'key' en la lista.
    } catch (error) {
      console.error("Error confirming order:", error);
      alert("Error al confirmar el pedido. Por favor intenta de nuevo.");
      setIsReserving(false);
    }
  };

  const renderStatusDisplay = () => {
    if (isReserving) {
      return (
        <div className="flex items-center gap-2 text-black ml-2">
          <GridSpinner size={5} />
          <LoadingMessage text="Reservando" />
        </div>
      );
    }

    if (isReserved || isPending || isPackaged) {
      return (
        <div className="flex w-full items-center gap-6 ml-2">
          <div className="flex gap-2 items-center">
            <Check size={15} color="green" />
            <span>Reservado</span>
          </div>

          <div className="flex items-center gap-2">
            {isPending ? (
              <>
                <GridSpinner size={4.5} />
                <LoadingMessage text="Buscando productos" />
              </>
            ) : (
              (isPackaged) && (
                <div className="flex gap-2 w-[16ch]">
                  <Search size={18} color="blue" />
                  <span className="">Productos listos</span>
                </div>
              )
            )}
          </div>

          {isPackaged && (
            <div className="col-start-8  flex gap-2">
              <Package size={18} color="#C28B25" />
              <span>Empaquetado</span>
            </div>
          )}
        </div>
      );
    }

    return (
      <>
        {isCreated && (
          <button
            className="flex border gap-2 ml-2 px-2 py-0.5 rounded border-black/45 cursor-pointer"
            onClick={handleReserve}
            disabled={isReserving}
          >
            <BookMarkedIcon size={18} />
            {isReserving ? "Reservando..." : "Reservar"}
          </button>
        )}
      </>
    );
  };

  return (
    <li className="grid grid-cols-subgrid col-span-full border-b items-center py-[10px] min-[760px]:py-0">
      <div className="col-span-full min-[760px]:col-start-1 min-[760px]:col-end-3 text-sm flex items-center gap-[8px] text-xs">
        <div className="size-1.5 bg-[#1e1e1e]" />
        {order.id}
      </div>
      <div className="col-start-1 col-end-9 min-[760px]:col-start-3 min-[760px]:col-end-8 text-[calc(.78125vw+14.5px)] truncate
      min-[960px]:col-end-13">
        {order.delivery.destination}
      </div>

      <div className="min-[960px]:col-start-13 min-[960px]:col-end-23 min-[760px]:col-start-8 min-[760px]:col-end-16 text-sm flex
      items-center col-span-full">
        {renderStatusDisplay()}
      </div>
    </li>
  );
}


//         className="col-start-7 col-end-9 min-[760px]:col-start-14 min-[760px]:col-end-17 cursor-pointer text-sm
//   min-[960px]:col-start-20 min-[960px]:col-end-23 border text-center w-fit px-2 border-black/33 rounded disabled:opacity-50
//   disabled:cursor-not-allowed"
