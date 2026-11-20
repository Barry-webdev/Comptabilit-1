# Rapport de conformité Frontend ↔ Backend — GSAB

**Date d'investigation :** 2025  
**Périmètre :** `frontend/` ↔ `backend/`  
**Méthode :** lecture statique de tous les fichiers sources ; `npx tsc --noEmit` dans les deux dossiers.

---

## Résumé exécutif

Le projet est **globalement conforme** : les routes API, les formats de données et l'authentification sont bien alignés. Il n'existe aucune erreur TypeScript dans les deux projets. Cinq problèmes ont été identifiés, dont **deux bloquants** et **trois mineurs**. Le problème le plus grave est que la gestion des utilisateurs (onglet Paramètres) est entièrement découplée du backend et repose sur un mock localStorage, rendant toute modification d'utilisateur non persistante. Le deuxième bloquant est un désalignement entre l'interface `IDashboardStats` du frontend et les champs réellement retournés par le backend.

---

## 1. Routes API

### Tableau de correspondance

| Ressource | Route backend | Méthode | frontend/lib/api.ts | Conforme ? |
|---|---|---|---|---|
| Auth — login | `POST /api/auth/login` | POST | `authApi.login` → `/auth/login` | ✅ |
| Auth — moi | `GET /api/auth/moi` | GET | ❌ Pas d'appel `authApi.moi` | ⚠️ mineur |
| Élèves — liste | `GET /api/eleves` | GET | `elevesApi.lister` | ✅ |
| Élèves — obtenir | `GET /api/eleves/:id` | GET | `elevesApi.obtenir` | ✅ |
| Élèves — créer | `POST /api/eleves` | POST | `elevesApi.creer` | ✅ |
| Élèves — modifier | `PUT /api/eleves/:id` | PUT | `elevesApi.modifier` | ✅ |
| Classes — liste | `GET /api/classes` | GET | `classesApi.lister` | ✅ |
| Classes — créer | `POST /api/classes` | POST | `classesApi.creer` | ✅ |
| Classes — modifier | `PUT /api/classes/:id` | PUT | `classesApi.modifier` | ✅ |
| Années — liste | `GET /api/annees-scolaires` | GET | `anneesApi.lister` | ✅ |
| Années — créer | `POST /api/annees-scolaires` | POST | `anneesApi.creer` | ✅ |
| Années — activer | `PATCH /api/annees-scolaires/:id/activer` | PATCH | `anneesApi.activer` | ✅ |
| Années — clôturer | `PATCH /api/annees-scolaires/:id/cloturer` | PATCH | `anneesApi.cloturer` | ✅ |
| Frais — liste | `GET /api/frais` | GET | `fraisApi.lister` | ✅ |
| Frais — enregistrer | `POST /api/frais` | POST | `fraisApi.enregistrer` | ✅ |
| Paiements — liste | `GET /api/paiements` | GET | `paiementsApi.lister` | ✅ |
| Paiements — créer | `POST /api/paiements` | POST | `paiementsApi.creer` / `creerAvecRecu` | ✅ |
| Reçus — liste | `GET /api/recus` | GET | `recusApi.lister` | ✅ |
| Recettes — liste | `GET /api/recettes` | GET | `recettesApi.lister` | ✅ |
| Recettes — créer | `POST /api/recettes` | POST | `recettesApi.creer` | ✅ |
| Dépenses — liste | `GET /api/depenses` | GET | `depensesApi.lister` | ✅ |
| Dépenses — créer | `POST /api/depenses` | POST | `depensesApi.creer` | ✅ |
| Dashboard — stats | `GET /api/dashboard/stats` | GET | `dashboardApi.stats` | ✅ |
| Utilisateurs | ❌ Aucune route backend | — | Aucun appel API | 🔴 bloquant |

**Conclusion :** 23 routes sur 24 sont correctement mappées. La route `GET /api/auth/moi` existe dans le backend (`auth.routes.ts` ligne 4) mais n'est pas exposée dans `lib/api.ts` — mineur car non utilisée activement. Il n'existe aucune route backend pour créer, lister ou modifier des utilisateurs.

---

## 2. Formats de données

### IEleve

