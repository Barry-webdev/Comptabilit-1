import { Router } from 'express';
import { listerUtilisateurs, creerUtilisateur, modifierUtilisateur } from '../controllers/utilisateurs.controller';
import { authentifier, exigerRole } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.use(exigerRole('administratrice'));
router.get('/', listerUtilisateurs);
router.post('/', creerUtilisateur);
router.put('/:id', modifierUtilisateur);
export default router;
