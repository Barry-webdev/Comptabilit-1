import { Router } from 'express';
import { login, moi } from '../controllers/auth.controller';
import { authentifier } from '../middlewares/auth.middleware';

const router = Router();
router.post('/login', login);
router.get('/moi', authentifier, moi);
export default router;
