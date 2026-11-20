'use client';

import { useState, useRef } from 'react';
import { useClasses } from '@/hooks/useClasses';
import { useAnneesScolaires } from '@/hooks/useAnneesScolaires';
import { elevesApi } from '@/lib/api';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

type Props = {
  onSuccess: (nb: number) => void;
  onCancel: () => void;
  onRefetch?: () => void;
};

type LigneImport = {
  index: number;
  matricule: string;
  nom: string;
  prenom: string;
  contactParent: string;
  erreurs: string[];
};

type Etape = 'config' | 'apercu' | 'resultat';

export default function ImportEleves({ onSuccess, onCancel, onRefetch }: Props) {
  const { data: classes } = useClasses();
  const { data: anneesScolaires } = useAnneesScolaires();

  const classesList = classes ?? [];
  const anneesList = anneesScolaires ?? [];
  const anneeActive = anneesList.find((a) => a.statut === 'active');

  const fileRef = useRef<HTMLInputElement>(null);

  const [etape, setEtape] = useState<Etape>('config');
  const [classeId, setClasseId] = useState('');
  const [anneeScolaireId, setAnneeScolaireId] = useState(anneeActive?.id ?? '');
  const [lignes, setLignes] = useState<LigneImport[]>([]);
  const [erreurFichier, setErreurFichier] = useState('');
  const [nbImportes, setNbImportes] = useState(0);
  const [nbErreurs, setNbErreurs] = useState(0);
  const [enCours, setEnCours] = useState(false);

  const optionsClasses = [
    { value: '', label: 'Sélectionner une classe…' },
    ...classesList.map((c) => ({ value: c.id, label: c.libelle })),
  ];

  const optionsAnnees = anneesList.map((a) => ({
    value: a.id,
    label: a.nom + (a.statut === 'active' ? ' (active)' : ''),
  }));

  // ── Télécharger le modèle Excel ─────────────────────────────────────
  async function telechargerModele() {
    const { utils, write } = await import('xlsx');
    const ws = utils.aoa_to_sheet([
      ['Matricule', 'Nom', 'Prénom', 'Contact Parent'],
      ['AB10145831', 'Diallo', 'Mamadou', '621000001'],
      ['AB10145832', 'Barry', 'Fatoumata', '622000002'],
    ]);
    ws['!cols'] = [{ wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 18 }];
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Élèves');
    // Générer un blob et déclencher le téléchargement dans le navigateur
    const buffer = write(wb, { bookType: 'xlsx', type: 'array' }) as ArrayBuffer;
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'modele-import-eleves.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Lire le fichier Excel ────────────────────────────────────────────
  async function lireFichier(e: React.ChangeEvent<HTMLInputElement>) {
    setErreurFichier('');
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setErreurFichier('Format invalide. Utilisez un fichier Excel (.xlsx, .xls) ou CSV.');
      return;
    }

    try {
      const { read, utils } = await import('xlsx');
      const buffer = await file.arrayBuffer();
      const wb = read(buffer);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = utils.sheet_to_json<Record<string, string>>(ws, { defval: '' });

      if (rows.length === 0) {
        setErreurFichier('Le fichier est vide.');
        return;
      }

      const parsed: LigneImport[] = rows.map((row, i) => {
        const get = (keys: string[]) => {
          for (const k of keys) {
            const found = Object.keys(row).find(
              (rk) => rk.trim().toLowerCase() === k.toLowerCase()
            );
            if (found) return String(row[found]).trim();
          }
          return '';
        };

        const matricule = get(['matricule', 'mat', 'code']);
        const nom = get(['nom', 'name', 'lastname']);
        const prenom = get(['prénom', 'prenom', 'firstname', 'first name']);
        const contactParent = get(['contact parent', 'contact', 'telephone', 'téléphone', 'tel']);

        const erreurs: string[] = [];
        if (!matricule) erreurs.push('Matricule manquant');
        if (!nom) erreurs.push('Nom manquant');
        if (!prenom) erreurs.push('Prénom manquant');

        return { index: i + 2, matricule, nom, prenom, contactParent, erreurs };
      });

      setLignes(parsed);
      setEtape('apercu');
    } catch {
      setErreurFichier('Erreur lors de la lecture du fichier. Vérifiez le format.');
    }

    if (fileRef.current) fileRef.current.value = '';
  }

  // ── Confirmer l'import ──────────────────────────────────────────────
  async function confirmerImport() {
    const valides = lignes.filter((l) => l.erreurs.length === 0);
    const invalides = lignes.filter((l) => l.erreurs.length > 0);

    setEnCours(true);
    let importes = 0;
    const resultats = await Promise.allSettled(
      valides.map((l) =>
        elevesApi.creer({
          matricule: l.matricule,
          nom: l.nom,
          prenom: l.prenom,
          classeId,
          anneeScolaireId,
          contactParent: l.contactParent || '—',
        })
      )
    );
    importes = resultats.filter((r) => r.status === 'fulfilled').length;
    setEnCours(false);

    setNbImportes(importes);
    setNbErreurs(invalides.length + resultats.filter((r) => r.status === 'rejected').length);
    setEtape('resultat');
    if (importes > 0) onRefetch?.();
  }

  const lignesValides = lignes.filter((l) => l.erreurs.length === 0);
  const lignesInvalides = lignes.filter((l) => l.erreurs.length > 0);
  const classeSelectionnee = classesList.find((c) => c.id === classeId)?.libelle ?? '';

  // ── Étape 3 : Résultat ───────────────────────────────────────────────
  if (etape === 'resultat') {
    return (
      <div className="space-y-5 text-center">
        <div className={`rounded-2xl p-6 ${nbImportes > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-4xl mb-2">{nbImportes > 0 ? '✅' : '⚠️'}</p>
          <p className="text-xl font-bold text-[#172B4D]">
            {nbImportes} élève{nbImportes > 1 ? 's' : ''} importé{nbImportes > 1 ? 's' : ''}
          </p>
          {nbErreurs > 0 && (
            <p className="text-sm text-[#D97706] mt-1">
              {nbErreurs} ligne{nbErreurs > 1 ? 's' : ''} ignorée{nbErreurs > 1 ? 's' : ''} (erreurs)
            </p>
          )}
          <p className="text-sm text-[#64748B] mt-2">
            Classe : <strong>{classeSelectionnee}</strong>
          </p>
        </div>
        <Button onClick={() => onSuccess(nbImportes)} className="w-full">
          Fermer
        </Button>
      </div>
    );
  }

  // ── Étape 2 : Aperçu ────────────────────────────────────────────────
  if (etape === 'apercu') {
    return (
      <div className="space-y-4">
        {/* Résumé */}
        <div className="flex gap-3">
          <div className="flex-1 bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{lignesValides.length}</p>
            <p className="text-xs text-[#64748B] mt-0.5">À importer</p>
          </div>
          {lignesInvalides.length > 0 && (
            <div className="flex-1 bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-[#DC2626]">{lignesInvalides.length}</p>
              <p className="text-xs text-[#64748B] mt-0.5">Avec erreurs</p>
            </div>
          )}
          <div className="flex-1 bg-[#F5F7F6] border border-[#E2E8F0] rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-[#172B4D]">{classeSelectionnee}</p>
            <p className="text-xs text-[#64748B] mt-0.5">Classe cible</p>
          </div>
        </div>

        {/* Tableau aperçu */}
        <div className="rounded-xl border border-[#E2E8F0] overflow-hidden max-h-64 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#172B4D] text-white">
              <tr>
                <th className="px-3 py-2 text-left">Ligne</th>
                <th className="px-3 py-2 text-left">Matricule</th>
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Prénom</th>
                <th className="px-3 py-2 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l) => (
                <tr
                  key={l.index}
                  className={`border-b border-[#E2E8F0] last:border-0 ${
                    l.erreurs.length > 0 ? 'bg-red-50' : 'bg-white hover:bg-[#F5F7F6]'
                  }`}
                >
                  <td className="px-3 py-2 text-[#64748B]">{l.index}</td>
                  <td className="px-3 py-2 font-mono text-[#172B4D]">{l.matricule || '—'}</td>
                  <td className="px-3 py-2 text-[#172B4D]">{l.nom || '—'}</td>
                  <td className="px-3 py-2 text-[#172B4D]">{l.prenom || '—'}</td>
                  <td className="px-3 py-2">
                    {l.erreurs.length === 0 ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        ✓ Valide
                      </span>
                    ) : (
                      <span className="text-[#DC2626]" title={l.erreurs.join(', ')}>
                        ✗ {l.erreurs[0]}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {lignesValides.length === 0 && (
          <p className="text-sm text-center text-[#DC2626] font-medium">
            Aucune ligne valide à importer. Corrigez le fichier et réessayez.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={() => setEtape('config')} disabled={enCours}>
            ← Retour
          </Button>
          <Button
            onClick={confirmerImport}
            disabled={lignesValides.length === 0 || enCours}
          >
            {enCours ? 'Import en cours…' : `✓ Importer ${lignesValides.length} élève${lignesValides.length > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    );
  }

  // ── Étape 1 : Configuration ──────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Info */}
      <div className="bg-[#F5F7F6] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#64748B]">
        <p className="font-medium text-[#172B4D] mb-1">Comment ça fonctionne ?</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Téléchargez le modèle Excel et remplissez-le</li>
          <li>Sélectionnez la classe et l'année scolaire</li>
          <li>Importez votre fichier et vérifiez l'aperçu</li>
          <li>Confirmez — tous les élèves sont créés en une fois</li>
        </ol>
      </div>

      {/* Modèle Excel */}
      <div className="flex items-center justify-between bg-white border border-[#E2E8F0] rounded-xl px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#172B4D]">Modèle Excel</p>
          <p className="text-xs text-[#64748B]">Colonnes : Matricule, Nom, Prénom, Contact Parent</p>
        </div>
        <Button variant="secondary" size="sm" onClick={telechargerModele}>
          ↓ Télécharger
        </Button>
      </div>

      {/* Sélection classe */}
      <Select
        id="classeImport"
        label="Classe cible"
        options={optionsClasses}
        value={classeId}
        onChange={(e) => setClasseId(e.target.value)}
      />

      {/* Sélection année */}
      <Select
        id="anneeImport"
        label="Année scolaire"
        options={optionsAnnees}
        value={anneeScolaireId}
        onChange={(e) => setAnneeScolaireId(e.target.value)}
      />

      {/* Zone d'import fichier */}
      <div>
        <p className="text-sm font-medium text-[#172B4D] mb-1.5">Fichier Excel / CSV</p>
        <label
          className={`flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
            classeId
              ? 'border-[#176B45] hover:bg-[#176B45]/5 text-[#176B45]'
              : 'border-[#E2E8F0] text-[#64748B] cursor-not-allowed opacity-60'
          }`}
        >
          <span className="text-2xl mb-1">📂</span>
          <span className="text-sm font-medium">
            {classeId ? 'Cliquer pour choisir un fichier' : "Sélectionnez d'abord une classe"}
          </span>
          <span className="text-xs mt-0.5 text-[#64748B]">.xlsx, .xls ou .csv</span>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            disabled={!classeId}
            onChange={lireFichier}
          />
        </label>
        {erreurFichier && (
          <p className="mt-1.5 text-xs text-[#DC2626]">{erreurFichier}</p>
        )}
      </div>

      <div className="flex justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
