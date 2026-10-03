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

const emptySimulation = { name: '', method: 'GET', path: '/', latencyMs: '0', failureRate: '0', failureStatusCode: '500', successResponse: '{\n  "success": true\n}', failureResponse: '{\n  "error": "Service unavailable"\n}' };

function Dashboard({ user, token, onLogout }) {
  const [simulations, setSimulations] = useState([]);
  const [form, setForm] = useState(emptySimulation);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');

  async function api(path = '', options = {}) {
    const response = await fetch(`${apiBaseUrl}/simulations${path}`, { ...options, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', ...options.headers } });
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.error || 'Simulation request failed.');
    return data;
  }

  async function loadSimulations() {
    try { setSimulations((await api()).simulations); } catch (requestError) { setError(requestError.message); }
  }

  useEffect(() => { loadSimulations(); }, []);

  function setField(event) { setForm({ ...form, [event.target.name]: event.target.value }); }
  function startEdit(simulation) {
    setEditingId(simulation._id);
    setForm({ ...simulation, latencyMs: String(simulation.latencyMs), failureRate: String(simulation.failureRate), failureStatusCode: String(simulation.failureStatusCode), successResponse: JSON.stringify(simulation.successResponse, null, 2), failureResponse: JSON.stringify(simulation.failureResponse, null, 2) });
    setError('');
  }
  function resetForm() { setEditingId(null); setForm(emptySimulation); setError(''); }

  async function submit(event) {
    event.preventDefault(); setError('');
    let payload;
    try { payload = { ...form, latencyMs: Number(form.latencyMs), failureRate: Number(form.failureRate), failureStatusCode: Number(form.failureStatusCode), successResponse: JSON.parse(form.successResponse), failureResponse: JSON.parse(form.failureResponse) }; }
    catch { setError('Success and failure responses must contain valid JSON objects.'); return; }
    try { await api(editingId ? `/${editingId}` : '', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) }); resetForm(); await loadSimulations(); }
    catch (requestError) { setError(requestError.message); }
  }

  async function remove(id) {
    try { await api(`/${id}`, { method: 'DELETE' }); await loadSimulations(); } catch (requestError) { setError(requestError.message); }
  }

  return <section className="dashboard">
    <header><div><p className="eyebrow">Authenticated</p><h1>Simulation definitions</h1><p>Signed in as {user?.name || user?.email}.</p></div><button onClick={onLogout}>Log out</button></header>
    <section className="card"><h2>{editingId ? 'Edit simulation' : 'Create simulation'}</h2><p className="muted">Saved definitions are callable simulated endpoints.</p>
      <form onSubmit={submit} className="simulation-form">
        <label>Name<input name="name" value={form.name} onChange={setField} required /></label><label>Method<select name="method" value={form.method} onChange={setField}>{['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((method) => <option key={method}>{method}</option>)}</select></label>
        <label>Path<input name="path" value={form.path} onChange={setField} required /></label><label>Latency (ms)<input name="latencyMs" type="number" min="0" value={form.latencyMs} onChange={setField} required /></label>
        <label>Failure rate (%)<input name="failureRate" type="number" min="0" max="100" value={form.failureRate} onChange={setField} required /></label><label>Failure status<input name="failureStatusCode" type="number" min="100" max="599" value={form.failureStatusCode} onChange={setField} required /></label>
        <label>Success response JSON<textarea name="successResponse" value={form.successResponse} onChange={setField} required /></label><label>Failure response JSON<textarea name="failureResponse" value={form.failureResponse} onChange={setField} required /></label>
        {error && <p className="error" role="alert">{error}</p>}<div className="actions"><button>{editingId ? 'Save changes' : 'Create simulation'}</button>{editingId && <button type="button" className="secondary" onClick={resetForm}>Cancel</button>}</div>
      </form>
    </section>
    <section className="simulation-list"><h2>Your simulations</h2>{simulations.length ? simulations.map((simulation) => <article key={simulation._id} className="simulation"><div><strong>{simulation.name}</strong><p>{simulation.method} {simulation.path} · {simulation.latencyMs}ms · {simulation.failureRate}% failures</p><code className="endpoint">{simulation.method} {apiBaseUrl}/sim/{simulation._id}{simulation.path}</code></div><div className="actions"><button className="secondary" onClick={() => startEdit(simulation)}>Edit</button><button className="danger" onClick={() => remove(simulation._id)}>Delete</button></div></article>) : <p className="muted">No simulations saved yet.</p>}</section>
  </section>;
}

function App() {
  const [path, setPath] = useState(window.location.pathname);
  const [session, setSession] = useState(getSession);
  useEffect(() => { const updatePath = () => setPath(window.location.pathname); window.addEventListener('popstate', updatePath); return () => window.removeEventListener('popstate', updatePath); }, []);
  function onAuthenticated({ token, user }) { localStorage.setItem(tokenKey, token); localStorage.setItem(userKey, JSON.stringify(user)); setSession({ token, user }); window.history.pushState({}, '', '/dashboard'); setPath('/dashboard'); }
  function logout() { localStorage.removeItem(tokenKey); localStorage.removeItem(userKey); setSession({ token: null, user: null }); window.history.pushState({}, '', '/login'); setPath('/login'); }
  if (path === '/register') return <AuthForm mode="register" onAuthenticated={onAuthenticated} />;
  if (path === '/dashboard') return session.token ? <Dashboard user={session.user} token={session.token} onLogout={logout} /> : <AuthForm mode="login" onAuthenticated={onAuthenticated} />;
  return <AuthForm mode="login" onAuthenticated={onAuthenticated} />;
}

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);
