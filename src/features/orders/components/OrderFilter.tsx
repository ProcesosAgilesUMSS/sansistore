import { ChevronRight } from "lucide-react";
import type { OrderStatus } from "../types";
import { STATUS_LABELS, AVAILABLE_STATUSES } from "../types";
import { CheckBox, OpenFolderIcon, ClosedFolderIcon } from "./Icons";

interface OrderFilterProps {
  selectedStatuses: OrderStatus[];
  toggleStatus: (status: OrderStatus) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}
export default function OrderFilter({
  selectedStatuses,
  toggleStatus,
  showFilters,
  setShowFilters,
}: OrderFilterProps) {
  return (
    <div className="self-start grid grid-cols-subgrid gap-y-[4px] mb-[32px] col-span-full min-[960px]:col-start-1 min-[960px]:col-end-7 min-[960px]:gap-y-[8px] min-[960px]:mb-0 min-[960px]:sticky min-[960px]:top-8">
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
              const highlightClass = status === 'in_transit' ? "bg-blue-300/50" : "bg-green-300/50";

              return (
                <li key={status}>
                  <button
                    onClick={() => toggleStatus(status)}
                    className={`flex gap-[8px] items-center cursor-pointer hover:text-[#1e1e1e] ${isSelected ? "text-[#1e1e1e]" : "text-[#1e1e1e44]"}`}
                  >
                    <CheckBox checked={isSelected} />
                    <span className={`text-sm capitalize leading-[110%] ${isSelected ? highlightClass : "bg-transparent"}`}>
                      {STATUS_LABELS[status]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
