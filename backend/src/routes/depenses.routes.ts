import { Router } from 'express';
import { listerDepenses, creerDepense } from '../controllers/depenses.controller';
import { authentifier } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerDepenses);
router.post('/', creerDepense);
export default router;
