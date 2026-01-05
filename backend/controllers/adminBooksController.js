import Book from '../models/Books.js';

export async function adminListBooks(req, res, next) {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const numericPage = Number(page) || 1;
    const numericLimit = Math.min(100, Number(limit) || 20);

    const filter = {};
    if (q) {
      filter['data.title'] = { $regex: q, $options: 'i' };
    }

    const books = await Book.find(filter)
      .sort({ 'data.title': 1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit);
    const total = await Book.countDocuments(filter);

    res.json({ data: books, page: numericPage, limit: numericLimit, total });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateBook(req, res, next) {
  try {
    const payload = req.body;
    if (!payload?.gutenberg_id || !payload?.data?.title) {
      return res.status(400).json({ error: 'gutenberg_id and data.title are required' });
    }
    const existing = await Book.findOne({ gutenberg_id: payload.gutenberg_id });
    if (existing) {
      return res.status(409).json({ error: 'Book with this gutenberg_id already exists' });
    }
    const book = await Book.create(payload);
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateBook(req, res, next) {
  try {
    const { id } = req.params; // gutenberg_id
    const book = await Book.findOneAndUpdate(
      { gutenberg_id: Number(id) },
      req.body,
      { new: true, runValidators: true },
    );
    if (!book) return res.status(404).json({ error: 'Not found' });
    res.json(book);
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteBook(req, res, next) {
  try {
    const { id } = req.params; // gutenberg_id
    const result = await Book.deleteOne({ gutenberg_id: Number(id) });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
