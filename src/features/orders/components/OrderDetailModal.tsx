import type { Order } from "../types";
import { X } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import OrderActions from "./OrderActions";

export default function OrderDetailModal({ order, closeModal }: { order: Order, closeModal: () => void }) {
  const formatDate = (value: any) => {
    if (!value) return "N/A";
    let date: Date;
    if (typeof value.toDate === "function") {
      date = value.toDate();
    } else if (value instanceof Date) {
      date = value;
    } else {
      date = new Date(value);
    }

    if (isNaN(date.getTime())) return "Fecha inválida";

    return date.toLocaleDateString("es-BO", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number | undefined) => {
    if (value === undefined || value === null) return "BS 0.00";
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
    }).format(value);
  };

  const date = formatDate(order.createdAt)
  const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center z-50 tracking-tight transition-opacity duration-200 ease-out"
      onClick={closeModal}
      style={{ animation: 'fadeIn 200ms ease-out' }}
    >
      <div
        className="mx-auto w-[65ch] grid grid-cols-[repeat(16,_1fr)] p-4 rounded-xl bg-white z-10 shadow-2xl border border-black/10 transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 300ms cubic-bezier(0.23, 1, 0.32, 1)' }}
      >
        <div className="col-span-full grid grid-cols-subgrid items-center mb-6">
          <span className="uppercase text-lg font-bold tracking-tight truncate col-start-1 col-end-7">{order.id}</span>
          <div className="col-start-8 col-end-12 w-fit">
            <OrderStatusBadge status={order.status} />
          </div>
          <button
            className="cursor-pointer col-start-16 col-end-17 justify-self-end p-1 hover:bg-black/5 rounded-full transition-all active:scale-90"
            onClick={closeModal}
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="col-start-1 col-end-4 truncate text-sm text-black/50 leading-[100%]">Comprador:</div>
        <div className="col-start-4 col-end-13 leading-[100%]">{order.buyerName}</div>
        <div className="col-start-1 col-end-4 truncate text-sm text-black/50">Creación: </div>
        <div className="col-start-4 col-end-13">{date}</div>
        <div className="col-start-1 col-end-4 truncate text-sm text-black/50 leading-[100%]">Ubiación: </div>
        <div className="col-start-4 col-end-13 leading-[100%] mb-4">{order.delivery.destination}</div>

        <div className="col-span-full grid grid-cols-subgrid">
          <div className="col-span-full grid grid-cols-subgrid border-y border-dashed py-0.5">
            <div className="col-start-1 col-end-3">Cantidad</div>
            <div className="col-start-3 col-end-9 ml-2">Producto</div>
            <div className="col-start-11 col-end-13">Precio</div>
            <div className="col-start-14 col-end-15">Monto</div>
            <div className="col-start-16 col-end-17">Stock</div>
          </div>
          <ul className="grid grid-cols-subgrid col-span-full py-2">
            {order.items.map((item, index) => (
              <li key={index} className="grid grid-cols-subgrid col-span-full">
                <div className="col-start-1 col-end-2 text-center">{item.quantity}</div>
                <div className="col-start-3 col-end-10 truncate ml-2">{item.productName}</div>
                <div className="col-start-11 col-end-13">{formatCurrency(item.unitPrice)}</div>
                <div className="col-start-14 col-end-16">{formatCurrency(item.subtotal)}</div>
                <div className="col-start-16 col-end-17 justify-self-end">{item.stockAvailable}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="col-span-full py-1.5 border-y border-dashed">
          <div className="flex justify-between">
            Número de artículos:
            <span>{totalQuantity}</span>
          </div>
          <div className="flex justify-between">
            Total:
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>


        <div className="col-span-full flex justify-end mt-6">
          <OrderActions order={order} onSuccess={closeModal} />
        </div>
      </div>
    </div>
  )
}
