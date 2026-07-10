import { useState, useEffect } from 'react';

// Deep-compare two form data objects to detect changes
function hasFormChanged(original, current) {
  if (!original) return false;
  return (
    original.name !== current.name ||
    original.email !== current.email ||
    original.companyName !== current.companyName ||
    original.mobileNo !== current.mobileNo ||
    original.joinedWaitlist !== current.joinedWaitlist
  );
}

export default function WaitlistForm({ user, token, onLogout }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    companyName: '',
    mobileNo: '',
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
            mobileNo: data.submission.mobile_no || '',
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
      <div className="auth-layout">
        
        {/* Left Side Content */}
        <div className="auth-content">
          <h2 className="auth-content-title">
            <span>Grow</span> with the<br />AKS Ecosystem
          </h2>
          <p className="auth-content-subtitle">
            Access exclusive tools, resources, and a community built to accelerate your product success.
          </p>

          <div className="auth-hero-logo">
            <svg width="120" height="80" viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg" style={{ margin: '0 auto', display: 'block' }}>
              <path d="M60 70 L60 40 M60 40 Q40 10 20 20 M60 40 Q80 10 100 20" stroke="var(--color-text-primary)" strokeWidth="3" fill="none" />
              <path d="M55 70 L55 45 Q40 20 20 30" stroke="var(--color-accent)" strokeWidth="3" fill="none" />
              <path d="M65 70 L65 45 Q80 20 100 30" stroke="var(--color-accent)" strokeWidth="3" fill="none" />
            </svg>
            <h3><span style={{ color: 'var(--color-accent)' }}>UP</span>SILON</h3>
          </div>

          <div className="auth-why">
            <h4>Why Upsilon?</h4>
            <p>Build faster with a modern ecosystem designed for founders, builders, and innovators.</p>
          </div>

          <div className="auth-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <div className="auth-feature-text">
                <h5>Smart Collaboration</h5>
                <p>Work seamlessly across teams.</p>
              </div>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">✓</span>
              <div className="auth-feature-text">
                <h5>Secure Platform</h5>
                <p>Enterprise-grade security and reliability.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="auth-form-container">
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
                      <label className="form-label" htmlFor="waitlist-mobile">Mobile number</label>
                      <input
                        id="waitlist-mobile"
                        type="tel"
                        name="mobileNo"
                        className="form-input"
                        placeholder="+91 98765 43210"
                        value={formData.mobileNo}
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
      </div>
    </div>
  );
}
