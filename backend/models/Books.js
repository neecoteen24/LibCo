import mongoose from 'mongoose';

const AuthorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birth_year: Number,
  death_year: Number,
}, { _id: false });

const DataSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  title: { type: String, required: true, index: true },
  authors: { type: [AuthorSchema], default: [] },
  summaries: { type: [String], default: [] },
  editors: { type: [String], default: [] },
  translators: { type: [String], default: [] },
  subjects: { type: [String], default: [] },
  bookshelves: { type: [String], default: [] },
  languages: { type: [String], default: [] },
  copyright: { type: Boolean, default: false },
  media_type: { type: String, default: 'Text' },
  // Flexible key-value for formats: "text/html", "application/epub+zip", etc.
  // Use a plain object (Mixed) to avoid Map key restrictions on characters like '.'
  formats: { type: mongoose.Schema.Types.Mixed, default: {} },
  download_count: { type: Number, default: 0 },
}, { _id: false });

const ContentSchema = new mongoose.Schema({
  // filesystem base path for this book content (e.g., absolute path to test/books/11)
  basePath: { type: String, required: false },
  preferredFormat: { type: String, required: false },
}, { _id: false });

const BookSchema = new mongoose.Schema({
  gutenberg_id: { type: Number, required: true, unique: true, index: true },
  source: { type: String, enum: ['gutendex', 'manual'], default: 'gutendex' },
  data: { type: DataSchema, required: true },
  content: { type: ContentSchema, required: false },
}, { timestamps: true });

export default mongoose.model('Book', BookSchema);