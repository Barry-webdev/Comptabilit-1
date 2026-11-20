import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/lib/api';

// Type utilisateur retourné par le backend
type Utilisateur = {
  id: string;
  nom: string;
  prenom: string;
  identifiant: string;
  role: 'administratrice' | 'comptable';
};

type AuthState = {
  utilisateur: Utilisateur | null;
  role: 'administratrice' | 'comptable' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  errorMessage: string | null;
};

type AuthActions = {
  login: (identifiant: string, motDePasse: string) => Promise<boolean>;
  logout: () => void;
};

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      utilisateur: null,
      role: null,
      isAuthenticated: false,
      isLoading: false,
      errorMessage: null,

      login: async (identifiant, motDePasse) => {
        set({ isLoading: true, errorMessage: null });
        try {
          const data = await authApi.login(identifiant, motDePasse);
          // Stocker le JWT dans localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('gsab-token', data.token);
          }
          const user = data.utilisateur as Utilisateur;
          set({
            utilisateur: user,
            role: user.role,
            isAuthenticated: true,
            isLoading: false,
            errorMessage: null,
          });
          return true;
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Identifiant ou mot de passe incorrect';
          set({ isLoading: false, errorMessage: msg, isAuthenticated: false });
          return false;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('gsab-token');
        }
        set({ utilisateur: null, role: null, isAuthenticated: false, errorMessage: null });
      },
    }),
    {
      name: 'gsab-auth',
      // Ne pas persister isLoading ni errorMessage
      partialize: (state) => ({
        utilisateur: state.utilisateur,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
