'use client';

import Image from 'next/image';
import { formatGNF, formatDate } from '@/lib/utils';
import { useClasses } from '@/hooks/useClasses';
import { useAnneesScolaires } from '@/hooks/useAnneesScolaires';
import { useFrais } from '@/hooks/useFrais';
import { usePaiements } from '@/hooks/usePaiements';
import Button from '@/components/ui/Button';
import type { IRecu, IEleve } from '@/lib/api';

// Charge le logo et le convertit en base64 pour l'impression
async function chargerLogoBase64(): Promise<string> {
  try {
    const res = await fetch('/Logo.gif');
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

type Props = {
  recu: IRecu;
  eleve: IEleve;
  isDuplicate?: boolean;
  onFermer?: () => void;
};

const LIBELLE_TRANCHE: Record<string, string> = {
  tranche1: '1ère Tranche',
  tranche2: '2ème Tranche',
  tranche3: '3ème Tranche',
};

export default function ApercuRecu({ recu, eleve, isDuplicate, onFermer }: Props) {
  const { data: classesData } = useClasses();
  const { data: anneesData } = useAnneesScolaires();
  const { data: fraisData } = useFrais(eleve.anneeScolaireId);
  const { data: paiementsData } = usePaiements({ eleveId: eleve.id });

  const classes = classesData ?? [];
  const anneesScolaires = anneesData ?? [];
  const fraisParClasse = fraisData ?? [];
  const tousLesPaiements = paiementsData ?? [];

  const classe = classes.find((c) => c.id === eleve.classeId)?.libelle ?? eleve.classeId;
  const annee = anneesScolaires.find((a) => a.id === eleve.anneeScolaireId)?.nom ?? eleve.anneeScolaireId;
  const nomComptable = recu.comptableId;
  const motif = `Scolarité — ${LIBELLE_TRANCHE[recu.tranche] ?? recu.tranche}`;
  const solde = recu.soldeRestant;

  const frais = fraisParClasse.find(
    (f) => f.classeId === eleve.classeId && f.anneeScolaireId === eleve.anneeScolaireId
  );
  const totalAnnuel = frais ? frais.totalAnnuel : 0;
  const totalPayeAnnee = tousLesPaiements
    .filter((p) => p.eleveId === eleve.id && p.anneeScolaireId === eleve.anneeScolaireId)
    .reduce((acc, p) => acc + p.montant, 0);
  const resteAnnuel = Math.max(0, totalAnnuel - totalPayeAnnee);

  async function imprimer() {
    const logoBase64 = await chargerLogoBase64();
    const logoHtml = logoBase64
      ? `<img src="${logoBase64}" alt="Logo" style="width:52px;height:52px;object-fit:contain;" />`
      : `<div style="width:52px;height:52px;background:#176B45;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:700;">G</div>`;
    const duplicataHtml = isDuplicate
      ? `<div style="text-align:center;margin-bottom:8px;">
           <span style="border:1.5px solid #dc2626;color:#dc2626;font-size:10px;font-weight:700;
                        padding:2px 10px;border-radius:4px;letter-spacing:2px;">DUPLICATA</span>
         </div>`
      : '';

    const blocRecu = (exemplaire: string) => `
      <div style="
        height:139mm; padding:8mm 10mm; box-sizing:border-box;
        font-family:Arial,sans-serif; font-size:11px; color:#1a1a1a; background:#fff;
        display:flex; flex-direction:column;
      ">
        <!-- En-tête -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
          <tr>
            <td style="width:60%;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                ${logoHtml}
                <div>
                  <div style="font-weight:800;font-size:12px;color:#1B6B3A;text-transform:uppercase;line-height:1.3;">
                    Groupe Scolaire Elhadj Amadou Bendougou Bah
                  </div>
                  <div style="font-size:9px;color:#555;margin-top:2px;">Conakry — République de Guinée</div>
                  <div style="font-size:9px;color:#555;">REPUBLIQUE DE GUINÉE — TRAVAIL · JUSTICE · SOLIDARITÉ</div>
                </div>
              </div>
            </td>
            <td style="width:40%;text-align:right;vertical-align:top;">
              <div style="font-weight:700;font-size:12px;color:#1B6B3A;">Reçu de Paiement N° ${recu.numero}</div>
              <div style="font-size:10px;color:#555;margin-top:2px;">Date : ${formatDate(recu.date)}</div>
              <div style="font-size:9px;color:#888;margin-top:2px;">${exemplaire}</div>
            </td>
          </tr>
        </table>

        <!-- Message de remerciement -->
        <div style="font-size:10px;color:#444;margin-bottom:8px;font-style:italic;">
          Cher client, nous avons bien reçu votre paiement et nous vous en remercions.<br/>
          Recevez, cher client, nos sincères salutations.
        </div>

        ${duplicataHtml}

        <!-- Tableau principal -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;flex:1;">
          <thead>
            <tr style="background:#1B6B3A;color:#fff;">
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:left;">Code</th>
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:left;">Matricule</th>
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:left;">Élève</th>
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:left;">Classe</th>
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:left;">Tranche</th>
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:right;">Montant</th>
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:right;">Reste tranche</th>
              <th style="padding:5px 6px;border:1px solid #aaa;font-size:10px;text-align:right;">Reste annuel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;">${recu.numero}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;font-family:monospace;">${eleve.matricule}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;font-weight:600;">${eleve.prenom} ${eleve.nom}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;">${classe}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;">${motif}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;text-align:right;font-weight:600;">${formatGNF(recu.montantVerse)}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;text-align:right;color:#dc2626;font-weight:600;">${formatGNF(recu.soldeRestant)}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;text-align:right;color:#b45309;font-weight:600;">${formatGNF(resteAnnuel)}</td>
            </tr>
            <!-- Ligne Total -->
            <tr style="background:#f8f8f8;font-weight:700;">
              <td colspan="5" style="padding:5px 6px;border:1px solid #ddd;font-size:10px;text-align:right;">Total</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;text-align:right;color:#1B6B3A;">${formatGNF(recu.montantVerse)}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;text-align:right;color:#dc2626;">${formatGNF(recu.soldeRestant)}</td>
              <td style="padding:5px 6px;border:1px solid #ddd;font-size:10px;text-align:right;color:#b45309;">${formatGNF(resteAnnuel)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pied : comptable + signature + cachet -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:10px;">
          <div style="font-size:9px;color:#555;">
            <div>Comptable : <strong>${nomComptable}</strong></div>
            <div style="margin-top:16px;border-top:1px solid #999;width:120px;padding-top:3px;">Signature du comptable</div>
          </div>
          <div style="font-size:10px;font-weight:600;color:#444;">Parent / Tuteur</div>
          <div style="text-align:center;">
            <div style="width:70px;height:70px;border:1px dashed #bbb;border-radius:50%;display:flex;align-items:center;justify-content:center;">
              <span style="font-size:8px;color:#bbb;text-align:center;">Cachet<br/>établissement</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <title>Reçu ${recu.numero}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    html, body { width:210mm; height:297mm; background:#fff; }
    @page { size: A4 portrait; margin: 0; }
    @media print {
      html, body { width:210mm; height:297mm; }
    }
    .page { width:210mm; height:297mm; padding:8mm 12mm; display:flex; flex-direction:column; gap:0; }
    .ligne-decoupe { display:flex; align-items:center; gap:8px; padding:5px 0; color:#9ca3af; font-size:10px; font-family:Arial,sans-serif; }
    .tiret { flex:1; border-top:1.5px dashed #9ca3af; }
    .btn-imprimer {
      display:block; margin:16px auto 0; padding:10px 32px;
      background:#1B6B3A; color:#fff; border:none; border-radius:8px;
      font-size:14px; font-weight:700; cursor:pointer; font-family:Arial,sans-serif;
    }
    .btn-imprimer:hover { background:#145530; }
    @media print { .btn-imprimer { display:none !important; } }
  </style>
</head>
<body>
  <div class="page">
    ${blocRecu('Exemplaire Parent / Tuteur')}
    <div class="ligne-decoupe">
      <div class="tiret"></div>
      <span>✂ &nbsp; Ligne de découpe &nbsp; ✂</span>
      <div class="tiret"></div>
    </div>
    ${blocRecu('Exemplaire Archives Établissement')}
  </div>
  <button id="btnImprimer" class="btn-imprimer">🖨 Imprimer</button>
  <script>
    window.onload = function() {
      document.getElementById('btnImprimer').addEventListener('click', function() {
        window.print();
      });
    };
  <\/script>
</body>
</html>`;

    const fenetre = window.open('', '_blank', 'width=900,height=700');
    if (fenetre) {
      fenetre.document.write(html);
      fenetre.document.close();
    }
  }

  return (
    <div className="w-full space-y-4" id="apercu-recu-print">

      {/* ── Carte aperçu ───────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white">

        {/* Bandeau en-tête */}
        <div className="bg-[#1B6B3A] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl overflow-hidden flex items-center justify-center">
                <Image src="/Logo.gif" alt="Logo" width={44} height={44} className="object-contain" unoptimized />
              </div>
              <div>
                <p className="text-[#D4A017] text-[11px] font-bold uppercase tracking-[0.2em]">
                  Reçu de Paiement
                </p>
                <p className="text-white font-bold text-sm mt-0.5 leading-snug">
                  Groupe Scolaire Elhadj Amadou Bendougou Bah
                </p>
                <p className="text-white/60 text-xs mt-0.5">Conakry — République de Guinée</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-white/60 text-[10px] uppercase tracking-wider">N° Reçu</p>
              <p className="text-white font-mono font-bold text-lg">{recu.numero}</p>
              {isDuplicate && (
                <span className="inline-block mt-1 text-[10px] font-bold text-red-300 border border-red-400/60 rounded px-2 py-0.5 tracking-widest">
                  DUPLICATA
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bande dorée fine */}
        <div className="h-1 bg-[#D4A017]" />

        {/* Message de remerciement */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs italic text-gray-500">
            Cher client, nous avons bien reçu votre paiement et nous vous en remercions.<br />
            Recevez, cher client, nos sincères salutations.
          </p>
        </div>

        {/* Tableau principal */}
        <div className="px-6 pb-5">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-[#1B6B3A] text-white">
                <th className="border border-[#145a30] px-3 py-2 text-left text-xs font-semibold">Code</th>
                <th className="border border-[#145a30] px-3 py-2 text-left text-xs font-semibold">Matricule</th>
                <th className="border border-[#145a30] px-3 py-2 text-left text-xs font-semibold">Élève</th>
                <th className="border border-[#145a30] px-3 py-2 text-left text-xs font-semibold">Classe</th>
                <th className="border border-[#145a30] px-3 py-2 text-left text-xs font-semibold">Tranche</th>
                <th className="border border-[#145a30] px-3 py-2 text-right text-xs font-semibold">Montant</th>
                <th className="border border-[#145a30] px-3 py-2 text-right text-xs font-semibold">Reste tranche</th>
                <th className="border border-[#145a30] px-3 py-2 text-right text-xs font-semibold">Reste annuel</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white">
                <td className="border border-gray-200 px-3 py-2.5 text-xs font-mono text-[#1B6B3A] font-semibold">{recu.numero}</td>
                <td className="border border-gray-200 px-3 py-2.5 text-xs font-mono">{eleve.matricule}</td>
                <td className="border border-gray-200 px-3 py-2.5 text-xs font-semibold">{eleve.prenom} {eleve.nom}</td>
                <td className="border border-gray-200 px-3 py-2.5 text-xs">{classe}</td>
                <td className="border border-gray-200 px-3 py-2.5 text-xs">{motif}</td>
                <td className="border border-gray-200 px-3 py-2.5 text-xs text-right font-semibold text-[#1B6B3A]">{formatGNF(recu.montantVerse)}</td>
                <td className="border border-gray-200 px-3 py-2.5 text-xs text-right font-semibold text-red-600">{formatGNF(solde)}</td>
                <td className="border border-gray-200 px-3 py-2.5 text-xs text-right font-semibold text-orange-600">{formatGNF(resteAnnuel)}</td>
              </tr>
              {/* Ligne Total */}
              <tr className="bg-gray-50 font-bold">
                <td colSpan={5} className="border border-gray-200 px-3 py-2 text-xs text-right font-bold text-gray-700">Total</td>
                <td className="border border-gray-200 px-3 py-2 text-xs text-right font-bold text-[#1B6B3A]">{formatGNF(recu.montantVerse)}</td>
                <td className="border border-gray-200 px-3 py-2 text-xs text-right font-bold text-red-600">{formatGNF(solde)}</td>
                <td className="border border-gray-200 px-3 py-2 text-xs text-right font-bold text-orange-600">{formatGNF(resteAnnuel)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pied — date, comptable, signatures */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex justify-between text-xs text-gray-500 mb-4">
            <span>Date : <strong className="text-gray-800">{formatDate(recu.date)}</strong></span>
            <span>Année scolaire : <strong className="text-gray-800">{annee}</strong></span>
            <span>Comptable : <strong className="text-gray-800">{nomComptable}</strong></span>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Signature du comptable
              </p>
              <div className="h-9 rounded-lg border border-dashed border-gray-300 bg-white" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full border border-dashed border-gray-300 bg-white flex items-center justify-center">
                <span className="text-[8px] text-gray-300 text-center leading-tight">Cachet<br/>étab.</span>
              </div>
            </div>
            <div className="flex-1 text-right">
              <p className="text-xs font-bold text-gray-700 mb-1">Parent / Tuteur</p>
              <div className="h-9 rounded-lg border border-dashed border-gray-300 bg-white" />
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              {onFermer && (
                <Button variant="secondary" size="sm" onClick={onFermer}>
                  Fermer
                </Button>
              )}
              <Button size="sm" onClick={imprimer}>
                🖨 Imprimer
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
