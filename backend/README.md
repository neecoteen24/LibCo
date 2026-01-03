# LibraryCo Backend

## Prerequisites
- Node.js 18+
- MongoDB running locally or cloud URI in `.env`

## Environment
Create `backend/.env`:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/libraryco
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
