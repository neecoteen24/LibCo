import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function ReadingHistory() {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [error, setError] = useState(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user || !token) {
      navigate('/login', { replace: true, state: { from: '/history' } });
    }
  }, [user, token, loading, navigate]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    const load = async () => {
      setFetching(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/api/users/me/progress`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error('Failed to load reading history');
        }
        const json = await res.json();
        setEntries(Array.isArray(json.progress) ? json.progress : []);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Could not load reading history.');
      } finally {
        setFetching(false);
      }
    };

    load();
    return () => controller.abort();
  }, [token]);

  return (
    <main className="flex-grow-1" style={{ backgroundColor: '#050608' }}>
      <div className="container py-4 text-light">
        <h1 className="h4 mb-3">Your reading history</h1>
        <p className="small text-muted mb-4">
          Jump back into books you&apos;ve started or revisited recently.
        </p>

        {fetching && <p className="small">Loading history…</p>}
        {error && !fetching && (
          <p className="small text-danger">{error}</p>
        )}

        {!fetching && !error && entries.length === 0 && (
          <p className="small text-muted">
            No reading activity yet. Start reading any book to see it here.
          </p>
        )}

        {!fetching && entries.length > 0 && (
          <div className="list-group">
            {entries.map((entry) => {
              const book = entry.book || {};
              const pct = Math.round(entry.progressPercent || 0);
              const last = entry.lastVisitedAt
                ? new Date(entry.lastVisitedAt).toLocaleString()
                : null;

              return (
                <div
                  key={entry.gutenberg_id}
                  className="list-group-item list-group-item-action bg-dark text-light mb-2 border-secondary"
                >
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <div>
                      <div className="fw-semibold">
                        {book.title || `Book #${entry.gutenberg_id}`}
                      </div>
                      <div className="small text-muted">
                        {(book.authors || []).join(', ') || 'Unknown author'}
                      </div>
                    </div>
                    <span className="badge bg-secondary text-uppercase small">
                      {entry.status === 'completed'
                        ? 'Completed'
                        : entry.status === 'abandoned'
                        ? 'Paused'
                        : 'In progress'}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center small mb-2">
                    <div className="flex-grow-1 me-3">
                      <div className="progress" style={{ height: '4px' }}>
                        <div
                          className="progress-bar bg-warning"
                          role="progressbar"
                          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                          aria-valuenow={pct}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <span className="text-muted">Progress</span>
                        <span>{pct}%</span>
                      </div>
                    </div>
                    {last && (
                      <span className="text-muted small ms-2">
                        Last visited {last}
                      </span>
                    )}
                  </div>

                  <div className="d-flex flex-wrap gap-2 small mb-2">
                    {(book.genres || []).slice(0, 3).map((g) => (
                      <span key={g} className="badge bg-secondary-subtle border border-secondary text-secondary-emphasis">
                        {g}
                      </span>
                    ))}
                  </div>

                  <div className="d-flex flex-wrap gap-2 mt-2">
                    <Link
                      to={`/books/${entry.gutenberg_id}/read/txt`}
                      className="btn btn-warning btn-sm"
                    >
                      Resume reading
                    </Link>
                    <Link
                      to={`/books/${entry.gutenberg_id}`}
                      className="btn btn-outline-light btn-sm"
                    >
                      Open book page
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default ReadingHistory;
