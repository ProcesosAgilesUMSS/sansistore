import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SendToBack, X, ListFilter, User } from 'lucide-react';
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
  seller?: {
    displayName?: string;
    email?: string;
    institutionalId?: string;
    phone?: string;
    photoURL?: string;
  };
}

export const WarehouseHandover: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrderForModal, setActiveOrderForModal] = useState<Order | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('status', '==', 'EMPAQUETADO'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = await Promise.all(snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();

        // 1. Consultar items
        const itemsSnap = await getDocs(collection(db, 'orders', orderDoc.id, 'orderItems'));
        const items = itemsSnap.docs.map(itemDoc => {
          const itemData = itemDoc.data();
          return {
            productId: itemData.productId || itemDoc.id,
            productName: itemData.productName || 'Producto sin nombre',
            quantity: itemData.quantity || 1
          };
        });

        // 2. Consultar vendedor
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
          seller: sellerInfo
        } as Order;
      }));

      setOrders(fetchedOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getSellerName = (order: Order) =>
    order.seller?.displayName || order.sellerId || 'Vendedor Desconocido';

  if (loading) return <div className="animate-pulse h-full min-h-[300px] bg-(--theme-secondary-bg) rounded-3xl"></div>;

  return (
    <>
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full flex flex-col">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
            <SendToBack className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">Pedidos en Espera</h2>
            <p className="text-xs opacity-60 text-(--theme-text)">Pedidos empaquetados listos para ser retirados por el vendedor</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-12 flex-grow flex flex-col justify-center border-2 border-dashed border-(--theme-border) rounded-2xl opacity-50">
            <p className="font-bold text-(--theme-text)">No hay pedidos en espera</p>
            <p className="text-sm text-(--theme-text) opacity-60">Todos los pedidos han sido retirados.</p>
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
                    <span className="text-xs font-bold px-2 py-1 rounded-md bg-purple-500/20 text-purple-500">
                      EMPAQUETADO
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
                  <p className="text-xs text-(--theme-text) opacity-50 mt-1 pl-8">
                    Contiene: {order.items.reduce((acc, item) => acc + item.quantity, 0)} unidad(es).
                  </p>
                </div>

                <button
                  onClick={() => setActiveOrderForModal(order)}
                  className="w-full bg-purple-500 text-white py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:bg-purple-600 active:scale-[0.98] flex justify-center items-center gap-2"
                >
                  <ListFilter className="w-4 h-4" />
                  VER DETALLES
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE INFORMACIÓN (Solo lectura) */}
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
                Verificación de Pedido
              </h2>
            </div>

            {/* Datos del Vendedor */}
            <p className="text-[10px] text-(--theme-text) opacity-50 font-bold uppercase tracking-wider mb-1">
              Datos del Vendedor
            </p>

            <div className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl p-4 mb-4 flex gap-3 items-center">

              {activeOrderForModal.seller?.photoURL ? (
                <img src={activeOrderForModal.seller.photoURL} className="w-12 h-12 rounded-full object-cover shrink-0 border border-(--theme-border)" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0 text-purple-500">
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

            {/* Lista de productos */}
            <div className="flex-grow overflow-y-auto my-2 pr-1 space-y-2 max-h-[35vh]">
              <p className="text-[10px] text-(--theme-text) opacity-50 font-bold uppercase tracking-wider mb-1">Contenido</p>
              {activeOrderForModal.items.map((item, idx) => (
                <div key={idx} className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-2xl p-3 flex justify-between items-center">
                  <p className="font-bold text-sm text-(--theme-text)">{item.productName}</p>
                  <span className="font-black bg-purple-500/10 text-purple-500 px-3 py-1 rounded-xl text-sm">x{item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Botón Cerrar */}
            <div className="pt-4 mt-4 border-t border-(--theme-border)/50">
              <button
                onClick={() => setActiveOrderForModal(null)}
                className="w-full px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm border border-(--theme-border) text-(--theme-text) hover:bg-(--theme-secondary-bg) transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};