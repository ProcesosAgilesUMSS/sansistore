import { useState, useEffect } from "react";
import type { Order } from "@features/orders/types";
import { subscribeToSellerOrders } from "../services/ordersService";
import { useAuthUser } from "../../../hooks/useAuthUser";
import SellerOrderItem from "./SellerOrderItem";
import OrderModal from "./OrderModal";

export default function Orders() {
  const { user } = useAuthUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSellerOrders(user.uid, (newOrders) => {
      setOrders(newOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) return null;

  return (
    <>
      {selectedOrder ? (
        <OrderModal
          order={selectedOrder}
          closeModal={() => setSelectedOrder(null)}
        />
      ) : null}
      <ul className="grid grid-cols-18 mx-auto max-w-256 px-2">
        <li className="hidden min-[760px]:grid grid-cols-subgrid col-span-full uppercase border-b border-black/20 text-xs py-0.5">
          <div className="flex gap-x-2">
            <span>/</span>
            Orden
          </div>
          <div className="flex gap-x-2 min-[765px]:col-start-3 min-[765px]:col-end-7">
            <span>/</span>
            Destino
          </div>
          <div className="flex gap-x-2 min-[765px]:col-start-11 min-[765px]:col-end-13  min-[765px]:ml-2 min-[965px]:col-start-9 min-[965px]:col-end-13 min-[960px]:ml-10">
            <span>/</span>
            Estado
          </div>

          <div className="ml-4 hidden gap-x-2 min-[965px]:flex min-[965px]:col-start-13 min-[965px]:col-end-16">
            <span>/</span>
            Actualizado
          </div>

          <div className="flex gap-x-2 min-[765px]:col-start-16 min-[765px]:col-end-19">
            <span>/</span>
            Asignado a
          </div>
        </li>

        {orders.map((order, index) => (
          <SellerOrderItem
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
