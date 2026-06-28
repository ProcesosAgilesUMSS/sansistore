interface DeleteModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteModal({ onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[2rem] border border-border-light bg-card-bg-light p-6 shadow-xl">
        <h3 className="text-lg font-bold text-text-light mb-2">Eliminar comentario</h3>
        <p className="text-sm text-text-light opacity-80 mb-6">¿Estás seguro de que deseas eliminar este comentario? Esta acción no se puede deshacer.</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full px-5 py-2.5 text-sm font-semibold text-text-light transition-colors hover:bg-secondary-bg-light"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-full bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-transform hover:opacity-90 active:scale-95"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
}
