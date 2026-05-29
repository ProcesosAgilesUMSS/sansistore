export default function OrderGridHeader() {
  return (
    <header className="hidden grid-cols-subgrid border-b min-[760px]:grid min-[760px]:col-span-full min-[760px]:pb-1.5 border-black/20">
      <div className="uppercase col-start-1 col-end-3 text-xs flex gap-[4px]">
        <span>/</span>
        orden
      </div>
      <div className="uppercase col-start-3 col-end-8 text-xs flex gap-[4px]">
        <span>/</span>
        dirección
      </div>
      <div className="col-start-11 col-end-12 uppercase min-[960px]:col-start-14 min-[960px]:col-end-14 text-xs flex gap-[4px]">
        <span>/</span>
        estado
      </div>
      <div className="min-[760px]:col-start-14  min-[960px]:col-start-18 uppercase text-xs flex gap-[4px]">
        <span>/</span>
        acción
      </div>
    </header>
  );
}
