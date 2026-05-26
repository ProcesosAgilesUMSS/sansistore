import { useState, useEffect } from 'react';
import { useAuthUser } from '../../../hooks/useAuthUser';
import { getMyOrders, getMyReturns } from '../services/ordersService';
import ReturnCard from './ReturnCard';
import type { Order, ReturnRequest } from '../types';
import OrderCard from './OrderCard';

export default function MyOrdersDashboard() {
  const { user, authReady } = useAuthUser();
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const navigateToOrder = (order: Order) => {
    window.location.href = `/mis-pedidos/${order.id}`;
  };

useEffect(() => {
    if (authReady) {
      if (user) {
        Promise.all([
          getMyOrders(user.uid),
          getMyReturns(user.uid)
        ]).then(([ordersData, returnsData]) => {
          setOrders(ordersData);
          setReturns(returnsData);
          setLoading(false);
        }).catch(err => {
          console.error("Error cargando datos:", err);
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
        <div className="flex flex-col gap-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-2xl opacity-60">
              Aún no has realizado ninguna compra.
            </div>
          ) : (
            orders.map(order => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onSelect={navigateToOrder} 
              />
            ))
          )}
        </div>
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
