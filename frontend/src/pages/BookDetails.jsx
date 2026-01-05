import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function BookDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSynopsis, setShowSynopsis] = useState(false);

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`${API_URL}/api/books/${id}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch book: ${res.status}`);
        }
        const json = await res.json();
        setBook(json);
      } catch (err) {
        console.error(err);
        setError('Could not load this book.');
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [id]);

  if (loading) {
    return (
      <main className="flex-grow-1 container py-5">
        <p>Loading book...</p>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main className="flex-grow-1 container py-5">
        <p className="text-danger">{error || 'Book not found.'}</p>
        <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>
          Back
        </button>
      </main>
    );
  }

  const data = book.data || {};
  const formats = data.formats || {};
  const coverUrl = formats['image/jpeg'];
  const authors = (data.authors || [])
    .map((a) => a.name)
    .filter(Boolean)
    .join(', ');
  const subjects = data.subjects || [];
  const bookshelves = data.bookshelves || [];
  const summary = (data.summaries && data.summaries[0]) || 'No synopsis available.';
  const languages = data.languages || [];

  const languageNamesMap = {
    en: 'English',
    fr: 'French',
    de: 'German',
    es: 'Spanish',
    it: 'Italian',
    pt: 'Portuguese',
  };

  const languageLabel =
    languages.length > 0
      ? languages.map((code) => languageNamesMap[code] || code).join(', ')
      : 'N/A';

  const downloadLabel =
    typeof data.download_count === 'number'
      ? `${data.download_count.toLocaleString()} downloads`
      : 'N/A';

  const handleOpenReader = (type) => {
    if (type === 'txt') {
      navigate(`/books/${book.gutenberg_id}/read/txt`);
      return;
    }

    const base = `${API_URL}/api/books/${book.gutenberg_id}`;
    let url = base;
    if (type === 'epub') url = `${base}/content/epub`;
    else if (type === 'pdf') url = `${base}/content/pdf`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <main className="flex-grow-1 text-light">
      <div className="container py-5">
        <button
          className="btn btn-link mb-3 p-0 text-decoration-none text-secondary"
          onClick={() => navigate(-1)}
        >
          &larr; Back to results
        </button>

        <div className="row g-4 align-items-start">
          <div className="col-12 col-md-4">
            {coverUrl && (
              <img
                src={coverUrl}
                className="img-fluid rounded shadow-sm mb-3 mb-md-0"
                alt={data.title || 'Book cover'}
              />
            )}
          </div>
          <div className="col-12 col-md-8">
            <h1 className="display-6 fw-semibold mb-2">{data.title}</h1>
            <p className="mb-2" style={{ fontSize: '1.02rem', color: '#cfd2dc' }}>
              {authors || 'Unknown author'}
            </p>
            <p
              className="text-secondary text-uppercase mb-4"
              style={{ letterSpacing: '0.18em', fontSize: '0.8rem' }}
            >
              About this eBook
            </p>

            <div className="card glass-panel shadow-sm mb-4 border-0">
              <div className="card-body">
                <dl className="row mb-0" style={{ fontSize: '0.98rem' }}>
                  <dt className="col-sm-4 text-muted">Author</dt>
                  <dd className="col-sm-8 text-muted">{authors || 'Unknown author'}</dd>

                  <dt className="col-sm-4 text-muted">Title</dt>
                  <dd className="col-sm-8 text-muted">{data.title}</dd>

                  <dt className="col-sm-4 text-muted">Language</dt>
                  <dd className="col-sm-8 text-muted">{languageLabel}</dd>

                  <dt className="col-sm-4 text-muted">Category</dt>
                  <dd className="col-sm-8 text-muted">{data.media_type || 'Text'}</dd>

                  <dt className="col-sm-4 text-muted">EBook-No.</dt>
                  <dd className="col-sm-8 text-muted">{book.gutenberg_id}</dd>

                  <dt className="col-sm-4 text-muted">Downloads</dt>
                  <dd className="col-sm-8 text-muted">{downloadLabel}</dd>
                </dl>
              </div>
            </div>

            <div className="card glass-panel shadow-sm mb-4 border-0">
              <div className="card-header pb-1 border-0">
                <h2 className="h6 mb-1">Read or download for free</h2>
                <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                  Choose a reader to open this eBook.
                </p>
              </div>
              <div className="card-body pt-2">
                <div className="list-group">
                  <button
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => handleOpenReader('epub')}
                  >
                    <span>
                      <span className="fw-semibold">EPUB reader</span>
                      <span className="text-muted ms-2">Best for most e-readers</span>
                    </span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => handleOpenReader('txt')}
                  >
                    <span>
                      <span className="fw-semibold">Text reader</span>
                      <span className="text-muted ms-2">Plain text (TXT)</span>
                    </span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button
                    type="button"
                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                    onClick={() => handleOpenReader('pdf')}
                  >
                    <span>
                      <span className="fw-semibold">PDF reader</span>
                      <span className="text-muted ms-2">Print-friendly PDF</span>
                    </span>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>

            {subjects.length > 0 && (
              <div className="mb-3">
                <h2 className="h6">Subjects</h2>
                <ul className="mb-0" style={{ fontSize: '0.95rem' }}>
                  {subjects.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            )}

            {bookshelves.length > 0 && (
              <div className="mb-3">
                <h2 className="h6">Bookshelves</h2>
                <ul className="mb-0" style={{ fontSize: '0.95rem' }}>
                  {bookshelves.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="d-flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowSynopsis(true)}
              >
                Read Synopsis
              </button>
              <span className="small text-muted align-self-center">
                Project Gutenberg eBooks are always free.
              </span>
            </div>
          </div>
        </div>
      </div>

      {showSynopsis && (
        <>
          <div className="modal fade show d-block synopsis-modal" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Letter from the archives</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowSynopsis(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p
                    className="mb-0"
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {summary}
                  </p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSynopsis(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show synopsis-backdrop"></div>
        </>
      )}
    </main>
  );
}

export default BookDetails;
