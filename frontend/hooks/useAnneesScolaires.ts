'use client';
import { useState, useEffect, useCallback } from 'react';
import { anneesApi, type IAnneeScolaire } from '@/lib/api';

export function useAnneesScolaires() {
  const [data, setData] = useState<IAnneeScolaire[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await anneesApi.lister();
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
