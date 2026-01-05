import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Profile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate('/login', { replace: true, state: { from: '/profile' } });
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <main className="flex-grow-1 d-flex align-items-center" style={{ backgroundColor: '#050608' }}>
        <div className="container text-light small">Loading profile…</div>
      </main>
    );
  }

  const initial = (user.displayName || user.email || '?').trim()[0]?.toUpperCase() || '?';

  return (
    <main className="flex-grow-1" style={{ backgroundColor: '#050608' }}>
      <div className="container py-4 text-light" style={{ maxWidth: '640px' }}>
        <div className="d-flex align-items-center mb-4">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle me-3"
            style={{ width: 56, height: 56, background: 'linear-gradient(135deg, #ffb347, #ffcc33)', color: '#111', fontWeight: 700, fontSize: '1.4rem' }}
          >
            {initial}
          </div>
          <div>
            <h1 className="h4 mb-1">Your profile</h1>
            <div className="small text-muted">Manage your LibraryCo reading identity.</div>
          </div>
        </div>

        <div className="card bg-dark border-secondary mb-3">
          <div className="card-body">
            <h2 className="h6 text-muted text-uppercase mb-3">Account</h2>
            <dl className="row mb-0 small">
              <dt className="col-sm-3 text-muted">Name</dt>
              <dd className="col-sm-9">{user.displayName || 'Not set'}</dd>

              <dt className="col-sm-3 text-muted">Email</dt>
              <dd className="col-sm-9">{user.email}</dd>

              <dt className="col-sm-3 text-muted">Role</dt>
              <dd className="col-sm-9 text-capitalize">{user.role || 'user'}</dd>
            </dl>
          </div>
        </div>

        <p className="small text-muted mb-0">
          In the future, this page can show your favourite genres, personalized recommendations, and AI-powered reading stats.
        </p>
      </div>
    </main>
  );
}

export default Profile;
