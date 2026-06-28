import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings, updateSettings } from '../services/settingsService';

export default function ConfigPanel() {
  // ── Estado del formulario ──────────────────────────────────
  // currentValue: lo que está guardado en Firestore (se muestra como "valor actual")
  // inputValue: lo que el usuario está escribiendo en el campo
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasFetched = useRef(false);

  const showToast = (type: 'ok' | 'err', msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    if (type === 'ok') toastTimer.current = setTimeout(() => setToast(null), 3000);
  };

  // ── Cargar valor actual desde Firestore ────────────────────
  // Explicación: al montar el componente, leemos el documento settings/config
  // y precargamos el campo del formulario con ese valor
  const fetchSettings = useCallback(async () => {
    try {
      const data = await getSettings();
      setCurrentValue(data.reservationTimeLimit);
      setInputValue(String(data.reservationTimeLimit));
    } catch {
      showToast('err', 'Error al cargar la configuración.');
    } finally {
      setLoading(false);
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    void fetchSettings();
  }, []);

  // ── Validación del campo ───────────────────────────────────
  // Regla: debe ser un número entero positivo mayor a 0
  const validate = (): boolean => {
    const num = Number(inputValue);
    if (!inputValue.trim() || isNaN(num)) {
      setError('El valor debe ser un número entero.');
      return false;
    }
    if (!Number.isInteger(num) || num < 1) {
      setError('El valor debe ser un número entero positivo mayor a 0.');
      return false;
    }
    setError('');
    return true;
  };

  // ── Guardar en Firestore ───────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await updateSettings({ reservationTimeLimit: Number(inputValue) });
      setCurrentValue(Number(inputValue));
      showToast('ok', `Configuración guardada. Tiempo límite actualizado a ${inputValue} min.`);
    } catch {
      showToast('err', 'Error al guardar la configuración. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancelar — restaura el valor actual ───────────────────
  const handleCancel = () => {
    if (currentValue !== null) setInputValue(String(currentValue));
    setError('');
  };

  // ── Loading skeleton ───────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-lg flex flex-col gap-4">
        <div className="h-16 bg-(--theme-secondary-bg) rounded-xl animate-pulse" />
        <div className="h-10 bg-(--theme-secondary-bg) rounded-lg animate-pulse w-1/2" />
        <div className="h-20 bg-(--theme-secondary-bg) rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-lg">

      {/* ── Sección: título ─────────────────────────────────── */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-(--theme-text)">
          Parámetros del sistema
        </h2>
        <p className="text-xs text-(--theme-text)/50 mt-0.5">
          Configuración global que afecta el comportamiento del sistema
        </p>
      </div>

      {/* ── Separador de sección ────────────────────────────── */}
      <p className="text-xs font-semibold text-(--theme-text)/40 uppercase tracking-widest mb-3 pb-2 border-b border-(--theme-border)">
        Reservas
      </p>

      {/* ── Card: valor actual ──────────────────────────────── */}
      {/* Muestra lo que está guardado en Firestore actualmente */}
      <div className="flex items-center justify-between bg-(--theme-secondary-bg) border border-(--theme-border) rounded-xl px-4 py-3 mb-5">
        <div>
          <p className="text-2xl font-semibold text-primary leading-none">
            {currentValue} min
          </p>
          <p className="text-xs text-(--theme-text)/40 mt-1">
            Valor actual en Firestore (settings/config)
          </p>
        </div>
        {/* Ícono de reloj decorativo */}
        <svg className="w-9 h-9 text-(--theme-text)/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
          <path d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {/* ── Campo: nuevo valor ──────────────────────────────── */}
      {/* El usuario escribe aquí el nuevo tiempo límite */}
      <div className="mb-4">
        <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
          Nuevo tiempo límite (minutos) *
        </label>
        <input
          type="number"
          min="1"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (error) setError('');
          }}
          className={`bg-(--theme-secondary-bg) border rounded-lg px-3 py-2.5 text-sm text-(--theme-text) outline-none transition-colors w-[160px] ${
            error
              ? 'border-(--theme-error-border)'
              : 'border-(--theme-border) focus:border-primary'
          }`}
        />
        {error ? (
          <p className="text-xs text-(--theme-error) mt-1.5">{error}</p>
        ) : (
          <p className="text-xs text-(--theme-text)/40 mt-1.5">
            Mínimo 1 minuto.
          </p>
        )}
      </div>

      {/* ── Info box ────────────────────────────────────────── */}
      {/* Explica al usuario cómo funciona la Cloud Function */}
      <div className="flex items-start gap-2.5 bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-3 mb-5">
        <svg className="w-4 h-4 text-(--theme-text)/30 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
          <path d="M12 16v-4M12 8h.01" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <p className="text-xs text-(--theme-text)/50 leading-relaxed">
          El sistema verifica automáticamente cada 5 minutos los pedidos en estado
          <span className="font-mono text-xs bg-(--theme-border) px-1 py-0.5 rounded mx-1">RESERVADO</span>
          y libera el stock si superan el tiempo límite. El nuevo valor aplica en la próxima ejecución.
        </p>
      </div>

      {/* ── Botones ─────────────────────────────────────────── */}
      <div className="flex gap-3">
        <button
          onClick={handleCancel}
          className="flex-1 text-sm text-(--theme-text)/60 border border-(--theme-border) py-2.5 rounded-full hover:bg-(--theme-secondary-bg) transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 bg-primary text-white text-sm font-semibold py-2.5 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>

      {/* ── Toast ───────────────────────────────────────────── */}
      {toast && (
        <div className={`mt-4 flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium ${
          toast.type === 'ok'
            ? 'bg-(--theme-success-bg) border border-(--theme-success-border) text-(--theme-success)'
            : 'bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error)'
        }`}>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
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