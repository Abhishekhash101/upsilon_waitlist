import { useState } from 'react';

export default function AdminLogin({ onAdminAuth }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      onAdminAuth(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo"><span style={{ color: 'var(--color-accent)' }}>UP</span>SILON</span>
          <h1 className="auth-title">Admin access</h1>
          <p className="auth-subtitle">This area is restricted to administrators only.</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}>{error}</div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label className="form-label" htmlFor="admin-username">Username</label>
            <input
              id="admin-username"
              type="text"
              className="form-input"
              placeholder="admin"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              required
              autoComplete="username"
            />
          </div>
          <div className="form-field">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              placeholder="Enter admin password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              required
              autoComplete="current-password"
            />
          </div>
          <button id="btn-admin-login" type="submit" className="btn-primary" disabled={loading}>
            {loading && <span className="spinner" />}
            {loading ? 'Signing in...' : 'Access dashboard'}
          </button>
        </form>
      </div>
      <p className="footer-note">
        <a href="/" style={{ color: 'var(--color-text-muted)', textDecoration: 'none' }}>
          ← Back to main site
        </a>
      </p>
    </div>
  );
}
