import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import Book from '../models/Books.js';

function normalizeGutendexMeta(meta, contentBasePath) {
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
    content: { basePath: contentBasePath },
  };
}

async function downloadBookContent(formats, bookDir) {
  const entries = Object.entries(formats || {});
  if (!entries.length) return;

  await fs.mkdir(bookDir, { recursive: true });

  let textUrl = null;
  let htmlUrl = null;

  for (const [mime, url] of entries) {
    if (typeof url !== 'string') continue;
    const lower = mime.toLowerCase();
    if (!textUrl && lower.startsWith('text/plain')) textUrl = url;
    if (!htmlUrl && lower.startsWith('text/html')) htmlUrl = url;
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

  if (htmlUrl) {
    const buf = await safeFetch(htmlUrl);
    if (buf) {
      await fs.writeFile(path.join(bookDir, 'index.html'), buf);
    }
  }
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

    const contentRoot = path.resolve(process.cwd(), '../test/books');
    const bookDir = path.join(contentRoot, String(id));

    await downloadBookContent(meta.formats || meta.data?.formats || {}, bookDir);

    const payload = normalizeGutendexMeta(meta, bookDir);

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
