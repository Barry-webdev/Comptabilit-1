'use client';
import { useState, useEffect, useCallback } from 'react';
import { elevesApi, type IEleve } from '@/lib/api';

export function useEleve(id: string) {
  const [data, setData] = useState<IEleve | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await elevesApi.obtenir(id);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
