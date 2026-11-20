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

  // ── Utilisateurs ──────────────────────────────────────────────────────
  const motDePasseAdmin = await bcrypt.hash('admin123', 10);
  const motDePasseComptable = await bcrypt.hash('comptable123', 10);

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

  await prisma.utilisateur.upsert({
    where: { identifiant: 'comptable' },
    update: {},
    create: {
      nom: 'Konaté',
      prenom: 'Ibrahima',
      identifiant: 'comptable',
      motDePasse: motDePasseComptable,
      role: 'comptable',
    },
  });
  console.log('✅ Utilisateurs créés (admin / comptable)');

  console.log('\n🎉 Base de données initialisée avec succès !');
  console.log('📋 Identifiants :');
  console.log('   Administratrice : admin / admin123');
  console.log('   Comptable       : comptable / comptable123');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
