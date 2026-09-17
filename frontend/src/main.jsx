import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';

function App() {
  const [backendStatus, setBackendStatus] = useState('Checking backend health…');

  useEffect(() => {
    fetch(`${apiBaseUrl}/health`)
      .then((response) => {
        if (!response.ok) throw new Error('Health check failed');
        return response.json();
      })
      .then((data) => setBackendStatus(`Backend health: ${data.status}`))
      .catch(() => setBackendStatus('Backend health: unavailable'));
  }, []);

  return (
    <main>
      <p className="eyebrow">Developer testing platform</p>
      <h1>API Failure Lab</h1>
      <p>Frontend foundation is running.</p>
      <p className="api-url">Backend API: {apiBaseUrl}</p>
      <p>{backendStatus}</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
