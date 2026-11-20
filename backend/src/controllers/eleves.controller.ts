import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listerEleves(req: Request, res: Response): Promise<void> {
  const { anneeId, classeId, recherche } = req.query;

  const eleves = await prisma.eleve.findMany({
    where: {
      ...(anneeId ? { anneeScolaireId: String(anneeId) } : {}),
      ...(classeId ? { classeId: String(classeId) } : {}),
      ...(recherche ? {
        OR: [
          { nom: { contains: String(recherche), mode: 'insensitive' } },
          { prenom: { contains: String(recherche), mode: 'insensitive' } },
          { matricule: { contains: String(recherche), mode: 'insensitive' } },
        ],
      } : {}),
    },
    include: { classe: true, anneeScolaire: true },
    orderBy: { nom: 'asc' },
  });
  res.json(eleves);
}

export async function obtenirEleve(req: Request, res: Response): Promise<void> {
  const eleve = await prisma.eleve.findUnique({
    where: { id: req.params.id },
    include: {
      classe: true,
      anneeScolaire: true,
      paiements: { include: { recu: true }, orderBy: { date: 'desc' } },
    },
  });
  if (!eleve) { res.status(404).json({ message: 'Élève introuvable' }); return; }
  res.json(eleve);
}

export async function creerEleve(req: Request, res: Response): Promise<void> {
  const { matricule, nom, prenom, classeId, anneeScolaireId, contactParent } = req.body;

  const existant = await prisma.eleve.findUnique({ where: { matricule } });
  if (existant) { res.status(409).json({ message: 'Ce matricule est déjà utilisé' }); return; }

  const eleve = await prisma.eleve.create({
    data: { matricule, nom, prenom, classeId, anneeScolaireId, contactParent },
    include: { classe: true, anneeScolaire: true },
  });
  res.status(201).json(eleve);
}

export async function modifierEleve(req: Request, res: Response): Promise<void> {
  const { nom, prenom, classeId, contactParent } = req.body;
  const eleve = await prisma.eleve.update({
    where: { id: req.params.id },
    data: { nom, prenom, classeId, contactParent },
    include: { classe: true, anneeScolaire: true },
  });
  res.json(eleve);
}
