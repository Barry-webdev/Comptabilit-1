import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function obtenirStats(req: Request, res: Response): Promise<void> {
  const aujourd = new Date().toISOString().split('T')[0];
  const moisActuel = aujourd.slice(0, 7); // "YYYY-MM"

  const [paiementsJour, paiementsMois, depensesMois, totalEleves] = await Promise.all([
    prisma.paiement.aggregate({ where: { date: aujourd }, _sum: { montant: true }, _count: true }),
    prisma.paiement.aggregate({ where: { date: { startsWith: moisActuel } }, _sum: { montant: true } }),
    prisma.depense.aggregate({ where: { date: { startsWith: moisActuel } }, _sum: { montant: true } }),
    prisma.eleve.count(),
  ]);

  const encaissementsJour = paiementsJour._sum.montant || 0;
  const encaissementsMois = paiementsMois._sum.montant || 0;
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
