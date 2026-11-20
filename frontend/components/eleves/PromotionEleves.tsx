'use client';

import { useState, useMemo } from 'react';
import { useClasses } from '@/hooks/useClasses';
import { useAnneesScolaires } from '@/hooks/useAnneesScolaires';
import { useEleves } from '@/hooks/useEleves';
import { elevesApi, type IEleve } from '@/lib/api';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';

type Props = {
  onSuccess: (nb: number) => void;
  onCancel: () => void;
  onRefetch?: () => void;
};

type DecisionEleve = {
  eleve: IEleve;
  nouvelleClasseId: string;
  action: 'promouvoir' | 'redoubler' | 'exclure';
};

type Etape = 'config' | 'apercu' | 'resultat';

export default function PromotionEleves({ onSuccess, onCancel, onRefetch }: Props) {
  const { data: elevesData } = useEleves();
  const { data: classesData } = useClasses();
  const { data: anneesScolairesData } = useAnneesScolaires();

  const eleves = elevesData ?? [];
  const classes = classesData ?? [];
  const anneesScolaires = anneesScolairesData ?? [];

  const [etape, setEtape] = useState<Etape>('config');
  const [anneeSourceId, setAnneeSourceId] = useState('');
  const [anneeCibleId, setAnneeCibleId] = useState('');
  const [decisions, setDecisions] = useState<DecisionEleve[]>([]);
  const [nbPromus, setNbPromus] = useState(0);
  const [filtreClasse, setFiltreClasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreurConfirm, setErreurConfirm] = useState<string | null>(null);

  const optionsAnnees = anneesScolaires.map((a) => ({
    value: a.id,
    label: a.nom + (a.statut === 'active' ? ' (active)' : ''),
  }));

  const optionsClasses = [
    { value: '', label: '— Exclure (diplômé / départ)' },
    ...classes.map((c) => ({ value: c.id, label: c.libelle })),
  ];

  function classesSuivante(classeId: string): string {
    const idx = classes.findIndex((c) => c.id === classeId);
    if (idx === -1 || idx >= classes.length - 1) return '';
    return classes[idx + 1].id;
  }

  function libelleClasse(classeId: string) {
    return classes.find((c) => c.id === classeId)?.libelle ?? '—';
  }

  function genererApercu() {
    const elevesSource = eleves.filter((e) => e.anneeScolaireId === anneeSourceId);
    const dejaDansAnneeCible = new Set(
      eleves.filter((e) => e.anneeScolaireId === anneeCibleId).map((e) => e.matricule)
    );

    const dec: DecisionEleve[] = elevesSource
      .filter((e) => !dejaDansAnneeCible.has(e.matricule))
      .map((e) => {
        const nouvelleClasseId = classesSuivante(e.classeId);
        return {
          eleve: e,
          nouvelleClasseId,
          action: nouvelleClasseId === '' ? 'exclure' : 'promouvoir',
        };
      });

    setDecisions(dec);
    setEtape('apercu');
  }

  function mettreAJourDecision(eleveId: string, nouvelleClasseId: string, action: DecisionEleve['action']) {
    setDecisions((prev) =>
      prev.map((d) => (d.eleve.id === eleveId ? { ...d, nouvelleClasseId, action } : d))
    );
  }

  async function confirmer() {
    const aPromouvoir = decisions.filter((d) => d.action !== 'exclure');
    setEnCours(true);
    setErreurConfirm(null);
    try {
      await Promise.allSettled(
        aPromouvoir.map((d) =>
          elevesApi.creer({
            matricule: d.eleve.matricule,
            nom: d.eleve.nom,
            prenom: d.eleve.prenom,
            classeId: d.nouvelleClasseId,
            anneeScolaireId: anneeCibleId,
            contactParent: d.eleve.contactParent,
          })
        )
      );
      setNbPromus(aPromouvoir.length);
      onRefetch?.();
      setEtape('resultat');
    } catch (err) {
      setErreurConfirm(err instanceof Error ? err.message : 'Erreur lors de la promotion');
    } finally {
      setEnCours(false);
    }
  }

  const nbAPromouvoir = decisions.filter((d) => d.action !== 'exclure').length;
  const nbExclus = decisions.filter((d) => d.action === 'exclure').length;
  const nbRedoublants = decisions.filter((d) => d.action === 'redoubler').length;
  const anneeSource = anneesScolaires.find((a) => a.id === anneeSourceId);
  const anneeCible = anneesScolaires.find((a) => a.id === anneeCibleId);

  const erreurConfig = useMemo(() => {
    if (!anneeSourceId || !anneeCibleId) return null;
    if (anneeSourceId === anneeCibleId) return "L'année source et l'année cible doivent être différentes.";
    const elevesSource = eleves.filter((e) => e.anneeScolaireId === anneeSourceId);
    if (elevesSource.length === 0) return "Aucun élève trouvé dans l'année source.";
    return null;
  }, [anneeSourceId, anneeCibleId, eleves]);

  // ── Étape 3 : Résultat ───────────────────────────────────────────────
  if (etape === 'resultat') {
    return (
      <div className="space-y-5 text-center">
        <div className="rounded-2xl p-6 bg-green-50 border border-green-200">
          <p className="text-4xl mb-3">🎓</p>
          <p className="text-xl font-bold text-[#172B4D]">
            {nbPromus} élève{nbPromus > 1 ? 's' : ''} promu{nbPromus > 1 ? 's' : ''}
          </p>
          <p className="text-sm text-[#64748B] mt-1">
            Vers l'année scolaire <strong>{anneeCible?.nom}</strong>
          </p>
          {nbExclus > 0 && (
            <p className="text-xs text-[#D97706] mt-2">
              {nbExclus} élève{nbExclus > 1 ? 's' : ''} exclu{nbExclus > 1 ? 's' : ''} (diplômés / départs)
            </p>
          )}
          {nbRedoublants > 0 && (
            <p className="text-xs text-[#64748B] mt-1">
              {nbRedoublants} redoublant{nbRedoublants > 1 ? 's' : ''} maintenus en même classe
            </p>
          )}
        </div>
        <Button onClick={() => onSuccess(nbPromus)} className="w-full">
          Fermer
        </Button>
      </div>
    );
  }

  // ── Étape 2 : Aperçu et décisions ───────────────────────────────────
  if (etape === 'apercu') {
    return (
      <div className="space-y-4">
        {/* Résumé */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-green-600">{nbAPromouvoir}</p>
            <p className="text-xs text-[#64748B] mt-0.5">À promouvoir</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#D97706]">{nbRedoublants}</p>
            <p className="text-xs text-[#64748B] mt-0.5">Redoublants</p>
          </div>
          <div className="bg-[#F5F7F6] border border-[#E2E8F0] rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-[#64748B]">{nbExclus}</p>
            <p className="text-xs text-[#64748B] mt-0.5">Exclus</p>
          </div>
        </div>

        {/* Info */}
        <div className="bg-[#F5F7F6] border border-[#E2E8F0] rounded-xl px-4 py-3 text-xs text-[#64748B]">
          <strong className="text-[#172B4D]">{anneeSource?.nom}</strong> → <strong className="text-[#172B4D]">{anneeCible?.nom}</strong>
          <span className="ml-2">· Ajustez les décisions si nécessaire avant de confirmer.</span>
        </div>

        {erreurConfirm && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {erreurConfirm}
          </div>
        )}

        {/* Filtre par classe */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltreClasse('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              filtreClasse === ''
                ? 'bg-[#172B4D] text-white border-[#172B4D]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#172B4D] hover:text-[#172B4D]'
            }`}
          >
            Toutes les classes
            <span className="ml-1.5 opacity-70">({decisions.length})</span>
          </button>
          {classes
            .filter((c) => decisions.some((d) => d.eleve.classeId === c.id))
            .map((c) => {
              const nb = decisions.filter((d) => d.eleve.classeId === c.id).length;
              const nbExclusClasse = decisions.filter((d) => d.eleve.classeId === c.id && d.action === 'exclure').length;
              return (
                <button
                  key={c.id}
                  onClick={() => setFiltreClasse(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    filtreClasse === c.id
                      ? 'bg-[#176B45] text-white border-[#176B45]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#176B45] hover:text-[#176B45]'
                  }`}
                >
                  {c.libelle}
                  <span className="ml-1.5 opacity-70">({nb})</span>
                  {nbExclusClasse > 0 && (
                    <span className="ml-1 text-red-400">·{nbExclusClasse}✕</span>
                  )}
                </button>
              );
            })}
        </div>

        {/* Tableau des décisions */}
        <div className="rounded-xl border border-[#E2E8F0] overflow-hidden max-h-80 overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-[#172B4D] text-white">
              <tr>
                <th className="px-3 py-2 text-left">Élève</th>
                <th className="px-3 py-2 text-left">Classe actuelle</th>
                <th className="px-3 py-2 text-left">Nouvelle classe</th>
                <th className="px-3 py-2 text-left">Décision</th>
              </tr>
            </thead>
            <tbody>
              {decisions
                .filter((d) => filtreClasse === '' || d.eleve.classeId === filtreClasse)
                .map((d) => (
                  <tr
                    key={d.eleve.id}
                    className={`border-b border-[#E2E8F0] last:border-0 transition-colors ${
                      d.action === 'exclure'
                        ? 'bg-gray-50 opacity-60'
                        : d.action === 'redoubler'
                        ? 'bg-amber-50/50'
                        : 'bg-white hover:bg-[#F5F7F6]'
                    }`}
                  >
                    <td className="px-3 py-2">
                      <p className="font-semibold text-[#172B4D]">{d.eleve.prenom} {d.eleve.nom}</p>
                      <p className="font-mono text-[#64748B]">{d.eleve.matricule}</p>
                    </td>
                    <td className="px-3 py-2 text-[#64748B]">
                      {libelleClasse(d.eleve.classeId)}
                    </td>
                    <td className="px-3 py-2 min-w-[180px]">
                      <div className="flex items-center gap-2">
                        <select
                          value={d.nouvelleClasseId}
                          onChange={(e) => {
                            const val = e.target.value;
                            const action = val === ''
                              ? 'exclure'
                              : val === d.eleve.classeId
                              ? 'redoubler'
                              : 'promouvoir';
                            mettreAJourDecision(d.eleve.id, val, action);
                          }}
                          disabled={d.action === 'exclure'}
                          className="flex-1 text-xs px-2 py-1 rounded-lg border border-[#E2E8F0] text-[#172B4D] focus:outline-none focus:ring-1 focus:ring-[#176B45] bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {classes.map((c) => (
                            <option key={c.id} value={c.id}>{c.libelle}</option>
                          ))}
                        </select>
                        {d.action !== 'exclure' ? (
                          <button
                            type="button"
                            title="Exclure cet élève"
                            onClick={() => mettreAJourDecision(d.eleve.id, '', 'exclure')}
                            className="shrink-0 w-7 h-7 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 hover:border-red-400 transition-colors flex items-center justify-center text-xs font-bold"
                          >
                            ✕
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Réintégrer cet élève"
                            onClick={() => {
                              const classeAuto = classesSuivante(d.eleve.classeId);
                              const classeRetour = classeAuto || d.eleve.classeId;
                              const action = classeAuto === '' ? 'redoubler' : 'promouvoir';
                              mettreAJourDecision(d.eleve.id, classeRetour, action);
                            }}
                            className="shrink-0 w-7 h-7 rounded-lg border border-green-200 bg-green-50 text-green-600 hover:bg-green-100 hover:border-green-400 transition-colors flex items-center justify-center text-xs font-bold"
                          >
                            ↩
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {d.action === 'promouvoir' && (
                        <span className="inline-flex items-center gap-1 text-green-600 font-semibold">↑ Promu</span>
                      )}
                      {d.action === 'redoubler' && (
                        <span className="inline-flex items-center gap-1 text-[#D97706] font-semibold">↺ Redoublant</span>
                      )}
                      {d.action === 'exclure' && (
                        <span className="inline-flex items-center gap-1 text-[#64748B] font-semibold">✗ Exclu</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {decisions.length === 0 && (
          <p className="text-sm text-center text-[#64748B] py-4">
            Tous les élèves de cette année sont déjà dans l'année cible.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="secondary" onClick={() => setEtape('config')} disabled={enCours}>
            ← Retour
          </Button>
          <Button onClick={confirmer} disabled={nbAPromouvoir === 0 || enCours}>
            {enCours ? 'Promotion en cours…' : `🎓 Promouvoir ${nbAPromouvoir} élève${nbAPromouvoir > 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    );
  }

  // ── Étape 1 : Configuration ──────────────────────────────────────────
  return (
    <div className="space-y-5">
      <div className="bg-[#F5F7F6] border border-[#E2E8F0] rounded-xl px-4 py-3 text-sm text-[#64748B]">
        <p className="font-medium text-[#172B4D] mb-1">Promotion de classe</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Choisissez l'année scolaire source (celle qui se termine)</li>
          <li>Choisissez l'année scolaire cible (la nouvelle)</li>
          <li>Vérifiez et ajustez les décisions pour chaque élève</li>
          <li>Confirmez — les élèves sont créés dans la nouvelle année</li>
        </ol>
      </div>

      <Select
        id="anneeSource"
        label="Année scolaire source (qui se termine)"
        options={[{ value: '', label: 'Sélectionner…' }, ...optionsAnnees]}
        value={anneeSourceId}
        onChange={(e) => setAnneeSourceId(e.target.value)}
      />

      <Select
        id="anneeCible"
        label="Année scolaire cible (nouvelle année)"
        options={[{ value: '', label: 'Sélectionner…' }, ...optionsAnnees]}
        value={anneeCibleId}
        onChange={(e) => setAnneeCibleId(e.target.value)}
      />

      {erreurConfig && (
        <p className="text-xs text-[#DC2626] font-medium">{erreurConfig}</p>
      )}

      {anneeSourceId && anneeCibleId && !erreurConfig && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-xs text-green-700">
          <strong>{eleves.filter((e) => e.anneeScolaireId === anneeSourceId).length} élèves</strong> seront préparés pour la promotion de <strong>{anneeSource?.nom}</strong> vers <strong>{anneeCible?.nom}</strong>.
        </div>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="secondary" onClick={onCancel}>Annuler</Button>
        <Button
          onClick={genererApercu}
          disabled={!anneeSourceId || !anneeCibleId || !!erreurConfig}
        >
          Voir l'aperçu →
        </Button>
      </div>
    </div>
  );
}
