# Review — Module 2 : Recettes (`app/(protected)/recettes/page.tsx`)

Commit reviewé : `a610d9a feat: implement module 2 recettes page with scolaire/annexe consolidation, filters, and modal form`

---

## Evidence per criterion

### 1. Tableau consolidé (scolaires depuis paiements + annexes depuis store)

`recettesScolaires` est dérivé de `paiements` via `useMemo` (lignes 68-82). Chaque paiement devient une `Recette` de type `'scolaire'`.  
`recettesAnnexes` filtre `recettes` du store sur `r.type === 'annexe'` (ligne 85).  
Les deux tableaux sont concaténés et triés dans `toutesRecettes` (lignes 88-96). **✓**

### 2. Formulaire recette annexe

Champs présents : date, catégorie (Select), libellé, montant GNF, agent (read-only depuis `utilisateur` du auth-store).  
5 catégories exactes dans `CATEGORIES_ANNEXE` : `"Frais d'examen"`, `"Activités périscolaires"`, `"Fournitures"`, `"Subvention"`, `"Autre"` — correspond exactement aux valeurs mock et au cahier des charges.  
La soumission appelle `ajouterRecette(nouvelleRecette)` du data-store. `agentId` est positionné à `utilisateur.id` (ligne 136). **✓**

### 3. Filtres période et catégorie

Filtres `filtreDebut`, `filtreFin`, `filtreCategorie` appliqués dans `recettesFiltrees` via comparaison de chaînes ISO (`r.date >= filtreDebut`), ce qui est correct pour le format `YYYY-MM-DD` produit par `<input type="date">`. Le filtre catégorie compare `r.categorie === filtreCategorie`. **✓**

### 4. Total consolidé

`totalConsolide` est la somme de `recettesFiltrees` (lignes 109-111), affiché dans le pied du tableau uniquement quand `recettesFiltrees.length > 0`. **✓**

### 5. `formatGNF` pour tous les montants

Seul champ numérique affiché dans le tableau : `r.montant` (via `{formatGNF(r.montant)}`). Le total consolidé utilise aussi `{formatGNF(totalConsolide)}`. Aucun montant brut exposé à l'utilisateur. **✓**

### 6. `'use client'`, TypeScript strict (zéro `any`, zéro `as unknown`)

Directive `'use client'` présente en ligne 1.  
Aucune occurrence de `any` ni `as unknown` dans le fichier.  
Seule assertion de type : `form.categorie as CategorieAnnexe` (ligne 133), légitimée par la validation préalable dans `validerForm` qui rejette `form.categorie === ''`. **✓**

### 7. Responsive, interface française

Grille de filtres en `grid-cols-1 sm:grid-cols-3`. Tableau avec `overflow-x-auto`. Labels, messages d'erreur, boutons et en-têtes tous en français. **✓**

---

## Blockers

Aucun.

---

**Verdict : APPROVED**
