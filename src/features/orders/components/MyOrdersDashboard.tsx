import { useState, useEffect, useRef } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { getMyReturns, subscribeToMyOrders } from '../services/ordersService';
import ReturnCard from './ReturnCard';
import type { Order, ReturnRequest } from '../types';
import OrderList from './OrderList';
import { parseOrderId } from '../../cart/services/orderService';

const isDeliveredOrder = (order: Order) =>
  order.status === 'ENTREGADO' ||
  order.deliveryStatus === 'DELIVERED' ||
  order.deliveryStatus === 'delivered';

export default function MyOrdersDashboard() {
  const { user, authReady } = useAuthUser();
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deliveredNotification, setDeliveredNotification] = useState<Order | null>(null);
  const previousDeliveryState = useRef<Map<string, boolean>>(new Map());
  const initializedOrders = useRef(false);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setOrders([]);
      setReturns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    initializedOrders.current = false;
    previousDeliveryState.current = new Map();
    setDeliveredNotification(null);

    getMyReturns(user.uid)
      .then(setReturns)
      .catch((err) => {
        console.error("Error cargando devoluciones:", err);
        setReturns([]);
      });

    const unsubscribe = subscribeToMyOrders(
      user.uid,
      (ordersData) => {
        if (!initializedOrders.current) {
          previousDeliveryState.current = new Map(
            ordersData.map((order) => [order.id, isDeliveredOrder(order)])
          );
          initializedOrders.current = true;
        } else {
          const newlyDelivered = ordersData.find(
            (order) =>
              isDeliveredOrder(order) &&
              previousDeliveryState.current.get(order.id) === false
          );

          if (newlyDelivered) {
            setDeliveredNotification(newlyDelivered);
            setActiveTab('orders');
          }

          previousDeliveryState.current = new Map(
            ordersData.map((order) => [order.id, isDeliveredOrder(order)])
          );
        }

        setOrders(ordersData);
        setLoading(false);
      },
      (err) => {
        console.error("Error cargando pedidos:", err);
        setLoading(false);
      }
    );

    return unsubscribe;
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
      {deliveredNotification && (
        <div className="fixed right-4 top-24 z-50 w-[min(calc(100vw-2rem),24rem)] rounded-xl border border-[#88B04B]/30 bg-(--theme-card-bg) p-4 text-sm shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-[#88B04B]/15 p-1.5 text-[#5f8134]">
                <CheckCircle size={18} />
              </span>
              <div>
                <p className="font-bold text-[#5f8134]">
                  Tu pedido fue entregado
                </p>
                <p className="mt-1 opacity-75">
                  Pedido {parseOrderId(deliveredNotification.id).friendlyName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDeliveredNotification(null)}
              className="rounded-full p-1 opacity-60 transition hover:bg-(--theme-card-bg) hover:opacity-100"
              aria-label="Cerrar notificación"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <h1 className="text-3xl font-display font-extrabold mb-6 tracking-tight">
        Mis Pedidos y Devoluciones
      </h1>

      <div className="flex gap-4 mb-8 border-b border-(--theme-border)">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-2.5 text-sm font-bold transition-all ${activeTab === 'orders' ? 'border-b-2 border-primary text-primary' : 'opacity-60 hover:opacity-100'}`}
        >
          Pedidos ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-2.5 text-sm font-bold transition-all ${activeTab === 'returns' ? 'border-b-2 border-primary text-primary' : 'opacity-60 hover:opacity-100'}`}
        >
          Devoluciones ({returns.length})
        </button>
      </div>

      {activeTab === 'orders' ? (
        <OrderList orders={orders} />
      ) : (
        <div className="flex flex-col gap-4">
          {returns.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-2xl opacity-60">
              No tienes solicitudes de devolución actualmente.
            </div>
          ) : (
            returns.map(ret => (
              <ReturnCard key={ret.id} returnReq={ret} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
