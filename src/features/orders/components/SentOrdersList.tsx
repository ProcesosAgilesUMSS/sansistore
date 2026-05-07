import { ChevronRight } from "lucide-react";
import { PLACEHOLDER_ORDERS } from "../placeholder-data";
import { useState } from "react";
import type { Order, OrderStatus } from "../types";
import OrderProductDetail from "./OrderProductDetail";

function CheckBox({ checked }: { checked: boolean }) {
  const checkedPath = "M1 1L-3.49691e-07 1L-4.37113e-08 8L1 8L1 9L9 9L9 8L10 8L10 1L9 1L9 -3.93402e-07L1 -4.37114e-08L1 1ZM1 1L9 1L9 8L1 8L1 1ZM7 2L8 2L8 3L7 3L7 2ZM6 4L6 3L7 3L7 4L6 4ZM5 5L5 4L6 4L6 5L5 5ZM4 6L4 5L5 5L5 6L4 6ZM3 6L4 6L4 7L3 7L3 6ZM3 6L2 6L2 5L3 5L3 6Z";
  const uncheckedPath = "M1 1L-3.49691e-07 1L-4.37113e-08 8L1 8L1 9L9 9L9 8L10 8L10 1L9 1L9 -3.93402e-07L1 -4.37114e-08L1 1ZM1 1L9 1L9 8L1 8L1 1Z";

  return (
    <svg
      width="15"
      height="14"
      viewBox="0 0 10 9"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Checkbox icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d={checked ? checkedPath : uncheckedPath}
        fill="currentColor"
      />
    </svg>
  )
}

function OpenFolderIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 12 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Folder Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7 0H1V1H0V2V3V9H1V10H11V9H12V3H11V2H8V1H7V0ZM11 3V9H1V3H7H8H11ZM7 1V2H1V1H7Z"
        fill="currentColor"
      />
    </svg>
  )
}

function ClosedFolderIcon() {
  return (
    <svg
      viewBox="0 0 12 10"
      width="18"
      height="18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Folder Icon</title>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 0H7V1H1V0ZM1 6V1H0V9H1V10H11V9H12V3H11V2H8V1H7V2H8V3H11V4H3V5H2V6H1ZM1 7V9H11V5H3V6H2V7H1Z"
        fill="currentColor"
      />
    </svg>
  )
}

const AVAILABLE_STATUSES: OrderStatus[] = ["en camino", "entregado"];

export default function SentOrdersList() {
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const filteredOrders = selectedStatuses.length === 0
    ? PLACEHOLDER_ORDERS
    : PLACEHOLDER_ORDERS.filter((order) => selectedStatuses.includes(order.status));

  return (
    <section className="grid grid-cols-[repeat(24,1fr)] p-3" aria-labelledby="orders-title">
      <h2 id="orders-title" className="col-start-1 col-end-25 tracking-[-0.07em] text-[calc(4.48431vw+36.5112px)] mb-16 leading-[100%]">
        Pedidos enviados <sup className="top-[-1em] text-[0.4em] tracking-tight">({PLACEHOLDER_ORDERS.length})</sup>
      </h2>

      <div className="self-start grid grid-cols-subgrid col-start-1 col-end-7 gap-y-[16px]">
        <div className="col-span-full flex gap-[4px] uppercase text-xs border-b pb-1.5">
          <span>/</span>
          filter
        </div>
        <div className="col-start-1 col-end-4">
          <button
            className="text-[#1e1e1e] flex cursor-pointer gap-[8px] items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <ChevronRight className={`size-3.5 ${showFilters ? "rotate-90" : ""}`} />
            {showFilters ? <ClosedFolderIcon /> : <OpenFolderIcon />}
            <span className="text-sm">Estado</span>
          </button>

          {showFilters && (
            <ul className="border-l border-dotted m-[10px_0_0_7px] pl-[15px] flex gap-[8px] flex-col">
              {AVAILABLE_STATUSES.map((status) => {
                const isSelected = selectedStatuses.includes(status);

                return (<li key={status}>
                  <button
                    onClick={() => toggleStatus(status)}
                    className={`flex gap-[8px] items-center cursor-pointer hover:text-[#1e1e1e] ${isSelected ? "text-[#1e1e1e]" : "text-[#1e1e1e44]"}`}
                  >
                    <CheckBox checked={isSelected} />
                    <span
                      className={`text-sm capitalize leading-[90%] ${isSelected ? "bg-blue-200" : "bg-green-300"}`}
                    >
                      {status}
                    </span>
                  </button>
                </li>)
              })}
            </ul>)
          }
        </div>
      </div>

      {selectedOrder ? (
        <OrderProductDetail
          order={selectedOrder}
          onBack={() => setSelectedOrder(null)}
        />
      ) : (

      <div className="col-start-8 col-end-25 grid grid-cols-subgrid">
        <header className="col-span-full grid grid-cols-subgrid border-b pb-1.5">
          <div className="uppercase col-start-1 col-end-3 text-xs flex gap-[4px]">
            <span>/</span>
            orden
          </div>
          <div className="uppercase col-start-3 col-end-15 text-xs flex gap-[4px]">
            <span>/</span>
            dirección
          </div>
          <div className="uppercase col-start-15 col-end-18 text-xs flex gap-[4px]">
            <span>/</span>
            estado
          </div>
          <div className="uppercase col-start-18 col-end-25 text-xs flex gap-[4px]">
            <span>/</span>
            detalle
          </div>
        </header>

        <ul className="col-span-full grid grid-cols-subgrid">
          {filteredOrders.map((order) => (
            <li
              key={order.id}
              className="grid grid-cols-subgrid col-span-full border-b items-center"
            >
              <div className="col-start-1 col-end-3 text-sm flex items-center gap-[8px] text-xs">
                <div className="size-1.5 bg-[#1e1e1e]" />
                {order.id}
              </div>
              <div className="col-start-3 col-end-14 text-[calc(.78125vw+14.5px)] truncate">
                {order.delivery.destination}
              </div>
              <div
                className="col-start-15 col-end-18 text-sm flex items-center"
                aria-label={`Estado: ${order.status}`}
              >
                <div className="uppercase text-xs border border-[#1e1e1e44] p-[2px_5px_2.5px] border-dotted rounded flex items-center w-[13.5ch] justify-between">
                  {order.status}
                  <div
                    className={`size-2 rounded-full ${order.status === "entregado" ? "bg-[#008000]" : "bg-[#0000FF]"
                      }`}
                  />
                </div>
              </div>
              <div className="col-start-18 col-end-25 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="text-sm border border-[#1e1e1e44] rounded-full px-4 py-2 hover:bg-[#1e1e1e] hover:text-white transition-colors"
                >
                  Ver detalle
                </button>
              </div>

            </li>
          ))}
        </ul>
      </div>
      )}
    </section>
  );
}
