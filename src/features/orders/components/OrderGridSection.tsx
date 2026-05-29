import type { ReactNode } from "react";
import { Package } from "lucide-react";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";
import OrderGridHeader from "./OrderGridHeader";

interface OrderGridSectionProps {
  title: string;
  count: number;
  countLabel: string;
  loading: boolean;
  loadingMessage: string;
  ariaLabelledby: string;
  children: ReactNode;
  headerContent?: ReactNode;
}

export default function OrderGridSection({
  title,
  count,
  countLabel,
  loading,
  loadingMessage,
  ariaLabelledby,
  children,
  headerContent
}: OrderGridSectionProps) {
  return (
    <section
      aria-labelledby={ariaLabelledby}
      className="px-3 grid bg-bg-light
      grid-cols-[repeat(8,1fr)]
      min-[760px]:grid-cols-[repeat(16,1fr)]
      min-[960px]:grid-cols-[repeat(24,1fr)]
      font-['Inter',sans-serif]"
    >
      <h2 className="col-start-1 min-[960px]:col-start-3 col-span-full tracking-[-0.09em] text-[calc(4.48431vw+20.5112px)] leading-[100%]">
        {title}
      </h2>

      <div className={`col-span-full flex items-center justify-between min-[960px]:col-start-3 ${headerContent ? "mb-2" : "mb-12"} tracking-tight`}>
        <div className="flex items-center gap-2">
          <Package strokeWidth={1.5} size={18} />
          <span>{count} {countLabel}</span>
        </div>
      </div>

      {headerContent}

      {loading ? (
        <div className="col-span-full flex justify-center items-center h-80 gap-x-5">
          <GridSpinner />
          <LoadingMessage text={loadingMessage} />
        </div>
      ) : count === 0 ? (
        <div className="col-span-full h-80" />
      ) : (
        <div className="grid grid-cols-subgrid col-span-full min-[960px]:col-start-4 min-[960px]:col-end-22 min-[760px]:col-start-2 min-[760px]:col-end-16 mb-10">
          <OrderGridHeader />
          <ul className="col-span-full grid grid-cols-subgrid">
            {children}
          </ul>
        </div>
      )}
    </section>
  );
}
