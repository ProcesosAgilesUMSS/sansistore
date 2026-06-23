import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export function LoginModal({ onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border-light bg-card-bg-light p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
              <polyline points="10 17 15 12 10 7" />
              <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
          </div>
          <h2 id="login-title" className="text-lg font-bold text-text-light">
            Iniciar sesión
          </h2>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-text-light opacity-70">
          Debes iniciar sesión para confirmar tu pedido.
        </p>

        <div className="mt-6">
          <a
            href="/iniciar-sesion"
            className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Ir a iniciar sesión
          </a>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-light text-text-light opacity-70 transition hover:opacity-100"
          aria-label="Cerrar modal"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
