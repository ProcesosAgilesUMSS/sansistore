// src/features/admin/messengers/sessions/components/CourierSessionsValidation.tsx

import { useState } from 'react';
import {
  Loader2, AlertCircle, CheckCircle2, XCircle,
  ClipboardList, RefreshCw,
} from 'lucide-react';
import { useSessions } from '../useSessions';
import type { CourierSession } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtFull(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('es-BO', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) + ' ' + d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso?: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function formatMoney(n: number): string {
  return `Bs. ${n.toFixed(2)}`;
}

function differenceTone(diff: number): { bg: string; text: string; label: string } {
  if (diff === 0) {
    return { bg: 'bg-[#88b04b]/15 ring-1 ring-[#88b04b]/40', text: 'text-[#4a6b1f] dark:text-[#b7dc78]', label: formatMoney(0) };
  }
  if (diff < 0) {
    return { bg: 'bg-red-100 dark:bg-red-500/20 ring-1 ring-red-300 dark:ring-red-500/40', text: 'text-red-700 dark:text-red-300', label: `-${formatMoney(Math.abs(diff))}` };
  }
  return { bg: 'bg-orange-100 dark:bg-orange-500/20 ring-1 ring-orange-300 dark:ring-orange-500/40', text: 'text-orange-700 dark:text-orange-300', label: `+${formatMoney(diff)}` };
}

// ── Subcomponentes ────────────────────────────────────────────────────────────

function SessionRow({
  session,
  isValidating,
  onApprove,
  onReject,
}: {
  session: CourierSession;
  isValidating: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const diff = differenceTone(session.differenceAmount);
  const isConsistent = session.differenceAmount === 0;

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-colors ${
        isConsistent
          ? 'bg-[var(--theme-card-bg)] border-[var(--theme-border)]'
          : session.differenceAmount < 0
            ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/30'
            : 'bg-orange-50 dark:bg-orange-500/5 border-orange-200 dark:border-orange-500/30'
      }`}
    >
      {/* Avatar + nombre */}
      <div className="flex items-center gap-3 w-[220px] flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-[#88b04b]/15 flex items-center justify-center
          text-[#4a6b1f] dark:text-[#b7dc78] text-xs font-bold flex-shrink-0">
          {session.courierName.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--theme-text)] truncate">{session.courierName}</p>
          <p className="text-xs text-[var(--theme-text)]/40">Cerrado {timeAgo(session.closedAt)}</p>
        </div>
      </div>

      {/* Entregas */}
      <div className="w-[80px] flex-shrink-0 text-sm text-[var(--theme-text)]">
        {session.deliveriesCount}
      </div>

      {/* Esperado */}
      <div className="w-[110px] flex-shrink-0 text-sm text-[var(--theme-text)]">
        {formatMoney(session.expectedAmount)}
      </div>

      {/* Registrado */}
      <div className="w-[110px] flex-shrink-0 text-sm text-[var(--theme-text)]">
        {formatMoney(session.totalCollected)}
      </div>

      {/* Diferencia */}
      <div className="w-[110px] flex-shrink-0">
        <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${diff.bg} ${diff.text}`}>
          {diff.label}
        </span>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        <button
          onClick={onApprove}
          disabled={isValidating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            bg-[#88b04b]/15 text-[#4a6b1f] dark:text-[#b7dc78] hover:bg-[#88b04b]/25
            disabled:opacity-50 transition-colors"
        >
          {isValidating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
          Aprobar
        </button>
        <button
          onClick={onReject}
          disabled={isValidating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
            border border-[var(--theme-border)] text-[var(--theme-text)]/60
            hover:bg-red-500 hover:text-white hover:border-red-500
            disabled:opacity-50 transition-colors"
        >
          <XCircle size={13} />
          Rechazar
        </button>
      </div>
    </div>
  );
}

function RejectModal({
  session,
  onConfirm,
  onCancel,
  submitting,
}: {
  session: CourierSession;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
  submitting: boolean;
}) {
  const [reason, setReason] = useState('');
  const diff = differenceTone(session.differenceAmount);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[var(--theme-card-bg)] border border-[var(--theme-border)] rounded-2xl shadow-2xl">
          <div className="px-6 pt-6 pb-4 border-b border-[var(--theme-border)]">
            <h2 className="text-[16px] font-bold text-[var(--theme-text)]">
              Rechazar cierre de jornada
            </h2>
            <p className="text-[12px] text-[var(--theme-text)]/50 mt-1">
              {session.courierName} · diferencia de{' '}
              <span className={diff.text}>{diff.label}</span>
            </p>
          </div>

          <div className="px-6 py-5">
            <label className="block text-[11px] font-semibold text-[var(--theme-text)]/50 uppercase tracking-wide mb-1.5">
              Motivo del rechazo *
            </label>
            <textarea
              autoFocus
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="Ej: el monto registrado no coincide con el total de entregas confirmadas..."
              className="w-full p-3 rounded-xl text-[13px] bg-[var(--theme-bg)] border border-[var(--theme-border)]
                text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/30 outline-none
                focus:border-red-400 transition-colors resize-none"
            />
          </div>

          <div className="flex gap-3 px-6 py-4 border-t border-[var(--theme-border)]">
            <button
              onClick={onCancel}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-[var(--theme-bg)]
                border border-[var(--theme-border)] text-[var(--theme-text)]/60
                hover:text-[var(--theme-text)] transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(reason.trim())}
              disabled={submitting || !reason.trim()}
              className="flex-1 py-2.5 rounded-xl text-[13px] font-medium bg-red-600 hover:bg-red-700
                text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed
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
    sessions, loading, loadingMore, error, hasMore, loadMore, refresh,
    validating, validateError, approve, reject,
  } = useSessions();

  const [rejectTarget, setRejectTarget] = useState<CourierSession | null>(null);
  const [rejecting, setRejecting] = useState(false);

  async function handleApprove(sessionId: string) {
    await approve(sessionId);
  }

  async function handleConfirmReject(reason: string) {
    if (!rejectTarget || !reason) return;
    setRejecting(true);
    const ok = await reject(rejectTarget.sessionId, reason);
    setRejecting(false);
    if (ok) setRejectTarget(null);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--theme-text)]">Cierres de jornada pendientes</h2>
          <p className="text-sm text-[var(--theme-text)]/50">
            {loading ? 'Cargando...' : `${sessions.length} jornada${sessions.length !== 1 ? 's' : ''} esperando validación`}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium
            bg-[var(--theme-secondary-bg)] text-[var(--theme-text)]/60 hover:text-[var(--theme-text)]
            disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Error de validación (toast simple) */}
      {validateError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border
          border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-300">
          <AlertCircle size={16} className="flex-shrink-0" />
          {validateError}
        </div>
      )}

      {/* Error de carga */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 border
          border-red-200 dark:border-red-500/30 rounded-xl text-sm text-red-600 dark:text-red-300">
          <AlertCircle size={16} className="flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading inicial */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-[#88b04b]" />
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--theme-text)]/30 select-none">
          <ClipboardList size={40} strokeWidth={1.2} />
          <p className="mt-3 text-sm">No hay jornadas pendientes de validación</p>
        </div>
      )}

      {/* Lista */}
      {!loading && sessions.length > 0 && (
        <div className="space-y-3">
          {sessions.map((session) => (
            <SessionRow
              key={session.sessionId}
              session={session}
              isValidating={validating === session.sessionId}
              onApprove={() => handleApprove(session.sessionId)}
              onReject={() => setRejectTarget(session)}
            />
          ))}

          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  text-[#88b04b] hover:text-[#7aa043] disabled:opacity-50 transition-colors"
              >
                {loadingMore && <Loader2 size={14} className="animate-spin" />}
                Cargar más
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal de rechazo */}
      {rejectTarget && (
        <RejectModal
          session={rejectTarget}
          submitting={rejecting}
          onConfirm={handleConfirmReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
}