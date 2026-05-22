import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { SendToBack, CheckCircle2, AlertCircle, X, ListFilter, User } from 'lucide-react';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
}

interface Order {
  id: string;
  sellerId?: string;
  status: string;
  items: OrderItem[];
  date?: any;
}

export const WarehouseHandover: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Estado para controlar el modal de entrega en mostrador
  const [activeOrderForModal, setActiveOrderForModal] = useState<Order | null>(null);

  useEffect(() => {
    // Escuchar únicamente los pedidos en estado EMPAQUETADO
    const q = query(collection(db, 'orders'), where('status', '==', 'EMPAQUETADO'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = await Promise.all(snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();
        
        // Consultar la subcolección orderItems del pedido
        const itemsSnap = await getDocs(collection(db, 'orders', orderDoc.id, 'orderItems'));
        const items = itemsSnap.docs.map(itemDoc => {
          const itemData = itemDoc.data();
          return {
            productId: itemData.productId || itemDoc.id, 
            productName: itemData.productName || 'Producto sin nombre',
            quantity: itemData.quantity || 1
          };
        });

        return {
          id: orderDoc.id,
          ...orderData,
          items
        } as Order;
      }));

      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Función para pasar de EMPAQUETADO -> LISTO (Despacho físico en mostrador)
  const handleHandover = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      const orderRef = doc(db, 'orders', orderId);
      
      // CORRECCIÓN: No creamos campos redundantes, solo actualizamos el estado y guardamos la hora exacta
      await updateDoc(orderRef, { 
        status: 'LISTO',
        horaDespacho: serverTimestamp() // Registra el momento exacto del recojo físico
      });

      setActiveOrderForModal(null);
      setSuccess(`Pedido #${orderId.slice(-5).toUpperCase()} entregado físicamente con éxito.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError('Error al registrar la entrega del pedido.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="animate-pulse h-full min-h-[300px] bg-(--theme-secondary-bg) rounded-3xl"></div>;

  return (
    <>
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
            <SendToBack className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">Pedidos a Entregar</h2>
            <p className="text-xs opacity-60 text-(--theme-text)">Registra la entrega física de los paquetes listos a sus respectivos vendedores</p>
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
            <p className="font-bold text-(--theme-text)">No hay empaques esperando recojo</p>
            <p className="text-sm text-(--theme-text) opacity-60">Todos los pedidos empaquetados ya fueron entregados.</p>
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
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-purple-500/20 text-purple-500">
                      EMPAQUETADO
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-(--theme-text)">
                    <User className="w-4 h-4 opacity-50" />
                    <span className="font-bold">Asignado a: {order.sellerId || 'Sin vendedor'}</span>
                  </div>
                  <p className="text-xs text-(--theme-text) opacity-50 mt-1 pl-6">
                    Total productos: {order.items.reduce((acc, item) => acc + item.quantity, 0)} unidades.
                  </p>
                </div>

                <button
                  onClick={() => setActiveOrderForModal(order)}
                  className="w-full bg-purple-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-purple-600 active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  <ListFilter className="w-4 h-4" />
                  REVISAR Y ENTREGAR
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE DESPACHO / TRASPASO EN MOSTRADOR */}
      {activeOrderForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl shadow-2xl max-w-md w-full p-7 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            
            {/* Botón X para Cancelar / Cerrar */}
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
                Verificación de Despacho
              </h2>
              <p className="text-xs text-(--theme-text) opacity-50">
                Confirma los artículos dentro del paquete antes de entregárselo a **{activeOrderForModal.sellerId || 'su vendedor'}**.
              </p>
            </div>

            {/* Lista interna con scroll para evitar desborde de UI si el pedido es enorme */}
            <div className="flex-grow overflow-y-auto my-2 pr-1 space-y-2 max-h-[45vh]">
              <p className="text-[10px] text-(--theme-text) opacity-50 font-bold uppercase tracking-wider mb-1">Contenido de la Caja</p>
              
              {activeOrderForModal.items.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl p-3 flex justify-between items-center"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-['Outfit'] font-bold text-sm text-(--theme-text) line-clamp-2">
                      {item.productName}
                    </p>
                    <p className="text-[11px] font-mono text-(--theme-text) opacity-40 mt-0.5">
                      ID: {item.productId}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-['Outfit'] font-black bg-purple-500/10 text-purple-500 px-3 py-1.5 rounded-xl text-sm">
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Información del Receptor */}
            <div className="mt-2 p-3 bg-purple-500/5 border border-purple-500/10 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                <User className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-50 text-(--theme-text)">Vendedor de Destino</p>
                <p className="text-sm font-bold text-(--theme-text)">{activeOrderForModal.sellerId || 'No especificado'}</p>
              </div>
            </div>

            {/* Botonera de Control Inferior */}
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
                onClick={() => handleHandover(activeOrderForModal.id)}
                className="flex-[1.3] px-4 py-3 rounded-2xl bg-purple-500 text-white font-['Outfit'] font-bold text-sm shadow-lg shadow-purple-500/20 hover:brightness-110 disabled:opacity-50 transition-all flex justify-center items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                {processingId === activeOrderForModal.id ? 'Despachando...' : 'ENTREGAR A VENDEDOR'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};