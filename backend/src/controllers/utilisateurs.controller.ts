import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma';

export async function listerUtilisateurs(_req: Request, res: Response): Promise<void> {
  const utilisateurs = await prisma.utilisateur.findMany({
    select: { id: true, nom: true, prenom: true, identifiant: true, role: true, actif: true },
    orderBy: { nom: 'asc' },
  });
  res.json(utilisateurs);
}

export async function creerUtilisateur(req: Request, res: Response): Promise<void> {
  const { nom, prenom, identifiant, motDePasse, role } = req.body;

  if (!nom || !prenom || !identifiant || !motDePasse || !role) {
    res.status(400).json({ message: 'Tous les champs sont requis' });
    return;
  }

  const existant = await prisma.utilisateur.findUnique({ where: { identifiant } });
  if (existant) {
    res.status(409).json({ message: 'Cet identifiant est déjà utilisé' });
    return;
  }

  const hash = await bcrypt.hash(motDePasse, 10);
  const utilisateur = await prisma.utilisateur.create({
    data: { nom, prenom, identifiant, motDePasse: hash, role },
    select: { id: true, nom: true, prenom: true, identifiant: true, role: true, actif: true },
  });
  res.status(201).json(utilisateur);
}

export async function modifierUtilisateur(req: Request, res: Response): Promise<void> {
  const { nom, prenom, identifiant, motDePasse, role } = req.body;
  const { id } = req.params;

  const data: Record<string, unknown> = {};
  if (nom) data.nom = nom;
  if (prenom) data.prenom = prenom;
  if (identifiant) data.identifiant = identifiant;
  if (role) data.role = role;
  if (motDePasse) data.motDePasse = await bcrypt.hash(motDePasse, 10);

  const utilisateur = await prisma.utilisateur.update({
    where: { id },
    data,
    select: { id: true, nom: true, prenom: true, identifiant: true, role: true, actif: true },
  });
  res.json(utilisateur);
}
