import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp, getDoc, writeBatch, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { PackageSearch, PackageCheck, AlertCircle, CheckCircle2, Play, X, ListFilter, ArchiveRestore, CheckSquare, ChevronRight, ArrowLeft, AlertTriangle } from 'lucide-react';
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

// Nueva interfaz para manejar el estado de verificación de cada producto devuelto
interface ReturnVerification {
  good: number;
  bad: number;
  reason: string;
  verified: boolean;
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
  
  // Estado para las verificaciones de devoluciones
  const [returnVerifications, setReturnVerifications] = useState<Record<number, ReturnVerification>>({});
  
  // Estados para la sub-vista de verificación de un ítem individual
  const [verifyingIndex, setVerifyingIndex] = useState<number | null>(null);
  const [tempBadQty, setTempBadQty] = useState<number>(0);
  const [tempReason, setTempReason] = useState<string>('');

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

      // LÓGICA DE ORDENAMIENTO (MÁS RECIENTES PRIMERO)
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

      order.items.forEach((item, index) => {
        const verification = returnVerifications[index];
        if (!verification) return;

        //Actualizar el stock fisicamente (se suman los que estan en buen estado)
        const productRef = doc(db, 'inventory', item.productId);
        batch.update(productRef, {
          stockTotal: increment(verification.good),
          stockAvailable: increment(verification.good)
        });

        //ENTRADA de inventario (por el TOTAL del producto)
        const movEntradaRef = doc(collection(db, 'inventoryMovements'));
        batch.set(movEntradaRef, {
          createdAt: serverTimestamp(),
          operatorId: operatorId, 
          productId: item.productId,
          quantity: item.quantity,
          reason: `Devolución de Pedido #${friendlyOrderId}`,
          type: 'ENTRADA',
          sequence: 1 // primero la ENTRADA
        });

        // SALIDA de inventario (si hay productos en MAL ESTADO)
        if (verification.bad > 0) {
          const movSalidaRef = doc(collection(db, 'inventoryMovements'));
          batch.set(movSalidaRef, {
            createdAt: serverTimestamp(),
            operatorId: operatorId, 
            productId: item.productId,
            quantity: verification.bad,
            reason: `Devolución de Pedido #${friendlyOrderId}, Productos en mal estado: ${verification.reason}`,
            type: 'SALIDA',
            sequence: 2 // despues la SALIDA
          });
        }
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

  const getSellerName = (order: Order) => order.seller?.displayName || order.sellerId || 'Vendedor Desconocido';
  const displayedOrders = orders.filter(o => o.status === filter);

  const handleOpenModal = (order: Order) => {
    setActiveOrderForModal(order);
    setReturnVerifications({}); 
    setVerifyingIndex(null);
  };

  // Abre la sub-vista de verificación para un producto
  const startVerifyingItem = (index: number, maxQuantity: number) => {
    const existing = returnVerifications[index];
    setTempBadQty(existing?.bad || 0);
    setTempReason(existing?.reason || '');
    setVerifyingIndex(index);
  };

  // Guarda la verificación en el estado general
  const saveVerification = () => {
    if (verifyingIndex === null || !activeOrderForModal) return;
    
    const item = activeOrderForModal.items[verifyingIndex];
    const goodQty = item.quantity - tempBadQty;

    setReturnVerifications(prev => ({
      ...prev,
      [verifyingIndex]: {
        good: goodQty,
        bad: tempBadQty,
        reason: tempBadQty > 0 ? tempReason : '',
        verified: true
      }
    }));
    
    setVerifyingIndex(null);
  };

  const isAllVerified = activeOrderForModal && 
                        activeOrderForModal.items.length > 0 && 
                        activeOrderForModal.items.every((_, idx) => returnVerifications[idx]?.verified);

  if (loading) return <div className="animate-pulse h-full min-h-[300px] bg-(--theme-secondary-bg) rounded-3xl"></div>;

  return (
    <>
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl p-6 shadow-sm h-full flex flex-col">
        
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <PackageSearch className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-['Outfit'] font-bold text-lg text-(--theme-text)">Pedidos a Empacar/desempacar</h2>
            <p className="text-xs opacity-60 text-(--theme-text)">Busca, empaca y prepara los pedidos</p>
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
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-1.5 rounded-full text-[11px] font-bold tracking-wide transition-all shrink-0 ${
                  isActive ? activeStyle : 'bg-(--theme-secondary-bg) border border-(--theme-border) text-(--theme-text) opacity-60 hover:opacity-100'
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
                    <h3 className="font-bold text-sm text-(--theme-text)">{getSellerName(order)}</h3>
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
                  <ListFilter className="w-4 h-4" /> VER DETALLES
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL PRINCIPAL */}
      {activeOrderForModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
          <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-3xl shadow-2xl max-w-md w-full p-7 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">

            {verifyingIndex === null && (
              <button onClick={() => setActiveOrderForModal(null)} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-(--theme-secondary-bg) border border-(--theme-border) flex items-center justify-center text-(--theme-text) opacity-60 hover:opacity-100 transition">
                <X className="w-4 h-4" />
              </button>
            )}

            {/* LISTADO DE PRODUCTOS EN EL MODAL */}
            {verifyingIndex === null ? (
              <>
                <div className="mb-4">
                  <span className={`text-l font-['Outfit'] font-black px-2.5 py-1 rounded-lg tracking-wider inline-block mb-2 ${
                    activeOrderForModal.status === 'DEVUELTO' ? 'bg-red-500/15 text-red-600 dark:text-red-400' : 'bg-primary/15 text-primary'
                  }`}>
                    #{parseOrderId(activeOrderForModal.id).friendlyName}
                  </span>
                  <h2 className="font-['Outfit'] font-black text-xl text-(--theme-text) mt-1 mb-1">
                    {activeOrderForModal.status === 'DEVUELTO' ? 'Revisión de Devolución' : 'Detalle del Pedido'}
                  </h2>
                </div>

                {activeOrderForModal.status === 'DEVUELTO' && !isAllVerified && (
                  <div className="mb-2 p-3 bg-[#F39C12]/10 border border-[#F39C12]/30 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#F39C12] shrink-0 mt-0.5" />
                    <p className="text-xs text-[#F39C12] font-medium leading-tight">
                      Debes <strong>verificar el estado físico</strong> de todos los productos antes de devolverlos al inventario.
                    </p>
                  </div>
                )}

                <div className="flex-grow overflow-y-auto my-2 pr-1 space-y-2 max-h-[45vh]">
                  {activeOrderForModal.items.map((item, idx) => {
                    const verification = returnVerifications[idx];
                    const isVerified = verification?.verified;

                    return (
                      <div
                        key={idx}
                        onClick={() => activeOrderForModal.status === 'DEVUELTO' && startVerifyingItem(idx, item.quantity)}
                        className={`bg-(--theme-secondary-bg) border rounded-2xl p-3 flex justify-between items-center transition-all ${
                          activeOrderForModal.status === 'DEVUELTO' 
                            ? 'cursor-pointer hover:border-primary/50 active:scale-[0.99] ' + (isVerified ? 'border-green-500/50 bg-green-500/5' : 'border-(--theme-border)') 
                            : 'border-(--theme-border)'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 pr-3">
                          {activeOrderForModal.status === 'DEVUELTO' && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isVerified ? 'bg-green-500 text-white' : 'bg-(--theme-border) text-(--theme-text) opacity-50'
                            }`}>
                              {isVerified ? <CheckSquare className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                            </div>
                          )}
                          <div>
                            <p className="font-['Outfit'] font-bold text-sm text-(--theme-text) line-clamp-2">
                              {item.productName}
                            </p>
                            {isVerified && activeOrderForModal.status === 'DEVUELTO' ? (
                              <p className="text-[11px] font-medium text-(--theme-text) opacity-80 mt-0.5 flex gap-2">
                                <span className="text-green-500">Bien: {verification.good}</span>
                                {verification.bad > 0 && <span className="text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Mal: {verification.bad}</span>}
                              </p>
                            ) : (
                              <p className="text-[11px] font-mono text-(--theme-text) opacity-60 mt-0.5">ID: {item.productId}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-['Outfit'] font-black px-3 py-1.5 rounded-xl text-sm bg-primary/10 text-primary">
                            x{item.quantity}
                          </span>
                          {activeOrderForModal.status === 'DEVUELTO' && !isVerified && (
                            <ChevronRight className="w-5 h-5 text-(--theme-text) opacity-40" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* AQUÍ ESTÁN LOS BOTONES RESTAURADOS PARA LOS OTROS ESTADOS */}
                <div className="pt-4 mt-4 border-t border-(--theme-border)/50">
                  <div className="flex gap-3">
                    <button onClick={() => setActiveOrderForModal(null)} className="flex-1 px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm border border-(--theme-border) text-(--theme-text) opacity-70 hover:opacity-100 transition">
                      Cerrar
                    </button>

                    {activeOrderForModal.status === 'RESERVADO' && (
                      <button
                        disabled={processingId === activeOrderForModal.id}
                        onClick={() => handleStartPicking(activeOrderForModal)}
                        className="flex-[1.3] px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm transition-all bg-green-500 text-white shadow-lg shadow-green-500/20 hover:brightness-110 flex justify-center items-center gap-2"
                      >
                        <Play className="w-5 h-5" />
                        {processingId === activeOrderForModal.id ? 'Procesando...' : 'EMPEZAR A BUSCAR'}
                      </button>
                    )}

                    {activeOrderForModal.status === 'PENDIENTE' && (
                      <button
                        disabled={processingId === activeOrderForModal.id}
                        onClick={() => handleFinishPacking(activeOrderForModal.id)}
                        className="flex-[1.3] px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm transition-all bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:brightness-110 flex justify-center items-center gap-2"
                      >
                        <PackageCheck className="w-5 h-5" />
                        {processingId === activeOrderForModal.id ? 'Procesando...' : 'EMPAQUETAR'}
                      </button>
                    )}

                    {activeOrderForModal.status === 'DEVUELTO' && (
                      <button
                        disabled={!isAllVerified || processingId === activeOrderForModal.id}
                        onClick={() => handleReturnStock(activeOrderForModal)}
                        className={`flex-[1.3] px-4 py-3 rounded-2xl font-['Outfit'] font-bold text-sm transition-all flex justify-center items-center gap-2 ${
                          !isAllVerified 
                            ? 'bg-(--theme-secondary-bg) border border-(--theme-border) text-(--theme-text) opacity-50 cursor-not-allowed' 
                            : 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:brightness-110'
                        }`}
                      >
                        <ArchiveRestore className="w-5 h-5" />
                        {processingId === activeOrderForModal.id ? 'Procesando...' : 'DEVOLVER A STOCK'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              /* SUB-VISTA DE VERIFICACIÓN DE PRODUCTO */
              <div className="flex flex-col h-full animate-in slide-in-from-right-4 duration-200">
                <button onClick={() => setVerifyingIndex(null)} className="flex items-center gap-2 text-(--theme-text) opacity-70 hover:opacity-100 font-bold text-sm mb-4 transition w-fit">
                  <ArrowLeft className="w-4 h-4" /> Volver a la lista
                </button>
                
                <div className="mb-6">
                  <p className="text-xs text-primary font-bold tracking-wider uppercase mb-1">Verificando Producto</p>
                  <h3 className="font-['Outfit'] font-black text-xl text-(--theme-text) leading-tight">
                    {activeOrderForModal.items[verifyingIndex].productName}
                  </h3>
                  <p className="text-sm mt-2 text-(--theme-text) opacity-70">
                    Cantidad total devuelta: <span className="font-black text-(--theme-text)">{activeOrderForModal.items[verifyingIndex].quantity}</span>
                  </p>
                </div>

                <div className="space-y-5 flex-grow">
                  <div>
                    <label className="block text-sm font-bold text-(--theme-text) mb-2">
                      ¿Cuántas unidades están en <span className="text-red-500">MAL estado</span>?
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      max={activeOrderForModal.items[verifyingIndex].quantity}
                      value={tempBadQty}
                      onChange={(e) => setTempBadQty(Math.min(Math.max(0, parseInt(e.target.value) || 0), activeOrderForModal.items[verifyingIndex!].quantity))}
                      className="w-full bg-(--theme-bg) border border-(--theme-border) text-(--theme-text) rounded-xl px-4 py-3 font-mono text-lg focus:outline-none focus:border-primary transition"
                    />
                    <p className="text-xs text-(--theme-text) opacity-60 mt-2">
                      Se registrarán <strong className="text-green-500">{activeOrderForModal.items[verifyingIndex].quantity - tempBadQty}</strong> unidades en buen estado.
                    </p>
                  </div>

                  {tempBadQty > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold text-(--theme-text) mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#F39C12]" /> Motivo del mal estado
                      </label>
                      <textarea 
                        value={tempReason}
                        onChange={(e) => setTempReason(e.target.value)}
                        placeholder="Ej: Empaque roto, producto vencido, dañado en transporte..."
                        className="w-full bg-(--theme-bg) border border-(--theme-border) text-(--theme-text) rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#F39C12] transition resize-none h-24"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-2">
                  <button
                    onClick={saveVerification}
                    disabled={tempBadQty > 0 && tempReason.trim().length === 0}
                    className="w-full py-3.5 rounded-2xl font-['Outfit'] font-bold text-sm bg-primary text-white shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    GUARDAR VERIFICACIÓN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};