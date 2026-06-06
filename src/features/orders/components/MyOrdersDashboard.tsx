import { useState, useEffect, useRef } from 'react';
import { ChevronRight, PackageCheck, RotateCcw, Truck, CheckCircle, X } from 'lucide-react';
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
        console.error('Error cargando devoluciones:', err);
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
        console.error('Error cargando pedidos:', err);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user, authReady]);

  if (!authReady || loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] text-(--theme-text)">
        <span className="animate-pulse font-medium text-sm">
          Cargando tus pedidos...
        </span>
      </div>
    );
  }

  const activeCount = orders.filter((order) =>
    ['CREADO', 'ASIGNADO', 'RESERVADO', 'PENDIENTE', 'EMPAQUETADO', 'LISTO', 'EN CAMINO'].includes(
      order.status
    )
  ).length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-(--theme-text)">
      {deliveredNotification && (
        <div className="fixed right-4 top-24 z-50 w-[min(calc(100vw-2rem),24rem)] rounded-xl border border-[#88B04B]/30 bg-(--theme-card-bg) p-4 text-sm shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-full bg-[#88B04B]/15 p-1.5 text-[#5f8134]">
                <CheckCircle size={18} />
              </span>
              <div>
                <p className="font-bold text-[#5f8134]">Tu pedido fue entregado</p>
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

      <nav aria-label="Ruta de navegación" className="mb-6 flex items-center gap-2 text-sm">
        <a href="/" className="font-semibold opacity-70 transition-opacity hover:opacity-100">
          Inicio
        </a>
        <ChevronRight size={14} className="opacity-35" aria-hidden="true" />
        <span className="font-bold text-primary" aria-current="page">
          Mis pedidos
        </span>
      </nav>

      <section className="mb-5 rounded-xl border border-(--theme-border) bg-(--theme-card-bg) px-5 py-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Compras</p>
            <h1 className="mt-0.5 text-2xl font-display font-extrabold tracking-tight">
              Mis pedidos y devoluciones
            </h1>
            <p className="mt-1 max-w-2xl text-sm opacity-70">
              Revisa el estado de tus compras, confirma la recepción y gestiona devoluciones cuando
              corresponda.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[330px]">
            <div className="rounded-lg border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-2">
              <PackageCheck size={16} className="mb-1 text-primary" />
              <p className="text-xl font-display font-black">{orders.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-55">Pedidos</p>
            </div>
            <div className="rounded-lg border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-2">
              <Truck size={16} className="mb-1 text-primary" />
              <p className="text-xl font-display font-black">{activeCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-55">Activos</p>
            </div>
            <div className="rounded-lg border border-(--theme-border) bg-(--theme-secondary-bg) px-3 py-2">
              <RotateCcw size={16} className="mb-1 text-primary" />
              <p className="text-2xl font-display font-black">{returns.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-55">
                Devoluciones
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="mb-5 flex w-fit rounded-full border border-(--theme-border) bg-(--theme-secondary-bg) p-1">
        <button
          onClick={() => setActiveTab('orders')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-primary text-(--theme-bg) shadow-sm' : 'opacity-65 hover:opacity-100'}`}
        >
          Pedidos
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`rounded-full px-4 py-2 text-sm font-bold transition-all ${activeTab === 'returns' ? 'bg-primary text-(--theme-bg) shadow-sm' : 'opacity-65 hover:opacity-100'}`}
        >
          Devoluciones
        </button>
      </div>

      {activeTab === 'orders' ? (
        <OrderList orders={orders} />
      ) : (
        <div className="flex flex-col gap-4">
          {returns.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-xl opacity-60">
              No tienes solicitudes de devolución actualmente.
            </div>
          ) : (
            returns.map((ret) => <ReturnCard key={ret.id} returnReq={ret} />)
          )}
        </div>
      )}
    </div>
  );
}