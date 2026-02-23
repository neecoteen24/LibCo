import 'dotenv/config';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { put } from '@vercel/blob';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import Book from '../models/Books.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs(argv) {
  const args = {
    dryRun: false,
    onlyMissing: true,
    force: false,
    limit: null,
    concurrency: 4,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--dry-run') args.dryRun = true;
    else if (a === '--only-missing') args.onlyMissing = true;
    else if (a === '--force') args.force = true;
    else if (a === '--limit') {
      const n = Number(argv[i + 1]);
      if (!Number.isInteger(n) || n <= 0) throw new Error('Invalid --limit value');
      args.limit = n;
      i += 1;
    } else if (a === '--concurrency') {
      const n = Number(argv[i + 1]);
      if (!Number.isInteger(n) || n <= 0 || n > 20) throw new Error('Invalid --concurrency value');
      args.concurrency = n;
      i += 1;
    } else if (a === '--help' || a === '-h') {
      args.help = true;
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }

  if (args.force) args.onlyMissing = false;
  return args;
}

function usage() {
  return [
    'Usage: node scripts/pushTestBooksToBlob.js [options]',
    '',
    'Uploads files from ../../test/books/<id>/book.* into Vercel Blob at books/<id>/book.*',
    'and updates MongoDB Book.content.{txtUrl,epubUrl,pdfUrl} for matching gutenberg_id.',
    '',
    'Options:',
    '  --dry-run            Print what would happen without uploading/updating Mongo',
    '  --only-missing        Skip upload if URL already exists in Mongo (default)',
    '  --force              Re-upload and overwrite URLs in Mongo',
    '  --limit <n>           Process only first n folders',
    '  --concurrency <n>     Parallel uploads (default 4, max 20)',
  ].join('\n');
}

async function listBookIdsOnDisk(contentRoot, limit) {
  const dirents = await fs.readdir(contentRoot, { withFileTypes: true });
  const ids = dirents
    .filter((d) => d.isDirectory() && /^\d+$/.test(d.name))
    .map((d) => Number(d.name))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);

  return typeof limit === 'number' ? ids.slice(0, limit) : ids;
}

async function readFileIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return fs.readFile(filePath);
}

async function uploadOne({ gutenbergId, localDir, args }) {
  const txtPath = path.join(localDir, 'book.txt');
  const epubPath = path.join(localDir, 'book.epub');
  const pdfPath = path.join(localDir, 'book.pdf');

  if (args.dryRun) {
    return {
      gutenbergId,
      status: 'dry-run',
      presentOnDisk: {
        txt: existsSync(txtPath),
        epub: existsSync(epubPath),
        pdf: existsSync(pdfPath),
      },
      note: 'Dry-run does not read or update MongoDB.',
    };
  }

  const book = await Book.findOne({ gutenberg_id: gutenbergId });
  if (!book) {
    return { gutenbergId, status: 'skipped', reason: 'missing-db-record' };
  }

  const existing = book.content || {};
  const shouldSkipTxt = args.onlyMissing && existing.txtUrl;
  const shouldSkipEpub = args.onlyMissing && existing.epubUrl;
  const shouldSkipPdf = args.onlyMissing && existing.pdfUrl;

  const txtBuf = shouldSkipTxt ? null : await readFileIfExists(txtPath);
  const epubBuf = shouldSkipEpub ? null : await readFileIfExists(epubPath);
  const pdfBuf = shouldSkipPdf ? null : await readFileIfExists(pdfPath);

  if (!txtBuf && !epubBuf && !pdfBuf) {
    return { gutenbergId, status: 'skipped', reason: 'no-files-to-upload-or-already-present' };
  }

  const contentUpdate = { provider: 'vercel-blob' };

  if (txtBuf) {
    const blob = await put(`books/${gutenbergId}/book.txt`, txtBuf, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'text/plain; charset=utf-8',
    });
    contentUpdate.txtUrl = blob.url;
    contentUpdate.txtPathname = blob.pathname;
  }

  if (epubBuf) {
    const blob = await put(`books/${gutenbergId}/book.epub`, epubBuf, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/epub+zip',
    });
    contentUpdate.epubUrl = blob.url;
    contentUpdate.epubPathname = blob.pathname;
  }

  if (pdfBuf) {
    const blob = await put(`books/${gutenbergId}/book.pdf`, pdfBuf, {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/pdf',
    });
    contentUpdate.pdfUrl = blob.url;
    contentUpdate.pdfPathname = blob.pathname;
  }

  await Book.updateOne(
    { gutenberg_id: gutenbergId },
    {
      $set: {
        'content.provider': contentUpdate.provider,
        ...(contentUpdate.txtUrl
          ? { 'content.txtUrl': contentUpdate.txtUrl, 'content.txtPathname': contentUpdate.txtPathname }
          : {}),
        ...(contentUpdate.epubUrl
          ? { 'content.epubUrl': contentUpdate.epubUrl, 'content.epubPathname': contentUpdate.epubPathname }
          : {}),
        ...(contentUpdate.pdfUrl
          ? { 'content.pdfUrl': contentUpdate.pdfUrl, 'content.pdfPathname': contentUpdate.pdfPathname }
          : {}),
      },
    },
  );

  return {
    gutenbergId,
    status: 'uploaded',
    uploaded: {
      txt: Boolean(contentUpdate.txtUrl),
      epub: Boolean(contentUpdate.epubUrl),
      pdf: Boolean(contentUpdate.pdfUrl),
    },
  };
}

async function runPool(items, concurrency, worker) {
  let index = 0;
  const results = [];

  async function runner() {
    while (true) {
      const i = index;
      index += 1;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }

  const runners = Array.from({ length: Math.min(concurrency, items.length) }, () => runner());
  await Promise.all(runners);
  return results;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    process.exit(0);
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN && !args.dryRun) {
    console.error('BLOB_READ_WRITE_TOKEN not set. Put it in backend/.env (or use --dry-run).');
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri && !args.dryRun) {
    console.error('MONGODB_URI not set. Put it in backend/.env (or use --dry-run).');
    process.exit(1);
  }

  const contentRoot = path.resolve(__dirname, '../../test/books');
  if (!existsSync(contentRoot)) {
    console.error(`Content root not found: ${contentRoot}`);
    process.exit(1);
  }

  const ids = await listBookIdsOnDisk(contentRoot, args.limit);
  if (!ids.length) {
    console.log(`No numeric book folders found under: ${contentRoot}`);
    process.exit(0);
  }

  if (!args.dryRun) await connectDB();

  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  const results = await runPool(
    ids,
    args.concurrency,
    async (gutenbergId, idx) => {
      const localDir = path.join(contentRoot, String(gutenbergId));
      try {
        const r = await uploadOne({ gutenbergId, localDir, args });
        if (r.status === 'uploaded') uploaded += 1;
        else skipped += 1;

        const every = 25;
        if ((idx + 1) % every === 0 || idx === ids.length - 1) {
          console.log(`Progress: ${idx + 1}/${ids.length} (uploaded=${uploaded}, skipped=${skipped}, failed=${failed})`);
        }
        return r;
      } catch (err) {
        failed += 1;
        console.error(`FAILED ${gutenbergId}: ${err?.message || err}`);
        return { gutenbergId, status: 'failed', error: err?.message || String(err) };
      }
    },
  );

  const summary = {
    totalFolders: ids.length,
    uploaded,
    skipped,
    failed,
  };

  console.log('Done:', JSON.stringify(summary, null, 2));

  if (failed > 0) {
    process.exitCode = 1;
  }

  if (!args.dryRun) {
    await mongoose.disconnect();
  }

  return results;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
