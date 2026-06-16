import { getSupabaseAdmin, isActiveStatus, syncSubscriptionForUser } from '../server/subscription-utils.js';
import { checkRateLimit, replyTooManyRequests } from '../server/rate-limit.js';

// 120 subscription-status checks per authenticated user per 60-minute window.
// High limit intentionally — frontend may poll in the background. Paying users
// must not be accidentally blocked from seeing their subscription state.
const STATUS_LIMIT = 120;
const STATUS_WINDOW_MS = 60 * 60 * 1000;

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function portalUrl(email) {
  const configured = process.env.POLAR_CUSTOMER_PORTAL_URL || process.env.POLAR_PORTAL_URL;
  if (!configured) return null;

  try {
    const url = new URL(configured);
    if (email && !url.searchParams.has('email')) url.searchParams.set('email', email);
    return url.toString();
  } catch {
    return configured;
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Missing bearer token' });

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid session' });

    const user = data.user;

    // Rate limit after auth so the key is the verified user_id, never an IP
    const rl = checkRateLimit(`status:${user.id}`, STATUS_LIMIT, STATUS_WINDOW_MS);
    if (!rl.allowed) {
      return replyTooManyRequests(res, rl.retryAfterMs, 'subscription-status');
    }

    const subscription = await syncSubscriptionForUser(supabase, user.email, user.id);
    const status = subscription?.status || 'free';
    const plan = subscription?.plan || 'free';
    const isPro = isActiveStatus(status) && ['pro', 'enterprise'].includes(plan);

    return res.status(200).json({
      ok: true,
      isPro,
      plan: isPro ? plan : 'free',
      status,
      subscription,
      manageUrl: isPro ? portalUrl(user.email) : null,
      supportEmail: 'margin@agrismes.com',
    });
  } catch (error) {
    console.error('[subscription-status] Failed:', error);
    return res.status(500).json({ error: 'Unable to load subscription status' });
  }
}
