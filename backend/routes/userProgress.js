import { Router } from 'express';
import auth from '../middlewares/auth.js';
import {
  upsertProgress,
  listProgress,
  getProgressForBook,
} from '../controllers/userProgressController.js';

const router = Router();

router.use(auth);

router.get('/', listProgress);
router.get('/:gutenbergId', getProgressForBook);
router.put('/:gutenbergId', upsertProgress);

export default router;
