import { useEffect, useState } from "react";
import type { Order } from "../types";
import { getOrderById, reserveOrder } from "../services/ordersService";
import OrderProductDetail from "./OrderProductDetail";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";
import RouteGuard from "../../../components/RouteGuard";

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
      <RouteGuard allowedRoles={['vendedor']}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-32 min-h-screen flex justify-center items-center gap-x-5">
          <GridSpinner />
          <LoadingMessage text="Loading order" />
        </div>
      </RouteGuard>
    );
  }

  if (error || !order) {
    return (
      <RouteGuard allowedRoles={['vendedor']}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-32 min-h-screen">
          <div className="mt-8">
            <p className="text-sm text-text-light/80">Pedido no encontrado</p>
            <a
              href="/orders"
              className="text-xs uppercase font-bold tracking-wider text-text-light/50 hover:text-text-light underline mt-4 inline-block transition-colors"
            >
              Volver a pedidos
            </a>
          </div>
        </div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={['vendedor']}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-32 min-h-screen">
        <OrderProductDetail
          order={order}
          onBack={() => window.history.back()}
          onReserve={handleReserve}
          isReserving={isReserving}
        />
      </div>
    </RouteGuard>
  );
}
