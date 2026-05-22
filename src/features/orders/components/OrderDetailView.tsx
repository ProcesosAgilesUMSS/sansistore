import { useEffect, useState } from "react";
import type { Order } from "../types";
import { getOrderById, reserveOrder } from "../services/ordersService";
import OrderProductDetail from "./OrderProductDetail";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";

interface OrderDetailViewProps {
  orderId: string;
}

export default function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isReserving, setIsReserving] = useState(false);

  useEffect(() => {
    getOrderById(orderId).then((data) => {
      if (!data) {
        setError(true);
      } else {
        setOrder(data);
      }
      setLoading(false);
    });
  }, [orderId]);

  const handleReserve = async () => {
    if (!order || order.status !== "CREADO" || isReserving) return;
    setIsReserving(true);
    try {
      await reserveOrder(order.id);
      // Optimistically update the local state
      setOrder({ ...order, status: "RESERVADO" });
    } catch (err) {
      console.error("Error reservando pedido:", err);
      alert("Error al reservar el pedido. Intenta de nuevo.");
    } finally {
      setIsReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="col-span-full flex justify-center items-center h-80 gap-x-5">
        <GridSpinner />
        <LoadingMessage text="Loading order" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <section className="px-3 grid bg-bg-light grid-cols-[repeat(8,1fr)] min-[760px]:grid-cols-[repeat(16,1fr)] min-[960px]:grid-cols-[repeat(24,1fr)]">
        <div className="col-span-full min-[960px]:col-start-4 min-[960px]:col-end-22 mt-16">
          <p className="text-sm">Pedido no encontrado</p>
          <a
            href="/orders"
            className="text-xs underline mt-4 inline-block"
          >
            Volver a pedidos
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="px-3 grid bg-bg-light grid-cols-[repeat(8,1fr)] min-[760px]:grid-cols-[repeat(16,1fr)] min-[960px]:grid-cols-[repeat(24,1fr)] pb-24">
      <OrderProductDetail
        order={order}
        onBack={() => window.history.back()}
        onReserve={handleReserve}
        isReserving={isReserving}
      />
    </section>
  );
}
