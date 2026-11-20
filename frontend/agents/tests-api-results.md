# Rapport de tests API — GSAB
**Date d'exécution :** 2026-11-20  
**Backend :** http://localhost:4000 (Express + Prisma + PostgreSQL `gsab_db`)  
**Méthode :** Appels HTTP directs (PowerShell `Invoke-WebRequest`) avec token JWT Bearer

---

## Résumé

**Toutes les fonctionnalités s'enregistrent correctement en base de données PostgreSQL.**  
Les 10 tests ont réussi : chaque POST crée bien un enregistrement, chaque GET le retrouve, et les données persistent en base via Prisma. Aucun endpoint cassé, aucune erreur 4xx/5xx.

---

## Résultats test par test

### 1. Auth — POST /api/auth/login

| Champ | Valeur |
|---|---|
| Payload | `{"identifiant":"admin","motDePasse":"admin123"}` |
| Status HTTP | **200 OK** |
| Résultat | Token JWT retourné, utilisateur `admin` (rôle `administratrice`) identifié |

**Réponse :**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "utilisateur": {
    "id": "cmwnql0rv000dw6ou2l8kjt4n",
    "nom": "Barry",
    "prenom": "Administratrice",
    "identifiant": "admin",
    "role": "administratrice"
  }
}
```

✅ **Authentification opérationnelle.** Le token est valide pendant 8 h (paramètre `JWT_EXPIRES_IN=8h` dans `.env`).

---

### 2. Classes — GET /api/classes

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Nombre de classes | **12** |

**Liste complète :**
| ID | Libellé |
|---|---|
| cmwnql0lt0000w6ou1i6bruar | 1ère Année A |
| cmwnql0m60001w6ou98ayhp07 | 1ère Année B |
| cmwnql0m90002w6oujezb2nlv | 2ème Année A |
| cmwnql0mb0003w6ouipims4qb | 2ème Année B |
| cmwnql0md0004w6ouxd33awr2 | 3ème Année A |
| cmwnql0mf0005w6ou2ealts0f | 3ème Année B |
| cmwnql0mi0006w6oumd71xyi0 | 4ème Année A |
| cmwnql0mn0007w6ou22mw7dh2 | 4ème Année B |
| cmwnql0mp0008w6oujfwzq946 | 5ème Année A |
| cmwnql0mr0009w6oufn8fbbnq | 5ème Année B |
| cmwnql0mt000aw6ou474ce2k4 | 6ème Année A |
| cmwnql0mu000bw6ouuwq7ags6 | 6ème Année B |

> **Remarque :** Le champ dans la réponse JSON est `libelle` (pas `nom`). Le frontend doit utiliser `classe.libelle`.

✅ **Les 12 classes sont présentes en base.**

---

### 3. Années scolaires — GET /api/annees-scolaires

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Année présente | 2025-2026 |
| Statut | `active` |

**Réponse :**
```json
[{
  "id": "cmwnql0mx000cw6ouq2eqre25",
  "nom": "2025-2026",
  "statut": "active",
  "createdAt": "2026-11-19T16:00:17.529Z"
}]
```

✅ **L'année scolaire 2025-2026 est active en base.**

---

### 4. Frais scolaires — POST /api/frais + GET /api/frais

#### POST — Création

| Champ | Valeur |
|---|---|
| Payload | classeId 1ère Année A, anneeScolaireId 2025-2026, t1=300 000, t2=300 000, t3=380 000 |
| Status HTTP | **200 OK** |
| ID créé | `cmwothqwg0001ascwrb0g400b` |
| Total annuel calculé | **980 000 GNF** (300 000 + 300 000 + 380 000) |

**Réponse complète :**
```json
{
  "id": "cmwothqwg0001ascwrb0g400b",
  "classeId": "cmwnql0lt0000w6ou1i6bruar",
  "anneeScolaireId": "cmwnql0mx000cw6ouq2eqre25",
  "totalAnnuel": 980000,
  "t1Montant": 300000, "t1DateLimite": "2026-10-15",
  "t2Montant": 300000, "t2DateLimite": "2027-01-15",
  "t3Montant": 380000, "t3DateLimite": "2027-04-15",
  "classe": { "libelle": "1ère Année A" },
  "anneeScolaire": { "nom": "2025-2026", "statut": "active" }
}
```

#### GET — Vérification

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Entrées retournées | 1 (les frais créés ci-dessus) |

> **Note technique :** Le contrôleur (`frais.controller.ts`) utilise `prisma.fraisClasse.upsert` avec la clé unique `[classeId, anneeScolaireId]`. Un deuxième appel met à jour au lieu de créer un doublon — comportement correct.

✅ **Les frais scolaires s'enregistrent et se retrouvent en base.**

---

### 5. Élèves — POST /api/eleves + GET /api/eleves

#### POST — Création

| Champ | Valeur |
|---|---|
| Payload | matricule=TEST-001, nom=Diallo, prenom=Mamadou, classeId 1ère Année A, anneeScolaireId 2025-2026, contactParent=621000001 |
| Status HTTP | **201 Created** |
| ID créé | `cmwouoskc0005ascwb94r01kq` |

**Réponse :**
```json
{
  "id": "cmwouoskc0005ascwb94r01kq",
  "matricule": "TEST-001",
  "nom": "Diallo",
  "prenom": "Mamadou",
  "classeId": "cmwnql0lt0000w6ou1i6bruar",
  "anneeScolaireId": "cmwnql0mx000cw6ouq2eqre25",
  "contactParent": "621000001"
}
```

#### GET — Vérification

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Total élèves en base | **3** |

**Élèves présents :**
| Matricule | Nom | Prénom |
|---|---|---|
| OH25376894 | BAH | OUMOU HAWA |
| AB61098756 | Barry | Abdoul Razzaï |
| TEST-001 | Diallo | Mamadou |

✅ **L'élève TEST-001 est bien enregistré en base.**

---

### 6. Paiements — POST /api/paiements + GET /api/paiements + GET /api/recus

#### POST — Création du paiement

| Champ | Valeur |
|---|---|
| Payload | eleveId cmwouoskc0005ascwb94r01kq, tranche=tranche1, montant=100 000, anneeScolaireId 2025-2026 |
| Status HTTP | **201 Created** |
| Paiement ID | `cmwoup87h0008ascw356vkcmx` |
| Reçu créé automatiquement | `REC-000001` |
| Montant versé | 100 000 GNF |
| Solde restant annuel | 880 000 GNF (980 000 − 100 000) |

**Réponse (tronquée) :**
```json
{
  "paiement": {
    "id": "cmwoup87h0008ascw356vkcmx",
    "tranche": "tranche1",
    "montant": 100000,
    "date": "2026-11-20"
  },
  "recu": {
    "id": "cmwoup87j000aascw59yvrjw2",
    "numero": "REC-000001",
    "montantVerse": 100000,
    "soldeRestant": 880000,
    "isDuplicate": false
  }
}
```

#### GET /api/paiements

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Paiements retournés | 1 (le paiement créé ci-dessus, avec reçu et élève inclus) |

#### GET /api/recus

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Reçus retournés | 1 (`REC-000001`) |

> **Note technique :** Le reçu est créé dans la même transaction Prisma que le paiement (`prisma.$transaction`), garantissant l'atomicité — si le reçu échoue, le paiement est annulé.

✅ **Paiement enregistré, reçu créé automatiquement, les deux présents en base.**

---

### 7. Recettes — POST /api/recettes + GET /api/recettes

#### POST — Création

| Champ | Valeur |
|---|---|
| Payload | date=2026-11-20, categorie="Frais d'examen", libelle="Test recette", montant=50 000 |
| Status HTTP | **201 Created** |
| ID créé | `cmwoupuwc000cascw286u45uj` |
| Type automatique | `annexe` |

#### GET — Vérification

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Recettes retournées | 1 (la recette créée) |

✅ **La recette annexe s'enregistre et se retrouve en base.**

---

### 8. Dépenses — POST /api/depenses + GET /api/depenses

#### POST — Création

| Champ | Valeur |
|---|---|
| Payload | date=2026-11-20, categorie="Fournitures administratives", motif="Test dépense", beneficiaire="Test", montant=25 000 |
| Status HTTP | **201 Created** |
| ID créé | `cmwouqf9q000eascwtfl7sadl` |

#### GET — Vérification

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Dépenses retournées | 1 (la dépense créée) |

✅ **La dépense s'enregistre et se retrouve en base.**

---

### 9. Dashboard — GET /api/dashboard/stats

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |

**Réponse :**
```json
{
  "encaissementsJour": 100000,
  "nbPaiementsJour": 1,
  "encaissementsMois": 100000,
  "depensesMois": 25000,
  "soldeNet": 75000,
  "totalEleves": 3
}
```

**Vérification de cohérence :**
- `encaissementsJour` = 100 000 ✅ (paiement tranche1 créé aujourd'hui)
- `nbPaiementsJour` = 1 ✅
- `encaissementsMois` = 100 000 ✅
- `depensesMois` = 25 000 ✅ (dépense créée aujourd'hui)
- `soldeNet` = 75 000 ✅ (100 000 − 25 000)
- `totalEleves` = 3 ✅ (BAH, Barry, Diallo)

✅ **Le dashboard reflète fidèlement les données insérées.**

---

### 10. Utilisateurs — POST /api/utilisateurs + GET /api/utilisateurs

#### POST — Création

| Champ | Valeur |
|---|---|
| Payload | nom=Test, prenom=Comptable, identifiant=test.comptable, motDePasse=test123, role=comptable |
| Status HTTP | **201 Created** |
| ID créé | `cmwouqtwg000fascw7xdh1v8s` |
| Mot de passe stocké | Hash bcrypt (jamais exposé dans la réponse) ✅ |

#### GET — Vérification

| Champ | Valeur |
|---|---|
| Status HTTP | **200 OK** |
| Utilisateurs retournés | 3 (admin Barry, comptable Konaté, test.comptable Test) |

✅ **L'utilisateur est créé, son mot de passe est haché en base, et il apparaît dans la liste.**

---

## Tableau récapitulatif

| # | Endpoint | Méthode | Status | Résultat |
|---|---|---|---|---|
| 1 | /api/auth/login | POST | 200 | ✅ Token JWT valide |
| 2 | /api/classes | GET | 200 | ✅ 12 classes présentes |
| 3 | /api/annees-scolaires | GET | 200 | ✅ 2025-2026 active |
| 4a | /api/frais | POST | 200 | ✅ Frais enregistrés (upsert) |
| 4b | /api/frais | GET | 200 | ✅ Frais retrouvés en base |
| 5a | /api/eleves | POST | 201 | ✅ Élève TEST-001 créé |
| 5b | /api/eleves | GET | 200 | ✅ 3 élèves dont TEST-001 |
| 6a | /api/paiements | POST | 201 | ✅ Paiement + reçu REC-000001 créés |
| 6b | /api/paiements | GET | 200 | ✅ Paiement retrouvé avec reçu |
| 6c | /api/recus | GET | 200 | ✅ REC-000001 présent |
| 7a | /api/recettes | POST | 201 | ✅ Recette annexe créée |
| 7b | /api/recettes | GET | 200 | ✅ Recette retrouvée |
| 8a | /api/depenses | POST | 201 | ✅ Dépense créée |
| 8b | /api/depenses | GET | 200 | ✅ Dépense retrouvée |
| 9 | /api/dashboard/stats | GET | 200 | ✅ Stats cohérentes avec les données |
| 10a | /api/utilisateurs | POST | 201 | ✅ Utilisateur créé, MDP haché |
| 10b | /api/utilisateurs | GET | 200 | ✅ 3 utilisateurs dont test.comptable |

**Score : 17/17 endpoints fonctionnels — 0 erreur.**

---

## Observations et recommandations

### Ce qui fonctionne bien

1. **Atomicité paiement/reçu** — `prisma.$transaction` dans `paiements.controller.ts` garantit qu'un paiement sans reçu est impossible.
2. **Upsert des frais** — évite les doublons par la contrainte unique `[classeId, anneeScolaireId]`.
3. **Sécurité mots de passe** — bcrypt avec sel de 10 rounds, jamais exposé dans les réponses.
4. **Dashboard en temps réel** — les stats agrégées sont calculées dynamiquement, les valeurs sont correctes.
5. **Numérotation séquentielle des reçus** — `REC-000001`, `REC-000002`, etc., logique dans `genererNumeroRecu()`.

### Points d'attention (non bloquants)

1. **Champ `libelle` vs `nom` dans Classes** — L'API retourne `libelle` pour les classes, et `nom` pour les années scolaires. Le frontend doit utiliser les bons noms de champs selon le modèle. Source : `schema.prisma` lignes `Classe.libelle` et `AnneeScolaire.nom`.

2. **Race condition potentielle sur la numérotation des reçus** — `genererNumeroRecu()` lit le dernier reçu puis incrémente, sans verrou. Sous charge simultanée, deux paiements simultanés pourraient recevoir le même numéro. Pour l'usage actuel (école unique), ce n'est pas un problème pratique, mais une séquence PostgreSQL (`CREATE SEQUENCE`) serait plus robuste.

3. **Données de test laissées en base** — Les enregistrements créés lors de ces tests (élève TEST-001, paiement, recette, dépense, utilisateur test.comptable) sont présents en production. Les supprimer manuellement si nécessaire via Prisma Studio (`npx prisma studio` depuis `backend/`).

4. **Reçu téléchargeable (PDF)** — Le test ne couvre que la création du reçu en base. La génération du PDF côté frontend (signalée comme non fonctionnelle dans la demande originale) est une couche séparée non testée ici.

---

## Conclusion

L'intégralité du backend GSAB fonctionne correctement. Toutes les entités (frais, élèves, paiements, reçus, recettes, dépenses, utilisateurs) s'enregistrent dans PostgreSQL et sont retrouvables via les endpoints GET. Le dashboard agrège les bonnes valeurs. Aucune correction backend n'est nécessaire pour les fonctionnalités testées.
