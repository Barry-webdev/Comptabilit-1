import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export async function login(req: Request, res: Response): Promise<void> {
  const { identifiant, motDePasse } = req.body;

  if (!identifiant || !motDePasse) {
    res.status(400).json({ message: 'Identifiant et mot de passe requis' });
    return;
  }

  const utilisateur = await prisma.utilisateur.findUnique({ where: { identifiant } });
  if (!utilisateur || !utilisateur.actif) {
    res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    return;
  }

  const valide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);
  if (!valide) {
    res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    return;
  }

  const token = jwt.sign(
    { id: utilisateur.id, identifiant: utilisateur.identifiant, role: utilisateur.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as string } as jwt.SignOptions
  );

  res.json({
    token,
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      identifiant: utilisateur.identifiant,
      role: utilisateur.role,
    },
  });
}

export async function moi(req: Request, res: Response): Promise<void> {
  const authReq = req as Request & { utilisateur?: { id: string } };
  const utilisateur = await prisma.utilisateur.findUnique({
    where: { id: authReq.utilisateur?.id },
    select: { id: true, nom: true, prenom: true, identifiant: true, role: true },
  });
  if (!utilisateur) {
    res.status(404).json({ message: 'Utilisateur introuvable' });
    return;
  }
  res.json(utilisateur);
}
