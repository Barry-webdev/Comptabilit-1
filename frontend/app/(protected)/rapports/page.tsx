'use client';

import { useState, useMemo } from 'react';
import { useEleves, useClasses, useAnneesScolaires, useFrais, usePaiements, useRecus, useRecettes, useDepenses } from '@/hooks';
import { formatGNF, formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import BoutonExportPdf from '@/components/rapports/BoutonExportPdf';

// Charge le logo en base64 pour les PDFs
async function chargerLogoBase64(): Promise<string> {
  try {
    const res = await fetch('/Logo.gif');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch { return ''; }
}
import type {
  IPaiement,
  IRecette,
  IDepense,
  IEleve,
  IRecu,
  IClasse,
  IAnneeScolaire,
  IFrais,
} from '@/lib/api';

type Onglet = 'journalier' | 'mensuel' | 'annuel' | 'recouvrement';

const ONGLETS: Array<{ id: Onglet; label: string }> = [
  { id: 'journalier', label: 'Journalier' },
  { id: 'mensuel', label: 'Mensuel' },
  { id: 'annuel', label: 'Annuel' },
  { id: 'recouvrement', label: 'Recouvrement par classe' },
];

const NOMS_MOIS = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

function dateAujourdhui(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

type StatutRecouvrement = 'Soldé' | 'En cours' | 'Impayé';

// ─── Sous-composant : Onglet Journalier ───────────────────────────────────────

type JournalierProps = {
  paiements: IPaiement[];
  recettes: IRecette[];
  depenses: IDepense[];
  eleves: IEleve[];
  recus: IRecu[];
};

function RapportJournalier({ paiements, recettes, depenses, eleves, recus }: JournalierProps) {
  const [date, setDate] = useState<string>(dateAujourdhui());

  const paiementsJour = useMemo(() => paiements.filter((p) => p.date === date), [paiements, date]);
  const recettesAnnexesJour = useMemo(
    () => recettes.filter((r) => r.type === 'annexe' && r.date === date),
    [recettes, date],
  );
  const depensesJour = useMemo(() => depenses.filter((d) => d.date === date), [depenses, date]);

  const totalEncaissements = useMemo(
    () => paiementsJour.reduce((acc, p) => acc + p.montant, 0),
    [paiementsJour],
  );
  const totalAnnexes = useMemo(
    () => recettesAnnexesJour.reduce((acc, r) => acc + r.montant, 0),
    [recettesAnnexesJour],
  );
  const totalDepenses = useMemo(
    () => depensesJour.reduce((acc, d) => acc + d.montant, 0),
    [depensesJour],
  );
  const soldeCloture = totalEncaissements + totalAnnexes - totalDepenses;

  function nomEleve(eleveId: string): string {
    const e = eleves.find((el) => el.id === eleveId);
    return e ? `${e.prenom} ${e.nom}` : eleveId;
  }

  function numeroRecu(recuId: string): string {
    return recus.find((r) => r.id === recuId)?.numero ?? recuId;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[180px] max-w-xs">
          <Input
            id="jour-date"
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <BoutonExportPdf
          nomFichier={`journal-caisse-${date}.pdf`}
          fabriquerDocument={async () => {
            const { default: PdfJournalier } = await import('@/components/rapports/PdfJournalier');
            const { createElement } = await import('react');
            const logo = await chargerLogoBase64();
            return createElement(PdfJournalier, {
              date,
              paiements,
              recettes,
              depenses,
              eleves,
              recus,
              logoBase64: logo,
            });
          }}
        />
      </div>

      <SectionTableau titre="Encaissements du jour">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">N° Reçu</th>
                <th className="px-4 py-3">Élève</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {paiementsJour.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{numeroRecu(p.recuId)}</td>
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {nomEleve(p.eleveId)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#176B45]">
                    {formatGNF(p.montant)}
                  </td>
                </tr>
              ))}
              {paiementsJour.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucun encaissement ce jour
                  </td>
                </tr>
              )}
            </tbody>
            {paiementsJour.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F7F6]">
                  <td colSpan={2} className="px-4 py-3 font-semibold text-sm text-[#172B4D]">
                    Total encaissements
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap text-[#176B45]">
                    {formatGNF(totalEncaissements)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>

      <SectionTableau titre="Recettes annexes du jour">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {recettesAnnexesJour.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {r.libelle}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{r.categorie}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#176B45]">
                    {formatGNF(r.montant)}
                  </td>
                </tr>
              ))}
              {recettesAnnexesJour.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucune recette annexe ce jour
                  </td>
                </tr>
              )}
            </tbody>
            {recettesAnnexesJour.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F7F6]">
                  <td colSpan={2} className="px-4 py-3 font-semibold text-sm text-[#172B4D]">
                    Total recettes annexes
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap text-[#176B45]">
                    {formatGNF(totalAnnexes)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>

      <SectionTableau titre="Dépenses du jour">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Motif</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {depensesJour.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {d.motif}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{d.categorie}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#DC2626]">
                    {formatGNF(d.montant)}
                  </td>
                </tr>
              ))}
              {depensesJour.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucune dépense ce jour
                  </td>
                </tr>
              )}
            </tbody>
            {depensesJour.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F7F6]">
                  <td colSpan={2} className="px-4 py-3 font-semibold text-sm text-[#172B4D]">
                    Total dépenses
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap text-[#DC2626]">
                    {formatGNF(totalDepenses)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>

      <div className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-[#176B45]">
        <span className="text-white font-semibold text-base">Solde de clôture</span>
        <span className="text-white font-bold text-xl">{formatGNF(soldeCloture)}</span>
      </div>
    </div>
  );
}

// ─── Sous-composant : Onglet Mensuel ─────────────────────────────────────────

type MensuelProps = {
  paiements: IPaiement[];
  recettes: IRecette[];
  depenses: IDepense[];
  eleves: IEleve[];
};

function RapportMensuel({ paiements, recettes, depenses, eleves }: MensuelProps) {
  const maintenant = new Date();
  const [mois, setMois] = useState<string>(String(maintenant.getMonth() + 1));
  const [annee, setAnnee] = useState<string>(String(maintenant.getFullYear()));

  const moisNum = parseInt(mois, 10);
  const anneeNum = parseInt(annee, 10);
  const prefixe = `${anneeNum}-${String(moisNum).padStart(2, '0')}`;

  const paiementsMois = useMemo(
    () => paiements.filter((p) => p.date.startsWith(prefixe)),
    [paiements, prefixe],
  );
  const recettesAnnexesMois = useMemo(
    () => recettes.filter((r) => r.type === 'annexe' && r.date.startsWith(prefixe)),
    [recettes, prefixe],
  );
  const depensesMois = useMemo(
    () => depenses.filter((d) => d.date.startsWith(prefixe)),
    [depenses, prefixe],
  );

  const totalScolaire = useMemo(
    () => paiementsMois.reduce((acc, p) => acc + p.montant, 0),
    [paiementsMois],
  );
  const totalAnnexes = useMemo(
    () => recettesAnnexesMois.reduce((acc, r) => acc + r.montant, 0),
    [recettesAnnexesMois],
  );
  const totalRecettes = totalScolaire + totalAnnexes;
  const totalDepenses = useMemo(
    () => depensesMois.reduce((acc, d) => acc + d.montant, 0),
    [depensesMois],
  );
  const resultatNet = totalRecettes - totalDepenses;

  const categoriesMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of depensesMois) {
      map[d.categorie] = (map[d.categorie] ?? 0) + d.montant;
    }
    return map;
  }, [depensesMois]);

  function nomEleve(eleveId: string): string {
    const e = eleves.find((el) => el.id === eleveId);
    return e ? `${e.prenom} ${e.nom}` : eleveId;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[140px]">
          <Select
            id="mens-mois"
            label="Mois"
            options={NOMS_MOIS}
            value={mois}
            onChange={(e) => setMois(e.target.value)}
          />
        </div>
        <div className="min-w-[100px]">
          <Input
            id="mens-annee"
            label="Année"
            type="number"
            min={2000}
            max={2100}
            value={annee}
            onChange={(e) => setAnnee(e.target.value)}
          />
        </div>
        <BoutonExportPdf
          nomFichier={`rapport-mensuel-${mois}-${annee}.pdf`}
          fabriquerDocument={async () => {
            const { default: PdfMensuel } = await import('@/components/rapports/PdfMensuel');
            const { createElement } = await import('react');
            const logo = await chargerLogoBase64();
            return createElement(PdfMensuel, {
              mois: moisNum,
              annee: anneeNum,
              paiements,
              recettes,
              depenses,
              eleves,
              logoBase64: logo,
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Recettes scolaires" valeur={formatGNF(totalScolaire)} />
        <KpiCard label="Recettes annexes" valeur={formatGNF(totalAnnexes)} />
        <KpiCard label="Total recettes" valeur={formatGNF(totalRecettes)} highlight />
        <KpiCard label="Total dépenses" valeur={formatGNF(totalDepenses)} danger />
      </div>

      <SectionTableau titre="Recettes scolaires du mois">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Élève</th>
                <th className="px-4 py-3">Tranche</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {paiementsMois.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {nomEleve(p.eleveId)}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{p.tranche}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#176B45]">
                    {formatGNF(p.montant)}
                  </td>
                </tr>
              ))}
              {paiementsMois.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucun paiement ce mois
                  </td>
                </tr>
              )}
            </tbody>
            {paiementsMois.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F7F6]">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-sm text-[#172B4D]">
                    Total scolaire
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap text-[#176B45]">
                    {formatGNF(totalScolaire)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>

      <SectionTableau titre="Recettes annexes du mois">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Libellé</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {recettesAnnexesMois.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {r.libelle}
                  </td>
                  <td className="px-4 py-3 text-[#64748B]">{r.categorie}</td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#176B45]">
                    {formatGNF(r.montant)}
                  </td>
                </tr>
              ))}
              {recettesAnnexesMois.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucune recette annexe ce mois
                  </td>
                </tr>
              )}
            </tbody>
            {recettesAnnexesMois.length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F7F6]">
                  <td colSpan={3} className="px-4 py-3 font-semibold text-sm text-[#172B4D]">
                    Total annexes
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm whitespace-nowrap text-[#176B45]">
                    {formatGNF(totalAnnexes)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>

      <SectionTableau titre="Dépenses par catégorie">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Montant</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categoriesMap).map(([cat, montant]) => (
                <tr
                  key={cat}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {cat}
                  </td>
                  <td className="px-4 py-3 text-right text-[#DC2626] font-semibold whitespace-nowrap">
                    {formatGNF(montant)}
                  </td>
                </tr>
              ))}
              {Object.keys(categoriesMap).length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucune dépense ce mois
                  </td>
                </tr>
              )}
            </tbody>
            {Object.keys(categoriesMap).length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F7F6]">
                  <td className="px-4 py-3 font-semibold text-sm text-[#172B4D]">Total dépenses</td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-[#DC2626] whitespace-nowrap">
                    {formatGNF(totalDepenses)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>

      <div
        className={`rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
          resultatNet >= 0 ? 'bg-[#176B45]' : 'bg-[#DC2626]'
        }`}
      >
        <span className="text-white font-semibold text-base">
          Résultat net {resultatNet >= 0 ? '(Excédent)' : '(Déficit)'}
        </span>
        <span className="text-white font-bold text-xl">{formatGNF(resultatNet)}</span>
      </div>
    </div>
  );
}

