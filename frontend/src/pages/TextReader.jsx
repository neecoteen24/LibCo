import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function TextReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchText() {
      try {
        const res = await fetch(`${API_URL}/api/books/${id}/content/txt`);
        if (!res.ok) {
          throw new Error(`Failed to fetch text: ${res.status}`);
        }
        const text = await res.text();
        setContent(text);
      } catch (err) {
        console.error(err);
        setError('Could not load this book text.');
      } finally {
        setLoading(false);
      }
    }

    fetchText();
  }, [id]);

  return (
    <main className="flex-grow-1" style={{ backgroundColor: '#050608' }}>
      <div className="container-fluid py-3 border-bottom bg-dark text-light">
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate(-1)}
          >
            &larr; Back
          </button>
          <span className="small text-muted">TXT reading mode</span>
        </div>
      </div>

      <div className="container py-4">
        {loading && <p className="text-light">Loading text…</p>}
        {error && !loading && <p className="text-danger">{error}</p>}
        {!loading && !error && (
          <div
            className="p-4 bg-white shadow-sm rounded"
            style={{
              maxWidth: '48rem',
              margin: '0 auto',
              lineHeight: 1.7,
              fontSize: '1.08rem',
              whiteSpace: 'pre-wrap',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}
          >
            {content}
          </div>
        )}
      </div>
    </main>
  );
}

export default TextReader;
