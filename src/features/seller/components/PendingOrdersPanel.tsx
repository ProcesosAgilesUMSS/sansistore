import { useState } from 'react';
import { SectionHeader } from './SectionHeader';
import { usePendingOrders } from '../hooks/usePendingOrders';
import type { PendingOrder } from '../types/pendingOrders';

type PendingProduct = PendingOrder['productos'][number];

function PendingStatusPill() {
  return (
    <div className="uppercase text-xs border border-[#1e1e1e44] p-[2px_8px_2.5px] border-dotted rounded flex items-center gap-2 dark:border-white/30 w-fit">
      pendiente
      <div className="size-2 rounded-full bg-amber-500 shrink-0" />
    </div>
  );
}

function ProductsList({ productos }: { productos: PendingOrder['productos'] }) {
  if (productos.length === 0) return <span className="opacity-40 italic">Sin productos</span>;
  if (productos.length === 1) return <span>{productos[0].nombre}</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="truncate max-w-[28ch]">{productos[0].nombre}</span>
      <span className="shrink-0 rounded border border-[#1e1e1e33] border-dotted px-[5px] py-[1px] text-xs uppercase tracking-wide dark:border-white/20">
        +{productos.length - 1}
      </span>
    </span>
  );
}

function TableRow({
  order,
  onClick,
}: {
  order: PendingOrder;
  onClick: (order: PendingOrder) => void;
}) {
  return (
    <tr
      onClick={() => onClick(order)}
      className="group border-b border-dotted border-[#1e1e1e22] cursor-pointer transition-colors hover:bg-[#f0ece3] dark:border-white/10 dark:hover:bg-white/5"
    >
      <td className="py-3 pr-6 w-[11ch]">
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="size-1.5 bg-[#1e1e1e] dark:bg-white/60 shrink-0" />
          {order.id_pedido}
        </div>
      </td>
      <td className="py-3 pr-6 text-sm">
        <ProductsList productos={order.productos} />
      </td>
      <td className="py-3 pr-6 text-xs tabular-nums opacity-60 w-[11ch]">
        {new Date(order.fecha + 'T00:00:00').toLocaleDateString('es-BO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </td>
      <td className="py-3">
        <PendingStatusPill />
      </td>
    </tr>
  );
}

function ColHeader({ children }: { children: string }) {
  return (
    <th className="pb-3 text-left uppercase text-xs tracking-widest font-normal opacity-50">
      <span className="mr-1 opacity-60">/</span>{children}
    </th>
  );
}

function OrderDetailView({
  order,
  onBack,
}: {
  order: PendingOrder;
  onBack: () => void;
}) {
  const total = order.productos.reduce(
    (sum, p) => sum + ((p as PendingProduct & { subtotal?: number }).subtotal ?? 0),
    0,
  );

  return (
    <div className="w-full">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="uppercase text-xs tracking-widest opacity-50 mb-3">/ detalle del pedido</p>
          <h2 className="text-2xl tracking-[-0.05em] leading-none font-light mb-4">
            {order.id_pedido}
          </h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="opacity-50">Estado:</span>
            <PendingStatusPill />
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="uppercase text-xs border border-[#1e1e1e44] p-[3px_10px_3.5px] border-dotted rounded cursor-pointer hover:bg-[#f0ece3] transition-colors dark:border-white/30 dark:hover:bg-white/5 mt-1"
        >
          ← Volver
        </button>
      </div>

      {order.productos.length === 0 ? (
        <p className="text-sm opacity-50 italic py-10 text-center border border-dotted border-[#1e1e1e22] rounded dark:border-white/10">
          Este pedido no contiene productos registrados.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 uppercase text-xs tracking-widest font-normal opacity-50 border-b border-dotted pb-3 mb-1 border-[#1e1e1e44] dark:border-white/20">
            <span>/ Producto</span>
            <span>/ Cantidad</span>
            <span>/ P. Unitario</span>
            <span className="text-right">Subtotal</span>
          </div>

          <ul>
            {order.productos.map((p, i) => {
              const producto = p as PendingProduct & {
                productId?: string;
                quantity?: number;
                unitPrice?: number;
                subtotal?: number;
              };
              return (
                <li
                  key={i}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-dotted py-3 items-start border-[#1e1e1e22] dark:border-white/10"
                >
                  <div>
                    <p className="text-sm font-medium">{p.nombre}</p>
                    {producto.productId && (
                      <p className="text-xs opacity-40 mt-0.5">Cód: {producto.productId}</p>
                    )}
                  </div>
                  <p className="text-sm tabular-nums">{producto.quantity ?? '—'}</p>
                  <p className="text-sm tabular-nums">
                    {producto.unitPrice != null ? `Bs ${producto.unitPrice}` : '—'}
                  </p>
                  <p className="text-sm tabular-nums text-right font-medium">
                    {producto.subtotal != null ? `Bs ${producto.subtotal}` : '—'}
                  </p>
                </li>
              );
            })}
          </ul>

          {total > 0 && (
            <div className="flex justify-end pt-6 pb-10">
              <p className="text-base font-semibold">Total: Bs {total}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-dotted border-[#1e1e1e33] dark:border-white/20">
        <svg className="h-6 w-6 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <p className="text-sm opacity-40">No hay pedidos pendientes</p>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-6 border-b border-dotted border-[#1e1e1e22] py-4 dark:border-white/10">
          <div className="h-3 w-20 rounded-sm bg-[#1e1e1e11] dark:bg-white/10" />
          <div className="h-3 flex-1 rounded-sm bg-[#1e1e1e11] dark:bg-white/10" />
          <div className="h-3 w-20 rounded-sm bg-[#1e1e1e11] dark:bg-white/10" />
          <div className="h-3 w-20 rounded-sm bg-[#1e1e1e11] dark:bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export default function PendingOrdersPanel() {
  const { orders, loading, error } = usePendingOrders();
  const [selectedOrder, setSelectedOrder] = useState<PendingOrder | null>(null);

  return (
    <section aria-labelledby="pending-orders-title">
      <SectionHeader title="Pedidos pendientes" count={loading ? undefined : orders.length} />

      {error && (
        <div className="mb-8 border border-dotted border-red-400 bg-red-50 px-5 py-4 rounded text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonRows />
      ) : selectedOrder ? (
        <OrderDetailView order={selectedOrder} onBack={() => setSelectedOrder(null)} />
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr className="border-b border-dotted border-[#1e1e1e33] dark:border-white/20">
                <ColHeader>orden</ColHeader>
                <ColHeader>productos</ColHeader>
                <ColHeader>fecha</ColHeader>
                <ColHeader>estado</ColHeader>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <TableRow
                  key={order.id_pedido}
                  order={order}
                  onClick={setSelectedOrder}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
