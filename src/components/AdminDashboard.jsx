import { useState, useEffect, useCallback } from 'react';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminDashboard({ token, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401 || res.status === 403) {
        onLogout();
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch data.');
      setUsers(data.users);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const waitlistCount = users.filter((u) => u.on_waitlist).length;

  return (
    <div className="admin-wrapper">
      {/* Header */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <span className="auth-logo" style={{ marginBottom: 0 }}><span style={{ color: 'var(--color-accent)' }}>UP</span>SILON</span>
          <span className="admin-badge">Admin</span>
        </div>
        <div className="admin-topbar-right">
          {lastRefreshed && (
            <span className="last-refreshed">
              Last updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            id="btn-refresh"
            className="btn-outline"
            onClick={fetchData}
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: 'var(--color-text-secondary)' }} /> Refreshing…</>
            ) : (
              <>↻ Refresh</>
            )}
          </button>
          <button id="btn-admin-logout" className="btn-ghost" onClick={onLogout}>Sign out</button>
        </div>
      </div>

      <div className="admin-content">
        {/* Stats row */}
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Total accounts</span>
            <span className="stat-value">{users.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">On waitlist</span>
            <span className="stat-value">{waitlistCount}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Pending</span>
            <span className="stat-value">{users.length - waitlistCount}</span>
          </div>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>
        )}

        {/* Table */}
        <div className="table-card">
          <div className="table-header">
            <h2 className="table-title">All users</h2>
          </div>
          {users.length === 0 && !loading ? (
            <div className="table-empty">No users found.</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Company</th>
                    <th>URL</th>
                    <th>Signed up</th>
                    <th>Waitlist</th>
                    <th>Submitted at</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => (
                    <tr key={user.id}>
                      <td className="cell-id">{user.id}</td>
                      <td className="cell-name">{user.name}</td>
                      <td className="cell-email">{user.email}</td>
                      <td className="cell-email">{user.company_name || <span style={{color:'var(--color-text-muted)'}}>—</span>}</td>
                      <td className="cell-email">
                        {user.company_url
                          ? <a href={user.company_url} target="_blank" rel="noreferrer" style={{color:'var(--color-accent)',textDecoration:'none'}}>{user.company_url.replace(/^https?:\/\//, '')}</a>
                          : <span style={{color:'var(--color-text-muted)'}}>—</span>}
                      </td>
                      <td className="cell-date">{formatDate(user.created_at)}</td>
                      <td>
                        {user.on_waitlist ? (
                          <span className="badge badge-success">Joined</span>
                        ) : (
                          <span className="badge badge-muted">Not joined</span>
                        )}
                      </td>
                      <td className="cell-date">{formatDate(user.waitlist_submitted_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
