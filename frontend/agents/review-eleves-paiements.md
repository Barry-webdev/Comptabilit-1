# Revue de code — Modules Élèves et Paiements

**Verdict : APPROVED**  
Aucun bloqueur détecté sur les six critères.

---

## Fichiers examinés

| Fichier | Rôle |
|---|---|
| `app/(protected)/eleves/page.tsx` | Liste et filtre des élèves, modal d'inscription |
| `app/(protected)/eleves/[id]/page.tsx` | Fiche détaillée élève avec suivi par tranche |
| `components/eleves/FormulaireEleve.tsx` | Formulaire d'inscription d'un élève |
| `app/(protected)/paiements/page.tsx` | Liste des paiements avec filtres |
| `components/paiements/FormulairePaiement.tsx` | Saisie d'un paiement avec contrôle de solde |
| `components/recus/ApercuRecu.tsx` | Aperçu et impression du reçu |

Fichiers de support lus : `store/data-store.ts`, `lib/utils.ts`, `lib/mock-data.ts`.

---

## Critères vérifiés

### 1. TypeScript strict — pas de `any`
Tous les composants utilisent des types explicites. `Record<string, string>` pour les erreurs de formulaire. L'accès `frais[key as 'tranche1'|'tranche2'|'tranche3']` est une assertion de clé discriminée valide. Aucune annotation `any` trouvée.  
**→ Conforme**

### 2. `'use client'` sur tous les composants avec hooks
Chaque fichier utilisant `useState`, `useMemo` ou `useParams` porte `'use client'` en première ligne.  
**→ Conforme**

### 3. Validation matricule unique
`FormulaireEleve.tsx` appelle `verifierMatriculeUnique(matricule.trim())` avant la soumission. L'implémentation dans `data-store.ts` vérifie `!eleves.some(e => e.matricule === matricule)` sur l'état courant du store.  
**→ Conforme**

### 4. Contrôle montant ≤ solde restant
`FormulairePaiement.tsx` — `valider()` :
- Bloque avec "tranche déjà soldée" si `soldeRestant === 0`.
- Bloque avec le solde formaté en GNF si `montant > soldeRestant`.
- Le champ montant est `disabled` quand `soldeRestant === 0`.
- `calculerSoldeRestant` dans `utils.ts` relit les `paiements` en direct depuis le store.  
**→ Conforme**

### 5. Génération du reçu après paiement
`FormulairePaiement.tsx` — `soumettre()` :
1. Appelle `ajouterPaiement`.
2. Construit l'objet `Recu` avec `soldeRestant` recalculé.
3. Appelle `ajouterRecu`.
4. Positionne `recuGenere`.

Le rendu détecte `recuGenere && eleveSelectionne` et affiche `<ApercuRecu>` avec le reçu, l'élève, le nom du comptable, le motif, et les options impression/PDF via `GenerateurPDF` chargé à la demande (`dynamic`, `ssr: false`).  
**→ Conforme**

### 6. Interface en français
Tous les libellés, messages d'erreur, en-têtes de colonnes, badges de statut et textes de boutons sont en français.  
**→ Conforme**

---

## Observations non bloquantes (hors périmètre)

- **`comptableId` codé en dur** (`'usr-02'`) dans `FormulairePaiement.tsx` : attendu, l'authentification sera gérée côté backend.
- **Numéro de reçu** (`genererNumeroRecu`) : dérivé de l'état avant `ajouterRecu`, donc théoriquement sujet à collision en cas de soumissions simultanées. En pratique non atteignable avec le store Zustand synchrone et le remplacement immédiat du formulaire par `ApercuRecu`. Problème structurel pré-existant, hors périmètre de cette revue.
