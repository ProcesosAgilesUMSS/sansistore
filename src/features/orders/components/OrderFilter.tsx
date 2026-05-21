import { ChevronUp } from "lucide-react";
import type { OrderStatus } from "../types";
import { STATUS_LABELS, AVAILABLE_STATUSES } from "../types";
import { CheckBox, OpenFolderIcon, ClosedFolderIcon } from "./Icons";

interface OrderFilterProps {
  selectedStatuses: OrderStatus[];
  toggleStatus: (status: OrderStatus) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  availableStatuses?: OrderStatus[];
}

//[todo]: clamp ul when min-[760px] font size

export default function OrderFilter({
  selectedStatuses,
  toggleStatus,
  showFilters,
  setShowFilters,
  availableStatuses = AVAILABLE_STATUSES,
}: OrderFilterProps) {
  return (
    <div className="grid grid-cols-subgrid mb-[32px] col-start-1 col-end-9 border-y border-dotted border-black/53 py-1 min-[960px]:col-start-2 min-[960px]:col-end-11">
      <div className="col-start-1 col-end-2 border-dotted border-black-53 min-[760px]:col-end-3 min-[960px]:col-end-4">
        <button
          className="text-[#1e1e1e] flex cursor-pointer gap-[8px] items-center"
          onClick={() => setShowFilters(!showFilters)}
        >
          <ChevronUp className={`size-3.5  ${showFilters ? "rotate-90" : ""}`} />
          {showFilters ? <ClosedFolderIcon /> : <OpenFolderIcon />}
          <span className="text-sm">Estado</span>
        </button>
      </div>

      {showFilters && (
        <ul className="col-start-2 col-end-9 flex gap-x-6 items-center ml-4 min-[760px]:col-start-3 min-[960px]:col-start-4 min-[960px]:col-end-10">
          {availableStatuses.map((status) => {
            const isSelected = selectedStatuses.includes(status);
            const highlightClass = 
              status === 'in_transit' ? "bg-blue-300/50" : 
              status === 'delivered' ? "bg-green-300/50" :
              status === 'CREADO' ? "bg-orange-300/50" :
              "bg-black/5";

            return (
              <li key={status}>
                <button
                  onClick={() => toggleStatus(status)}
                  className={`flex gap-[8px] items-center cursor-pointer hover:text-[#1e1e1e] ${isSelected ? "text-[#1e1e1e]" : "text-[#1e1e1e44]"}`}
                >
                  <CheckBox checked={isSelected} />
                  <span className={`text-sm uppercase leading-[110%] ${isSelected ? highlightClass : "bg-transparent"}`}>
                    {STATUS_LABELS[status]}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// m-[10px_0_0_7px] pl-[15px] flex gap-[8px] flex
