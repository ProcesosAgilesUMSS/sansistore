import { BookMarkedIcon } from "lucide-react";
import { STATUS_LABELS } from "../types";
import type { Order } from "../types";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";

interface OrderProductDetailProps {
  order: Order;
  onBack: () => void;
  onReserve?: () => void;
  isReserving?: boolean;
}

export default function OrderProductDetail({
  order,
  onBack,
  onReserve,
  isReserving,
}: OrderProductDetailProps) {
  const hasItems = order.items.length > 0;

  return (
    <section
      className="col-span-full min-[960px]:col-start-4 min-[960px]:col-end-22 grid grid-cols-subgrid gap-y-10 mt-16"
      aria-labelledby="order-detail-title"
    >
      <div className="col-span-full flex items-start justify-between pb-2">
        <div>
          <p className="uppercase text-xs mb-2">
            / detalle del pedido
          </p>
          <h3
            id="order-detail-title"
            className="text-[calc(4.48431vw+2.5112px)] tracking-[-0.07em] leading-[100%]"
          >
            {order.id}
          </h3>
          <p className="text-sm mt-4">
            Destino: {order.delivery.destination}
          </p>
          <div className="text-sm flex items-center gap-2 mt-1">
            <span>Estado:</span>
            <div className="uppercase text-xs border p-[2px_6px_2.5px] border-dotted rounded flex items-center gap-1.5 border-[#1e1e1e44] dark:border-[#f5f3ef44]">
              <div
                className={`size-1.5 rounded-full ${
                  order.status === "CREADO" ? "bg-orange-500" :
                  order.status === "RESERVADO" ? "bg-blue-500" :
                  order.status === "PENDIENTE" ? "bg-yellow-500" :
                  order.status === "EMPAQUETADO" ? "bg-purple-500" :
                  order.status === "in_transit" ? "bg-blue-500" :
                  order.status === "delivered" ? "bg-green-500" :
                  "bg-current"
                }`}
              />
              {STATUS_LABELS[order.status]}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <button
            type="button"
            onClick={onBack}
            className="uppercase text-xs border border-[#1e1e1e44] dark:border-[#f5f3ef44] p-[4px_12px_4.5px] border-dotted rounded hover:bg-secondary-bg-light transition-colors"
          >
            Volver
          </button>
          {order.status === "CREADO" && onReserve && (
            <button
              onClick={onReserve}
              disabled={isReserving}
              className={`rounded-full bg-primary text-white px-5 py-2.5 text-sm uppercase font-bold tracking-wider transition-all duration-200 flex items-center gap-2 ${
                isReserving
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:opacity-90 hover:scale-105 hover:-translate-y-0.5 active:scale-95 active:translate-y-0 hover:shadow-lg"
              }`}
            >
              {isReserving ? (
                <>
                  <GridSpinner size={4} />
                  <LoadingMessage text="Reservando" />
                </>
              ) : (
                <>
                  <BookMarkedIcon size={16} />
                  Reservar Pedido
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {!hasItems ? (
        <div className="col-span-full border border-dotted border-[#1e1e1e44] text-sm">
          Este pedido no contiene productos registrados.
        </div>
      ) : (
        <div className="col-span-full grid grid-cols-subgrid gap-y-4">
          <header className="col-span-full grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 uppercase text-xs border-b border-dotted pb-2">
            <span>/ Producto</span>
            <span>/ Cantidad</span>
            <span>/ P. Unitario</span>
            <span className="text-right">Subtotal</span>
          </header>

          <ul className="col-span-full grid grid-cols-subgrid gap-y-3">
            {order.items.map((item) => (
              <li
                key={item.itemId}
                className="col-span-full grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-dotted pb-3 items-start"
              >
                <div>
                  <p className="font-medium text-sm">{item.productName}</p>
                  <p className="text-xs">
                    Código: {item.productId}
                  </p>
                </div>
                <p className="text-sm">{item.quantity}</p>
                <p className="text-sm">Bs {item.price}</p>
                <p className="font-medium text-sm text-right">Bs {item.subtotal}</p>
              </li>
            ))}
          </ul>

          {typeof order.total === "number" && (
            <div className="col-span-full flex justify-end py-2 mb-8">
              <p className="text-lg font-semibold">
                Total: Bs {order.total}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
