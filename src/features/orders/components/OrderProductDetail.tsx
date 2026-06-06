import { BookMarkedIcon } from "lucide-react";
import { STATUS_LABELS } from "../types";
import type { Order } from "../types";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";
import { parseOrderId } from "../../cart/services/orderService";

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
  const { uuid, friendlyName } = parseOrderId(order.id);

  return (
    <section aria-labelledby="order-detail-title">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-border-light">
        <div>
          <p className="uppercase text-xs font-bold tracking-wider text-text-light/50 flex items-center gap-2 mb-3">
            <span className="text-primary">/</span>
            Detalle del pedido
          </p>
          <p className="text-xs font-mono text-text-light/40 mb-1">{uuid}</p>
          <h3
            id="order-detail-title"
            className="text-[clamp(1.75rem,4vw,3rem)] font-black tracking-[-0.04em] leading-none text-text-light"
          >
            {friendlyName}
          </h3>
          <p className="text-sm text-text-light/80 mt-4">
            Destino: {order.delivery.destination}
          </p>
          <div className="text-sm flex items-center gap-3 mt-3">
            <span className="text-text-light/60">Estado:</span>
            <div className="inline-flex items-center gap-1.5 rounded border border-border-light px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-text-light">
              <div
                className={`size-1.5 rounded-full ${
                  order.status === "CREADO" ? "bg-orange-500" :
                  order.status === "RESERVADO" ? "bg-blue-500" :
                  order.status === "PENDIENTE" ? "bg-yellow-500" :
                  order.status === "EMPAQUETADO" ? "bg-purple-500" :
                  order.status === "EN CAMINO" ? "bg-blue-500" :
                  order.status === "ENTREGADO" ? "bg-green-500" :
                  "bg-current"
                }`}
              />
              {STATUS_LABELS[order.status]}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onBack}
            className="rounded-full px-4 py-1.5 text-xs uppercase font-bold tracking-wider border border-border-light text-text-light/70 hover:text-text-light hover:bg-secondary-bg-light/50 transition-colors cursor-pointer self-start sm:self-auto"
          >
            Volver a pedidos
          </button>
          {order.status === "CREADO" && onReserve && (
            <button
              onClick={onReserve}
              disabled={isReserving}
              className={`w-full sm:w-auto rounded-full bg-primary text-white px-5 py-2.5 text-sm uppercase font-bold tracking-wider transition-all duration-200 flex items-center justify-center sm:justify-start gap-2 ${
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
        <div className="mt-8 text-center py-16 bg-card-bg-light border border-border-light rounded-[1.25rem]">
          <p className="text-sm text-text-light/40 font-medium">
            Este pedido no contiene productos registrados.
          </p>
        </div>
      ) : (
        <div className="mt-8 bg-card-bg-light border border-border-light rounded-[1.25rem] overflow-hidden">
          <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-5 py-4 border-b border-border-light bg-secondary-bg-light/30">
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-light/40">/ Producto</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-light/40">/ Cantidad</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-light/40">/ P. Unitario</span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-text-light/40 text-right">Subtotal</span>
          </div>

          <ul className="divide-y divide-border-light">
            {order.items.map((item) => (
              <li
                key={item.itemId}
                className="grid sm:grid-cols-[2fr_1fr_1fr_1fr] gap-2 sm:gap-4 px-5 py-4 items-center"
              >
                <div>
                  <p className="text-sm font-bold text-text-light">{item.productName}</p>
                  <p className="text-[11px] font-mono font-bold text-text-light/40 mt-0.5">
                    {item.productId}
                  </p>
                </div>
                
                <div className="flex justify-between sm:block mt-2 sm:mt-0">
                  <span className="sm:hidden text-[11px] font-bold uppercase tracking-wider text-text-light/40">Cantidad</span>
                  <p className="text-sm text-text-light/80">{item.quantity}</p>
                </div>

                <div className="flex justify-between sm:block">
                  <span className="sm:hidden text-[11px] font-bold uppercase tracking-wider text-text-light/40">P. Unitario</span>
                  <p className="text-sm text-text-light/80">Bs {item.unitPrice}</p>
                </div>

                <div className="flex justify-between sm:block">
                  <span className="sm:hidden text-[11px] font-bold uppercase tracking-wider text-text-light/40">Subtotal</span>
                  <p className="font-black text-sm text-text-light sm:text-right">Bs {item.subtotal}</p>
                </div>
              </li>
            ))}
          </ul>

          {typeof order.total === "number" && (
            <div className="px-5 py-6 border-t border-border-light bg-secondary-bg-light/20 flex justify-between sm:justify-end items-center gap-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-text-light/40">Total</span>
              <p className="text-[clamp(1.25rem,3vw,1.75rem)] font-black leading-none text-text-light">
                Bs {order.total}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
