import mongoose from 'mongoose';

const ReadingProgressSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true },
  gutenberg_id: { type: Number, required: true },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'abandoned'],
    default: 'in_progress',
  },
  progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  filePath: { type: String, default: 'index.html' },
  anchorId: { type: String },
  scrollPercent: { type: Number, min: 0, max: 100 },
  lastVisitedAt: { type: Date, default: Date.now },
  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  totalVisits: { type: Number, default: 0 },
}, { _id: false });

const GenreStatSchema = new mongoose.Schema({
  genre: { type: String, required: true },
  visits: { type: Number, default: 0 },
  completed: { type: Number, default: 0 },
  lastVisitedAt: { type: Date },
}, { _id: false });

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  preferences: {
    preferredGenres: { type: [String], default: [] },
    preferredLanguages: { type: [String], default: [] },
  },
  readingProgress: { type: [ReadingProgressSchema], default: [] },
  genreStats: { type: [GenreStatSchema], default: [] },
}, { timestamps: true });

export default mongoose.model('User', UserSchema);
