import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      const from = location.state?.from || '/';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-grow-1 d-flex align-items-center" style={{ backgroundColor: '#050608' }}>
      <div className="container" style={{ maxWidth: '420px' }}>
        <div className="card bg-dark text-light shadow-sm">
          <div className="card-body">
            <h1 className="h4 mb-3">Sign in</h1>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label small">Email</label>
                <input
                  id="email"
                  type="email"
                  className="form-control form-control-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label small">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control form-control-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn-warning w-100 btn-sm"
                disabled={submitting}
              >
                {submitting ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
            <p className="small mt-3 mb-0 text-muted">
              New here? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Login;
