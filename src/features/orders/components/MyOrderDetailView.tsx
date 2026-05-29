import { useEffect, useState } from "react";
import type { Order } from "../types";
import { getOrderById } from "../services/ordersService";
import OrderDetailsPanel from "./OrderDetailsPanel";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";

interface MyOrderDetailViewProps {
  orderId: string;
}

export default function MyOrderDetailView({ orderId }: MyOrderDetailViewProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  const handleOrderConfirmed = (updatedOrder: Order) => {
    setOrder(updatedOrder);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-(--theme-text)">
        <GridSpinner />
        <LoadingMessage text="Cargando pedido..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-2xl">
          <p className="text-sm opacity-60">Pedido no encontrado</p>
          <a
            href="/mis-pedidos"
            className="text-xs uppercase font-bold tracking-wider opacity-50 hover:opacity-100 underline mt-4 inline-block transition-colors"
          >
            Volver a mis pedidos
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <OrderDetailsPanel
        order={order}
        onBack={() => window.location.href = '/mis-pedidos'}
        onOrderConfirmed={handleOrderConfirmed}
      />
    </div>
  );
}