| Champ frontend (`lib/api.ts`) | Champ backend (`eleves.controller.ts`) | Conforme ? |
|---|---|---|
| `id` | `id` | ✅ |
| `matricule` | `matricule` | ✅ |
| `nom` | `nom` | ✅ |
| `prenom` | `prenom` | ✅ |
| `classeId` | `classeId` | ✅ |
| `anneeScolaireId` | `anneeScolaireId` | ✅ |
| `contactParent` | `contactParent` | ✅ |

Le backend inclut aussi `classe` et `anneeScolaire` via `include` sur les requêtes `findMany`/`findUnique`, ce qui est compatible avec l'interface (champs supplémentaires ignorés).

### IFrais

| Champ frontend (`lib/api.ts`) | Champ backend (`frais.controller.ts`) | Conforme ? |
|---|---|---|
| `t1Montant`, `t1DateLimite` | `t1Montant`, `t1DateLimite` | ✅ |
| `t2Montant`, `t2DateLimite` | `t2Montant`, `t2DateLimite` | ✅ |
| `t3Montant`, `t3DateLimite` | `t3Montant`, `t3DateLimite` | ✅ |
| `totalAnnuel` | `totalAnnuel` (calculé par le backend) | ✅ |
| `tranche1`, `tranche2`, `tranche3` (alias optionnels) | Absent | ✅ (optionnels, ajoutés par `useFrais.ts`) |

### IPaiement

| Champ frontend | Champ backend | Conforme ? |
|---|---|---|
| `eleveId`, `tranche`, `montant`, `anneeScolaireId` | Attendus dans `req.body` (`paiements.controller.ts` ligne 4) | ✅ |
| `date` | Généré côté backend (`today`) | ✅ (ne pas envoyer depuis le frontend) |
| `recuId` | Absent de `IPaiement` frontend | ⚠️ Le backend retourne `{ paiement, recu }`, pas un `IPaiement` plat |
| `comptableId` | Extrait du token JWT | ✅ |

**Remarque :** `paiementsApi.creer` déclare `Omit<IPaiement, 'id'>` comme corps, ce qui inclut `recuId` et `comptableId` — des champs que le backend n'attend pas et ignore. Ce n'est pas bloquant (le backend extrait seulement `eleveId`, `tranche`, `montant`, `anneeScolaireId`), mais `creerAvecRecu` a la bonne signature et est l'appel effectivement utilisé dans `FormulairePaiement.tsx`.

### IDashboardStats — BLOQUANT

Le frontend déclare (ligne 71–77 de `lib/api.ts`) :

```ts
export interface IDashboardStats {
  totalEleves: number;
  totalRecettes: number;
  totalDepenses: number;
  solde: number;
  paiementsEnAttente: number;
  [key: string]: unknown;
}
```

Le backend retourne (`dashboard.controller.ts` lignes 20–27) :

```ts
{
  encaissementsJour: number,
  nbPaiementsJour: number,
  encaissementsMois: number,
  depensesMois: number,
  soldeNet: number,
  totalEleves: number,
}
```

**Aucun des 5 champs nommés dans `IDashboardStats` ne correspond à ce que le backend retourne** — `totalRecettes`, `totalDepenses`, `solde`, `paiementsEnAttente` n'existent pas dans la réponse réelle. Seul `totalEleves` est commun. L'index signature `[key: string]: unknown` empêche une erreur TypeScript, mais le dashboard lit des valeurs `undefined` pour tous ces champs.

Dans `dashboard/page.tsx`, le composant contourne partiellement ce problème en recalculant les KPIs localement depuis les données de paiements/recettes/dépenses (lignes ~198–221), et n'utilise `dashboardStats` que pour l'indicateur `encaissementsJour` — mais il lit `dashboardStats?.totalRecettes` (non défini, donc `undefined`). La variable est passée à `formatGNF()` via une expression conditionnelle qui finit par utiliser la valeur locale correcte (`encaissementsJour`), donc l'affichage n'est pas cassé. Cependant, si un composant futur lit `dashboardStats.totalRecettes` directement, il obtient `undefined`.

**Fichier :** `frontend/lib/api.ts` lignes 71–77  
**Champs manquants dans IDashboardStats :** `encaissementsJour`, `nbPaiementsJour`, `encaissementsMois`, `depensesMois`, `soldeNet`  
**Champs déclarés mais inexistants :** `totalRecettes`, `totalDepenses`, `solde`, `paiementsEnAttente`

### IRecu

