import { useEffect, useState } from 'react';
import { useAuthUser } from '../../../hooks/useAuthUser';
import {
  fetchDailyCollections,
  type DailyCollectionsSummary,
} from '../services/dailyCollectionsService';

interface UseDailyCollectionsReturn {
  summary: DailyCollectionsSummary | null;
  loading: boolean;
  error: string | null;
}

export function useDailyCollections(date?: string): UseDailyCollectionsReturn {
  const { user, authReady } = useAuthUser();
  const [summary, setSummary] = useState<DailyCollectionsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authReady) return;

    if (!user) {
      setSummary(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    fetchDailyCollections(date)
      .then((data) => {
        if (active) setSummary(data);
      })
      .catch((err: Error) => {
        if (active) {
          setSummary(null);
          setError(err.message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authReady, date, user]);

  return { summary, loading, error };
}
