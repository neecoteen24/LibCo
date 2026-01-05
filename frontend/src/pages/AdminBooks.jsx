import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function AdminBooks() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  const [gutenbergId, setGutenbergId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const [metaJson, setMetaJson] = useState('');
  const [creating, setCreating] = useState(false);
  const [createMessage, setCreateMessage] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!token || !user || user.role !== 'admin') return;

    const controller = new AbortController();

    async function loadBooks() {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams({ page: String(page), limit: String(limit) });
        const res = await fetch(`${API_URL}/api/admin/books?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error('Failed to load books');
        }
        const json = await res.json();
        setBooks(json.data || []);
        setTotal(json.total || 0);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Failed to load books');
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
    return () => controller.abort();
  }, [page, limit, token, user]);

  const handleDelete = async (book) => {
    if (!window.confirm(`Delete book ${book.data?.title || book.gutenberg_id}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/books/${book.gutenberg_id || book._id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error('Failed to delete book');
      }
      setBooks((prev) => prev.filter((b) => (b.gutenberg_id || b._id) !== (book.gutenberg_id || book._id)));
      setTotal((prev) => Math.max(0, prev - 1));
    } catch (err) {
      alert(err.message || 'Delete failed');
    }
  };

  const handleImportGutendex = async (e) => {
    e.preventDefault();
    const id = gutenbergId.trim();
    if (!id) return;

    setImporting(true);
    setImportMessage('');
    try {
      const res = await fetch(`${API_URL}/api/admin/import/gutendex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ gutenbergId: id }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Import failed');
      }
      setImportMessage(`Imported book ${json.book?.data?.title || id}`);
      setBooks((prev) => [json.book, ...prev]);
      setTotal((prev) => prev + 1);
      setGutenbergId('');
    } catch (err) {
      setImportMessage(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const handleMetaFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setMetaJson(text);
    } catch {
      alert('Failed to read file');
    }
  };

  const handleCreateManual = async (e) => {
    e.preventDefault();
    if (!metaJson.trim()) return;

    let payload;
    try {
      payload = JSON.parse(metaJson);
    } catch {
      setCreateMessage('Invalid JSON');
      return;
    }

    setCreating(true);
    setCreateMessage('');
    try {
      const res = await fetch(`${API_URL}/api/admin/books`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Create failed');
      }
      setCreateMessage(`Created book ${json.data?.data?.title || json.data?.gutenberg_id}`);
      setBooks((prev) => [json.data, ...prev]);
      setTotal((prev) => prev + 1);
      setMetaJson('');
    } catch (err) {
      setCreateMessage(err.message || 'Create failed');
    } finally {
      setCreating(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container py-4 text-light">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3">Admin · Books</h1>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="card bg-dark border-secondary h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Add via Gutenberg ID</h2>
              <p className="small text-muted mb-3">
                This will fetch metadata and content from Gutendex and Project Gutenberg,
                then store the book in your database and local filesystem.
              </p>
              <form onSubmit={handleImportGutendex} className="d-flex flex-column gap-2">
                <div>
                  <label className="form-label small">Gutenberg ID</label>
                  <input
                    type="number"
                    className="form-control form-control-sm bg-dark text-light border-secondary"
                    value={gutenbergId}
                    onChange={(e) => setGutenbergId(e.target.value)}
                    placeholder="e.g. 1342"
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary align-self-start"
                  disabled={importing || !gutenbergId.trim()}
                >
                  {importing ? 'Importing…' : 'Import from Gutendex'}
                </button>
                {importMessage && (
                  <div className="small mt-2">
                    {importMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card bg-dark border-secondary h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Add manually / via meta JSON</h2>
              <p className="small text-muted mb-2">
                Paste a JSON object matching your Book schema, or upload an existing
                meta file from your test/books_meta folder and adjust as needed.
              </p>
              <div className="mb-2">
                <input
                  type="file"
                  accept="application/json"
                  className="form-control form-control-sm bg-dark text-light border-secondary"
                  onChange={handleMetaFileChange}
                />
              </div>
              <form onSubmit={handleCreateManual} className="d-flex flex-column gap-2">
                <textarea
                  className="form-control form-control-sm bg-dark text-light border-secondary"
                  rows={6}
                  value={metaJson}
                  onChange={(e) => setMetaJson(e.target.value)}
                  placeholder="{\n  &quot;gutenberg_id&quot;: 1342,\n  &quot;data&quot;: { ... }\n}"
                />
                <button
                  type="submit"
                  className="btn btn-sm btn-success align-self-start"
                  disabled={creating || !metaJson.trim()}
                >
                  {creating ? 'Saving…' : 'Create book from JSON'}
                </button>
                {createMessage && (
                  <div className="small mt-2">
                    {createMessage}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-dark border-secondary">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">Books in database</h2>
            <div className="small text-muted">
              {total} total · page {page} of {totalPages}
            </div>
          </div>

          {error && <div className="alert alert-danger py-2 small">{error}</div>}
          {loading ? (
            <div className="text-muted small">Loading…</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-dark table-sm align-middle mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '90px' }}>Gutenberg ID</th>
                    <th>Title</th>
                    <th>Authors</th>
                    <th style={{ width: '80px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-muted small">
                        No books found.
                      </td>
                    </tr>
                  ) : (
                    books.map((book) => (
                      <tr key={book.gutenberg_id || book._id}>
                        <td className="small">{book.gutenberg_id || '—'}</td>
                        <td className="small">{book.data?.title || 'Untitled'}</td>
                        <td className="small">
                          {(book.data?.authors || [])
                            .map((a) => a.name)
                            .filter(Boolean)
                            .join(', ') || 'Unknown'}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(book)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center mt-3 small">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminBooks;
