import type { Order } from "../types";

interface OrderProductDetailProps {
  order: Order;
  onBack: () => void;
}

export default function OrderProductDetail({
  order,
  onBack,
}: OrderProductDetailProps) {
  const hasItems = order.items.length > 0;

  return (
    <section
      className="col-start-8 col-end-25 border border-[#1e1e1e22] rounded-xl p-6 bg-white"
      aria-labelledby="order-detail-title"
    >
      <div className="flex items-start justify-between gap-4 border-b pb-4 mb-6">
        <div>
          <p className="uppercase text-xs text-[#1e1e1e88] mb-2">
            Detalle del pedido
          </p>

          <h3
            id="order-detail-title"
            className="text-[calc(1.2vw+20px)] font-semibold tracking-[-0.04em]"
          >
            Pedido {order.id}
          </h3>

          <p className="text-sm text-[#1e1e1e99] mt-2">
            Destino: {order.delivery.destination}
          </p>

          <p className="text-sm text-[#1e1e1e99] mt-1">
            Estado: <span className="capitalize">{order.status}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="border border-[#1e1e1e44] rounded-full px-4 py-2 text-sm hover:bg-[#1e1e1e] hover:text-white transition-colors"
        >
          Volver a la lista
        </button>
      </div>

      {!hasItems ? (
        <div className="border border-dotted border-[#1e1e1e44] rounded-lg p-5">
          <p className="font-medium">Este pedido no contiene productos.</p>
          <p className="text-sm text-[#1e1e1e99] mt-2">
            No se encontraron productos registrados para este pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 uppercase text-xs border-b pb-2 text-[#1e1e1e99]">
            <span>Producto</span>
            <span>Cantidad</span>
            <span>Precio unitario</span>
            <span>Subtotal</span>
          </div>

          <ul className="space-y-3">
            {order.items.map((item) => (
              <li
                key={item.itemId}
                className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b pb-3 items-start"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-sm text-[#1e1e1e99] mt-1">
                    {item.description || "Sin características registradas"}
                  </p>
                  <p className="text-xs text-[#1e1e1e66] mt-1">
                    Código: {item.productId}
                  </p>
                </div>

                <p>{item.quantity}</p>
                <p>Bs {item.unitPrice}</p>
                <p className="font-medium">Bs {item.subtotal}</p>
              </li>
            ))}
          </ul>

          {typeof order.total === "number" && (
            <div className="flex justify-end pt-4">
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