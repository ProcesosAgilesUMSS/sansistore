interface Props {
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const ConfirmModal = ({
  onConfirm,
  onCancel,
  isLoading,
}: Props) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onCancel}
      />

      <div
        className="relative z-10 w-full max-w-md animate-in zoom-in-95 fade-in duration-200 rounded-3xl border border-(--theme-border) bg-(--theme-card-bg) p-6 shadow-2xl">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-(--theme-secondary-bg)">
          <svg
            className="h-7 w-7"
            style={{ color: 'var(--color-primary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V7a2 2 0 00-2-2h-3V3H9v2H6a2 2 0 00-2 2v6m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
            />
          </svg>
        </div>

        <h2
          id="confirm-title"
          className="text-lg font-800 tracking-tight text-(--theme-text)"
        >
          Marcar pedido como listo
        </h2>

        <p className="mt-2 text-sm leading-relaxed text-(--theme-text) opacity-70">
          Este pedido quedará disponible para asignación a un
          mensajero.
        </p>

        <div className="mt-5 rounded-xl border border-(--theme-border) px-4 py-3">
          <p className="text-xs leading-relaxed text-(--theme-text) opacity-60">
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-full border border-(--theme-border) px-4 py-3 text-sm font-600 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-40"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-full bg-primary px-4 py-3 text-sm font-700 text-white transition hover:opacity-90 active:scale-95 disabled:opacity-60"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="h-4 w-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />

                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8H4z"
                  />
                </svg>

                Procesando…
              </span>
            ) : (
              'Confirmar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
