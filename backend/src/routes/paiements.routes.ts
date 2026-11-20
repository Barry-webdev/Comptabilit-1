import { Router } from 'express';
import { listerPaiements, enregistrerPaiement } from '../controllers/paiements.controller';
import { authentifier } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerPaiements);
router.post('/', enregistrerPaiement);
export default router;
