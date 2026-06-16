import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp, getDoc, writeBatch, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth'; // Operador actual
import { db } from '@/lib/firebase';
import { PackageSearch, PackageCheck, AlertCircle, CheckCircle2, Play, X, ListFilter, User, ArchiveRestore, CheckSquare } from 'lucide-react';
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
    phoneNumber?: string;
    photoURL?: string;
  };
}

type FilterStatus = 'RESERVADO' | 'PENDIENTE' | 'EMPAQUETADO' | 'DEVUELTO';

export const OrderDispatch: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filter, setFilter] = useState<FilterStatus>('RESERVADO');
  const [activeOrderForModal, setActiveOrderForModal] = useState<Order | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const q = query(
      collection(db, 'orders'), 
      where('status', 'in', ['RESERVADO', 'PENDIENTE', 'EMPAQUETADO', 'DEVUELTO'])
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedOrders = await Promise.all(snapshot.docs.map(async (orderDoc) => {
        const orderData = orderDoc.data();

        const itemsSnap = await getDocs(collection(db, 'orders', orderDoc.id, 'orderItems'));
        const items = itemsSnap.docs.map(itemDoc => {
          const itemData = itemDoc.data();
          return {
            productId: itemData.productId || itemDoc.id,
            productName: itemData.productName || 'Producto sin nombre',
            quantity: itemData.quantity || 1
          };
        });

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

      const sortedOrders = fetchedOrders.sort((a, b) => {
        const timeA = a.date?.toMillis ? a.date.toMillis() : new Date(a.date || 0).getTime();
        const timeB = b.date?.toMillis ? b.date.toMillis() : new Date(b.date || 0).getTime();
        return timeB - timeA;
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

  //LÓGICA DE DEVOLUCIÓN POR LOTE (BATCH) CORREGIDAS
  const handleReturnStock = async (order: Order) => {
    setProcessingId(order.id);
    setError('');
    
    try {
      const auth = getAuth();
      const operatorId = auth.currentUser?.uid || auth.currentUser?.email || 'operador-desconocido'; 
      const operatorName = auth.currentUser?.displayName || 'Operador del Sistema';
      const friendlyOrderId = parseOrderId(order.id).friendlyName;
      
      const batch = writeBatch(db);

      const orderRef = doc(db, 'orders', order.id);
      batch.update(orderRef, {
        status: 'CERRADO', 
        stockReturnedAt: serverTimestamp(),
        returnedByOperator: operatorName
      });

      order.items.forEach((item) => {
        const productRef = doc(db, 'inventory', item.productId);
        batch.update(productRef, {
          stockTotal: increment(item.quantity),
          stockAvailable: increment(item.quantity)
        });

        const movementRef = doc(collection(db, 'inventoryMovements'));
        batch.set(movementRef, {
          createdAt: serverTimestamp(),
          operatorId: operatorId, 
          productId: item.productId,
          quantity: item.quantity,
          reason: `Devolución de Pedido #${friendlyOrderId}`,
          type: 'ENTRADA'
        });
      });

      await batch.commit();

      setActiveOrderForModal(null);
      setSuccess(`Stock del pedido #${friendlyOrderId} devuelto e inventario actualizado.`);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      console.error("Error en la transacción de devolución:", err);
      setError('Error al procesar la devolución de inventario. Revisa la consola.');
    } finally {
      setProcessingId(null);
    }
  };

  const getSellerName = (order: Order) =>
    order.seller?.displayName || order.sellerId || 'Vendedor Desconocido';

  const displayedOrders = orders.filter(o => o.status === filter);

  const handleOpenModal = (order: Order) => {
    setActiveOrderForModal(order);
    setCheckedItems({}); 
  };

  const toggleCheck = (index: number) => {
    setCheckedItems(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const isAllChecked = activeOrderForModal && 
                       activeOrderForModal.items.length > 0 && 
                       activeOrderForModal.items.every((_, idx) => checkedItems[idx]);

  if (loading) return <div className="animate-pulse h-full min-h-[300px] bg-(--theme-secondary-bg) rounded-3xl"></div>;

  return (
    <>
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full flex flex-col">
        {/* CABECERA Y FILTROS (Sin cambios visuales) */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">Pedidos a Empacar/desempacar</h2>
            <p className="text-xs opacity-60 text-(--theme-text)">Busca, empaca y prepara los pedidos reservados</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {(['RESERVADO', 'PENDIENTE', 'EMPAQUETADO', 'DEVUELTO'] as FilterStatus[]).map((f) => {
            const isActive = filter === f;
            let activeStyle = '';
            
            if (isActive) {
              if (f === 'RESERVADO') activeStyle = 'bg-green-500 text-white shadow-md shadow-green-500/20';
              if (f === 'PENDIENTE') activeStyle = 'bg-amber-500 text-white shadow-md shadow-amber-500/20';
              if (f === 'EMPAQUETADO') activeStyle = 'bg-purple-600 text-white shadow-md shadow-purple-600/20';
              if (f === 'DEVUELTO') activeStyle = 'bg-red-500 text-white shadow-md shadow-red-500/20';
            }

            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all shrink-0 ${
                  isActive 
                    ? activeStyle 
                    : 'bg-(--theme-secondary-bg) border border-(--theme-border) text-(--theme-text) opacity-60 hover:opacity-100'
                }`}
              >
                {f}
              </button>
            );
          })}
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

        {/* LISTADO DE TARJETAS */}
        {displayedOrders.length === 0 ? (
          <div className="text-center py-12 flex-grow flex flex-col justify-center border-2 border-dashed border-(--theme-border) rounded-2xl opacity-50">
            <p className="font-bold text-(--theme-text)">No hay pedidos en esta sección</p>
            <p className="text-sm text-(--theme-text) opacity-60">Actualmente no existen registros con este estado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 overflow-y-auto pr-2">
            {displayedOrders.map(order => (
              <div key={order.id} className={`border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-4 flex flex-col justify-between transition hover:border-primary/30 ${order.status === 'DEVUELTO' ? 'border-red-500/30' : ''}`}>
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-l font-['Outfit'] font-black px-2.5 py-1 rounded-lg tracking-wider ${
                      order.status === 'RESERVADO' ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 
                      order.status === 'PENDIENTE' ? 'bg-amber-500 text-white ' :
                      order.status === 'DEVUELTO' ? 'bg-red-500 text-white shadow-md shadow-red-500/20' :
                      'bg-purple-500 text-white'
                    }`}>
                      #{parseOrderId(order.id).friendlyName}
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
                  onClick={() => handleOpenModal(order)}
                  className={`w-full text-white py-2.5 rounded-xl text-sm font-bold transition-all duration-200 active:scale-[0.98] flex justify-center items-center gap-2 shadow-sm ${
                    order.status === 'RESERVADO' ? 'bg-green-500 hover:bg-green-600' :
                    order.status === 'PENDIENTE' ? 'bg-amber-500 hover:bg-amber-600' :
                    order.status === 'DEVUELTO' ? 'bg-red-500 hover:bg-red-600' :
                    'bg-purple-600 hover:bg-purple-700'
                  }`}
                >
                  <ListFilter className="w-4 h-4" />
                  VER DETALLES
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE Y EMPAQUE / DESEMPAQUE */}
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
              <span className={`text-l font-['Outfit'] font-black px-2.5 py-1 rounded-lg tracking-wider inline-block mb-2 ${
                activeOrderForModal.status === 'RESERVADO' ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 
                activeOrderForModal.status === 'PENDIENTE' ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' :
                activeOrderForModal.status === 'DEVUELTO' ? 'bg-red-500/15 text-red-600 dark:text-red-400' :
                'bg-purple-500/15 text-purple-600 dark:text-purple-400'
              }`}>
                #{parseOrderId(activeOrderForModal.id).friendlyName}
              </span>
              <h2 className="font-['Outfit'] font-black text-xl text-(--theme-text) mt-1 mb-1">
                {activeOrderForModal.status === 'DEVUELTO' ? 'Revisión de Devolución' : 'Detalle del Pedido'}
              </h2>
            </div>

            <p className="text-[10px] text-(--theme-text) opacity-80 font-bold uppercase tracking-wider mb-1">
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
                {activeOrderForModal.seller?.institutionalId && (
                  <p className="text-[11px] text-(--theme-text) opacity-100 truncate">
                    {activeOrderForModal.seller.institutionalId}
                  </p>
                )}
                {activeOrderForModal.seller?.email && (
                  <p className="text-[11px] text-(--theme-text) opacity-100 truncate">
                    {activeOrderForModal.seller.email}
                  </p>
                )}
                {activeOrderForModal.seller?.phoneNumber ? (
                  <p className="text-[11px] text-(--theme-text) opacity-100 truncate">
                    {activeOrderForModal.seller.phoneNumber}
                  </p>
                ) : (
                  <p className="text-[11px] text-(--theme-text) opacity-50 italic">
                    Sin teléfono registrado
                  </p>
                )}
              </div>
            </div>

            {/* MENSAJE DE ADVERTENCIA PARA DEVOLUCIONES (Con color Naranja Vibrante) */}
            {activeOrderForModal.status === 'DEVUELTO' && !isAllChecked && (
              <div className="mb-2 p-3 bg-[#F39C12]/10 border border-[#F39C12]/30 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-[#F39C12] shrink-0 mt-0.5" />
                <p className="text-xs text-[#F39C12] font-medium leading-tight">
                  Debes seleccionar y verificar el estado físico de <strong>todos los productos</strong> de la lista antes de devolverlos al inventario.
                </p>
              </div>
            )}

            <div className="flex-grow overflow-y-auto my-2 pr-1 space-y-2 max-h-[35vh]">
              <p className="text-[10px] text-(--theme-text) opacity-80 font-bold uppercase tracking-wider mb-1">
                Lista de verificación ({activeOrderForModal.items.length} items)
              </p>

              {activeOrderForModal.items.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => activeOrderForModal.status === 'DEVUELTO' && toggleCheck(idx)}
                  className={`bg-(--theme-secondary-bg) border rounded-2xl p-3 flex justify-between items-center transition-all ${
                    activeOrderForModal.status === 'DEVUELTO' 
                      ? 'cursor-pointer hover:border-red-400 active:scale-[0.99] ' + (checkedItems[idx] ? 'border-red-500 bg-red-500/5' : 'border-(--theme-border)') 
                      : 'border-(--theme-border)'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 pr-3">
                    {activeOrderForModal.status === 'DEVUELTO' && (
                      <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                        checkedItems[idx] ? 'bg-red-500 border-red-500' : 'border-(--theme-border)'
                      }`}>
                        {checkedItems[idx] && <CheckSquare className="w-3.5 h-3.5 text-white" />}
                      </div>
                    )}
                    <div>
                      <p className={`font-['Outfit'] font-bold text-sm text-(--theme-text) line-clamp-2 ${
                        checkedItems[idx] ? 'line-through opacity-70' : ''
                      }`}>
                        {item.productName}
                      </p>
                      <p className="text-[11px] font-mono text-(--theme-text) opacity-90 mt-0.5">
                        ID: {item.productId}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-['Outfit'] font-black px-3 py-1.5 rounded-xl text-sm ${
                      activeOrderForModal.status === 'DEVUELTO' ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary'
                    }`}>
                      x{item.quantity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-(--theme-border)/50">
              {/* BOTONERAS DE OTROS ESTADOS */}
              {activeOrderForModal.status === 'RESERVADO' && (
                <button
                  type="button"
                  disabled={processingId === activeOrderForModal.id}
                  onClick={() => handleStartPicking(activeOrderForModal)}
                  className="w-full px-4 py-3.5 rounded-2xl bg-amber-500 text-white font-['Outfit'] font-bold text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-white" />
                  {processingId === activeOrderForModal.id ? 'Iniciando...' : 'EMPEZAR A BUSCAR'}
                </button>
              )}

              {activeOrderForModal.status === 'PENDIENTE' && (
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
                    {processingId === activeOrderForModal.id ? 'Guardando...' : 'EMPAQUETAR'}
                  </button>
                </div>
              )}

              {activeOrderForModal.status === 'EMPAQUETADO' && (
                <button
                  type="button"
                  onClick={() => setActiveOrderForModal(null)}
                  className="w-full px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) opacity-80 hover:opacity-100 transition"
                >
                  Cerrar
                </button>
              )}

              {/* BOTONERA ACTUALIZADA ESTADO DEVUELTO */}
              {activeOrderForModal.status === 'DEVUELTO' && (
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
                    disabled={!isAllChecked || processingId === activeOrderForModal.id}
                    onClick={() => handleReturnStock(activeOrderForModal)}
                    className={`flex-[1.3] px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm transition-all flex justify-center items-center gap-2 ${
                      !isAllChecked 
                        ? 'bg-(--theme-secondary-bg) border border-(--theme-border) text-(--theme-text) opacity-50 cursor-not-allowed shadow-none' 
                        : 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:brightness-110'
                    }`}
                  >
                    <ArchiveRestore className="w-5 h-5" />
                    {processingId === activeOrderForModal.id ? 'Procesando...' : 'ACTUALIZAR STOCK'}
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