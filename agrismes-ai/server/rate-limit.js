/**
 * In-memory sliding-window rate limiter.
 *
 * IMPORTANT — serverless limitation:
 * On Vercel (and any serverless platform), each function instance has its own
 * memory. This store is NOT shared across concurrent instances or cold starts.
 * It provides first-line protection against a single client hammering a warm
 * instance, but is not a substitute for a persistent store (Upstash Redis,
 * Vercel KV) for production-grade distributed rate limiting.
 *
 * Upgrade path: replace `store` with a Redis/KV client and the logic below
 * stays identical — only the read/write calls change.
 */

// Map<key, number[]> — each entry is a list of request timestamps (ms)
const store = new Map();

// Evict stale keys every 10 minutes to prevent unbounded memory growth.
// On serverless this runs only while the instance is warm, which is fine.
const EVICT_INTERVAL_MS = 10 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of store.entries()) {
    // Keep the entry only if it has timestamps still within the last hour
    const recent = timestamps.filter(t => now - t < 60 * 60 * 1000);
    if (recent.length === 0) {
      store.delete(key);
    } else {
      store.set(key, recent);
    }
  }
}, EVICT_INTERVAL_MS).unref?.(); // .unref() so the timer doesn't block process exit

/**
 * Check and record a request against a rate limit.
 *
 * @param {string} key       - Unique bucket identifier (user_id, hashed IP, etc.)
 * @param {number} limit     - Maximum requests allowed within the window
 * @param {number} windowMs  - Rolling window duration in milliseconds
 * @returns {{ allowed: boolean, remaining: number, retryAfterMs: number }}
 */
export function checkRateLimit(key, limit, windowMs) {
  const now = Date.now();
  const windowStart = now - windowMs;

  const timestamps = (store.get(key) || []).filter(t => t > windowStart);

  if (timestamps.length >= limit) {
    // Oldest timestamp in the window tells us when a slot frees up
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(0, retryAfterMs) };
  }

  timestamps.push(now);
  store.set(key, timestamps);

  return { allowed: true, remaining: limit - timestamps.length, retryAfterMs: 0 };
}

/**
 * Extract a best-effort client IP from a Vercel/serverless request.
 * Never throws. Returns 'unknown' if nothing can be read.
 *
 * We hash the IP before using it as a key so raw client addresses are never
 * stored in process memory or logged.
 *
 * @param {import('http').IncomingMessage} req
 * @returns {string}
 */
export function getClientIp(req) {
  const raw =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown';

  // Simple non-cryptographic hash — good enough for bucketing, not for security
  let h = 0;
  for (let i = 0; i < raw.length; i++) {
    h = (Math.imul(31, h) + raw.charCodeAt(i)) | 0;
  }
  return `ip:${(h >>> 0).toString(36)}`;
}

/**
 * Send a standardised 429 response.
 *
 * @param {import('http').ServerResponse} res
 * @param {number} retryAfterMs
 * @param {string} scope  - Human label for the limit (e.g. "analysis", "email")
 */
export function replyTooManyRequests(res, retryAfterMs, scope) {
  const retryAfterSec = Math.ceil(retryAfterMs / 1000);
  res.setHeader('Retry-After', retryAfterSec);
  return res.status(429).json({
    error: 'Too many requests.',
    scope,
    retryAfter: retryAfterSec,
    retryAfterMs,
  });
}
