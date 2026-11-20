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

export default router;
