'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useDashboardStats,
  usePaiements,
  useRecettes,
  useDepenses,
  useClasses,
  useFrais,
  useEleves,
  useAnneesScolaires,
} from '@/hooks';
import { formatGNF, formatDate, calculerTauxRecouvrement } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import FormulairePaiement from '@/components/paiements/FormulairePaiement';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';

const GraphiqueEvolution = dynamic(
  () => import('@/components/dashboard/GraphiqueEvolution'),
  { ssr: false }
);

const GraphiqueRecouvrement = dynamic(
  () => import('@/components/dashboard/GraphiqueRecouvrement'),
  { ssr: false }
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSameMonth(dateStr: string, ref: Date): boolean {
  const d = new Date(dateStr);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
}

function isPrevMonth(dateStr: string, ref: Date): boolean {
  const prev = new Date(ref.getFullYear(), ref.getMonth() - 1, 1);
  return isSameMonth(dateStr, prev);
}

function nomMois(index: number): string {
  return new Date(2000, index, 1).toLocaleString('fr-FR', { month: 'short' });
}

function variation(actuel: number, precedent: number): { pct: number; hausse: boolean } {
  if (precedent === 0) return { pct: 0, hausse: true };
  const pct = Math.round(((actuel - precedent) / precedent) * 100);
  return { pct: Math.abs(pct), hausse: pct >= 0 };
}

// ── Icônes ───────────────────────────────────────────────────────────────────

function IcoPaiement() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>;
}

function IcoRecette() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.519l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.941" /></svg>;
}

function IcoDepense() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.306-4.307a11.95 11.95 0 0 1 5.814 5.519l2.74 1.22m0 0-5.94 2.28m5.94-2.28-2.28-5.941" /></svg>;
}

function IcoSolde() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18m0 0H6.75A2.25 2.25 0 0 1 4.5 18.75v0A2.25 2.25 0 0 1 6.75 16.5H12m0 4.5h5.25A2.25 2.25 0 0 0 19.5 18.75v0a2.25 2.25 0 0 0-2.25-2.25H12M4.5 9l3-6 3 6m9-6 3 6-3 0" /></svg>;
}

function IcoEleves() {
  return <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>;
}

function IcoAlerte() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>;
}

