import { Router } from 'express';
import auth from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import {
  adminListBooks,
  adminCreateBook,
  adminUpdateBook,
  adminDeleteBook,
} from '../controllers/adminBooksController.js';

const router = Router();

router.use(auth, requireAdmin);

router.get('/', adminListBooks);
router.post('/', adminCreateBook);
router.put('/:id', adminUpdateBook);
router.patch('/:id', adminUpdateBook);
router.delete('/:id', adminDeleteBook);

export default router;
