import '@testing-library/jest-dom'

// Stub env vars so modules that throw on missing config don't crash tests
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_SUPABASE_URL: 'https://test.supabase.co',
    VITE_SUPABASE_ANON_KEY: 'test-anon-key',
    VITE_SENTRY_DSN: '',
    MODE: 'test',
    DEV: false,
    PROD: false,
  },
  writable: true,
})
