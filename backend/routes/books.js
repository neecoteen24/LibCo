import { Router } from 'express';
import { body } from 'express-validator';
import {
  listBooks,
  listBookshelves,
  getBook,
  createBook,
  updateBook,
  removeBook,
  getBookContent,
  getBookTxt,
  getBookEpub,
  getBookPdf,
} from '../controllers/booksController.js';

const router = Router();

// GET /api/books?q=&page=&limit=
router.get('/', listBooks);

// GET /api/books/bookshelves
router.get('/bookshelves', listBookshelves);

// GET /api/books/:id
router.get('/:id', getBook);

// GET /api/books/:id/content?file=index.html
router.get('/:id/content', getBookContent);

// Shorthand content routes
router.get('/:id/content/txt', getBookTxt);
router.get('/:id/content/epub', getBookEpub);
router.get('/:id/content/pdf', getBookPdf);

// POST /api/books
router.post('/',
  body('gutenberg_id').isInt().withMessage('gutenberg_id must be integer'),
  body('data.title').isString().notEmpty(),
  body('data.id').isInt(),
  createBook
);

// PUT /api/books/:id
router.put('/:id', updateBook);

// PATCH /api/books/:id
router.patch('/:id', updateBook);

// DELETE /api/books/:id
router.delete('/:id', removeBook);

export default router;