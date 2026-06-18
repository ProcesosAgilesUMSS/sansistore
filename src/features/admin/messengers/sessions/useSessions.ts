// src/features/admin/messengers/sessions/useSessions.ts

import { useState, useEffect, useCallback } from 'react';
import { getPendingSessions, validateCourierSession } from './sessionsService';
import type { CourierSession, CourierSessionAction } from './types';

interface UseSessionsResult {
  sessions: CourierSession[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  validating: string | null; // sessionId que se está procesando actualmente
  validateError: string | null;
  approve: (sessionId: string) => Promise<boolean>;
  reject: (sessionId: string, rejectionReason: string) => Promise<boolean>;
}

export function useSessions(): UseSessionsResult {
  const [sessions, setSessions]       = useState<CourierSession[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [hasMore, setHasMore]         = useState(false);
  const [cursor, setCursor]           = useState<string | null>(null);

  const [validating, setValidating]       = useState<string | null>(null);
  const [validateError, setValidateError] = useState<string | null>(null);

  const fetchSessions = useCallback(async (cursorId: string | null, append: boolean) => {
    try {
      const data = await getPendingSessions({ limit: 20, cursor: cursorId });
      setSessions((prev) => (append ? [...prev, ...data.sessions] : data.sessions));
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (err: any) {
      setError(err.message ?? 'Error al cargar cierres de jornada');
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchSessions(null, false).finally(() => setLoading(false));
  }, [fetchSessions]);

  function loadMore() {
    if (!hasMore || loadingMore || !cursor) return;
    setLoadingMore(true);
    fetchSessions(cursor, true).finally(() => setLoadingMore(false));
  }

  function refresh() {
    setLoading(true);
    setError(null);
    setCursor(null);
    fetchSessions(null, false).finally(() => setLoading(false));
  }

  async function runValidation(
    sessionId: string,
    action: CourierSessionAction,
    rejectionReason?: string
  ): Promise<boolean> {
    setValidating(sessionId);
    setValidateError(null);
    try {
      await validateCourierSession({ sessionId, action, rejectionReason });
      // Quitar de la lista local ya que deja de estar "pendiente"
      setSessions((prev) => prev.filter((s) => s.sessionId !== sessionId));
      return true;
    } catch (err: any) {
      setValidateError(err.message ?? 'Error al procesar el cierre');
      return false;
    } finally {
      setValidating(null);
    }
  }

  function approve(sessionId: string) {
    return runValidation(sessionId, 'approve');
  }

  function reject(sessionId: string, rejectionReason: string) {
    return runValidation(sessionId, 'reject', rejectionReason);
  }

  return {
    sessions,
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