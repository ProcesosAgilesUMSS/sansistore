import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../lib/firebase';
import {
  getCourierOrders,
  updateDeliveryStatus,
  type CourierOrder,
} from '../services/courierOrdersService';

function formatPaymentMethod(method: string) {
  if (method === 'cash_on_delivery') return 'Pago contra entrega';
  return method;
}

function formatPaymentStatus(status: string) {
  if (status === 'pending') return 'Pendiente';
  if (status === 'paid') return 'Pagado';
  if (status === 'failed') return 'Fallido';
  return status;
}

function formatStatus(status: string) {
  if (status === 'assigned') return 'Asignado';
  if (status === 'in_transit') return 'En camino';
  if (status === 'delivered') return 'Entregado';
  return status;
}

export default function CourierOrdersPanel() {
  const [orders, setOrders] = useState<CourierOrder[]>([]);
  const [courierId, setCourierId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CourierOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadOrders = async (uid: string) => {
    setLoading(true);

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
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCourierId(null);
        setOrders([]);
        setLoading(false);
        return;
      }

      setCourierId(user.uid);
      await loadOrders(user.uid);
    });

    return unsubscribe;
  }, []);

  const handleChangeStatus = async (
    deliveryId: string,
    status: 'assigned' | 'in_transit' | 'delivered',
  ) => {
    if (!courierId) return;

    try {
      await updateDeliveryStatus(deliveryId, status);
      await loadOrders(courierId);
      setSelectedOrder(null);
      setMessage('Estado actualizado correctamente.');
    } catch (error) {
      console.error(error);
      setMessage('No se pudo actualizar el estado de la entrega.');
    }
  };

  const totalToCollect = orders
    .filter((order) => order.status !== 'delivered')
    .reduce((sum, order) => sum + order.amountCollected, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-bg-light px-6 pt-28 text-text-light">
        <section className="mx-auto max-w-6xl">
          <p className="font-semibold">Cargando pedidos asignados...</p>
        </section>
      </main>
    );
  }

  if (!courierId) {
    return (
      <main className="min-h-screen bg-bg-light px-6 pt-28 text-text-light">
        <section className="mx-auto max-w-3xl rounded-3xl border border-border-light bg-card-bg-light p-8">
          <h1 className="text-3xl font-black">Panel del mensajero</h1>
          <p className="mt-3 opacity-70">
            Debes iniciar sesión para ver tus pedidos asignados.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-light px-6 pt-28 pb-12 text-text-light">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-primary">
            Mensajero
          </p>
          <h1 className="mt-3 text-4xl font-black">Panel de pedidos</h1>
          <p className="mt-3 max-w-2xl opacity-70">
            Revisa tus pedidos asignados, el método de pago y el monto exacto que debes cobrar al entregar.
          </p>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 font-semibold text-primary">
            {message}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-border-light bg-card-bg-light p-6">
            <p className="text-sm opacity-60">Pedidos asignados</p>
            <p className="mt-2 text-4xl font-black">{orders.length}</p>
          </div>

          <div className="rounded-3xl border border-border-light bg-card-bg-light p-6">
            <p className="text-sm opacity-60">Pendientes de entrega</p>
            <p className="mt-2 text-4xl font-black">
              {orders.filter((order) => order.status !== 'delivered').length}
            </p>
          </div>

          <div className="rounded-3xl border border-border-light bg-card-bg-light p-6">
            <p className="text-sm opacity-60">Total pendiente a cobrar</p>
            <p className="mt-2 text-4xl font-black text-primary">
              Bs {totalToCollect.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <div className="rounded-3xl border border-border-light bg-card-bg-light p-8">
              <h2 className="text-2xl font-black">No tienes pedidos asignados</h2>
              <p className="mt-2 opacity-70">
                Cuando se registren entregas para tu usuario, aparecerán aquí.
              </p>
            </div>
          ) : (
            orders.map((order) => (
              <article
                key={order.deliveryId}
                className="rounded-3xl border border-border-light bg-card-bg-light p-6"
              >
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-primary">
                      {order.deliveryCode || 'Entrega asignada'}
                    </p>
                    <h2 className="mt-1 text-2xl font-black">
                      Pedido {order.orderId}
                    </h2>
                    <p className="mt-2 opacity-70">
                      Cliente: {order.customerName}
                    </p>
                    <p className="opacity-70">
                      Teléfono: {order.customerPhone}
                    </p>
                    <p className="opacity-70">
                      Dirección: {order.address}
                    </p>
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
                    <p className="text-sm opacity-70">
                      Estado: {formatStatus(order.status)}
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

                  {order.status === 'assigned' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeStatus(order.deliveryId, 'in_transit')
                      }
                      className="rounded-full bg-text-light px-5 py-2 text-sm font-bold text-bg-light"
                    >
                      Marcar en camino
                    </button>
                  )}

                  {order.status !== 'delivered' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeStatus(order.deliveryId, 'delivered')
                      }
                      className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-bg-dark"
                    >
                      Marcar entregado
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      {selectedOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <section className="w-full max-w-lg rounded-3xl bg-card-bg-light p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-primary">
                  Detalle de entrega
                </p>
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
                <strong>Teléfono:</strong> {selectedOrder.customerPhone}
              </p>
              <p>
                <strong>Dirección:</strong> {selectedOrder.address}
              </p>
              <p>
                <strong>Método de pago:</strong>{' '}
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

              {selectedOrder.status !== 'delivered' && (
                <div className="flex flex-wrap gap-3 pt-3">
                  {selectedOrder.status === 'assigned' && (
                    <button
                      type="button"
                      onClick={() =>
                        handleChangeStatus(selectedOrder.deliveryId, 'in_transit')
                      }
                      className="rounded-full bg-text-light px-5 py-2 text-sm font-bold text-bg-light"
                    >
                      Marcar en camino
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      handleChangeStatus(selectedOrder.deliveryId, 'delivered')
                    }
                    className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-bg-dark"
                  >
                    Marcar entregado
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}