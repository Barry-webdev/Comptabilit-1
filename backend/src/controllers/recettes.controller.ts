import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export async function listerRecettes(req: Request, res: Response): Promise<void> {
  const { type, categorie, dateDebut, dateFin } = req.query;
  const recettes = await prisma.recette.findMany({
    where: {
      ...(type ? { type: type as 'scolaire' | 'annexe' } : {}),
      ...(categorie ? { categorie: String(categorie) } : {}),
      ...(dateDebut || dateFin ? { date: { gte: dateDebut ? String(dateDebut) : undefined, lte: dateFin ? String(dateFin) : undefined } } : {}),
    },
    include: { agent: { select: { nom: true, prenom: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(recettes);
}

export async function creerRecette(req: AuthRequest, res: Response): Promise<void> {
  const { date, categorie, libelle, montant } = req.body;
  const recette = await prisma.recette.create({
    data: { date, type: 'annexe', categorie, libelle, montant, agentId: req.utilisateur!.id },
    include: { agent: { select: { nom: true, prenom: true } } },
  });
  res.status(201).json(recette);
}
