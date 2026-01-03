import path from 'path';
import fs from 'fs/promises';
import Book from '../models/Books.js';
import { validationResult } from 'express-validator';

// Heuristic genre rules to group many Project Gutenberg bookshelves/subjects
// into a smaller set of reader-friendly categories.
const GENRE_RULES = [
  {
    name: 'Fiction',
    keywords: ['fiction', 'short stories', 'story', 'novel', 'romance'],
  },
  {
    name: 'Mystery & Thrillers',
    keywords: ['mystery', 'detective', 'thriller', 'crime'],
  },
  {
    name: 'Science Fiction & Fantasy',
    keywords: ['science fiction', 'sci-fi', 'fantasy', 'fairy tales', 'ghost', 'horror', 'weird'],
  },
  {
    name: 'Poetry',
    keywords: ['poetry', 'poems', 'verse'],
  },
  {
    name: 'Drama & Plays',
    keywords: ['drama', 'plays', 'theatre', 'theater'],
  },
  {
    name: 'Children & Young Readers',
    keywords: ['children', 'juvenile', 'fairy tales', 'young readers'],
  },
  {
    name: 'History & Politics',
    keywords: ['history', 'historical', 'war', 'military', 'politics', 'government'],
  },
  {
    name: 'Biography & Memoir',
    keywords: ['biography', 'autobiography', 'memoir', 'letters'],
  },
  {
    name: 'Religion & Spirituality',
    keywords: ['religion', 'theology', 'bible', 'sermons', 'spiritual'],
  },
  {
    name: 'Science & Mathematics',
    keywords: ['science', 'mathematics', 'physics', 'chemistry', 'biology', 'astronomy', 'medicine'],
  },
  {
    name: 'Philosophy & Essays',
    keywords: ['philosophy', 'ethics', 'essays'],
  },
  {
    name: 'Travel & Adventure',
    keywords: ['travel', 'adventure', 'exploration'],
  },
  {
    name: 'Art, Music & Design',
    keywords: ['art', 'architecture', 'music', 'design'],
  },
];

const FALLBACK_GENRE = 'Other & Miscellaneous';

function inferGenresFromLabels(labels = []) {
  const genres = new Set();
  for (const label of labels) {
    if (!label) continue;
    const lower = String(label).toLowerCase();
    for (const rule of GENRE_RULES) {
      if (rule.keywords.some((kw) => lower.includes(kw))) {
        genres.add(rule.name);
      }
    }
  }
  if (!genres.size && labels.length) {
    genres.add(FALLBACK_GENRE);
  }
  return Array.from(genres);
}

export async function listBooks(req, res, next) {
  try {
    const { q, page = 1, limit = 20, random, bookshelf, genre } = req.query;

    const filter = {};
    if (q) {
      filter['data.title'] = { $regex: q, $options: 'i' };
    }
    if (bookshelf) {
      filter['data.bookshelves'] = bookshelf;
    }

    // If a high-level genre is provided, approximate it using bookshelf/subject keywords
    if (genre) {
      const rule = GENRE_RULES.find((r) => r.name === genre);
      if (rule) {
        const regexes = rule.keywords.map((kw) => new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'));
        filter.$or = [
          { 'data.bookshelves': { $in: regexes } },
          { 'data.subjects': { $in: regexes } },
        ];
      }
    }

    // If random=true, return a random sample of books (respecting filters)
    if (random === 'true') {
      const size = Number(limit) || 20;
      const pipeline = [
        { $match: filter },
        { $sample: { size } },
      ];
      const books = await Book.aggregate(pipeline);
      const total = await Book.countDocuments(filter);
      return res.json({ data: books, page: 1, limit: size, total });
    }

    const numericPage = Number(page) || 1;
    const numericLimit = Number(limit) || 20;

    const books = await Book.find(filter)
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .sort({ 'data.title': 1 });
    const total = await Book.countDocuments(filter);
    res.json({ data: books, page: numericPage, limit: numericLimit, total });
  } catch (err) { next(err); }
}

export async function listBookshelves(req, res, next) {
  try {
    const books = await Book.find({}, { 'data.bookshelves': 1, 'data.subjects': 1 }).lean();

    const counts = new Map();
    for (const book of books) {
      const labels = [
        ...(book.data?.bookshelves || []),
        ...(book.data?.subjects || []),
      ];
      const genres = inferGenresFromLabels(labels);
      for (const g of genres) {
        counts.set(g, (counts.get(g) || 0) + 1);
      }
    }

    const shelves = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({ data: shelves });
  } catch (err) { next(err); }
}

export async function getBook(req, res, next) {
  try {
    const { id } = req.params; // gutenberg_id
    const book = await Book.findOne({ gutenberg_id: Number(id) });
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
  } catch (err) { next(err); }
}

export async function createBook(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const payload = req.body;
    const book = await Book.create(payload);
    res.status(201).json(book);
  } catch (err) { next(err); }
}

export async function updateBook(req, res, next) {
  try {
    const { id } = req.params;
    const book = await Book.findOneAndUpdate(
      { gutenberg_id: Number(id) },
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
  } catch (err) { next(err); }
}

export async function removeBook(req, res, next) {
  try {
    const { id } = req.params;
    const result = await Book.deleteOne({ gutenberg_id: Number(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) { next(err); }
}

// Serve book content from filesystem via /api/books/:id/content?file=index.html
export async function getBookContent(req, res, next) {
  try {
    const { id } = req.params;
    const { file = 'index.html' } = req.query;
    const book = await Book.findOne({ gutenberg_id: Number(id) });

    // Prefer stored basePath; fall back to default test/books/<id> location
    const defaultBase = path.resolve(process.cwd(), '../test/books', String(id));
    const basePath = book?.content?.basePath || defaultBase;

    const abs = path.resolve(basePath, String(file));
    try {
      await fs.access(abs);
      res.sendFile(abs);
    } catch {
      return res.status(404).json({ error: 'File not found' });
    }
  } catch (err) { next(err); }
}

// Convenience endpoints for common formats
export async function getBookTxt(req, res, next) {
  try {
    const { id } = req.params;
    const contentRoot = path.resolve(process.cwd(), '../test/books');
    const abs = path.resolve(contentRoot, String(id), 'book.txt');
    await fs.access(abs);
    return res.sendFile(abs);
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }
}

export async function getBookEpub(req, res, next) {
  try {
    const { id } = req.params;
    const contentRoot = path.resolve(process.cwd(), '../test/books');
    const abs = path.resolve(contentRoot, String(id), 'book.epub');
    await fs.access(abs);
    return res.sendFile(abs);
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }
}

export async function getBookPdf(req, res, next) {
  try {
    const { id } = req.params;
    const contentRoot = path.resolve(process.cwd(), '../test/books');
    const abs = path.resolve(contentRoot, String(id), 'book.pdf');
    await fs.access(abs);
    return res.sendFile(abs);
  } catch {
    return res.status(404).json({ error: 'File not found' });
  }
}