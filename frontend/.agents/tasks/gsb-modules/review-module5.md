# Review – Module 5 : Paramètres (`app/(protected)/parametres/page.tsx`)

**Commit examiné** : `6430546` — feat: implement module 5 parametres page (annees, classes, frais, utilisateurs) -- build: next build passed, TypeScript clean

---

## Critère 1 — Redirection si rôle ≠ administratrice ✅

`useRouter` est importé depuis `next/navigation` (ligne 3).  
Un `useEffect` (lignes 30-34) appelle `router.replace('/dashboard')` dès que `role !== 'administratrice'`.  
Un garde `if (role !== 'administratrice') return null` (ligne 36) empêche tout rendu prématuré.  
Le pattern est correct et conforme.

---

## Critère 2 — 4 onglets ✅

Le tableau `onglets` (lignes 39-44) déclare exactement :
- `annees` → "Années scolaires"
- `classes` → "Classes"
- `frais` → "Frais scolaires"
- `utilisateurs` → "Utilisateurs"

Le routage par état `ongletActif` (lignes 76-80) monte le composant correspondant.

---

## Critère 3 — Années scolaires : liste, création, activation, clôture via store ✅

`OngletAnnees` consomme `ajouterAnneeScolaire`, `activerAnneeScolaire`, `cloturerAnneeScolaire` depuis `useDataStore` — toutes trois définies dans `store/data-store.ts`.  
Badges `success`/`neutral` sur le statut.  
La modale valide la présence du nom avant d'appeler le store.  
Un nouvelle `AnneeScolaire` est créée avec `statut: 'active'` par défaut, cohérent avec le type (`'active' | 'cloturee'`).

---

## Critère 4 — Classes : liste, modification locale ou via store ✅

`OngletClasses` stocke un état local `classesLocales` initialisé depuis le store.  
Le store n'expose pas `mettreAJourClasse` ; le composant documente ce choix en commentaire (ligne 220).  
Ajout et modification locaux fonctionnent ; la validation de libellé vide est assurée.

---

## Critère 5 — Frais scolaires : sélecteur, 3 tranches, modification via `mettreAJourFraisClasse`, `totalAnnuel` calculé ✅

`OngletFrais` utilise `mettreAJourFraisClasse` (définie dans le store).  
`totalAnnuel` est recalculé à la soumission : `t1 + t2 + t3` (ligne 362).  
Un total prévisualisé en temps réel s'affiche dans la modale via la somme des champs (lignes 405-412).  
Le sélecteur d'année est alimenté par `anneesScolaires` du store ; l'année active est présélectionnée.  
Validation : chaque montant doit être un nombre ≥ 0, chaque date est requise.  
Si aucune entrée n'existe encore pour la combinaison classe/année, un objet vide est synthétisé et inséré via `mettreAJourFraisClasse` (branche `index === -1` du store).

---

## Critère 6 — Utilisateurs : liste avec badges, création via `ajouterUtilisateur` ✅

`OngletUtilisateurs` appelle `ajouterUtilisateur` du store.  
Badge `success` pour `administratrice`, badge `info` pour `comptable`.  
Formulaire complet : nom, prénom, identifiant, rôle (Select), mot de passe ; tous validés sauf le rôle (initialisé à `'comptable'`, choix contraint).  
Le mot de passe n'est pas stocké dans l'objet `Utilisateur` (le type ne le prévoit pas) — c'est cohérent avec l'architecture mock-data actuelle.

---

## Critère 7 — `formatGNF` pour tous les montants ✅

Tous les montants affichés passent par `formatGNF` :
- `totalAnnuel`, `tranche1.montant`, `tranche2.montant`, `tranche3.montant` dans le tableau frais.
- Total prévisualisé dans la modale frais.
Aucun montant numérique n'est affiché brut.

---

## Critère 8 — `'use client'`, TypeScript strict, zéro `any`, zéro `as unknown` ✅

`'use client'` est présent en ligne 1.  
Le fichier n'utilise pas `any`.  
Le seul cast présent est `e.target.value as 'administratrice' | 'comptable'` (ligne 530) — une union string littérale, pas `as unknown`, accepté.  
Le type générique `champ<K extends keyof FormUtilisateur>` est correctement contraint.  
Le commit indique « TypeScript clean » et le build Next.js a passé.

---

## Critère 9 — Responsive, interface française ✅

Libellés, en-têtes, placeholders et messages d'erreur sont en français.  
Responsive : `flex-col sm:flex-row` sur l'en-tête frais, `grid-cols-1 sm:grid-cols-2` sur le formulaire utilisateur, `overflow-x-auto` sur tous les tableaux, onglets en `overflow-x-auto` avec `whitespace-nowrap`.

---

## Résultat

Aucun bloquant. Tous les critères sont satisfaits.
