import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listerAnnees(_req: Request, res: Response): Promise<void> {
  const annees = await prisma.anneeScolaire.findMany({ orderBy: { nom: 'desc' } });
  res.json(annees);
}

export async function creerAnnee(req: Request, res: Response): Promise<void> {
  const { nom } = req.body;
  const existante = await prisma.anneeScolaire.findUnique({ where: { nom } });
  if (existante) { res.status(409).json({ message: 'Cette année scolaire existe déjà' }); return; }
  const annee = await prisma.anneeScolaire.create({ data: { nom, statut: 'cloturee' } });
  res.status(201).json(annee);
}

export async function activerAnnee(req: Request, res: Response): Promise<void> {
  // Désactiver toutes, puis activer celle-ci
  await prisma.anneeScolaire.updateMany({ data: { statut: 'cloturee' } });
  const annee = await prisma.anneeScolaire.update({
    where: { id: req.params.id },
    data: { statut: 'active' },
  });
  res.json(annee);
}

export async function cloturerAnnee(req: Request, res: Response): Promise<void> {
  const annee = await prisma.anneeScolaire.update({
    where: { id: req.params.id },
    data: { statut: 'cloturee' },
  });
  res.json(annee);
}
