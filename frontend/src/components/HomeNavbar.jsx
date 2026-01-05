import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function HomeNavbar({ onSearchSubmit, initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Keep local query in sync if parent changes
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  // Close profile dropdown on route change or outside click
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!profileRef.current) return;
      if (!profileRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    };

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  // Fetch lightweight suggestions as user types
  useEffect(() => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();

    const fetchSuggestions = async () => {
      try {
        const params = new URLSearchParams({ q: query, limit: '6' });
        const res = await fetch(`${API_URL}/api/books?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        setSuggestions(json.data || []);
      } catch {
        /* ignore */
      }
    };

    fetchSuggestions();
    return () => controller.abort();
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onSearchSubmit?.(trimmed);
    if (location.pathname !== '/') {
      navigate('/');
    }
    setSuggestions([]);
  };

  const handleSuggestionClick = (book) => {
    setSuggestions([]);
    setQuery(book.data?.title || '');
    navigate(`/books/${book.gutenberg_id || book._id}`);
  };
  return (
    <nav className="navbar navbar-expand-lg navbar-dark glass-bar sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-semibold" to="/">
          LibraryCo
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#homeNavbar"
          aria-controls="homeNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="homeNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                aria-current="page"
                to="/"
              >
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link
                className={`nav-link ${location.pathname === '/bookshelves' ? 'active' : ''}`}
                to="/bookshelves"
              >
                Bookshelves
              </Link>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#">
                About
              </a>
            </li>
          </ul>
          <div className="d-flex align-items-center ms-lg-3 mb-3 mb-lg-0 position-relative">
            {user ? (
              <>
                <div ref={profileRef} className="nav-profile-wrapper d-flex align-items-center position-relative">
                  <button
                    type="button"
                    className="nav-profile-toggle btn btn-sm d-flex align-items-center"
                    onClick={() => setProfileOpen((open) => !open)}
                  >
                    <span className="nav-profile-avatar me-2">
                      {(user.displayName || user.email || '?').trim()[0]?.toUpperCase() || '?'}
                    </span>
                    <span className="nav-profile-name text-truncate">
                      {user.displayName || user.email}
                    </span>
                    <i className={`bi ms-2 small ${profileOpen ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                  </button>
                  {profileOpen && (
                    <div className="nav-profile-menu">
                    <button
                      type="button"
                      className="nav-profile-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                    >
                      <i className="bi bi-person me-2"></i>
                      Your profile
                    </button>
                    <button
                      type="button"
                      className="nav-profile-item"
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/history');
                      }}
                    >
                      <i className="bi bi-clock-history me-2"></i>
                      History
                    </button>
                    <button
                      type="button"
                      className="nav-profile-item nav-profile-item--danger"
                      onClick={() => {
                        setProfileOpen(false);
                        logout();
                      }}
                    >
                      <i className="bi bi-box-arrow-right me-2"></i>
                      Sign out
                    </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm me-2">
                  Sign in
                </Link>
                <Link to="/register" className="btn btn-warning btn-sm">
                  Join free
                </Link>
              </>
            )}
          </div>
          <form className="d-flex ms-lg-3 mt-3 mt-lg-0 position-relative" role="search" onSubmit={handleSubmit}>
            <div className="flex-grow-1 position-relative">
              <input
                className="form-control me-2"
                type="search"
                placeholder="Search books"
                aria-label="Search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
              />
              {isFocused && suggestions.length > 0 && (
                <div className="position-absolute top-100 start-0 w-100 nav-suggestions shadow-sm rounded mt-1" style={{ zIndex: 1050 }}>
                  <ul className="list-group list-group-flush small mb-0">
                    {suggestions.map((book) => (
                      <button
                        type="button"
                        key={book.gutenberg_id || book._id}
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSuggestionClick(book)}
                      >
                        <span className="text-start">
                          <span className="d-block fw-semibold">
                            {book.data?.title}
                          </span>
                          <span className="d-block text-muted">
                            {(book.data?.authors || [])
                              .map((a) => a.name)
                              .filter(Boolean)
                              .join(', ') || 'Unknown author'}
                          </span>
                        </span>
                        <i className="bi bi-arrow-return-right text-muted"></i>
                      </button>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button className="btn btn-outline-light ms-2" type="submit">
              Search
            </button>
          </form>
        </div>
      </div>
    </nav>
  )
}

export default HomeNavbar
