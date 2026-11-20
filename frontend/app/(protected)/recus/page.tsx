'use client';

import { useState } from 'react';
import { useRecus, useEleves, useClasses } from '@/hooks';
import { formatGNF, formatDate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import ErrorMessage from '@/components/ui/ErrorMessage';
import ApercuRecu from '@/components/recus/ApercuRecu';
import type { IRecu, IEleve } from '@/lib/api';

type RecuSelectionne = { recu: IRecu; eleve: IEleve; mode: 'apercu' | 'reimprimer' };

export default function RecusPage() {
  const { data: recus, loading, error } = useRecus();
  const { data: eleves } = useEleves();
  const { data: classes } = useClasses();

  const recusList = recus ?? [];
  const elevesList = eleves ?? [];
  const classesList = classes ?? [];

  const [filtreNumero, setFiltreNumero] = useState('');
  const [filtreEleve, setFiltreEleve] = useState('');
  const [filtreDate, setFiltreDate] = useState('');
  const [selection, setSelection] = useState<RecuSelectionne | null>(null);

  function trouverEleve(eleveId: string): IEleve | undefined {
    return elevesList.find((e) => e.id === eleveId);
  }

  function libelleClasse(classeId: string): string {
    return classesList.find((c) => c.id === classeId)?.libelle ?? classeId;
  }

  const recusFiltres = recusList
    .filter((r) => {
      const eleve = trouverEleve(r.eleveId);
      const nomComplet = eleve
        ? `${eleve.prenom} ${eleve.nom}`.toLowerCase()
        : '';

      const matchNumero =
        filtreNumero === '' ||
        r.numero.toLowerCase().includes(filtreNumero.toLowerCase());
      const matchEleve =
        filtreEleve === '' || nomComplet.includes(filtreEleve.toLowerCase());
      const matchDate =
        filtreDate === '' || r.date.startsWith(filtreDate);

      return matchNumero && matchEleve && matchDate;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  function ouvrirApercu(recu: IRecu) {
    const eleve = trouverEleve(recu.eleveId);
    if (!eleve) return;
    setSelection({ recu, eleve, mode: 'apercu' });
  }

  function ouvrirReimpression(recu: IRecu) {
    const eleve = trouverEleve(recu.eleveId);
    if (!eleve) return;
    setSelection({ recu, eleve, mode: 'reimprimer' });
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">
            Reçus de paiement
          </h1>
          <p className="mt-0.5 text-sm text-[#64748B]">
            {recusFiltres.length} reçu{recusFiltres.length !== 1 ? 's' : ''} trouvé
            {recusFiltres.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            id="filtreNumero"
            label="N° Reçu"
            placeholder="REC-000001"
            value={filtreNumero}
            onChange={(e) => setFiltreNumero(e.target.value)}
          />
          <Input
            id="filtreEleve"
            label="Nom / Prénom élève"
            placeholder="Mamadou Diallo"
            value={filtreEleve}
            onChange={(e) => setFiltreEleve(e.target.value)}
          />
          <Input
            id="filtreDate"
            label="Date"
            type="date"
            value={filtreDate}
            onChange={(e) => setFiltreDate(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th className="px-4 py-3 whitespace-nowrap">N° Reçu</th>
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Élève</th>
                <th className="px-4 py-3 whitespace-nowrap">Classe</th>
                <th className="px-4 py-3 whitespace-nowrap">Montant versé</th>
                <th className="px-4 py-3 whitespace-nowrap">Solde restant</th>
                <th className="px-4 py-3 whitespace-nowrap">Statut</th>
                <th className="px-4 py-3 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recusFiltres.map((recu, index) => {
                const eleve = trouverEleve(recu.eleveId);
                return (
                  <tr
                    key={recu.id}
                    className={`border-b last:border-0 hover:bg-[#F5F7F6] transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-[#F5F7F6]/50'
                    }`}
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-[#176B45] whitespace-nowrap">
                      {recu.numero}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                      {formatDate(recu.date)}
                    </td>
                    <td className="px-4 py-3">
                      {eleve ? (
                        <>
                          <p className="font-medium text-[#172B4D]">
                            {eleve.prenom} {eleve.nom}
                          </p>
                          <p className="text-xs font-mono text-[#64748B]">
                            {eleve.matricule}
                          </p>
                        </>
                      ) : (
                        <span className="text-[#64748B] italic">Élève introuvable</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#172B4D] whitespace-nowrap">
                      {eleve ? libelleClasse(eleve.classeId) : '—'}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#172B4D] whitespace-nowrap">
                      {formatGNF(recu.montantVerse)}
                    </td>
                    <td
                      className="px-4 py-3 font-semibold whitespace-nowrap"
                      style={{
                        color: recu.soldeRestant > 0 ? '#DC2626' : '#16A34A',
                      }}
                    >
                      {formatGNF(recu.soldeRestant)}
                    </td>
                    <td className="px-4 py-3">
                      {recu.isDuplicate === true ? (
                        <Badge variant="warning">Duplicata</Badge>
                      ) : (
                        <Badge variant="success">Original</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* Bouton aperçu */}
                        <button
                          onClick={() => ouvrirApercu(recu)}
                          disabled={!eleve}
                          title="Voir le reçu"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#176B45] hover:text-[#176B45] hover:bg-[#176B45]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        {/* Bouton réimprimer */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => ouvrirReimpression(recu)}
                          disabled={!eleve}
                        >
                          Réimprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {recusFiltres.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-[#64748B]"
                  >
                    Aucun reçu trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modale aperçu / réimpression */}
      {selection && (
        <Modal
          isOpen={selection !== null}
          onClose={() => setSelection(null)}
          title={
            selection.mode === 'apercu'
              ? `Aperçu — ${selection.recu.numero}`
              : `Réimprimer — ${selection.recu.numero}`
          }
          large
        >
          <div className="max-h-[80vh] overflow-y-auto">
            <ApercuRecu
              recu={selection.recu}
              eleve={selection.eleve}
              isDuplicate={selection.mode === 'reimprimer'}
              onFermer={() => setSelection(null)}
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
