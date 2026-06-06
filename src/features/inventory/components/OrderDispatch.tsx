import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'; // Añadimos getDoc
import { db } from '@/lib/firebase';
import { PackageSearch, PackageCheck, AlertCircle, CheckCircle2, Play, X, ListFilter, User } from 'lucide-react';
import { parseOrderId } from '@/features/cart/services/orderService';

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
  // Agrupamos los datos cruzados del vendedor
  seller?: {
    displayName?: string;
    email?: string;
    institutionalId?: string;
    phone?: string;
    photoURL?: string;
  };
}

export const OrderDispatch: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [activeOrderForModal, setActiveOrderForModal] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', 'in', ['RESERVADO', 'PENDIENTE']));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = await Promise.all(snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();

        // 1. Consultar los items del pedido
        const itemsSnap = await getDocs(collection(db, 'orders', orderDoc.id, 'orderItems'));
        const items = itemsSnap.docs.map(itemDoc => {
          const itemData = itemDoc.data();
          return {
            productId: itemData.productId || itemDoc.id,
            productName: itemData.productName || 'Producto sin nombre',
            quantity: itemData.quantity || 1
          };
        });

        // 2. CRUCE DE DATOS: Consultar el vendedor en la colección 'users'
        let sellerInfo = {};
        if (orderData.sellerId) {
          try {
            const sellerRef = doc(db, 'users', orderData.sellerId);
            const sellerSnap = await getDoc(sellerRef);
            if (sellerSnap.exists()) {
              sellerInfo = sellerSnap.data();
            }
          } catch (err) {
            console.error("Error al obtener datos del vendedor:", err);
          }
        }

        return {
          id: orderDoc.id,
          ...orderData,
          items,
          seller: sellerInfo // Inyectamos la data de la colección users aquí
        } as Order;
      }));

      // Ordenar: Primero RESERVADO, luego PENDIENTE
      const sortedOrders = fetchedOrders.sort((a, b) => {
        if (a.status === 'RESERVADO' && b.status === 'PENDIENTE') return -1;
        if (a.status === 'PENDIENTE' && b.status === 'RESERVADO') return 1;
        return 0;
      });

      setOrders(sortedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartPicking = async (order: Order) => {
    setProcessingId(order.id);
    setError('');
    try {
      const orderRef = doc(db, 'orders', order.id);
      await updateDoc(orderRef, {
        status: 'PENDIENTE',
        warehouseStartedAt: serverTimestamp()
      });

      setActiveOrderForModal({ ...order, status: 'PENDIENTE' });
    } catch (err: any) {
      setError('Error al iniciar la preparación del pedido.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleFinishPacking = async (orderId: string) => {
    setProcessingId(orderId);
    setError('');
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: 'EMPAQUETADO',
        warehouseFinishedAt: serverTimestamp()
      });

      setActiveOrderForModal(null);
      setSuccess(`Pedido #${orderId.slice(-5).toUpperCase()} empaquetado exitosamente.`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      setError('Error al marcar el pedido como empaquetado.');
    } finally {
      setProcessingId(null);
    }
  };

  // Función auxiliar suuper limpia usando los datos reales extraídos de users
  const getSellerName = (order: Order) =>
    order.seller?.displayName || order.sellerId || 'Vendedor Desconocido';

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
                  <span className="block text-xs text-text-light/50 truncate">
                    {parseOrderId(order.id).uuid}
                  </span>
                  <div className="flex justify-between items-start mb-3">

                    <span className="text-md font-bold px-2 py-1 rounded-md font-bold">
                      {parseOrderId(order.id).friendlyName}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${order.status === 'PENDIENTE' ? 'bg-amber-500/20 text-amber-500' : 'bg-zinc-500/20 text-zinc-500'
                      }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {order.seller?.photoURL && (
                      <img src={order.seller.photoURL} alt={getSellerName(order)} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    )}
                    <h3 className="font-bold text-sm text-(--theme-text)">
                      {getSellerName(order)}
                    </h3>
                  </div>
                  <p className="text-xs text-(--theme-text) opacity-50 mt-1">
                    Total {order.items.reduce((acc, item) => acc + item.quantity, 0)} unidad(es).
                  </p>
                </div>

                <button
                  onClick={() => setActiveOrderForModal(order)}
                  className="w-full bg-green-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-green-400 active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  <ListFilter className="w-4 h-4" />
                  VER DETALLES
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE Y EMPAQUE */}
      {activeOrderForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl shadow-2xl max-w-md w-full p-7 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">

            <button
              onClick={() => setActiveOrderForModal(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-(--theme-secondary-bg) border border-(--theme-border) flex items-center justify-center text-(--theme-text) opacity-60 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="mb-4">
              <span className="block text-xs text-text-light/50 truncate">
                {parseOrderId(activeOrderForModal.id).uuid}
              </span>
              <span className="text-lg font-bold px-2 py-0.5 rounded-md font-bold">
                {parseOrderId(activeOrderForModal.id).friendlyName}
              </span>
              <h2 className="font-['Outfit'] font-black text-xl text-(--theme-text) mt-2 mb-1">
                Recolección de Pedido
              </h2>
            </div>

            {/* INFOR DEL VENDEDOR */}
            <p className="text-[10px] text-(--theme-text) opacity-50 font-bold uppercase tracking-wider mb-1">
              Datos del Vendedor
            </p>
            <div className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl p-4 mb-4 flex gap-3 items-center">

              {activeOrderForModal.seller?.photoURL ? (
                <img
                  src={activeOrderForModal.seller.photoURL}
                  alt={getSellerName(activeOrderForModal)}
                  className="w-12 h-12 rounded-full object-cover shrink-0 border border-(--theme-border)"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0 text-primary">
                  <User className="w-6 h-6" />
                </div>
              )}

              <div className="space-y-1 w-full overflow-hidden">
                <p className="font-bold text-sm text-(--theme-text) truncate">
                  {getSellerName(activeOrderForModal)}
                </p>
                {activeOrderForModal.seller?.email && (
                  <p className="text-[11px] text-(--theme-text) opacity-50 truncate">
                    {activeOrderForModal.seller.email}
                  </p>
                )}
                {activeOrderForModal.seller?.institutionalId && (
                  <p className="text-[11px] text-(--theme-text) opacity-50 truncate">
                    {activeOrderForModal.seller.institutionalId}
                  </p>
                )}
                {activeOrderForModal.seller?.phone ? (
                  <p className="text-[11px] text-(--theme-text) opacity-50 truncate">
                    {activeOrderForModal.seller.phone}
                  </p>
                ) : (
                  <p className="text-[11px] text-(--theme-text) opacity-50 italic">
                    Sin teléfono registrado
                  </p>
                )}
              </div>
            </div>

            {/* LISTA DE PRODUCTOS */}
            <div className="flex-grow overflow-y-auto my-2 pr-1 space-y-2 max-h-[35vh]">
              <p className="text-[10px] text-(--theme-text) opacity-50 font-bold uppercase tracking-wider mb-1">
                Lista de verificación ({activeOrderForModal.items.length} items)
              </p>

              {activeOrderForModal.items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl p-3 flex justify-between items-center"
                >
                  <div className="flex-1 pr-3">
                    <p className="font-['Outfit'] font-bold text-sm text-(--theme-text) line-clamp-2">
                      {item.productName}
                    </p>
                    <p className="text-[11px] font-mono text-(--theme-text) opacity-90 mt-0.5">
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

            {/* BOTONERA */}
            <div className="pt-4 mt-4 border-t border-(--theme-border)/50">
              {activeOrderForModal.status === 'RESERVADO' ? (
                <button
                  type="button"
                  disabled={processingId === activeOrderForModal.id}
                  onClick={() => handleStartPicking(activeOrderForModal)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-amber-500 text-white font-['Outfit'] font-bold text-sm shadow-lg shadow-amber-500/20 hover:brightness-110 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {processingId === activeOrderForModal.id ? 'Iniciando...' : 'EMPEZAR A BUSCAR'}
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveOrderForModal(null)}
                    className="flex-1 px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm border border-(--theme-border) text-(--theme-text) opacity-70 hover:opacity-100 hover:bg-(--theme-secondary-bg) transition"
                  >
                    Cerrar
                  </button>
                  <button
                    type="button"
                    disabled={processingId === activeOrderForModal.id}
                    onClick={() => handleFinishPacking(activeOrderForModal.id)}
                    className="flex-[1.3] px-4 py-3 rounded-2xl bg-primary text-(--theme-bg) font-['Outfit'] font-bold text-sm shadow-lg shadow-primary/20 hover:brightness-110 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                  >
                    <PackageCheck className="w-5 h-5" />
                    {processingId === activeOrderForModal.id ? 'Guardando...' : 'EMPAQUETADO'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
};