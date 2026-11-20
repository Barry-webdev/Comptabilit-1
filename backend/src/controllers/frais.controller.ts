import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listerFrais(req: Request, res: Response): Promise<void> {
  const { anneeId } = req.query;
  const frais = await prisma.fraisClasse.findMany({
    where: anneeId ? { anneeScolaireId: String(anneeId) } : {},
    include: { classe: true, anneeScolaire: true },
  });
  res.json(frais);
}

export async function enregistrerFrais(req: Request, res: Response): Promise<void> {
  const { classeId, anneeScolaireId, t1Montant, t1DateLimite, t2Montant, t2DateLimite, t3Montant, t3DateLimite } = req.body;

  // Validation
  if (!classeId || !anneeScolaireId) {
    res.status(400).json({ message: 'classeId et anneeScolaireId sont requis' });
    return;
  }

  // Convertir en nombres
  const t1 = parseInt(String(t1Montant), 10);
  const t2 = parseInt(String(t2Montant), 10);
  const t3 = parseInt(String(t3Montant), 10);

  if (isNaN(t1) || isNaN(t2) || isNaN(t3)) {
    res.status(400).json({ message: 'Les montants doivent être des nombres valides' });
    return;
  }

  const totalAnnuel = t1 + t2 + t3;

  const frais = await prisma.fraisClasse.upsert({
    where: { classeId_anneeScolaireId: { classeId, anneeScolaireId } },
    update: { totalAnnuel, t1Montant: t1, t1DateLimite: t1DateLimite || '', t2Montant: t2, t2DateLimite: t2DateLimite || '', t3Montant: t3, t3DateLimite: t3DateLimite || '' },
    create: { classeId, anneeScolaireId, totalAnnuel, t1Montant: t1, t1DateLimite: t1DateLimite || '', t2Montant: t2, t2DateLimite: t2DateLimite || '', t3Montant: t3, t3DateLimite: t3DateLimite || '' },
    include: { classe: true, anneeScolaire: true },
  });
  res.json(frais);
}
