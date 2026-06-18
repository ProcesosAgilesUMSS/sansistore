import { useEffect, useMemo, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PackageX,
  RotateCcw,
  X,
} from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuthUser } from "@/hooks/useAuthUser";
import Navbar from "@/components/Navbar";


// ---------------------------------------------------------------------------
// Configuración
// ---------------------------------------------------------------------------

// Estados de pedido que cuentan como "devuelto". Es un array porque la
// consulta usa el operador "in": fácil agregar otro estado a futuro
// (ej. "DEVUELTO_PARCIAL") sin tocar la lógica.
const RETURNED_ORDER_STATUSES = ["DEVUELTO"] as const;

const RETURN_REASONS = [
  "Cliente ausente",
  "Dirección incorrecta",
  "Pedido rechazado",
  "Falta de pago",
  "Otro",
] as const;

type ReturnReason = (typeof RETURN_REASONS)[number];

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface OrderDoc {
  id: string;
  sellerId: string;
  buyerId?: string;
  buyerName?: string;
  status: string;
  createdAt?: Timestamp;
  total?: number;
}

interface ReturnReasonDoc {
  id: string;
  orderId: string;
  sellerId: string;
  buyerId?: string | null;
  reason: ReturnReason;
  description?: string | null;
  orderStatus: string;
  registeredBy: string;
  registeredByName: string;
  registeredAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function RegisterFailureReasons() {
  const { user } = useAuthUser();

  const [returnedOrders, setReturnedOrders] = useState<OrderDoc[]>([]);
  const [registeredReasons, setRegisteredReasons] = useState<ReturnReasonDoc[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingReasons, setLoadingReasons] = useState(true);
  const [activeOrder, setActiveOrder] = useState<OrderDoc | null>(null);

  // Pedidos devueltos del vendedor actual
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "orders"),
      where("sellerId", "==", user.uid),
      where("status", "in", RETURNED_ORDER_STATUSES)
    );

    const unsub = onSnapshot(q, (snap) => {
      setReturnedOrders(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<OrderDoc, "id">),
        }))
      );
      setLoadingOrders(false);
    });

    return unsub;
  }, [user?.uid]);

  // Motivos de devolución registrados por el vendedor
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "deliveryFailures"),
      where("sellerId", "==", user.uid),
      orderBy("registeredAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setRegisteredReasons(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<ReturnReasonDoc, "id">),
        }))
      );
      setLoadingReasons(false);
    });

    return unsub;
  }, [user?.uid]);

  // Pedidos devueltos que aún no tienen motivo registrado
  const ordersAwaitingReason = useMemo(() => {
    const registeredOrderIds = new Set(registeredReasons.map((r) => r.orderId));
    return returnedOrders.filter((o) => !registeredOrderIds.has(o.id));
  }, [returnedOrders, registeredReasons]);

  // Si no hay usuario, mostrar mensaje (con Navbar/Footer igual)
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-8 text-center">
            <p className="text-(--theme-text) opacity-60">
              Inicia sesión para gestionar los motivos de devolución.
            </p>
          </div>
        </main>

      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        <header>
          <h1 className="text-2xl font-black text-(--theme-text)">
            Motivos de devolución
          </h1>
          <p className="text-(--theme-text) opacity-60 mt-1">
            Registra por qué se devolvió un pedido para poder analizarlo más adelante.
          </p>
        </header>

        <PendingSection
          orders={ordersAwaitingReason}
          loading={loadingOrders}
          onSelect={setActiveOrder}
        />

        <RegisteredSection
          reasons={registeredReasons}
          loading={loadingReasons}
        />

        {activeOrder && (
          <ReasonModal
            order={activeOrder}
            sellerId={user.uid}
            sellerName={user.displayName ?? user.email ?? "Vendedor"}
            onClose={() => setActiveOrder(null)}
          />
        )}
      </main>

  
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sección: pedidos devueltos pendientes
// ---------------------------------------------------------------------------

