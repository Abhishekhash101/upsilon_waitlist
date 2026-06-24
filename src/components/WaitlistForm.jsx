import { useState, useEffect } from 'react';

// Deep-compare two form data objects to detect changes
function hasFormChanged(original, current) {
  if (!original) return false;
  return (
    original.name !== current.name ||
    original.email !== current.email ||
    original.companyName !== current.companyName ||
    original.companyUrl !== current.companyUrl ||
    original.joinedWaitlist !== current.joinedWaitlist
  );
}

export default function WaitlistForm({ user, token, onLogout }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    companyName: '',
    companyUrl: '',
    joinedWaitlist: false,
  });

  // The original saved data from the DB (null if first-time user)
  const [savedData, setSavedData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [updateMode, setUpdateMode] = useState(false); // true = user had previous submission

  // On mount: fetch existing submission (if any) and pre-fill the form
  useEffect(() => {
    const fetchExisting = async () => {
      try {
        const res = await fetch('/api/waitlist/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.submission) {
          const mapped = {
            name: data.submission.name || '',
            email: data.submission.email || '',
            companyName: data.submission.company_name || '',
            companyUrl: data.submission.company_url || '',
            joinedWaitlist: data.submission.joined_waitlist || false,
          };
          setFormData(mapped);
          setSavedData(mapped);
          setUpdateMode(true);
        }
      } catch {
        // If fetch fails, just start with empty/user defaults
      } finally {
        setLoadingData(false);
      }
    };
    fetchExisting();
  }, [token]);

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

    // If existing submission and data has changed → warn before overwriting
    if (updateMode && hasFormChanged(savedData, formData)) {
      const confirmed = window.confirm(
        'You are about to update your existing waitlist submission.\n\nAre you sure you want to overwrite your previous answers?'
      );
      if (!confirmed) return;
    }

    setLoading(true);
    try {
      const method = updateMode ? 'PUT' : 'POST';
      const res = await fetch('/api/waitlist', {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');

      // Update savedData to reflect the new saved state
      setSavedData({ ...formData });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isChanged = hasFormChanged(savedData, formData);

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
            <h2>{updateMode ? 'Submission updated' : "You're on the list"}</h2>
            <p>
              {updateMode
                ? 'Your waitlist details have been updated successfully.'
                : `Thank you, ${user.name}. Your spot on the Upsilon waitlist has been confirmed.`}{' '}
              We&apos;ll reach out to you at <strong>{formData.email}</strong> when we&apos;re ready.
            </p>
          </div>
        ) : (
          <>
            <div className="waitlist-header">
              <p className="waitlist-eyebrow">{updateMode ? 'Update submission' : 'Waitlist'}</p>
              <h1 className="waitlist-title">
                {updateMode ? 'Edit your details' : 'Reserve your spot'}
              </h1>
              <p className="waitlist-subtitle">
                {updateMode
                  ? 'Your previous answers are pre-filled. Edit any field and submit to update.'
                  : 'Confirm your details below to secure early access to Upsilon.'}
              </p>
            </div>

            {updateMode && (
              <div
                className="alert"
                style={{
                  marginBottom: '1.2rem',
                  background: 'rgba(37,99,235,0.06)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  color: 'var(--color-accent)',
                  fontSize: '0.85rem',
                }}
              >
                ✎ You have already submitted this form. Your previous answers are pre-filled below.
                {isChanged && ' — You have unsaved changes.'}
              </div>
            )}

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1.2rem' }}>
                {error}
              </div>
            )}

            {loadingData ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
                <span className="spinner" style={{ borderColor: 'rgba(0,0,0,0.1)', borderTopColor: 'var(--color-accent)' }} />
                Loading your details…
              </div>
            ) : (
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

                <div className="form-field">
                  <label className="form-label" htmlFor="waitlist-company">Company name</label>
                  <input
                    id="waitlist-company"
                    type="text"
                    name="companyName"
                    className="form-input"
                    placeholder="Acme Inc."
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label className="form-label" htmlFor="waitlist-company-url">Company URL</label>
                  <input
                    id="waitlist-company-url"
                    type="url"
                    name="companyUrl"
                    className="form-input"
                    placeholder="https://acme.com"
                    value={formData.companyUrl}
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

                <button
                  id="btn-submit-waitlist"
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading && <span className="spinner" />}
                  {loading
                    ? 'Submitting…'
                    : updateMode
                    ? isChanged
                      ? 'Update submission'
                      : 'No changes to save'
                    : 'Join waitlist'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
      <p className="footer-note">Upsilon &copy; {new Date().getFullYear()}</p>
    </div>
  );
}
