import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Order } from "../types";
import { getOrderById } from "../services/ordersService";
import OrderDetailsPanel from "./OrderDetailsPanel";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";

function OrderBreadcrumb() {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <nav
        aria-label="Ruta de navegación"
        className="flex items-center gap-2 text-sm text-(--theme-text)"
      >
        <a href="/" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
          Inicio
        </a>
        <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
        <a href="/mis-pedidos" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
          Mis pedidos
        </a>
        <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
        <span className="font-bold text-primary" aria-current="page">
          Detalle
        </span>
      </nav>

      <a
        href="/mis-pedidos"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-(--theme-border) bg-(--theme-card-bg) px-4 py-2 text-sm font-semibold text-(--theme-text) transition-colors hover:border-primary hover:text-primary"
      >
        <ArrowLeft size={16} />
        Atrás
      </a>
    </div>
  );
}

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
      <div className="max-w-7xl mx-auto p-4 md:p-8">
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
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <OrderBreadcrumb />
      <OrderDetailsPanel
        order={order}
        onBack={() => window.location.href = '/mis-pedidos'}
        onOrderConfirmed={handleOrderConfirmed}
      />
    </div>
  );
}
