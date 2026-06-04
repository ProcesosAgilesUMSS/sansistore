import { useState } from "react";
import type { Order } from "@features/orders/types";
import OrderStatusBadge from "@features/orders/components/OrderStatusBadge";
import { paidOrder, readyOrder } from "@features/orders/services/ordersService";
import { parseOrderId } from '@features/cart/services/orderService';

export default function SellerOrderItem({
  order,
}: {
  order: Order;
}) {
  const [markingReady, setMarkingReady] = useState(false);
  const [validatingPayment, setValidatingPayment] = useState(false);
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    window.setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 2600);
  };

  const handleReady = async () => {
    if (markingReady) return;

    try {
      setMarkingReady(true);
      await readyOrder(order.id);
      showToast("success", "Pedido marcado como listo.");
    } catch (error) {
      console.error("Error updating order to ready:", error);
      showToast(
        "error",
        "Error al marcar la orden como lista. Por favor intenta de nuevo."
      );
    } finally {
      setMarkingReady(false);
    }
  };

  const handlePaid = async () => {
    if (validatingPayment) return;

    try {
      setValidatingPayment(true);
      await paidOrder(order.id);
      setShowPaymentConfirm(false);
      showToast("success", "Pago validado correctamente.");
    } catch (error) {
      console.error("Error updating order to paid:", error);
      showToast(
        "error",
        error instanceof Error
          ? error.message
          : "Error al validar el pago. Por favor intenta de nuevo."
      );
    } finally {
      setValidatingPayment(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-subgrid col-span-full border-b py-[10px] min-[760px]:py-0 border-black/20 hover:bg-black/5">
        <a
          href={`/seller/orders/${order.id}`}
          className="col-span-full min-[760px]:col-start-1 min-[760px]:col-end-3 text-sm flex items-center gap-[8px] text-xs cursor-pointer"
        >
          <div className="size-1.5 bg-[#1e1e1e]" />
          {parseOrderId(order.id).friendlyName}
        </a>
        <a
          href={`/seller/orders/${order.id}`}
          className="col-start-1 col-end-9 min-[760px]:col-start-3 min-[760px]:col-end-10 text-[calc(.78125vw+13.5px)] truncate
          min-[960px]:col-end-13 tracking-tight cursor-pointer"
        >
          {order.delivery.destination}
        </a>

        <div
          className="min-[960px]:col-start-14 min-[960px]:col-end-18 min-[760px]:col-start-10 min-[760px]:col-end-14 text-[11px] flex
          items-center col-span-full tracking-tight min-[760px]:ml-4 min-[960px]:ml-0"
        >
          <OrderStatusBadge status={order.status} />
        </div>

        {order.status === "EMPAQUETADO" && (
          <button
            className="min-[760px]:col-start-16 min-[960px]:col-start-21 min-[960px]:col-end-23 text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
            onClick={(e) => {
              e.stopPropagation();
              void handleReady();
            }}
            disabled={markingReady}
          >
            <span className="border px-2 py-1 border-black/30 rounded">
              {markingReady ? "Marcando..." : "Listo"}
            </span>
          </button>
        )}

        {order.status === "ENTREGADO" && (
          <button
            className="text-left min-[760px]:col-start-16 min-[960px]:col-start-21 min-[960px]:col-end-23 text-sm underline decoration-2 cursor-pointer underline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={(e) => {
              e.stopPropagation();
              setShowPaymentConfirm(true);
            }}
            disabled={validatingPayment}
          >
            {validatingPayment ? "Validando..." : "Validar pago"}
          </button>
        )}
      </div>

      {showPaymentConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!validatingPayment) setShowPaymentConfirm(false);
          }}
        >
          <div
            className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <span className="text-xl font-bold">$</span>
            </div>
            <h3 className="text-[1.6rem] font-semibold text-[#222]">
              Validar pago del pedido
            </h3>
            <p className="mt-3 text-[1rem] leading-7 text-[#666]">
              Este pedido se marcará como pagado y se actualizará el inventario.
            </p>
            <div className="mt-5 rounded-2xl border border-[#e7e2d8] px-4 py-3 text-sm text-[#777]">
              Esta acción no se puede deshacer.
            </div>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setShowPaymentConfirm(false)}
                disabled={validatingPayment}
                className="flex-1 rounded-full border border-[#ddd6c7] px-5 py-3 text-sm font-medium text-[#333] transition hover:bg-[#f7f4ee] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void handlePaid()}
                disabled={validatingPayment}
                className="flex-1 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {validatingPayment ? "Validando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed right-5 top-5 z-[60]">
          <div
            className={`min-w-[280px] rounded-2xl border px-4 py-3 text-sm shadow-xl ${
              toast.type === "success"
                ? "border-primary/30 bg-[#f4faea] text-[#35511c]"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold">{toast.message}</p>
              <button
                type="button"
                onClick={() => setToast(null)}
                className="text-xs opacity-70 transition hover:opacity-100"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
