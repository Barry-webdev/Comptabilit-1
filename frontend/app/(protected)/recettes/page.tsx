'use client';

import { useState, useMemo } from 'react';
import { useRecettes, usePaiements, useEleves } from '@/hooks';
import { useAuthStore } from '@/store/auth-store';
import { formatGNF, formatDate } from '@/lib/utils';
import { recettesApi, type IRecette } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

const CATEGORIES_ANNEXE = [
  "Frais d'examen",
  'Activités périscolaires',
  'Fournitures',
  'Subvention',
  'Autre',
] as const;

type CategorieAnnexe = (typeof CATEGORIES_ANNEXE)[number];

const CATEGORIES_OPTIONS = [
  { value: '', label: 'Toutes les catégories' },
  ...CATEGORIES_ANNEXE.map((c) => ({ value: c, label: c })),
];

const CATEGORIES_FORM_OPTIONS = [
  { value: '', label: 'Choisir une catégorie' },
  ...CATEGORIES_ANNEXE.map((c) => ({ value: c, label: c })),
];

type FormData = {
  date: string;
  categorie: string;
  libelle: string;
  montant: string;
};

type FormErreurs = Partial<Record<keyof FormData, string>>;

function labelTranche(tranche: string): string {
  if (tranche === 'tranche1') return 'Tranche 1';
  if (tranche === 'tranche2') return 'Tranche 2';
  if (tranche === 'tranche3') return 'Tranche 3';
  return tranche;
}

