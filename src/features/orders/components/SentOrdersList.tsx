import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "../types";
import { getSentOrders } from "../services/ordersService";
import OrderFilter from "./OrderFilter";
import OrderHeader from "./OrderHeader";
import OrderItem from "./OrderItem";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";
import OrderProductDetail from "./OrderProductDetail";

const currencyFormatter = new Intl.NumberFormat("es-BO", {
  style: "currency",
  currency: "BOB",
  minimumFractionDigits: 2,
});

export default function SentOrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
  const deliveredOrders = orders.filter((order) => order.status === "delivered");
  const deliveredTotal = deliveredOrders.reduce(
    (total, order) => total + (order.total ?? 0),
    0
  );

  return (
    <section className="px-3 grid bg-bg-light
    grid-cols-[repeat(8,1fr)]
    min-[760px]:grid-cols-[repeat(16,1fr)]
    min-[960px]:grid-cols-[repeat(24,1fr)]"
      aria-labelledby="orders-title"
    >
      <h2 className="col-span-full tracking-[-0.07em] text-[calc(4.48431vw+36.5112px)] mb-16 leading-[100%]">
        Pedidos enviados
        {!loading && (
          <sup
            className="top-[-1.5em] text-[0.35em] tracking-tight ml-5"
          >
            ({orders.length === 0 ? "sin pedidos" : orders.length})
          </sup>
        )}
      </h2>

      {!loading && (
        <div className="col-span-full mb-12 grid gap-3 min-[760px]:col-start-1 min-[760px]:col-end-9 min-[960px]:col-end-11">
          <div className="border-y border-[#1e1e1e] py-4">
            <p className="uppercase text-xs flex gap-[4px]">
              <span>/</span>
              rendicion del dia
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-2">
              <p className="text-[calc(.78125vw+24px)] leading-none">
                {currencyFormatter.format(deliveredTotal)}
              </p>
              <p className="pb-1 text-sm text-[#1e1e1e99]">
                {`${deliveredOrders.length} pedidos entregados cobrados`}
              </p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="col-span-full flex justify-center items-center h-80 gap-x-5">
          <GridSpinner />
          <LoadingMessage />
        </div>
      ) : selectedOrder ? (
        <OrderProductDetail
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      ) : orders.length === 0 ? (
        <div className="col-span-full h-80" />
      ) : (
        <>
          <OrderFilter
            selectedStatuses={selectedStatuses}
            toggleStatus={toggleStatus}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
          />

          <div className="grid grid-cols-subgrid col-span-full min-[960px]:col-start-8 min-[960px]:col-end-25 mb-10">
            <OrderHeader />
            <ul className="col-span-full grid grid-cols-subgrid">
              {filteredOrders.map((order) => (
                <OrderItem
                  key={order.id}
                  order={order}
                  onViewDetail={() => setSelectedOrder(order)}
                />
              ))}
            </ul>
          </div>
        </>
      )}
    </section>
  );
}
