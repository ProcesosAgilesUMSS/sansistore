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

  const date = formatDate(order.createdAt)
  const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black/35 backdrop-blur-xs flex items-center z-50 tracking-tight" onClick={closeModal}>
      <div
        className="mx-auto w-[65ch] grid grid-cols-[repeat(16,_1fr)] p-4 rounded-lg bg-white z-10 shadow-2xl border border-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="col-span-full mb-2 flex items-center justify-between">
          <div className="flex items-center uppercase gap-8">
            <span className="uppercase text-lg tracking-tight">{order.id}</span>
            <OrderStatusBadge status={order.status} />
          </div>
          <X size={18} className="cursor-pointer" onClick={closeModal} />
        </div>

        <div className="col-start-1 col-end-4 truncate text-sm text-black/50 leading-[100%]">Comprador:</div>
        <div className="col-start-4 col-end-13 leading-[100%]">{order.buyerId}</div>
        <div className="col-start-1 col-end-4 truncate text-sm text-black/50">Creación: </div>
        <div className="col-start-4 col-end-13">{date}</div>
        <div className="col-start-1 col-end-4 truncate text-sm text-black/50 leading-[100%]">Ubiación: </div>
        <div className="col-start-4 col-end-13 leading-[100%] mb-4">{order.delivery.destination}</div>

        <div className="col-span-full grid grid-cols-subgrid">
          <div className="col-span-full grid grid-cols-subgrid border-y border-dashed py-0.5">
            <div className="col-start-1 col-end-3">Cantidad</div>
            <div className="col-start-3 col-end-9 ml-4">Producto</div>
            <div className="col-start-10 col-end-12">Precio</div>
            <div className="col-start-13 col-end-15">Monto</div>
            <div className="col-start-16 col-end-17">Stock</div>
          </div>
          <ul className="grid grid-cols-subgrid col-span-full py-2">
            {order.items.map((item, index) => (
              <li key={index} className="grid grid-cols-subgrid col-span-full">
                <div className="col-start-1 col-end-2 text-center">{item.quantity}</div>
                <div className="col-start-3 col-end-10 truncate ml-4">{item.productName}</div>
                <div className="col-start-10 col-end-11 text-center">{item.price}</div>
                <div className="col-start-13 col-end-14 text-center">{item.subtotal}</div>
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
            <span>BS {order.total}</span>
          </div>
        </div>


        <div className="col-span-full flex justify-end mt-6">
          <OrderActions order={order} onSuccess={closeModal} />
        </div>
      </div>
    </div>
  )
}
