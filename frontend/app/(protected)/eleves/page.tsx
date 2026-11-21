'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEleves, useClasses, useAnneesScolaires } from '@/hooks';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Skeleton from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import FormulaireEleve from '@/components/eleves/FormulaireEleve';
import ImportEleves from '@/components/eleves/ImportEleves';
import PromotionEleves from '@/components/eleves/PromotionEleves';

export default function ElevesPage() {
  const { data: eleves, loading, error, refetch } = useEleves();
  const { data: classes } = useClasses();
  const { data: anneesScolaires } = useAnneesScolaires();

  const elevesList = eleves ?? [];
  const classesList = classes ?? [];
  const anneesScolairesList = anneesScolaires ?? [];

  const [modalOuverte, setModalOuverte] = useState(false);
  const [modalImportOuverte, setModalImportOuverte] = useState(false);
  const [modalPromotionOuverte, setModalPromotionOuverte] = useState(false);
  const [banniereImport, setBanniereImport] = useState<string | null>(null);
  const [filtreMatricule, setFiltreMatricule] = useState('');
  const [filtreNom, setFiltreNom] = useState('');
  const [filtrePrenom, setFiltrePrenom] = useState('');
  const [filtreClasse, setFiltreClasse] = useState('');

  const optionsClasses = [
    { value: '', label: 'Toutes les classes' },
    ...classesList.map((c) => ({ value: c.id, label: c.libelle })),
  ];

  const elevesFiltres = elevesList.filter((e) => {
    const matchMatricule = e.matricule.toLowerCase().includes(filtreMatricule.toLowerCase());
    const matchNom = e.nom.toLowerCase().includes(filtreNom.toLowerCase());
    const matchPrenom = e.prenom.toLowerCase().includes(filtrePrenom.toLowerCase());
    const matchClasse = filtreClasse === '' || e.classeId === filtreClasse;
    return matchMatricule && matchNom && matchPrenom && matchClasse;
  });

  function libelleClasse(classeId: string): string {
    return classesList.find((c) => c.id === classeId)?.libelle ?? classeId;
  }

  function libelleAnnee(anneeId: string): string {
    return anneesScolairesList.find((a) => a.id === anneeId)?.nom ?? anneeId;
  }

  function handleImportSuccess(nb: number) {
    setModalImportOuverte(false);
    setBanniereImport(`${nb} élève${nb > 1 ? 's' : ''} importé${nb > 1 ? 's' : ''} avec succès.`);
    setTimeout(() => setBanniereImport(null), 5000);
    refetch();
  }

  function handlePromotionSuccess(nb: number) {
    setModalPromotionOuverte(false);
    setBanniereImport(`🎓 ${nb} élève${nb > 1 ? 's' : ''} promu${nb > 1 ? 's' : ''} avec succès.`);
    setTimeout(() => setBanniereImport(null), 5000);
    refetch();
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <Skeleton className="h-7 w-28 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-36 rounded-xl" />
            <Skeleton className="h-9 w-32 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
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
              <thead>
                <tr className="bg-[#172B4D] text-white text-left text-xs font-semibold uppercase tracking-wide">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">Prénom</th>
                  <th className="px-4 py-3">Classe</th>
                  <th className="px-4 py-3">Année scolaire</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E2E8F0]">
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-4 py-3"><Skeleton className="h-8 w-24 rounded-lg" /></td>
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
      {/* Bannière succès import */}
      {banniereImport && (
        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-green-700">âœ… {banniereImport}</p>
          <button onClick={() => setBanniereImport(null)} className="text-green-500 hover:text-green-700 text-lg leading-none">×</button>
        </div>
      )}

      {/* En-tête */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#172B4D]">Élèves</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{elevesFiltres.length} élève{elevesFiltres.length > 1 ? 's' : ''} trouvé{elevesFiltres.length > 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => setModalPromotionOuverte(true)}>
            🎓 Promotion de classe
          </Button>
          <Button variant="secondary" onClick={() => setModalImportOuverte(true)}>
            ↑ Importer Excel
          </Button>
          <Button onClick={() => setModalOuverte(true)}>
            + Nouvel élève
          </Button>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            id="filtreMatricule"
            label="Matricule"
            placeholder="Ex : AB10145831"
            value={filtreMatricule}
            onChange={(e) => setFiltreMatricule(e.target.value)}
          />
          <Input
            id="filtreNom"
            label="Nom"
            placeholder="Rechercher…"
            value={filtreNom}
            onChange={(e) => setFiltreNom(e.target.value)}
          />
          <Input
            id="filtrePrenom"
            label="Prénom"
            placeholder="Rechercher…"
            value={filtrePrenom}
            onChange={(e) => setFiltrePrenom(e.target.value)}
          />
          <Select
            id="filtreClasse"
            label="Classe"
            options={optionsClasses}
            value={filtreClasse}
            onChange={(e) => setFiltreClasse(e.target.value)}
          />
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#172B4D] text-white text-left text-xs font-semibold uppercase tracking-wide">
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Prénom</th>
                <th className="px-4 py-3">Classe</th>
                <th className="px-4 py-3">Année scolaire</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {elevesFiltres.map((eleve, index) => (
                <tr
                  key={eleve.id}
                  className={`border-b border-[#E2E8F0] last:border-0 hover:bg-[#F5F7F6] transition-colors ${
                    index % 2 === 0 ? 'bg-white' : 'bg-[#F5F7F6]/50'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-[#64748B]">
                    {eleve.matricule}
                  </td>
                  <td className="px-4 py-3 font-medium text-[#172B4D]">
                    {eleve.nom}
                  </td>
                  <td className="px-4 py-3 text-[#172B4D]">{eleve.prenom}</td>
                  <td className="px-4 py-3 text-[#172B4D]">
                    {libelleClasse(eleve.classeId)}
                  </td>
                  <td className="px-4 py-3 text-[#172B4D]">
                    {libelleAnnee(eleve.anneeScolaireId)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/eleves/${eleve.id}`}>
                      <Button variant="ghost" size="sm">
                        Voir la fiche
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {elevesFiltres.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-[#64748B]"
                  >
                    Aucun élève trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal promotion de classe */}
      <Modal
        isOpen={modalPromotionOuverte}
        onClose={() => setModalPromotionOuverte(false)}
        title="Promotion de classe"
        large
      >
        <PromotionEleves
          onSuccess={handlePromotionSuccess}
          onCancel={() => setModalPromotionOuverte(false)}
        />
      </Modal>

      {/* Modal nouvel élève */}
      <Modal
        isOpen={modalOuverte}
        onClose={() => setModalOuverte(false)}
        title="Nouvel élève"
      >
        <FormulaireEleve
          onSuccess={() => { setModalOuverte(false); refetch(); }}
          onCancel={() => setModalOuverte(false)}
        />
      </Modal>

      {/* Modal import Excel */}
      <Modal
        isOpen={modalImportOuverte}
        onClose={() => setModalImportOuverte(false)}
        title="Importer des élèves depuis Excel"
      >
        <ImportEleves
          onSuccess={handleImportSuccess}
          onCancel={() => setModalImportOuverte(false)}
        />
      </Modal>
    </div>
  );
}
