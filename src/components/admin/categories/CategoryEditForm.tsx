import { useEffect, useState } from 'react';
import {
  getCategoryById,
  updateCategory,
  deleteCategory,
} from '../../../features/admin/services/categoryService';
import type { Category } from '../../../features/admin/types';

interface Props {
  categoryId: string;
}

export default function CategoryEditForm({ categoryId }: Props) {
  const [category, setCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    if (type === 'ok') setTimeout(() => setToast(null), 3000);
  };

  // Cargar la categoría desde Firestore al montar
  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const data = await getCategoryById(categoryId);
        if (!data) {
          window.location.href = '/admin/categories';
          return;
        }
        setCategory(data);
        setName(data.name);
        setDescription(data.description ?? '');
        setActive(data.active);
      } catch {
        showToast('err', 'Error al cargar la categoría.');
      } finally {
        setLoading(false);
      }
    };
    fetchCategory();
  }, [categoryId]);

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio.';
    else if (name.trim().length < 2) newErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSaving(true);
    setToast(null);

    try {
      await updateCategory(categoryId, { name, description, active });
      showToast('ok', 'Cambios guardados correctamente en Firestore.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los cambios.';
      if (msg.includes('nombre')) {
        setErrors({ name: msg });
      } else {
        showToast('err', msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCategory(categoryId);
      window.location.href = '/admin/categories';
    } catch {
      showToast('err', 'Error al eliminar la categoría.');
      setDeleting(false);
    }
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBF4]">
        <nav className="bg-[#0A0B0D] px-4 h-14 flex items-center gap-3">
          <span className="text-white/50 text-sm">← Categorías</span>
          <span className="text-white font-semibold text-sm">Editar categoría</span>
        </nav>
        <div className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-4">
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse w-1/2" />
          <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFBF4]">
      {/* Topbar */}
      <nav className="bg-[#0A0B0D] px-4 h-14 flex items-center gap-3">
        <a
          href="/admin/categories"
          className="text-white/50 text-sm hover:text-white transition-colors"
        >
          ← Categorías
        </a>
        <span className="text-white font-semibold text-sm">Editar categoría</span>
        <span className="ml-auto text-[11px] font-semibold text-[#88B04B] border border-[#88B04B] px-2 py-0.5 rounded-full">
          Área 7
        </span>
      </nav>

      {/* Edit header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[rgba(136,176,75,0.12)] flex items-center justify-center text-lg">
          🍽️
        </div>
        <div>
          <div className="text-[13px] font-semibold text-[#1A1A1A]">{category?.name}</div>
          <div className="text-[9px] font-mono text-gray-400">categoryId: {categoryId}</div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">

        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100 mb-4">
          Datos de la categoría
        </div>

        {/* Campo nombre */}
        <div className="mb-4">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Nombre *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({});
            }}
            className={`w-full bg-gray-50 border rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] outline-none transition-colors ${
              errors.name ? 'border-red-400' : 'border-gray-200 focus:border-[#88B04B]'
            }`}
          />
          {errors.name ? (
            <p className="text-[10px] text-red-600 mt-1">{errors.name}</p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1">
              Si cambia el nombre, se validará que no exista otro igual.
            </p>
          )}
        </div>

        {/* Campo descripción */}
        <div className="mb-4">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-[#88B04B] transition-colors resize-none"
          />
        </div>

        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100 mb-4">
          Estado
        </div>

        {/* Toggle estado */}
        <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 mb-6">
          <div>
            <p className="text-[12px] font-medium text-[#1A1A1A]">
              {active ? 'Categoría activa' : 'Categoría inactiva'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {active ? 'Visible en la tienda virtual' : 'No visible en la tienda virtual'}
            </p>
          </div>
          <button
            onClick={() => setActive(!active)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              active ? 'bg-[#88B04B]' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${
                active ? 'left-[18px]' : 'left-0.5'
              }`}
            />
          </button>
        </div>

        {/* Botones guardar/cancelar */}
        <div className="flex gap-3 mb-3">
          <a
            href="/admin/categories"
            className="flex-1 text-center text-[13px] text-gray-500 border border-gray-200 py-2.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </a>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-[#88B04B] text-white text-[13px] font-semibold py-2.5 rounded-full hover:bg-[#5E7E2F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>

        {/* Botón eliminar */}
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full text-[13px] text-red-600 border border-red-200 py-2.5 rounded-full hover:bg-red-50 transition-colors"
          >
            Eliminar categoría
          </button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-[12px] font-semibold text-red-700 mb-1">¿Confirmar eliminación?</p>
            <p className="text-[11px] text-red-500 mb-3">
              Esta acción no se puede deshacer. La categoría será eliminada de Firestore.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 text-[12px] text-gray-500 border border-gray-200 py-2 rounded-full hover:bg-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 text-[12px] font-semibold text-white bg-red-500 py-2 rounded-full hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
        {toast && (
          <div
            className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-[12px] font-medium ${
              toast.type === 'ok'
                ? 'bg-[rgba(136,176,75,0.12)] border border-[rgba(136,176,75,0.3)] text-[#5E7E2F]'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                toast.type === 'ok' ? 'bg-[#88B04B]' : 'bg-red-500'
              }`}
            >
              {toast.type === 'ok' ? '✓' : '!'}
            </span>
            {toast.msg}
          </div>
        )}
      </div>
    </div>
  );
}