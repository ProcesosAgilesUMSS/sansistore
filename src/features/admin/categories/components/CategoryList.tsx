import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getCategories,
  toggleCategoryStatus,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/categoryService';
import type { Category } from '../types';

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; category: Category };

export default function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: 'none' });
  const [formName, setFormName] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formErrors, setFormErrors] = useState<{ name?: string }>({});
  const [formLoading, setFormLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetched = useRef(false);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      setToast({ type: 'err', msg: 'Error al cargar las categorías.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void fetchCategories();
  }, []);

  const openCreate = () => {
    setFormName('');
    setFormActive(true);
    setFormErrors({});
    setShowDeleteConfirm(false);
    setModal({ type: 'create' });
  };

  const openEdit = (cat: Category) => {
    setFormName(cat.name);
    setFormActive(cat.active);
    setFormErrors({});
    setShowDeleteConfirm(false);
    setModal({ type: 'edit', category: cat });
  };

  const closeModal = () => {
    setModal({ type: 'none' });
    setFormErrors({});
    setShowDeleteConfirm(false);
  };

  const validate = () => {
    const errs: { name?: string } = {};
    if (!formName.trim()) errs.name = 'El nombre es obligatorio.';
    else if (formName.trim().length < 2) errs.name = 'Mínimo 2 caracteres.';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    setFormLoading(true);
    try {
      await createCategory({ name: formName, active: formActive });
      showToast('ok', `Categoría "${formName}" creada exitosamente.`);
      closeModal();
      await fetchCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear la categoría.';
      if (msg.includes('nombre')) setFormErrors({ name: msg });
      else showToast('err', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async () => {
    if (modal.type !== 'edit') return;
    if (!validate()) return;
    setFormLoading(true);
    try {
      await updateCategory(modal.category.categoryId, {
        name: formName,
        active: formActive,
      });
      showToast('ok', `Categoría "${formName}" actualizada correctamente.`);
      closeModal();
      await fetchCategories();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los cambios.';
      if (msg.includes('nombre')) setFormErrors({ name: msg });
      else showToast('err', msg);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (modal.type !== 'edit') return;
    setDeleting(true);
    try {
      await deleteCategory(modal.category.categoryId);
      showToast('ok', `Categoría "${modal.category.name}" eliminada.`);
      closeModal();
      await fetchCategories();
    } catch {
      showToast('err', 'Error al eliminar la categoría.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    setTogglingId(id);
    try {
      await toggleCategoryStatus(id, !currentActive);
      setCategories((prev) =>
        prev.map((cat) =>
          cat.categoryId === id ? { ...cat, active: !currentActive } : cat
        )
      );
      const cat = categories.find((c) => c.categoryId === id);
      if (cat) showToast('ok', `"${cat.name}" ${currentActive ? 'desactivada' : 'activada'}.`);
    } catch {
      showToast('err', 'Error al cambiar el estado.');
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const activeCount = categories.filter((c) => c.active).length;
  const isModalOpen = modal.type !== 'none';

  return (
    // ── bg-[var(--theme-bg)] reemplaza bg-[#FFFBF4]
    // El fondo de la página ahora responde al tema claro/oscuro
    <div className="min-h-screen bg-[var(--theme-bg)]">

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            {/* text-[var(--theme-text)] reemplaza text-[#1A1A1A] — texto principal */}
            <h1 className="text-[15px] font-semibold text-[var(--theme-text)]">Gestión de categorías</h1>
            {/* text-[var(--theme-text)]/60 = texto secundario al 60% de opacidad */}
            <p className="text-[11px] text-[var(--theme-text)]/60 mt-0.5">
              {loading ? 'Cargando...' : `${categories.length} categorías · ${activeCount} activas`}
            </p>
          </div>
          {/* El botón verde siempre verde — color de acción, no cambia con el tema */}
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-[#88B04B] text-white text-[12px] font-semibold px-4 py-2 rounded-full hover:bg-[#5E7E2F] transition-colors"
          >
            + Nueva categoría
          </button>
        </div>

        {/* Search — bg-[var(--theme-card-bg)] reemplaza bg-white */}
        <div className="flex items-center gap-2 bg-[var(--theme-card-bg)] border border-[var(--theme-border)] rounded-full px-3 py-2 mb-4">
          <svg className="w-4 h-4 text-[var(--theme-text)]/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-[13px] bg-transparent outline-none text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/40"
          />
        </div>

        {/* Loading skeleton — bg-[var(--theme-secondary-bg)] reemplaza bg-gray-100 */}
        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-[var(--theme-secondary-bg)] rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-2">
            {filtered.length === 0 && (
              <div className="text-center py-10 text-[13px] text-[var(--theme-text)]/50">
                {search ? 'No se encontraron categorías.' : 'No hay categorías registradas aún.'}
              </div>
            )}
            {filtered.map((cat) => (
              // bg-[var(--theme-card-bg)] reemplaza bg-white en cada fila
              <div
                key={cat.categoryId}
                className={`flex items-center gap-3 px-4 py-3 bg-[var(--theme-card-bg)] border rounded-xl transition-opacity ${
                  cat.active ? 'border-[var(--theme-border)]' : 'border-[var(--theme-border)] opacity-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--theme-text)]">{cat.name}</div>
                  <div className="text-[9px] text-[var(--theme-text)]/30 font-mono mt-0.5">{cat.categoryId}</div>
                </div>

                {/* Badge activa/inactiva — verde se mantiene igual */}
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                  cat.active
                    ? 'bg-[rgba(136,176,75,0.15)] text-[#5E7E2F]'
                    : 'bg-[var(--theme-secondary-bg)] text-[var(--theme-text)]/50'
                }`}>
                  {cat.active ? 'Activa' : 'Inactiva'}
                </span>

                {/* Toggle — el knob blanco se mantiene blanco siempre */}
                <button
                  onClick={() => handleToggle(cat.categoryId, cat.active)}
                  disabled={togglingId === cat.categoryId}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                    cat.active ? 'bg-[#88B04B]' : 'bg-[var(--theme-secondary-bg)]'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    cat.active ? 'left-[18px]' : 'left-0.5'
                  }`} />
                </button>

                <button
                  onClick={() => openEdit(cat)}
                  className="text-[11px] font-medium text-[#5E7E2F] bg-[rgba(136,176,75,0.12)] border border-[rgba(136,176,75,0.3)] px-2.5 py-1 rounded-md hover:bg-[rgba(136,176,75,0.2)] transition-colors whitespace-nowrap"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL ─────────────────────────────────────────────────
          El overlay siempre oscuro (bg-black/50) — es intencional para
          resaltar el modal sobre el contenido de fondo.
          El modal en sí usa bg-[var(--theme-card-bg)] para adaptarse al tema. */}
      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-[var(--theme-card-bg)] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">

            {/* Header del modal */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--theme-border)]">
              <div>
                <h2 className="text-[14px] font-semibold text-[var(--theme-text)]">
                  {modal.type === 'create' ? 'Nueva categoría' : 'Editar categoría'}
                </h2>
                {modal.type === 'edit' && (
                  <p className="text-[9px] font-mono text-[var(--theme-text)]/40 mt-0.5">{modal.category.categoryId}</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-full bg-[var(--theme-secondary-bg)] hover:opacity-80 flex items-center justify-center text-[var(--theme-text)]/60 transition-opacity text-[13px]"
              >
                ✕
              </button>
            </div>

            {/* Body del modal — formulario */}
            <div className="px-5 py-5 flex flex-col gap-4">

              {/* Campo nombre */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); if (formErrors.name) setFormErrors({}); }}
                  placeholder="Ej: Pizzas, Nacional, Sushi..."
                  className={`w-full bg-[var(--theme-secondary-bg)] border rounded-lg px-3 py-2.5 text-[13px] text-[var(--theme-text)] outline-none transition-colors placeholder:text-[var(--theme-text)]/40 ${
                    formErrors.name ? 'border-red-400' : 'border-[var(--theme-border)] focus:border-[#88B04B]'
                  }`}
                />
                {formErrors.name ? (
                  <p className="text-[10px] text-red-500 mt-1">{formErrors.name}</p>
                ) : (
                  <p className="text-[10px] text-[var(--theme-text)]/40 mt-1">Debe ser único en Firestore.</p>
                )}
              </div>

              {/* Campo estado */}
              <div>
                <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
                  Estado
                </label>
                <div className="flex items-center justify-between bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-3">
                  <div>
                    <p className="text-[12px] font-medium text-[var(--theme-text)]">
                      {formActive ? 'Activa' : 'Inactiva'}
                    </p>
                    <p className="text-[10px] text-[var(--theme-text)]/50 mt-0.5">
                      {formActive ? 'Visible en la tienda' : 'No visible en la tienda'}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormActive(!formActive)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      formActive ? 'bg-[#88B04B]' : 'bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)]'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                      formActive ? 'left-[18px]' : 'left-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer del modal — botones */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 text-[13px] text-[var(--theme-text)]/60 border border-[var(--theme-border)] py-2.5 rounded-full hover:bg-[var(--theme-secondary-bg)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={modal.type === 'create' ? handleCreate : handleEdit}
                  disabled={formLoading}
                  className="flex-1 bg-[#88B04B] text-white text-[13px] font-semibold py-2.5 rounded-full hover:bg-[#5E7E2F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formLoading
                    ? (modal.type === 'create' ? 'Creando...' : 'Guardando...')
                    : (modal.type === 'create' ? 'Crear categoría' : 'Guardar cambios')}
                </button>
              </div>

              {modal.type === 'edit' && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-[13px] text-red-500 border border-red-200/50 py-2.5 rounded-full hover:bg-red-500/10 transition-colors"
                >
                  Eliminar categoría
                </button>
              )}

              {modal.type === 'edit' && showDeleteConfirm && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
                  <p className="text-[11px] font-semibold text-red-500 mb-1">¿Confirmar eliminación?</p>
                  <p className="text-[10px] text-red-400/80 mb-3">Esta acción no se puede deshacer.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 text-[12px] text-[var(--theme-text)]/60 border border-[var(--theme-border)] py-1.5 rounded-full hover:bg-[var(--theme-secondary-bg)] transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 text-[12px] font-semibold text-white bg-red-500 py-1.5 rounded-full hover:bg-red-600 transition-colors disabled:opacity-60"
                    >
                      {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast — el verde/rojo no cambia con el tema porque son colores semánticos */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium shadow-lg z-50 ${
          toast.type === 'ok'
            ? 'bg-[rgba(136,176,75,0.15)] border border-[rgba(136,176,75,0.3)] text-[#5E7E2F]'
            : 'bg-red-500/10 border border-red-500/20 text-red-500'
        }`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
            toast.type === 'ok' ? 'bg-[#88B04B]' : 'bg-red-500'
          }`}>
            {toast.type === 'ok' ? '✓' : '!'}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}