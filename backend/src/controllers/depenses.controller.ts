import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function listerDepenses(req: Request, res: Response): Promise<void> {
  const { categorie, dateDebut, dateFin } = req.query;
  const depenses = await prisma.depense.findMany({
    where: {
      ...(categorie ? { categorie: String(categorie) } : {}),
      ...(dateDebut || dateFin ? { date: { gte: dateDebut ? String(dateDebut) : undefined, lte: dateFin ? String(dateFin) : undefined } } : {}),
    },
    include: { agent: { select: { nom: true, prenom: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(depenses);
}

export async function creerDepense(req: AuthRequest, res: Response): Promise<void> {
  const { date, categorie, motif, beneficiaire, montant, referenceJustificatif } = req.body;
  const depense = await prisma.depense.create({
    data: { date, categorie, motif, beneficiaire, montant, referenceJustificatif, agentId: req.utilisateur!.id },
    include: { agent: { select: { nom: true, prenom: true } } },
  });
  res.status(201).json(depense);
}
