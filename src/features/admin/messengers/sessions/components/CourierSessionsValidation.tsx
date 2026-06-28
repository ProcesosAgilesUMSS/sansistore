// src/features/admin/messengers/sessions/components/CourierSessionsValidation.tsx

import { useState } from 'react';
import {
  Loader2, AlertCircle, CheckCircle2, XCircle,
  ClipboardList, RefreshCw, ChevronDown,
} from 'lucide-react';
import { useSessions } from '../useSessions';
import type { ShiftClosure } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDateKey(dateKey: string): string {
  if (!dateKey) return '—';
  const [year, month, day] = dateKey.split('-').map(Number);
  if (!year || !month || !day) return dateKey;
  return new Intl.DateTimeFormat('es-BO', { dateStyle: 'medium' })
    .format(new Date(year, month - 1, day));
}

function fmtTime(iso?: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('es-BO', {
    hour: '2-digit', minute: '2-digit',
  });
}

function formatMoney(n: number): string {
  return `Bs. ${n.toFixed(2)}`;
}

function differenceTone(totalCollected: number, expectedAmount: number) {
  const diff = Number((totalCollected - expectedAmount).toFixed(2));
  if (diff === 0) return {
    diff: 0,
    label: 'Bs. 0.00',
    badge: 'text-(--theme-success) dark:text-(--theme-success) bg-primary/15 ring-1 ring-primary/40',
    row:   'bg-(--theme-card-bg) border-(--theme-border)',
  };
  if (diff < 0) return {
    diff,
    label: `-${formatMoney(Math.abs(diff))}`,
    badge: 'text-(--theme-error) dark:text-(--theme-error) bg-(--theme-error-bg) dark:bg-(--theme-error)/20 ring-1 ring-(--theme-error-border) dark:ring-(--theme-error-border)',
    row:   'bg-(--theme-error-bg) border-(--theme-error-border)',
  };
  return {
    diff,
    label: `+${formatMoney(diff)}`,
    badge: 'text-(--theme-warning) dark:text-(--theme-warning) bg-(--theme-warning-bg) dark:bg-(--theme-warning-bg) ring-1 ring-(--theme-warning-border) dark:ring-(--theme-warning-border)',
    row:   'bg-(--theme-warning-bg) dark:bg-(--theme-warning-bg) border-(--theme-warning-border) dark:border-(--theme-warning-border)',
  };
}

// ── Fila de cierre ────────────────────────────────────────────────────────────

