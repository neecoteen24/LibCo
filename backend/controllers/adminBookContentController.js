import { put } from '@vercel/blob';
import Book from '../models/Books.js';

function requireBlobToken() {
  // @vercel/blob reads BLOB_READ_WRITE_TOKEN automatically,
  // but we check explicitly to return a friendly error.
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    const err = new Error('BLOB_READ_WRITE_TOKEN not configured');
    err.statusCode = 500;
    throw err;
  }
}

async function uploadToBlob({ gutenbergId, file, ext, contentTypeFallback }) {
  if (!file) {
    const err = new Error('No file uploaded');
    err.statusCode = 400;
    throw err;
  }

  const original = String(file.originalname || '').toLowerCase();
  if (original && !original.endsWith(ext)) {
    const err = new Error(`Expected a ${ext} file`);
    err.statusCode = 400;
    throw err;
  }

  requireBlobToken();

  const pathname = `books/${gutenbergId}/book${ext}`;

  const blob = await put(pathname, file.buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType: file.mimetype || contentTypeFallback,
  });

  return { url: blob.url, pathname: blob.pathname, contentType: blob.contentType, size: blob.size };
}

export async function adminUploadBookTxt(req, res, next) {
  try {
    const gutenbergId = Number(req.params.id);
    if (!Number.isInteger(gutenbergId) || gutenbergId <= 0) {
      return res.status(400).json({ error: 'Valid book id is required' });
    }

    const book = await Book.findOne({ gutenberg_id: gutenbergId });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const result = await uploadToBlob({
      gutenbergId,
      file: req.file,
      ext: '.txt',
      contentTypeFallback: 'text/plain; charset=utf-8',
    });

    book.content = book.content || {};
    book.content.provider = 'vercel-blob';
    book.content.txtUrl = result.url;
    book.content.txtPathname = result.pathname;
    await book.save();

    res.status(201).json({
      ok: true,
      content: {
        provider: book.content.provider,
        txtUrl: book.content.txtUrl,
        txtPathname: book.content.txtPathname,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminUploadBookEpub(req, res, next) {
  try {
    const gutenbergId = Number(req.params.id);
    if (!Number.isInteger(gutenbergId) || gutenbergId <= 0) {
      return res.status(400).json({ error: 'Valid book id is required' });
    }

    const book = await Book.findOne({ gutenberg_id: gutenbergId });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const result = await uploadToBlob({
      gutenbergId,
      file: req.file,
      ext: '.epub',
      contentTypeFallback: 'application/epub+zip',
    });

    book.content = book.content || {};
    book.content.provider = 'vercel-blob';
    book.content.epubUrl = result.url;
    book.content.epubPathname = result.pathname;
    await book.save();

    res.status(201).json({
      ok: true,
      content: {
        provider: book.content.provider,
        epubUrl: book.content.epubUrl,
        epubPathname: book.content.epubPathname,
      },
    });
  } catch (err) {
    next(err);
  }
}
