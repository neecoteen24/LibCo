import React from 'react'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="text-light py-4 mt-auto glass-bar" style={{ borderTop: '1px solid rgba(148,163,184,0.25)' }}>
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <small>© {year} LibraryCo · Demo Online Library by LameAhh Students</small>
        <div className="d-flex gap-3 fs-5">
          <a className="text-light" href="#" aria-label="LibraryCo on Twitter">
            <i className="bi bi-twitter"></i>
          </a>
          <a className="text-light" href="https://www.instagram.com/unlikeneil/" aria-label="LibraryCo on Instagram" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-instagram"></i>
          </a>
          <a className="text-light" href="https://github.com/neecoteen24/LibCo" aria-label="LibraryCo on Github" target="_blank" rel="noopener noreferrer">
            <i className="bi bi-github"></i>
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
