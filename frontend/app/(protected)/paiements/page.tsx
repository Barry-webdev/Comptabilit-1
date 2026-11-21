'use client';

import { useState } from 'react';
import { usePaiements, useEleves, useClasses, useRecus } from '@/hooks';
import { formatGNF, formatDate } from '@/lib/utils';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FormulairePaiement from '@/components/paiements/FormulairePaiement';

const TRANCHES = [
  { value: '', label: 'Toutes les tranches' },
  { value: 'tranche1', label: 'Tranche 1' },
  { value: 'tranche2', label: 'Tranche 2' },
  { value: 'tranche3', label: 'Tranche 3' },
];

export default function PaiementsPage() {
  const { data: paiements, loading, error, refetch } = usePaiements();
  const { data: eleves } = useEleves();
  const { data: classes } = useClasses();
  const { data: recus } = useRecus();

  const paiementsList = paiements ?? [];
  const elevesList = eleves ?? [];
  const classesList = classes ?? [];
  const recusList = recus ?? [];

  const [modalOuverte, setModalOuverte] = useState(false);
  const [filtreClasse, setFiltreClasse] = useState('');
  const [filtreTranche, setFiltreTranche] = useState('');
  const [filtreDebut, setFiltreDebut] = useState('');
  const [filtreFin, setFiltreFin] = useState('');

  const optionsClasses = [
    { value: '', label: 'Toutes les classes' },
    ...classesList.map((c) => ({ value: c.id, label: c.libelle })),
  ];

  function libelleClasse(classeId: string): string {
    return classesList.find((c) => c.id === classeId)?.libelle ?? classeId;
  }

  function libelleEleve(eleveId: string): { nom: string; matricule: string; classeId: string } {
    const e = elevesList.find((e) => e.id === eleveId);
    return e
      ? { nom: `${e.prenom} ${e.nom}`, matricule: e.matricule, classeId: e.classeId }
      : { nom: eleveId, matricule: '', classeId: '' };
  }

  function libelleTrancheLabel(tranche: string): string {
    return TRANCHES.find((t) => t.value === tranche)?.label ?? tranche;
  }

  function numeroRecu(recuId: string): string {
    return recusList.find((r) => r.id === recuId)?.numero ?? recuId;
  }

  const paiementsFiltres = paiementsList
    .filter((p) => {
      const info = libelleEleve(p.eleveId);
      const matchClasse = filtreClasse === '' || info.classeId === filtreClasse;
      const matchTranche = filtreTranche === '' || p.tranche === filtreTranche;
      const matchDebut = filtreDebut === '' || p.date >= filtreDebut;
      const matchFin = filtreFin === '' || p.date <= filtreFin;
      return matchClasse && matchTranche && matchDebut && matchFin;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (loading) {
    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#172B4D]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-white">
                  <th className="px-4 py-3 whitespace-nowrap">Date</th>
                  <th className="px-4 py-3 whitespace-nowrap">Élève</th>
                  <th className="px-4 py-3 whitespace-nowrap">Classe</th>
                  <th className="px-4 py-3 whitespace-nowrap">Tranche</th>
                  <th className="px-4 py-3 whitespace-nowrap">Montant</th>
                  <th className="px-4 py-3 whitespace-nowrap">N° Reçu</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b" style={{ borderColor: '#E2E8F0' }}>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#172B4D]">Paiements</h1>
        <Button onClick={() => setModalOuverte(true)}>Nouveau paiement</Button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Select
            id="filtreClasse"
            label="Classe"
            options={optionsClasses}
            value={filtreClasse}
            onChange={(e) => setFiltreClasse(e.target.value)}
          />
          <Select
            id="filtreTranche"
            label="Tranche"
            options={TRANCHES}
            value={filtreTranche}
            onChange={(e) => setFiltreTranche(e.target.value)}
          />
          <Input
            id="filtreDebut"
            label="Date début"
            type="date"
            value={filtreDebut}
            onChange={(e) => setFiltreDebut(e.target.value)}
          />
          <Input
            id="filtreFin"
            label="Date fin"
            type="date"
            value={filtreFin}
            onChange={(e) => setFiltreFin(e.target.value)}
          />
        </div>
      </div>

      {/* Liste */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#172B4D]">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-white">
                <th className="px-4 py-3 whitespace-nowrap">Date</th>
                <th className="px-4 py-3 whitespace-nowrap">Élève</th>
                <th className="px-4 py-3 whitespace-nowrap">Classe</th>
                <th className="px-4 py-3 whitespace-nowrap">Tranche</th>
                <th className="px-4 py-3 whitespace-nowrap">Montant</th>
                <th className="px-4 py-3 whitespace-nowrap">N° Reçu</th>
              </tr>
            </thead>
            <tbody>
              {paiementsFiltres.map((p, index) => {
                const info = libelleEleve(p.eleveId);
                return (
                  <tr
                    key={p.id}
                    className={`border-b last:border-0 hover:bg-[#F5F7F6] transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-[#F5F7F6]/50'
                    }`}
                    style={{ borderColor: '#E2E8F0' }}
                  >
                    <td className="px-4 py-3 text-[#64748B] whitespace-nowrap">
                      {formatDate(p.date)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[#172B4D]">{info.nom}</p>
                      <p className="text-xs font-mono text-[#64748B]">
                        {info.matricule}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-[#172B4D]">
                      {libelleClasse(info.classeId)}
                    </td>
                    <td className="px-4 py-3 text-[#172B4D]">
                      {libelleTrancheLabel(p.tranche)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#172B4D] whitespace-nowrap">
                      {formatGNF(p.montant)}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                      {numeroRecu(p.recuId)}
                    </td>
                  </tr>
                );
              })}
              {paiementsFiltres.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#64748B]"
                  >
                    Aucun paiement trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOuverte}
        onClose={() => setModalOuverte(false)}
        title="Nouveau paiement"
        large
      >
        <FormulairePaiement
          onSuccess={() => { setModalOuverte(false); refetch(); }}
          onCancel={() => setModalOuverte(false)}
        />
      </Modal>
    </div>
  );
}
