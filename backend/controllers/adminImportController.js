import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import Book from '../models/Books.js';
import { put } from '@vercel/blob';

function normalizeGutendexMeta(meta, content) {
  const gutenberg_id = meta.gutenberg_id ?? meta.id;
  const rawData = meta || {};

  const rawFormats = rawData.formats && typeof rawData.formats === 'object'
    ? rawData.formats
    : {};

  const safeFormats = Object.fromEntries(
    Object.entries(rawFormats).filter(([key]) => !key.includes('.')),
  );

  const normalizedData = {
    ...rawData,
    authors: Array.isArray(rawData.authors)
      ? rawData.authors
          .map((a) =>
            typeof a === 'string'
              ? { name: a }
              : a && typeof a === 'object'
              ? { name: a.name, birth_year: a.birth_year, death_year: a.death_year }
              : null,
          )
          .filter((a) => a && a.name)
      : [],
    editors: Array.isArray(rawData.editors)
      ? rawData.editors.map((e) => (typeof e === 'string' ? e : e.name)).filter(Boolean)
      : [],
    translators: Array.isArray(rawData.translators)
      ? rawData.translators.map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean)
      : [],
    formats: safeFormats,
  };

  return {
    gutenberg_id,
    source: meta.source || 'gutendex',
    data: normalizedData,
    content,
  };
}

async function downloadBookContent(formats, bookDir) {
  const entries = Object.entries(formats || {});
  if (!entries.length) return;

  await fs.mkdir(bookDir, { recursive: true });

  let textUrl = null;
  let htmlUrl = null;
  let epubUrl = null;

  for (const [mime, url] of entries) {
    if (typeof url !== 'string') continue;
    const lower = mime.toLowerCase();
    if (!textUrl && lower.startsWith('text/plain')) textUrl = url;
    if (!htmlUrl && lower.startsWith('text/html')) htmlUrl = url;
    if (!epubUrl && lower === 'application/epub+zip') epubUrl = url;
  }

  async function safeFetch(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  if (textUrl) {
    const buf = await safeFetch(textUrl);
    if (buf) {
      await fs.writeFile(path.join(bookDir, 'book.txt'), buf);
    }
  }

  if (epubUrl) {
    const buf = await safeFetch(epubUrl);
    if (buf) {
      await fs.writeFile(path.join(bookDir, 'book.epub'), buf);
    }
  }

  if (htmlUrl) {
    const buf = await safeFetch(htmlUrl);
    if (buf) {
      await fs.writeFile(path.join(bookDir, 'index.html'), buf);
    }
  }
}

async function uploadBookContentToBlob({ gutenbergId, formats }) {
  const entries = Object.entries(formats || {});
  if (!entries.length) return {};

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    // Not configured; caller should fall back to filesystem.
    return {};
  }

  let textUrl = null;
  let epubUrl = null;

  for (const [mime, url] of entries) {
    if (typeof url !== 'string') continue;
    const lower = String(mime).toLowerCase();
    if (!textUrl && lower.startsWith('text/plain')) textUrl = url;
    if (!epubUrl && lower === 'application/epub+zip') epubUrl = url;
  }

  async function safeFetch(url) {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return Buffer.from(await res.arrayBuffer());
    } catch {
      return null;
    }
  }

  const content = { provider: 'vercel-blob' };

  if (textUrl) {
    const buf = await safeFetch(textUrl);
    if (buf) {
      const blob = await put(`books/${gutenbergId}/book.txt`, buf, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'text/plain; charset=utf-8',
      });
      content.txtUrl = blob.url;
      content.txtPathname = blob.pathname;
    }
  }

  if (epubUrl) {
    const buf = await safeFetch(epubUrl);
    if (buf) {
      const blob = await put(`books/${gutenbergId}/book.epub`, buf, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/epub+zip',
      });
      content.epubUrl = blob.url;
      content.epubPathname = blob.pathname;
    }
  }

  return content;
}

export async function importFromGutendex(req, res, next) {
  try {
    const { gutenbergId } = req.body;
    const id = Number(gutenbergId);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Valid gutenbergId is required' });
    }

    const resp = await fetch(`https://gutendex.com/books/${id}`);
    if (!resp.ok) {
      return res.status(resp.status).json({ error: `Gutendex returned ${resp.status}` });
    }
    const meta = await resp.json();

    const formats = meta.formats || meta.data?.formats || {};

    // If Blob is configured, prefer storing book content in object storage.
    // Otherwise fall back to writing into test/books/<id> on disk.
    let content = await uploadBookContentToBlob({ gutenbergId: id, formats });
    if (!content || (!content.txtUrl && !content.epubUrl)) {
      const contentRoot = path.resolve(process.cwd(), '../test/books');
      const bookDir = path.join(contentRoot, String(id));
      await downloadBookContent(formats, bookDir);
      content = { basePath: bookDir };
    }

    const payload = normalizeGutendexMeta(meta, content);

    const result = await Book.findOneAndUpdate(
      { gutenberg_id: payload.gutenberg_id },
      payload,
      { new: true, upsert: true, runValidators: true },
    );

    res.status(201).json({ book: result });
  } catch (err) {
    next(err);
  }
}
