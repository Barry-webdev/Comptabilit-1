# Backend — Groupe Scolaire Elhadj Amadou Bendougou Bah

API REST Node.js + Express + Prisma + PostgreSQL

## Prérequis
- Node.js 18+
- PostgreSQL 18 (pgAdmin installé)

## Installation

```bash
npm install
```

## Configuration

1. Ouvrez `.env` et remplacez `VOTRE_MOT_DE_PASSE` par le mot de passe PostgreSQL que vous avez défini à l'installation.

2. Créez la base de données dans pgAdmin :
   - Clic droit sur **Databases** → **Create** → **Database**
   - Nom : `gsab_db`
   - Cliquez **Save**

## Démarrage

```bash
# 1. Générer le client Prisma
npm run db:generate

# 2. Créer les tables dans la base de données
npm run db:push

# 3. Initialiser les données (classes, année, utilisateurs)
npm run db:seed

# 4. Démarrer le serveur en développement
npm run dev
```

Le serveur démarre sur **http://localhost:4000**

## Routes disponibles

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/login | Connexion |
| GET | /api/auth/moi | Utilisateur connecté |
| GET | /api/eleves | Liste des élèves |
| POST | /api/eleves | Créer un élève |
| GET | /api/eleves/:id | Fiche élève |
| PUT | /api/eleves/:id | Modifier un élève |
| GET | /api/classes | Liste des classes |
| POST | /api/classes | Créer une classe |
| GET | /api/annees-scolaires | Liste des années |
| POST | /api/annees-scolaires | Créer une année |
| PATCH | /api/annees-scolaires/:id/activer | Activer une année |
| GET | /api/frais | Frais scolaires |
| POST | /api/frais | Créer/modifier frais |
| POST | /api/paiements | Enregistrer un paiement |
| GET | /api/paiements | Liste des paiements |
| GET | /api/recus | Liste des reçus |
| GET | /api/recettes | Liste des recettes |
| POST | /api/recettes | Créer une recette |
| GET | /api/depenses | Liste des dépenses |
| POST | /api/depenses | Créer une dépense |
| GET | /api/dashboard/stats | Statistiques dashboard |

## Identifiants par défaut

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Administratrice | admin | admin123 |
| Comptable | comptable | comptable123 |
