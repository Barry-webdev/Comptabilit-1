'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useEleve, useClasses, useAnneesScolaires, usePaiements, useRecus } from '@/hooks';
import { formatGNF, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const TRANCHES = [
  { key: 'tranche1', label: 'Tranche 1' },
  { key: 'tranche2', label: 'Tranche 2' },
  { key: 'tranche3', label: 'Tranche 3' },
] as const;

export default function FicheElevePage() {
  const { id } = useParams<{ id: string }>();
  const { data: eleve, loading } = useEleve(id);
  const { data: classes } = useClasses();
  const { data: anneesScolaires } = useAnneesScolaires();
  const { data: paiements } = usePaiements(eleve ? { eleveId: eleve.id } : undefined);
  const { data: recus } = useRecus(eleve ? { eleveId: eleve.id } : undefined);

  const classesList = classes ?? [];
  const anneesScolairesList = anneesScolaires ?? [];
  const paiementsList = paiements ?? [];
  const recusList = recus ?? [];

  if (loading) return <LoadingSpinner />;

  if (!eleve) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-lg font-semibold text-[#172B4D]">Élève introuvable</p>
        <Link href="/eleves">
          <Button variant="secondary">Retour à la liste</Button>
        </Link>
      </div>
    );
  }

  const classe = classesList.find((c) => c.id === eleve.classeId);
  const annee = anneesScolairesList.find((a) => a.id === eleve.anneeScolaireId);

  const paiementsEleve = paiementsList.filter(
    (p) => p.eleveId === eleve.id && p.anneeScolaireId === eleve.anneeScolaireId
  );

  // Calcul par tranche (sans frais disponibles depuis useEleve seul — montants à 0 si non fournis)
  type InfoTranche = {
    key: string;
    label: string;
    montantTotal: number;
    montantVerse: number;
    soldeRestant: number;
    pourcentage: number;
    statut: 'Soldé' | 'Partiel' | 'Non payé';
  };

  const infosTranches: InfoTranche[] = TRANCHES.map(({ key, label }) => {
    const montantTotal = 0; // frais non inclus dans useEleve — affiché à 0
    const montantVerse = paiementsEleve
      .filter((p) => p.tranche === key)
      .reduce((acc, p) => acc + p.montant, 0);
    const soldeRestant = Math.max(0, montantTotal - montantVerse);
    const pourcentage =
      montantTotal > 0
        ? Math.min(100, Math.round((montantVerse / montantTotal) * 100))
        : 0;

    let statut: 'Soldé' | 'Partiel' | 'Non payé';
    if (montantVerse === 0) statut = 'Non payé';
    else if (soldeRestant === 0) statut = 'Soldé';
    else statut = 'Partiel';

    return { key, label, montantTotal, montantVerse, soldeRestant, pourcentage, statut };
  });

  const totalVerse = paiementsEleve.reduce((acc, p) => acc + p.montant, 0);

  // Historique : reçus de cet élève
  const recusEleve = recusList
    .filter(
      (r) =>
        r.eleveId === eleve.id && r.anneeScolaireId === eleve.anneeScolaireId
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function libelleTrancheRecu(tranche: string): string {
    return TRANCHES.find((t) => t.key === tranche)?.label ?? tranche;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/eleves">
          <Button variant="ghost" size="sm">
            ← Retour
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-[#172B4D]">
          Fiche élève — {eleve.prenom} {eleve.nom}
        </h1>
      </div>

      {/* Informations personnelles */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-4">
          Informations personnelles
        </h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <dt className="text-xs text-[#64748B]">Matricule</dt>
            <dd className="font-mono text-sm font-medium text-[#172B4D] mt-0.5">
              {eleve.matricule}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748B]">Nom complet</dt>
            <dd className="text-sm font-medium text-[#172B4D] mt-0.5">
              {eleve.prenom} {eleve.nom}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748B]">Classe</dt>
            <dd className="text-sm font-medium text-[#172B4D] mt-0.5">
              {classe?.libelle ?? eleve.classeId}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748B]">Année scolaire</dt>
            <dd className="text-sm font-medium text-[#172B4D] mt-0.5">
              {annee?.nom ?? eleve.anneeScolaireId}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#64748B]">Contact parent</dt>
            <dd className="text-sm font-medium text-[#172B4D] mt-0.5">
              {eleve.contactParent}
            </dd>
          </div>
        </dl>
      </div>

      {/* Paiements par tranche */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-6">
        <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-4">
          Paiements par tranche
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {infosTranches.map((info) => (
            <div
              key={info.key}
              className="rounded-lg border border-[#E2E8F0] p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#172B4D]">
                  {info.label}
                </span>
                <Badge
                  variant={
                    info.statut === 'Soldé'
                      ? 'success'
                      : info.statut === 'Partiel'
                      ? 'warning'
                      : 'error'
                  }
                >
                  {info.statut}
                </Badge>
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#64748B]">Versé</dt>
                  <dd className="font-medium text-[#16A34A]">
                    {formatGNF(info.montantVerse)}
                  </dd>
                </div>
              </dl>
              {/* Barre de progression */}
              <div className="w-full bg-[#E2E8F0] rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all ${
                    info.pourcentage === 100
                      ? 'bg-[#16A34A]'
                      : info.pourcentage > 0
                      ? 'bg-[#D97706]'
                      : 'bg-[#E2E8F0]'
                  }`}
                  style={{ width: `${info.pourcentage}%` }}
                />
              </div>
              <p className="text-xs text-[#64748B] text-right">
                {info.pourcentage}%
              </p>
            </div>
          ))}
        </div>

        {/* Total versé annuel global */}
        <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex flex-wrap justify-between items-center gap-2">
          <span className="text-sm font-semibold text-[#172B4D]">
            Total versé sur l&apos;année
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#64748B]">
              Versé :{' '}
              <span className="font-medium text-[#16A34A]">{formatGNF(totalVerse)}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Historique des paiements */}
      <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0]">
          <h2 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide">
            Historique des paiements
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#172B4D] text-white text-left text-xs font-semibold uppercase tracking-wide">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Tranche</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3">N° Reçu</th>
                <th className="px-4 py-3">Comptable</th>
              </tr>
            </thead>
            <tbody>
              {recusEleve.map((recu) => (
                <tr
                  key={recu.id}
                  className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                    {formatDate(recu.date)}
                  </td>
                  <td className="px-4 py-3 text-[#172B4D]">
                    {libelleTrancheRecu(recu.tranche)}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#172B4D] whitespace-nowrap">
                    {formatGNF(recu.montantVerse)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                    {recu.numero}
                  </td>
                  <td className="px-4 py-3 text-[#172B4D]">
                    {recu.comptableId}
                  </td>
                </tr>
              ))}
              {recusEleve.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-[#64748B]"
                  >
                    Aucun paiement enregistré
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
