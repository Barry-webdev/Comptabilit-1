'use client';

import { useState } from 'react';
import { useClasses } from '@/hooks/useClasses';
import { useAnneesScolaires } from '@/hooks/useAnneesScolaires';
import { elevesApi } from '@/lib/api';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';

type Props = {
  onSuccess: () => void;
  onCancel: () => void;
  onRefetch?: () => void;
};

export default function FormulaireEleve({ onSuccess, onCancel, onRefetch }: Props) {
  const { data: classes } = useClasses();
  const { data: anneesScolaires } = useAnneesScolaires();

  const classesList = classes ?? [];
  const anneesList = anneesScolaires ?? [];

  const anneeActiveId = anneesList.find((a) => a.statut === 'active')?.id ?? '';

  const [matricule, setMatricule] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [classeId, setClasseId] = useState('');
  const [anneeScolaireId, setAnneeScolaireId] = useState(anneeActiveId);
  const [contactParent, setContactParent] = useState('');

  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [erreurApi, setErreurApi] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const optionsClasses = [
    { value: '', label: 'Choisir une classe' },
    ...classesList.map((c) => ({ value: c.id, label: c.libelle })),
  ];

  const optionsAnnees = [
    { value: '', label: 'Choisir une année' },
    ...anneesList.map((a) => ({ value: a.id, label: a.nom })),
  ];

  function valider(): boolean {
    const nouvellesErreurs: Record<string, string> = {};
    if (!matricule.trim()) nouvellesErreurs.matricule = 'Le matricule est obligatoire';
    if (!nom.trim()) nouvellesErreurs.nom = 'Le nom est obligatoire';
    if (!prenom.trim()) nouvellesErreurs.prenom = 'Le prénom est obligatoire';
    if (!classeId) nouvellesErreurs.classeId = 'La classe est obligatoire';
    if (!anneeScolaireId) nouvellesErreurs.anneeScolaireId = "L'année scolaire est obligatoire";
    if (!contactParent.trim()) nouvellesErreurs.contactParent = 'Le contact parent est obligatoire';
    setErreurs(nouvellesErreurs);
    return Object.keys(nouvellesErreurs).length === 0;
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    if (!valider()) return;

    setEnCours(true);
    setErreurApi(null);
    try {
      await elevesApi.creer({
        matricule: matricule.trim(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        classeId,
        anneeScolaireId,
        contactParent: contactParent.trim(),
      });
      onRefetch?.();
      onSuccess();
    } catch (err) {
      setErreurApi(err instanceof Error ? err.message : 'Erreur lors de la création');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="space-y-4">
      {erreurApi && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {erreurApi}
        </div>
      )}
      <Input
        id="matricule"
        label="Matricule"
        placeholder="Ex : AB10145831"
        value={matricule}
        onChange={(e) => setMatricule(e.target.value)}
        erreur={erreurs.matricule}
      />
      <Input
        id="nom"
        label="Nom"
        placeholder="Nom de famille"
        value={nom}
        onChange={(e) => setNom(e.target.value)}
        erreur={erreurs.nom}
      />
      <Input
        id="prenom"
        label="Prénom"
        placeholder="Prénom"
        value={prenom}
        onChange={(e) => setPrenom(e.target.value)}
        erreur={erreurs.prenom}
      />
      <Select
        id="classeId"
        label="Classe"
        options={optionsClasses}
        value={classeId}
        onChange={(e) => setClasseId(e.target.value)}
        erreur={erreurs.classeId}
      />
      <Select
        id="anneeScolaireId"
        label="Année scolaire"
        options={optionsAnnees}
        value={anneeScolaireId}
        onChange={(e) => setAnneeScolaireId(e.target.value)}
        erreur={erreurs.anneeScolaireId}
      />
      <Input
        id="contactParent"
        label="Contact parent"
        placeholder="Ex : 620 11 22 33"
        value={contactParent}
        onChange={(e) => setContactParent(e.target.value)}
        erreur={erreurs.contactParent}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={enCours}>
          Annuler
        </Button>
        <Button type="submit" disabled={enCours}>
          {enCours ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  );
}
