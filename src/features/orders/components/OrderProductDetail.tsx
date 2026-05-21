import { STATUS_LABELS } from "../types";
import type { Order } from "../types";

interface OrderProductDetailProps {
  order: Order;
  onBack: () => void;
  onConfirmReceived: (order: Order) => void;
  confirming: boolean;
  confirmationError: string;
}

export default function OrderProductDetail({
  order,
  onBack,
  onConfirmReceived,
  confirming,
  confirmationError,
}: OrderProductDetailProps) {
  const hasItems = order.items.length > 0;
  const canConfirmReception =
    order.status === "delivered" &&
    Boolean(order.deliveryId) &&
    !order.customerConfirmed;

  return (
    <section
      className="col-span-full min-[960px]:col-start-4 min-[960px]:col-end-22 grid grid-cols-subgrid gap-y-10"
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
            <div className="uppercase text-xs border p-[2px_5px_2.5px] border-dotted rounded   flex items-center w-[13.5ch] justify-between border-[#1e1e1e44]">
              {STATUS_LABELS[order.status]}
              <div
                className={`size-2 rounded-full ${order.status === "delivered" ? "bg-[#008000]" : "bg-[#0000FF]"}`}
              />
            </div>
          </div>
          {order.customerConfirmed && (
            <p className="mt-3 text-sm font-semibold text-green-700">
              Recepcion confirmada por el comprador
              {order.customerConfirmedAt
                ? ` el ${order.customerConfirmedAt.toLocaleString("es-BO")}`
                : ""}
            </p>
          )}
          {confirmationError && (
            <p className="mt-3 max-w-xl text-sm font-semibold text-red-700">
              {confirmationError}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="uppercase text-xs border border-[#1e1e1e44] p-[2px_5px_2.5px] border-dotted rounded cursor-pointer"
        >
          Volver
        </button>
      </div>

      {canConfirmReception && (
        <div className="col-span-full rounded border border-dotted border-[#1e1e1e44] p-4">
          <p className="text-sm font-semibold">
            Este pedido fue marcado como entregado por el mensajero.
          </p>
          <p className="mt-1 text-sm opacity-70">
            Confirma la recepcion solo si ya tienes los productos.
          </p>
          <button
            type="button"
            onClick={() => onConfirmReceived(order)}
            disabled={confirming}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirming ? "Confirmando..." : "Confirmar recepcion"}
          </button>
        </div>
      )}

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
