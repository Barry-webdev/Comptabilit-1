import { Router } from 'express';
import { obtenirStats } from '../controllers/dashboard.controller';
import { authentifier } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/stats', obtenirStats);
export default router;
