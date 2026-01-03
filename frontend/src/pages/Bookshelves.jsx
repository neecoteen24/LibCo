import React, { useEffect, useState } from 'react';
import BookCard from '../components/BookCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Bookshelves() {
  const [shelves, setShelves] = useState([]);
  const [selectedShelf, setSelectedShelf] = useState(null);
  const [books, setBooks] = useState([]);
  const [loadingShelves, setLoadingShelves] = useState(true);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchShelves() {
      try {
        const res = await fetch(`${API_URL}/api/books/bookshelves`);
        if (!res.ok) throw new Error(`Failed to fetch bookshelves: ${res.status}`);
        const json = await res.json();
        setShelves(json.data || []);
        if (json.data && json.data.length > 0) {
          setSelectedShelf(json.data[0].name);
        }
      } catch (err) {
        console.error(err);
        setError('Could not load bookshelves.');
      } finally {
        setLoadingShelves(false);
      }
    }

    fetchShelves();
  }, []);

  useEffect(() => {
    if (!selectedShelf) return;

    async function fetchBooks() {
      setLoadingBooks(true);
      setError(null);
      try {
        const params = new URLSearchParams({ genre: selectedShelf, limit: '48' });
        const res = await fetch(`${API_URL}/api/books?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed to fetch books: ${res.status}`);
        const json = await res.json();
        setBooks(json.data || []);
      } catch (err) {
        console.error(err);
        setError('Could not load books for this shelf.');
      } finally {
        setLoadingBooks(false);
      }
    }

    fetchBooks();
  }, [selectedShelf]);

  return (
    <main className="flex-grow-1" style={{ backgroundColor: '#050608' }}>
      <div className="container py-5 text-light">
        <h1 className="h3 fw-semibold mb-3">Bookshelves</h1>
        <p className="text-muted mb-4" style={{ maxWidth: '40rem' }}>
          Browse your collection by bookshelf category. Choose a shelf on the left to see
          the books it contains.
        </p>

        <div className="row g-4">
          <div className="col-12 col-md-3">
            <div className="list-group small">
              {loadingShelves && <div className="list-group-item bg-dark text-light">Loading shelves…</div>}
              {!loadingShelves && shelves.length === 0 && (
                <div className="list-group-item bg-dark text-light">No bookshelves found.</div>
              )}
              {!loadingShelves &&
                shelves.map((shelf) => (
                  <button
                    key={shelf.name}
                    type="button"
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                      selectedShelf === shelf.name ? 'active' : ''
                    }`}
                    onClick={() => setSelectedShelf(shelf.name)}
                    style={{ cursor: 'pointer' }}
                  >
                    <span>{shelf.name}</span>
                    <span className="badge bg-secondary rounded-pill">{shelf.count}</span>
                  </button>
                ))}
            </div>
          </div>

          <div className="col-12 col-md-9">
            {selectedShelf && (
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">{selectedShelf}</h2>
                <span className="small text-muted">{books.length} books in this shelf</span>
              </div>
            )}

            {loadingBooks && <p className="text-light">Loading books…</p>}
            {error && !loadingBooks && <p className="text-danger small">{error}</p>}

            {!loadingBooks && books.length > 0 && (
              <div
                className="row flex-nowrap overflow-auto pb-3 books-strip-scroll"
                style={{ gap: '1.75rem' }}
              >
                {books.map((book) => (
                  <div
                    key={book.gutenberg_id || book._id}
                    className="col-4 col-sm-3 col-md-2 flex-shrink-0"
                  >
                    <BookCard book={book} compact />
                  </div>
                ))}
              </div>
            )}

            {!loadingBooks && !error && books.length === 0 && selectedShelf && (
              <p className="text-muted">No books found for this shelf.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default Bookshelves;
