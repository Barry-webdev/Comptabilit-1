'use client';

import { useState, useMemo } from 'react';
import { useDepenses } from '@/hooks';
import { useAuthStore } from '@/store/auth-store';
import { formatGNF, formatDate } from '@/lib/utils';
import { depensesApi } from '@/lib/api';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';

const CATEGORIES_DEPENSE = [
  'Fournitures administratives',
  'Fournitures pédagogiques',
  'Entretien/Maintenance',
  'Eau/Electricité/Télécoms',
  'Personnel',
  'Dépenses diverses',
] as const;

type CategorieDepense = (typeof CATEGORIES_DEPENSE)[number];

const CATEGORIES_FILTRE_OPTIONS = [
  { value: '', label: 'Toutes les catégories' },
  ...CATEGORIES_DEPENSE.map((c) => ({ value: c, label: c })),
];

const CATEGORIES_FORM_OPTIONS = [
  { value: '', label: 'Choisir une catégorie' },
  ...CATEGORIES_DEPENSE.map((c) => ({ value: c, label: c })),
];

type FormData = {
  date: string;
  categorie: string;
  motif: string;
  beneficiaire: string;
  montant: string;
  referenceJustificatif: string;
};

type FormErreurs = Partial<Record<keyof FormData, string>>;

export default function DepensesPage() {
  const { data: depenses, loading, error, refetch } = useDepenses();
  const utilisateur = useAuthStore((s) => s.utilisateur);

  const depensesList = depenses ?? [];

  const [modalOuverte, setModalOuverte] = useState(false);
  const [filtreCategorie, setFiltreCategorie] = useState('');
  const [filtreDebut, setFiltreDebut] = useState('');
  const [filtreFin, setFiltreFin] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormData>({
    date: '',
    categorie: '',
    motif: '',
    beneficiaire: '',
    montant: '',
    referenceJustificatif: '',
  });
  const [erreurs, setErreurs] = useState<FormErreurs>({});

  // Tri par date décroissante puis filtrage
  const depensesFiltrees = useMemo(() => {
    return [...depensesList]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .filter((d) => {
        const matchCategorie = filtreCategorie === '' || d.categorie === filtreCategorie;
        const matchDebut = filtreDebut === '' || d.date >= filtreDebut;
        const matchFin = filtreFin === '' || d.date <= filtreFin;
        return matchCategorie && matchDebut && matchFin;
      });
  }, [depensesList, filtreCategorie, filtreDebut, filtreFin]);

  // Total par catégorie sur la liste filtrée
  const totauxParCategorie = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of depensesFiltrees) {
      map.set(d.categorie, (map.get(d.categorie) ?? 0) + d.montant);
    }
    return map;
  }, [depensesFiltrees]);

  const totalGeneral = useMemo(
    () => depensesFiltrees.reduce((acc, d) => acc + d.montant, 0),
    [depensesFiltrees]
  );

  function validerForm(): boolean {
    const nouvellesErreurs: FormErreurs = {};
    if (!form.date) nouvellesErreurs.date = 'La date est obligatoire';
    if (!form.categorie) nouvellesErreurs.categorie = 'La catégorie est obligatoire';
    if (!form.motif.trim()) nouvellesErreurs.motif = 'Le motif est obligatoire';
    if (!form.beneficiaire.trim())
      nouvellesErreurs.beneficiaire = 'Le bénéficiaire est obligatoire';
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
      await depensesApi.creer({
        date: form.date,
        categorie: form.categorie as CategorieDepense,
        motif: form.motif.trim(),
        beneficiaire: form.beneficiaire.trim(),
        montant: Number(form.montant),
        agentId: utilisateur.id,
        ...(form.referenceJustificatif.trim()
          ? { referenceJustificatif: form.referenceJustificatif.trim() }
          : {}),
      });
      reinitialiserForm();
      setModalOuverte(false);
      refetch();
    } catch (err) {
      setErreurs({ montant: err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement' });
    } finally {
      setSubmitting(false);
    }
  }

  function reinitialiserForm() {
    setForm({
      date: '',
      categorie: '',
      motif: '',
      beneficiaire: '',
      montant: '',
      referenceJustificatif: '',
    });
    setErreurs({});
  }

  function fermerModal() {
    reinitialiserForm();
    setModalOuverte(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#172B4D]">Dépenses</h1>
        <Button onClick={() => setModalOuverte(true)} variant="primary">
          + Nouvelle dépense
        </Button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            id="filtreCategorie"
            label="Catégorie"
            options={CATEGORIES_FILTRE_OPTIONS}
            value={filtreCategorie}
            onChange={(e) => setFiltreCategorie(e.target.value)}
          />
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
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Bénéficiaire</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">Réf. justificatif</th>
              </tr>
            </thead>
            <tbody>
              {depensesFiltrees.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-[#172B4D]">
                    {formatDate(d.date)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.categorie}</td>
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {d.motif}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.beneficiaire}</td>
                  <td className="px-4 py-3 font-semibold text-[#DC2626] whitespace-nowrap">
                    {formatGNF(d.montant)}
                  </td>
                  <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                    {d.referenceJustificatif ?? '—'}
                  </td>
                </tr>
              ))}
              {depensesFiltrees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                    Aucune dépense trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Total par catégorie */}
      {depensesFiltrees.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-3">
            Total par catégorie
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(totauxParCategorie.entries()).map(([categorie, total]) => (
              <div
                key={categorie}
                className="flex items-center justify-between rounded-lg bg-[#F5F7F6] border border-[#E2E8F0] px-4 py-3"
              >
                <span className="text-sm text-gray-600">{categorie}</span>
                <span className="text-sm font-semibold text-[#176B45]">
                  {formatGNF(total)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end border-t border-[#E2E8F0] pt-3">
            <span className="text-sm font-semibold text-[#172B4D]">
              Total général :&nbsp;
              <span className="text-[#176B45]">{formatGNF(totalGeneral)}</span>
            </span>
          </div>
        </div>
      )}

      {/* Modal saisie dépense */}
      <Modal isOpen={modalOuverte} onClose={fermerModal} title="Nouvelle dépense">
        <form onSubmit={soumettreFormulaire} noValidate className="space-y-4">
          <Input
            id="dep-date"
            label="Date *"
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            erreur={erreurs.date}
          />

          <Select
            id="dep-categorie"
            label="Catégorie *"
            options={CATEGORIES_FORM_OPTIONS}
            value={form.categorie}
            onChange={(e) => setForm((f) => ({ ...f, categorie: e.target.value }))}
            erreur={erreurs.categorie}
          />

          <Input
            id="dep-motif"
            label="Motif *"
            type="text"
            placeholder="Objet de la dépense"
            value={form.motif}
            onChange={(e) => setForm((f) => ({ ...f, motif: e.target.value }))}
            erreur={erreurs.motif}
          />

          <Input
            id="dep-beneficiaire"
            label="Bénéficiaire *"
            type="text"
            placeholder="Nom du bénéficiaire"
            value={form.beneficiaire}
            onChange={(e) => setForm((f) => ({ ...f, beneficiaire: e.target.value }))}
            erreur={erreurs.beneficiaire}
          />

          <Input
            id="dep-montant"
            label="Montant GNF *"
            type="number"
            min="1"
            placeholder="0"
            value={form.montant}
            onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
            erreur={erreurs.montant}
          />

          <Input
            id="dep-reference"
            label="Référence pièce justificative"
            type="text"
            placeholder="N° de facture ou bon (optionnel)"
            value={form.referenceJustificatif}
            onChange={(e) =>
              setForm((f) => ({ ...f, referenceJustificatif: e.target.value }))
            }
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[#172B4D]">Agent saisisseur</label>
            <input
              readOnly
              value={utilisateur ? `${utilisateur.prenom} ${utilisateur.nom}` : '—'}
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
