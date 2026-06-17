import { AlertTriangle, X } from 'lucide-react';

interface AcceptBlockedModalProps {
  onClose: () => void;
}

export default function AcceptBlockedModal({ onClose }: AcceptBlockedModalProps) {
  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="accept-blocked-title"
    >
      <section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-border-light bg-card-bg-light text-text-light shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border-light px-6 py-5">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-600">
              <AlertTriangle size={24} />
            </span>
            <div>
              <h2 className="text-xl font-black tracking-normal" id="accept-blocked-title">
                No puedes aceptar este pedido
              </h2>
              <p className="text-sm font-medium opacity-70">
                Tienes una entrega activa en curso.
              </p>
            </div>
          </div>

          <button
            aria-label="Cerrar"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light bg-secondary-bg-light transition hover:text-primary"
            onClick={onClose}
            type="button"
          >
            <X size={16} />
          </button>
        </header>

        <div className="px-6 py-6">
          <div className="flex gap-3 rounded-2xl border border-border-light bg-secondary-bg-light/60 p-4 text-sm font-semibold">
            <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={18} />
            <p>
              Ya tienes una entrega activa (aceptada o en camino). Termínala antes de aceptar otro
              pedido.
            </p>
          </div>
        </div>

        <footer className="border-t border-border-light bg-secondary-bg-light/50 px-6 py-5">
          <button
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-border-light bg-card-bg-light text-sm font-black uppercase"
            onClick={onClose}
            type="button"
          >
            Entendido
          </button>
        </footer>
      </section>
    </div>
  );
}
