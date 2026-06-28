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
    <div className="min-h-screen bg-(--theme-bg)">

      <div className="px-4 py-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h1 className="text-base font-semibold text-(--theme-text)">Gestión de categorías</h1>
            <p className="text-xs text-(--theme-text)/60 mt-0.5">
              {loading ? 'Cargando...' : `${categories.length} categorías · ${activeCount} activas`}
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 bg-primary text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-primary/90 transition-colors"
          >
            + Nueva categoría
          </button>
        </div>

        <div className="flex items-center gap-2 bg-(--theme-card-bg) border border-(--theme-border) rounded-full px-3 py-2 mb-4">
          <svg className="w-4 h-4 text-(--theme-text)/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar categoría..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-(--theme-text) placeholder:text-(--theme-text)/40"
          />
        </div>

        {loading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-(--theme-secondary-bg) rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && (
          <div className="flex flex-col gap-2">
            {filtered.length === 0 && (
              <div className="text-center py-10 text-sm text-(--theme-text)/50">
                {search ? 'No se encontraron categorías.' : 'No hay categorías registradas aún.'}
              </div>
            )}
            {filtered.map((cat) => (
              <div
                key={cat.categoryId}
                className={`flex items-center gap-3 px-4 py-3 bg-(--theme-card-bg) border rounded-xl transition-opacity ${
                  cat.active ? 'border-(--theme-border)' : 'border-(--theme-border) opacity-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-(--theme-text)">{cat.name}</div>
                  <div className="text-xs text-(--theme-text)/30 font-mono mt-0.5">{cat.categoryId}</div>
                </div>

                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  cat.active
                    ? 'bg-primary/15 text-primary'
                    : 'bg-(--theme-secondary-bg) text-(--theme-text)/50'
                }`}>
                  {cat.active ? 'Activa' : 'Inactiva'}
                </span>

                <button
                  onClick={() => handleToggle(cat.categoryId, cat.active)}
                  disabled={togglingId === cat.categoryId}
                  className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-50 ${
                    cat.active ? 'bg-primary' : 'bg-(--theme-secondary-bg)'
                  }`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-(--theme-card-bg) rounded-full shadow transition-all ${
                    cat.active ? 'left-[18px]' : 'left-0.5'
                  }`} />
                </button>

                <button
                  onClick={() => openEdit(cat)}
                  className="text-xs font-medium text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-md hover:bg-primary/20 transition-colors whitespace-nowrap"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="bg-(--theme-card-bg) rounded-2xl w-full max-w-md shadow-xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-(--theme-border)">
              <div>
                <h2 className="text-sm font-semibold text-(--theme-text)">
                  {modal.type === 'create' ? 'Nueva categoría' : 'Editar categoría'}
                </h2>
                {modal.type === 'edit' && (
                  <p className="text-xs font-mono text-(--theme-text)/40 mt-0.5">{modal.category.categoryId}</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="w-7 h-7 rounded-full bg-(--theme-secondary-bg) hover:opacity-80 flex items-center justify-center text-(--theme-text)/60 transition-opacity text-sm"
              >
                ✕
              </button>
            </div>

            {/* Body del modal — formulario */}
            <div className="px-5 py-5 flex flex-col gap-4">

              {/* Campo nombre */}
              <div>
                <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); if (formErrors.name) setFormErrors({}); }}
                  placeholder="Ej: Pizzas, Nacional, Sushi..."
                  className={`w-full bg-(--theme-secondary-bg) border rounded-lg px-3 py-2.5 text-sm text-(--theme-text) outline-none transition-colors placeholder:text-(--theme-text)/40 ${
                    formErrors.name ? 'border-(--theme-error-border)' : 'border-(--theme-border) focus:border-primary'
                  }`}
                />
                {formErrors.name ? (
                  <p className="text-xs text-(--theme-error) mt-1">{formErrors.name}</p>
                ) : (
                  <p className="text-xs text-(--theme-text)/40 mt-1">Debe ser único en Firestore.</p>
                )}
              </div>

              {/* Campo estado */}
              <div>
                <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
                  Estado
                </label>
                <div className="flex items-center justify-between bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-3">
                  <div>
                    <p className="text-xs font-medium text-(--theme-text)">
                      {formActive ? 'Activa' : 'Inactiva'}
                    </p>
                    <p className="text-xs text-(--theme-text)/50 mt-0.5">
                      {formActive ? 'Visible en la tienda' : 'No visible en la tienda'}
                    </p>
                  </div>
                  <button
                    onClick={() => setFormActive(!formActive)}
                    className={`relative w-9 h-5 rounded-full transition-colors ${
                      formActive ? 'bg-primary' : 'bg-(--theme-secondary-bg) border border-(--theme-border)'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 bg-(--theme-card-bg) rounded-full shadow transition-all ${
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
                  className="flex-1 text-sm text-(--theme-text)/60 border border-(--theme-border) py-2.5 rounded-full hover:bg-(--theme-secondary-bg) transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={modal.type === 'create' ? handleCreate : handleEdit}
                  disabled={formLoading}
                  className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {formLoading
                    ? (modal.type === 'create' ? 'Creando...' : 'Guardando...')
                    : (modal.type === 'create' ? 'Crear categoría' : 'Guardar cambios')}
                </button>
              </div>

              {modal.type === 'edit' && !showDeleteConfirm && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full text-sm text-(--theme-error) border border-(--theme-error-border) py-2.5 rounded-full hover:bg-(--theme-error)/10 transition-colors"
                >
                  Eliminar categoría
                </button>
              )}

              {modal.type === 'edit' && showDeleteConfirm && (
                <div className="bg-(--theme-error)/10 border border-(--theme-error-border) rounded-xl p-3">
                  <p className="text-xs font-semibold text-(--theme-error) mb-1">¿Confirmar eliminación?</p>
                  <p className="text-xs text-(--theme-error)/80 mb-3">Esta acción no se puede deshacer.</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="flex-1 text-xs text-(--theme-text)/60 border border-(--theme-border) py-1.5 rounded-full hover:bg-(--theme-secondary-bg) transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 text-xs font-semibold text-white bg-(--theme-error) py-1.5 rounded-full hover:bg-(--theme-error) transition-colors disabled:opacity-60"
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
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium shadow-lg z-50 ${
          toast.type === 'ok'
            ? 'bg-primary/15 border border-primary/30 text-primary'
            : 'bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error)'
        }`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
            toast.type === 'ok' ? 'bg-primary' : 'bg-(--theme-error)'
          }`}>
            {toast.type === 'ok' ? '✓' : '!'}
          </span>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
