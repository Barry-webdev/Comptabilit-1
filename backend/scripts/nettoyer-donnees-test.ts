/**
 * Script de nettoyage — supprime les données de test créées par l'agent d'investigation.
 * À exécuter une seule fois : npx ts-node scripts/nettoyer-donnees-test.ts
 */
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('Connexion à la base de données...');

  // Trouver l'élève de test
  const eleveTest = await prisma.eleve.findFirst({
    where: { matricule: 'TEST-001' },
  });

  if (!eleveTest) {
    console.log('Aucun élève de test trouvé (TEST-001).');
  } else {
    console.log(`Suppression élève : ${eleveTest.prenom} ${eleveTest.nom} [${eleveTest.matricule}]`);

    // Supprimer les reçus liés
    const recus = await prisma.recu.deleteMany({ where: { eleveId: eleveTest.id } });
    console.log(`  → ${recus.count} reçu(s) supprimé(s)`);

    // Supprimer les paiements liés
    const paiements = await prisma.paiement.deleteMany({ where: { eleveId: eleveTest.id } });
    console.log(`  → ${paiements.count} paiement(s) supprimé(s)`);

    // Supprimer l'élève
    await prisma.eleve.delete({ where: { id: eleveTest.id } });
    console.log('  → Élève supprimé');
  }

  // Supprimer les recettes de test
  const recetteTest = await prisma.recette.deleteMany({
    where: { libelle: 'Test recette' },
  });
  if (recetteTest.count > 0) console.log(`${recetteTest.count} recette(s) de test supprimée(s)`);

  // Supprimer les dépenses de test
  const depenseTest = await prisma.depense.deleteMany({
    where: { motif: 'Test dépense' },
  });
  if (depenseTest.count > 0) console.log(`${depenseTest.count} dépense(s) de test supprimée(s)`);

  // Supprimer l'utilisateur de test
  const userTest = await prisma.utilisateur.deleteMany({
    where: { identifiant: 'test.comptable' },
  });
  if (userTest.count > 0) console.log(`${userTest.count} utilisateur(s) de test supprimé(s)`);

  console.log('\nNettoyage terminé.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
