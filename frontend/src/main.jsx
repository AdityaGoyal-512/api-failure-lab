import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
const tokenKey = 'api-failure-lab-token';
const userKey = 'api-failure-lab-user';

function getSession() {
  try { return { token: localStorage.getItem(tokenKey), user: JSON.parse(localStorage.getItem(userKey) || 'null') }; } catch { return { token: null, user: null }; }
}

function AuthForm({ mode, onAuthenticated }) {
  const isRegistration = mode === 'register';
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError(''); setIsSubmitting(true);
    const body = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch(`${apiBaseUrl}/auth/${isRegistration ? 'register' : 'login'}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Authentication failed.');
      if (isRegistration) { window.history.pushState({}, '', '/login'); window.dispatchEvent(new PopStateEvent('popstate')); } else onAuthenticated(data);
    } catch (requestError) { setError(requestError.message || 'Unable to reach the API.'); } finally { setIsSubmitting(false); }
  }

  return <section className="card">
    <p className="eyebrow">API Failure Lab</p><h1>{isRegistration ? 'Create account' : 'Welcome back'}</h1>
    <form onSubmit={submit}>
      {isRegistration && <label>Name<input name="name" required autoComplete="name" /></label>}
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label>Password<input name="password" type="password" minLength="8" required autoComplete={isRegistration ? 'new-password' : 'current-password'} /></label>
      {error && <p className="error" role="alert">{error}</p>}
      <button disabled={isSubmitting}>{isSubmitting ? 'Please wait…' : isRegistration ? 'Register' : 'Log in'}</button>
    </form>
    <p>{isRegistration ? 'Already have an account?' : 'Need an account?'} <a href={isRegistration ? '/login' : '/register'}>{isRegistration ? 'Log in' : 'Register'}</a></p>
  </section>;
}

function Dashboard({ user, onLogout }) {
  return <section className="card"><p className="eyebrow">Authenticated</p><h1>Dashboard</h1><p>Signed in as {user?.name || user?.email}.</p><button onClick={onLogout}>Log out</button></section>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState(getSession);
  useEffect(() => { const updatePath = () => setPath(window.location.pathname); window.addEventListener('popstate', updatePath); return () => window.removeEventListener('popstate', updatePath); }, []);
  function onAuthenticated({ token, user }) { localStorage.setItem(tokenKey, token); localStorage.setItem(userKey, JSON.stringify(user)); setSession({ token, user }); window.history.pushState({}, '', '/dashboard'); setPath('/dashboard'); }
  function logout() { localStorage.removeItem(tokenKey); localStorage.removeItem(userKey); setSession({ token: null, user: null }); window.history.pushState({}, '', '/login'); setPath('/login'); }
  if (path === '/register') return <AuthForm mode="register" onAuthenticated={onAuthenticated} />;
  if (path === '/dashboard') return session.token ? <Dashboard user={session.user} onLogout={logout} /> : <AuthForm mode="login" onAuthenticated={onAuthenticated} />;
  return <AuthForm mode="login" onAuthenticated={onAuthenticated} />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
