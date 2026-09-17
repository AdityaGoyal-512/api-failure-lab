import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return (
    <main>
      <p className="eyebrow">Developer testing platform</p>
      <h1>API Failure Lab</h1>
      <p>Frontend foundation is running.</p>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

