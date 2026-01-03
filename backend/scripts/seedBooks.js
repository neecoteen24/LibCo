import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import { connectDB } from '../config/db.js';
import Book from '../models/Books.js';

async function seed() {
  await connectDB();

  const metaDir = path.resolve(process.cwd(), '../test/books_meta');
  const contentDir = path.resolve(process.cwd(), '../test/books');

  const files = await fs.readdir(metaDir);
  let inserted = 0;

  for (const name of files) {
    if (!name.endsWith('.json')) continue;
    const jsonPath = path.join(metaDir, name);
    const text = await fs.readFile(jsonPath, 'utf-8');
    const meta = JSON.parse(text);

    const gutenberg_id = meta.gutenberg_id ?? meta.data?.id;
    const bookContentBase = path.join(contentDir, String(gutenberg_id));

    // Normalize data shape for our Mongoose schema
    const rawData = meta.data || {};

    // Mongoose Map keys cannot contain '.', so drop such formats
    const rawFormats = rawData.formats && typeof rawData.formats === 'object'
      ? rawData.formats
      : {};

    const safeFormats = Object.fromEntries(
      Object.entries(rawFormats).filter(([key]) => !key.includes('.'))
    );

    const normalizedData = {
      ...rawData,
      // authors may sometimes be plain strings; normalize to objects
      authors: Array.isArray(rawData.authors)
        ? rawData.authors
            .map((a) =>
              typeof a === 'string'
                ? { name: a }
                : a && typeof a === 'object'
                  ? { name: a.name, birth_year: a.birth_year, death_year: a.death_year }
                  : null
            )
            .filter((a) => a && a.name)
        : [],
      // editors may also come as objects; keep just names
      editors: Array.isArray(rawData.editors)
        ? rawData.editors.map((e) => (typeof e === 'string' ? e : e.name)).filter(Boolean)
        : [],
      // translators come in as objects from Gutendex; store just their names
      translators: Array.isArray(rawData.translators)
        ? rawData.translators.map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean)
        : [],
      formats: safeFormats,
    };

    const payload = {
      gutenberg_id,
      source: meta.source || 'gutendex',
      data: normalizedData,
      content: { basePath: bookContentBase }
    };

    await Book.updateOne(
      { gutenberg_id },
      { $set: payload },
      { upsert: true }
    );
    inserted++;
  }

  console.log(`Seed complete. Upserted ${inserted} books.`);
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });