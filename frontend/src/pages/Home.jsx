import React, { useEffect, useState } from 'react';
import BookCard from '../components/BookCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function Home({ searchTerm }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const params = new URLSearchParams();
        params.set('limit', '24');
        if (searchTerm) {
          params.set('q', searchTerm);
        } else {
          params.set('random', 'true');
        }

        const res = await fetch(`${API_URL}/api/books?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch books: ${res.status}`);
        }
        const json = await res.json();
        setBooks(json.data || []);
      } catch (err) {
        console.error(err);
        setError('Could not load books.');
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, [searchTerm]);

  return (
    <main className="flex-grow-1" style={{ background: 'radial-gradient(circle at top, #15161a 0, #050608 55%)' }}>
      {/* Hero Section */}
      <div className="container py-5 text-center text-light">
        <h1 className="display-5 fw-bold mb-2">Discover your next classic</h1>
        <p className="mb-0 text-muted">
          {searchTerm
            ? `Showing books matching "${searchTerm}"`
            : 'A rotating shelf of public‑domain favorites.'}
        </p>
      </div>

      {/* Strip of covers */}
      <div className="container pb-5">
        {loading && <p className="text-light">Loading books...</p>}
        {error && !loading && <p className="text-danger small">{error}</p>}

        <div className="row flex-nowrap overflow-auto pb-3 books-strip-scroll" style={{ gap: '1.75rem' }}>
          {books.map((book) => (
            <div
              key={book.gutenberg_id || book._id}
              className="col-4 col-sm-3 col-md-2 flex-shrink-0"
            >
              <BookCard book={book} compact />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Home;
