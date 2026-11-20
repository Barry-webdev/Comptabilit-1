import { Router } from 'express';
import { listerClasses, creerClasse, modifierClasse } from '../controllers/classes.controller';
import { authentifier, exigerRole } from '../middlewares/auth.middleware';

const router = Router();
router.use(authentifier);
router.get('/', listerClasses);
router.post('/', exigerRole('administratrice'), creerClasse);
router.put('/:id', exigerRole('administratrice'), modifierClasse);
export default router;
