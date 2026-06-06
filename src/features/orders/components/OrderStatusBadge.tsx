import { Package, PackageCheck, PackageMinus, PackageOpen, PackageX, type LucideIcon } from "lucide-react";
import type { OrderStatus } from "../types";

type StatusConfig = {
  icon: LucideIcon;
  color: string;
};

const STATUS_CONFIG: Record<OrderStatus, StatusConfig | null> = {
  // --- Secuencia Dorados / Ocres ---
  CREADO: { icon: Package, color: "#70511B" }, // Antes: #916B26
  RESERVADO: { icon: Package, color: "#70511B" }, // Antes: #A67C32
  PENDIENTE: { icon: PackageOpen, color: "#70511B" }, // Antes: #BC8F3A
  EMPAQUETADO: { icon: Package, color: "#70511B" }, // Antes: #C69C4A
  LISTO: { icon: PackageCheck, color: "#70511B" }, // Antes: #D1AD5A
  ASIGNADO: { icon: Package, color: "#70511B" }, // Antes: #DBBA6A
  ACEPTADO: { icon: Package, color: "#70511B" }, // Antes: #DDBC72
  "EN CAMINO": { icon: Package, color: "#70511B" }, // Antes: #E0C87A

  // --- Secuencia Verdes ---
  ENTREGADO: { icon: Package, color: "#6E965D" }, // Antes: #8CB87A
  PAGADO: { icon: Package, color: "#548554" }, // Antes: #6DA66D

  // --- Secuencia Rojos / Óxidos ---
  CANCELADO: { icon: PackageX, color: "#A15A42" }, // Antes: #C2745A
  "PENDIENTE REASIGNACION": { icon: PackageX, color: "#AD614B" }, // Antes: #D07A60
  "NO ENTREGADO": { icon: PackageX, color: "#A36B54" }, // Antes: #C2856B
  DEVUELTO: { icon: PackageMinus, color: "#B56200" }  // Antes: #D97706
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  const state = status === "PENDIENTE REASIGNACION" ? "RECHAZADO" : status;

  if (!config) return null;

  const Icon = config.icon;

  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon size={20} color={config.color} />
      <span>{state}</span>
    </span>
  );
}
