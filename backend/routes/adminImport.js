import { Router } from 'express';
import auth from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import { importFromGutendex } from '../controllers/adminImportController.js';

const router = Router();

router.use(auth, requireAdmin);

router.post('/gutendex', importFromGutendex);

export default router;
