import { useState } from 'react';

const TABS = { LOGIN: 'login', SIGNUP: 'signup' };

export default function Auth({ onAuthSuccess }) {
  const [tab, setTab] = useState(TABS.LOGIN);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  // Signup form state
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '' });

  const handleTabChange = (newTab) => {
    setTab(newTab);
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed.');
      onAuthSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    if (signupData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Signup failed.');
      onAuthSuccess(data.token, data.user);
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
          <div className="auth-tabs">
            <button
              id="tab-login"
              className={`auth-tab ${tab === TABS.LOGIN ? 'active' : ''}`}
              onClick={() => handleTabChange(TABS.LOGIN)}
            >
              Log in
            </button>
            <button
              id="tab-signup"
              className={`auth-tab ${tab === TABS.SIGNUP ? 'active' : ''}`}
              onClick={() => handleTabChange(TABS.SIGNUP)}
            >
              Create account
            </button>
          </div>
          {tab === TABS.LOGIN ? (
            <>
              <h1 className="auth-title">Welcome back</h1>
              <p className="auth-subtitle">Sign in to access your waitlist spot.</p>
            </>
          ) : (
            <>
              <h1 className="auth-title">Create your account</h1>
              <p className="auth-subtitle">Join the Upsilon waitlist today.</p>
            </>
          )}
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}>{error}</div>}

        {tab === TABS.LOGIN ? (
          <form className="form" onSubmit={handleLogin}>
            <div className="form-field">
              <label className="form-label" htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                required
                autoComplete="current-password"
              />
            </div>
            <button id="btn-login" type="submit" className="btn-primary" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={handleSignup}>
            <div className="form-field">
              <label className="form-label" htmlFor="signup-name">Full name</label>
              <input
                id="signup-name"
                type="text"
                className="form-input"
                placeholder="John Doe"
                value={signupData.name}
                onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
                required
                autoComplete="name"
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-field">
              <label className="form-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="form-input"
                placeholder="Minimum 6 characters"
                value={signupData.password}
                onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                required
                autoComplete="new-password"
              />
            </div>
            <button id="btn-signup" type="submit" className="btn-primary" disabled={loading}>
              {loading && <span className="spinner" />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        )}
      </div>
      <p className="footer-note">Upsilon &copy; {new Date().getFullYear()}</p>
    </div>
  );
}
