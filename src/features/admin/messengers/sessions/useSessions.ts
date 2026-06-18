// src/features/admin/messengers/sessions/useSessions.ts

import { useState, useEffect, useCallback } from 'react';
import { getPendingClosures, validateShiftClosure } from './sessionsService';
import type { ShiftClosure, ShiftClosureAction } from './types';

interface UseSessionsResult {
  closures: ShiftClosure[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  validating: string | null; // closureId que se está procesando
  validateError: string | null;
  approve: (closureId: string) => Promise<boolean>;
  reject: (closureId: string, rejectionReason: string) => Promise<boolean>;
}

export function useSessions(): UseSessionsResult {
  const [closures, setClosures]       = useState<ShiftClosure[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [hasMore, setHasMore]         = useState(false);
  const [cursor, setCursor]           = useState<string | null>(null);

  const [validating, setValidating]       = useState<string | null>(null);
  const [validateError, setValidateError] = useState<string | null>(null);

  const fetchClosures = useCallback(async (
    cursorId: string | null,
    append: boolean
  ) => {
    try {
      const data = await getPendingClosures({ limit: 20, cursor: cursorId });
      setClosures((prev) => append ? [...prev, ...data.closures] : data.closures);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar cierres de jornada');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchClosures(null, false).finally(() => setLoading(false));
  }, [fetchClosures]);

  function loadMore() {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    fetchClosures(cursor, true).finally(() => setLoadingMore(false));
  }

  function refresh() {
    setLoading(true);
    setError(null);
    setCursor(null);
    fetchClosures(null, false).finally(() => setLoading(false));
  }

  async function runValidation(
    closureId: string,
    action: ShiftClosureAction,
    rejectionReason?: string
  ): Promise<boolean> {
    setValidating(closureId);
    setValidateError(null);
    try {
      await validateShiftClosure({ closureId, action, rejectionReason });
      // Quitar de la lista local — ya no está "pendiente"
      setClosures((prev) => prev.filter((c) => c.id !== closureId));
      return true;
    } catch (err: any) {
      setValidateError(err.message ?? 'Error al procesar el cierre');
      return false;
    } finally {
      setValidating(null);
    }
  }

  function approve(closureId: string) {
    return runValidation(closureId, 'approve');
  }

  function reject(closureId: string, rejectionReason: string) {
    return runValidation(closureId, 'reject', rejectionReason);
  }

  return {
    closures,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
    validating,
    validateError,
    approve,
    reject,
  };
}