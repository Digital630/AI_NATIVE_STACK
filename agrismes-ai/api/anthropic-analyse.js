// api/anthropic-analyse.js — AgriSMES Anthropic proxy + server-side free-tier gate
//
// Free-tier enforcement (emergency revenue-readiness fix): when the caller
// marks a request as `_meta.kind === 'analysis'` AND presents a valid
// Supabase session token (Authorization: Bearer <access_token>), this
// checks lenmac_entitlements / agrismes_subscriptions / user_plans for Pro
// status, and user_usage for the current month's run_count. Free users at
// >= FREE_LIMIT are blocked with 403 *before* the Anthropic API is called
// (saves cost too). On a successful gated call, run_count is incremented
// server-side via the service-role key — the client can no longer write
// user_usage directly (RLS no longer grants authenticated INSERT/UPDATE).
//
// Anonymous (no/invalid token) requests are NOT server-gated here; the
// existing client-side localStorage preview limit (ANON_LIMIT=1) continues
// to apply for unauthenticated preview, per product spec.

import { captureError } from './_observability.js';

const SB_URL = 'https://pttcugqwslvdstmrbyhu.supabase.co';
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SB_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const FREE_LIMIT = 5;

if (!SB_SERVICE_KEY) console.warn('AgriSMES SUPABASE_SERVICE_ROLE_KEY not set — usage limit cannot be enforced server-side');
if (!SB_ANON_KEY) console.warn('AgriSMES SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY not set — cannot verify user session for usage gate');

async function sb(method, table, params, body, key) {
  const url = SB_URL + '/rest/v1/' + table + (params ? '?' + params : '');
  const headers = {
    apikey: key,
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
  };
  if (method !== 'GET') headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
  try {
    const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const txt = await r.text();
    if (!r.ok) { console.error('AgriSMES usage-gate SB error:', method, table, r.status, txt.slice(0, 200)); return null; }
    return txt ? JSON.parse(txt) : null;
  } catch (e) { console.error('AgriSMES usage-gate SB exception:', e.message); return null; }
}

// Verify the Supabase session token server-side and return { id, email } or null.
async function getUser(token) {
  if (!token || !SB_ANON_KEY) return null;
  try {
    const r = await fetch(SB_URL + '/auth/v1/user', { headers: { Authorization: 'Bearer ' + token, apikey: SB_ANON_KEY } });
    if (!r.ok) return null;
    const u = await r.json();
    return u && u.id ? { id: u.id, email: (u.email || '').toLowerCase() } : null;
  } catch { return null; }
}

// Pro if ANY of: lenmac_entitlements (canonical, cross-product), the
// AgriSMES-specific agrismes_subscriptions, or the legacy user_plans table.
async function isProUser(email, userId) {
  if (!SB_SERVICE_KEY) return false;
  if (email) {
    const ent = await sb('GET', 'lenmac_entitlements', 'email=eq.' + encodeURIComponent(email) + '&product_key=eq.agrismes&entitlement_key=eq.agrismes_pro&status=eq.active&select=id', null, SB_SERVICE_KEY);
    if (ent && ent.length) return true;
    const sub = await sb('GET', 'agrismes_subscriptions', 'email=eq.' + encodeURIComponent(email) + '&status=eq.active&select=id', null, SB_SERVICE_KEY);
    if (sub && sub.length) return true;
  }
  if (userId) {
    const up = await sb('GET', 'user_plans', 'user_id=eq.' + userId + '&plan=eq.pro&select=plan_expires_at', null, SB_SERVICE_KEY);
    if (up && up.length) {
      const exp = up[0].plan_expires_at;
      if (!exp || new Date(exp) > new Date()) return true;
    }
  }
  return false;
}

async function getRunCount(userId, month) {
  const rows = await sb('GET', 'user_usage', 'user_id=eq.' + userId + '&month=eq.' + month + '&select=run_count', null, SB_SERVICE_KEY);
  return rows && rows.length ? (rows[0].run_count || 0) : 0;
}

async function incrementRunCount(userId, month, current) {
  await sb('POST', 'user_usage', 'on_conflict=user_id,month', { user_id: userId, month, run_count: current + 1 }, SB_SERVICE_KEY);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const meta = (req.body && req.body._meta) || {};
  let gate = null; // { userId, month, current } — set when we must increment usage after a successful call

  if (meta.kind === 'analysis') {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = await getUser(token);
    if (user) {
      const pro = await isProUser(user.email, user.id);
      if (!pro) {
        const month = new Date().toISOString().slice(0, 7);
        const used = await getRunCount(user.id, month);
        if (used >= FREE_LIMIT) {
          return res.status(403).json({ error: 'free_limit_reached', limit: FREE_LIMIT, used });
        }
        gate = { userId: user.id, month, current: used };
      }
    }
    // No/invalid token => anonymous; not server-gated here (client-side
    // localStorage preview limit applies instead).
  }

  // _meta is our own bookkeeping (usage gate, confidence-engine triggers)
  // and must NOT be forwarded to Anthropic — it rejects unknown top-level
  // fields with a 400 (invalid_request_error).
  const { _meta, ...anthropicBody } = req.body || {};

  const call = async () => fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(anthropicBody)
  });

  try {
    let response = await call();
    if (response.status === 429) {
      await new Promise(r => setTimeout(r, 1500));
      response = await call();
    }
    const data = await response.json();

    if (response.ok && gate) {
      incrementRunCount(gate.userId, gate.month, gate.current).catch(() => {});
    }

    // ── Trigger confidence engine after successful analysis ──────────────
    // Fire-and-forget — non-blocking, never affects the analysis response
    if (response.ok && data.content) {
      const { calculation_id, user_id, session_id, grade, origin_country, destination_country } = req.body._meta || {};
      if (calculation_id || grade) {
        fetch(
          'https://pttcugqwslvdstmrbyhu.supabase.co/functions/v1/atlas-confidence-engine',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ calculation_id, user_id, session_id, grade, origin_country, destination_country })
          }
        ).catch(() => null);

        // If user_id present — rebuild trade memory
        if (user_id) {
          fetch(
            'https://pttcugqwslvdstmrbyhu.supabase.co/functions/v1/atlas-trade-memory',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id, action: 'rebuild' })
            }
          ).catch(() => null);
        }
      }
    }

    res.status(response.status).json(data);
  } catch (err) {
    captureError(err, { handler: 'anthropic-analyse' });
    res.status(500).json({ error: err.message });
  }
}
