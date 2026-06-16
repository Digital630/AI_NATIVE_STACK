// Shared server-side error capture for TradeDoc Vercel functions.
//
// Always logs a structured error to stdout (ingested by Vercel runtime logs).
// Additionally forwards to Sentry when SENTRY_DSN is configured. Initialisation
// is lazy and guarded so a missing DSN or SDK never breaks a request handler.

let sentryInitialised = false;
let SentryRef = null;

async function getSentry() {
  if (!process.env.SENTRY_DSN) return null;
  if (sentryInitialised) return SentryRef;
  try {
    const Sentry = await import('@sentry/node');
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.VERCEL_ENV || 'production',
      tracesSampleRate: 0.1,
    });
    SentryRef = Sentry;
    sentryInitialised = true;
    return Sentry;
  } catch (err) {
    console.error('[observability] Sentry init failed:', err?.message || err);
    return null;
  }
}

/**
 * Capture a server-side error. Safe to call without await in a catch block.
 * @param {unknown} error
 * @param {Record<string, unknown>} [context] route/handler metadata
 */
export async function captureError(error, context = {}) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({
    level: 'error',
    message,
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
    ts: new Date().toISOString(),
  }));

  const Sentry = await getSentry();
  if (Sentry) {
    Sentry.captureException(error, { extra: context });
  }
}
