import { useState, useEffect, useMemo, useRef } from "react";
import type { Order, OrderStatus } from "@features/orders/types";
import { STATUS_LABELS } from "@features/orders/types";
import { subscribeToSellerOrders } from "../services/ordersService";
import { useAuthUser } from "../../../hooks/useAuthUser";
import SellerOrderItem from "./SellerOrderItem";
import OrderModal from "./OrderModal";
import { ClosedFolderIcon, OpenFolderIcon } from "./Icons";
import { X } from "lucide-react";
import OrderStatusBadge from "./OrderStatusBadge";
import Toast from "@features/admin/users/components/Toast";

export default function Orders() {
  const { user } = useAuthUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  const showNotification = (type: "success" | "error", message: string) => {
    const allowedMessages = ["Pedido marcado como listo.", "Pago validado correctamente."];
    if (type === "success" && !allowedMessages.includes(message)) return;
    setToast({ message, type });
  };

  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToSellerOrders(user.uid, (newOrders) => {
      setOrders(newOrders);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredOrders = useMemo(() => {
    if (selectedStatuses.length === 0) return orders;
    return orders.filter((order) => selectedStatuses.includes(order.status));
  }, [orders, selectedStatuses]);

  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  if (loading) return null;

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {selectedOrder ? (
        <OrderModal
          order={selectedOrder}
          closeModal={() => setSelectedOrder(null)}
          onNotification={showNotification}
        />
      ) : null}
      <>
        <ul className="grid grid-cols-18 mx-auto max-w-256 px-2">
          <div className="relative mb-8 col-span-full">
            <div ref={filterRef} className="w-fit">
              <div className="flex items-center gap-x-2 text-sm w-fit cursor-pointer" onClick={() => setShowFilters(!showFilters)}>
                {showFilters ? <ClosedFolderIcon /> : <OpenFolderIcon />}
                Estado
              </div>

              {selectedStatuses.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2 text-xs w-full items-center">
                  {selectedStatuses.map(status => (
                    <div
                      key={status}
                      className="flex items-center gap-x-2 bg-black/10 hover:bg-black/20 cursor-pointer px-2"
                      onClick={() => toggleStatus(status)}
                    >
                      <X size={13} />
                      <span>{STATUS_LABELS[status]}</span>
                    </div>
                  ))}
                </div>
              )}

              {showFilters && (
                <div className=" bg-white border border-black/10  p-1 absolute z-10 w-[16ch]">
                  {(Object.entries(STATUS_LABELS) as [OrderStatus, string][])
                    .filter(([status]) => status !== 'CREADO')
                    .map(([status]) => (
                      <div
                        onClick={() => toggleStatus(status)}
                        className={`flex text-xs gap-x-2 cursor-pointer hover:bg-black/10 ${selectedStatuses.includes(status) ? 'bg-black/10' : ''}`}
                      >
                        <OrderStatusBadge status={status} />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>


          <li className="hidden min-[765px]:grid grid-cols-subgrid col-span-full uppercase border-b border-black/20 text-xs py-0.5 mt-2">
            <div className="flex gap-x-2">
              <span>/</span>
              Orden
            </div>
            <div className="flex gap-x-2 min-[765px]:col-start-3 min-[765px]:col-end-7">
              <span>/</span>
              Destino
            </div>
            <div className="flex gap-x-2 min-[765px]:col-start-11 min-[765px]:col-end-13  min-[765px]:ml-2 min-[965px]:col-start-9 min-[965px]:col-end-13 min-[960px]:ml-10">
              <span>/</span>
              Estado
            </div>

            <div className="ml-4 hidden gap-x-2 min-[965px]:flex min-[965px]:col-start-13 min-[965px]:col-end-16">
              <span>/</span>
              Actualizado
            </div>

            <div className="flex gap-x-2 min-[765px]:col-start-16 min-[765px]:col-end-19">
              <span>/</span>
              Asignado a
            </div>
          </li>

          {filteredOrders.map((order, index) => (
            <SellerOrderItem
              key={order.id}
              order={order}
              index={index}
              selectOrder={() => setSelectedOrder(order)}
            />
          ))}
        </ul>
      </>
    </>
  );
}
