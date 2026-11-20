import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Initialisation de la base de données...');

  // ── Classes ───────────────────────────────────────────────────────────
  const classesData = [
    '1ère Année A', '1ère Année B',
    '2ème Année A', '2ème Année B',
    '3ème Année A', '3ème Année B',
    '4ème Année A', '4ème Année B',
    '5ème Année A', '5ème Année B',
    '6ème Année A', '6ème Année B',
  ];

  for (const libelle of classesData) {
    await prisma.classe.upsert({
      where: { libelle },
      update: {},
      create: { libelle },
    });
  }
  console.log(`✅ ${classesData.length} classes créées`);

  // ── Année scolaire active ─────────────────────────────────────────────
  const annee = await prisma.anneeScolaire.upsert({
    where: { nom: '2025-2026' },
    update: {},
    create: { nom: '2025-2026', statut: 'active' },
  });
  console.log(`✅ Année scolaire ${annee.nom} créée`);

  // ── Nettoyage données de test ─────────────────────────────────────────
  const eleveTest = await prisma.eleve.findFirst({ where: { matricule: 'TEST-001' } });
  if (eleveTest) {
    await prisma.recu.deleteMany({ where: { eleveId: eleveTest.id } });
    await prisma.paiement.deleteMany({ where: { eleveId: eleveTest.id } });
    await prisma.eleve.delete({ where: { id: eleveTest.id } });
    console.log('🧹 Élève de test TEST-001 supprimé');
  }
  await prisma.recette.deleteMany({ where: { libelle: { contains: 'Test' } } });
  await prisma.depense.deleteMany({ where: { motif: { contains: 'Test' } } });
  await prisma.utilisateur.deleteMany({ where: { identifiant: 'test.comptable' } });

  // ── Nettoyage frais ajoutés par les tests ─────────────────────────────
  // Supprimer tous les frais existants pour repartir propre
  const fraisExistants = await prisma.fraisClasse.count();
  if (fraisExistants > 0) {
    await prisma.fraisClasse.deleteMany({});
    console.log(`🧹 ${fraisExistants} entrée(s) de frais supprimée(s)`);
  }

  // ── Utilisateurs ──────────────────────────────────────────────────────
  // Supprimer les comptables de test (garder seulement admin)
  const utilisateursTest = await prisma.utilisateur.findMany({
    where: {
      AND: [
        { identifiant: { not: 'admin' } },
        { identifiant: { not: 'comptable' } },
      ]
    }
  });
  for (const u of utilisateursTest) {
    await prisma.utilisateur.delete({ where: { id: u.id } });
    console.log(`🧹 Utilisateur de test supprimé : ${u.identifiant}`);
  }

  // Créer/mettre à jour l'admin
  const motDePasseAdmin = await bcrypt.hash('admin123', 10);
  await prisma.utilisateur.upsert({
    where: { identifiant: 'admin' },
    update: {},
    create: {
      nom: 'Barry',
      prenom: 'Administratrice',
      identifiant: 'admin',
      motDePasse: motDePasseAdmin,
      role: 'administratrice',
    },
  });

  // Supprimer le comptable par défaut — l'admin le créera lui-même
  await prisma.utilisateur.deleteMany({ where: { identifiant: 'comptable' } });
  console.log('🧹 Comptable par défaut supprimé (à recréer depuis les paramètres)');

  console.log('✅ Utilisateur admin créé');
  console.log('\n🎉 Base de données initialisée avec succès !');
  console.log('📋 Identifiant admin : admin / admin123');
  console.log('ℹ️  Créez vos comptables depuis Paramètres → Utilisateurs');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
