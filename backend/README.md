# LibraryCo Backend

## Prerequisites
- Node.js 18+
- MongoDB running locally or cloud URI in `.env`

## Environment
Create `backend/.env`:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/libraryco
JWT_SECRET=dev_secret_change_me

# Optional (for storing book files in Vercel Blob)
# Create a Blob store in Vercel, then add the read-write token here.
BLOB_READ_WRITE_TOKEN=...
```
(You currently have a cloud URI; keep that if preferred.)

## Install & Run
```
cd backend
npm install
npm run dev
```
API runs at `http://localhost:4000`.

## Static Content
Local book files served from `test/books/<id>`
- Direct: `http://localhost:4000/content/<id>/index.html`
- Via API: `GET /api/books/:id/content?file=index.html`

If a book has Blob URLs saved in MongoDB (e.g. `content.txtUrl`, `content.epubUrl`),
the shorthand endpoints below will redirect to those URLs instead of reading from disk.

Note: this project currently uploads blobs with `access: "public"`, so your Blob store
must be configured for public access in Vercel.

### Book download endpoints
- `GET /api/books/:id/content/txt`
- `GET /api/books/:id/content/epub`
- `GET /api/books/:id/content/pdf`

### Admin upload to Blob
These endpoints require an admin JWT (`Authorization: Bearer <token>`) and a `multipart/form-data` body with field name `file`.
- `POST /api/admin/books/:id/content/txt`
- `POST /api/admin/books/:id/content/epub`

### Bulk push `test/books/*` to Blob
If you already have book files on disk under `test/books/<id>/book.txt` and/or `book.epub`, you can upload them all to Vercel Blob and update MongoDB URLs:
```
cd backend

# Optional: preview what folders contain content
npm run push-test-books-to-blob -- --dry-run --limit 5

# Upload everything (skips books that already have Blob URLs in Mongo)
npm run push-test-books-to-blob

# Force re-upload (overwrites the Blob objects and Mongo URLs)
npm run push-test-books-to-blob -- --force
```

Notes:
- Requires `MONGODB_URI` and `BLOB_READ_WRITE_TOKEN` in `backend/.env`.
- Uses `access: "public"` and paths like `books/<id>/book.txt`.

## Books API
- `GET /api/books?q=&page=&limit=` — list/search
- `GET /api/books/:id` — fetch by `gutenberg_id`
- `POST /api/books` — create
- `PUT /api/books/:id` — update
- `PATCH /api/books/:id` — partial update
- `DELETE /api/books/:id` — remove

Body example (Alice, 11):
```
{
  "gutenberg_id": 11,
  "source": "gutendex",
  "data": {
    "id": 11,
    "title": "Alice's Adventures in Wonderland",
    "authors": [{ "name": "Carroll, Lewis", "birth_year": 1832, "death_year": 1898 }],
    "summaries": ["..."],
    "editors": [],
    "translators": [],
    "subjects": ["..."],
    "bookshelves": ["..."],
    "languages": ["en"],
    "copyright": false,
    "media_type": "Text",
    "formats": { "text/html": "https://..." },
    "download_count": 63687
  },
  "content": {
    "basePath": "C:/Projects/libraryCo/test/books/11"
  }
}
```

## Postman
Import the collection and environment from `postman/`:
- `postman/libraryco.postman_collection.json`
- `postman/libraryco.postman_environment.json`

Set `api_url` to your server and `content_base` to your local `test/books` path.
