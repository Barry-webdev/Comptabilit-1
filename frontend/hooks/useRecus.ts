'use client';
import { useState, useEffect, useCallback } from 'react';
import { recusApi, type IRecu } from '@/lib/api';

export function useRecus(params?: Record<string, string>) {
  const [data, setData] = useState<IRecu[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await recusApi.lister(params);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
