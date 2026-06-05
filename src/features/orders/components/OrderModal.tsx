import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import type { Order } from "../types";
import { formatCurrency } from "../utils/currency";
import { formatOrderDate, timeAgo } from "../utils/formatDate";
import OrderActions from "./OrderActions";
import { parseOrderId } from '@features/cart/services/orderService';
import OrderStatusBadge from "./OrderStatusBadge";

type DetailColumn = 'precio' | 'monto' | 'stock';

export default function OrderModal({
  order, closeModal
}: {
  order: Order,
  closeModal: () => void
}) {
  const [selectedCol, setSelectedCol] = useState<DetailColumn>('stock');
  const [showColSelector, setShowColSelector] = useState(false);

  const createdAt = formatOrderDate(order.createdAt);
  const updatedAt = timeAgo(order.updatedAt);
  const totalQuantity = order.items.reduce((acc, item) => acc + item.quantity, 0);
  const formattedStatus = order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase();

  const columns: { id: DetailColumn; label: string }[] = [
    { id: 'monto', label: 'Monto' },
    { id: 'precio', label: 'Precio' },
    { id: 'stock', label: 'Stock' },
  ];

  return (
    <div
      onClick={closeModal}
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-2"
    >
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-[75ch] px-4 py-4 rounded-lg flex flex-col max-h-[90vh] overflow-y-auto">

        <div className="flex gap-x-8">
          <span className="tracking-tight text-xl">{parseOrderId(order.id).friendlyName}</span>
          <div className="flex gap-x-2 items-center">
            <OrderStatusBadge status={order.status} />
          </div>
        </div>

        {/*INFORMATION*/}

        <div className="grid grid-cols-20 my-4">
          <div className="leading-[140%] col-start-1 col-end-4 text-black/50">Cliente:</div>
          <div className="leading-[140%] col-start-7  min-[765px]:col-start-5 col-end-21">{order.buyerName}</div>
          <div className="leading-[140%] col-start-1 col-end-4 text-black/50">Creado:</div>
          <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21">{createdAt}</div>
          <div className="leading-[140%] col-start-1 col-end-4 text-black/50">Destino:</div>
          <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate">{order.address}</div>
          <div className="leading-[140%] col-start-1 col-end-5 text-black/50 capitalize truncate">{formattedStatus}:</div>
          <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate">{updatedAt}</div>
          {order.incidentReason && (
            <>
              <div className="leading-[140%] col-start-1 col-end-4 text-black/50 capitalize">Incidente</div>
              <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate">{order.incidentReason}</div>

              {order.incidentNotes && (
                <>
                  <div className="leading-[140%] col-start-1 col-end-4 text-black/50 capitalize">Nota:</div>
                  <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate italic">{order.incidentNotes}</div>
                </>
              )}
            </>
          )}

          {order.delivery && (
            <>
              <div className="leading-[140%] col-start-1 col-end-5 text-black/50">Repartidor:</div>
              <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21">{order.delivery.courierName}</div>
              <div className="leading-[140%] col-start-1 col-end-5 text-black/50">Asignado:</div>
              <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21">{timeAgo(order.delivery.assignedAt)}</div>
              {order.delivery.incidentReason && (
                <>
                  <div className="leading-[140%] col-start-1 col-end-5 text-black/50">Incidente:</div>
                  <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21">{order.delivery.incidentReason}</div>
                  {order.delivery.incidentNotes && (
                    <>
                      <div className="leading-[140%] col-start-1 col-end-4 text-black/50 capitalize">Nota:</div>
                      <div className="leading-[140%] col-start-7 min-[765px]:col-start-5 col-end-21 truncate">{order.delivery.incidentNotes}</div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>


        <div className="grid grid-cols-20">
          <div
            className="col-span-full grid grid-cols-subgrid py-1.5"
            style={{
              backgroundImage: 'linear-gradient(to right, black 70%, transparent 70%), linear-gradient(to right, black 70%, transparent 70%)',
              backgroundPosition: 'top, bottom',
              backgroundSize: '20px 1px',
              backgroundRepeat: 'repeat-x'
            }}
          >
            <div className="col-start-1 col-end-3">Cant.</div>
            <div className="col-start-4 col-end-13 min-[570px]:col-start-3 min-[570px]:col-end-10">Producto</div>

            {/* Desktop columns */}
            <div className="hidden min-[570px]:block col-start-13 col-end-16">Precio</div>
            <div className="hidden min-[570px]:block col-start-16 col-end-18">Monto</div>
            <div className="hidden min-[570px]:block col-start-19 col-end-21 text-center">Stock</div>

            {/* Mobile dynamic column */}
            <div className="min-[570px]:hidden col-start-18 col-end-21 relative cursor-pointer">
              <button
                onClick={() => setShowColSelector(!showColSelector)}
                className="flex items-center gap-1 w-full justify-end pr-3"
              >
                {columns.find(c => c.id === selectedCol)?.label}
                <ChevronDown size={14} />
              </button>

              {showColSelector && (
                <div className="absolute right-0 top-full border border-black/20 shadow-2xl rounded-md z-[100] min-w-[150px] bg-white">
                  {columns.map(col => (
                    <button
                      key={col.id}
                      className={`flex items-center justify-between block w-full text-left px-2 py-0.5 hover:bg-gray-100 ${selectedCol === col.id ? "bg-blue-100" : "bg-white"}`}
                      onClick={() => {
                        setSelectedCol(col.id);
                        setShowColSelector(false);
                      }}
                    >
                      {col.label}
                      {selectedCol === col.id && <Check size={12} color="blue" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ul className="col-span-full grid grid-cols-subgrid py-2">
            {order.items.map((item, index) => (
              <li key={index} className="col-span-full grid grid-cols-subgrid leading-[140%] items-center">
                <div className="col-start-1 col-end-3 text-center">{item.quantity}</div>
                <div className="col-start-4 col-end-17 min-[570px]:col-start-3 min-[570px]:col-end-13 truncate">{item.productName}</div>

                {/* Desktop view */}
                <div className="hidden min-[570px]:block col-start-13 col-end-16">{formatCurrency(item.unitPrice)}</div>
                <div className="hidden min-[570px]:block col-start-16 col-end-19">{formatCurrency(item.subtotal)}</div>
                <div className="hidden min-[570px]:block col-start-19 col-end-21 text-center">{item.stockAvailable}</div>

                {/* Mobile view dynamic data */}
                <div className={`min-[570px]:hidden col-start-17 col-end-21 ml-0.5 ${selectedCol === "stock" ? "text-center" : "text-left"}`}>
                  {selectedCol === 'monto' && formatCurrency(item.subtotal)}
                  {selectedCol === 'precio' && formatCurrency(item.unitPrice)}
                  {selectedCol === 'stock' && item.stockAvailable}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="py-2"
          style={{
            backgroundImage: 'linear-gradient(to right, black 70%, transparent 70%), linear-gradient(to right, black 70%, transparent 70%)',
            backgroundPosition: 'top, bottom',
            backgroundSize: '20px 1px',
            backgroundRepeat: 'repeat-x',
          }}
        >
          <div className="flex justify-between items-center leading-[130%]">
            <div>Número de artículos:</div>
            <div>{totalQuantity}</div>
          </div>

          <div className="flex justify-between items-baseline leading-[130%]">
            <div>Total:</div>
            <div className="tracking-tight">{formatCurrency(order.total)}</div>
          </div>
        </div>


        <div className="mt-2">
          <OrderActions order={order} onSuccess={closeModal} />
        </div>
      </div>
    </div >
  )
}
