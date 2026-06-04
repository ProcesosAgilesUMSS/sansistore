import { useState, useEffect } from 'react';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { getMyOrders } from '../services/ordersService';
import type { Order } from '../types';
import OrderList from './OrderList';
import { RotateCcw } from 'lucide-react';

export default function MyOrdersDashboard() {
  const { user, authReady } = useAuthUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authReady) {
      if (user) {
        getMyOrders(user.uid)
          .then((ordersData) => {
            setOrders(ordersData);
            setLoading(false);
          })
          .catch((err) => {
            console.error('Error cargando pedidos:', err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
  }, [user, authReady]);

  if (!authReady || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-(--theme-text)">
        <span className="animate-pulse font-medium text-sm">Cargando tus pedidos...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 font-sans text-(--theme-text)">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-display font-extrabold tracking-tight">
          Mis Pedidos
        </h1>
        <a
          href="/my-returns"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-(--theme-border) text-sm font-bold opacity-70 hover:opacity-100 transition-all hover:bg-(--theme-secondary-bg)"
        >
          <RotateCcw size={15} />
          Mis Devoluciones
        </a>
      </div>

      <OrderList orders={orders} />
    </div>
  );
}
