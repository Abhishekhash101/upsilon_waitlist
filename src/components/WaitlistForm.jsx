import { useState } from 'react';

export default function WaitlistForm({ user, token, onLogout }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    joinedWaitlist: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.joinedWaitlist) {
      setError('Please confirm that you want to join the waitlist.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="waitlist-card">
        {/* User session indicator */}
        <div className="user-pill">
          <span className="dot"></span>
          <span>{user.email}</span>
          <button id="btn-logout" className="logout-btn" onClick={onLogout} type="button">
            Sign out
          </button>
        </div>

        {submitted ? (
          <div className="success-state">
            <div className="success-icon">✓</div>
            <h2>You&apos;re on the list</h2>
            <p>
              Thank you, {user.name}. Your spot on the Upsilon waitlist has been confirmed. We&apos;ll
              reach out to you at <strong>{formData.email}</strong> when we&apos;re ready.
            </p>
          </div>
        ) : (
          <>
            <div className="waitlist-header">
              <p className="waitlist-eyebrow">Waitlist</p>
              <h1 className="waitlist-title">Reserve your spot</h1>
              <p className="waitlist-subtitle">
                Confirm your details below to secure early access to Upsilon.
              </p>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}>
                {error}
              </div>
            )}

            <form className="form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label" htmlFor="waitlist-name">Full name</label>
                <input
                  id="waitlist-name"
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="waitlist-email">Email address</label>
                <input
                  id="waitlist-email"
                  type="email"
                  name="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <label className="checkbox-field">
                <input
                  id="waitlist-checkbox"
                  type="checkbox"
                  name="joinedWaitlist"
                  checked={formData.joinedWaitlist}
                  onChange={handleChange}
                />
                <span className="checkbox-label">
                  I confirm I want to join the Upsilon waitlist and agree to be contacted when early
                  access becomes available.
                </span>
              </label>

              <button id="btn-submit-waitlist" type="submit" className="btn-primary" disabled={loading}>
                {loading && <span className="spinner" />}
                {loading ? 'Submitting...' : 'Join waitlist'}
              </button>
            </form>
          </>
        )}
      </div>
      <p className="footer-note">Upsilon &copy; {new Date().getFullYear()}</p>
    </div>
  );
}
