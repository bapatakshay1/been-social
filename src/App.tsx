import { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userJson = localStorage.getItem('socialbeen_user');
    if (userJson) {
      setSessionUser(JSON.parse(userJson));
    }
    setLoading(false);
  }, []);

  if (loading) return null;

  if (!sessionUser) {
    return <Auth onLogin={(user) => {
      localStorage.setItem('socialbeen_user', JSON.stringify(user));
      setSessionUser(user);
    }} />
  }

  return <Dashboard user={sessionUser} onLogout={() => {
    localStorage.removeItem('socialbeen_user');
    setSessionUser(null);
  }} />;
}