function ClosureRow({
  closure,
  isValidating,
  onApprove,
  onReject,
}: {
  closure: ShiftClosure;
  isValidating: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  // expectedAmount = suma de todos los pedidos completados (cashToCollect)
  const expectedAmount = closure.completedOrders.reduce(
    (sum, o) => sum + o.cashToCollect, 0
  );
  const tone = differenceTone(closure.summary.totalCollected, expectedAmount);
  const initials = closure.courierName
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-colors ${tone.row}`}>

      {/* Avatar + mensajero */}
      <div className="flex items-center gap-3 w-[220px] flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center
          text-(--theme-success) dark:text-(--theme-success) text-xs font-bold flex-shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-(--theme-text) truncate">
            {closure.courierName}
          </p>
          <p className="text-xs text-(--theme-text)/40">
            {fmtDateKey(closure.dateKey)} · {fmtTime(closure.closedAt)}
          </p>
        </div>
      </div>

      {/* Entregas completadas */}
      <div className="w-[80px] flex-shrink-0 text-sm text-(--theme-text)">
        {closure.summary.completedCount}
      </div>

      {/* Esperado */}
      <div className="w-[110px] flex-shrink-0 text-sm text-(--theme-text)">
        {formatMoney(expectedAmount)}
      </div>

      {/* Registrado */}
      <div className="w-[110px] flex-shrink-0 text-sm text-(--theme-text)">
        {formatMoney(closure.summary.totalCollected)}
      </div>

      {/* Diferencia */}
      <div className="w-[120px] flex-shrink-0">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${tone.badge}`}>
          {tone.label}
        </span>
      </div>

      {/* Incidentes */}
      <div className="w-[70px] flex-shrink-0 text-sm text-(--theme-text)/60">
        {closure.summary.notDeliveredCount + closure.summary.cancelledCount > 0
          ? `${closure.summary.notDeliveredCount + closure.summary.cancelledCount} inc.`
          : '—'}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        <button
          onClick={onApprove}
          disabled={isValidating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            bg-primary/15 text-(--theme-success) dark:text-(--theme-success) hover:bg-primary/25
            disabled:opacity-50 transition-colors"
        >
          {isValidating
            ? <Loader2 size={13} className="animate-spin" />
            : <CheckCircle2 size={13} />}
          Aprobar
        </button>
        <button
          onClick={onReject}
          disabled={isValidating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            border border-(--theme-border) text-(--theme-text)/60
            hover:bg-(--theme-error) hover:text-white hover:border-(--theme-error-border)
            disabled:opacity-50 transition-colors"
        >
          <XCircle size={13} />
          Rechazar
        </button>
      </div>
    </div>
  );
}

// ── Modal de rechazo ──────────────────────────────────────────────────────────

function RejectModal({
  closure,
  onConfirm,
  onCancel,
  submitting,
}: {
  closure: ShiftClosure;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState('');
  const expectedAmount = closure.completedOrders.reduce(
    (sum, o) => sum + o.cashToCollect, 0
  );
  const tone = differenceTone(closure.summary.totalCollected, expectedAmount);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-(--theme-card-bg) border border-(--theme-border)
          rounded-2xl shadow-2xl">

          <div className="px-6 pt-6 pb-4 border-b border-(--theme-border)">
            <h2 className="text-base font-semibold text-(--theme-text)">
              Rechazar cierre de jornada
            </h2>
            <p className="text-xs text-(--theme-text)/50 mt-1">
              {closure.courierName} · {fmtDateKey(closure.dateKey)} ·{' '}
              <span className={tone.diff !== 0 ? 'text-(--theme-error)' : ''}>
                {tone.label}
              </span>
            </p>
          </div>

          <div className="px-6 py-5">
            <label className="block text-xs font-semibold text-(--theme-text)/50
              uppercase tracking-wide mb-1.5">
              Motivo del rechazo *
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ej: el monto registrado no coincide con el total de entregas confirmadas..."
              className="w-full p-3 rounded-xl text-sm bg-(--theme-bg)
                border border-(--theme-border) text-(--theme-text)
                placeholder:text-(--theme-text)/30 outline-none
                focus:border-(--theme-error-border) transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-(--theme-border)">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-(--theme-bg)
                border border-(--theme-border) text-(--theme-text)/60
                hover:text-(--theme-text) transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(reason.trim())}
              disabled={submitting || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-(--theme-error)
                hover:bg-(--theme-error) text-white transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              Confirmar rechazo
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function CourierSessionsValidation() {
  const {
    closures, loading, loadingMore, error, hasMore, loadMore, refresh,
    validating, validateError, approve, reject,
  } = useSessions();

  const [rejectTarget, setRejectTarget] = useState<ShiftClosure | null>(null);
  const [rejecting, setRejecting]       = useState(false);

  async function handleApprove(closureId: string) {
    await approve(closureId);
  }

  async function handleConfirmReject(reason: string) {
    if (!rejectTarget || !reason) return;
    setRejecting(true);
    const ok = await reject(rejectTarget.id, reason);
    setRejecting(false);
    if (ok) setRejectTarget(null);
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-(--theme-text)">
            Cierres de jornada pendientes
          </h2>
          <p className="text-xs text-(--theme-text)/50 mt-0.5">
            {loading
              ? 'Cargando...'
              : `${closures.length} jornada${closures.length !== 1 ? 's' : ''} esperando validación`}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            bg-(--theme-secondary-bg) text-(--theme-text)/60
            hover:text-(--theme-text) disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Error de validación */}
      {validateError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-(--theme-error-bg)
          border border-(--theme-error-border) rounded-xl text-sm
          text-(--theme-error) dark:text-(--theme-error)">
          <AlertCircle size={16} className="flex-shrink-0" />
          {validateError}
        </div>
      )}

      {/* Error de carga */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-(--theme-error-bg)
          border border-(--theme-error-border) rounded-xl text-sm
          text-(--theme-error) dark:text-(--theme-error)">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && closures.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20
          text-(--theme-text)/30 select-none">
          <ClipboardList size={40} strokeWidth={1.2} />
          <p className="mt-3 text-sm">No hay jornadas pendientes de validación</p>
        </div>
      )}

      {/* Lista */}
      {!loading && closures.length > 0 && (
        <div className="space-y-2">

          {/* Cabecera */}
          <div className="flex items-center gap-4 px-5 py-2.5 rounded-xl
            bg-(--theme-secondary-bg) text-xs font-semibold uppercase
            tracking-wider text-(--theme-text)/50">
            <span className="w-[220px] flex-shrink-0">Mensajero</span>
            <span className="w-[80px] flex-shrink-0">Entregas</span>
            <span className="w-[110px] flex-shrink-0">Esperado</span>
            <span className="w-[110px] flex-shrink-0">Registrado</span>
            <span className="w-[120px] flex-shrink-0">Diferencia</span>
            <span className="w-[70px] flex-shrink-0">Incidentes</span>
            <span className="ml-auto">Acciones</span>
          </div>

          {closures.map((closure) => (
            <ClosureRow
              key={closure.id}
              closure={closure}
              isValidating={validating === closure.id}
              onApprove={() => handleApprove(closure.id)}
              onReject={() => setRejectTarget(closure)}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  text-primary hover:text-primary disabled:opacity-50 transition-colors"
              >
                {loadingMore && <Loader2 size={14} className="animate-spin" />}
                <ChevronDown size={14} />
                Cargar más
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de rechazo */}
      {rejectTarget && (
        <RejectModal
          closure={rejectTarget}
          submitting={rejecting}
          onConfirm={handleConfirmReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}