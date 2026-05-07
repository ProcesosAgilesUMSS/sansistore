import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "../types";
import { getSentOrders } from "../services/ordersService";
import OrderFilter from "./OrderFilter";
import OrderHeader from "./OrderHeader";
import OrderItem from "./OrderItem";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";

export default function SentOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    getSentOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const filteredOrders = selectedStatuses.length === 0
    ? orders
    : orders.filter((order) => selectedStatuses.includes(order.status));

  return (
    <section className="px-3 grid bg-bg-light
    grid-cols-[repeat(8,1fr)]
    min-[760px]:grid-cols-[repeat(16,1fr)]
    min-[960px]:grid-cols-[repeat(24,1fr)]"
      aria-labelledby="orders-title"
    >
      <h2 className="col-span-full tracking-[-0.07em] text-[calc(4.48431vw+36.5112px)] mb-16 leading-[100%]">
        Pedidos enviados <sup className="top-[-1em] text-[0.4em] tracking-tight">({orders.length})</sup>
      </h2>

      {loading ? (
        <div className="col-span-full flex justify-center items-center py-40 gap-x-5">
          <GridSpinner />
          <LoadingMessage />
        </div>
      ) : (
        <>
          <OrderFilter
            selectedStatuses={selectedStatuses}
            toggleStatus={toggleStatus}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          <div className="grid grid-cols-subgrid col-span-full min-[960px]:col-start-8 min-[960px]:col-end-25">
            <OrderHeader />
            <ul className="col-span-full grid grid-cols-subgrid">
              {filteredOrders.map((order) => (
                <OrderItem key={order.id} order={order} />
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
