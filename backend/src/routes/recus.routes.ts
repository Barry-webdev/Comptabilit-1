import { Router } from 'express';
import { listerRecus } from '../controllers/recus.controller';
import { authentifier } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerRecus);
export default router;