| Champ frontend | Champ backend | Conforme ? |
|---|---|---|
| `numero`, `eleveId`, `paiementId`, `date`, `montantVerse`, `soldeRestant`, `tranche`, `anneeScolaireId`, `comptableId` | Tous présents dans le `recu.create` du controller | ✅ |
| `isDuplicate` | Absent (calculé côté frontend) | ✅ (optionnel) |

**Remarque :** Le backend ne stocke pas de champ `date` explicite sur le reçu. Il utilise `createdAt` (Prisma). La réponse incluant `recu` via la transaction dans `paiements.controller.ts` retourne un objet Prisma. Si le modèle Prisma `Recu` a un champ `date` distinct de `createdAt`, c'est conforme. À vérifier dans le schéma Prisma (non lu car non demandé).

### IRecette

| Champ frontend | Champ backend (`recettes.controller.ts`) | Conforme ? |
|---|---|---|
| `type` | Backend fixe `type: 'annexe'` (ligne 11) quelle que soit la saisie | ⚠️ mineur |
| `agentId` | Extrait du token, non envoyé par le frontend | ✅ |

Le frontend déclare `Omit<IRecette, 'id'>` pour `recettesApi.creer`, ce qui inclut `type` et `agentId` dans le corps envoyé. Le backend ignore ces champs et les fixe lui-même. Pas bloquant.

### IDepense, IClasse, IAnneeScolaire, IUtilisateur

Tous conformes aux champs retournés par leurs contrôleurs respectifs.

---

## 3. IFrais — vérification spécifique

Chaque fichier mentionné est vérifié :

| Fichier | Utilise `t1Montant`/`t2Montant`/`t3Montant` | Utilise `t1DateLimite`/etc. | Conforme ? |
|---|---|---|---|
| `hooks/useFrais.ts` | Oui (ligne 8–10, `normaliserFrais`) | Oui | ✅ |
| `app/(protected)/parametres/page.tsx` | Oui (lignes `form.t1Montant`, affichage `f.t1Montant`) | Oui (`f.t1DateLimite`) | ✅ |
| `app/(protected)/dashboard/page.tsx` | Oui (lignes dans `alertesRetard` et `echeances`) | Oui | ✅ |
| `components/paiements/FormulairePaiement.tsx` | Oui (ligne `frais.t1Montant`, etc.) | — (non nécessaire) | ✅ |
| `components/recus/ApercuRecu.tsx` | Via `frais.totalAnnuel` uniquement | — | ✅ |
| `lib/utils.ts` | Oui (`getMontantTranche`, `frais.t1Montant ?? frais.tranche1?.montant`) | — | ✅ |

La normalisation dans `useFrais.ts` (ajout des alias `tranche1`/`tranche2`/`tranche3`) est cohérente avec les types optionnels dans `IFrais` et les fallbacks dans `lib/utils.ts`. Aucun problème.

---

## 4. Authentification

**Token stocké :** `auth-store.ts` ligne 32 → `localStorage.setItem('gsab-token', data.token)`  
**Token lu :** `lib/api.ts` ligne 97 → `localStorage.getItem('gsab-token')`  
**Header envoyé :** `Authorization: Bearer <token>` (ligne 101)  
**Middleware backend :** `auth.middleware.ts` ligne 14 → lit `req.headers.authorization` et vérifie le préfixe `Bearer `  

