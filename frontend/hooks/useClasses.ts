'use client';
import { useState, useEffect, useCallback } from 'react';
import { classesApi, type IClasse } from '@/lib/api';

// Cache au niveau du module : les classes changent rarement.
// Tant que le cache a moins de 5 minutes, on retourne les données
// sans refetcher. Invalidation manuelle via refetch().
let cache: { data: IClasse[]; timestamp: number } | null = null;
const STALE_MS = 5 * 60 * 1000;

function isFresh(): boolean {
  return cache !== null && Date.now() - cache.timestamp < STALE_MS;
}

export function useClasses() {
  const [data, setData] = useState<IClasse[] | null>(() => (isFresh() ? cache!.data : null));
  const [loading, setLoading] = useState<boolean>(() => !isFresh());
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await classesApi.lister();
      setData(result);
      cache = { data: result, timestamp: Date.now() };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFresh()) return; // cache valide : pas de refetch
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
