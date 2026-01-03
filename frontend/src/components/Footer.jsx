import React from 'react'

function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-dark text-light py-4 mt-auto">
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3">
        <small>© {year} LibraryCo · Demo Online Library</small>
        <div className="d-flex gap-3 fs-5">
          <a className="text-light" href="#" aria-label="LibraryCo on Twitter">
            <i className="bi bi-twitter"></i>
          </a>
          <a className="text-light" href="#" aria-label="LibraryCo on Instagram">
            <i className="bi bi-instagram"></i>
          </a>
          <a className="text-light" href="#" aria-label="LibraryCo on Github">
            <i className="bi bi-github"></i>
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
