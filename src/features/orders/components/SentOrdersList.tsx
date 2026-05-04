import { PLACEHOLDER_ORDERS } from "../placeholder-data";

export default function SentOrdersList() {
  return (
    <section className="grid grid-cols-[repeat(24,1fr)] p-3 bg-[#f5f8f4]" aria-labelledby="orders-title">
      <h2 id="orders-title" className="col-start-1 col-end-25 tracking-[-0.07em] text-[calc(4.48431vw+36.5112px)] mb-16 leading-[100%]">
        Pedidos enviados <sup className="top-[-1em] text-[0.4em] tracking-tight">({PLACEHOLDER_ORDERS.length})</sup>
      </h2>

      <div className="grid grid-cols-subgrid col-start-1 col-end-7">
        <div className="grid grid-cols-subgrid col-span-full border-b">
          <div className="col-start-1 col-end-4 gap-[4px] flex uppercase text-xs">
            <span>/</span>
            filter
          </div>
        </div>
      </div>

      <header className="col-start-8 col-end-25 grid grid-cols-subgrid border-b pb-1.5">
        <div className="uppercase col-start-1 col-end-3 text-xs flex gap-[4px]">
          <span>/</span>
          orden
        </div>
        <div className="uppercase col-start-3 col-end-15 text-xs flex gap-[4px]">
          <span>/</span>
          dirección
        </div>
        <div className="uppercase col-start-15 col-end-18 text-xs flex gap-[4px]">
          <span>/</span>
          estado
        </div>
      </header>

      <ul className="col-start-8 col-end-25 grid grid-cols-subgrid">
        {PLACEHOLDER_ORDERS.map((order) => (
          <li
            key={order.id}
            className="grid grid-cols-subgrid col-span-full border-b items-center"
          >
            <div className="col-start-1 col-end-3 text-sm flex items-center gap-[8px] text-xs">
              <div className="size-1.5 bg-[#1e1e1e]" />
              {order.id}
            </div>
            <div className="col-start-3 col-end-14 text-[calc(.78125vw+14.5px)] truncate">
              {order.delivery.destination}
            </div>
            <div
              className="col-start-15 col-end-18 text-sm flex items-center"
              aria-label={`Estado: ${order.status}`}
            >
              <div className="uppercase text-xs border border-[#1e1e1e44] p-[2px_5px_2.5px] border-dotted rounded flex items-center w-[13.5ch] justify-between">
                {order.status}
                <div
                  className={`size-2 rounded-full ${order.status === "entregado" ? "bg-[#008000]" : "bg-[#0000FF]"
                    }`}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
