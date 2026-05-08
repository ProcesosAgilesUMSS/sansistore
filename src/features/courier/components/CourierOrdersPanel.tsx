import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import {
  getCourierOrders,
  updateDeliveryStatus,
  type CourierOrder,
  type DeliveryStatus,
} from '../services/courierOrdersService';

const devCourierOptions = [
  { id: 'user-mensajero-001', label: 'Luis Torrez' },
  { id: 'user-mensajero-002', label: 'Nadia Guzman' },
];

function formatPaymentMethod(method: string) {
  if (method === 'cash_on_delivery') return 'Pago contra entrega';
  return method;
}

function formatPaymentStatus(status: string) {
  if (status === 'pending' || status === 'PENDIENTE') return 'Pendiente';
  if (status === 'paid' || status === 'PAGADO') return 'Pagado';
  if (status === 'failed' || status === 'FALLIDO') return 'Fallido';
  return status;
}

function formatStatus(status: DeliveryStatus) {
  if (status === 'assigned') return 'Asignado';
  if (status === 'accepted') return 'Aceptado';
  if (status === 'pending_reassignment') return 'Pendiente de reasignacion';
  if (status === 'in_transit') return 'En camino';
  if (status === 'delivered') return 'Entregado';
  return status;
}

function formatEventTime(date: Date | null) {
  if (!date) {
    return 'Pendiente';
  }

  return new Intl.DateTimeFormat('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getStatusTone(status: DeliveryStatus) {
  if (status === 'accepted') return 'bg-emerald-500/12 text-emerald-600';
  if (status === 'pending_reassignment') return 'bg-rose-500/12 text-rose-600';
  if (status === 'in_transit') return 'bg-sky-500/12 text-sky-600';
  if (status === 'delivered') return 'bg-primary/15 text-primary';
  return 'bg-amber-500/12 text-amber-600';
}

export default function CourierOrdersPanel() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [authCourierId, setAuthCourierId] = useState<string | null>(null);
  const [devCourierId, setDevCourierId] = useState(devCourierOptions[0].id);
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeDeliveryId, setActiveDeliveryId] = useState<string | null>(null);

  const courierId = authCourierId ?? devCourierId;
  const usingDevMode = authCourierId === null;

  const loadOrders = async (uid: string) => {
    setLoading(true);
    setMessage('');

    try {
      const data = await getCourierOrders(uid);
      setOrders(data);
    } catch (error) {
      console.error(error);
      setMessage('No se pudieron cargar los pedidos asignados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthCourierId(user?.uid ?? null);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!courierId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    void loadOrders(courierId);
  }, [courierId]);

  const handleChangeStatus = async (
    deliveryId: string,
    status: DeliveryStatus,
  ) => {
    if (!courierId || activeDeliveryId) return;

    setActiveDeliveryId(deliveryId);
    setMessage('');

    try {
      await updateDeliveryStatus(deliveryId, status, courierId);
      await loadOrders(courierId);
      setSelectedOrder(null);
      setMessage('Estado actualizado correctamente.');
    } catch (error) {
      console.error(error);
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage('No se pudo actualizar el estado de la entrega.');
      }
    } finally {
      setActiveDeliveryId(null);
    }
  };

  const activeCourierLabel = useMemo(() => {
    if (authCourierId) {
      return auth.currentUser?.displayName || auth.currentUser?.email || authCourierId;
    }

    return (
      devCourierOptions.find((option) => option.id === devCourierId)?.label ||
      devCourierId
    );
  }, [authCourierId, devCourierId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-light px-6 pt-28 text-text-light">
        <section className="mx-auto max-w-5xl">
          <p className="font-semibold">Cargando pedidos asignados...</p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-light px-6 pt-28 pb-12 text-text-light">
      <section className="mx-auto max-w-5xl">
        <div className="overflow-hidden rounded-[32px] border border-border-light bg-[linear-gradient(135deg,rgba(136,176,75,0.14),rgba(136,176,75,0.03))] p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-primary/70">
                Team 2 Logistics
              </p>
              <h1 className="text-3xl font-black tracking-tight text-text-light sm:text-4xl">
                Gestion de pedidos asignados
              </h1>
              <p className="max-w-2xl text-sm text-text-light/68 sm:text-base">
                Revisa tus pedidos asignados y decide si aceptas o rechazas la entrega antes de iniciar el recorrido.
              </p>
            </div>

            <div className="rounded-[24px] border border-border-light bg-card-bg-light/80 px-4 py-3 backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-text-light/45">
                Mensajero activo
              </p>
              <p className="mt-2 text-xl font-black tracking-tight text-text-light">
                {activeCourierLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-border-light bg-card-bg-light p-6">
          <div className="space-y-4 border-b border-border-light pb-5">
            {usingDevMode && (
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-text-light/45">
                    Identidad temporal de desarrollo
                  </p>
                  <p className="text-sm text-text-light/60">
                    No hay sesiÃ³n iniciada. Usa este selector para probar la HU consolidada en la vista courier.
                  </p>
                </div>

                <label className="flex w-full max-w-sm flex-col gap-2">
                  <span className="text-[11px] font-black uppercase tracking-[0.22em] text-text-light/45">
                    Seleccionar mensajero
                  </span>
                  <select
                    value={devCourierId}
                    onChange={(event) => setDevCourierId(event.target.value)}
                    className="rounded-2xl border border-border-light bg-secondary-bg-light px-4 py-3 text-sm font-semibold text-text-light outline-none transition-colors focus:border-primary"
                  >
                    {devCourierOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-text-light/70">
                Mensajero activo: <span className="text-text-light">{courierId}</span>
              </p>
              <p className="mt-2 text-sm text-text-light/60">
                La lista muestra solo tus pedidos asignados. Desde aquÃ­ puedes aceptar o rechazar antes de continuar con el flujo de entrega.
              </p>
            </div>
          </div>

          {message && (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 font-semibold text-primary">
              {message}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-text-light/45">
                  Resumen
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-text-light">
                  {orders.length} pedidos asignados
                </h2>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-3xl border border-border-light bg-card-bg-light p-8">
                <h2 className="text-2xl font-black">No tienes pedidos asignados</h2>
                <p className="mt-2 opacity-70">
                  Cuando el vendedor registre entregas para tu usuario, aparecerÃ¡n aquÃ­.
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const canAccept = order.status === 'assigned';
                const canReject = order.status === 'assigned';
                const canTransit = order.status === 'accepted';
                const canDeliver =
                  order.status === 'accepted' || order.status === 'in_transit';
                const isProcessing = activeDeliveryId === order.deliveryId;
                const isBlockedByOtherAction =
                  activeDeliveryId !== null && activeDeliveryId !== order.deliveryId;

                return (
                  <article
                    key={order.deliveryId}
                    className="rounded-[28px] border border-border-light bg-card-bg-light p-6 shadow-[0_18px_50px_rgba(0,0,0,0.06)]"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-sm font-black uppercase tracking-[0.24em] text-primary/70">
                            {order.deliveryCode || `Entrega ${order.deliveryId}`}
                          </p>
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] ${getStatusTone(order.status)}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                        </div>

                        <div>
                          <h2 className="text-2xl font-black">Pedido {order.orderId}</h2>
                          <p className="mt-2 opacity-70">Cliente: {order.customerName}</p>
                          <p className="opacity-70">Telefono: {order.customerPhone}</p>
                          <p className="opacity-70">Direccion: {order.address}</p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-secondary-bg-light px-3 py-1 text-[11px] font-bold text-text-light/70">
                            Asignado: {formatEventTime(order.assignedAt)}
                          </span>
                          <span className="rounded-full bg-secondary-bg-light px-3 py-1 text-[11px] font-bold text-text-light/70">
                            Aceptado: {formatEventTime(order.acceptedAt)}
                          </span>
                          <span className="rounded-full bg-secondary-bg-light px-3 py-1 text-[11px] font-bold text-text-light/70">
                            Rechazado: {formatEventTime(order.rejectedAt)}
                          </span>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-secondary-bg-light p-5 text-left md:min-w-[240px]">
                        <p className="text-sm opacity-60">Monto exacto a cobrar</p>
                        <p className="mt-1 text-4xl font-black text-primary">
                          Bs {order.amountCollected.toFixed(2)}
                        </p>
                        <p className="mt-3 text-sm font-semibold">
                          {formatPaymentMethod(order.paymentMethod)}
                        </p>
                        <p className="text-sm opacity-70">
                          Pago: {formatPaymentStatus(order.paymentStatus)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order)}
                        className="rounded-full border border-border-light px-5 py-2 text-sm font-bold hover:border-primary hover:text-primary"
                      >
                        Ver detalle
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleChangeStatus(order.deliveryId, 'accepted')}
                        disabled={!canAccept || isProcessing || isBlockedByOtherAction}
                        className={`rounded-full px-5 py-2 text-sm font-bold ${
                          canAccept && !isProcessing && !isBlockedByOtherAction
                            ? 'bg-primary text-bg-dark'
                            : 'bg-primary/40 text-bg-dark/70'
                        }`}
                      >
                        {isProcessing && canAccept ? 'Aceptando...' : 'Aceptar'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          void handleChangeStatus(order.deliveryId, 'pending_reassignment')
                        }
                        disabled={!canReject || isProcessing || isBlockedByOtherAction}
                        className={`rounded-full border px-5 py-2 text-sm font-bold ${
                          canReject && !isProcessing && !isBlockedByOtherAction
                            ? 'border-rose-500/50 text-rose-500'
                            : 'border-rose-500/30 text-rose-500/60'
                        }`}
                      >
                        {isProcessing && canReject ? 'Procesando...' : 'Rechazar'}
                      </button>

                      {canTransit && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleChangeStatus(order.deliveryId, 'in_transit')
                          }
                          disabled={isProcessing || isBlockedByOtherAction}
                          className="rounded-full bg-text-light px-5 py-2 text-sm font-bold text-bg-light"
                        >
                          Marcar en camino
                        </button>
                      )}

                      {canDeliver && (
                        <button
                          type="button"
                          onClick={() =>
                            void handleChangeStatus(order.deliveryId, 'delivered')
                          }
                          disabled={isProcessing || isBlockedByOtherAction}
                          className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-bg-dark"
                        >
                          Marcar entregado
                        </button>
                      )}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <section className="w-full max-w-lg rounded-3xl bg-card-bg-light p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-primary">Detalle de entrega</p>
                <h2 className="mt-1 text-2xl font-black">
                  Pedido {selectedOrder.orderId}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full border border-border-light px-3 py-1 text-sm font-bold"
              >
                X
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <p>
                <strong>Cliente:</strong> {selectedOrder.customerName}
              </p>
              <p>
                <strong>Telefono:</strong> {selectedOrder.customerPhone}
              </p>
              <p>
                <strong>Direccion:</strong> {selectedOrder.address}
              </p>
              <p>
                <strong>Metodo de pago:</strong>{' '}
                {formatPaymentMethod(selectedOrder.paymentMethod)}
              </p>
              <p>
                <strong>Estado del pago:</strong>{' '}
                {formatPaymentStatus(selectedOrder.paymentStatus)}
              </p>
              <p>
                <strong>Estado de entrega:</strong>{' '}
                {formatStatus(selectedOrder.status)}
              </p>

              <div className="rounded-2xl bg-secondary-bg-light p-5">
                <p className="text-sm opacity-70">Monto exacto a cobrar</p>
                <p className="text-4xl font-black text-primary">
                  Bs {selectedOrder.amountCollected.toFixed(2)}
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
