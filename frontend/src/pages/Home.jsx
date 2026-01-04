import React, { useEffect, useState, useRef } from 'react';
import BookCard from '../components/BookCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function HorizontalShelf({ titleLine, heading, books }) {
  const scrollRef = useRef(null);

  const safeBooks = Array.isArray(books) ? books : [];
  const extendedBooks = safeBooks.length > 0 ? [...safeBooks, ...safeBooks, ...safeBooks] : [];

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || extendedBooks.length === 0) return;

    const singleWidth = el.scrollWidth / 3;
    el.scrollLeft = singleWidth;
  }, [extendedBooks.length]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || safeBooks.length === 0) return;

    const totalWidth = el.scrollWidth;
    const visibleWidth = el.clientWidth;
    const singleWidth = totalWidth / 3;
    const maxScroll = totalWidth - visibleWidth;
    const x = el.scrollLeft;
    const buffer = singleWidth * 0.25;

    if (x < buffer) {
      el.scrollLeft = x + singleWidth;
    } else if (x > maxScroll - buffer) {
      el.scrollLeft = x - singleWidth;
    }
  };

  const scrollByDirection = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.85;
    el.scrollBy({ left: direction * amount, behavior: 'smooth' });
  };

  if (safeBooks.length === 0) return null;

  return (
    <section className="home-shelf-wrapper">
      <div className="d-flex justify-content-between align-items-end mb-3">
        <div>
          <div className="home-shelf-title">{titleLine}</div>
          <h2 className="home-shelf-heading mb-0">{heading}</h2>
        </div>
      </div>
      <div className="shelf-scroll-region">
        <div
          ref={scrollRef}
          className="row flex-nowrap overflow-auto pb-3 books-strip-scroll"
          style={{ gap: '1.75rem' }}
          onScroll={handleScroll}
        >
          {extendedBooks.map((book, idx) => (
            <div
              key={`${book.gutenberg_id || book._id || idx}-${idx}`}
              className="col-4 col-sm-3 col-md-2 flex-shrink-0"
            >
              <BookCard book={book} compact />
            </div>
          ))}
        </div>
        <button
          type="button"
          className="shelf-arrow shelf-arrow--left"
          aria-label="Scroll shelf left"
          onClick={() => scrollByDirection(-1)}
        >
          <i className="bi bi-chevron-left"></i>
        </button>
        <button
          type="button"
          className="shelf-arrow shelf-arrow--right"
          aria-label="Scroll shelf right"
          onClick={() => scrollByDirection(1)}
        >
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </section>
  );
}

function Home({ searchTerm }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const params = new URLSearchParams();
        params.set('limit', '36');
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

  const rowOne = books.slice(0, 12);
  const rowTwo = books.slice(12, 24);
  const rowThree = books.slice(24, 36);

  return (
    <main className="flex-grow-1 home-root">
      {/* Hero Section */}
      <div className="container py-5 text-center text-light">
        <p className="mb-2 home-hero-overline">Our</p>
        <h1 className="fw-bold mb-2 home-hero-title">BOOKSTORE</h1>
        <p className="mb-0 home-hero-subtitle">
          {searchTerm
            ? `Showing books matching "${searchTerm}"`
            : 'Browse rotating shelves of public‑domain favorites.'}
        </p>
      </div>

      <div className="container pb-5">
        {loading && <p className="text-light">Loading books...</p>}
        {error && !loading && <p className="text-danger small">{error}</p>}

        <HorizontalShelf
          titleLine="Featured shelf"
          heading="Staff picks"
          books={rowOne}
        />

        <HorizontalShelf
          titleLine="Classics carousel"
          heading="Timeless reads"
          books={rowTwo}
        />

        <HorizontalShelf
          titleLine="More to explore"
          heading="Discover more titles"
          books={rowThree}
        />
      </div>
    </main>
  );
}

export default Home;
