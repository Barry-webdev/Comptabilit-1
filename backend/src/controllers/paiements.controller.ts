import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

// Génère le prochain numéro de reçu séquentiel
async function genererNumeroRecu(): Promise<string> {
  const dernier = await prisma.recu.findFirst({ orderBy: { createdAt: 'desc' } });
  if (!dernier) return 'REC-000001';
  const num = parseInt(dernier.numero.replace('REC-', ''), 10);
  return `REC-${String(num + 1).padStart(6, '0')}`;
}

export async function enregistrerPaiement(req: AuthRequest, res: Response): Promise<void> {
  const { eleveId, tranche, montant, anneeScolaireId } = req.body;
  const comptableId = req.utilisateur!.id;

  // Vérifier l'élève
  const eleve = await prisma.eleve.findUnique({
    where: { id: eleveId },
    include: { classe: true },
  });
  if (!eleve) { res.status(404).json({ message: 'Élève introuvable' }); return; }

  // Vérifier les frais
  const frais = await prisma.fraisClasse.findUnique({
    where: { classeId_anneeScolaireId: { classeId: eleve.classeId, anneeScolaireId } },
  });
  if (!frais) { res.status(400).json({ message: 'Frais scolaires non configurés pour cette classe' }); return; }

  // Calculer solde restant sur la tranche
  const montantTranche = tranche === 'tranche1' ? frais.t1Montant : tranche === 'tranche2' ? frais.t2Montant : frais.t3Montant;
  const paiementsExistants = await prisma.paiement.findMany({
    where: { eleveId, tranche, anneeScolaireId },
  });
  const dejaVerse = paiementsExistants.reduce((acc: number, p: { montant: number }) => acc + p.montant, 0);
  const soldeRestantTranche = montantTranche - dejaVerse;

  if (soldeRestantTranche <= 0) {
    res.status(400).json({ message: 'Cette tranche est déjà soldée' });
    return;
  }
  if (montant > soldeRestantTranche) {
    res.status(400).json({ message: `Le montant dépasse le solde restant de ${soldeRestantTranche} GNF` });
    return;
  }

  // Calculer le reste annuel après ce paiement
  const tousLesPaiements = await prisma.paiement.findMany({ where: { eleveId, anneeScolaireId } });
  const totalPayeAnnee = tousLesPaiements.reduce((acc: number, p: { montant: number }) => acc + p.montant, 0);
  const resteAnnuel = Math.max(0, frais.totalAnnuel - totalPayeAnnee - montant);

  const today = new Date().toISOString().split('T')[0];
  const numeroRecu = await genererNumeroRecu();

  // Transaction atomique : paiement + reçu ensemble
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const paiement = await tx.paiement.create({
      data: { eleveId, tranche, montant, date: today, comptableId, anneeScolaireId },
    });
    const recu = await tx.recu.create({
      data: {
        numero: numeroRecu,
        eleveId,
        paiementId: paiement.id,
        montantVerse: montant,
        soldeRestant: resteAnnuel,
        tranche,
        anneeScolaireId,
        comptableId,
      },
      include: { eleve: { include: { classe: true } }, comptable: true },
    });
    return { paiement, recu };
  });

  res.status(201).json(result);
}

export async function listerPaiements(req: Request, res: Response): Promise<void> {
  const { anneeId, classeId, tranche, dateDebut, dateFin } = req.query;

  const paiements = await prisma.paiement.findMany({
    where: {
      ...(anneeId ? { anneeScolaireId: String(anneeId) } : {}),
      ...(tranche ? { tranche: tranche as 'tranche1' | 'tranche2' | 'tranche3' } : {}),
      ...(dateDebut || dateFin ? { date: { gte: dateDebut ? String(dateDebut) : undefined, lte: dateFin ? String(dateFin) : undefined } } : {}),
      ...(classeId ? { eleve: { classeId: String(classeId) } } : {}),
    },
    include: { eleve: { include: { classe: true } }, recu: true, comptable: { select: { nom: true, prenom: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(paiements);
}
