import React from 'react';
import { Link } from 'react-router-dom';

function BookCard({ book, compact = false }) {
  const data = book.data || {};
  const formats = data.formats || {};
  const coverUrl = formats['image/jpeg'];

  const authors = (data.authors || [])
    .map((a) => a.name)
    .filter(Boolean)
    .join(', ');

  const id = book.gutenberg_id || book._id;

  const cardBg = compact ? '#111219' : '#181924';

  return (
    <Link to={id ? `/books/${id}` : '#'} className="text-decoration-none text-reset">
      <div
        className="card h-100 border-0 shadow-sm rounded-3 overflow-hidden"
        style={{ backgroundColor: cardBg }}
      >
        {coverUrl && (
          <img
            src={coverUrl}
            className="card-img-top"
            style={{ objectFit: 'cover', height: compact ? '220px' : '240px' }}
            alt={data.title || 'Book cover'}
            loading="lazy"
          />
        )}
        <div className="card-body d-flex flex-column p-3">
          <h6 className="card-title mb-1 text-truncate text-light">{data.title}</h6>
          <p className="card-subtitle mb-0 small text-muted text-truncate">
            {authors || 'Unknown author'}
          </p>
          {!compact && (
            <>
              <div className="flex-grow-1" />
              <span className="btn btn-outline-primary btn-sm mt-3 align-self-start">
                View details
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default BookCard;
