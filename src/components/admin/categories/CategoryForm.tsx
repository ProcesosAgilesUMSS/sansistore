import { useState } from 'react';
import { createCategory } from '../../../features/admin/services/categoryService';

export default function CategoryForm() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    setToast({ type, msg });
    if (type === 'ok') setTimeout(() => setToast(null), 3000);
  };

  const validate = () => {
    const newErrors: { name?: string } = {};
    if (!name.trim()) newErrors.name = 'El nombre es obligatorio.';
    else if (name.trim().length < 2) newErrors.name = 'El nombre debe tener al menos 2 caracteres.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setToast(null);

    try {
      await createCategory({ name, description });
      showToast('ok', `Categoría "${name}" creada exitosamente.`);
      setName('');
      setDescription('');
      setActive(true);
      setErrors({});
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al crear la categoría.';
      if (msg.includes('nombre')) {
        setErrors({ name: msg });
      } else {
        showToast('err', msg);
      }
    } finally {
      setLoading(false);
    }
  };

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
        <span className="text-white font-semibold text-sm">Nueva categoría</span>
        <span className="ml-auto text-[11px] font-semibold text-[#88B04B] border border-[#88B04B] px-2 py-0.5 rounded-full">
          Área 7
        </span>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-[15px] font-semibold text-[#1A1A1A] mb-5">Nueva categoría</h1>

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
            placeholder="Ej: Pizzas, Nacional, Sushi..."
            className={`w-full bg-gray-50 border rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] outline-none transition-colors placeholder-gray-400 ${
              errors.name ? 'border-red-400' : 'border-gray-200 focus:border-[#88B04B]'
            }`}
          />
          {errors.name ? (
            <p className="text-[10px] text-red-600 mt-1">{errors.name}</p>
          ) : (
            <p className="text-[10px] text-gray-400 mt-1">
              Debe ser único. Se validará en Firestore antes de guardar.
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
            placeholder="Describe brevemente esta categoría..."
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[13px] text-[#1A1A1A] outline-none focus:border-[#88B04B] transition-colors placeholder-gray-400 resize-none"
          />
        </div>

        {/* Estado inicial */}
        <div className="mb-6">
          <label className="block text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Estado inicial
          </label>
          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-3">
            <div>
              <p className="text-[12px] font-medium text-[#1A1A1A]">
                {active ? 'Activa' : 'Inactiva'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {active
                  ? 'Aparecerá visible en la tienda al crearse'
                  : 'No será visible en la tienda al crearse'}
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
        </div>

        {/* Botones */}
        <div className="flex gap-3">
          <a
            href="/admin/categories"
            className="flex-1 text-center text-[13px] text-gray-500 border border-gray-200 py-2.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </a>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 bg-[#88B04B] text-white text-[13px] font-semibold py-2.5 rounded-full hover:bg-[#5E7E2F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Creando...' : 'Crear categoría'}
          </button>
        </div>

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