import { MapPin, Phone, Package, Wallet, ChevronRight, ChevronLeft } from 'lucide-react';

export type PanelOrder = {
  customerName: string;
  phone: string;
  address: string;
  reference?: string;
  items: { name: string; quantity: number }[];
  cashToCollect: number;
};

type Props = {
  open: boolean;
  onToggle: () => void;
  order: PanelOrder | null;
};

export default function OrderPanel({ open, onToggle, order }: Props) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        className="absolute top-1/2 z-1000 flex h-10 w-10 items-center justify-center rounded-2xl border border-border-light bg-card-bg-light shadow-[0_4px_16px_rgba(38,33,22,0.14)] transition hover:border-primary hover:text-primary"
        style={{ right: open ? '358px' : '16px' }}
      >
        {open ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className={`absolute bottom-4 right-4 top-4 z-999 flex w-80 flex-col rounded-[28px] border border-border-light bg-card-bg-light shadow-[0_14px_30px_rgba(38,33,22,0.14)] transition-all duration-300 ${open ? 'translate-x-0 opacity-100' : 'translate-x-[110%] opacity-0 pointer-events-none'}`}>
        {order ? (
          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Pedido en camino
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.04em] text-text-light">
                  {order.customerName}
                </h2>
              </div>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                Bs {order.cashToCollect}
              </span>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-text-light opacity-50" />
                <div>
                  <p className="text-sm font-semibold text-text-light">{order.address}</p>
                  {order.reference && (
                    <p className="mt-0.5 text-xs font-medium text-text-light opacity-55">{order.reference}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 shrink-0 text-text-light opacity-50" />
                <p className="text-sm font-semibold text-text-light">{order.phone}</p>
              </div>

              <div className="flex items-start gap-3">
                <Package className="mt-0.5 h-4 w-4 shrink-0 text-text-light opacity-50" />
                <div className="space-y-1">
                  {order.items.map((item) => (
                    <p key={item.name} className="text-sm font-semibold text-text-light">
                      {item.name} <span className="opacity-55">x{item.quantity}</span>
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Wallet className="h-4 w-4 shrink-0 text-text-light opacity-50" />
                <p className="text-sm font-semibold text-text-light">
                  Cobro contra entrega —{' '}
                  <span className="font-black text-primary">Bs {order.cashToCollect}</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center px-5">
            <p className="text-sm font-semibold text-text-light opacity-50">Sin pedido asignado</p>
          </div>
        )}
      </div>
    </>
  );
}
