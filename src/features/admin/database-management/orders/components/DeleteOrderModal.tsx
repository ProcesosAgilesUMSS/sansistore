interface DeleteOrderModalProps {
  orderName: string;
  orderId: string;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteOrderModal({
  orderName,
  orderId,
  deleting,
  onConfirm,
  onClose,
}: DeleteOrderModalProps) {
  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      {/* Modal */}
      <div className="bg-(--theme-card-bg) border border-(--theme-border) rounded-2xl w-full max-w-md shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--theme-border)">
          <h2 className="text-base font-bold text-red-600">
            ¿Eliminar esta orden?
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="text-(--theme-text)/40 hover:text-(--theme-text) transition-colors text-xl leading-none disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-4">
          {/* Advertencia */}
          <div className="flex gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <span className="text-red-500 text-xl leading-none mt-0.5">⚠️</span>
            <p className="text-sm text-red-700 leading-relaxed">
              Esta acción es{" "}
              <span className="font-bold">irreversible</span>. La orden de{" "}
              <span className="font-bold">{orderName}</span> será eliminada
              permanentemente de Firestore.
            </p>
          </div>

          {/* ID de la orden */}
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold uppercase tracking-wide text-(--theme-text)/40">
              Order ID
            </span>
            <span className="text-xs font-mono text-(--theme-text)/60 break-all">
              {orderId}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 py-4 border-t border-(--theme-border)">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-(--theme-border) text-sm text-(--theme-text)/60 hover:text-(--theme-text) hover:bg-(--theme-text)/5 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {deleting ? "Eliminando…" : "Sí, eliminar orden"}
          </button>
        </div>
      </div>
    </div>
  );
}