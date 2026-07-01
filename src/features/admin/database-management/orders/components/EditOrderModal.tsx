import { useEffect, useState } from "react";
import type {
  AdminOrder,
  DeliveryStatus,
  OrderStatus,
  UpdateOrderPayload,
} from "../types";

const STATUS_OPTIONS: OrderStatus[] = [
  "CREADO",
  "PENDIENTE",
  "RESERVADO",
  "EMPAQUETADO",
  "EN CAMINO",
  "ENTREGADO",
  "PAGADO",
  "NO ENTREGADO",
  "CANCELADO",
];

const DELIVERY_OPTIONS: Array<DeliveryStatus> = [
  null,
  "DELIVERED",
  "IN TRANSIT",
  "NOT_DELIVERED",
  "CANCELLED",
];

interface EditOrderModalProps {
  order: AdminOrder;
  saving: boolean;
  onSave: (payload: UpdateOrderPayload) => void;
  onClose: () => void;
}

export default function EditOrderModal({
  order,
  saving,
  onSave,
  onClose,
}: EditOrderModalProps) {
  const [form, setForm] = useState<UpdateOrderPayload>({
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    status: order.status,
    deliveryStatus: order.deliveryStatus,
    incidentReason: order.incidentReason ?? "",
    total: order.total,
  });

  // Si cambia la orden seleccionada, resetear el form
  useEffect(() => {
    setForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      status: order.status,
      deliveryStatus: order.deliveryStatus,
      incidentReason: order.incidentReason ?? "",
      total: order.total,
    });
  }, [order]);

  const handleChange = <K extends keyof UpdateOrderPayload>(
    key: K,
    value: UpdateOrderPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Modal */}
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--theme-border)">
          <div>
            <h2 className="text-base font-bold text-(--theme-text)">
              Editar orden
            </h2>
            <p className="text-xs text-(--theme-text)/50 mt-0.5">
              Los campos de referencia son de solo lectura.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-(--theme-text)/40 hover:text-(--theme-text) transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">

          {/* Solo lectura */}
          <div className="bg-(--theme-text)/5 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/40 mb-2">
              Campos de referencia
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: "Order ID", value: order.id },
                { label: "Secret", value: order.secret },
                { label: "Buyer ID", value: order.buyerId },
                { label: "Seller ID", value: order.sellerId ?? "—" },
                { label: "Payment ID", value: order.paymentId ?? "—" },
                { label: "Delivery ID", value: order.deliveryId ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-xs text-(--theme-text)/40">{label}</span>
                  <span className="text-xs font-mono text-(--theme-text)/50 truncate">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Campos editables */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Customer name */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
                Nombre del cliente
              </label>
              <input
                type="text"
                value={form.customerName}
                onChange={(e) => handleChange("customerName", e.target.value)}
                className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
                Teléfono
              </label>
              <input
                type="text"
                value={form.customerPhone}
                onChange={(e) => handleChange("customerPhone", e.target.value)}
                className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Total */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
                Total (Bs.)
              </label>
              <input
                type="number"
                value={form.total}
                onChange={(e) =>
                  handleChange("total", parseFloat(e.target.value) || 0)
                }
                className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) =>
                  handleChange("status", e.target.value as OrderStatus)
                }
                className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Delivery status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
                Delivery status
              </label>
              <select
                value={form.deliveryStatus ?? ""}
                onChange={(e) =>
                  handleChange(
                    "deliveryStatus",
                    (e.target.value || null) as DeliveryStatus
                  )
                }
                className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">—</option>
                {DELIVERY_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s!} value={s!}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Incident reason */}
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/50">
                Motivo de incidencia
              </label>
              <input
                type="text"
                value={form.incidentReason ?? ""}
                placeholder="Ej: Cliente ausente"
                onChange={(e) =>
                  handleChange("incidentReason", e.target.value)
                }
                className="border border-(--theme-border) rounded-lg px-3 py-2 text-sm bg-(--theme-card-bg) text-(--theme-text) placeholder:text-(--theme-text)/30 focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 py-4 border-t border-(--theme-border)">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-(--theme-border) text-sm text-(--theme-text)/60 hover:text-(--theme-text) hover:bg-(--theme-text)/5 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onSave(form)}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}