import { useState } from 'react';
import './App.css';
import Auth from './components/Auth';
import WaitlistForm from './components/WaitlistForm';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

const isAdminPath = window.location.pathname === '/admin';

export default function App() {
  // User auth state
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Admin auth state
  const [adminToken, setAdminToken] = useState(null);

  // ----- Admin area -----
  if (isAdminPath) {
    if (adminToken) {
      return (
        <AdminDashboard
          token={adminToken}
          onLogout={() => setAdminToken(null)}
        />
      );
    }
    return <AdminLogin onAdminAuth={(t) => setAdminToken(t)} />;
  }

  // ----- Main site -----
  if (token && user) {
    return (
      <WaitlistForm
        user={user}
        token={token}
        onLogout={() => { setToken(null); setUser(null); }}
      />
    );
  }

  return (
    <Auth onAuthSuccess={(t, u) => { setToken(t); setUser(u); }} />
  );
}
