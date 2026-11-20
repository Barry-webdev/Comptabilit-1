import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authentifier, exigerRole } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.use(exigerRole('administratrice'));

// Supprimer un élève et toutes ses données (paiements + reçus)
router.delete('/eleves/:id', async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await prisma.recu.deleteMany({ where: { eleveId: id } });
    await prisma.paiement.deleteMany({ where: { eleveId: id } });
    await prisma.eleve.delete({ where: { id } });
    res.json({ message: 'Élève et ses données supprimés' });
  } catch (e) {
    res.status(500).json({ message: 'Erreur suppression', error: String(e) });
  }
});

// Nettoyage complet des données de test
router.delete('/nettoyer-tests', async (_req: Request, res: Response): Promise<void> => {
  try {
    // Élève TEST-001
    const elv = await prisma.eleve.findFirst({ where: { matricule: 'TEST-001' } });
    if (elv) {
      await prisma.recu.deleteMany({ where: { eleveId: elv.id } });
      await prisma.paiement.deleteMany({ where: { eleveId: elv.id } });
      await prisma.eleve.delete({ where: { id: elv.id } });
    }
    // Recette de test
    await prisma.recette.deleteMany({ where: { libelle: { contains: 'Test' } } });
    // Dépense de test
    await prisma.depense.deleteMany({ where: { motif: { contains: 'Test' } } });
    // Utilisateur de test
    await prisma.utilisateur.deleteMany({ where: { identifiant: 'test.comptable' } });

    res.json({ message: 'Données de test supprimées', eleveSupprime: !!elv });
  } catch (e) {
    res.status(500).json({ message: 'Erreur nettoyage', error: String(e) });
  }
});

export default router;
