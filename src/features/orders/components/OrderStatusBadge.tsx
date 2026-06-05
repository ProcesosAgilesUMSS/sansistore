import { Package, PackageCheck, PackageOpen, PackageX, type LucideIcon } from "lucide-react";
import type { OrderStatus } from "../types";

type StatusConfig = {
  icon: LucideIcon;
  color: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig | null> = {
  CREADO: { icon: Package, color: "#916B26" },
  RESERVADO: { icon: Package, color: "#A67C32" },
  PENDIENTE: { icon: PackageOpen, color: "#BC8F3A" },
  EMPAQUETADO: { icon: Package, color: "#C69C4A" },
  LISTO: { icon: PackageCheck, color: "#D1AD5A" },
  ASIGNADO: { icon: Package, color: "#DBBA6A" },
  ACEPTADO: { icon: Package, color: "#DDBC72" },
  "EN CAMINO": { icon: Package, color: "#E0C87A" },
  ENTREGADO: { icon: Package, color: "#8CB87A" },
  PAGADO: { icon: Package, color: "#6DA66D" },
  CANCELADO: { icon: Package, color: "#C2745A" },
  "PENDIENTE REASIGNACION": { icon: PackageX, color: "#D07A60" },
  "NO ENTREGADO": { icon: Package, color: "#C2856B" },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];

  const state = status === "PENDIENTE REASIGNACION" ? "RECHAZADO" : status;

  if (!config) {
    return null;
  }

  const Icon = config.icon;

  return (
    <>
      <Icon size={18} color={config.color} />
      {state}
    </>
  );
}
