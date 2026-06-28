import type { MessengerPerformanceReport } from '../types';

const formatMinutes = (minutes: number): string =>
  minutes === 1 ? '1 min' : `${minutes} min`;

interface Props {
  report: MessengerPerformanceReport;
}

export default function MessengerPerformanceKpis({ report }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
      <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
        <p className="text-2xl font-semibold text-primary leading-none">
          {report.totalDeliveries}
        </p>
        <p className="text-xs text-(--theme-text)/40 mt-1.5 uppercase tracking-wide">
          Total de entregas finalizadas
        </p>
      </div>

      <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
        <p className="text-2xl font-semibold text-(--theme-text) leading-none">
          {formatMinutes(report.averageDeliveryTimeMinutes)}
        </p>
        <p className="text-xs text-(--theme-text)/40 mt-1.5 uppercase tracking-wide">
          Tiempo promedio de entrega
        </p>
      </div>

      <div className="bg-(--theme-secondary-bg) rounded-xl px-4 py-3">
        <p className="text-lg font-semibold text-primary leading-none truncate">
          {report.messengerName}
        </p>
        <p className="text-xs text-(--theme-text)/40 mt-1.5 uppercase tracking-wide">
          Mensajero seleccionado
        </p>
      </div>
    </div>
  );
}
