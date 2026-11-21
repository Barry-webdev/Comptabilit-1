'use client';
import { useState, useEffect, useCallback } from 'react';
import { fraisApi, type IFrais } from '@/lib/api';

// Normalise les données backend (t1Montant...) vers le format frontend (tranche1...)
function normaliserFrais(f: IFrais): IFrais {
  return {
    ...f,
    tranche1: { montant: f.t1Montant, dateLimite: f.t1DateLimite },
    tranche2: { montant: f.t2Montant, dateLimite: f.t2DateLimite },
    tranche3: { montant: f.t3Montant, dateLimite: f.t3DateLimite },
  };
}

// Cache au niveau du module, clé par anneeId : les frais changent rarement.
// Tant que le cache a moins de 5 minutes, on retourne les données
// sans refetcher. Invalidation manuelle via refetch().
let cache: { anneeId: string | undefined; data: IFrais[]; timestamp: number } | null = null;
const STALE_MS = 5 * 60 * 1000;

function isFresh(anneeId?: string): boolean {
  return cache !== null && cache.anneeId === anneeId && Date.now() - cache.timestamp < STALE_MS;
}

export function useFrais(anneeId?: string) {
  const [data, setData] = useState<IFrais[] | null>(() => (isFresh(anneeId) ? cache!.data : null));
  const [loading, setLoading] = useState<boolean>(() => !isFresh(anneeId));
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fraisApi.lister(anneeId);
      const normalise = result ? result.map(normaliserFrais) : [];
      setData(normalise);
      cache = { anneeId, data: normalise, timestamp: Date.now() };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [anneeId]);

  useEffect(() => {
    if (isFresh(anneeId)) return; // cache valide : pas de refetch
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
