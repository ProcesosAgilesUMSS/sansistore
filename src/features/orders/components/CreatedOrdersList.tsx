import { useEffect, useState } from "react";
import type { Order } from "@features/orders/types";
import { subscribeToCreatedOrders } from "@features/orders/services/ordersService";
import CreatedOrderItem from "@features/orders/components/CreatedOrderItem";
import OrderDetailModal from "@features/orders/components/OrderDetailModal";
import OrderGridSection from "@features/orders/components/OrderGridSection";

export default function CreatedOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  function handleSelectOrder(order: Order) {
    setSelectedOrder(order)
  }

  useEffect(() => {
    const unsubscribe = subscribeToCreatedOrders((data) => {
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
        title="Ordenes creadas"
        loading={loading}
        loadingMessage="Receiving created orders"
        ariaLabelledby="orders-created-title"
      >
        {orders.map((order, index) => (
          <CreatedOrderItem
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
