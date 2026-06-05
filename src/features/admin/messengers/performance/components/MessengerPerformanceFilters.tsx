import type { MessengerOption } from '../types';

interface Props {
  messengers: MessengerOption[];
  selectedMessengerId: string;
  selectedDate: string;
  loading: boolean;
  loadingMessengers: boolean;
  onMessengerChange: (messengerId: string) => void;
  onDateChange: (date: string) => void;
  onGenerate: () => void;
}

export default function MessengerPerformanceFilters({
  messengers,
  selectedMessengerId,
  selectedDate,
  loading,
  loadingMessengers,
  onMessengerChange,
  onDateChange,
  onGenerate,
}: Props) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-[var(--theme-text)]/40 uppercase tracking-widest mb-3 pb-2 border-b border-[var(--theme-border)]">
        Seleccionar filtros
      </p>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
            Mensajero *
          </label>
          <select
            value={selectedMessengerId}
            onChange={(event) => onMessengerChange(event.target.value)}
            disabled={loadingMessengers}
            className="w-full bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--theme-text)] outline-none transition-colors focus:border-[#88B04B] disabled:opacity-60"
          >
            <option value="">
              {loadingMessengers ? 'Cargando mensajeros...' : 'Seleccionar mensajero'}
            </option>
            {messengers.map((messenger) => (
              <option key={messenger.id} value={messenger.id}>
                {messenger.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-[10px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
            Día *
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
            className="w-full bg-[var(--theme-secondary-bg)] border border-[var(--theme-border)] rounded-lg px-3 py-2.5 text-[13px] text-[var(--theme-text)] outline-none transition-colors focus:border-[#88B04B]"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={onGenerate}
            disabled={loading || loadingMessengers}
            className="w-full md:w-auto bg-[#88B04B] text-white text-[13px] font-semibold px-6 py-2.5 rounded-full hover:bg-[#5E7E2F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Consultando...' : 'Generar reporte'}
          </button>
        </div>
      </div>
    </div>
  );
}
