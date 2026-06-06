import { useEffect, useState } from "react";
import type { Order } from "@features/orders/types";
import { subscribeToCreatedOrders } from "@features/orders/services/ordersService";
import CreatedOrderItem from "./CreatedOrderItem";
import OrderModal from "./OrderModal";
import Toast from "@features/admin/users/components/Toast";

export default function CreatedOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    const allowedMessages = ["Pedido marcado como listo.", "Pago validado correctamente."];
    if (type === "success" && !allowedMessages.includes(message)) return;
    setToast({ message, type });
  };

  useEffect(() => {
    const unsubscribe = subscribeToCreatedOrders((data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return null;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {selectedOrder ? (
        <OrderModal
          order={selectedOrder}
          closeModal={() => setSelectedOrder(null)}
          onNotification={showNotification}
        />
      ) : null}
      <ul className="grid grid-cols-18 mx-auto max-w-256 px-2">
        {/* Header */}
        <li className="grid grid-cols-subgrid col-span-full uppercase border-b border-black/20 text-xs">
          <div className="hidden min-[570px]:flex col-span-full min-[570px]:col-start-1 min-[570px]:col-end-4 min-[775px]:col-end-3 gap-x-2">
            <span>/</span>
            Orden
          </div>
          <div className="hidden min-[570px]:flex gap-x-2 min-[570px]:col-start-4 min-[570px]:col-end-16 min-[775px]:col-start-3 min-[775px]:col-end-12 min-[775px]:ml-4 min-[850px]:ml-0">
            <span>/</span>
            Destino
          </div>
          <div className="hidden min-[570px]:flex gap-x-2 min-[570px]:col-start-16 min-[570px]:col-end-19 min-[775px]:col-start-13 min-[775px]:col-end-16 min-[850px]:col-start-12 min-[850px]:col-end-14">
            <span>/</span>
            Estado
          </div>
          <div className="hidden min-[775px]:flex gap-x-2 min-[775px]:col-start-17 min-[775px]:col-end-19 min-[850px]:col-start-15 min-[850px]:col-end-17 min-[850px]:ml-4">
            <span>/</span>
            Total
          </div>
        </li>

        {orders.map((order, index) => (
          <CreatedOrderItem
            key={order.id}
            order={order}
            index={index}
            selectOrder={() => setSelectedOrder(order)}
          />
        ))}
      </ul>
    </>
  );
}

