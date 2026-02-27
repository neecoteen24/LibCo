import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

import '../styles/TextReader.css';

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

        // Process the text into paragraphs by splitting on double newlines, while trimming whitespace
        // Removed hardcoded line breaks within paragraphs by replacing single newlines with spaces

        const paragraphs = text
        .replace(/\r\n/g, '\n')       // 1. Standardize line breaks
        .split(/\n\s*\n/)             // 2. Split into paragraphs (double newline)
        .map(p => p.replace(/\n/g, ' ')) // 3. NEW: Turn single newlines into spaces
        .map(p => p.trim())           // 4. Clean up whitespace
        .filter(p => p.length > 0);   // 5. Remove empty items

        setContent(paragraphs);
        
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
      // lively warm paper palette
      backgroundColor: '#7be28f',
      textColor: '#2b160b',
    },
    georgia: {
      label: 'Georgia',
      fontFamily: '"Georgia", "Times New Roman", serif',
      // match classic but distinct name
      backgroundColor: '#fff8ed',
      textColor: '#2b160b',
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
    paper: {
    label: 'Aged paper',
    fontFamily: '"Palatino Linotype", "Book Antiqua", serif',
    backgroundColor: '#fdfbf8', // Match your CSS base
    textColor: '#2b160b',
  },
  };

  const currentPreset = presets[presetKey] || presets.classic;

  return (

    

    <main
      className="flex-grow-1"
      style={{ background: 'radial-gradient(circle at top, #14151d 0, #050608 55%)' }}
    >

      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="paperNoise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="4"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.06" />
          </feComponentTransfer>
          <feGaussianBlur stdDeviation="0.4" />
        </filter>
      </svg>

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
              className={
                'p-4 shadow rounded ' +
                (presetKey === 'paper'
                  ? 'reader-paper'
                  : presetKey === 'georgia'
                  ? 'reader-georgia reader-serif-theme'
                  : presetKey === 'classic'
                  ? 'reader-serif reader-serif-theme'
                  : presetKey === 'typewriter'
                  ? 'reader-mono'
                  : presetKey === 'nightSepia'
                  ? 'reader-serif reader-nightsepia'
                  : 'reader-sans')
                }

              style={{
                maxWidth: '48rem',
                margin: '0 auto',
                lineHeight: 1.7,
                fontSize: '1.08rem',
                whiteSpace: 'pre-wrap',
                // let the CSS theme handle background/color for serif presets
                ...(presetKey === 'classic' || presetKey === 'georgia' || presetKey === 'paper'
                ? {}
                : {
                    backgroundColor: currentPreset.backgroundColor,
                    color: currentPreset.textColor,
                  }),
                boxShadow:
                  '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.35)',
              }}
            >
              {/* Replace {content} inside your reader div with this: */}
              {Array.isArray(content) ? (
                content.map((para, idx) => (
                  <p key={idx} id={`para-${idx}`} className="reader-paragraph">
                    {para}
                  </p>
                ))
              ) : (
                content
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default TextReader;
