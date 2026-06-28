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
    badge: 'text-[#4a6b1f] dark:text-[#b7dc78] bg-[#88b04b]/15 ring-1 ring-[#88b04b]/40',
    cardBorder: 'border-[var(--theme-border)]',
    cardBg: 'bg-[var(--theme-card-bg)]',
  };
  if (diff < 0) return {
    diff,
    label: `-${formatMoney(Math.abs(diff))}`,
    badge: 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-500/20 ring-1 ring-red-300 dark:ring-red-500/40',
    cardBorder: 'border-red-200 dark:border-red-500/30',
    cardBg: 'bg-red-50 dark:bg-red-500/5',
  };
  return {
    diff,
    label: `+${formatMoney(diff)}`,
    badge: 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-500/20 ring-1 ring-orange-300 dark:ring-orange-500/40',
    cardBorder: 'border-orange-200 dark:border-orange-500/30',
    cardBg: 'bg-orange-50 dark:bg-orange-500/5',
  };
}

// ── Tarjeta de cierre ─────────────────────────────────────────────────────────

function ClosureCard({
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
  const expectedAmount = closure.completedOrders.reduce(
    (sum, o) => sum + (o.cashToCollect ?? 0), 0
  );
  const tone = differenceTone(closure.summary.totalCollected, expectedAmount);
  const incidents = closure.summary.notDeliveredCount + closure.summary.cancelledCount;
  const initials = closure.courierName
    .split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`rounded-xl border transition-colors ${tone.cardBg} ${tone.cardBorder}`}>

      {/* Fila principal */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full bg-[#88b04b]/15 flex items-center justify-center
          text-[#4a6b1f] dark:text-[#b7dc78] text-xs font-bold flex-shrink-0">
          {initials}
        </div>

        {/* Nombre + fecha */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[var(--theme-text)] truncate">
            {closure.courierName}
          </p>
          <p className="text-xs text-(--theme-text)/40">
            {fmtDateKey(closure.dateKey)} · {fmtTime(closure.closedAt)}
          </p>
        </div>

        {/* Badge diferencia — siempre visible */}
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${tone.badge}`}>
          {tone.label}
        </span>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
          <button
            onClick={onApprove}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-[#88b04b]/15 text-[#4a6b1f] dark:text-[#b7dc78] hover:bg-[#88b04b]/25
              disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {isValidating
              ? <Loader2 size={13} className="animate-spin" />
              : <CheckCircle2 size={13} />}
            <span className="hidden sm:inline">Aprobar</span>
          </button>
          <button
            onClick={onReject}
            disabled={isValidating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              border border-[var(--theme-border)] text-[var(--theme-text)]/60
              hover:bg-red-500 hover:text-white hover:border-red-500
              disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            <XCircle size={13} />
            <span className="hidden sm:inline">Rechazar</span>
          </button>
        </div>
      </div>

      {/* Fila de métricas */}
      <div className="grid grid-cols-4 border-t border-[var(--theme-border)]">
        <div className="px-4 py-2.5 border-r border-[var(--theme-border)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-text)]/40 mb-0.5">
            Entregas
          </p>
          <p className="text-sm font-semibold text-[var(--theme-text)]">
            {closure.summary.completedCount}
          </p>
        </div>
        <div className="px-4 py-2.5 border-r border-[var(--theme-border)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-text)]/40 mb-0.5">
            Esperado
          </p>
          <p className="text-sm font-semibold text-[var(--theme-text)]">
            {formatMoney(expectedAmount)}
          </p>
        </div>
        <div className="px-4 py-2.5 border-r border-[var(--theme-border)]">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-text)]/40 mb-0.5">
            Registrado
          </p>
          <p className="text-sm font-semibold text-[var(--theme-text)]">
            {formatMoney(closure.summary.totalCollected)}
          </p>
        </div>
        <div className="px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--theme-text)]/40 mb-0.5">
            Incidentes
          </p>
          <p className="text-sm font-semibold text-[var(--theme-text)]/60">
            {incidents > 0 ? `${incidents} inc.` : '—'}
          </p>
        </div>
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
    (sum, o) => sum + (o.cashToCollect ?? 0), 0
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
    <div className="max-w-4xl mx-auto space-y-4">

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
          {closures.map((closure) => (
            <ClosureCard
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