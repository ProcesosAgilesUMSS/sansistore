import { AlertTriangle, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { Messenger } from "../types";

interface Props {
  messenger: Messenger;
  isLoading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const BusyMessengerWarinigModal = ({ messenger, isLoading, onConfirm, onCancel }: Props) => {
  return createPortal(
    (
      <div
        className="fixed inset-0 z-999 flex items-start justify-center overflow-y-auto bg-black/75 p-2 backdrop-blur-md sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="busy-warning-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) onCancel();
        }}
      >
        <section className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-sm overflow-y-auto rounded-[24px] border border-(--theme-border) bg-(--theme-card-bg) p-4 shadow-2xl sm:my-auto sm:max-h-[calc(100dvh-2rem)] sm:rounded-[28px] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="text-amber-600 dark:text-amber-400" size={22} />
            </div>
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-full text-(--theme-text) opacity-50 transition hover:opacity-100"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          <h2
            id="busy-warning-title"
            className="mt-4 text-lg font-800 text-(--theme-text)"
            style={{ fontFamily: 'Outfit, sans-serif' }}
          >
            {messenger.displayName} está ocupado
          </h2>


          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 rounded-full border border-(--theme-border) px-4 py-2.5 text-sm font-700 text-(--theme-text) transition hover:bg-(--theme-secondary-bg) disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 rounded-full bg-amber-500 px-4 py-2.5 text-sm font-700 text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {isLoading ? 'Asignando…' : 'Asignar de todas formas'}
            </button>
          </div>
        </section>
      </div>
    ),
    document.body,
  );
}
