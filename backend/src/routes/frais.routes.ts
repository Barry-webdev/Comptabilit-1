import { Router } from 'express';
import { listerFrais, enregistrerFrais } from '../controllers/frais.controller';
import { authentifier, exigerRole } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerFrais);
router.post('/', exigerRole('administratrice'), enregistrerFrais);
export default router;
