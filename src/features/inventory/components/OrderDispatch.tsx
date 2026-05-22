import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { PackageSearch, PackageCheck, AlertCircle, CheckCircle2, ChevronRight, Play } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
}

interface Order {
  id: string;
  sellerId?: string;
  status: string;
  items: OrderItem[];
  date?: any;
}

export const OrderDispatch: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Escuchar pedidos para atender: RESERVADO (nuevos) y PENDIENTE (en proceso)
    const q = query(collection(db, 'orders'), where('status', 'in', ['RESERVADO', 'PENDIENTE']));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = await Promise.all(snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();
        
        // Consultar la subcolección para saber qué productos buscar
        const itemsSnap = await getDocs(collection(db, 'orders', orderDoc.id, 'orderItems'));
        const items = itemsSnap.docs.map(itemDoc => {
          const itemData = itemDoc.data();
          return {
            productId: itemData.productId || itemDoc.id, 
            name: itemData.name || 'Producto sin nombre',
            quantity: itemData.quantity || 1
          };
        });

        return {
          id: orderDoc.id,
          ...orderData,
          items
        } as Order;
      }));

      // Ordenar para que los PENDIENTE salgan primero (ya se están trabajando)
      const sortedOrders = fetchedOrders.sort((a, b) => {
        if (a.status === 'PENDIENTE' && b.status === 'RESERVADO') return -1;
        if (a.status === 'RESERVADO' && b.status === 'PENDIENTE') return 1;
        return 0;
      });

      setOrders(sortedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función para pasar de RESERVADO -> PENDIENTE
  const handleStartPicking = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'PENDIENTE',
        warehouseStartedAt: serverTimestamp() 
      });
    } catch (err: any) {
      setError('Error al iniciar la preparación del pedido.');
    } finally {
      setProcessingId(null);
    }
  };

  // Función para pasar de PENDIENTE -> EMPAQUETADO (Vendedor recibio el pedido para enviarlo)
  const handleFinishPacking = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'EMPAQUETADO',
        warehouseFinishedAt: serverTimestamp()
      });
      setSuccess(`Pedido #${orderId.slice(-5).toUpperCase()} empaquetado y listo para el vendedor.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError('Error al marcar el pedido como empaquetado.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="animate-pulse h-32 bg-(--theme-secondary-bg) rounded-3xl"></div>;

  return (
    <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-xl text-primary">
          <PackageSearch className="w-6 h-6" />
        </div>
        <div>
          <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">Tablero de Almacén</h2>
          <p className="text-xs opacity-60 text-(--theme-text)">Busca, empaca y prepara los pedidos reservados</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="font-bold">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-bold">{success}</span>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-(--theme-border) rounded-2xl opacity-50">
          <p className="font-bold text-(--theme-text)">No hay tareas pendientes en almacén</p>
          <p className="text-sm">No hay pedidos reservados ni en proceso de empaque.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orders.map(order => (
            <div key={order.id} className="border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-mono bg-blue-500/20 text-blue-500 px-2 py-1 rounded-md font-bold">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                    order.status === 'PENDIENTE' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-500/20 text-zinc-500'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm mb-2">Vendedor: {order.sellerId || 'Desconocido'}</h3>
                
                {/* Lista de productos tipo checklist para el operador */}
                <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-xl p-3 mb-4">
                  <p className="text-xs font-bold mb-2 opacity-60 uppercase tracking-wider">Productos a buscar:</p>
                  <ul className="text-sm space-y-2">
                    {order.items.map((item, idx) => (
                      <li key={idx} className="flex justify-between items-center border-b border-(--theme-border)/50 pb-1 last:border-0 last:pb-0">
                        <span className="font-medium line-clamp-1">{item.name}</span>
                        <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-xs">x{item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* CAMBIOS DE ESTADO, RESERVADO-PENDIENTE & PENDIENTE-EMPAQUETADO */}
              {order.status === 'RESERVADO' ? (
                <button
                  onClick={() => handleStartPicking(order.id)}
                  disabled={processingId === order.id}
                  className="w-full bg-(--theme-border) hover:bg-primary/20 text-(--theme-text) py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50 border border-(--theme-border)"
                >
                  <Play className="w-4 h-4" />
                  {processingId === order.id ? 'Iniciando...' : 'EMPEZAR A BUSCAR'}
                </button>
              ) : (
                <button
                  onClick={() => handleFinishPacking(order.id)}
                  disabled={processingId === order.id}
                  className="w-full bg-primary hover:bg-primary/90 text-white py-2.5 rounded-xl text-sm font-bold transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
                >
                  <PackageCheck className="w-4 h-4" />
                  {processingId === order.id ? 'Sellando caja...' : 'PEDIDO EMPAQUETADO'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};