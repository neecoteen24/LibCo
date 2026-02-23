import { Router } from 'express';
import multer from 'multer';
import auth from '../middlewares/auth.js';
import requireAdmin from '../middlewares/requireAdmin.js';
import {
  adminListBooks,
  adminCreateBook,
  adminUpdateBook,
  adminDeleteBook,
} from '../controllers/adminBooksController.js';
import {
  adminUploadBookTxt,
  adminUploadBookEpub,
} from '../controllers/adminBookContentController.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Keep conservative defaults for serverless environments.
    // You can raise this later if needed.
    fileSize: 25 * 1024 * 1024,
  },
});

router.use(auth, requireAdmin);

router.get('/', adminListBooks);
router.post('/', adminCreateBook);

// Upload book content to object storage (Vercel Blob)
// Form field: file
router.post('/:id/content/txt', upload.single('file'), adminUploadBookTxt);
router.post('/:id/content/epub', upload.single('file'), adminUploadBookEpub);

router.put('/:id', adminUpdateBook);
router.patch('/:id', adminUpdateBook);
router.delete('/:id', adminDeleteBook);

export default router;
