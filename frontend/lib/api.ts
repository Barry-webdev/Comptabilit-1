// ── Interfaces TypeScript ────────────────────────────────────────────────────

export interface IEleve {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  classeId: string;
  anneeScolaireId: string;
  contactParent: string;
}

export interface IClasse {
  id: string;
  libelle: string;
}

export interface IAnneeScolaire {
  id: string;
  nom: string;
  statut: 'active' | 'cloturee';
}

export interface ITranche {
  montant: number;
  dateLimite: string;
}

export interface IFrais {
  id: string;
  classeId: string;
  anneeScolaireId: string;
  totalAnnuel: number;
  t1Montant: number;
  t1DateLimite: string;
  t2Montant: number;
  t2DateLimite: string;
  t3Montant: number;
  t3DateLimite: string;
  classe?: IClasse;
  anneeScolaire?: IAnneeScolaire;
  // Alias pour compatibilité avec les composants existants
  tranche1?: { montant: number; dateLimite: string };
  tranche2?: { montant: number; dateLimite: string };
  tranche3?: { montant: number; dateLimite: string };
}

export interface IPaiement {
  id: string;
  eleveId: string;
  tranche: string;
  montant: number;
  date: string;
  recuId: string;
  comptableId: string;
  anneeScolaireId: string;
}

export interface IRecu {
  id: string;
  numero: string;
  eleveId: string;
  paiementId: string;
  date: string;
  montantVerse: number;
  soldeRestant: number;
  tranche: string;
  anneeScolaireId: string;
  comptableId: string;
  isDuplicate?: boolean;
  comptable?: { nom: string; prenom: string };
}

export interface IRecette {
  id: string;
  date: string;
  type: 'scolaire' | 'annexe';
  categorie: string;
  libelle: string;
  montant: number;
  agentId: string;
  eleveId?: string;
}

export interface IDepense {
  id: string;
  date: string;
  categorie: string;
  motif: string;
  beneficiaire: string;
  montant: number;
  referenceJustificatif?: string;
  agentId: string;
}

export interface IDashboardStats {
  encaissementsJour: number;
  nbPaiementsJour: number;
  encaissementsMois: number;
  depensesMois: number;
  soldeNet: number;
  totalEleves: number;
}

export interface IUtilisateur {
  id: string;
  nom: string;
  prenom: string;
  identifiant: string;
  role: 'administratrice' | 'comptable';
}

// ── Couche fetch centrale ────────────────────────────────────────────────────

import { useAuthStore } from '@/store/auth-store';

// BASE_URL pointe vers le backend Express
const BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000') + '/api';

// Token stocké sous la clé 'gsab-token' dans localStorage
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Récupère le token depuis localStorage (safe pour SSR)
  const token = typeof window !== 'undefined' ? localStorage.getItem('gsab-token') : null;
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers ?? {}),
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    throw new Error('Non autorisé');
  }
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `Erreur HTTP ${res.status}`);
  }
  // Retourne undefined pour les réponses 204
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── APIs exportées ───────────────────────────────────────────────────────────

export const authApi = {
  login: (identifiant: string, motDePasse: string) =>
    apiFetch<{ token: string; utilisateur: IUtilisateur }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifiant, motDePasse }),
    }),
  moi: () => apiFetch<IUtilisateur>('/auth/moi'),
};

export const elevesApi = {
  lister: (params?: Record<string, string>) =>
    apiFetch<IEleve[]>('/eleves' + (params ? '?' + new URLSearchParams(params) : '')),
  obtenir: (id: string) =>
    apiFetch<IEleve>(`/eleves/${id}`),
  creer: (data: Omit<IEleve, 'id'>) =>
    apiFetch<IEleve>('/eleves', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: string, data: Partial<Omit<IEleve, 'id'>>) =>
    apiFetch<IEleve>(`/eleves/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const classesApi = {
  lister: () =>
    apiFetch<IClasse[]>('/classes'),
  creer: (data: Omit<IClasse, 'id'>) =>
    apiFetch<IClasse>('/classes', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: string, data: Partial<Omit<IClasse, 'id'>>) =>
    apiFetch<IClasse>(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const anneesApi = {
  lister: () =>
    apiFetch<IAnneeScolaire[]>('/annees-scolaires'),
  creer: (data: Omit<IAnneeScolaire, 'id'>) =>
    apiFetch<IAnneeScolaire>('/annees-scolaires', { method: 'POST', body: JSON.stringify(data) }),
  activer: (id: string) =>
    apiFetch<IAnneeScolaire>(`/annees-scolaires/${id}/activer`, { method: 'PATCH' }),
  cloturer: (id: string) =>
    apiFetch<IAnneeScolaire>(`/annees-scolaires/${id}/cloturer`, { method: 'PATCH' }),
};

export const fraisApi = {
  lister: (anneeId?: string) =>
    apiFetch<IFrais[]>('/frais' + (anneeId ? `?anneeId=${anneeId}` : '')),
  enregistrer: (data: Omit<IFrais, 'id'>) =>
    apiFetch<IFrais>('/frais', { method: 'POST', body: JSON.stringify(data) }),
};

export const paiementsApi = {
  lister: (params?: Record<string, string>) =>
    apiFetch<IPaiement[]>('/paiements' + (params ? '?' + new URLSearchParams(params) : '')),
  /**
   * Crée un paiement et son reçu en une seule requête.
   * Le backend retourne { paiement, recu }.
   */
  creerAvecRecu: (data: {
    eleveId: string;
    tranche: string;
    montant: number;
    anneeScolaireId: string;
  }) =>
    apiFetch<{ paiement: IPaiement; recu: IRecu }>('/paiements', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const recusApi = {
  lister: (params?: Record<string, string>) =>
    apiFetch<IRecu[]>('/recus' + (params ? '?' + new URLSearchParams(params) : '')),
};

export const recettesApi = {
  lister: (params?: Record<string, string>) =>
    apiFetch<IRecette[]>('/recettes' + (params ? '?' + new URLSearchParams(params) : '')),
  creer: (data: Omit<IRecette, 'id'>) =>
    apiFetch<IRecette>('/recettes', { method: 'POST', body: JSON.stringify(data) }),
};

export const depensesApi = {
  lister: (params?: Record<string, string>) =>
    apiFetch<IDepense[]>('/depenses' + (params ? '?' + new URLSearchParams(params) : '')),
  creer: (data: Omit<IDepense, 'id'>) =>
    apiFetch<IDepense>('/depenses', { method: 'POST', body: JSON.stringify(data) }),
};

export const utilisateursApi = {
  lister: () => apiFetch<IUtilisateur[]>('/utilisateurs'),
  creer: (data: { nom: string; prenom: string; identifiant: string; motDePasse: string; role: string }) =>
    apiFetch<IUtilisateur>('/utilisateurs', { method: 'POST', body: JSON.stringify(data) }),
  modifier: (id: string, data: { nom?: string; prenom?: string; identifiant?: string; motDePasse?: string; role?: string }) =>
    apiFetch<IUtilisateur>(`/utilisateurs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const dashboardApi = {
  stats: () => apiFetch<IDashboardStats>('/dashboard/stats'),
};

export const healthApi = {
  // Ping léger (sans auth) pour réveiller le backend Render (plan gratuit).
  // Les erreurs sont ignorées : un serveur qui se réveille répondra au prochain ping.
  ping: async (): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/health`, { method: 'GET', cache: 'no-store' });
    } catch {
      // Serveur potentiellement en cours de réveil : on ignore l'erreur.
    }
  },
};
