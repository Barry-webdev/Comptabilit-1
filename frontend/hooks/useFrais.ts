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

export function useFrais(anneeId?: string) {
  const [data, setData] = useState<IFrais[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fraisApi.lister(anneeId);
      setData(result ? result.map(normaliserFrais) : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  }, [anneeId]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { data, loading, error, refetch: fetchData };
}
