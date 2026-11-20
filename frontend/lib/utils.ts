import type { IPaiement, IFrais, IEleve } from '@/lib/api';

/**
 * Formate un montant en Franc Guinéen.
 * Ex. : 1500000 → "1 500 000 GNF"
 */
export function formatGNF(montant: number): string {
  return (
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(montant) + ' GNF'
  );
}

/**
 * Formate une date en DD/MM/YYYY.
 * Ex. : "2025-01-15" → "15/01/2025"
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const jour = String(d.getDate()).padStart(2, '0');
  const mois = String(d.getMonth() + 1).padStart(2, '0');
  const annee = d.getFullYear();
  return `${jour}/${mois}/${annee}`;
}

/**
 * Formate une date avec l'heure.
 * Ex. : "2025-01-15T14:30:00" → "15/01/2025 à 14:30"
 */
export function formatDateHeure(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const partie = formatDate(d);
  const heures = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${partie} à ${heures}:${minutes}`;
}

function getMontantTranche(frais: IFrais, tranche: string): number {
  if (tranche === 'tranche1') return frais.t1Montant ?? frais.tranche1?.montant ?? 0;
  if (tranche === 'tranche2') return frais.t2Montant ?? frais.tranche2?.montant ?? 0;
  return frais.t3Montant ?? frais.tranche3?.montant ?? 0;
}

/**
 * Calcule le solde restant pour un élève sur une tranche donnée.
 * Retourne le montant de la tranche moins la somme des paiements déjà enregistrés.
 */
export function calculerSoldeRestant(
  eleveId: string,
  tranche: string,
  anneeScolaireId: string,
  paiements: IPaiement[],
  fraisParClasse: IFrais[],
  classeId: string
): number {
  const frais = fraisParClasse.find(
    (f) => f.classeId === classeId && f.anneeScolaireId === anneeScolaireId
  );
  if (!frais) return 0;

  const montantTranche = getMontantTranche(frais, tranche);

  const totalPaye = paiements
    .filter(
      (p) =>
        p.eleveId === eleveId &&
        p.tranche === tranche &&
        p.anneeScolaireId === anneeScolaireId
    )
    .reduce((acc, p) => acc + p.montant, 0);

  return Math.max(0, montantTranche - totalPaye);
}

/**
 * Calcule le taux de recouvrement global en pourcentage.
 * Somme des paiements / (nombre d'élèves × frais annuels de leur classe).
 */
export function calculerTauxRecouvrement(
  paiements: IPaiement[],
  fraisParClasse: IFrais[],
  eleves: IEleve[]
): number {
  if (eleves.length === 0) return 0;

  const totalAttendu = eleves.reduce((acc, eleve) => {
    const frais = fraisParClasse.find(
      (f) =>
        f.classeId === eleve.classeId &&
        f.anneeScolaireId === eleve.anneeScolaireId
    );
    return acc + (frais ? frais.totalAnnuel : 0);
  }, 0);

  if (totalAttendu === 0) return 0;

  const totalRecu = paiements.reduce((acc, p) => acc + p.montant, 0);

  return Math.min(100, Math.round((totalRecu / totalAttendu) * 100));
}