function PendingSection({
  orders,
  loading,
  onSelect,
}: {
  orders: OrderDoc[];
  loading: boolean;
  onSelect: (order: OrderDoc) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-(--theme-text) mb-4">
        Pendientes de registrar ({orders.length})
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-8 text-center">
          <PackageX className="mx-auto mb-3 opacity-40" size={32} />
          <p className="text-(--theme-text) opacity-60">
            No tienes pedidos devueltos pendientes de registrar.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-4 hover:border-primary/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="font-bold text-(--theme-text) truncate">
                  Pedido #{order.id.slice(0, 8)}
                </p>
                <p className="text-sm text-(--theme-text) opacity-60 truncate">
                  {order.buyerName ?? order.buyerId ?? "Comprador desconocido"}
                </p>
                {order.total && (
                  <p className="text-sm text-(--theme-text) font-medium mt-1">
                    Total: ${order.total.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-(--theme-warning-bg) border border-(--theme-warning-border) text-(--theme-warning) px-3 py-1 text-xs font-bold">
                  <RotateCcw size={14} />
                  Devuelto
                </span>
                <button
                  onClick={() => onSelect(order)}
                  className="shrink-0 whitespace-nowrap rounded-full bg-primary text-white px-4 py-2 text-sm font-bold hover:opacity-90 transition hover:scale-105 active:scale-95"
                >
                  Registrar motivo
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Sección: motivos de devolución registrados
// ---------------------------------------------------------------------------

function RegisteredSection({
  reasons,
  loading,
}: {
  reasons: ReturnReasonDoc[];
  loading: boolean;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold text-(--theme-text) mb-4">
        Motivos registrados ({reasons.length})
      </h2>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : reasons.length === 0 ? (
        <div className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-8 text-center">
          <p className="text-(--theme-text) opacity-60">
            Todavía no registraste ningún motivo de devolución.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {reasons.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-(--theme-border) bg-(--theme-card-bg) p-4 hover:border-primary/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-bold text-(--theme-text)">
                      Pedido #{r.orderId.slice(0, 8)}
                    </p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-(--theme-success-bg) border border-(--theme-success-border) text-(--theme-success) px-3 py-1 text-xs font-bold">
                      <CheckCircle2 size={14} />
                      Registrado
                    </span>
                  </div>
                  <p className="text-sm text-(--theme-text) mt-2 font-medium">
                    Motivo: {r.reason}
                  </p>
                  {r.description && (
                    <p className="text-sm text-(--theme-text) opacity-70 mt-1">
                      {r.description}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-(--theme-text) opacity-60 mt-3">
                Registrado por: {r.registeredByName}
                {r.registeredAt &&
                  ` · ${r.registeredAt.toDate().toLocaleString("es-BO", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Modal: formulario de registro
// ---------------------------------------------------------------------------

function ReasonModal({
  order,
  sellerId,
  sellerName,
  onClose,
}: {
  order: OrderDoc;
  sellerId: string;
  sellerName: string;
  onClose: () => void;
}) {
  const [reason, setReason] = useState<ReturnReason | "">("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const needsDescription = reason === "Otro";

  async function handleSubmit() {
    if (!reason) {
      setError("Selecciona un motivo antes de guardar.");
      return;
    }
    if (needsDescription && description.trim().length === 0) {
      setError("Escribe una descripción para el motivo 'Otro'.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      await addDoc(collection(db, "deliveryFailures"), {
        orderId: order.id,
        sellerId,
        buyerId: order.buyerId ?? null,
        reason,
        description: needsDescription ? description.trim() : null,
        orderStatus: order.status,
        registeredBy: sellerId,
        registeredByName: sellerName,
        registeredAt: serverTimestamp(),
      });
      onClose();
    } catch (err) {
      console.error("Error al guardar el motivo:", err);
      setError("No se pudo guardar el motivo. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  // Cerrar con Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-(--theme-card-bg) border border-(--theme-border) p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-(--theme-text)">
              Registrar motivo de devolución
            </h3>
            <p className="text-sm text-(--theme-text) opacity-60">
              Pedido #{order.id.slice(0, 8)}
              {order.buyerName && ` - ${order.buyerName}`}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="shrink-0 text-(--theme-text) opacity-60 hover:opacity-100 transition p-2 rounded-full hover:bg-(--theme-secondary-bg)"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-6">
          <label className="text-sm font-bold text-(--theme-text) mb-3 block">
            Selecciona el motivo de la devolución
          </label>
          <fieldset className="space-y-3">
            {RETURN_REASONS.map((option) => (
              <label
                key={option}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                  reason === option
                    ? "border-primary bg-primary/5"
                    : "border-(--theme-border) hover:border-primary/30"
                }`}
              >
                <input
                  type="radio"
                  name="reason"
                  value={option}
                  checked={reason === option}
                  onChange={() => setReason(option)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-(--theme-text)">{option}</span>
              </label>
            ))}
          </fieldset>
        </div>

        {needsDescription && (
          <div className="mt-4">
            <label className="text-sm font-bold text-(--theme-text) mb-2 block">
              Descripción <span className="text-(--theme-error)">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe brevemente qué pasó con este pedido..."
              className="w-full rounded-xl border border-(--theme-border) bg-(--theme-secondary-bg) text-(--theme-text) p-3 outline-none focus:border-primary transition resize-none"
            />
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error) px-4 py-3 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-auto rounded-full px-4 py-2 text-sm font-bold text-(--theme-text) opacity-70 hover:opacity-100 transition disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-primary text-white px-5 py-2 text-sm font-bold hover:opacity-90 transition hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting && <Loader2 size={16} className="animate-spin" />}
            Guardar motivo
          </button>
        </div>
      </div>
    </div>
  );
}