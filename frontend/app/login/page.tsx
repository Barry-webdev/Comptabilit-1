'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';

import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [identifiant, setIdentifiant] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErreur('');

    if (!identifiant.trim() || !motDePasse.trim()) {
      setErreur('Veuillez remplir tous les champs.');
      return;
    }

    setChargement(true);
    try {
      const succes = await login(identifiant, motDePasse);
      if (succes) {
        router.push('/dashboard');
      } else {
        setErreur('Identifiant ou mot de passe incorrect.');
      }
    } finally {
      setChargement(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7F6] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-[#E2E8F0] p-8">

        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-md border border-[#E2E8F0] mb-4 overflow-hidden">
            <Image
              src="/Logo.gif"
              alt="Logo Groupe Scolaire"
              width={72}
              height={72}
              className="object-contain"
              unoptimized
            />
          </div>
          <h1 className="text-xl font-bold text-[#172B4D] leading-tight">
            Groupe Scolaire Elhadj Amadou Bendougou Bah
          </h1>
          <p className="mt-1 text-sm text-[#176B45] font-medium">
            Système de Gestion Financière
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="identifiant" className="block text-sm font-medium text-[#172B4D] mb-1">
              Identifiant
            </label>
            <input
              id="identifiant"
              type="text"
              value={identifiant}
              onChange={(e) => { setIdentifiant(e.target.value); setErreur(''); }}
              placeholder="Votre identifiant"
              className="w-full rounded-lg border border-[#CBD5E1] px-4 py-2.5 text-sm text-[#172B4D] placeholder-[#64748B] focus:border-[#176B45] focus:outline-none focus:ring-2 focus:ring-[#176B45]/30 transition bg-white"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-[#172B4D] mb-1">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              type="password"
              value={motDePasse}
              onChange={(e) => { setMotDePasse(e.target.value); setErreur(''); }}
              placeholder="Votre mot de passe"
              className="w-full rounded-lg border border-[#CBD5E1] px-4 py-2.5 text-sm text-[#172B4D] placeholder-[#64748B] focus:border-[#176B45] focus:outline-none focus:ring-2 focus:ring-[#176B45]/30 transition bg-white"
              autoComplete="current-password"
            />
          </div>

          {erreur && (
            <p className="text-sm text-[#DC2626] bg-[#DC2626]/5 border border-[#DC2626]/20 rounded-lg px-4 py-2">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full bg-[#176B45] hover:bg-[#0f4f31] disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-[#176B45] focus:ring-offset-2"
          >
            {chargement ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  );
}
