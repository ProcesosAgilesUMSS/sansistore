import { useEffect, useState, useMemo, useRef } from "react";
import type { Order, OrderStatus } from "@features/orders/types";
import { STATUS_LABELS } from "@features/orders/types";
import { subscribeToSellerOrders } from "@features/orders/services/ordersService";
import { auth } from "@/lib/firebase";
import SellerOrderItem from "@features/orders/components/SellerOrderItem";
import OrderGridSection from "@features/orders/components/OrderGridSection";
import { Package, X, ChevronDown, Check } from "lucide-react";
import { OpenFolderIcon } from "@features/orders/components/Icons";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatus[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const filteredOrders = useMemo(() => {
    if (selectedStatuses.length === 0) return orders;
    return orders.filter(order => selectedStatuses.includes(order.status));
  }, [orders, selectedStatuses]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [filterRef]);

  function toggleStatus(status: OrderStatus) {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  }

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        setOrders([]);
        return;
      }

      const unsubscribeOrders = subscribeToSellerOrders(user.uid, (data) => {
        setOrders(data);
        setLoading(false);
      });

      return () => unsubscribeOrders();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <OrderGridSection
      title="Mis Ordenes"
      loading={loading}
      loadingMessage="Receiving your orders"
      ariaLabelledby="orders-seller-title"
      headerContent={
        <div className="col-span-full min-[960px]:col-start-3 min-[960px]:col-end-23 grid grid-cols-subgrid tracking-tight gap-y-8">
          <div className="flex items-center gap-x-3 min-[960px]:col-start-1 min-[960px]:col-end-5 col-start-1 col-end-3 w-[15ch]">
            <Package strokeWidth={1.5} size={20} />
            <div>{filteredOrders.length} ordenes</div>
          </div>

          <div ref={filterRef} className="col-start-3 col-end-6  min-[760px]:col-start-4  min-[760px]:col-end-7   min-[960px]:col-start-5 min-[960px]:col-end-8 relative flex items-center gap-x-3 cursor-pointer" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <OpenFolderIcon />
            Estados
            <ChevronDown size={16} />
            {isFilterOpen && (
              <div className="p-2 absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded shadow-lg z-10 w-50 text-sm">
                {Object.entries(STATUS_LABELS)
                  .filter(([status]) => status !== 'CREADO')
                  .map(([status, label]) => (
                    <div
                      key={status}
                      className=" hover:bg-gray-100 flex items-center justify-between cursor-pointer uppercase"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStatus(status as OrderStatus);
                      }}
                    >
                      <div className="flex items-center gap-x-2">
                        <Package size={14} />
                        {label}
                      </div>
                      {selectedStatuses.includes(status as OrderStatus) && <Check size={14} />}
                    </div>
                  ))}
              </div>
            )}
          </div>

          {selectedStatuses.length > 0 && (
            <div className="col-span-full flex flex-wrap gap-x-8">
              {selectedStatuses.map(status => (
                <div
                  key={status}
                  className="flex items-center gap-1 cursor-pointer text-black/70 uppercase text-sm"
                  onClick={() => toggleStatus(status)}
                >
                  <X size={14} color="black" />
                  {STATUS_LABELS[status].toUpperCase()}
                </div>
              ))}
            </div>
          )}
        </div>
      }
    >
      {filteredOrders.map((order) => (
        <SellerOrderItem
          key={order.id + order.status}
          order={order}
        />
      ))}
    </OrderGridSection >
  );
}
