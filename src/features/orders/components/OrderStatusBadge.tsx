import { FileLock, Package, PackageCheck, PackageOpen } from "lucide-react";
import LoadingMessage from "./LoadingMessage";
import type { OrderStatus } from "../types";

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === "CREADO") {
    return (
      <div className="flex items-center gap-2 border border-black/10 px-2 py-0.5 rounded text-xs font-medium">
        {status}
        <div className="size-1.5 bg-[#FFA500] rounded-full" />
      </div>
    );
  }

  if (status === "RESERVADO") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <FileLock size={16} color="gray" />
        {status}
      </div>
    );
  }

  if (status === "EMPAQUETADO") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <Package size={18} color="#845C11" />
        {status}
      </div>
    );
  }

  if (status === "PENDIENTE") {
    return (
      <div className="flex items-center gap-2 text-xs">
        {/*<GridSpinner size={4} />*/}
        <PackageOpen size={19} color="#A8822D" />
        <LoadingMessage text="EMPACANDO" />
      </div>
    );
  }

  if (status === "LISTO") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <PackageCheck size={19} color="#059669" />
        {status}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-black/10 px-2 py-0.5 rounded text-xs uppercase">
      {status}
    </div>
  );
}