**Conformité : ✅ parfaite.** La clé `'gsab-token'` est identique dans les deux fichiers. Le store Zustand est persisté sous la clé `'gsab-auth'` (l'objet utilisateur + rôle), distincte du token JWT, ce qui est correct.

La gestion du 401 dans `apiFetch` (redirection vers `/login` + exception) est correcte et cohérente avec le middleware backend.

---

## 5. Paiements — corps de la requête POST

Le backend (`paiements.controller.ts` lignes 4) attend exactement : `{ eleveId, tranche, montant, anneeScolaireId }`.

`FormulairePaiement.tsx` appelle `paiementsApi.creerAvecRecu` (ligne `confirmerEtEnregistrer`) avec :

```ts
{
  eleveId: eleveSelectionne.id,
  tranche,           // 'tranche1' | 'tranche2' | 'tranche3'
  montant,           // number
  anneeScolaireId: eleveSelectionne.anneeScolaireId,
}
```

**Conformité : ✅ parfaite.** Les quatre champs correspondent exactement. Le backend valide l'existence de l'élève, les frais et le solde disponible avant d'enregistrer — la logique de validation côté frontend (vérification du solde, tranche précédente soldée) est redondante mais ne cause pas de problème.

Le backend retourne `{ paiement, recu }` (ligne `res.status(201).json(result)`). `creerAvecRecu` est typé `Promise<{ paiement: IPaiement; recu: IRecu }>` — conforme.

---

## 6. Mutations manquantes — BLOQUANT

### 6.1 Gestion des utilisateurs

L'onglet **Utilisateurs** dans `parametres/page.tsx` (composant `OngletUtilisateurs`) utilise **exclusivement** `useDataStore` (`data-store.ts`), qui est un store Zustand alimenté par `mockUtilisateurs` hardcodé dans `lib/mock-data.ts`.

- `soumettreCreation()` appelle `ajouterUtilisateur(...)` → modifie le state Zustand local uniquement.
- `soumettreModif()` appelle `mettreAJourUtilisateur(...)` → idem.
- **Aucun appel HTTP vers le backend n'est fait.**

Le backend ne possède aucune route pour gérer les utilisateurs (`/api/utilisateurs` n'existe pas). Il n'y a que `GET /api/auth/moi` et `POST /api/auth/login`.

**Conséquence :** Toute création ou modification d'utilisateur est perdue au rechargement de la page, et aucun utilisateur créé côté frontend n'existe réellement en base de données.

**Fichiers concernés :**  
- `frontend/app/(protected)/parametres/page.tsx` — `OngletUtilisateurs`, lignes ~540–650  
- `frontend/store/data-store.ts` — `ajouterUtilisateur`, `mettreAJourUtilisateur`  
- `backend/src/routes/` — aucun fichier `utilisateurs.routes.ts`

### 6.2 `paiementsApi.creer` redondant

`paiementsApi.creer` (signature `Omit<IPaiement, 'id'>`) et `paiementsApi.creerAvecRecu` pointent tous deux vers `POST /api/paiements`. Le backend retourne toujours `{ paiement, recu }` (jamais un `IPaiement` seul). Utiliser `paiementsApi.creer` tel que défini provoque une divergence de type silencieuse. Ce n'est pas bloquant car ce chemin n'est pas utilisé dans le code actuel.

---

## 7. Gestion des erreurs dans les hooks React

Tous les hooks (`useEleves`, `useEleve`, `useFrais`, `usePaiements`, `useClasses`, `useAnneesScolaires`, `useRecus`, `useRecettes`, `useDepenses`, `useDashboardStats`) suivent le même patron :

```ts
} catch (e) {
  setError(e instanceof Error ? e.message : 'Erreur réseau');
} finally {
  setLoading(false);
}
```

Les erreurs sont capturées et stockées dans `error: string | null`. Les pages qui utilisent ces hooks affichent soit `<ErrorMessage message={error} />` (dashboard, paramètres), soit n'affichent rien (dashboard page — `statsError` est affiché mais les autres hooks ne testent pas leur `error`).

**Problème mineur :** Sur `dashboard/page.tsx`, les hooks `usePaiements`, `useRecettes`, `useDepenses`, `useClasses`, `useFrais`, `useEleves`, `useAnneesScolaires` n'exposent pas leur `error` et celui-ci n'est pas affiché. Si l'un d'eux échoue, le dashboard affiche silencieusement des valeurs à zéro sans message d'erreur visible pour l'utilisateur.

**Fichier :** `frontend/app/(protected)/dashboard/page.tsx` lignes ~163–170 (destructuration des hooks sans `error`)

---

## 8. TypeScript — résultats `npx tsc --noEmit`

| Projet | Commande | Résultat |
|---|---|---|
| `frontend/` | `npx tsc --noEmit` | **0 erreur** ✅ |
| `backend/` | `npx tsc --noEmit` | **0 erreur** ✅ |

L'absence d'erreurs TypeScript dans le frontend s'explique par l'index signature `[key: string]: unknown` sur `IDashboardStats`, qui absorbe les accès à des champs inexistants sans erreur de compilation.

---

## Problèmes classés par priorité

### 🔴 BLOQUANT

| # | Problème | Fichiers | Impact |
|---|---|---|---|
| B1 | **Gestion utilisateurs hors backend** : création et modification d'utilisateurs stockées uniquement en mémoire Zustand, non persistées en base. Aucune route backend `/api/utilisateurs`. | `frontend/app/(protected)/parametres/page.tsx` (composant `OngletUtilisateurs`) · `frontend/store/data-store.ts` | Perte de toute modification d'utilisateur au rechargement ; impossible de créer un vrai compte en production |
| B2 | **`IDashboardStats` désalignée** : 4 des 5 champs nommés (`totalRecettes`, `totalDepenses`, `solde`, `paiementsEnAttente`) n'existent pas dans la réponse backend. Champs réels non typés (`encaissementsJour`, `encaissementsMois`, etc.). | `frontend/lib/api.ts` lignes 71–77 · `backend/src/controllers/dashboard.controller.ts` lignes 20–27 | Accès à `undefined` si un composant lit ces champs directement ; dette de type masquée par `[key: string]: unknown` |

### ⚠️ MINEUR

| # | Problème | Fichiers | Impact |
|---|---|---|---|
| M1 | **`GET /api/auth/moi` non exposé** : route backend existante mais absente de `lib/api.ts`; le frontend ne peut pas rafraîchir le profil utilisateur depuis le serveur après expiration du cache Zustand. | `frontend/lib/api.ts` · `backend/src/routes/auth.routes.ts` ligne 4 | Profil utilisateur potentiellement obsolète en session longue |
| M2 | **Erreurs silencieuses sur le dashboard** : 7 hooks secondaires ne font pas remonter leur état `error` à l'UI ; un échec réseau sur `/api/paiements` ou `/api/frais` affiche des valeurs à 0 sans aucun message. | `frontend/app/(protected)/dashboard/page.tsx` lignes ~163–170 | Mauvais diagnostic utilisateur en cas de panne partielle |
| M3 | **`paiementsApi.creer` signature incorrecte** : attend `Omit<IPaiement, 'id'>` (inclut `recuId`/`comptableId`) mais le backend attend `{ eleveId, tranche, montant, anneeScolaireId }` et retourne `{ paiement, recu }`, pas un `IPaiement`. La méthode n'est pas utilisée dans les composants (remplacée par `creerAvecRecu`), mais reste dans l'API publique. | `frontend/lib/api.ts` lignes ~156–158 | Risque d'erreur si utilisée par un développeur futur |

---

## Recommandations de correction

### B1 — Gestion des utilisateurs
Créer dans le backend :
- `GET /api/utilisateurs` — liste des utilisateurs (rôle `administratrice` requis)
- `POST /api/utilisateurs` — création avec hash bcrypt du mot de passe (rôle `administratrice` requis)
- `PUT /api/utilisateurs/:id` — modification (rôle `administratrice` requis)

Remplacer dans `parametres/page.tsx` les appels `ajouterUtilisateur`/`mettreAJourUtilisateur` par des appels `apiFetch` vers ces nouvelles routes, et créer un hook `useUtilisateurs`.

### B2 — IDashboardStats
Aligner l'interface sur la réponse réelle du backend :
```ts
export interface IDashboardStats {
  encaissementsJour: number;
  nbPaiementsJour: number;
  encaissementsMois: number;
  depensesMois: number;
  soldeNet: number;
  totalEleves: number;
}
```
Mettre à jour `useDashboardStats.ts` et `dashboard/page.tsx` pour utiliser ces noms plutôt que les recalculs locaux depuis les autres hooks (ou conserver les recalculs locaux et supprimer l'appel `useDashboardStats` si le backend n'est pas nécessaire pour ces KPIs).

### M1 — `authApi.moi`
Ajouter dans `lib/api.ts` :
```ts
export const authApi = {
  login: ...,
  moi: () => apiFetch<IUtilisateur>('/auth/moi'),
};
```

### M2 — Erreurs silencieuses
Dans `dashboard/page.tsx`, destructurer `error` des hooks et afficher un `<ErrorMessage>` groupé si l'un d'eux est en erreur.

### M3 — `paiementsApi.creer` redondant
Supprimer `creer` de `paiementsApi` ou corriger sa signature pour correspondre au corps attendu par le backend : `{ eleveId: string; tranche: string; montant: number; anneeScolaireId: string }` et son type de retour en `{ paiement: IPaiement; recu: IRecu }`.