function IcoCalendrier() {
  return <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>;
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({
  titre, valeur, sousTitre, couleurBordure, couleurIcone, icone,
  variationPct, variationHausse,
}: {
  titre: string; valeur: string; sousTitre?: string;
  couleurBordure: string; couleurIcone: string; icone: React.ReactNode;
  variationPct?: number; variationHausse?: boolean;
}) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 border-l-4 ${couleurBordure}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">{titre}</p>
        <span className={couleurIcone}>{icone}</span>
      </div>
      <p className="text-2xl font-bold text-[#172B4D] leading-tight">{valeur}</p>
      <div className="flex items-center justify-between mt-2">
        {sousTitre && <p className="text-xs text-[#64748B]">{sousTitre}</p>}
        {variationPct !== undefined && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
            variationHausse ? 'bg-green-50 text-green-600' : 'bg-red-50 text-[#DC2626]'
          }`}>
            {variationHausse ? '↑' : '↓'} {variationPct}%
            <span className="font-normal text-[#64748B] ml-1">vs mois dernier</span>
          </span>
        )}
      </div>
    </div>
  );
}

// ── Skeleton KPI (état de chargement) ──────────────────────────────────
function KpiCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 border-l-4 border-l-[#E2E8F0]">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-5 w-5 rounded" />
      </div>
      <Skeleton className="h-7 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const { data: dashboardStats, loading: statsLoading, error: statsError } = useDashboardStats();
  const { data: paiements } = usePaiements();
  const { data: recettes } = useRecettes();
  const { data: depenses } = useDepenses();
  const { data: classes } = useClasses();
  const { data: fraisParClasse } = useFrais();
  const { data: eleves } = useEleves();
  const { data: anneesScolaires } = useAnneesScolaires();
  const [modalPaiement, setModalPaiement] = useState(false);

  const paiementsList = paiements ?? [];
  const recettesList = recettes ?? [];
  const depensesList = depenses ?? [];
  const classesList = classes ?? [];
  const fraisParClasseList = fraisParClasse ?? [];
  const elevesList = eleves ?? [];
  const anneesScolairesList = anneesScolaires ?? [];

  const maintenant = new Date();
  const anneeActive = anneesScolairesList.find((a) => a.statut === 'active');

  // ── Variations vs mois précédent (badges KPI) ──────────────────────
  // Calculées à partir des données brutes déjà chargées pour les graphiques
  // et le journal — aucun appel API supplémentaire. Les valeurs KPI elles-mêmes
  // proviennent directement de useDashboardStats (un seul appel agrégé).

  const encaissementsMoisPrec = paiementsList
    .filter((p) => isPrevMonth(p.date, maintenant))
    .reduce((acc, p) => acc + p.montant, 0) +
    recettesList.filter((r) => isPrevMonth(r.date, maintenant))
    .reduce((acc, r) => acc + r.montant, 0);

  const depensesMoisPrec = depensesList
    .filter((d) => isPrevMonth(d.date, maintenant))
    .reduce((acc, d) => acc + d.montant, 0);

  const taux = calculerTauxRecouvrement(paiementsList, fraisParClasseList, elevesList);

  const varEncaissements = variation(dashboardStats?.encaissementsMois ?? 0, encaissementsMoisPrec);
  const varDepenses = variation(dashboardStats?.depensesMois ?? 0, depensesMoisPrec);

  // ── Alertes : élèves avec tranche en retard ─────────────────────────

  const aujourd = maintenant.toISOString().split('T')[0];
  type Alerte = { eleveId: string; nom: string; tranche: string; dateLimite: string; montantRestant: number };
  const alertesRetard: Alerte[] = [];

  if (anneeActive) {
    elevesList
      .filter((e) => e.anneeScolaireId === anneeActive.id)
      .forEach((eleve) => {
        const frais = fraisParClasseList.find(
          (f) => f.classeId === eleve.classeId && f.anneeScolaireId === anneeActive.id
        );
        if (!frais) return;

        (['tranche1', 'tranche2', 'tranche3'] as const).forEach((t) => {
          const montant = t === 'tranche1' ? frais.t1Montant : t === 'tranche2' ? frais.t2Montant : frais.t3Montant;
          const dateLimite = t === 'tranche1' ? frais.t1DateLimite : t === 'tranche2' ? frais.t2DateLimite : frais.t3DateLimite;
          if (!dateLimite || dateLimite >= aujourd) return;
          const verseSurTranche = paiementsList
            .filter((p) => p.eleveId === eleve.id && p.tranche === t && p.anneeScolaireId === anneeActive.id)
            .reduce((acc, p) => acc + p.montant, 0);
          const restant = (montant ?? 0) - verseSurTranche;
          if (restant > 0) {
            alertesRetard.push({
              eleveId: eleve.id,
              nom: `${eleve.prenom} ${eleve.nom}`,
              tranche: t === 'tranche1' ? '1ère Tranche' : t === 'tranche2' ? '2ème Tranche' : '3ème Tranche',
              dateLimite,
              montantRestant: restant,
            });
          }
        });
      });
  }

  // ── Échéances à venir (30 jours) ────────────────────────────────────

  const dans30j = new Date(maintenant);
  dans30j.setDate(dans30j.getDate() + 30);

  type Echeance = { classeLibelle: string; tranche: string; dateLimite: string; montant: number };
  const echeances: Echeance[] = [];

  if (anneeActive) {
    fraisParClasseList
      .filter((f) => f.anneeScolaireId === anneeActive.id)
      .forEach((f) => {
        const cls = classesList.find((c) => c.id === f.classeId);
        if (!cls) return;
        (['tranche1', 'tranche2', 'tranche3'] as const).forEach((t) => {
          const d = t === 'tranche1' ? f.t1DateLimite : t === 'tranche2' ? f.t2DateLimite : f.t3DateLimite;
          const montant = t === 'tranche1' ? f.t1Montant : t === 'tranche2' ? f.t2Montant : f.t3Montant;
          if (d && d >= aujourd && d <= dans30j.toISOString().split('T')[0]) {
            echeances.push({
              classeLibelle: cls.libelle,
              tranche: t === 'tranche1' ? '1ère Tranche' : t === 'tranche2' ? '2ème Tranche' : '3ème Tranche',
              dateLimite: d,
              montant: montant ?? 0,
            });
          }
        });
      });
  }
  echeances.sort((a, b) => a.dateLimite.localeCompare(b.dateLimite));

  // ── Graphique évolution 6 mois ───────────────────────────────────────

  const donneesGraphique = Array.from({ length: 6 }, (_, i) => {
    const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - 5 + i, 1);
    const rec = paiementsList.filter((p) => isSameMonth(p.date, date)).reduce((acc, p) => acc + p.montant, 0) +
      recettesList.filter((r) => isSameMonth(r.date, date)).reduce((acc, r) => acc + r.montant, 0);
    const dep = depensesList.filter((d) => isSameMonth(d.date, date)).reduce((acc, d) => acc + d.montant, 0);
    return { mois: nomMois(date.getMonth()), recettes: rec, depenses: dep };
  });

  // ── Recouvrement par classe ─────────────────────────────────────────

  const donneesRecouvrement = anneeActive
    ? classesList.map((cls) => {
        const frais = fraisParClasseList.find(
          (f) => f.classeId === cls.id && f.anneeScolaireId === anneeActive.id
        );
        const nbEleves = elevesList.filter(
          (e) => e.classeId === cls.id && e.anneeScolaireId === anneeActive.id
        ).length;
        const attendu = frais ? frais.totalAnnuel * nbEleves : 0;
        const paye = paiementsList
          .filter((p) => {
            const e = elevesList.find((el) => el.id === p.eleveId);
            return e?.classeId === cls.id && p.anneeScolaireId === anneeActive.id;
          })
          .reduce((acc, p) => acc + p.montant, 0);
        const tauxCls = attendu > 0 ? Math.round((paye / attendu) * 100) : 0;
        return { classe: cls.libelle.replace('ème Année', 'A').replace('ère Année', 'A'), taux: tauxCls, paye, attendu };
      }).filter((d) => d.attendu > 0)
    : [];

  // ── Journal 5 dernières opérations ──────────────────────────────────

  const operations = [
    ...paiementsList.map((p) => {
      const e = elevesList.find((el) => el.id === p.eleveId);
      return { id: p.id, date: p.date, type: 'Paiement', description: e ? `${e.prenom} ${e.nom}` : p.eleveId, montant: p.montant };
    }),
    ...depensesList.map((d) => ({ id: d.id, date: d.date, type: 'Dépense', description: d.motif, montant: -d.montant })),
    ...recettesList.filter((r) => r.type === 'annexe').map((r) => ({ id: r.id, date: r.date, type: 'Recette', description: r.libelle, montant: r.montant })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  return (
    <div className="space-y-6">

      {/* En-tête + bouton action rapide */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Tableau de Bord</h1>
          {anneeActive && (
            <p className="text-sm text-[#64748B] mt-0.5">Année scolaire active : <strong>{anneeActive.nom}</strong></p>
          )}
        </div>
        <button
          onClick={() => setModalPaiement(true)}
          className="inline-flex items-center gap-2 bg-[#176B45] hover:bg-[#0f4f31] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition shadow-sm"
        >
          <span className="text-lg leading-none">+</span>
          Enregistrer un paiement
        </button>
      </div>

      {/* KPIs – ligne 1 : financiers (issus du seul appel useDashboardStats) */}
      {statsError && <ErrorMessage message={statsError} />}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <KpiCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            titre="Encaissements du jour"
            valeur={formatGNF(dashboardStats?.encaissementsJour ?? 0)}
            sousTitre={`${dashboardStats?.nbPaiementsJour ?? 0} paiement${(dashboardStats?.nbPaiementsJour ?? 0) > 1 ? 's' : ''} aujourd'hui`}
            couleurBordure="border-l-[#176B45]"
            couleurIcone="text-[#176B45]"
            icone={<IcoPaiement />}
          />
          <KpiCard
            titre="Recettes du mois"
            valeur={formatGNF(dashboardStats?.encaissementsMois ?? 0)}
            couleurBordure="border-l-[#16A34A]"
            couleurIcone="text-[#16A34A]"
            icone={<IcoRecette />}
            variationPct={varEncaissements.pct}
            variationHausse={varEncaissements.hausse}
          />
          <KpiCard
            titre="Dépenses du mois"
            valeur={formatGNF(dashboardStats?.depensesMois ?? 0)}
            couleurBordure="border-l-[#DC2626]"
            couleurIcone="text-[#DC2626]"
            icone={<IcoDepense />}
            variationPct={varDepenses.pct}
            variationHausse={!varDepenses.hausse}
          />
          <KpiCard
            titre="Solde net du mois"
            valeur={formatGNF(dashboardStats?.soldeNet ?? 0)}
            sousTitre={`Recouvrement global : ${taux}%`}
            couleurBordure="border-l-[#172B4D]"
            couleurIcone="text-[#172B4D]"
            icone={<IcoSolde />}
          />
        </div>
      )}

      {/* KPI élèves + alertes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5 border-l-4 border-l-[#D97706]">
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">Élèves actifs</p>
            <span className="text-[#D97706]"><IcoEleves /></span>
          </div>
          <p className="text-2xl font-bold text-[#172B4D]">{dashboardStats?.totalEleves ?? 0}</p>
          <p className="text-xs text-[#64748B] mt-1">{anneeActive?.nom ?? 'Aucune année active'}</p>
        </div>

        <div className={`bg-white rounded-xl shadow-sm border p-5 border-l-4 col-span-2 ${
          alertesRetard.length > 0 ? 'border-[#DC2626]/30 border-l-[#DC2626]' : 'border-[#E2E8F0] border-l-[#16A34A]'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={alertesRetard.length > 0 ? 'text-[#DC2626]' : 'text-[#16A34A]'}>
              <IcoAlerte />
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
              Tranches en retard
            </p>
            {alertesRetard.length > 0 && (
              <span className="ml-auto bg-[#DC2626] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {alertesRetard.length}
              </span>
            )}
          </div>
          {alertesRetard.length === 0 ? (
            <p className="text-sm text-[#16A34A] font-medium">✓ Aucun retard de paiement</p>
          ) : (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {alertesRetard.slice(0, 5).map((a, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-[#172B4D]">{a.nom}</span>
                    <span className="text-[#64748B] ml-1">– {a.tranche}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#DC2626] font-semibold">{formatGNF(a.montantRestant)}</span>
                    <button
                      onClick={() => router.push(`/eleves/${a.eleveId}`)}
                      className="text-[#176B45] underline hover:no-underline"
                    >
                      Voir
                    </button>
                  </div>
                </div>
              ))}
              {alertesRetard.length > 5 && (
                <p className="text-xs text-[#64748B]">et {alertesRetard.length - 5} autres…</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">Évolution Recettes / Dépenses – 6 mois</h2>
          <GraphiqueEvolution data={donneesGraphique} couleurRecettes="#176B45" couleurDepenses="#DC2626" />
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">Taux de recouvrement par classe</h2>
          {donneesRecouvrement.length > 0 ? (
            <GraphiqueRecouvrement data={donneesRecouvrement} />
          ) : (
            <div className="flex items-center justify-center h-48 text-[#64748B] text-sm">
              Configurez les frais scolaires pour voir les données
            </div>
          )}
        </div>
      </div>

      {/* Journal + Échéances */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Journal des opérations */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
          <h2 className="text-sm font-semibold text-[#172B4D] mb-4">Dernières opérations</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#172B4D] text-white">
                  <th className="text-left text-xs font-semibold uppercase px-3 py-2">Date</th>
                  <th className="text-left text-xs font-semibold uppercase px-3 py-2">Type</th>
                  <th className="text-left text-xs font-semibold uppercase px-3 py-2">Description</th>
                  <th className="text-right text-xs font-semibold uppercase px-3 py-2">Montant</th>
                </tr>
              </thead>
              <tbody>
                {operations.map((op) => (
                  <tr key={op.id} className="border-b border-[#E2E8F0] last:border-0 hover:bg-[#F5F7F6] transition-colors">
                    <td className="py-2 px-3 text-[#64748B] whitespace-nowrap text-xs">{formatDate(op.date)}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                        op.type === 'Dépense' ? 'bg-[#DC2626]/10 text-[#DC2626]' :
                        op.type === 'Paiement' ? 'bg-[#176B45]/10 text-[#176B45]' :
                        'bg-[#D97706]/10 text-[#D97706]'
                      }`}>{op.type}</span>
                    </td>
                    <td className="py-2 px-3 text-[#172B4D] text-xs truncate max-w-[180px]">{op.description}</td>
                    <td className={`py-2 px-3 text-right font-semibold text-xs whitespace-nowrap ${
                      op.montant < 0 ? 'text-[#DC2626]' : 'text-[#176B45]'
                    }`}>
                      {op.montant < 0 ? '-' : '+'}{formatGNF(Math.abs(op.montant))}
                    </td>
                  </tr>
                ))}
                {operations.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-[#64748B] text-sm">Aucune opération</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Échéances à venir */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[#D97706]"><IcoCalendrier /></span>
            <h2 className="text-sm font-semibold text-[#172B4D]">Échéances – 30 jours</h2>
          </div>
          {echeances.length === 0 ? (
            <p className="text-sm text-[#64748B] text-center py-6">Aucune échéance dans les 30 prochains jours</p>
          ) : (
            <div className="space-y-3">
              {echeances.slice(0, 8).map((e, i) => {
                const jours = Math.round((new Date(e.dateLimite).getTime() - maintenant.getTime()) / 86400000);
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#172B4D] truncate">{e.classeLibelle}</p>
                      <p className="text-xs text-[#64748B]">{e.tranche}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-semibold text-[#172B4D]">{formatDate(e.dateLimite)}</p>
                      <span className={`text-xs font-bold ${jours <= 7 ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                        J-{jours}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal paiement rapide */}
      <Modal isOpen={modalPaiement} onClose={() => setModalPaiement(false)} title="Nouveau paiement" large>
        <FormulairePaiement onSuccess={() => setModalPaiement(false)} onCancel={() => setModalPaiement(false)} />
      </Modal>
    </div>
  );
}
