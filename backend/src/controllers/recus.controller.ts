import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export async function listerRecus(req: Request, res: Response): Promise<void> {
  const { anneeId, eleveId, numero } = req.query;
  const recus = await prisma.recu.findMany({
    where: {
      ...(anneeId ? { anneeScolaireId: String(anneeId) } : {}),
      ...(eleveId ? { eleveId: String(eleveId) } : {}),
      ...(numero ? { numero: { contains: String(numero), mode: 'insensitive' } } : {}),
    },
    include: { eleve: { include: { classe: true } }, comptable: { select: { nom: true, prenom: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(recus);
}
