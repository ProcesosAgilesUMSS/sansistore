import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { PackageSearch, PackageCheck, AlertCircle, CheckCircle2, Play, X, ListFilter } from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string; // Mapeado exactamente como está en tu Firestore
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
  
  // Estado para el control del modal de empaque
  const [activeOrderForModal, setActiveOrderForModal] = useState<Order | null>(null);

  useEffect(() => {
    // Escuchar pedidos con estado RESERVADO y PENDIENTE
    const q = query(collection(db, 'orders'), where('status', 'in', ['RESERVADO', 'PENDIENTE']));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = await Promise.all(snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();
        
        // Consultar la subcolección orderItems
        const itemsSnap = await getDocs(collection(db, 'orders', orderDoc.id, 'orderItems'));
        const items = itemsSnap.docs.map(itemDoc => {
          const itemData = itemDoc.data();
          return {
            productId: itemData.productId || itemDoc.id, 
            productName: itemData.productName || 'Producto sin nombre', // Corregido a productName
            quantity: itemData.quantity || 1
          };
        });

        return {
          id: orderDoc.id,
          ...orderData,
          items
        } as Order;
      }));

      // Ordenar para que los PENDIENTE salgan primero en la lista
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

  // Función para cambiar de RESERVADO -> PENDIENTE y abrir el modal inmediatamente
  const handleStartPicking = async (order: Order) => {
    setProcessingId(order.id);
    setError('');
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, { 
        status: 'PENDIENTE',
        warehouseStartedAt: serverTimestamp() 
      });
      
      // Abre el modal automáticamente cambiando el estado local de forma síncrona
      setActiveOrderForModal({
        ...order,
        status: 'PENDIENTE'
      });
    } catch (err: any) {
      setError('Error al iniciar la preparación del pedido.');
    } finally {
      setProcessingId(null);
    }
  };

  // Función para cambiar de PENDIENTE -> EMPAQUETADO y cerrar el modal
  const handleFinishPacking = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { 
        status: 'EMPAQUETADO',
        warehouseFinishedAt: serverTimestamp()
      });
      
      setActiveOrderForModal(null); // Cierra el modal tras el éxito
      setSuccess(`Pedido #${orderId.slice(-5).toUpperCase()} empaquetado y listo para el vendedor.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError('Error al marcar el pedido como empaquetado.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="animate-pulse h-full min-h-[300px] bg-(--theme-secondary-bg) rounded-3xl"></div>;

  return (
    <>
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">Pedidos a Empacar</h2>
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
          <div className="text-center py-12 flex-grow flex flex-col justify-center border-2 border-dashed border-(--theme-border) rounded-2xl opacity-50">
            <p className="font-bold text-(--theme-text)">No hay tareas pendientes en almacén</p>
            <p className="text-sm text-(--theme-text) opacity-60">No hay pedidos reservados ni en proceso de empaque.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2">
            {orders.map(order => (
              <div key={order.id} className="border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-4 flex flex-col justify-between">
                <div className="mb-4">
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
                  <h3 className="font-bold text-sm text-(--theme-text)">Vendedor: {order.sellerId || 'Desconocido'}</h3>
                  <p className="text-xs text-(--theme-text) opacity-50 mt-1">
                    Contiene {order.items.reduce((acc, item) => acc + item.quantity, 0)} unidades de productos.
                  </p>
                </div>
                
                {/* BOTONES DE ACCIÓN PRINCIPAL */}
                {order.status === 'RESERVADO' ? (
                  <button
                    onClick={() => handleStartPicking(order)}
                    disabled={processingId === order.id}
                    className="w-full bg-(--theme-border) hover:bg-primary/20 text-(--theme-text) py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 disabled:opacity-50 border border-(--theme-border)"
                  >
                    <Play className="w-4 h-4 text-primary" />
                    {processingId === order.id ? 'Iniciando...' : 'EMPEZAR A BUSCAR'}
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveOrderForModal(order)}
                    className="w-full bg-primary text-(--theme-bg) py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:brightness-110 active:scale-[0.98] flex justify-center items-center gap-2"
                  >
                    <ListFilter className="w-4 h-4" />
                    VER LISTA / EMPACAR
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE CONTEO Y EMPAQUE (Estilo exacto de tu ProductModal) */}
      {activeOrderForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl shadow-2xl max-w-md w-full p-7 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Botón X de cerrar */}
            <button
              onClick={() => setActiveOrderForModal(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-(--theme-secondary-bg) border border-(--theme-border) flex items-center justify-center text-(--theme-text) opacity-60 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="text-xs font-mono bg-blue-500/20 text-blue-500 px-2 py-0.5 rounded-md font-bold">
                #{activeOrderForModal.id.slice(-6).toUpperCase()}
              </span>
              <h2 className="font-['Outfit'] font-black text-xl text-(--theme-text) mt-2 mb-1">
                Recolección de Pedido
              </h2>
              <p className="text-xs text-(--theme-text) opacity-50">
                Verifica físicamente los productos listados antes de empaquetar la caja.
              </p>
            </div>

            {/* Lista escaneable de productos con scroll interno */}
            <div className="flex-grow overflow-y-auto my-2 pr-1 space-y-2 max-h-[45vh]">
              <p className="text-[10px] text-(--theme-text) opacity-50 font-bold uppercase tracking-wider mb-1">Lista de verificación</p>
              
              {activeOrderForModal.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl p-3 flex justify-between items-center"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-['Outfit'] font-bold text-sm text-(--theme-text) line-clamp-2">
                      {item.productName} {/* Campo corregido según tu db */}
                    </p>
                    <p className="text-[11px] font-mono text-(--theme-text) opacity-40 mt-0.5">
                      ID: {item.productId}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-['Outfit'] font-black bg-primary/10 text-primary px-3 py-1.5 rounded-xl text-sm">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Botonera de control inferior idéntica a tu estándar */}
            <div className="pt-4 flex gap-3 border-t border-(--theme-border)/50 mt-4">
              <button
                type="button"
                onClick={() => setActiveOrderForModal(null)}
                className="flex-1 px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm border border-(--theme-border) text-(--theme-text) opacity-70 hover:opacity-100 hover:bg-(--theme-secondary-bg) transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={processingId === activeOrderForModal.id}
                onClick={() => handleFinishPacking(activeOrderForModal.id)}
                className="flex-[1.3] px-4 py-3 rounded-2xl bg-primary text-(--theme-bg) font-['Outfit'] font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all flex justify-center items-center gap-1"
              >
                <PackageCheck className="w-4 h-4" />
                {processingId === activeOrderForModal.id ? 'Guardando...' : 'EMPAQUETADO'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};