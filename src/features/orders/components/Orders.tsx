import { useEffect, useState } from "react";
import type { Order } from "../types";
import { subscribeToSellerOrders } from "../services/ordersService";
import { auth } from "../../../lib/firebase";
import OrderDetailModal from "./OrderDetailModal";
import SellerOrderItem from "./SellerOrderItem";
import OrderGridSection from "./OrderGridSection";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  function handleSelectOrder(order: Order) {
    setSelectedOrder(order)
  }

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToSellerOrders(user.uid, (data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {selectedOrder && (
        <OrderDetailModal
          closeModal={() => setSelectedOrder(null)}
          order={selectedOrder}
        />
      )}
      <OrderGridSection
        title="Mis Ordenes"
        count={orders.length}
        countLabel="ordenes"
        loading={loading}
        loadingMessage="Receiving your orders"
        ariaLabelledby="orders-seller-title"
      >
        {orders.map((order, index) => (
          <SellerOrderItem
            selectOrder={handleSelectOrder}
            key={order.id + order.status}
            order={order}
            index={index}
          />
        ))}
      </OrderGridSection>
    </>
  );
}
