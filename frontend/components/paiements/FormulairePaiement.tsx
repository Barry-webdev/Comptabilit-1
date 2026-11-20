'use client';

import { useState, useMemo } from 'react';
import { useEleves } from '@/hooks/useEleves';
import { usePaiements } from '@/hooks/usePaiements';
import { useFrais } from '@/hooks/useFrais';
import { paiementsApi, type IRecu, type IEleve } from '@/lib/api';
import { formatGNF, calculerSoldeRestant } from '@/lib/utils';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import ApercuRecu from '@/components/recus/ApercuRecu';

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
  onRefetch?: () => void;
};

const TRANCHES = [
  { value: 'tranche1', label: '1ère Tranche' },
  { value: 'tranche2', label: '2ème Tranche' },
  { value: 'tranche3', label: '3ème Tranche' },
];

type Etape = 'saisie' | 'confirmation' | 'recu';

export default function FormulairePaiement({ onSuccess, onCancel, onRefetch }: Props) {
  const { data: elevesData } = useEleves();
  const { data: paiementsData } = usePaiements();
  const { data: fraisData } = useFrais();

  const eleves = elevesData ?? [];
  const paiements = paiementsData ?? [];
  const fraisParClasse = fraisData ?? [];

  const [etape, setEtape] = useState<Etape>('saisie');
  const [recherche, setRecherche] = useState('');
  const [eleveSelectionne, setEleveSelectionne] = useState<IEleve | null>(null);
  const [tranche, setTranche] = useState('tranche1');
  const [montantSaisi, setMontantSaisi] = useState('');
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [recuGenere, setRecuGenere] = useState<IRecu | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [erreurApi, setErreurApi] = useState<string | null>(null);

  // Suggestions de recherche
  const suggestions = useMemo(() => {
    if (!recherche.trim() || eleveSelectionne) return [];
    const q = recherche.toLowerCase();
    return eleves
      .filter(
        (e) =>
          e.matricule.toLowerCase().includes(q) ||
          e.nom.toLowerCase().includes(q) ||
          e.prenom.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [recherche, eleveSelectionne, eleves]);

  const frais = eleveSelectionne
    ? fraisParClasse.find(
        (f) =>
          f.classeId === eleveSelectionne.classeId &&
          f.anneeScolaireId === eleveSelectionne.anneeScolaireId
      )
    : null;

  const montantTranche = frais
    ? (tranche === 'tranche1' ? frais.t1Montant : tranche === 'tranche2' ? frais.t2Montant : frais.t3Montant)
    : 0;

  const dejaVerse = eleveSelectionne
    ? paiements
        .filter(
          (p) =>
            p.eleveId === eleveSelectionne.id &&
            p.tranche === tranche &&
            p.anneeScolaireId === eleveSelectionne.anneeScolaireId
        )
        .reduce((acc, p) => acc + p.montant, 0)
    : 0;

  const soldeRestant = eleveSelectionne
    ? calculerSoldeRestant(
        eleveSelectionne.id,
        tranche,
        eleveSelectionne.anneeScolaireId,
        paiements,
        fraisParClasse,
        eleveSelectionne.classeId
      )
    : 0;

  const montant = parseFloat(montantSaisi);
  const soldeApres = isNaN(montant) ? soldeRestant : Math.max(0, soldeRestant - montant);
  const libelleTrancheSelectionne = TRANCHES.find((t) => t.value === tranche)?.label ?? tranche;

  // Vérifier si la tranche précédente est soldée
  const soldePrecedente: { bloque: boolean; libelle: string; restant: number } = (() => {
    if (!eleveSelectionne || !frais) return { bloque: false, libelle: '', restant: 0 };
    if (tranche === 'tranche1') return { bloque: false, libelle: '', restant: 0 };
    const tranchePrecedente = tranche === 'tranche2' ? 'tranche1' : 'tranche2';
    const libellePrecedente = tranche === 'tranche2' ? '1ère Tranche' : '2ème Tranche';
    const restantPrecedente = calculerSoldeRestant(
      eleveSelectionne.id,
      tranchePrecedente,
      eleveSelectionne.anneeScolaireId,
      paiements,
      fraisParClasse,
      eleveSelectionne.classeId
    );
    return { bloque: restantPrecedente > 0, libelle: libellePrecedente, restant: restantPrecedente };
  })();

  // Reste annuel (toutes tranches)
  const totalAnnuel = frais ? frais.totalAnnuel : 0;
  const totalPayeAnnee = eleveSelectionne
    ? paiements
        .filter((p) => p.eleveId === eleveSelectionne.id && p.anneeScolaireId === eleveSelectionne.anneeScolaireId)
        .reduce((acc, p) => acc + p.montant, 0)
    : 0;
  const resteAnnuel = Math.max(0, totalAnnuel - totalPayeAnnee);
  const resteAnnuelApres = isNaN(montant) ? resteAnnuel : Math.max(0, resteAnnuel - montant);

  function selectionnerEleve(e: IEleve) {
    setEleveSelectionne(e);
    setRecherche(`${e.prenom} ${e.nom} — ${e.matricule}`);
  }

  function valider(): boolean {
    const nouvellesErreurs: Record<string, string> = {};
    if (!eleveSelectionne) nouvellesErreurs.recherche = 'Veuillez sélectionner un élève';
    if (eleveSelectionne) {
      if (soldePrecedente.bloque) {
        nouvellesErreurs.montant = `La ${soldePrecedente.libelle} n'est pas encore soldée. Veuillez d'abord régler les ${formatGNF(soldePrecedente.restant)} restants.`;
      } else if (!montantSaisi.trim() || isNaN(montant) || montant <= 0) {
        nouvellesErreurs.montant = 'Le montant doit être supérieur à zéro';
      } else if (frais && soldeRestant > 0 && montant > soldeRestant) {
        nouvellesErreurs.montant = `Le montant dépasse le solde restant de ${formatGNF(soldeRestant)}`;
      } else if (frais && soldeRestant === 0 && dejaVerse > 0) {
        nouvellesErreurs.montant = 'Cette tranche est déjà soldée pour cet élève';
      }
    }
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  }

  function demanderConfirmation(e: React.FormEvent) {
    e.preventDefault();
    if (valider()) setEtape('confirmation');
  }

  async function confirmerEtEnregistrer() {
    if (!eleveSelectionne) return;
    setEnCours(true);
    setErreurApi(null);
    try {
      const result = await paiementsApi.creerAvecRecu({
        eleveId: eleveSelectionne.id,
        tranche,
        montant,
        anneeScolaireId: eleveSelectionne.anneeScolaireId,
      });
      setRecuGenere(result.recu);
      onRefetch?.();
      setEtape('recu');
    } catch (err) {
      setErreurApi(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
    } finally {
      setEnCours(false);
    }
  }

  // ── Étape 3 : aperçu du reçu ────────────────────────────────────────
  if (etape === 'recu' && recuGenere && eleveSelectionne) {
    return (
      <ApercuRecu
        recu={recuGenere}
        eleve={eleveSelectionne}
        onFermer={onSuccess}
      />
    );
  }

  // ── Étape 2 : confirmation avant enregistrement ─────────────────────
  if (etape === 'confirmation' && eleveSelectionne) {
    return (
      <div className="space-y-5">
        <div className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <span className="text-amber-500 text-lg mt-0.5">⚠</span>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Vérifiez avant de confirmer
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Une fois confirmé, le paiement sera enregistré et un reçu sera généré. Cette action ne peut pas être annulée.
            </p>
          </div>
        </div>

        {erreurApi && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {erreurApi}
          </div>
        )}

        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-[#1B6B3A] px-4 py-3">
            <p className="text-white font-semibold text-sm">Récapitulatif du paiement</p>
          </div>
          <div className="divide-y divide-gray-100 bg-white">
            <LigneRecap label="Élève"                   value={`${eleveSelectionne.prenom} ${eleveSelectionne.nom}`} />
            <LigneRecap label="Matricule"                value={eleveSelectionne.matricule} mono />
            <LigneRecap label="Tranche"                  value={libelleTrancheSelectionne} />
            <LigneRecap label="Montant de la tranche"    value={formatGNF(montantTranche)} />
            <LigneRecap label="Déjà versé"               value={formatGNF(dejaVerse)} />
            <LigneRecap label="Solde avant paiement"     value={formatGNF(soldeRestant)} emphasis="danger" />
            <LigneRecap label="Montant versé maintenant" value={formatGNF(montant)} emphasis="success" bold />
            <LigneRecap label="Reste sur la tranche"     value={formatGNF(soldeApres)} emphasis={soldeApres === 0 ? 'success' : 'danger'} />
            <LigneRecap label="Reste annuel après"       value={formatGNF(resteAnnuelApres)} emphasis={resteAnnuelApres === 0 ? 'success' : 'danger'} />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={() => setEtape('saisie')} disabled={enCours}>
            ← Modifier
          </Button>
          <Button onClick={confirmerEtEnregistrer} disabled={enCours}>
            {enCours ? 'Enregistrement…' : '✓ Confirmer et enregistrer'}
          </Button>
        </div>
      </div>
    );
  }

  // ── Étape 1 : formulaire de saisie ──────────────────────────────────
  return (
    <form onSubmit={demanderConfirmation} className="space-y-5">
      <div className="relative">
        <Input
          id="rechercheEleve"
          label="Rechercher un élève"
          placeholder="Nom, prénom ou matricule (ex : AB10145831)…"
          value={recherche}
          onChange={(e) => {
            setRecherche(e.target.value);
            setEleveSelectionne(null);
          }}
          erreur={erreurs.recherche}
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#1B6B3A]/5 transition-colors"
                  onClick={() => selectionnerEleve(e)}
                >
                  <span className="font-medium text-gray-900">{e.prenom} {e.nom}</span>
                  <span className="ml-2 font-mono text-xs text-gray-400">{e.matricule}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Select
        id="tranche"
        label="Tranche"
        options={TRANCHES}
        value={tranche}
        onChange={(e) => setTranche(e.target.value)}
      />

      {eleveSelectionne && frais && (
        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm border border-gray-100">
          <div className="flex justify-between">
            <span className="text-gray-500">Montant total de la tranche</span>
            <span className="font-medium">{formatGNF(montantTranche)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Déjà versé</span>
            <span className="font-medium text-green-700">{formatGNF(dejaVerse)}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-1.5 mt-1">
            <span className="font-medium text-gray-700">Solde restant</span>
            <span className="font-bold text-red-600">{formatGNF(soldeRestant)}</span>
          </div>
        </div>
      )}

      {eleveSelectionne && soldePrecedente.bloque && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <span className="text-[#DC2626] text-lg mt-0.5">⛔</span>
          <div>
            <p className="text-sm font-semibold text-[#DC2626]">
              {soldePrecedente.libelle} non soldée
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Il reste <strong>{formatGNF(soldePrecedente.restant)}</strong> à payer sur la {soldePrecedente.libelle} avant de passer à la tranche suivante.
            </p>
          </div>
        </div>
      )}

      <Input
        id="montant"
        label="Montant versé (GNF)"
        type="number"
        min="1"
        step="1"
        placeholder="Ex : 300 000"
        value={montantSaisi}
        onChange={(e) => setMontantSaisi(e.target.value)}
        erreur={erreurs.montant}
        disabled={!eleveSelectionne}
      />

      <div className="flex justify-end gap-3 pt-1">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={!eleveSelectionne}>
          Vérifier →
        </Button>
      </div>
    </form>
  );
}

function LigneRecap({
  label,
  value,
  mono,
  emphasis,
  bold,
}: {
  label: string;
  value: string;
  mono?: boolean;
  emphasis?: 'success' | 'danger';
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 gap-6">
      <span className="text-xs text-gray-500 shrink-0">{label}</span>
      <span className={[
        'text-sm text-right',
        mono ? 'font-mono' : '',
        bold ? 'font-bold text-base' : 'font-semibold',
        emphasis === 'success' ? 'text-green-600' : '',
        emphasis === 'danger' ? 'text-red-600' : 'text-gray-800',
      ].filter(Boolean).join(' ')}>
        {value}
      </span>
    </div>
  );
}
