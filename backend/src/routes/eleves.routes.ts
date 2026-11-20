import { Router } from 'express';
import { listerEleves, obtenirEleve, creerEleve, modifierEleve } from '../controllers/eleves.controller';
import { authentifier } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerEleves);
router.get('/:id', obtenirEleve);
router.post('/', creerEleve);
router.put('/:id', modifierEleve);
export default router;
