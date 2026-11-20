import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listerClasses(_req: Request, res: Response): Promise<void> {
  const classes = await prisma.classe.findMany({ orderBy: { libelle: 'asc' } });
  res.json(classes);
}

export async function creerClasse(req: Request, res: Response): Promise<void> {
  const { libelle } = req.body;
  const existante = await prisma.classe.findUnique({ where: { libelle } });
  if (existante) { res.status(409).json({ message: 'Cette classe existe déjà' }); return; }
  const classe = await prisma.classe.create({ data: { libelle } });
  res.status(201).json(classe);
}

export async function modifierClasse(req: Request, res: Response): Promise<void> {
  const { libelle } = req.body;
  const classe = await prisma.classe.update({ where: { id: req.params.id }, data: { libelle } });
  res.json(classe);
}
