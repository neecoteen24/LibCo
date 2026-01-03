import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import { connectDB } from './config/db.js';
import booksRouter from './routes/books.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();
connectDB();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

// Serve local book contents (HTML/TXT/etc) from test/books
const contentRoot = path.resolve(process.cwd(), '../test/books');
app.use('/content', express.static(contentRoot));

// API routes
app.use('/api/books', booksRouter);

// Error handler (last)
app.use(errorHandler);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API listening on http://localhost:${port}`));