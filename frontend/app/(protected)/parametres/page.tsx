'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useAnneesScolaires, useClasses, useFrais } from '@/hooks';
import { anneesApi, classesApi, fraisApi, utilisateursApi, type IAnneeScolaire, type IClasse, type IFrais, type IUtilisateur } from '@/lib/api';
import { useUtilisateurs } from '@/hooks/useUtilisateurs';
import { formatGNF } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
// ── Types locaux ─────────────────────────────────────────────────────────────

type Onglet = 'annees' | 'classes' | 'frais' | 'utilisateurs';

// ── Composant principal ───────────────────────────────────────────────────────

export default function ParametresPage() {
  const router = useRouter();
  const role = useAuthStore((s) => s.role);
  const [ongletActif, setOngletActif] = useState<Onglet>('annees');

  useEffect(() => {
    if (role !== 'administratrice') {
      router.replace('/dashboard');
    }
  }, [role, router]);

  if (role !== 'administratrice') return null;

  const onglets: { id: Onglet; label: string }[] = [
    { id: 'annees', label: 'Années scolaires' },
    { id: 'classes', label: 'Classes' },
    { id: 'frais', label: 'Frais scolaires' },
    { id: 'utilisateurs', label: 'Utilisateurs' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#172B4D]">
        Paramètres
      </h1>

      {/* Navigation par onglets */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E8F0] shadow-sm w-full overflow-x-auto">
        {onglets.map((o) => (
          <button
            key={o.id}
            onClick={() => setOngletActif(o.id)}
            className={`flex-1 min-w-max px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none whitespace-nowrap ${
              ongletActif === o.id
                ? 'bg-[#172B4D] text-white shadow-sm'
                : 'text-[#64748B] hover:text-[#172B4D] hover:bg-[#F5F7F6]'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6">
        {ongletActif === 'annees' && <OngletAnnees />}
        {ongletActif === 'classes' && <OngletClasses />}
        {ongletActif === 'frais' && <OngletFrais />}
        {ongletActif === 'utilisateurs' && <OngletUtilisateurs />}
      </div>
    </div>
  );
}

// ── Onglet 1 : Années scolaires ───────────────────────────────────────────────

function OngletAnnees() {
  const { data: anneesScolaires, loading, error, refetch: refetchAnnees } = useAnneesScolaires();
  const anneesScolairesList = anneesScolaires ?? [];

  const [modalOuverte, setModalOuverte] = useState(false);
  const [anneeDebut, setAnneeDebut] = useState('');
  const [erreurNom, setErreurNom] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nomGenere = anneeDebut ? `${anneeDebut}-${Number(anneeDebut) + 1}` : '';

  const derniereAnnee = anneesScolairesList.at(-1)?.nom ?? '';
  const suggestion = derniereAnnee
    ? String(Number(derniereAnnee.split('-')[0]) + 1)
    : String(new Date().getFullYear());

  async function soumettre() {
    if (!anneeDebut.trim() || isNaN(Number(anneeDebut)) || anneeDebut.length !== 4) {
      setErreurNom("Entrez une année valide sur 4 chiffres (ex. : 2026).");
      return;
    }
    if (anneesScolairesList.some((a) => a.nom === nomGenere)) {
      setErreurNom(`L'année ${nomGenere} existe déjà.`);
      return;
    }
    setSubmitting(true);
    try {
      await anneesApi.creer({ nom: nomGenere, statut: 'cloturee' });
      setAnneeDebut('');
      setErreurNom('');
      setModalOuverte(false);
      refetchAnnees();
    } catch (e) {
      setErreurNom(e instanceof Error ? e.message : 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  async function activerAnnee(id: string) {
    try {
      await anneesApi.activer(id);
      refetchAnnees();
    } catch {
      // silently fail – the row stays as-is
    }
  }

  async function cloturerAnnee(id: string) {
    try {
      await anneesApi.cloturer(id);
      refetchAnnees();
    } catch {
      // silently fail
    }
  }

  function fermer() {
    setAnneeDebut('');
    setErreurNom('');
    setModalOuverte(false);
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#172B4D]">Années scolaires</h2>
        <Button size="sm" onClick={() => setModalOuverte(true)}>
          + Nouvelle année
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#172B4D] text-white text-xs font-semibold uppercase tracking-wide text-left">
              <th className="px-4 py-3 rounded-tl-lg">Année scolaire</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {anneesScolairesList.map((a) => (
              <tr
                key={a.id}
                className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F5F7F6] transition-colors"
              >
                <td className="px-4 py-3 font-semibold text-[#172B4D]">{a.nom}</td>
                <td className="px-4 py-3">
                  {a.statut === 'active' ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Badge variant="neutral">Inactive</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right flex justify-end gap-2">
                  {a.statut === 'cloturee' && (
                    <Button variant="secondary" size="sm" onClick={() => activerAnnee(a.id)}>
                      Activer
                    </Button>
                  )}
                  {a.statut === 'active' && (
                    <Button variant="danger" size="sm" onClick={() => cloturerAnnee(a.id)}>
                      Clôturer
                    </Button>
                  )}
                </td>
              </tr>
            ))}
            {anneesScolairesList.length === 0 && (
              <tr>
                <td colSpan={3} className="py-6 text-center text-[#64748B]">Aucune année scolaire</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOuverte} onClose={fermer} title="Nouvelle année scolaire">
        <div className="space-y-4">
          {/* Info */}
          <div className="bg-[#F5F7F6] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#64748B]">
            L&apos;année sera créée comme <strong>inactive</strong>. Vous pourrez l&apos;activer ensuite depuis la liste.
          </div>

          {/* Champ année de début */}
          <div>
            <label className="block text-sm font-medium text-[#172B4D] mb-1.5">
              Année de début
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="number"
                min="2020"
                max="2050"
                placeholder={suggestion}
                value={anneeDebut}
                onChange={(e) => {
                  setAnneeDebut(e.target.value);
                  if (erreurNom) setErreurNom('');
                }}
                className="w-32 px-3 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#172B4D] focus:outline-none focus:ring-2 focus:ring-[#176B45] focus:border-transparent"
              />
              {nomGenere && (
                <span className="text-sm font-bold text-[#176B45] bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                  → {nomGenere}
                </span>
              )}
            </div>
            {erreurNom && <p className="mt-1 text-xs text-[#DC2626]">{erreurNom}</p>}
            <p className="mt-1 text-xs text-[#64748B]">
              Entrez l&apos;année de début (ex. : <strong>2026</strong>) → l&apos;année <strong>2026-2027</strong> sera créée automatiquement.
            </p>
          </div>

          {/* Suggestion rapide */}
          {suggestion && (
            <button
              type="button"
              onClick={() => { setAnneeDebut(suggestion); setErreurNom(''); }}
              className="text-xs text-[#176B45] underline hover:no-underline"
            >
              Utiliser la suggestion : {suggestion}-{Number(suggestion) + 1}
            </button>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={fermer}>Annuler</Button>
            <Button onClick={soumettre} disabled={!nomGenere || submitting}>
              {submitting ? 'Création…' : `Créer ${nomGenere}`}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Onglet 2 : Classes ────────────────────────────────────────────────────────

function OngletClasses() {
  const { data: classes, loading, error, refetch: refetchClasses } = useClasses();
  const classesList = classes ?? [];

  const [modalAjout, setModalAjout] = useState(false);
  const [modalModif, setModalModif] = useState(false);
  const [classeEnCours, setClasseEnCours] = useState<IClasse | null>(null);
  const [libelle, setLibelle] = useState('');
  const [erreurLibelle, setErreurLibelle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function ouvrirAjout() {
    setLibelle('');
    setErreurLibelle('');
    setModalAjout(true);
  }

  function ouvrirModif(c: IClasse) {
    setClasseEnCours(c);
    setLibelle(c.libelle);
    setErreurLibelle('');
    setModalModif(true);
  }

  function fermerAjout() {
    setLibelle('');
    setErreurLibelle('');
    setModalAjout(false);
  }

  function fermerModif() {
    setClasseEnCours(null);
    setLibelle('');
    setErreurLibelle('');
    setModalModif(false);
  }

  async function soumettreAjout() {
    if (!libelle.trim()) {
      setErreurLibelle('Le libellé est requis.');
      return;
    }
    if (classesList.some((c) => c.libelle.toLowerCase() === libelle.trim().toLowerCase())) {
      setErreurLibelle('Cette classe existe déjà.');
      return;
    }
    setSubmitting(true);
    try {
      await classesApi.creer({ libelle: libelle.trim() });
      fermerAjout();
      refetchClasses();
    } catch (e) {
      setErreurLibelle(e instanceof Error ? e.message : 'Erreur lors de l\'ajout');
    } finally {
      setSubmitting(false);
    }
  }

  async function soumettreModif() {
    if (!libelle.trim()) {
      setErreurLibelle('Le libellé est requis.');
      return;
    }
    if (!classeEnCours) return;
    setSubmitting(true);
    try {
      await classesApi.modifier(classeEnCours.id, { libelle: libelle.trim() });
      fermerModif();
      refetchClasses();
    } catch (e) {
      setErreurLibelle(e instanceof Error ? e.message : 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#172B4D]">
          Classes
        </h2>
        <Button
          size="sm"
          onClick={ouvrirAjout}
          className="!bg-[#176B45] hover:!bg-[#155530]"
        >
          + Ajouter une classe
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#172B4D] text-white text-xs font-semibold uppercase tracking-wide text-left">
              <th className="px-4 py-3 rounded-tl-lg">Libellé</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classesList.map((c) => (
              <tr
                key={c.id}
                className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F5F7F6] transition-colors"
              >
                <td className="px-4 py-3 font-medium text-[#172B4D]">
                  {c.libelle}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" size="sm" onClick={() => ouvrirModif(c)}>
                    Modifier
                  </Button>
                </td>
              </tr>
            ))}
            {classesList.length === 0 && (
              <tr>
                <td colSpan={2} className="py-6 text-center text-[#64748B]">
                  Aucune classe
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Ajouter */}
      <Modal isOpen={modalAjout} onClose={fermerAjout} title="Ajouter une classe">
        <div className="space-y-4">
          <Input
            id="libelleAjout"
            label="Libellé"
            placeholder="ex. : 7ème Année"
            value={libelle}
            onChange={(e) => {
              setLibelle(e.target.value);
              if (erreurLibelle) setErreurLibelle('');
            }}
            erreur={erreurLibelle}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={fermerAjout}>
              Annuler
            </Button>
            <Button onClick={soumettreAjout} disabled={submitting} className="!bg-[#176B45] hover:!bg-[#155530]">
              {submitting ? 'Ajout…' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Modifier */}
      <Modal isOpen={modalModif} onClose={fermerModif} title="Modifier la classe">
        <div className="space-y-4">
          <Input
            id="libelleModif"
            label="Libellé"
            value={libelle}
            onChange={(e) => {
              setLibelle(e.target.value);
              if (erreurLibelle) setErreurLibelle('');
            }}
            erreur={erreurLibelle}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={fermerModif}>
              Annuler
            </Button>
            <Button onClick={soumettreModif} disabled={submitting} className="!bg-[#176B45] hover:!bg-[#155530]">
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Onglet 3 : Frais scolaires ────────────────────────────────────────────────

type FormFrais = {
  t1Montant: string;
  t1Date: string;
  t2Montant: string;
  t2Date: string;
  t3Montant: string;
  t3Date: string;
};

function OngletFrais() {
  const { data: anneesScolaires } = useAnneesScolaires();
  const { data: classes } = useClasses();
  const anneesScolairesList = anneesScolaires ?? [];
  const classesList = classes ?? [];

  const anneeActive = anneesScolairesList.find((a) => a.statut === 'active');
  const [anneeSelectionnee, setAnneeSelectionnee] = useState('');
  const [erreurFrais, setErreurFrais] = useState<string | null>(null);

  // Sélectionner l'année active dès que les données sont chargées
  useEffect(() => {
    if (anneesScolairesList.length > 0 && !anneeSelectionnee) {
      const active = anneesScolairesList.find((a) => a.statut === 'active');
      setAnneeSelectionnee(active?.id ?? anneesScolairesList[0]?.id ?? '');
    }
  }, [anneesScolairesList, anneeSelectionnee]);

  const { data: fraisParClasse, refetch: refetchFrais } = useFrais(anneeSelectionnee || undefined);
  const fraisParClasseList = fraisParClasse ?? [];

  const [modalOuverte, setModalOuverte] = useState(false);
  const [fraisEnCours, setFraisEnCours] = useState<IFrais | null>(null);
  const [form, setForm] = useState<FormFrais>({
    t1Montant: '',
    t1Date: '',
    t2Montant: '',
    t2Date: '',
    t3Montant: '',
    t3Date: '',
  });
  const [erreurs, setErreurs] = useState<Partial<FormFrais>>({});
  const [submitting, setSubmitting] = useState(false);

  const optionsAnnees = anneesScolairesList.map((a) => ({
    value: a.id,
    label: a.nom,
  }));

  function fraisPourClasse(classeId: string): IFrais | undefined {
    return fraisParClasseList.find(
      (f) => f.classeId === classeId && f.anneeScolaireId === anneeSelectionnee
    );
  }

  function ouvrirModif(frais: IFrais | undefined, classeId: string) {
    const f: IFrais = frais ?? {
      id: '',
      classeId,
      anneeScolaireId: anneeSelectionnee,
      totalAnnuel: 0,
      t1Montant: 0,
      t1DateLimite: '',
      t2Montant: 0,
      t2DateLimite: '',
      t3Montant: 0,
      t3DateLimite: '',
      tranche1: { montant: 0, dateLimite: '' },
      tranche2: { montant: 0, dateLimite: '' },
      tranche3: { montant: 0, dateLimite: '' },
    };
    setFraisEnCours(f);
    setForm({
      t1Montant: String(f.t1Montant ?? f.tranche1?.montant ?? 0),
      t1Date: f.t1DateLimite ?? f.tranche1?.dateLimite ?? '',
      t2Montant: String(f.t2Montant ?? f.tranche2?.montant ?? 0),
      t2Date: f.t2DateLimite ?? f.tranche2?.dateLimite ?? '',
      t3Montant: String(f.t3Montant ?? f.tranche3?.montant ?? 0),
      t3Date: f.t3DateLimite ?? f.tranche3?.dateLimite ?? '',
    });
    setErreurs({});
    setModalOuverte(true);
  }

  function fermer() {
    setFraisEnCours(null);
    setModalOuverte(false);
  }

  function valider(): boolean {
    const e: Partial<FormFrais> = {};
    if (!form.t1Montant || isNaN(Number(form.t1Montant)) || Number(form.t1Montant) < 0)
      e.t1Montant = 'Montant invalide';
    if (!form.t1Date) e.t1Date = 'Date requise';
    if (!form.t2Montant || isNaN(Number(form.t2Montant)) || Number(form.t2Montant) < 0)
      e.t2Montant = 'Montant invalide';
    if (!form.t2Date) e.t2Date = 'Date requise';
    if (!form.t3Montant || isNaN(Number(form.t3Montant)) || Number(form.t3Montant) < 0)
      e.t3Montant = 'Montant invalide';
    if (!form.t3Date) e.t3Date = 'Date requise';
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function soumettre() {
    if (!fraisEnCours) return;
    if (!valider()) return;

    // S'assurer qu'on a bien une année scolaire sélectionnée
    const anneeScolaireId = fraisEnCours.anneeScolaireId || anneeSelectionnee;
    if (!anneeScolaireId) return;
    if (!fraisEnCours.classeId) return;

    const t1 = Number(form.t1Montant);
    const t2 = Number(form.t2Montant);
    const t3 = Number(form.t3Montant);

    setSubmitting(true);
    try {
      await fraisApi.enregistrer({
        classeId: fraisEnCours.classeId,
        anneeScolaireId,
        totalAnnuel: t1 + t2 + t3,
        t1Montant: t1,
        t1DateLimite: form.t1Date,
        t2Montant: t2,
        t2DateLimite: form.t2Date,
        t3Montant: t3,
        t3DateLimite: form.t3Date,
      });
      fermer();
      refetchFrais();
    } catch (e) {
      console.error('Erreur enregistrement frais:', e);
    } finally {
      setSubmitting(false);
    }
  }

  function champ(key: keyof FormFrais, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (erreurs[key]) setErreurs((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-base font-semibold text-[#172B4D]">
          Frais scolaires
        </h2>
        <div className="w-full sm:w-56">
          <Select
            id="anneeSelect"
            label="Année scolaire"
            options={optionsAnnees}
            value={anneeSelectionnee}
            onChange={(e) => setAnneeSelectionnee(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="bg-[#172B4D] text-white text-xs font-semibold uppercase tracking-wide text-left">
              <th className="px-4 py-3 rounded-tl-lg">Classe</th>
              <th className="px-4 py-3">Total annuel</th>
              <th className="px-4 py-3">Tranche 1</th>
              <th className="px-4 py-3">Tranche 2</th>
              <th className="px-4 py-3">Tranche 3</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {classesList.map((c) => {
              const f = fraisPourClasse(c.id);
              return (
                <tr
                  key={c.id}
                  className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {c.libelle}
                  </td>
                  <td className="px-4 py-3 text-[#172B4D]">
                    {f ? formatGNF(f.totalAnnuel) : '–'}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">
                    {f ? (
                      <span>
                        {formatGNF(f.t1Montant)}
                        <br />
                        <span className="text-xs text-[#64748B]">{f.t1DateLimite}</span>
                      </span>
                    ) : ('–')}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">
                    {f ? (
                      <span>
                        {formatGNF(f.t2Montant)}
                        <br />
                        <span className="text-xs text-[#64748B]">{f.t2DateLimite}</span>
                      </span>
                    ) : ('–')}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">
                    {f ? (
                      <span>
                        {formatGNF(f.t3Montant)}
                        <br />
                        <span className="text-xs text-[#64748B]">{f.t3DateLimite}</span>
                      </span>
                    ) : ('–')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => ouvrirModif(f, c.id)}
                    >
                      Modifier
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOuverte}
        onClose={fermer}
        title="Modifier les frais"
      >
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#172B4D]">
            Tranche 1
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="t1Montant"
              label="Montant (GNF)"
              type="number"
              min="0"
              value={form.t1Montant}
              onChange={(e) => champ('t1Montant', e.target.value)}
              erreur={erreurs.t1Montant}
            />
            <Input
              id="t1Date"
              label="Date limite"
              type="date"
              value={form.t1Date}
              onChange={(e) => champ('t1Date', e.target.value)}
              erreur={erreurs.t1Date}
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-[#172B4D]">
            Tranche 2
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="t2Montant"
              label="Montant (GNF)"
              type="number"
              min="0"
              value={form.t2Montant}
              onChange={(e) => champ('t2Montant', e.target.value)}
              erreur={erreurs.t2Montant}
            />
            <Input
              id="t2Date"
              label="Date limite"
              type="date"
              value={form.t2Date}
              onChange={(e) => champ('t2Date', e.target.value)}
              erreur={erreurs.t2Date}
            />
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-[#172B4D]">
            Tranche 3
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="t3Montant"
              label="Montant (GNF)"
              type="number"
              min="0"
              value={form.t3Montant}
              onChange={(e) => champ('t3Montant', e.target.value)}
              erreur={erreurs.t3Montant}
            />
            <Input
              id="t3Date"
              label="Date limite"
              type="date"
              value={form.t3Date}
              onChange={(e) => champ('t3Date', e.target.value)}
              erreur={erreurs.t3Date}
            />
          </div>

          {/* Total calculé */}
          <div className="rounded-lg px-4 py-3 text-sm font-medium bg-[#F5F7F6] border border-[#E2E8F0] text-[#172B4D]">
            Total annuel calculé :{' '}
            <span className="text-[#176B45]">
              {formatGNF(
                (Number(form.t1Montant) || 0) +
                  (Number(form.t2Montant) || 0) +
                  (Number(form.t3Montant) || 0)
              )}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={fermer}>
              Annuler
            </Button>
            <Button onClick={soumettre} disabled={submitting} className="!bg-[#176B45] hover:!bg-[#155530]">
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ── Onglet 4 : Utilisateurs ───────────────────────────────────────────────────

type FormUtilisateur = {
  nom: string;
  prenom: string;
  identifiant: string;
  role: 'administratrice' | 'comptable';
  motDePasse: string;
};

const FORM_UTILISATEUR_VIDE: FormUtilisateur = {
  nom: '',
  prenom: '',
  identifiant: '',
  role: 'comptable',
  motDePasse: '',
};

function OngletUtilisateurs() {
  const { data: utilisateurs, loading, refetch } = useUtilisateurs();

  const [modalCreation, setModalCreation] = useState(false);
  const [modalModif, setModalModif] = useState(false);
  const [utilisateurEnCours, setUtilisateurEnCours] = useState<IUtilisateur | null>(null);
  const [form, setForm] = useState<FormUtilisateur>(FORM_UTILISATEUR_VIDE);
  const [erreurs, setErreurs] = useState<Partial<FormUtilisateur>>({});
  const [submitting, setSubmitting] = useState(false);
  const [erreurApi, setErreurApi] = useState<string | null>(null);

  function ouvrirCreation() {
    setForm(FORM_UTILISATEUR_VIDE);
    setErreurs({});
    setErreurApi(null);
    setModalCreation(true);
  }

  function ouvrirModif(u: IUtilisateur) {
    setUtilisateurEnCours(u);
    setForm({ nom: u.nom, prenom: u.prenom, identifiant: u.identifiant, role: u.role, motDePasse: '' });
    setErreurs({});
    setErreurApi(null);
    setModalModif(true);
  }

  function fermerCreation() { setForm(FORM_UTILISATEUR_VIDE); setErreurs({}); setErreurApi(null); setModalCreation(false); }
  function fermerModif() { setUtilisateurEnCours(null); setForm(FORM_UTILISATEUR_VIDE); setErreurs({}); setErreurApi(null); setModalModif(false); }

  function champ<K extends keyof FormUtilisateur>(key: K, value: FormUtilisateur[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (erreurs[key]) setErreurs((prev) => ({ ...prev, [key]: undefined }));
  }

  function validerCreation(): boolean {
    const e: Partial<FormUtilisateur> = {};
    if (!form.nom.trim()) e.nom = 'Le nom est requis.';
    if (!form.prenom.trim()) e.prenom = 'Le prénom est requis.';
    if (!form.identifiant.trim()) e.identifiant = "L'identifiant est requis.";
    if (!form.motDePasse.trim()) e.motDePasse = 'Le mot de passe est requis.';
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  function validerModif(): boolean {
    const e: Partial<FormUtilisateur> = {};
    if (!form.nom.trim()) e.nom = 'Le nom est requis.';
    if (!form.prenom.trim()) e.prenom = 'Le prénom est requis.';
    if (!form.identifiant.trim()) e.identifiant = "L'identifiant est requis.";
    setErreurs(e);
    return Object.keys(e).length === 0;
  }

  async function soumettreCreation() {
    if (!validerCreation()) return;
    setSubmitting(true);
    setErreurApi(null);
    try {
      await utilisateursApi.creer({
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        identifiant: form.identifiant.trim(),
        motDePasse: form.motDePasse.trim(),
        role: form.role,
      });
      fermerCreation();
      refetch();
    } catch (e) {
      setErreurApi(e instanceof Error ? e.message : 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  }

  async function soumettreModif() {
    if (!validerModif() || !utilisateurEnCours) return;
    setSubmitting(true);
    setErreurApi(null);
    try {
      await utilisateursApi.modifier(utilisateurEnCours.id, {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        identifiant: form.identifiant.trim(),
        role: form.role,
        ...(form.motDePasse.trim() ? { motDePasse: form.motDePasse.trim() } : {}),
      });
      fermerModif();
      refetch();
    } catch (e) {
      setErreurApi(e instanceof Error ? e.message : 'Erreur lors de la modification');
    } finally {
      setSubmitting(false);
    }
  }

  const optionsRole = [
    { value: 'administratrice', label: 'Administratrice' },
    { value: 'comptable', label: 'Comptable' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[#172B4D]">Utilisateurs</h2>
        <Button size="sm" onClick={ouvrirCreation}>+ Créer un utilisateur</Button>
      </div>

      {loading && <p className="text-sm text-[#64748B]">Chargement…</p>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#172B4D] text-white text-xs font-semibold uppercase tracking-wide text-left">
              <th className="px-4 py-3 rounded-tl-lg">Nom</th>
              <th className="px-4 py-3">Prénom</th>
              <th className="px-4 py-3">Identifiant</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3 text-right rounded-tr-lg">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(utilisateurs ?? []).map((u) => (
              <tr key={u.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F5F7F6] transition-colors">
                <td className="px-4 py-3 font-medium text-[#172B4D]">{u.nom}</td>
                <td className="px-4 py-3 text-[#172B4D]">{u.prenom}</td>
                <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{u.identifiant}</td>
                <td className="px-4 py-3">
                  {u.role === 'administratrice' ? (
                    <Badge variant="info">Administratrice</Badge>
                  ) : (
                    <Badge variant="neutral">Comptable</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="secondary" size="sm" onClick={() => ouvrirModif(u)}>Modifier</Button>
                </td>
              </tr>
            ))}
            {!loading && (utilisateurs ?? []).length === 0 && (
              <tr><td colSpan={5} className="py-6 text-center text-[#64748B]">Aucun utilisateur</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Créer */}
      <Modal isOpen={modalCreation} onClose={fermerCreation} title="Créer un utilisateur">
        <div className="space-y-4">
          {erreurApi && <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erreurApi}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input id="usrNom" label="Nom" placeholder="Diallo" value={form.nom}
              onChange={(e) => champ('nom', e.target.value)} erreur={erreurs.nom} />
            <Input id="usrPrenom" label="Prénom" placeholder="Fatoumata" value={form.prenom}
              onChange={(e) => champ('prenom', e.target.value)} erreur={erreurs.prenom} />
          </div>
          <Input id="usrIdentifiant" label="Identifiant" placeholder="f.diallo" value={form.identifiant}
            onChange={(e) => champ('identifiant', e.target.value)} erreur={erreurs.identifiant} />
          <Select id="usrRole" label="Rôle" options={optionsRole} value={form.role}
            onChange={(e) => champ('role', e.target.value as 'administratrice' | 'comptable')} />
          <Input id="usrMotDePasse" label="Mot de passe" type="password" placeholder="••••••••"
            value={form.motDePasse} onChange={(e) => champ('motDePasse', e.target.value)}
            erreur={erreurs.motDePasse} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={fermerCreation}>Annuler</Button>
            <Button onClick={soumettreCreation} disabled={submitting}>{submitting ? 'Création…' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Modifier */}
      <Modal isOpen={modalModif} onClose={fermerModif} title="Modifier l'utilisateur">
        <div className="space-y-4">
          {erreurApi && <p className="text-sm text-[#DC2626] bg-red-50 border border-red-200 rounded-lg px-3 py-2">{erreurApi}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input id="modNom" label="Nom" value={form.nom}
              onChange={(e) => champ('nom', e.target.value)} erreur={erreurs.nom} />
            <Input id="modPrenom" label="Prénom" value={form.prenom}
              onChange={(e) => champ('prenom', e.target.value)} erreur={erreurs.prenom} />
          </div>
          <Input id="modIdentifiant" label="Identifiant" value={form.identifiant}
            onChange={(e) => champ('identifiant', e.target.value)} erreur={erreurs.identifiant} />
          <Select id="modRole" label="Rôle" options={optionsRole} value={form.role}
            onChange={(e) => champ('role', e.target.value as 'administratrice' | 'comptable')} />
          <Input id="modMotDePasse" label="Nouveau mot de passe (laisser vide pour conserver)"
            type="password" placeholder="••••••••" value={form.motDePasse}
            onChange={(e) => champ('motDePasse', e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={fermerModif}>Annuler</Button>
            <Button onClick={soumettreModif} disabled={submitting}>{submitting ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
