import { Router } from 'express';
import { listerAnnees, creerAnnee, activerAnnee, cloturerAnnee } from '../controllers/anneesScolaires.controller';
import { authentifier, exigerRole } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerAnnees);
router.post('/', exigerRole('administratrice'), creerAnnee);
router.patch('/:id/activer', exigerRole('administratrice'), activerAnnee);
router.patch('/:id/cloturer', exigerRole('administratrice'), cloturerAnnee);
export default router;
