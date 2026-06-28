// PaymentAuditPanel.tsx - HU #145: Auditoria de cobros

import { useEffect, useMemo, useState } from 'react';
import {
  escucharEncargadosCobros,
  escucharHistorialCobros,
} from '../services/paymentAuditService';
import type {
  PaymentAuditFilter,
  PaymentAuditLog,
  PaymentMethod,
  PaymentStatus,
} from '../types_payment_audit';
import { PAYMENT_METHOD_LABELS } from '../types_payment_audit';

const formatDateTime = (date: Date): string =>
  date.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const formatCurrency = (amount: number): string =>
  `Bs. ${amount.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const parseLocalDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const toInputDate = (date: Date) => date.toISOString().split('T')[0];

const METHOD_STYLES: Record<PaymentMethod, string> = {
  EFECTIVO: 'bg-primary/15 text-primary',
  QR: 'bg-(--theme-info-bg) text-(--theme-info)',
  TRANSFERENCIA: 'bg-(--theme-info-bg) text-(--theme-info)',
  TARJETA: 'bg-(--theme-warning-bg) text-(--theme-warning)',
};

const STATUS_STYLES: Record<PaymentStatus, string> = {
  VERIFICADO: 'bg-(--theme-success-bg) text-(--theme-success)',
  PENDIENTE: 'bg-(--theme-warning-bg) text-(--theme-warning)',
  RECHAZADO: 'bg-(--theme-error)/10 text-(--theme-error)',
};

const MethodBadge = ({ method }: { method: PaymentMethod }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${METHOD_STYLES[method]}`}>
    {PAYMENT_METHOD_LABELS[method]?.toUpperCase() ?? method}
  </span>
);

const StatusBadge = ({ status }: { status: PaymentStatus }) => (
  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
    {status}
  </span>
);

export default function PaymentAuditPanel() {
  const today = useMemo(() => new Date(), []);
  const firstDay = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );

  const [logs, setLogs] = useState<PaymentAuditLog[]>([]);
  const [collectors, setCollectors] = useState<{ id: string; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orderSearch, setOrderSearch] = useState('');
  const [startDate, setStartDate] = useState(toInputDate(firstDay));
  const [endDate, setEndDate] = useState(toInputDate(today));
  const [collectorFilter, setCollectorFilter] = useState('todos');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [appliedFilter, setAppliedFilter] = useState<PaymentAuditFilter>({
    startDate: firstDay,
    endDate: today,
    collectedById: 'todos',
    paymentMethod: 'ALL',
  });

  useEffect(() => {
    const unsubscribe = escucharEncargadosCobros(
      setCollectors,
      (err) => {
        console.error('Error al escuchar encargados de cobros:', err);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = escucharHistorialCobros(
      appliedFilter,
      (nextLogs) => {
        setLogs(nextLogs);
        setLoading(false);
      },
      (err) => {
        console.error('Error al escuchar auditoria de cobros:', err);
        setLogs([]);
        setError('Error al cargar el historial de cobros. Verifica tu conexión.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [appliedFilter]);

  const handleFilter = () => {
    setLoading(true);
    setError('');
    setAppliedFilter({
      orderId: orderSearch.trim() || undefined,
      startDate: startDate ? parseLocalDate(startDate) : undefined,
      endDate: endDate ? parseLocalDate(endDate) : undefined,
      collectedById: collectorFilter,
      paymentMethod: methodFilter,
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-base font-semibold text-(--theme-text)">
          Historial de cobros
        </h2>
        <p className="text-xs text-(--theme-text)/50 mt-0.5">
          Registro de pagos confirmados por vendedores y mensajeros
        </p>
      </div>

      <p className="text-xs font-semibold text-(--theme-text)/40 uppercase tracking-widest mb-3 pb-2 border-b border-(--theme-border)">
        Filtros
      </p>

      <div className="flex flex-wrap gap-3 mb-5">
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Buscar pedido
          </label>
          <input
            type="text"
            placeholder="ID del pedido..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary w-[130px] placeholder:text-(--theme-text)/30"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Fecha inicio
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Fecha fin
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Encargado
          </label>
          <select
            value={collectorFilter}
            onChange={(e) => setCollectorFilter(e.target.value)}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
          >
            <option value="todos">Todos</option>
            {collectors.map((collector) => (
              <option key={collector.id} value={collector.id}>
                {collector.name} ({collector.role})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-(--theme-text)/50 uppercase tracking-wide mb-1.5">
            Método de pago
          </label>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'ALL')}
            className="bg-(--theme-secondary-bg) border border-(--theme-border) rounded-lg px-3 py-2 text-sm text-(--theme-text) outline-none focus:border-primary"
          >
            <option value="ALL">Todos</option>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((key) => (
              <option key={key} value={key}>
                {PAYMENT_METHOD_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={handleFilter}
            disabled={loading}
            className="bg-primary text-white text-sm font-semibold px-5 py-2 rounded-full hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {loading ? 'Cargando...' : 'Filtrar'}
          </button>
          <button
            onClick={handleFilter}
            disabled={loading}
            title="Actualizar registros"
            className="border border-(--theme-border) text-(--theme-text)/60 text-sm font-semibold px-3 py-2 rounded-full hover:border-primary hover:text-primary transition-colors disabled:opacity-60"
          >
            Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium bg-(--theme-error-bg) border border-(--theme-error-border) text-(--theme-error) mb-4">
          <span className="w-5 h-5 rounded-full bg-(--theme-error) flex items-center justify-center text-white text-xs font-bold">
            !
          </span>
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="h-12 bg-(--theme-secondary-bg) rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <>
          <p className="text-xs font-semibold text-(--theme-text)/40 uppercase tracking-widest mb-3 pb-2 border-b border-(--theme-border)">
            Registros ({logs.length})
          </p>

          {logs.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-(--theme-border) rounded-xl">
              <p className="text-sm text-(--theme-text)/40">
                No se encontraron cobros con los filtros seleccionados.
              </p>
            </div>
          ) : (
            <div className="border border-(--theme-border) rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-(--theme-secondary-bg)">
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Pedido</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Encargado</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Monto</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Método</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Estado</th>
                      <th className="text-left text-xs font-semibold text-(--theme-text)/40 uppercase tracking-wide px-4 py-2.5">Fecha y hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr
                        key={log.logId}
                        className={index % 2 === 0 ? 'bg-(--theme-card-bg)' : 'bg-(--theme-secondary-bg)/50'}
                      >
                        <td className="px-4 py-2.5 font-mono text-xs font-medium text-(--theme-text)">
                          {log.orderId}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-xs font-medium text-(--theme-text)">
                            {log.collectedByName}
                          </div>
                          <div className="text-xs text-(--theme-text)/40">
                            {log.collectedByEmail}
                          </div>
                          <div className="text-xs text-(--theme-text)/30 uppercase tracking-wide">
                            {log.collectedByRole}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs font-medium text-(--theme-text)">
                          {formatCurrency(log.amount)}
                        </td>
                        <td className="px-4 py-2.5">
                          <MethodBadge method={log.paymentMethod} />
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={log.status} />
                        </td>
                        <td className="px-4 py-2.5 text-xs text-(--theme-text)/70">
                          {formatDateTime(log.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
