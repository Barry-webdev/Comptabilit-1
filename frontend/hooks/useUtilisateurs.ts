'use client';
import { useState, useEffect, useCallback } from 'react';
import { utilisateursApi, type IUtilisateur } from '@/lib/api';

export function useUtilisateurs() {
  const [data, setData] = useState<IUtilisateur[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await utilisateursApi.lister();
      setData(result ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
