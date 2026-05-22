export default function OrderHeader() {
  return (
    <header className="hidden grid-cols-subgrid border-b min-[760px]:grid min-[760px]:col-span-full min-[760px]:pb-1.5">
      <div className="uppercase col-start-1 col-end-3 text-xs flex gap-[4px]">
        <span>/</span>
        orden
      </div>
      <div className="uppercase col-start-3 col-end-15 text-xs flex gap-[4px]">
        <span>/</span>
        dirección
      </div>
      <div className="col-start-15 col-end-19  uppercase min-[960px]:col-start-16 min-[960px]:col-end-19 text-xs flex gap-[4px]">
        <span>/</span>
        estado
      </div>
    </header>
  );
}

// min-[760px]
// min-[960px]
