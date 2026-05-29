import { useEffect, useState, useMemo } from "react";
import type { Order, OrderStatus } from "../types";
import { STATUS_LABELS } from "../types";
import { subscribeToSellerOrders } from "../services/ordersService";
import { auth } from "../../../lib/firebase";
import OrderDetailModal from "./OrderDetailModal";
import SellerOrderItem from "./SellerOrderItem";
import OrderGridSection from "./OrderGridSection";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'TODAS'>('TODAS');

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

  const filteredOrders = useMemo(() => {
    if (filterStatus === 'TODAS') return orders;
    return orders.filter(order => order.status === filterStatus);
  }, [orders, filterStatus]);

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
        count={filteredOrders.length}
        countLabel="ordenes"
        loading={loading}
        loadingMessage="Receiving your orders"
        ariaLabelledby="orders-seller-title"
      >
        {filteredOrders.map((order, index) => (
          <SellerOrderItem
            selectOrder={handleSelectOrder}
            key={order.id + order.status}
            order={order}
            index={index}
          />
        ))}
      </OrderGridSection >
    </>
  );
}

{/*        <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'TODAS')}
            className="border border-black/10 rounded px-2 py-1 text-sm bg-white"
          >
            <option value="TODAS">Todas</option>
            {Object.entries(STATUS_LABELS).map(([status, label]) => (
              <option key={status} value={status}>{label}</option>
            ))}
          </select>
*/}
