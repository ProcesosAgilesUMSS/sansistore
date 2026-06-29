import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs, doc, updateDoc, serverTimestamp, getDoc, writeBatch, increment } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { PackageSearch, PackageCheck, AlertCircle, CheckCircle2, Play, X, ArchiveRestore, CheckSquare, ChevronRight, ArrowLeft, AlertTriangle, User } from 'lucide-react';
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
  updatedAt?: any; // Añadido para el nuevo ordenamiento
  seller?: {
    displayName?: string;
    email?: string;
    institutionalId?: string;
    phoneNumber?: string;
    photoURL?: string;
  };
}

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
  
  const [returnVerifications, setReturnVerifications] = useState<Record<number, ReturnVerification>>({});
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

      // ORDENAMIENTO POR updatedAt PARA MOSTRAR PRIMERO EL MÁS RECIENTE
      const sortedOrders = fetchedOrders.sort((a, b) => {
        const getTimestamp = (field: any) => field?.toMillis ? field.toMillis() : new Date(field || 0).getTime();
        const timeA = getTimestamp(a.updatedAt || a.date);
        const timeB = getTimestamp(b.updatedAt || b.date);
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp()
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
        updatedAt: serverTimestamp(), // Actualiza la fecha para ordenamiento general
        returnedByOperator: operatorName
      });

      order.items.forEach((item, index) => {
        const verification = returnVerifications[index];
        if (!verification) return;

        const productRef = doc(db, 'inventory', item.productId);
        batch.update(productRef, {
          stockTotal: increment(verification.good),
          stockAvailable: increment(verification.good)
        });

        const movEntradaRef = doc(collection(db, 'inventoryMovements'));
        batch.set(movEntradaRef, {
          createdAt: serverTimestamp(),
          operatorId: operatorId, 
          productId: item.productId,
          quantity: item.quantity,
          reason: `Devolución de Pedido #${friendlyOrderId}`,
          type: 'ENTRADA',
          sequence: 1 
        });

        if (verification.bad > 0) {
          const movSalidaRef = doc(collection(db, 'inventoryMovements'));
          batch.set(movSalidaRef, {
            createdAt: serverTimestamp(),
            operatorId: operatorId, 
            productId: item.productId,
            quantity: verification.bad,
            reason: `Devolución de Pedido #${friendlyOrderId}, Productos en mal estado: ${verification.reason}`,
            type: 'SALIDA',
            sequence: 2 
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

  const startVerifyingItem = (index: number, maxQuantity: number) => {
    const existing = returnVerifications[index];
    setTempBadQty(existing?.bad || 0);
    setTempReason(existing?.reason || '');
    setVerifyingIndex(index);
  };

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
      <div className="h-full flex flex-col">

        <div className="flex items-center gap-3 mb-4">
          <div>
            <p className="text-xs opacity-60 text-(--theme-text)">Busca, empaca y prepara los pedidos</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {(['RESERVADO', 'PENDIENTE', 'EMPAQUETADO', 'DEVUELTO'] as FilterStatus[]).map((f) => {
            const isActive = filter === f;
            let activeStyle = '';
            if (isActive) {
              if (f === 'RESERVADO') activeStyle = 'bg-primary text-white shadow-sm';
              if (f === 'PENDIENTE') activeStyle = 'bg-(--theme-warning) text-white shadow-sm';
              if (f === 'EMPAQUETADO') activeStyle = 'bg-(--theme-info) text-white shadow-sm';
              if (f === 'DEVUELTO') activeStyle = 'bg-(--theme-error) text-white shadow-sm';
            }
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all shrink-0 ${
                  isActive ? activeStyle : 'bg-(--theme-secondary-bg) border border-(--theme-border) text-(--theme-text) opacity-60 hover:opacity-100'
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error) rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/30 text-primary rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-bold">{success}</span>
          </div>
        )}

        {/* LISTADO DE TARJETAS (NUEVO DISEÑO EN GRID) */}
        {displayedOrders.length === 0 ? (
          <div className="text-center py-12 flex-grow flex flex-col justify-center border-2 border-dashed border-(--theme-border) rounded-2xl opacity-50">
            <p className="font-bold text-(--theme-text)">No hay pedidos en esta sección</p>
            <p className="text-sm text-(--theme-text) opacity-60">Actualmente no existen registros con este estado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-1">
            {displayedOrders.map(order => {
              const dotColor =
                order.status === 'RESERVADO' ? 'bg-primary' :
                order.status === 'PENDIENTE' ? 'bg-(--theme-warning)' :
                order.status === 'DEVUELTO' ? 'bg-(--theme-error)' :
                'bg-(--theme-info)';
              const totalUnits = order.items.reduce((acc, item) => acc + item.quantity, 0);
              const initials = getSellerName(order).trim().slice(0, 2).toUpperCase();

              return (
                <button
                  key={order.id}
                  onClick={() => handleOpenModal(order)}
                  className="group text-left border border-(--theme-border) bg-(--theme-secondary-bg) rounded-2xl p-4 flex flex-col gap-3 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-sm font-bold tracking-wide text-(--theme-text)">
                      #{parseOrderId(order.id).friendlyName}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-(--theme-text) opacity-55">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                      {order.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {order.seller?.photoURL ? (
                      <img src={order.seller.photoURL} alt={getSellerName(order)} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <span className="w-8 h-8 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-(--theme-text) truncate">{getSellerName(order)}</p>
                      <p className="text-xs text-(--theme-text) opacity-50">{totalUnits} unidad(es)</p>
                    </div>
                  </div>

                  <div className="mt-1 flex items-center justify-end gap-1.5 text-xs font-semibold text-(--theme-text) opacity-55 group-hover:text-primary group-hover:opacity-100 transition-colors">
                    Ver detalles
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              );
            })}
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
                  <span className={`text-lg font-display font-black px-2.5 py-1 rounded-lg tracking-wider inline-block mb-2 ${
                    activeOrderForModal.status === 'DEVUELTO' ? 'bg-(--theme-error-bg) text-(--theme-error) dark:text-(--theme-error)' : 'bg-primary/10 text-primary'
                  }`}>
                    #{parseOrderId(activeOrderForModal.id).friendlyName}
                  </span>
                  <h2 className="font-display font-black text-lg text-(--theme-text) mt-1 mb-1">
                    {activeOrderForModal.status === 'DEVUELTO' ? 'Revisión de Devolución' : 'Detalle del Pedido'}
                  </h2>
                </div>

                {/*RESTAURADA TARJETA DE DATOS DEL VENDEDOR DENTRO DEL MODAL*/}
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

                {activeOrderForModal.status === 'DEVUELTO' && !isAllVerified && (
                  <div className="mb-2 p-3 bg-(--theme-warning-bg) border border-(--theme-warning-border) rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-(--theme-warning) shrink-0 mt-0.5" />
                    <p className="text-xs text-(--theme-warning) font-medium leading-tight">
                      Debes <strong>verificar el estado físico</strong> de todos los productos antes de devolverlos al inventario.
                    </p>
                  </div>
                )}

                <div className="flex-grow overflow-y-auto my-2 pr-1 space-y-2 max-h-[35vh]">
                  {activeOrderForModal.items.map((item, idx) => {
                    const verification = returnVerifications[idx];
                    const isVerified = verification?.verified;

                    return (
                      <div
                        key={idx}
                        onClick={() => activeOrderForModal.status === 'DEVUELTO' && startVerifyingItem(idx, item.quantity)}
                        className={`bg-(--theme-secondary-bg) border rounded-2xl p-3 flex justify-between items-center transition-all ${
                          activeOrderForModal.status === 'DEVUELTO' 
                            ? 'cursor-pointer hover:border-primary/50 active:scale-[0.99] ' + (isVerified ? 'border-primary/30 bg-primary/10' : 'border-(--theme-border)')
                            : 'border-(--theme-border)'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 pr-3">
                          {activeOrderForModal.status === 'DEVUELTO' && (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                              isVerified ? 'bg-primary text-white' : 'bg-(--theme-border) text-(--theme-text) opacity-50'
                            }`}>
                              {isVerified ? <CheckSquare className="w-3.5 h-3.5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                            </div>
                          )}
                          <div>
                            <p className={`font-display font-bold text-sm text-(--theme-text) line-clamp-2 ${
                              isVerified && activeOrderForModal.status === 'DEVUELTO' && verification.bad === 0 ? 'line-through opacity-70' : ''
                            }`}>
                              {item.productName}
                            </p>
                            {isVerified && activeOrderForModal.status === 'DEVUELTO' ? (
                              <p className="text-xs font-medium text-(--theme-text) opacity-80 mt-0.5 flex gap-2">
                                <span className="text-primary font-bold">Bien: {verification.good}</span>
                                {verification.bad > 0 && <span className="text-(--theme-error) font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> Mal: {verification.bad}</span>}
                              </p>
                            ) : (
                              <p className="text-xs font-mono text-(--theme-text) opacity-60 mt-0.5">ID: {item.productId}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-display font-black px-3 py-1.5 rounded-xl text-sm bg-primary/10 text-primary">
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

                {/* BOTONERAS CON INDEPENDENCIA DE LAYOUT RESTAURADAS */}
                <div className="pt-4 mt-4 border-t border-(--theme-border)/50">
                  
                  {activeOrderForModal.status === 'RESERVADO' && (
                    <button
                      type="button"
                      disabled={processingId === activeOrderForModal.id}
                      onClick={() => handleStartPicking(activeOrderForModal)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-primary text-white font-display font-bold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      {processingId === activeOrderForModal.id ? 'Procesando...' : 'EMPEZAR A BUSCAR'}
                    </button>
                  )}

                  {activeOrderForModal.status === 'PENDIENTE' && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveOrderForModal(null)}
                        className="flex-1 px-4 py-3 rounded-2xl font-display font-bold text-sm border border-(--theme-border) text-(--theme-text) opacity-70 hover:opacity-100 hover:bg-(--theme-secondary-bg) transition"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        disabled={processingId === activeOrderForModal.id}
                        onClick={() => handleFinishPacking(activeOrderForModal.id)}
                        className="flex-[1.3] px-4 py-3 rounded-2xl bg-(--theme-warning) text-white font-display font-bold text-sm shadow-md hover:brightness-110 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
                      >
                        <PackageCheck className="w-5 h-5" />
                        {processingId === activeOrderForModal.id ? 'Procesando...' : 'EMPAQUETAR'}
                      </button>
                    </div>
                  )}

                  {activeOrderForModal.status === 'EMPAQUETADO' && (
                    <button
                      type="button"
                      onClick={() => setActiveOrderForModal(null)}
                      className="w-full px-4 py-3 rounded-2xl font-display font-bold text-sm border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) opacity-80 hover:opacity-100 transition"
                    >
                      Cerrar
                    </button>
                  )}

                  {activeOrderForModal.status === 'DEVUELTO' && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveOrderForModal(null)}
                        className="flex-1 px-4 py-3 rounded-2xl font-display font-bold text-sm border border-(--theme-border) text-(--theme-text) opacity-70 hover:opacity-100 hover:bg-(--theme-secondary-bg) transition"
                      >
                        Cerrar
                      </button>
                      <button
                        type="button"
                        disabled={!isAllVerified || processingId === activeOrderForModal.id}
                        onClick={() => handleReturnStock(activeOrderForModal)}
                        className={`flex-[1.3] px-4 py-3 rounded-2xl font-display font-bold text-sm transition-all flex justify-center items-center gap-2 ${
                          !isAllVerified 
                            ? 'bg-(--theme-secondary-bg) border border-(--theme-border) text-(--theme-text) opacity-50 cursor-not-allowed' 
                            : 'bg-(--theme-error) text-white shadow-lg hover:brightness-110'
                        }`}
                      >
                        <ArchiveRestore className="w-5 h-5" />
                        {processingId === activeOrderForModal.id ? 'Procesando...' : 'DEVOLVER A STOCK'}
                      </button>
                    </div>
                  )}
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
                  <h3 className="font-display font-black text-lg text-(--theme-text) leading-tight">
                    {activeOrderForModal.items[verifyingIndex].productName}
                  </h3>
                  <p className="text-sm mt-2 text-(--theme-text) opacity-70">
                    Cantidad total devuelta: <span className="font-black text-(--theme-text)">{activeOrderForModal.items[verifyingIndex].quantity}</span>
                  </p>
                </div>

                <div className="space-y-5 flex-grow">
                  <div>
                    <label className="block text-sm font-bold text-(--theme-text) mb-2">
                      ¿Cuántas unidades están en <span className="text-(--theme-error)">MAL estado</span>?
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
                      Se registrarán <strong className="text-primary">{activeOrderForModal.items[verifyingIndex].quantity - tempBadQty}</strong> unidades en buen estado.
                    </p>
                  </div>

                  {tempBadQty > 0 && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="block text-sm font-bold text-(--theme-text) mb-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-(--theme-warning)" /> Motivo del mal estado
                      </label>
                      <textarea 
                        value={tempReason}
                        onChange={(e) => setTempReason(e.target.value)}
                        placeholder="Ej: Empaque roto, producto vencido, dañado en transporte..."
                        className="w-full bg-(--theme-bg) border border-(--theme-border) text-(--theme-text) rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-(--theme-warning-border) transition resize-none h-24"
                      />
                    </div>
                  )}
                </div>

                <div className="pt-6 mt-2">
                  <button
                    onClick={saveVerification}
                    disabled={tempBadQty > 0 && tempReason.trim().length === 0}
                    className="w-full py-3.5 rounded-2xl font-display font-bold text-sm bg-primary text-white shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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