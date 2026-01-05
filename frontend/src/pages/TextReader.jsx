import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function TextReader() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [presetKey, setPresetKey] = useState('classic');
  const { token } = useAuth();

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

  // Fetch existing reading progress when logged in (best-effort, non-blocking)
  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    const loadProgress = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users/me/progress/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        const p = json.progress;
        if (!p) return;
        // Currently just log; can later use to restore scroll position, etc.
        console.debug('Loaded reading progress for book', id, p);
      } catch {
        // ignore
      }
    };

    loadProgress();
    return () => controller.abort();
  }, [id, token]);

  // Periodically save reading progress when logged in
  useEffect(() => {
    if (!token) return;
    if (!content) return;

    const saveProgress = async () => {
      try {
        await fetch(`${API_URL}/api/users/me/progress/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: 'in_progress',
            // Without a structured reader, we can approximate progress as 0 for now
            // This still records visits and genre stats.
            progressPercent: 0,
            filePath: 'book.txt',
          }),
        });
      } catch {
        // ignore transient errors
      }
    };

    const interval = window.setInterval(saveProgress, 30000);
    // Also save once when content first loads
    saveProgress();

    return () => window.clearInterval(interval);
  }, [id, token, content]);

  const presets = {
    classic: {
      label: 'Classic serif',
      fontFamily: '"Georgia", "Times New Roman", serif',
      backgroundColor: '#f4e7d0',
      textColor: '#3b2a1a',
    },
    typewriter: {
      label: 'Typewriter',
      fontFamily: '"Courier New", "Courier Prime", monospace',
      backgroundColor: '#f2e3c4',
      textColor: '#3a2b1a',
    },
    nightSepia: {
      label: 'Night sepia',
      fontFamily: '"Palatino Linotype", "Book Antiqua", serif',
      backgroundColor: '#23170f',
      textColor: '#f6ead4',
    },
  };

  const currentPreset = presets[presetKey] || presets.classic;

  return (
    <main
      className="flex-grow-1"
      style={{ background: 'radial-gradient(circle at top, #14151d 0, #050608 55%)' }}
    >
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
          <>
            <div
              className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-2"
              style={{ maxWidth: '48rem', margin: '0 auto' }}
            >
              <span className="small text-muted">Vintage reader</span>
              <div className="btn-group btn-group-sm" role="group" aria-label="Reader style">
                {Object.entries(presets).map(([key, preset]) => (
                  <button
                    key={key}
                    type="button"
                    className={
                      'btn ' +
                      (presetKey === key ? 'btn-warning' : 'btn-outline-secondary')
                    }
                    onClick={() => setPresetKey(key)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div
              className="p-4 shadow rounded"
              style={{
                maxWidth: '48rem',
                margin: '0 auto',
                lineHeight: 1.7,
                fontSize: '1.08rem',
                whiteSpace: 'pre-wrap',
                fontFamily: currentPreset.fontFamily,
                backgroundColor: currentPreset.backgroundColor,
                color: currentPreset.textColor,
                boxShadow:
                  '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.35)',
              }}
            >
              {content}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default TextReader;
