import User from '../models/User.js';
import Book from '../models/Books.js';

function updateGenreStats(user, book, isCompleted) {
  const labels = [
    ...(book.data?.bookshelves || []),
    ...(book.data?.subjects || []),
  ];

  const genres = new Set();
  for (const label of labels) {
    if (!label) continue;
    const lower = String(label).toLowerCase();
    if (lower.includes('fiction')) genres.add('Fiction');
    if (lower.includes('mystery') || lower.includes('detective')) genres.add('Mystery & Thrillers');
    if (lower.includes('science fiction') || lower.includes('sci-fi') || lower.includes('fantasy')) genres.add('Science Fiction & Fantasy');
    if (lower.includes('poetry') || lower.includes('poems')) genres.add('Poetry');
  }

  const now = new Date();

  for (const genre of genres) {
    const existing = user.genreStats.find((g) => g.genre === genre);
    if (!existing) {
      user.genreStats.push({
        genre,
        visits: 1,
        completed: isCompleted ? 1 : 0,
        lastVisitedAt: now,
      });
    } else {
      existing.visits += 1;
      if (isCompleted) existing.completed += 1;
      existing.lastVisitedAt = now;
    }
  }
}

export async function upsertProgress(req, res, next) {
  try {
    const { gutenbergId } = req.params;
    const {
      status = 'in_progress',
      progressPercent = 0,
      filePath = 'index.html',
      anchorId,
      scrollPercent,
    } = req.body;

    const book = await Book.findOne({ gutenberg_id: Number(gutenbergId) });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const completed = status === 'completed' || Number(progressPercent) >= 100;

    let entry = user.readingProgress.find((p) => p.gutenberg_id === book.gutenberg_id);
    if (!entry) {
      entry = {
        book: book._id,
        gutenberg_id: book.gutenberg_id,
        status: completed ? 'completed' : status,
        progressPercent: Math.min(100, Math.max(0, Number(progressPercent) || 0)),
        filePath,
        anchorId,
        scrollPercent,
        startedAt: now,
        lastVisitedAt: now,
        completedAt: completed ? now : undefined,
        totalVisits: 1,
      };
      user.readingProgress.push(entry);
    } else {
      entry.status = completed ? 'completed' : status;
      entry.progressPercent = Math.min(100, Math.max(0, Number(progressPercent) || 0));
      entry.filePath = filePath;
      entry.anchorId = anchorId;
      entry.scrollPercent = scrollPercent;
      entry.lastVisitedAt = now;
      entry.totalVisits = (entry.totalVisits || 0) + 1;
      if (completed && !entry.completedAt) {
        entry.completedAt = now;
      }
    }

    updateGenreStats(user, book, completed);

    await user.save();

    const safeProgress = user.readingProgress.map((p) => ({
      gutenberg_id: p.gutenberg_id,
      status: p.status,
      progressPercent: p.progressPercent,
      filePath: p.filePath,
      anchorId: p.anchorId,
      scrollPercent: p.scrollPercent,
      lastVisitedAt: p.lastVisitedAt,
      startedAt: p.startedAt,
      completedAt: p.completedAt,
      totalVisits: p.totalVisits,
    }));

    res.json({ progress: safeProgress });
  } catch (err) {
    next(err);
  }
}

export async function listProgress(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const entries = Array.isArray(user.readingProgress) ? user.readingProgress : [];

    const ids = entries.map((p) => p.gutenberg_id);
    const books = await Book.find(
      { gutenberg_id: { $in: ids } },
      { 'data.title': 1, 'data.authors': 1, 'data.languages': 1, 'data.bookshelves': 1, 'data.subjects': 1, gutenberg_id: 1 },
    ).lean();

    const byId = new Map();
    for (const b of books) {
      byId.set(b.gutenberg_id, b);
    }

    const progress = entries
      .map((p) => {
        const b = byId.get(p.gutenberg_id);
        const authors = (b?.data?.authors || []).map((a) => a.name).filter(Boolean);
        const genres = [
          ...(b?.data?.bookshelves || []),
          ...(b?.data?.subjects || []),
        ];
        return {
          gutenberg_id: p.gutenberg_id,
          status: p.status,
          progressPercent: p.progressPercent,
          filePath: p.filePath,
          anchorId: p.anchorId,
          scrollPercent: p.scrollPercent,
          lastVisitedAt: p.lastVisitedAt,
          startedAt: p.startedAt,
          completedAt: p.completedAt,
          totalVisits: p.totalVisits,
          book: b
            ? {
                title: b.data?.title,
                authors,
                languages: b.data?.languages || [],
                genres,
              }
            : null,
        };
      })
      .sort((a, b) => {
        const at = a.lastVisitedAt ? new Date(a.lastVisitedAt).getTime() : 0;
        const bt = b.lastVisitedAt ? new Date(b.lastVisitedAt).getTime() : 0;
        return bt - at;
      });

    res.json({ progress });
  } catch (err) {
    next(err);
  }
}

export async function getProgressForBook(req, res, next) {
  try {
    const { gutenbergId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const entry = user.readingProgress.find((p) => p.gutenberg_id === Number(gutenbergId));
    if (!entry) return res.status(404).json({ error: 'No progress for this book' });

    const book = await Book.findOne(
      { gutenberg_id: entry.gutenberg_id },
      { 'data.title': 1, 'data.authors': 1, 'data.languages': 1, 'data.bookshelves': 1, 'data.subjects': 1, gutenberg_id: 1 },
    ).lean();

    const result = {
      gutenberg_id: entry.gutenberg_id,
      status: entry.status,
      progressPercent: entry.progressPercent,
      filePath: entry.filePath,
      anchorId: entry.anchorId,
      scrollPercent: entry.scrollPercent,
      lastVisitedAt: entry.lastVisitedAt,
      startedAt: entry.startedAt,
      completedAt: entry.completedAt,
      totalVisits: entry.totalVisits,
      book: book
        ? {
            title: book.data?.title,
            authors: (book.data?.authors || []).map((a) => a.name).filter(Boolean),
            languages: book.data?.languages || [],
            genres: [
              ...(book.data?.bookshelves || []),
              ...(book.data?.subjects || []),
            ],
          }
        : null,
    };

    res.json({ progress: result });
  } catch (err) {
    next(err);
  }
}