export default function RecettesPage() {
  const { data: recettes, loading, error, refetch } = useRecettes();
  const { data: paiements } = usePaiements();
  const { data: eleves } = useEleves();
  const utilisateur = useAuthStore((s) => s.utilisateur);

  const recettesList = recettes ?? [];
  const paiementsList = paiements ?? [];
  const elevesList = eleves ?? [];

  const [modalOuverte, setModalOuverte] = useState(false);
  const [filtreDebut, setFiltreDebut] = useState('');
  const [filtreFin, setFiltreFin] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');

  const [form, setForm] = useState<FormData>({
    date: '',
    categorie: '',
    libelle: '',
    montant: '',
  });
  const [erreurs, setErreurs] = useState<FormErreurs>({});
  const [submitting, setSubmitting] = useState(false);

  // Recettes scolaires générées depuis les paiements
  const recettesScolaires: IRecette[] = useMemo(
    () =>
      paiementsList.map((p) => {
        const eleve = elevesList.find((e) => e.id === p.eleveId);
        const nomEleve = eleve ? `${eleve.prenom} ${eleve.nom}` : p.eleveId;
        return {
          id: `scolaire-${p.id}`,
          date: p.date,
          type: 'scolaire' as const,
          categorie: 'Scolarité',
          libelle: `${labelTranche(p.tranche)} - ${nomEleve}`,
          montant: p.montant,
          agentId: p.comptableId,
        };
      }),
    [paiementsList, elevesList]
  );

  // Recettes annexes depuis l'API
  const recettesAnnexes = recettesList.filter((r) => r.type === 'annexe');

  // Toutes les recettes consolidées
  const toutesRecettes: IRecette[] = useMemo(
    () =>
      [...recettesScolaires, ...recettesAnnexes].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ),
    [recettesScolaires, recettesAnnexes]
  );

  // Filtrage
  const recettesFiltrees = useMemo(
    () =>
      toutesRecettes.filter((r) => {
        const matchDebut = filtreDebut === '' || r.date >= filtreDebut;
        const matchFin = filtreFin === '' || r.date <= filtreFin;
        const matchCategorie =
          filtreCategorie === '' || r.categorie === filtreCategorie;
        return matchDebut && matchFin && matchCategorie;
      }),
    [toutesRecettes, filtreDebut, filtreFin, filtreCategorie]
  );

  const totalConsolide = useMemo(
    () => recettesFiltrees.reduce((acc, r) => acc + r.montant, 0),
    [recettesFiltrees]
  );

  function nomAgent(agentId: string): string {
    if (utilisateur?.id === agentId) {
      return `${utilisateur.prenom} ${utilisateur.nom}`;
    }
    return agentId;
  }

  function validerForm(): boolean {
    const nouvellesErreurs: FormErreurs = {};
    if (!form.date) nouvellesErreurs.date = 'La date est obligatoire';
    if (!form.categorie) nouvellesErreurs.categorie = 'La catégorie est obligatoire';
    if (!form.libelle.trim()) nouvellesErreurs.libelle = 'Le libellé est obligatoire';
    if (!form.montant || isNaN(Number(form.montant)) || Number(form.montant) <= 0) {
      nouvellesErreurs.montant = 'Le montant doit être un nombre positif';
    }
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  }

  async function soumettreFormulaire(e: React.FormEvent) {
    e.preventDefault();
    if (!validerForm()) return;
    if (!utilisateur) return;
    setSubmitting(true);
    try {
      await recettesApi.creer({
        date: form.date,
        type: 'annexe',
        categorie: form.categorie as CategorieAnnexe,
        libelle: form.libelle.trim(),
        montant: Number(form.montant),
        agentId: utilisateur.id,
      });
      setForm({ date: '', categorie: '', libelle: '', montant: '' });
      setErreurs({});
      setModalOuverte(false);
      refetch();
    } catch (err) {
      setErreurs({ montant: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement' });
    } finally {
      setSubmitting(false);
    }
  }

  function fermerModal() {
    setForm({ date: '', categorie: '', libelle: '', montant: '' });
    setErreurs({});
    setModalOuverte(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#172B4D]">Recettes</h1>
        <Button onClick={() => setModalOuverte(true)} variant="primary">
          + Nouvelle recette annexe
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="filtreDebut"
            label="Date début"
            type="date"
            value={filtreDebut}
            onChange={(e) => setFiltreDebut(e.target.value)}
          />
          <Input
            id="filtreFin"
            label="Date fin"
            type="date"
            value={filtreFin}
            onChange={(e) => setFiltreFin(e.target.value)}
          />
          <Select
            id="filtreCategorie"
            label="Catégorie"
            options={CATEGORIES_OPTIONS}
            value={filtreCategorie}
            onChange={(e) => setFiltreCategorie(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Agent</th>
              </tr>
            </thead>
            <tbody>
              {recettesFiltrees.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-[#172B4D]">
                    {formatDate(r.date)}
                  </td>
                  <td className="px-4 py-3">
                    {r.type === 'scolaire' ? (
                      <Badge variant="success">Scolaire</Badge>
                    ) : (
                      <Badge variant="warning">Annexe</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.categorie}</td>
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {r.libelle}
                  </td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap text-[#176B45]">
                    {formatGNF(r.montant)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {nomAgent(r.agentId)}
                  </td>
                </tr>
              ))}
              {recettesFiltrees.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    Aucune recette trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total consolidé */}
        {recettesFiltrees.length > 0 && (
          <div className="px-4 py-3 border-t border-[#E2E8F0] bg-[#F5F7F6] flex justify-end">
            <span className="text-sm font-semibold text-[#172B4D]">
              Total consolidé :&nbsp;
              <span className="text-[#176B45]">{formatGNF(totalConsolide)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Modal saisie recette annexe */}
      <Modal
        isOpen={modalOuverte}
        onClose={fermerModal}
        title="Nouvelle recette annexe"
      >
        <form onSubmit={soumettreFormulaire} noValidate className="space-y-4">
          <Input
            id="rct-date"
            label="Date *"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            erreur={erreurs.date}
          />

          <Select
            id="rct-categorie"
            label="Catégorie *"
            options={CATEGORIES_FORM_OPTIONS}
            value={form.categorie}
            onChange={(e) =>
              setForm((f) => ({ ...f, categorie: e.target.value }))
            }
            erreur={erreurs.categorie}
          />

          <Input
            id="rct-libelle"
            label="Libellé *"
            type="text"
            placeholder="Description de la recette"
            value={form.libelle}
            onChange={(e) =>
              setForm((f) => ({ ...f, libelle: e.target.value }))
            }
            erreur={erreurs.libelle}
          />

          <Input
            id="rct-montant"
            label="Montant GNF *"
            type="number"
            min="1"
            placeholder="0"
            value={form.montant}
            onChange={(e) =>
              setForm((f) => ({ ...f, montant: e.target.value }))
            }
            erreur={erreurs.montant}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#172B4D]">
              Agent saisisseur
            </label>
            <input
              readOnly
              value={
                utilisateur
                  ? `${utilisateur.prenom} ${utilisateur.nom}`
                  : '—'
              }
              className="rounded-md border border-[#E2E8F0] bg-[#F5F7F6] px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={fermerModal}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
