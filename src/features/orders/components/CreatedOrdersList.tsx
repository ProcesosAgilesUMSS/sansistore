import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "../types";
import { subscribeToCreatedOrders } from "../services/ordersService";
import OrderFilter from "./OrderFilter";
import CreatedOrderItem from "./CreatedOrderItem";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";

export default function CreatedOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = subscribeToCreatedOrders((data) => {
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
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
    <section
      key="created-orders-section"
      className="px-3 grid bg-bg-light
      grid-cols-[repeat(8,1fr)]
      min-[760px]:grid-cols-[repeat(16,1fr)]
      min-[960px]:grid-cols-[repeat(24,1fr)]"
      aria-labelledby="orders-created-title"
    >
      <h2 className="col-start-1 min-[960px]:col-start-2 col-span-full tracking-[-0.07em] text-[calc(4.48431vw+32.5112px)] leading-[100%] mb-4">
        Pedidos creados
        {!loading && (
          <sup className="top-[-1.5em] text-[0.35em] tracking-tight ml-5">
            ({orders.length === 0 ? "sin pedidos" : orders.length})
          </sup>
        )}
      </h2>

      {loading ? (
        <div className="col-span-full flex justify-center items-center h-80 gap-x-5">
          <GridSpinner />
          <LoadingMessage text="Receiving created orders" />
        </div>
      ) : orders.length === 0 ? (
        <div className="col-span-full h-80" />
      ) : (
        <>
          <OrderFilter
            selectedStatuses={selectedStatuses}
            toggleStatus={toggleStatus}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            availableStatuses={['CREADO', 'RESERVADO', 'EMPAQUETADO', 'PENDIENTE']}
          />

          <div className="grid grid-cols-subgrid col-span-full min-[960px]:col-start-2 min-[960px]:col-end-24 mb-10">
            <OrderHeader />
            <ul className="col-span-full grid grid-cols-subgrid">
              {filteredOrders.map((order) => (
                <CreatedOrderItem
                  key={order.id + order.status}
                  order={order}
                  onOrderReserved={() => {}}
                />
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}

function OrderHeader() {
  return (
    <header className="hidden grid-cols-subgrid border-b min-[760px]:grid min-[760px]:col-span-full min-[760px]:pb-1.5">
      <div className="uppercase col-start-1 col-end-3 text-xs flex gap-[4px]">
        <span>/</span>
        orden
      </div>
      <div className="uppercase col-start-3 col-end-8 text-xs flex gap-[4px]">
        <span>/</span>
        dirección
      </div>
      <div className="col-start-8 col-end-15 uppercase min-[960px]:col-start-13 min-[960px]:col-end-19 text-xs flex gap-[4px]">
        <span>/</span>
        estado
      </div>
    </header>
  )
}
