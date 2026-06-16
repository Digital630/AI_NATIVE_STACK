import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
  })
}

function FallbackError() {
  return (
    <main style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 style={{ fontSize: 18, marginBottom: 8 }}>Something went wrong</h1>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
          The page hit an unexpected error. Please reload — if it keeps happening, contact support.
        </p>
        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', cursor: 'pointer' }}>
          Reload
        </button>
      </div>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<FallbackError />}>
      <App />
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
