import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function obtenirStats(req: Request, res: Response): Promise<void> {
  const aujourd = new Date().toISOString().split('T')[0];
  const moisActuel = aujourd.slice(0, 7); // "YYYY-MM"

  // Année scolaire active : « Élèves actifs » ne compte que les inscrits de
  // l'année courante (comportement historique du dashboard). Sans année active,
  // on retombe sur l'ensemble des élèves.
  const anneeActive = await prisma.anneeScolaire.findFirst({ where: { statut: 'active' } });

  const [paiementsJour, paiementsMois, recettesMois, depensesMois, totalEleves] = await Promise.all([
    prisma.paiement.aggregate({ where: { date: aujourd }, _sum: { montant: true }, _count: true }),
    prisma.paiement.aggregate({ where: { date: { startsWith: moisActuel } }, _sum: { montant: true } }),
    prisma.recette.aggregate({ where: { date: { startsWith: moisActuel } }, _sum: { montant: true } }),
    prisma.depense.aggregate({ where: { date: { startsWith: moisActuel } }, _sum: { montant: true } }),
    prisma.eleve.count({ where: anneeActive ? { anneeScolaireId: anneeActive.id } : {} }),
  ]);

  const encaissementsJour = paiementsJour._sum.montant || 0;
  // Les recettes du mois s'ajoutent aux paiements, comme le faisait le calcul
  // local d'origine du dashboard (sinon les recettes annexes étaient ignorées).
  const encaissementsMois = (paiementsMois._sum.montant || 0) + (recettesMois._sum.montant || 0);
  const depensesMoisTotal = depensesMois._sum.montant || 0;
  const soldeNet = encaissementsMois - depensesMoisTotal;

  res.json({
    encaissementsJour,
    nbPaiementsJour: paiementsJour._count,
    encaissementsMois,
    depensesMois: depensesMoisTotal,
    soldeNet,
    totalEleves,
  });
}
