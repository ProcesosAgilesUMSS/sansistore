import type { ReactNode } from "react";
import GridSpinner from "./GridSpinner";
import LoadingMessage from "./LoadingMessage";
import OrderGridHeader from "./OrderGridHeader";

interface OrderGridSectionProps {
  title: string;
  loading: boolean;
  loadingMessage: string;
  ariaLabelledby: string;
  children: ReactNode;
  headerContent?: ReactNode;
}

export default function OrderGridSection({
  title,
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

      {headerContent}

      {loading ? (
        <div className="col-span-full flex justify-center items-center h-80 gap-x-5">
          <GridSpinner />
          <LoadingMessage text={loadingMessage} />
        </div>
      ) : (
        <div className="grid grid-cols-subgrid col-span-full min-[960px]:col-start-4 min-[960px]:col-end-22 min-[760px]:col-start-2 min-[760px]:col-end-16 my-10">
          <OrderGridHeader />
          <ul className="col-span-full grid grid-cols-subgrid">
            {children}
          </ul>
        </div>
      )}
    </section>
  );
}
