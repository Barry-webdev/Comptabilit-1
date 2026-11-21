'use client';

import { useEffect } from 'react';
import { healthApi } from '@/lib/api';

// Render plan gratuit : mise en veille après 15 min d'inactivité.
// On ping toutes les 14 minutes pour garder le backend éveillé et
// éviter le cold start de 30-60s.
const KEEP_ALIVE_INTERVAL_MS = 14 * 60 * 1000;

export function KeepAliveProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Ping immédiat à la connexion, puis répété toutes les 14 minutes.
    void healthApi.ping();
    const id = setInterval(() => {
      void healthApi.ping();
    }, KEEP_ALIVE_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return <>{children}</>;
}
