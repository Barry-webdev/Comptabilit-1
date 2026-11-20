import { Router } from 'express';
import { listerRecettes, creerRecette } from '../controllers/recettes.controller';
import { authentifier } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerRecettes);
router.post('/', creerRecette);
export default router;