// ─── Sous-composant : Onglet Annuel ──────────────────────────────────────────

type AnnuelProps = {
  paiements: IPaiement[];
  recettes: IRecette[];
  depenses: IDepense[];
  anneesScolaires: IAnneeScolaire[];
};

const NOMS_MOIS_COURT = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

type MoisData = {
  label: string;
  recettesScolaires: number;
  recettesAnnexes: number;
  depenses: number;
};

function RapportAnnuel({ paiements, recettes, depenses, anneesScolaires }: AnnuelProps) {
  const anneeActive = anneesScolaires.find((a) => a.statut === 'active') ?? anneesScolaires[0];
  const [anneeId, setAnneeId] = useState<string>(anneeActive?.id ?? '');

  const anneeScolaire = anneesScolaires.find((a) => a.id === anneeId) ?? anneesScolaires[0];
  const optionsAnnees = anneesScolaires.map((a) => ({ value: a.id, label: a.nom }));

  const moisAnneeScolaire = useMemo(() => {
    if (!anneeScolaire) return [];
    const parts = anneeScolaire.nom.split('-');
    const anneeDebut = parts[0] ? parseInt(parts[0], 10) : new Date().getFullYear();
    const anneeFin = parts[1] ? parseInt(parts[1], 10) : anneeDebut + 1;
    return [
      { mois: 9, annee: anneeDebut }, { mois: 10, annee: anneeDebut },
      { mois: 11, annee: anneeDebut }, { mois: 12, annee: anneeDebut },
      { mois: 1, annee: anneeFin }, { mois: 2, annee: anneeFin },
      { mois: 3, annee: anneeFin }, { mois: 4, annee: anneeFin },
      { mois: 5, annee: anneeFin }, { mois: 6, annee: anneeFin },
      { mois: 7, annee: anneeFin }, { mois: 8, annee: anneeFin },
    ];
  }, [anneeScolaire]);

  const donneesMois: MoisData[] = useMemo(
    () =>
      moisAnneeScolaire.map(({ mois, annee }) => {
        const prefixe = `${annee}-${String(mois).padStart(2, '0')}`;
        return {
          label: NOMS_MOIS_COURT[mois - 1],
          recettesScolaires: paiements
            .filter((p) => p.date.startsWith(prefixe))
            .reduce((acc, p) => acc + p.montant, 0),
          recettesAnnexes: recettes
            .filter((r) => r.type === 'annexe' && r.date.startsWith(prefixe))
            .reduce((acc, r) => acc + r.montant, 0),
          depenses: depenses
            .filter((d) => d.date.startsWith(prefixe))
            .reduce((acc, d) => acc + d.montant, 0),
        };
      }),
    [moisAnneeScolaire, paiements, recettes, depenses],
  );

  const grandTotalScolaire = donneesMois.reduce((acc, m) => acc + m.recettesScolaires, 0);
  const grandTotalAnnexes = donneesMois.reduce((acc, m) => acc + m.recettesAnnexes, 0);
  const grandTotalRecettes = grandTotalScolaire + grandTotalAnnexes;
  const grandTotalDepenses = donneesMois.reduce((acc, m) => acc + m.depenses, 0);

  const categoriesMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const d of depenses) {
      map[d.categorie] = (map[d.categorie] ?? 0) + d.montant;
    }
    return map;
  }, [depenses]);

  if (!anneeScolaire) {
    return (
      <p className="text-[#64748B] text-sm">Aucune année scolaire disponible.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[180px]">
          <Select
            id="ann-annee"
            label="Année scolaire"
            options={optionsAnnees}
            value={anneeId}
            onChange={(e) => setAnneeId(e.target.value)}
          />
        </div>
        <BoutonExportPdf
          nomFichier={`bilan-annuel-${anneeScolaire.nom}.pdf`}
          fabriquerDocument={async () => {
            const { default: PdfAnnuel } = await import('@/components/rapports/PdfAnnuel');
            const { createElement } = await import('react');
            const logo = await chargerLogoBase64();
            return createElement(PdfAnnuel, {
              anneeScolaire,
              paiements,
              recettes,
              depenses,
              logoBase64: logo,
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiCard label="Recettes scolaires" valeur={formatGNF(grandTotalScolaire)} />
        <KpiCard label="Recettes annexes" valeur={formatGNF(grandTotalAnnexes)} />
        <KpiCard label="Total recettes" valeur={formatGNF(grandTotalRecettes)} highlight />
        <KpiCard label="Total dépenses" valeur={formatGNF(grandTotalDepenses)} danger />
      </div>

      <SectionTableau titre="Recettes et dépenses par mois">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Mois</th>
                <th className="px-4 py-3 text-right">Rec. scolaires</th>
                <th className="px-4 py-3 text-right">Rec. annexes</th>
                <th className="px-4 py-3 text-right">Total recettes</th>
                <th className="px-4 py-3 text-right">Dépenses</th>
                <th className="px-4 py-3 text-right">Résultat</th>
              </tr>
            </thead>
            <tbody>
              {donneesMois.map((m, i) => {
                const totalRec = m.recettesScolaires + m.recettesAnnexes;
                const resultat = totalRec - m.depenses;
                return (
                  <tr
                    key={i}
                    className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-[#172B4D]">
                      {m.label}
                    </td>
                    <td className="px-4 py-3 text-right text-[#64748B] whitespace-nowrap">
                      {m.recettesScolaires > 0 ? formatGNF(m.recettesScolaires) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-[#64748B] whitespace-nowrap">
                      {m.recettesAnnexes > 0 ? formatGNF(m.recettesAnnexes) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#176B45]">
                      {totalRec > 0 ? formatGNF(totalRec) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-[#DC2626] whitespace-nowrap">
                      {m.depenses > 0 ? formatGNF(m.depenses) : '—'}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                        resultat >= 0 ? 'text-[#176B45]' : 'text-[#DC2626]'
                      }`}
                    >
                      {formatGNF(resultat)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#D4A017' }}>
                <td className="px-4 py-3 font-bold text-sm text-gray-900">TOTAL</td>
                <td className="px-4 py-3 text-right font-bold text-sm text-gray-900 whitespace-nowrap">
                  {formatGNF(grandTotalScolaire)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-sm text-gray-900 whitespace-nowrap">
                  {formatGNF(grandTotalAnnexes)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-sm text-gray-900 whitespace-nowrap">
                  {formatGNF(grandTotalRecettes)}
                </td>
                <td className="px-4 py-3 text-right font-bold text-sm text-gray-900 whitespace-nowrap">
                  {formatGNF(grandTotalDepenses)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-bold text-sm whitespace-nowrap ${
                    grandTotalRecettes - grandTotalDepenses >= 0 ? 'text-[#176B45]' : 'text-[#DC2626]'
                  }`}
                >
                  {formatGNF(grandTotalRecettes - grandTotalDepenses)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </SectionTableau>

      <SectionTableau titre="Dépenses totales par catégorie">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3 text-right">Montant total</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categoriesMap).map(([cat, montant]) => (
                <tr
                  key={cat}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {cat}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[#DC2626] whitespace-nowrap">
                    {formatGNF(montant)}
                  </td>
                </tr>
              ))}
              {Object.keys(categoriesMap).length === 0 && (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucune dépense
                  </td>
                </tr>
              )}
            </tbody>
            {Object.keys(categoriesMap).length > 0 && (
              <tfoot>
                <tr className="bg-[#F5F7F6]">
                  <td className="px-4 py-3 font-semibold text-sm text-[#172B4D]">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-[#DC2626] whitespace-nowrap">
                    {formatGNF(grandTotalDepenses)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>
    </div>
  );
}

// ─── Sous-composant : Onglet Recouvrement ─────────────────────────────────────

type RecouvrementProps = {
  eleves: IEleve[];
  paiements: IPaiement[];
  classes: IClasse[];
  fraisParClasse: IFrais[];
  anneesScolaires: IAnneeScolaire[];
};

type LigneEleve = {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  totalDu: number;
  totalPaye: number;
  solde: number;
  statut: StatutRecouvrement;
};

function RapportRecouvrement({
  eleves,
  paiements,
  classes,
  fraisParClasse,
  anneesScolaires,
}: RecouvrementProps) {
  const anneeActive = anneesScolaires.find((a) => a.statut === 'active') ?? anneesScolaires[0];
  const anneeScolaireId = anneeActive?.id ?? '';

  const [classeId, setClasseId] = useState<string>(classes[0]?.id ?? '');

  const optionsClasses = classes.map((c) => ({ value: c.id, label: c.libelle }));
  const classeSelectionnee = classes.find((c) => c.id === classeId) ?? classes[0];

  const lignes: LigneEleve[] = useMemo(() => {
    const elevesClasse = eleves.filter(
      (e) => e.classeId === classeId && e.anneeScolaireId === anneeScolaireId,
    );
    const frais = fraisParClasse.find(
      (f) => f.classeId === classeId && f.anneeScolaireId === anneeScolaireId,
    );
    return elevesClasse.map((eleve) => {
      const totalDu = frais?.totalAnnuel ?? 0;
      const totalPaye = paiements
        .filter((p) => p.eleveId === eleve.id && p.anneeScolaireId === anneeScolaireId)
        .reduce((acc, p) => acc + p.montant, 0);
      const solde = Math.max(0, totalDu - totalPaye);
      let statut: StatutRecouvrement;
      if (solde === 0) statut = 'Soldé';
      else if (totalPaye > 0) statut = 'En cours';
      else statut = 'Impayé';
      return {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        totalDu,
        totalPaye,
        solde,
        statut,
      };
    });
  }, [eleves, paiements, fraisParClasse, classeId, anneeScolaireId]);

  const grandTotalDu = lignes.reduce((acc, l) => acc + l.totalDu, 0);
  const grandTotalPaye = lignes.reduce((acc, l) => acc + l.totalPaye, 0);
  const grandTotalSolde = lignes.reduce((acc, l) => acc + l.solde, 0);

  if (!classeSelectionnee) {
    return <p className="text-[#64748B] text-sm">Aucune classe disponible.</p>;
  }

  function badgeStatut(statut: StatutRecouvrement) {
    if (statut === 'Soldé') {
      return (
        <span className="inline-block bg-[#16A34A]/10 text-[#16A34A] rounded-full px-2.5 py-0.5 text-xs font-medium">
          {statut}
        </span>
      );
    }
    if (statut === 'En cours') {
      return (
        <span className="inline-block bg-[#D97706]/10 text-[#D97706] rounded-full px-2.5 py-0.5 text-xs font-medium">
          {statut}
        </span>
      );
    }
    return (
      <span className="inline-block bg-[#DC2626]/10 text-[#DC2626] rounded-full px-2.5 py-0.5 text-xs font-medium">
        {statut}
      </span>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[180px]">
          <Select
            id="recouv-classe"
            label="Classe"
            options={optionsClasses}
            value={classeId}
            onChange={(e) => setClasseId(e.target.value)}
          />
        </div>
        <BoutonExportPdf
          nomFichier={`recouvrement-${classeSelectionnee.libelle.replace(/\s+/g, '-')}.pdf`}
          fabriquerDocument={async () => {
            const { default: PdfRecouvrement } = await import(
              '@/components/rapports/PdfRecouvrement'
            );
            const { createElement } = await import('react');
            const logo = await chargerLogoBase64();
            return createElement(PdfRecouvrement, {
              classe: classeSelectionnee,
              eleves,
              paiements,
              fraisParClasse,
              anneeScolaireId,
              logoBase64: logo,
            });
          }}
        />
      </div>

      <SectionTableau titre={`Recouvrement — ${classeSelectionnee.libelle}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold text-white uppercase tracking-wide">
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Nom &amp; Prénom</th>
                <th className="px-4 py-3 text-right">Total dû</th>
                <th className="px-4 py-3 text-right">Total payé</th>
                <th className="px-4 py-3 text-right">Solde restant</th>
                <th className="px-4 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr
                  key={ligne.id}
                  className="border-b border-[#E2E8F0] hover:bg-[#F5F7F6] transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                    {ligne.matricule}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {ligne.prenom} {ligne.nom}
                  </td>
                  <td className="px-4 py-3 text-right text-[#64748B] whitespace-nowrap">
                    {formatGNF(ligne.totalDu)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-[#176B45]">
                    {formatGNF(ligne.totalPaye)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                      ligne.solde > 0 ? 'text-[#DC2626]' : 'text-[#176B45]'
                    }`}
                  >
                    {formatGNF(ligne.solde)}
                  </td>
                  <td className="px-4 py-3">
                    {badgeStatut(ligne.statut)}
                  </td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#64748B] text-sm">
                    Aucun élève dans cette classe pour l&apos;année en cours
                  </td>
                </tr>
              )}
            </tbody>
            {lignes.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#D4A017' }}>
                  <td
                    colSpan={2}
                    className="px-4 py-3 font-bold text-sm text-gray-900"
                  >
                    TOTAL
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-gray-900 whitespace-nowrap">
                    {formatGNF(grandTotalDu)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-gray-900 whitespace-nowrap">
                    {formatGNF(grandTotalPaye)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-sm text-gray-900 whitespace-nowrap">
                    {formatGNF(grandTotalSolde)}
                  </td>
                  <td className="px-4 py-3" />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </SectionTableau>
    </div>
  );
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function SectionTableau({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#172B4D]">
          {titre}
        </h3>
      </div>
      {children}
    </div>
  );
}

type KpiCardProps = {
  label: string;
  valeur: string;
  highlight?: boolean;
  danger?: boolean;
};

function KpiCard({ label, valeur, highlight, danger }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm px-4 py-4 flex flex-col gap-1">
      <span className="text-xs text-[#64748B] uppercase tracking-wide">
        {label}
      </span>
      <span
        className={`text-lg font-bold whitespace-nowrap ${
          highlight ? 'text-[#176B45]' : danger ? 'text-[#DC2626]' : 'text-[#172B4D]'
        }`}
      >
        {valeur}
      </span>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function RapportsPage() {
  const { data: paiementsData } = usePaiements();
  const { data: recettesData } = useRecettes();
  const { data: depensesData } = useDepenses();
  const { data: elevesData } = useEleves();
  const { data: recusData } = useRecus();
  const { data: classesData } = useClasses();
  const { data: anneesScolairesData } = useAnneesScolaires();
  const { data: fraisData } = useFrais();

  const paiements = paiementsData ?? [];
  const recettes = recettesData ?? [];
  const depenses = depensesData ?? [];
  const eleves = elevesData ?? [];
  const recus = recusData ?? [];
  const classes = classesData ?? [];
  const anneesScolaires = anneesScolairesData ?? [];
  const fraisParClasse = fraisData ?? [];

  const [ongletActif, setOngletActif] = useState<Onglet>('journalier');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#172B4D]">
          Rapports
        </h1>
      </div>

      {/* Navigation par onglets */}
      <div className="flex gap-1 p-1 bg-white rounded-xl border border-[#E2E8F0] shadow-sm w-full overflow-x-auto">
        {ONGLETS.map((o) => (
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

      {/* Contenu de l'onglet */}
      <div>
        {ongletActif === 'journalier' && (
          <RapportJournalier
            paiements={paiements}
            recettes={recettes}
            depenses={depenses}
            eleves={eleves}
            recus={recus}
          />
        )}
        {ongletActif === 'mensuel' && (
          <RapportMensuel
            paiements={paiements}
            recettes={recettes}
            depenses={depenses}
            eleves={eleves}
          />
        )}
        {ongletActif === 'annuel' && (
          <RapportAnnuel
            paiements={paiements}
            recettes={recettes}
            depenses={depenses}
            anneesScolaires={anneesScolaires}
          />
        )}
        {ongletActif === 'recouvrement' && (
          <RapportRecouvrement
            eleves={eleves}
            paiements={paiements}
            classes={classes}
            fraisParClasse={fraisParClasse}
            anneesScolaires={anneesScolaires}
          />
        )}
      </div>
    </div>
  );
}
