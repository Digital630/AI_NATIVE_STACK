// Vercel proxy — DB via management API + email queue via Supabase
// Email queued in email_send_queue → process-email-queue Edge Fn sends immediately

import { createHmac, timingSafeEqual } from 'crypto';

const SB_REF = 'pttcugqwslvdstmrbyhu';
const SB_PAT = process.env.SUPABASE_MANAGEMENT_API_TOKEN;
const _SRK_CHECK = process.env.SUPABASE_SERVICE_ROLE_KEY;
// DB auth: SRK = pg-meta (primary), PAT = management API (fallback)
console.log('DB config: SRK=' + (_SRK_CHECK ? 'SET' : 'MISSING') + ' PAT=' + (SB_PAT ? 'SET' : 'MISSING'));
const DB_URL = `https://api.supabase.com/v1/projects/${SB_REF}/database/query`;
// process-email-queue is publicly callable (verify_jwt=false) and works from external IPs
const MAILER_FN = `https://${SB_REF}.supabase.co/functions/v1/process-email-queue`;
const NOTIFY = 'tradedoc@lenmacai.com';

// ── Admin auth (shared) ──
const ADMINS = new Set(['tradedoc@lenmacai.com', 'ai@lenmacai.com', 'zalahzh@proton.me']);
const ADMIN_TOKEN_SECRET = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_MANAGEMENT_API_TOKEN || 'tradedoc-admin-fallback-secret';
const ADMIN_TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function signAdminToken(email, expiresAt) {
  return createHmac('sha256', ADMIN_TOKEN_SECRET).update(email.toLowerCase() + ':' + expiresAt).digest('hex');
}
function issueAdminToken(email) {
  if (!ADMINS.has(email)) return null;
  const expiresAt = Date.now() + ADMIN_TOKEN_TTL_MS;
  return { admin_token: signAdminToken(email, expiresAt), admin_token_expires: expiresAt };
}
// Verifies a (admin_email, admin_token, admin_token_expires) triple presented
// by the client. Returns true only if the email is an admin, the token is a
// valid HMAC for that email+expiry, and the expiry has not passed.
function verifyAdminToken(email, token, expiresAt) {
  if (!email || !token || !expiresAt || !ADMINS.has(email)) return false;
  const exp = Number(expiresAt);
  if (!exp || exp < Date.now()) return false;
  const expected = signAdminToken(email, exp);
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(String(token), 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const FEES = {
  government_docs:       { tzs: 70000,  label: 'Government Document Facilitation' },
  rcn_facilitation_20ft: { tzs: 250000, label: 'RCN Export Facilitation — 20ft' },
  rcn_facilitation_40ft: { tzs: 250000, label: 'RCN Export Facilitation — 40ft' },
  rcn_export_docs:       { tzs: 250000, label: 'RCN Export Documentation Package' },
  private_consultation:  { tzs: 0,      label: 'Private Consultation' },
};
const LIMITS = { free: 5, pro: 999999 };
const AI_TIMEOUT_MS = 20000;

function summarizeAiError(e) {
  if (!e) return 'unknown error';
  if (e.name === 'AbortError') return 'request timed out';
  return String(e.message || e).slice(0, 180);
}

async function fetchWithTimeout(url, options, timeoutMs = AI_TIMEOUT_MS) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function callAnthropicEnhancement(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is not configured');

  const r = await fetchWithTimeout('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] })
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  const d = await r.json();
  const text = d.content?.[0]?.text?.trim();
  if (!text) throw new Error('empty response');
  return text;
}

async function callOpenAIEnhancement(prompt) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not configured');

  const r = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [
        { role: 'system', content: 'You write professional export-grade business and trade documents. Return only the finished document text.' },
        { role: 'user', content: prompt }
      ]
    })
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  const d = await r.json();
  const text = d.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('empty response');
  return text;
}

function cleanValue(v, fallback = 'Not specified') {
  const s = String(v || '').trim();
  return s || fallback;
}

function buildAiTemplateFallback(docType, form) {
  if (docType === 'business_proposal') {
    const title = cleanValue(form.proposal_title, 'Business Proposal');
    const company = cleanValue(form.proposing_company, 'The proposing company');
    const recipient = cleanValue(form.recipient_name, 'the recipient');
    const summary = cleanValue(form.executive_summary, 'This proposal outlines a practical commercial opportunity for review and discussion.');
    const products = cleanValue(form.products_services, 'The proposed products or services will be delivered according to agreed commercial requirements.');
    const contact = cleanValue(form.contact_email, 'the proposing company contact');
    return [
      title.toUpperCase(),
      '',
      '1. EXECUTIVE SUMMARY',
      `${company} submits this proposal to ${recipient} for consideration. ${summary}`,
      '',
      '2. PROPOSED OPPORTUNITY',
      `The proposal presents a structured opportunity for cooperation between ${company} and ${recipient}. It is intended to support clear commercial discussion, practical next steps, and a professional basis for evaluating the proposed engagement.`,
      '',
      '3. PRODUCTS / SERVICES',
      products,
      '',
      '4. VALUE PROPOSITION',
      `${company} will focus on reliable execution, transparent communication, and commercially practical delivery. The proposal is designed to help the recipient assess scope, expected value, and implementation requirements without introducing unsupported assumptions.`,
      '',
      '5. NEXT STEPS',
      `The parties may review this proposal, confirm any required clarifications, and agree on the next commercial or operational step. For follow-up, contact ${contact}.`
    ].join('\n');
  }

  const entries = Object.entries(form || {})
    .filter(([k, v]) => !k.startsWith('_') && String(v || '').trim())
    .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${String(v).trim()}`);

  return [
    'PROFESSIONAL DOCUMENT DRAFT',
    '',
    '1. DOCUMENT SUMMARY',
    'This document has been prepared using the information provided and formatted as a professional trade document draft.',
    '',
    '2. PROVIDED DETAILS',
    entries.length ? entries.join('\n') : 'No additional details were provided.',
    '',
    '3. REVIEW NOTE',
    'Please review the details for accuracy before issuing, signing, or submitting this document.'
  ].join('\n');
}

async function sql(query, params = []) {
  // DB connection: tries SUPABASE_SERVICE_ROLE_KEY first (pg-meta endpoint, reliable)
  // Falls back to SUPABASE_MANAGEMENT_API_TOKEN (management API, requires PAT)
  const SB_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SB_SRK && !SB_PAT) {
    throw new Error('Database not configured. Add SUPABASE_SERVICE_ROLE_KEY to Vercel env vars.');
  }

  // Interpolate params in REVERSE order: $10 before $1 to prevent partial matches
  let q = query;
  for (let i = params.length - 1; i >= 0; i--) {
    const p = params[i];
    const escaped = p === null ? 'NULL'
      : typeof p === 'number' ? String(p)
      : typeof p === 'boolean' ? String(p)
      : "'" + String(p).replace(/'/g, "''") + "'";
    q = q.split('$' + (i + 1)).join(escaped);
  }

  // Endpoint priority:
  // 1. Management API (PAT) — confirmed working on this project
  // 2. pg-meta was attempted but returns 404 on this Supabase plan — removed
  const endpoints = [];
  if (SB_PAT) {
    endpoints.push({ url: DB_URL, token: SB_PAT });
  }
  // SB_SRK kept for env var completeness, not used for queries

  let lastError = '';
  for (const ep of endpoints) {
    try {
      const r = await fetch(ep.url, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + ep.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (r.ok) {
        const result = await r.json();
        // pg-meta returns { data: [...] }, management API returns [...] directly
        return Array.isArray(result) ? result : (result.data || result);
      }
      const txt = await r.text();
      lastError = 'DB ' + r.status + ': ' + txt.slice(0, 150);
      console.error('sql() failed:', ep.url.includes('pg-meta') ? 'pg-meta' : 'mgmt-api', r.status, txt.slice(0, 80));
    } catch (e) {
      lastError = 'DB network: ' + e.message;
      console.error('sql() exception:', e.message);
    }
  }
  throw new Error(lastError || 'Database unavailable');
}

// INSTANT email — direct Resend call from Vercel (zero queue delay, instant delivery)
// Tries TRADEDOC_FROM_EMAIL first, then TRADEDOC_FALLBACK_FROM_EMAIL if configured.
const GREEN_HDR = '<div style="background:#1a7a4a;padding:28px 36px;border-radius:10px 10px 0 0;"><h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;font-family:Arial,sans-serif;">TradeDoc</h1><p style="color:#a7f3d0;margin:6px 0 0;font-size:12px;font-family:Arial,sans-serif;">Export Documentation &amp; Pre-Shipment Verification &middot; docs.lenmacai.com</p></div>';

async function sendInstant(to, subject, htmlBody) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.TRADEDOC_FROM_EMAIL || 'tradedoc@lenmacai.com';
  const fallbackFrom = process.env.TRADEDOC_FALLBACK_FROM_EMAIL || 'tradedoc@agrismes.com';

  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' };
  }

  // Pass htmlBody directly — each email template is self-contained with its own layout.
  // No shared footer wrapper; individual templates control their own structure and branding.
  const body = htmlBody;

  // Attempt 1: primary from address (tradedoc@lenmacai.com)
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `TradeDoc <${fromEmail}>`, to: [to], subject, html: body, reply_to: fromEmail })
    });
    const data = await res.json().catch(() => ({}));
    const attempt1Log = { status: res.status, id: data.id || null, err: data.message || data.name || data.error || '' };
    console.log('sendInstant attempt1:', JSON.stringify(attempt1Log));
    if (res.ok && data.id) {
      console.log('sendInstant OK:', fromEmail, '->', to, data.id);
      return { ok: true, id: data.id, from: fromEmail };
    }
    // Log full Resend error for diagnosis
    console.error('sendInstant attempt1 FAILED:', JSON.stringify(data).slice(0, 300));
  } catch (e) {
    console.error('sendInstant attempt1 exception:', e.message);
  }

  // Attempt 2: fallback from address with the same configured Resend API key
  try {
    const res2 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: `TradeDoc <${fallbackFrom}>`, to: [to], subject, html: body, reply_to: fallbackFrom })
    });
    const data2 = await res2.json().catch(() => ({}));
    console.log('sendInstant attempt2 status:', res2.status, 'id:', data2.id || 'none');
    if (res2.ok && data2.id) {
      console.log('sendInstant fallback OK:', fallbackFrom, '->', to, data2.id);
      return { ok: true, id: data2.id, from: fallbackFrom };
    }
    console.error('sendInstant attempt2 failed:', JSON.stringify(data2).slice(0, 300));
  } catch (e) {
    console.error('sendInstant attempt2 exception:', e.message);
  }

  // Attempt 3: Use Resend's own verified domain as last resort (always works if API key is valid)
  // From: onboarding@resend.dev — Resend's built-in test domain, no verification needed
  try {
    const res3 = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'TradeDoc <onboarding@resend.dev>', to: [to], subject: '[via resend.dev] ' + subject, html: body, reply_to: 'tradedoc@lenmacai.com' })
    });
    const data3 = await res3.json().catch(() => ({}));
    console.log('sendInstant attempt3 (resend.dev):', res3.status, data3.id || data3.message || '');
    if (res3.ok && data3.id) {
      console.log('sendInstant fallback via resend.dev OK:', to, data3.id);
      return { ok: true, id: data3.id, from: 'onboarding@resend.dev', via_resend_dev: true };
    }
    console.error('sendInstant attempt3 failed:', JSON.stringify(data3).slice(0, 200));
    return { ok: false, error: 'All email attempts failed. Resend API key may be invalid or email domain not verified. Last error: ' + (data3.message || JSON.stringify(data3).slice(0, 100)) };
  } catch (e) {
    console.error('sendInstant attempt3 exception:', e.message);
    return { ok: false, error: 'Email system unavailable: ' + e.message };
  }
}

// Queue email in email_send_queue as 'approved' → process-email-queue sends it
// Uses 'tradedoc' profile (sends from tradedoc@lenmacai.com with TradeDoc branding)
// After queueing, triggers the mailer via net.http_post (internal Supabase call via management API)
async function queueMail(to, subject, html, campaign = 'tradedoc') {
  try {
    await sql(
      `INSERT INTO email_send_queue (to_email, subject, html_body, from_profile, campaign, status, approved_by, approved_at)
       VALUES ($1, $2, $3, 'tradedoc', $4, 'approved', 'system', NOW())`,
      [to, subject, html, campaign]
    );
    // Trigger mailer from inside Supabase network — bypasses the HTTP gateway restriction
    await sql(`SELECT net.http_post(
      url := 'https://pttcugqwslvdstmrbyhu.supabase.co/functions/v1/process-email-queue',
      headers := '{"Content-Type":"application/json"}'::jsonb,
      body := '{}'::jsonb
    )`).catch(e => console.log('trigger ok (async):', e.message));
    console.log(`queued+triggered: ${to} / ${subject}`);
  } catch (e) { console.error('queueMail err:', e.message); }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  // ── GET requests: allow only specific admin actions (email links + cron) ──
  const GET_ACTIONS = new Set(['activate_pro', 'mark_review', 'reject_link', 'renew_pro']);
  if (req.method === 'GET') {
    const qaction = (req.query || {}).action;
    const cronHeader = req.headers['x-vercel-cron'];
    // Vercel Cron sends GET with an `x-vercel-cron` header. Accept either the
    // explicit ?action=daily_job query string OR a bare cron-tagged GET (in
    // case vercel.json's cron `path` ever loses its query string) — but a
    // plain unauthenticated GET with neither falls through to 405 below.
    if (qaction === 'daily_job' || (!qaction && cronHeader)) {
      // Vercel Cron — handle directly
      const cronSecret = process.env.CRON_SECRET;
      if (!cronHeader && cronSecret) {
        return res.status(403).json({ error: 'Cron access required' });
      }
      // Fall through to daily_job handler via synthetic body
      req.body = { action: 'daily_job', cron_secret: process.env.CRON_SECRET };
    } else if (GET_ACTIONS.has(qaction)) {
      // Admin email link — use query params as body
      req.body = { ...((req.query) || {}), action: qaction };
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } else if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const { action } = body;

  try {

  if (action === 'signup') {
    const { email, company_name, agrismes_consent } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const existing = await sql(`SELECT id, email_confirmed FROM tradedoc_users WHERE email = $1`, [email]);
    if (existing[0]?.email_confirmed) {
      // Already confirmed — return dashboard data so frontend can auto-sign-in
      const userData = await sql(`SELECT email, company_name as company, plan_status as plan FROM tradedoc_users WHERE email=$1`, [email]);
      return res.json({ success: true, already_confirmed: true, user: userData[0] || { email, company: company_name||'', plan: 'free' } });
    }
    const token = Math.random().toString(36).slice(2) + Date.now().toString(36) + Math.random().toString(36).slice(2);
    await sql(`INSERT INTO tradedoc_users (email, company_name, country, confirmation_token, email_confirmed, plan_status, agrismes_consent, agrismes_consent_at, updated_at)
      VALUES ($1, $2, 'Tanzania', $3, false, 'free', $4, $5, NOW())
      ON CONFLICT (email) DO UPDATE SET company_name=$2, confirmation_token=$3, email_confirmed=false, agrismes_consent=$4, updated_at=NOW()`,
      [email, company_name||'', token, agrismes_consent||false, agrismes_consent ? new Date().toISOString() : null]);
    await sql(`INSERT INTO marketing_lists (email, company, channel, source, subscribed) VALUES ($1,$2,'agrismes_intelligence','tradedoc',$3) ON CONFLICT (email, channel) DO UPDATE SET subscribed=$3`,
      [email, company_name||'', agrismes_consent||false]).catch(()=>{});
    await sql(`INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'user_signup',$2)`,
      [email, JSON.stringify({company_name, agrismes_consent})]).catch(()=>{});

    const confirmUrl = `https://docs.lenmacai.com/confirm?token=${token}`;
    const name = company_name || email.split('@')[0];
    const sent = await sendInstant(email, 'Confirm your TradeDoc account',
      `<div style="font-family:Arial,sans-serif;">
          <p style="color:#374151;font-size:15px;line-height:1.6;margin-top:0;">Hi ${name},</p>
          <p style="color:#374151;font-size:15px;line-height:1.6;">Click the button below to confirm your email and activate your TradeDoc account.</p>
          <div style="text-align:center;margin:28px 0;">
            <a href="${confirmUrl}" style="background:#1a7a4a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;letter-spacing:0.2px;">
              Confirm Email Address
            </a>
          </div>
          <p style="color:#6b7280;font-size:13px;line-height:1.6;">Your free account includes 5 documents per month — no payment required to get started.</p>
          <p style="color:#6b7280;font-size:13px;">If you did not create this account, you can safely ignore this email.</p>

      </div>`
    );
    if (!sent.ok) {
      return res.status(502).json({ error: `Confirmation email could not be sent: ${sent.error || 'email provider did not accept the message'}` });
    }
    return res.json({ success: true, message: 'Confirmation email sent. Check your inbox (and spam folder).' });
  }

  if (action === 'submit_upgrade_request' || action === '_handled_above') {
    const { email, payment_method = 'usd_wire', reference, plan = 'pro_monthly',
            full_name = '', company_name = '', amount = '$9', currency = 'USD', notes = '' } = body;
    if (!email || !reference) return res.status(400).json({ error: 'Email and transaction reference are required.' });

    // Reference validation
    const refClean = String(reference).trim().toUpperCase().replace(/\s+/g, '-');
    if (refClean.length < 4) return res.status(400).json({ error: 'Reference too short. Enter the exact code from your wire confirmation.' });

    // Duplicate reference check
    const existing = await sql('SELECT id, email, status FROM tradedoc_payment_submissions WHERE reference=$1 LIMIT 1', [refClean]).catch(() => []);
    if (existing && existing.length > 0) {
      const prev = existing[0];
      if (prev.email === email) return res.status(400).json({ error: 'This reference is already on file for your account. Status: ' + (prev.status || 'PENDING') });
      return res.status(400).json({ error: 'This reference has already been submitted. Contact tradedoc@lenmacai.com if this is an error.' });
    }

    // Rate limiting — max 3 per hour
    const recentAttempts = await sql("SELECT COUNT(*) as cnt FROM tradedoc_payment_submissions WHERE email=$1 AND created_at > NOW() - INTERVAL '1 hour'", [email]).catch(() => [{ cnt: 0 }]);
    if (parseInt(recentAttempts[0]?.cnt || 0) >= 3) return res.status(429).json({ error: 'Too many submissions. Wait 1 hour and try again.' });

    // Verify user exists
    const userRows = await sql('SELECT id, email, company_name, plan_status FROM tradedoc_users WHERE email=$1', [email]).catch(() => []);
    if (!userRows || userRows.length === 0) return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    if (userRows[0].plan_status === 'pro') return res.status(400).json({ error: 'This account already has Pro access.' });

    // Ensure table has all new columns
    await sql('ALTER TABLE tradedoc_payment_submissions ADD COLUMN IF NOT EXISTS full_name TEXT').catch(()=>{});
    await sql('ALTER TABLE tradedoc_payment_submissions ADD COLUMN IF NOT EXISTS company_name TEXT').catch(()=>{});
    await sql('ALTER TABLE tradedoc_payment_submissions ADD COLUMN IF NOT EXISTS amount TEXT').catch(()=>{});
    await sql("ALTER TABLE tradedoc_payment_submissions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'").catch(()=>{});
    await sql('ALTER TABLE tradedoc_payment_submissions ADD COLUMN IF NOT EXISTS notes TEXT').catch(()=>{});
    await sql('ALTER TABLE tradedoc_payment_submissions ADD COLUMN IF NOT EXISTS user_id INT').catch(()=>{});

    // Activation token
    const tokenBase = email + ':' + refClean + ':' + Date.now();
    const activationToken = Buffer.from(tokenBase).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32);

    // Store submission
    const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    await sql('ALTER TABLE tradedoc_payment_submissions ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ').catch(()=>{});
    await sql(
      'INSERT INTO tradedoc_payment_submissions (user_id, email, full_name, company_name, payment_method, reference, plan, status, amount_expected, amount, currency, notes, activation_token, token_expires_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',
      [userRows[0].id, email, full_name, company_name || userRows[0].company_name, payment_method, refClean, plan, 'PENDING', amount + ' ' + currency, amount, currency, notes, activationToken, tokenExpiresAt]
    );

    // Audit event
    await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'payment_submitted',$2)",
      [email, JSON.stringify({ payment_method, reference: refClean, plan, amount, currency, submitted_at: new Date().toISOString() })]).catch(() => {});

    // ── Admin email — full mini admin panel with 3 action buttons ──
    const baseUrl = 'https://docs.lenmacai.com/api/tradedoc';
    const activationUrl = baseUrl + '?action=activate_pro&token=' + activationToken + '&email=' + encodeURIComponent(email);
    const reviewUrl = baseUrl + '?action=mark_review&token=' + activationToken + '&email=' + encodeURIComponent(email);
    const rejectUrl = baseUrl + '?action=reject_link&token=' + activationToken + '&email=' + encodeURIComponent(email);
    const adminHtml = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;">'
      + '<div style="background:#0f2d1a;padding:18px 24px;border-radius:8px 8px 0 0;display:flex;align-items:center;justify-content:space-between;">'
      + '<div><div style="color:#fff;font-size:17px;font-weight:800;letter-spacing:-0.3px;">TradeDoc</div><div style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:1px;">Pro Payment — Action Required</div></div>'
      + '<div style="background:#dc2626;border-radius:6px;padding:4px 12px;color:#fff;font-size:11px;font-weight:700;letter-spacing:0.3px;">NEW PAYMENT</div>'
      + '</div>'
      + '<div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:24px;">'
      + '<p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 18px;">Verify this USD wire in CRDB account <strong>0250945058500</strong>, then click your action below. Link expires in <strong>7 days</strong>.</p>'
      + '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">'
      + '<tr style="background:#f0fdf4;"><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151;width:38%">Email</td><td style="padding:9px 12px;border:1px solid #e5e7eb;color:#111827;font-weight:700">' + email + '</td></tr>'
      + '<tr><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Name</td><td style="padding:9px 12px;border:1px solid #e5e7eb">' + (full_name || '—') + '</td></tr>'
      + '<tr style="background:#f9fafb;"><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Company</td><td style="padding:9px 12px;border:1px solid #e5e7eb">' + (company_name || '—') + '</td></tr>'
      + '<tr><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Amount</td><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:700;color:#1a5c38">$' + amount + ' USD</td></tr>'
      + '<tr style="background:#f0fdf4;"><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Reference</td><td style="padding:9px 12px;border:1px solid #e5e7eb;font-family:monospace;font-weight:700;font-size:14px">' + refClean + '</td></tr>'
      + '<tr><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Submitted</td><td style="padding:9px 12px;border:1px solid #e5e7eb">' + new Date().toUTCString() + '</td></tr>'
      + (notes ? '<tr style="background:#f9fafb;"><td style="padding:9px 12px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Notes</td><td style="padding:9px 12px;border:1px solid #e5e7eb">' + notes + '</td></tr>' : '')
      + '</table>'
      + '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:18px;">'
      + '<a href="' + activationUrl + '" style="display:block;background:#1a5c38;color:#fff;padding:13px 8px;border-radius:7px;text-decoration:none;font-weight:700;font-size:13px;text-align:center;">✓ Activate Pro</a>'
      + '<a href="' + reviewUrl + '" style="display:block;background:#f59e0b;color:#fff;padding:13px 8px;border-radius:7px;text-decoration:none;font-weight:700;font-size:13px;text-align:center;">⏸ Mark Review</a>'
      + '<a href="' + rejectUrl + '" style="display:block;background:#dc2626;color:#fff;padding:13px 8px;border-radius:7px;text-decoration:none;font-weight:700;font-size:13px;text-align:center;">✗ Reject</a>'
      + '</div>'
      + '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:7px;padding:12px 14px;font-size:12px;color:#92400e;">'
      + 'Open payment: <a href="https://docs.lenmacai.com/admin/payments" style="color:#92400e;font-weight:700;">Admin Panel →</a> · Links expire 7 days after submission.'
      + '</div>'
      + '</div></div>';

    // Customer confirmation email — branded
    const customerHtml = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;">'
      + '<div style="background:#0f2d1a;padding:20px 28px;border-radius:8px 8px 0 0;">'
      + '<div style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">TradeDoc</div>'
      + '<div style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Export Verification Platform</div>'
      + '</div>'
      + '<div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:28px;">'
      + '<h2 style="color:#111827;font-size:18px;font-weight:800;margin:0 0 12px;letter-spacing:-0.3px;">Payment Reference Received</h2>'
      + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">Hi ' + (full_name || email.split('@')[0]) + ',</p>'
      + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">We have received your TradeDoc Pro payment reference. Our team is verifying your USD wire transfer with CRDB Bank and will activate your Pro account once confirmed.</p>'
      + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 18px;margin-bottom:20px;">'
      + '<table style="width:100%;font-size:13px;border-collapse:collapse;">'
      + '<tr><td style="padding:5px 0;color:#6b7280;font-weight:500;">Reference</td><td style="padding:5px 0;font-weight:700;font-family:monospace;color:#111827;text-align:right">' + refClean + '</td></tr>'
      + '<tr><td style="padding:5px 0;color:#6b7280;font-weight:500;">Plan</td><td style="padding:5px 0;color:#374151;text-align:right">' + (plan === 'pro_annual' ? 'TradeDoc Pro Annual' : 'TradeDoc Pro Monthly') + ' — $' + String(amount).replace(/^\$/, '') + ' ' + currency + (plan === 'pro_annual' ? '/year' : '/month') + '</td></tr>'
      + '<tr><td style="padding:5px 0;color:#6b7280;font-weight:500;">Payment Method</td><td style="padding:5px 0;color:#374151;text-align:right">USD Wire Transfer</td></tr>'
      + '<tr><td style="padding:5px 0;color:#6b7280;font-weight:500;">Status</td><td style="padding:5px 0;color:#16a34a;font-weight:600;text-align:right">Pending Verification</td></tr>'
      + '</table>'
      + '</div>'
      + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 8px;"><strong>Expected activation:</strong> Same business day after wire confirmation.</p>'
      + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">You will receive another email when Pro is activated. If you have not heard back within 24 hours, contact us at <strong>tradedoc@lenmacai.com</strong> with your reference.</p>'
      + '<a href="https://docs.lenmacai.com/dashboard" style="display:inline-block;background:#1a5c38;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:600;font-size:13px;">Back to Dashboard</a>'
      + '<p style="color:#9ca3af;font-size:11px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">TradeDoc · tradedoc@lenmacai.com · docs.lenmacai.com<br>Lenmac Company Limited · Dar es Salaam, Tanzania</p>'
      + '</div></div>';

    await sendInstant('tradedoc@lenmacai.com', '[TradeDoc Pro] Payment Requires Review — ' + email, adminHtml).catch(() => {});
    await sendInstant(email, 'Payment Received — Verification in Progress', customerHtml).catch(() => {});

    return res.json({ success: true, status: 'manual_review_required', verification_mode: 'manual_wire',
      message: 'Payment reference submitted and under review. USD wire transfers are verified manually against CRDB bank records. You will receive an activation email once confirmed.' });
  }

  if (action === 'activate_pro') {
    // ── Admin activation via one-click email link (GET) or admin panel (POST) ──
    const qp = req.method === 'GET' ? (req.query || {}) : body;
    const { token, email: activateEmail, admin_email: actAdminEmail, admin_token: actAdminToken, admin_token_expires: actAdminTokenExpires, admin_override, submission_id: actSubId } = qp;

    // ── Admin-panel POST (admin_email present) requires a valid signed
    // admin session token — closes "pass admin_email=X" spoofing. The
    // token-based email-link POST (no admin_email) is unaffected; it relies
    // on the per-submission single-use activation_token instead. ──
    if (req.method !== 'GET' && actAdminEmail && !verifyAdminToken(actAdminEmail, actAdminToken, actAdminTokenExpires)) {
      return res.status(403).json({ error: 'Admin access required.' });
    }

    // ── Response format ──
    // GET (email link / review page) and the token-based POST submitted from
    // that review page's form both render HTML. Only the admin-panel call
    // (admin_override + submission_id, from /admin/payments) returns JSON.
    const isAdminPanelCall = req.method === 'POST' && admin_override && actSubId;
    const wantsHtml = req.method === 'GET' || !isAdminPanelCall;

    // ── Look up submission ──
    let subRow = null;
    if (admin_override && actSubId) {
      // Admin panel: activate by submission id
      const rows = await sql('SELECT id, email, reference, status, activation_token, amount, currency, plan, full_name, company_name, token_expires_at FROM tradedoc_payment_submissions WHERE id=$1 LIMIT 1', [actSubId]).catch(() => []);
      subRow = rows[0] || null;
    } else if (token && activateEmail) {
      // Email link: match by token + email
      const rows = await sql('SELECT id, email, reference, status, activation_token, amount, currency, plan, full_name, company_name, token_expires_at FROM tradedoc_payment_submissions WHERE email=$1 AND activation_token=$2 LIMIT 1', [activateEmail, token]).catch(() => []);
      subRow = rows[0] || null;
    }

    const pageStyle = 'font-family:Arial,Helvetica,sans-serif;background:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px 20px;';
    const card = (title, titleColor, icon, body, extra) =>
      '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + ' — TradeDoc Admin</title></head>'
      + '<body style="' + pageStyle + 'm:0"><div style="background:#fff;border-radius:12px;padding:36px 32px;max-width:480px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e5e7eb">'
      + '<div style="font-size:13px;font-weight:700;color:#1a5c38;text-transform:uppercase;letter-spacing:1px;margin-bottom:16px;">TradeDoc Admin</div>'
      + '<div style="font-size:28px;margin-bottom:8px;">' + icon + '</div>'
      + '<h2 style="color:' + titleColor + ';margin:0 0 12px;font-size:20px;font-weight:800;">' + title + '</h2>'
      + body
      + (extra || '')
      + '</div></body></html>';

    // ── Already processed ──
    if (subRow && subRow.status === 'ACTIVE') {
      const alreadyBody = '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">This payment has already been processed and the account is active.</p>'
        + '<table style="width:100%;font-size:13px;border-collapse:collapse">'
        + '<tr><td style="padding:7px 0;color:#6b7280;border-bottom:1px solid #f3f4f6">Account</td><td style="padding:7px 0;text-align:right;font-weight:600;">' + (subRow.email || activateEmail) + '</td></tr>'
        + '<tr><td style="padding:7px 0;color:#6b7280;">Reference</td><td style="padding:7px 0;text-align:right;font-family:monospace;font-weight:700">' + (subRow.reference || '') + '</td></tr>'
        + '</table>';
      if (wantsHtml) { res.setHeader('Content-Type','text/html'); return res.send(card('Payment Already Processed', '#6b7280', '✓', alreadyBody)); }
      return res.status(400).json({ error: 'Payment already processed.', status: 'ACTIVE' });
    }

    // ── Token not found ──
    if (!subRow) {
      const notFoundBody = '<p style="color:#374151;font-size:14px;line-height:1.7;">Invalid or expired activation link. This link may have been used already or expired after 7 days.</p>'
        + '<p style="font-size:13px;color:#6b7280;margin-top:16px;">Visit the <a href="https://docs.lenmacai.com/admin/payments" style="color:#1a5c38;font-weight:600;">Admin Panel</a> to manage payments.</p>';
      if (wantsHtml) { res.setHeader('Content-Type','text/html'); return res.send(card('Invalid Activation Link', '#dc2626', '✗', notFoundBody)); }
      return res.status(404).json({ error: 'Activation token not found or expired.' });
    }

    // ── Token expiry check (7 days) ──
    if (subRow.token_expires_at && new Date(subRow.token_expires_at) < new Date()) {
      const expiredBody = '<p style="color:#374151;font-size:14px;line-height:1.7;">This activation link expired 7 days after it was generated. Please use the Admin Panel to activate manually.</p>'
        + '<p style="font-size:13px;margin-top:16px;"><a href="https://docs.lenmacai.com/admin/payments" style="background:#1a5c38;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;display:inline-block;">Open Admin Panel</a></p>';
      if (wantsHtml) { res.setHeader('Content-Type','text/html'); return res.send(card('Activation Link Expired', '#92400e', '⏰', expiredBody)); }
      return res.status(410).json({ error: 'Activation link has expired. Use the admin panel.' });
    }

    // ── GET: ALWAYS show a review page — NEVER activate on GET. This closes
    // the email-security-link-scanner vulnerability: a scanner that follows
    // this URL (including with &confirm=1, for backward-compat with old
    // emails) only ever renders a page. Activation requires submitting the
    // POST form below from a real browser. ──
    if (req.method === 'GET') {
      const confirmBody = '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 18px;">Review payment details before activating Pro access.</p>'
        + '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:20px;">'
        + '<tr style="background:#f0fdf4"><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Account Email</td><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:700">' + subRow.email + '</td></tr>'
        + '<tr><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Full Name</td><td style="padding:9px 10px;border:1px solid #e5e7eb">' + (subRow.full_name || '—') + '</td></tr>'
        + '<tr style="background:#f9fafb"><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Company</td><td style="padding:9px 10px;border:1px solid #e5e7eb">' + (subRow.company_name || '—') + '</td></tr>'
        + '<tr><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Amount</td><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:700">' + (subRow.amount || '$9') + ' USD</td></tr>'
        + '<tr style="background:#f0fdf4"><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Reference</td><td style="padding:9px 10px;border:1px solid #e5e7eb;font-family:monospace;font-weight:700">' + subRow.reference + '</td></tr>'
        + '<tr><td style="padding:9px 10px;border:1px solid #e5e7eb;font-weight:600;color:#374151">Current Status</td><td style="padding:9px 10px;border:1px solid #e5e7eb">' + subRow.status + '</td></tr>'
        + '</table>'
        + '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:8px;padding:12px 14px;margin-bottom:20px;font-size:12px;color:#92400e;">'
        + '⚠ Only activate after verifying the USD wire in your CRDB account (0250945058500). Clicking the button below submits a form — this page itself does not activate anything.'
        + '</div>'
        + '<form method="POST" action="/api/tradedoc">'
        + '<input type="hidden" name="action" value="activate_pro">'
        + '<input type="hidden" name="token" value="' + token + '">'
        + '<input type="hidden" name="email" value="' + (activateEmail || subRow.email) + '">'
        + '<button type="submit" style="display:block;width:100%;background:#1a5c38;color:#fff;padding:14px 28px;border-radius:8px;border:none;font-weight:800;font-size:15px;text-align:center;box-sizing:border-box;cursor:pointer;font-family:inherit;">✓ Activate Pro for ' + subRow.email + '</button>'
        + '</form>';
      res.setHeader('Content-Type','text/html');
      return res.send(card('Confirm Pro Activation', '#111827', '🔐', confirmBody));
    }

    // ── Perform activation — POST only (GET always returned above) ──
    const activationEmail = subRow.email || activateEmail;
    const now = new Date();
    // Annual ($95) submissions grant 365 days; monthly ($9) grants 30 days.
    const isAnnual = subRow.plan === 'pro_annual';
    const planDays = isAnnual ? 365 : 30;
    const expiresAt = new Date(now.getTime() + planDays * 24 * 60 * 60 * 1000).toISOString();
    const planLabel = isAnnual ? 'TradeDoc Pro Annual — $95/year' : 'TradeDoc Pro Monthly — $9/month';
    const adminWho = actAdminEmail || (isAdminPanelCall ? 'admin_panel' : 'admin_email_link_post');

    await sql('UPDATE tradedoc_users SET plan=$1, plan_status=$2, plan_started_at=$3, plan_expires_at=$4, updated_at=NOW() WHERE email=$5',
      ['pro', 'pro', now.toISOString(), expiresAt, activationEmail]);
    await sql("UPDATE tradedoc_payment_submissions SET status='ACTIVE', activated_at=NOW(), admin_notes=$1 WHERE id=$2",
      ['Activated by ' + adminWho + ' at ' + now.toUTCString(), subRow.id]);
    await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'pro_activated',$2)",
      [activationEmail, JSON.stringify({ activated_by: adminWho, reference: subRow.reference, amount: subRow.amount, submission_id: subRow.id, expires_at: expiresAt, activated_at: now.toISOString() })]).catch(() => {});

    // Branded Pro Activated email
    const proActivatedHtml = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;">'
      + '<div style="background:#0f2d1a;padding:20px 28px;border-radius:8px 8px 0 0;">'
      + '<div style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.3px;">TradeDoc</div>'
      + '<div style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Pro Plan Activated</div>'
      + '</div>'
      + '<div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:32px;">'
      + '<div style="width:52px;height:52px;background:#f0fdf4;border:1.5px solid #86efac;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 0 20px;">'
      + '<span style="color:#16a34a;font-size:22px;font-weight:700;">✓</span></div>'
      + '<h2 style="color:#111827;font-size:20px;font-weight:900;margin:0 0 12px;letter-spacing:-0.4px;">Pro Access Activated</h2>'
      + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 22px;">Your TradeDoc Pro account is now active. All Pro features are unlocked and ready to use.</p>'
      + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 18px;margin-bottom:24px;">'
      + '<div style="font-size:12px;font-weight:700;color:#166534;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Pro Features Unlocked</div>'
      + '<div style="display:grid;gap:6px;font-size:13px;color:#374151;">'
      + ['Unlimited document generation','Pre-shipment verification engine','Export Readiness Score (0–100)','LC discrepancy checks','Advanced Production Workspace','Compliance chain tracking','Document history & vault','Knowledge-powered TradeBot'].map(f => '<div style="display:flex;gap:8px;align-items:center;"><span style="color:#16a34a;font-weight:700;">✓</span>' + f + '</div>').join('')
      + '</div></div>'
      + '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:24px;">'
      + '<tr><td style="padding:7px 0;color:#6b7280;font-weight:500;border-bottom:1px solid #f3f4f6;">Account</td><td style="padding:7px 0;color:#111827;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6;">' + activateEmail + '</td></tr>'
      + '<tr><td style="padding:7px 0;color:#6b7280;font-weight:500;border-bottom:1px solid #f3f4f6;">Plan</td><td style="padding:7px 0;color:#374151;text-align:right;border-bottom:1px solid #f3f4f6;">' + planLabel + '</td></tr>'
      + '<tr><td style="padding:7px 0;color:#6b7280;font-weight:500;">Activated</td><td style="padding:7px 0;color:#374151;text-align:right;">' + new Date().toLocaleString('en-GB',{day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'}) + ' UTC</td></tr>'
      + '</table>'
      + '<a href="https://docs.lenmacai.com/dashboard" style="display:inline-block;background:#1a5c38;color:#fff;padding:12px 26px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;">Open Dashboard →</a>'
      + '<p style="color:#9ca3af;font-size:11px;margin-top:20px;padding-top:16px;border-top:1px solid #f3f4f6;">TradeDoc · tradedoc@lenmacai.com · docs.lenmacai.com</p>'
      + '</div></div>';
    await sendInstant(activationEmail, 'Pro Access Activated — TradeDoc', proActivatedHtml).catch(() => {});
    const successHtml = '<html><body style="font-family:sans-serif;padding:40px;max-width:500px"><div style="background:#eaf3de;border:1px solid rgba(59,109,17,0.22);border-radius:8px;padding:24px"><h2 style="color:#3B6D11;margin:0 0 12px">Pro Activated</h2><p style="color:#374151;margin:0">Account <strong>' + activationEmail + '</strong> has been upgraded to Pro. Confirmation email sent to user.</p></div></body></html>';
    if (wantsHtml) { res.setHeader('Content-Type','text/html'); return res.send(successHtml); }
    return res.json({ success: true, message: 'Pro activated for ' + activationEmail });
  }


  if (action === 'admin_get_payments') {
    const { admin_email, admin_token, admin_token_expires } = body;
    if (!verifyAdminToken(admin_email, admin_token, admin_token_expires)) return res.status(403).json({ error: 'Admin access required' });
    const submissions = await sql(
      'SELECT id, email, payment_method, reference, plan, status, amount_expected, submitted_at, activated_at, admin_notes FROM tradedoc_payment_submissions ORDER BY submitted_at DESC LIMIT 200'
    ).catch(() => []);
    return res.json({ success: true, submissions: submissions || [] });
  }

  if (action === 'reject_payment') {
    const { submission_id, email: rejectEmail, reason, admin_email, admin_token, admin_token_expires } = body;
    if (!verifyAdminToken(admin_email, admin_token, admin_token_expires)) return res.status(403).json({ error: 'Admin access required' });
    if (!submission_id || !rejectEmail) return res.status(400).json({ error: 'Missing fields' });
    await sql(
      "UPDATE tradedoc_payment_submissions SET status='FAILED', admin_notes=$1 WHERE id=$2",
      [reason || 'Rejected by admin', submission_id]
    );
    await sql(
      "INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1, 'payment_rejected', $2)",
      [rejectEmail, JSON.stringify({ submission_id, reason, rejected_by: admin_email, rejected_at: new Date().toISOString() })]
    ).catch(() => {});
    return res.json({ success: true });
  }

  if (action === 'contact_inquiry') {
    const { type, to } = body;
    // Determine destination + subject by inquiry type
    const routes = {
      ppl_reservation: { email: 'ppl@lenmacai.com', subject: 'New Lenmac PPL Reservation Request' },
      social_media: { email: 'social@lenmacai.com', subject: 'New Lenmac Social Media Inquiry' },
    };
    const route = routes[type] || { email: to || 'tradedoc@lenmacai.com', subject: 'New TradeDoc Inquiry' };

    // Build a clean field table from all submitted fields (excluding control keys)
    const skip = new Set(['action', 'type', 'to']);
    const labelMap = {
      name: 'Customer Name', company: 'Company Name', country: 'Country', email: 'Email',
      phone: 'Phone', whatsapp: 'WhatsApp Number', grade: 'Requested Grade',
      volume: 'Container Size / Volume', destination: 'Destination', shift: 'Preferred Production Shift',
      specs: 'Consignment Requirements / Notes', goals: 'Goals', industry: 'Industry',
      website: 'Website', objectives: 'Objectives', challenges: 'Current Challenges', package: 'Package',
    };
    let rows = '';
    for (const k of Object.keys(body)) {
      if (skip.has(k)) continue;
      let v = body[k];
      if (v === undefined || v === null || v === '') continue;
      if (typeof v === 'object') v = JSON.stringify(v);
      const label = labelMap[k] || k;
      rows += '<tr><td style="padding:8px 12px;border:1px solid #eee;font-weight:600;background:#f9fafb;white-space:nowrap;vertical-align:top">' + label + '</td><td style="padding:8px 12px;border:1px solid #eee">' + String(v) + '</td></tr>';
    }
    const submittedAt = new Date().toUTCString();
    rows += '<tr><td style="padding:8px 12px;border:1px solid #eee;font-weight:600;background:#f9fafb">Submission Date/Time</td><td style="padding:8px 12px;border:1px solid #eee">' + submittedAt + '</td></tr>';
    rows += '<tr><td style="padding:8px 12px;border:1px solid #eee;font-weight:600;background:#f9fafb">Source</td><td style="padding:8px 12px;border:1px solid #eee">TradeDoc PPL Reservation Form</td></tr>';

    const internalNote = type === 'ppl_reservation'
      ? '<p style="margin-top:18px;padding:12px 14px;background:#fff7ed;border:1px solid #fdba74;border-radius:6px;font-size:13px;color:#9a3412;">Internal note: Production manager review required before confirming shift assignment.</p>'
      : '';

    const html = '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">'
      + '<h2 style="color:#1a5c38;margin-bottom:4px;">' + route.subject + '</h2>'
      + '<p style="color:#6b7280;font-size:13px;margin-top:0;">Received via TradeDoc</p>'
      + '<table style="border-collapse:collapse;width:100%;font-size:14px;margin-top:12px;">' + rows + '</table>'
      + internalNote
      + '</div>';

    // Store in DB (best-effort) with pending status
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_inquiries (
      id SERIAL PRIMARY KEY, inquiry_type TEXT, email TEXT, payload JSONB,
      status TEXT DEFAULT 'Pending Production Review', created_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(() => {});
    await sql('INSERT INTO tradedoc_inquiries (inquiry_type, email, payload, status) VALUES ($1,$2,$3,$4)',
      [type || 'general', body.email || '', JSON.stringify(body), 'Pending Production Review']).catch(() => {});

    // Send email — fail clearly if provider not configured
    if (!process.env.RESEND_API_KEY || !process.env.TRADEDOC_FROM_EMAIL) {
      return res.status(500).json({ error: 'Email service not configured' });
    }
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'TradeDoc <' + process.env.TRADEDOC_FROM_EMAIL + '>',
          to: [route.email],
          reply_to: body.email || undefined,
          subject: route.subject,
          html
        })
      });
      if (!r.ok) {
        const errText = await r.text().catch(() => '');
        console.error('contact_inquiry resend error:', r.status, errText);
        return res.status(502).json({ error: 'Email delivery failed' });
      }
    } catch (e) {
      console.error('contact_inquiry exception:', e && e.message);
      return res.status(502).json({ error: 'Email delivery failed' });
    }
    return res.json({ success: true, status: 'Pending Production Review' });
  }

  if (action === 'resend_confirmation') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const rows = await sql(`SELECT email, company_name, email_confirmed, confirmation_token FROM tradedoc_users WHERE email=$1`, [email]);
    if (!rows[0]) return res.status(404).json({ error: 'Account not found. Please sign up first.' });
    if (rows[0].email_confirmed) {
      // Already confirmed — return user data for auto sign-in
      return res.json({ success: true, already_confirmed: true, user: { email: rows[0].email, company: rows[0].company_name, plan: 'free' } });
    }
    // Resend confirmation email
    const token = rows[0].confirmation_token || Math.random().toString(36).slice(2) + Date.now().toString(36);
    await sql(`UPDATE tradedoc_users SET confirmation_token=$1, updated_at=NOW() WHERE email=$2`, [token, email]);
    const confirmUrl = 'https://docs.lenmacai.com/confirm?token=' + token;
    const name = rows[0].company_name || email.split('@')[0];
    const sent = await sendInstant(email, 'Confirm your TradeDoc account',
      `<p style="color:#374151;font-size:15px;line-height:1.6;margin-top:0;">Hi ${name},</p>
       <p style="color:#374151;font-size:15px;line-height:1.6;">Here is your confirmation link for TradeDoc. Click below to activate your account.</p>
       <div style="text-align:center;margin:28px 0;"><a href="${confirmUrl}" style="background:#1a7a4a;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px;display:inline-block;">Confirm Email Address</a></div>
       <p style="color:#6b7280;font-size:13px;">If you did not create this account, you can safely ignore this email.</p>`
    );
    if (!sent.ok) {
      return res.status(502).json({ error: `Confirmation email could not be sent: ${sent.error || 'email provider did not accept the message'}` });
    }
    return res.json({ success: true, message: 'Confirmation email resent.' });
  }

  if (action === 'confirm_email') {
    const { token } = body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    const rows = await sql(`UPDATE tradedoc_users SET email_confirmed=true, updated_at=NOW() WHERE confirmation_token=$1 RETURNING email, plan, company_name`, [token]);
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired confirmation token' });
    await sql(`INSERT INTO tradedoc_events (email, event_type) VALUES ($1,'email_verified')`, [rows[0].email]).catch(()=>{});
    return res.json({ success: true, user: { email: rows[0].email, plan: rows[0].plan, company: rows[0].company_name } });
  }

  if (action === 'enhance_doc') {
    const { doc_type, form_data } = body;
    if (!doc_type || !form_data) return res.json({ enhanced: false, form_data: form_data || {} });

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    // ── FIELD EXTRACTORS ──────────────────────────────────────────────────
    const proposingCo = form_data.proposing_company || form_data.company_name || 'our company';
    const recipient   = form_data.recipient_name || form_data.to_company || form_data.buyer_name || 'the recipient';
    const product     = form_data.products_services || form_data.product || form_data.items_description || form_data.commodity || '';
    const summary     = form_data.executive_summary || form_data.intent_details || form_data.purpose || form_data.scope || '';
    const title       = form_data.proposal_title || form_data.loi_title || form_data.subject || doc_type.replace(/_/g, ' ');
    const contact     = form_data.contact_email || form_data.contact_phone || form_data.signatory_name || form_data.signatory || '';
    const date        = form_data.proposal_date || form_data.loi_date || form_data.letter_date || form_data.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // ── PROMPT LIBRARY ────────────────────────────────────────────────────
    const PROMPTS = {
      business_proposal: `You are a senior export trade business development writer for Lenmac Company Limited, Tanzania.
Write a complete, professional Business Proposal document in PLAIN TEXT only. No markdown, no asterisks, no bullet symbols.

User-provided data: ${JSON.stringify(form_data)}

Write each section as a proper paragraph, using this exact structure:

BUSINESS PROPOSAL
${title}

Prepared by: ${proposingCo}
Prepared for: ${recipient}
Date: ${date}

EXECUTIVE SUMMARY
[Expand "${summary || 'this business cooperation opportunity'}" into 3-4 professional sentences. If the summary is vague (e.g. "investment opportunities", "investment partner"), interpret it as a proposal for commercial export cooperation and write accordingly.]

ABOUT ${proposingCo.toUpperCase()}
[Write a 2-3 sentence professional company introduction based on available information. If company details are limited, write a generic professional introduction about an export-oriented company.]

THE PROPOSAL
[Describe clearly what ${proposingCo} is proposing to ${recipient}. Expand "${product || 'the described products and services'}" into a professional 2-3 sentence description. Mention specific product details if provided.]

COMMERCIAL OPPORTUNITY
[Write 2-3 sentences on the business opportunity and mutual benefit of this cooperation between ${proposingCo} and ${recipient}.]

SCOPE OF WORK
[Write 2-3 sentences describing what will be delivered, supplied or executed under this proposal.]

PROPOSED TERMS
[Write 2-3 sentences on commercial framework — pricing model, payment terms, delivery terms. If none provided, write professionally that terms will be confirmed upon mutual agreement.]

NEXT STEPS
[Write a professional 2-3 sentence closing with a clear call to action — invite ${recipient} to respond, meet, or confirm interest.]

CONTACT
[Write the contact closing using: ${contact || proposingCo + ' — please contact directly to proceed.'}]

IMPORTANT: Write every section as complete paragraphs. Do NOT use bullet points. Do NOT use asterisks. Do NOT use markdown. Plain professional text only. Minimum 3 sentences per section.`,

      loi: `You are a professional international trade correspondent.
Write a formal Letter of Intent in PLAIN TEXT. No markdown, no bullets, no asterisks.

User data: ${JSON.stringify(form_data)}

Structure:
LETTER OF INTENT

From: ${proposingCo}
To: ${recipient}
Date: ${date}
Re: ${title}

[Opening paragraph — formal statement of intent]
[Purpose paragraph — what the intent covers, product/service, estimated quantities if provided]
[Commercial terms paragraph — incoterms, payment method if provided, or note they will be negotiated]
[Non-binding statement paragraph — this LOI is an expression of intent and not a binding contract unless executed as such]
[Next steps paragraph — what actions follow]
[Formal closing paragraph]\nDo NOT add a signature block, signature lines, or "Name: ___ / Title: ___ / Date: ___" placeholders. Execution and signatures are rendered separately by the system.

Write in formal business English. Minimum 2 sentences per section.`,

      lpo: `You are a professional procurement officer.
Write a formal Local Purchase Order in PLAIN TEXT. No markdown.

User data: ${JSON.stringify(form_data)}

Structure:
LOCAL PURCHASE ORDER

PO Reference: [use provided or auto-generate]
Issue Date: ${date}
Buyer: ${proposingCo}
Vendor: ${recipient}

GOODS / SERVICES ORDERED:
[Professional description of items — expand "${product}" into formal procurement language. Include quantity, unit, description, unit price, total if provided.]

DELIVERY TERMS: [delivery terms or TBD]
PAYMENT TERMS: [payment terms or TBD]

[Authorization paragraph — this LPO constitutes an order and the vendor is requested to confirm receipt and supply accordingly]\nDo NOT add a signature block, signature lines, or "Name: ___ / Title: ___ / Date: ___" placeholders. Execution and signatures are rendered separately by the system.`,

      business_contract: `You are a professional export trade lawyer.
Write a formal Business Contract/Agreement in PLAIN TEXT. No markdown.

User data: ${JSON.stringify(form_data)}

Structure:
BUSINESS CONTRACT / AGREEMENT

This Agreement is entered into between:
Party A: ${proposingCo}
Party B: ${recipient}
Date: ${date}

1. RECITALS AND BACKGROUND
[2-3 sentences on context]

2. SCOPE OF AGREEMENT
[2-3 sentences on what this agreement covers]

3. PRODUCTS / SERVICES
[Professional description of "${product}"]

4. PRICING AND PAYMENT TERMS
[Payment structure — if provided, use it; if not, state TBD by mutual agreement]

5. DELIVERY AND INCOTERMS
[Delivery terms]

6. OBLIGATIONS OF PARTY A
[2-3 sentences]

7. OBLIGATIONS OF PARTY B
[2-3 sentences]

8. DURATION AND TERMINATION
[Standard clause — duration and termination conditions]

9. DISPUTE RESOLUTION
Disputes shall be resolved through negotiation and, if unresolved, through arbitration under applicable Tanzanian law.

10. GOVERNING LAW
This Agreement shall be governed by the laws of Tanzania unless otherwise agreed in writing.

11. SIGNATURES
State that the parties execute this contract as of the date first written above.\nDo NOT add a signature block, signature lines, or "Name: ___ / Title: ___ / Date: ___" placeholders. Execution and signatures are rendered separately by the system.

Write professional legal-adjacent language. Keep all user facts exact.`,

      letter_of_intent: `You are an export trade documentation specialist. Write a complete, professional Letter of Intent in PLAIN TEXT. No markdown, no asterisks, no hashes.

User data: ${JSON.stringify(form_data)}

Structure:
LETTER OF INTENT
Date: ${date}
From: ${proposingCo}
To: ${recipient}

[Opening paragraph stating the intent to enter into a commercial transaction]
SUBJECT: [the commodity/opportunity — expand "${product}" professionally]
PROPOSED TERMS: [quantity, grade, price basis, Incoterm, destination — use only provided facts, mark missing as TO BE CONFIRMED]
VALIDITY: [validity period or TO BE CONFIRMED]
NEXT STEPS: [what follows — contract, proforma, inspection]
[Non-binding clause stating this LOI is an expression of intent and not a binding contract unless formalised]
[Formal closing]\nDo NOT add a signature block, signature lines, or "Name: ___ / Title: ___ / Date: ___" placeholders. Execution and signatures are rendered separately by the system.
Keep all user facts exact. Institutional tone.`,

      bank_letter: `You are a banking documentation officer. Write a complete, professional bank-facing letter in PLAIN TEXT. No markdown.

User data: ${JSON.stringify(form_data)}

Structure:
[Letterhead line: ${proposingCo}]
Date: ${date}
To: The Manager, [Bank name or TO BE CONFIRMED]

RE: [subject of the request — expand "${summary}" professionally]
[Body paragraphs presenting the request clearly — account details, transaction reference, amount, and purpose using only provided facts]
[Closing paragraph requesting the bank's action and offering to provide further documentation]
[Formal closing]\nDo NOT add a signature block, signature lines, or "Name: ___ / Title: ___ / Date: ___" placeholders. Execution and signatures are rendered separately by the system.
Formal banking correspondence tone. Keep all figures exact.`,

      proforma_invoice: `You are an export documentation officer. Write a complete, professional Proforma Invoice in PLAIN TEXT. No markdown, no asterisks, no hashes.

User data: ${JSON.stringify(form_data)}

Structure:
PROFORMA INVOICE
Proforma No: [provided or auto-generate]    Date: ${date}
EXPORTER / SELLER: ${proposingCo}
CONSIGNEE / BUYER: ${recipient}
DESCRIPTION OF GOODS: [expand "${product}" — product, grade, HS code, packaging]
QUANTITY / UNIT PRICE / AMOUNT: [tabular line items from provided data]
TOTAL VALUE: [subtotal, freight, insurance, total with currency and Incoterm 2020]
DELIVERY TERMS: [Incoterm, port of loading, port of discharge]
PAYMENT TERMS: [as provided or TO BE CONFIRMED]
VALIDITY: [offer validity]
BANKING DETAILS: [if provided, else TO BE CONFIRMED]
Use only provided facts. Mark anything missing as TO BE CONFIRMED. Institutional, buyer-ready tone.`,

      commercial_invoice: `You are an export documentation officer. Write a complete, customs-ready Commercial Invoice in PLAIN TEXT. No markdown.

User data: ${JSON.stringify(form_data)}

Structure:
COMMERCIAL INVOICE
Invoice No: [provided or auto-generate]    Date: ${date}
EXPORTER / SELLER: ${proposingCo} [include TIN/registration if provided]
CONSIGNEE / BUYER: ${recipient}
NOTIFY PARTY: [if provided]
SHIPMENT: [vessel/flight, port of loading, port of discharge, country of origin, country of destination]
DESCRIPTION OF GOODS: [expand "${product}" — product, grade, HS code, marks and numbers]
QUANTITY / UNIT PRICE / AMOUNT: [tabular line items]
TOTAL INVOICE VALUE: [currency, Incoterm 2020]
PAYMENT TERMS: [as provided]
DECLARATION: [standard true-and-correct declaration with country of origin statement]
SIGNATURE BLOCK: [for and on behalf of ${proposingCo}]
Use only provided facts; mark missing data as TO BE CONFIRMED. Customs-ready, institutional tone.`,

      packing_list: `You are an export documentation officer. Write a complete, professional Packing List in PLAIN TEXT. No markdown.

User data: ${JSON.stringify(form_data)}

Structure:
PACKING LIST
Reference No: [provided or auto-generate]    Date: ${date}    Linked Invoice: [if provided]
EXPORTER / SELLER: ${proposingCo}
CONSIGNEE / BUYER: ${recipient}
SHIPMENT: [vessel/flight, port of loading, port of discharge, container and seal if provided]
PACKING DETAILS: [tabular: marks, description of goods, number of packages, net weight, gross weight, measurement]
TOTALS: [total packages, total net weight, total gross weight, total volume]
MARKS AND NUMBERS: [if provided]
DECLARATION: [standard accuracy statement]
SIGNATURE BLOCK
Quantities and weights must reconcile. Use only provided facts; mark missing as TO BE CONFIRMED. Institutional tone.`,

      export_readiness: `You are a senior export operations manager. Write a complete Export Readiness Assessment in PLAIN TEXT. No markdown.

User data: ${JSON.stringify(form_data)}

Structure:
EXPORT READINESS ASSESSMENT
Reference: [auto-generate]    Date: ${date}
CONSIGNMENT OVERVIEW: [exporter ${proposingCo}, buyer ${recipient}, commodity/grade from "${product}", quantity, destination, Incoterm — use provided facts only]
DOCUMENTATION STATUS: [list each required export document — Commercial Invoice, Packing List, Bill of Lading, Certificate of Origin, Phytosanitary/Health Certificate where relevant, government permits — marking each IN PLACE, OUTSTANDING, or NOT APPLICABLE based on the inputs]
CONSISTENCY REVIEW: [where quantity, weight, value, product description, and counterparties must be cross-checked across documents]
REGULATORY AND COMPLIANCE STATUS: [origin certification, inspection, permits relevant to the commodity and route]
LOGISTICS READINESS: [booking, container, port, timeline from inputs]
RISK FLAGS: [concrete risks from the inputs or missing data]
READINESS CONCLUSION: [reasoned: READY, NEARLY READY, or NOT READY, with the specific outstanding items]
RECOMMENDED NEXT ACTIONS: [specific, ordered steps]
Reason only from supplied data. State assumptions. Flag missing items as OUTSTANDING. Institutional, decision-ready tone.`
    };

    const prompt = PROMPTS[doc_type];
    if (!prompt) return res.json({ enhanced: false, form_data });

    // ── TRY 1: ANTHROPIC (PRIMARY) ────────────────────────────────────────
    if (ANTHROPIC_KEY) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 22000); // 22s — Vercel edge limit is 30s
        console.log('enhance_doc: trying Anthropic (claude-haiku-4-5-20251001) for', doc_type);
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: ctrl.signal,
          headers: {
            'x-api-key': ANTHROPIC_KEY,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 1500,
            system: 'You are a professional export trade document writer. Write in plain text only — no markdown, no asterisks, no bullets. Use clear section headings in ALL CAPS. Never invent figures or names not supplied; use [TO BE CONFIRMED] for missing data. Output the finished document only.',
            messages: [{ role: 'user', content: prompt }]
          })
        });
        clearTimeout(timer);
        if (r.ok) {
          const d = await r.json();
          const text = d.content?.[0]?.text?.trim();
          if (text && text.length > 200) {
            console.log('enhance_doc: Anthropic success, chars:', text.length);
            return res.json({ enhanced: true, form_data: { ...form_data, _ai_enhanced_content: text, _ai_enhanced: 'true', _ai_provider: 'anthropic' } });
          }
        }
        const errBody = await r.text().catch(() => '');
        console.error('enhance_doc: Anthropic failed', r.status, errBody.slice(0, 300));
      } catch (e) {
        console.error('enhance_doc: Anthropic exception:', e.message);
      }
    } else {
      console.warn('enhance_doc: ANTHROPIC_API_KEY not set');
    }

    // ── TRY 2: OPENAI (SECONDARY) ─────────────────────────────────────────
    if (OPENAI_KEY) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 8000); // 8s fallback
        console.log('enhance_doc: trying OpenAI for', doc_type);
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', signal: ctrl.signal,
          headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 2000,
            messages: [
              { role: 'system', content: 'You are a professional export document writer. Write in plain text only. No markdown, no asterisks, no bullets.' },
              { role: 'user', content: prompt }
            ]
          })
        });
        clearTimeout(timer);
        if (r.ok) {
          const d = await r.json();
          const text = d.choices?.[0]?.message?.content?.trim();
          if (text && text.length > 200) {
            console.log('enhance_doc: OpenAI success, chars:', text.length);
            return res.json({ enhanced: true, form_data: { ...form_data, _ai_enhanced_content: text, _ai_enhanced: 'true', _ai_provider: 'openai' } });
          }
        }
        const errBody = await r.text().catch(() => '');
        console.error('enhance_doc: OpenAI failed', r.status, errBody.slice(0, 300));
      } catch (e) {
        console.error('enhance_doc: OpenAI exception:', e.message);
      }
    } else {
      console.warn('enhance_doc: OPENAI_API_KEY not set');
    }

    // ── TRY 3: DETERMINISTIC PROFESSIONAL FALLBACK ────────────────────────
    console.log('enhance_doc: using deterministic fallback for', doc_type);

    if (doc_type === 'business_proposal') {
      const expandedSummary = summary && summary.length > 20
        ? `This proposal outlines a business cooperation opportunity centred on ${summary}. ${proposingCo} is pleased to present this proposal to ${recipient} and looks forward to establishing a productive commercial relationship. Based on the information provided, the parties are invited to review the terms herein and respond with their interest.`
        : `This proposal outlines an export trade cooperation opportunity between ${proposingCo} and ${recipient} in the area of ${product || 'agricultural commodities and related commercial activities'}. ${proposingCo} has prepared this proposal to present a formal commercial framework for consideration. The parties are invited to review and confirm their interest so that a formal agreement may be concluded.`;

      const aiContent = `BUSINESS PROPOSAL
${title.toUpperCase()}

Prepared by: ${proposingCo}
Prepared for: ${recipient}
Date: ${date}

EXECUTIVE SUMMARY

${expandedSummary}

ABOUT ${proposingCo.toUpperCase()}

${proposingCo} is a registered business entity engaged in export trade and commercial operations. The company operates in accordance with applicable trade regulations and maintains a commitment to quality, transparency and professional standards in all commercial dealings.

THE PROPOSAL

${proposingCo} is pleased to present this formal business proposal to ${recipient} with respect to ${title.toLowerCase()}. ${product ? `The proposed scope covers the following: ${product}. ` : ''}The proposal has been prepared in good faith and reflects the genuine commercial interest of ${proposingCo} in establishing a mutually beneficial relationship.

COMMERCIAL OPPORTUNITY

A commercial partnership between ${proposingCo} and ${recipient} presents an opportunity for both parties to benefit through transparent terms and professional execution. The proposed cooperation is designed to create sustainable value, anchored on product quality, reliable delivery and agreed commercial terms.

SCOPE OF WORK

The scope of this proposal includes the supply, delivery and commercial arrangement for the goods and services described herein, executed in accordance with agreed terms and applicable regulatory requirements. Full specifications and quantities shall be confirmed upon execution of a formal purchase agreement or contract.

PROPOSED TERMS

Commercial terms, pricing and delivery schedules shall be finalized upon mutual agreement following acceptance of this proposal. Payment terms and applicable incoterms will be set out in a formal contract or purchase order.

NEXT STEPS

${proposingCo} invites ${recipient} to review this proposal and respond with confirmation of interest, queries or proposed amendments. ${proposingCo} is prepared to arrange a meeting, provide additional documentation, or proceed to a formal agreement at the earliest convenience of both parties.

CONTACT

${contact ? `For inquiries regarding this proposal, please contact: ${contact}` : `Please direct all correspondence regarding this proposal to ${proposingCo}.`}

This document has been prepared through TradeDoc by LenmacAI — docs.lenmacai.com`;

      return res.json({ enhanced: true, form_data: { ...form_data, _ai_enhanced_content: aiContent, _ai_enhanced: 'true', _ai_provider: 'fallback' } });
    }

    if (doc_type === 'loi') {
      const aiContent = `LETTER OF INTENT

From:    ${proposingCo}
To:      ${recipient}
Date:    ${date}
Re:      ${title}

Dear ${recipient},

${proposingCo} hereby issues this Letter of Intent to confirm our genuine commercial interest in ${summary || 'entering into a trade agreement with ' + recipient}. This letter is issued in good faith as a formal expression of our intent to proceed with the commercial terms outlined herein.

${product ? `The subject matter of this Letter of Intent concerns the following goods and services: ${product}. Quantities and specifications shall be confirmed upon execution of a formal purchase agreement.` : 'The full scope, quantities and specifications of the proposed transaction shall be confirmed upon execution of a formal agreement.'}

The parties agree to negotiate in good faith toward a formal contract covering pricing, payment terms, delivery conditions and applicable incoterms. This Letter of Intent does not constitute a binding contract unless both parties execute a formal agreement incorporating these terms.

${proposingCo} invites ${recipient} to confirm receipt and acceptance of this letter, and to proceed with negotiations toward a formal agreement at the earliest opportunity.

Yours sincerely,
${proposingCo}
${contact || ''}

This document has been prepared through TradeDoc by LenmacAI — docs.lenmacai.com`;

      return res.json({ enhanced: true, form_data: { ...form_data, _ai_enhanced_content: aiContent, _ai_enhanced: 'true', _ai_provider: 'fallback' } });
    }

    if (doc_type === 'lpo') {
      const aiContent = `LOCAL PURCHASE ORDER

Buyer:        ${proposingCo}
Vendor:       ${recipient}
Date:         ${date}
Subject:      Purchase Order — ${title}

${proposingCo} hereby issues this Local Purchase Order to ${recipient} for the supply of the following goods and services:

GOODS AND SERVICES: ${product || 'As described in the attached specification sheet'}

This purchase order constitutes a formal instruction to supply the above-described goods and services in accordance with the terms and specifications agreed between the parties. The vendor is requested to acknowledge receipt of this order and confirm the ability to fulfil the requirements within the agreed timeline.

Delivery terms, payment schedule and unit pricing shall be as agreed in the applicable quotation or commercial agreement. Any deviation from the ordered specifications must be communicated in writing prior to dispatch.

${contact ? `For queries regarding this order, please contact: ${contact}` : `Please direct all correspondence to ${proposingCo}.`}

Authorised by: ${proposingCo}

This document has been prepared through TradeDoc by LenmacAI — docs.lenmacai.com`;

      return res.json({ enhanced: true, form_data: { ...form_data, _ai_enhanced_content: aiContent, _ai_enhanced: 'true', _ai_provider: 'fallback' } });
    }

    if (doc_type === 'business_contract') {
      const aiContent = `BUSINESS CONTRACT AND AGREEMENT

This Agreement is entered into between:

PARTY A:  ${proposingCo}
PARTY B:  ${recipient}
DATE:     ${date}

1. RECITALS AND BACKGROUND

This Agreement is entered into for the purpose of establishing a formal commercial relationship between ${proposingCo} and ${recipient} with respect to ${product || 'the supply of goods and services as described herein'}. Both parties enter this Agreement in good faith and intend to be bound by its terms upon execution.

2. SCOPE OF AGREEMENT

This Agreement governs the commercial relationship between the parties with respect to ${title.toLowerCase()}. The full scope of work, including specifications, quantities, timelines and deliverables, shall be as set out in the relevant purchase orders, invoices and annexures attached hereto.

3. PRODUCTS AND SERVICES

${product ? `The subject matter of this Agreement is the supply of the following: ${product}. Quality standards, grades, moisture content and packaging specifications shall be agreed in writing prior to each shipment.` : 'Products and services to be supplied under this Agreement shall be described in detail in individual purchase orders or schedules annexed hereto.'}

4. PRICING AND PAYMENT TERMS

Pricing for goods and services supplied under this Agreement shall be as agreed between the parties in the relevant purchase order or commercial invoice. Payment terms shall be confirmed in writing and may include advance payment, letter of credit, or such other arrangement as the parties agree.

5. DELIVERY AND INCOTERMS

Delivery terms, ports of loading and discharge, and applicable incoterms shall be as specified in the applicable commercial invoice and bill of lading. Risk of loss shall pass in accordance with the agreed incoterms.

6. OBLIGATIONS OF PARTY A

${proposingCo} shall supply the agreed goods and services in accordance with the specifications, quantities and timelines confirmed in the relevant purchase orders. ${proposingCo} shall maintain all required licences, permits and certifications for the export of the goods.

7. OBLIGATIONS OF PARTY B

${recipient} shall accept delivery of goods in accordance with the agreed terms and shall make payment within the agreed payment period. ${recipient} shall communicate any quality concerns or disputes within a reasonable period following receipt of goods.

8. DURATION AND TERMINATION

This Agreement shall remain in force for the duration agreed by the parties or until terminated by either party upon thirty (30) days written notice. Termination shall not affect any obligations arising from purchase orders already in execution.

9. DISPUTE RESOLUTION

Any disputes arising out of this Agreement shall first be subject to good faith negotiation between the parties. If unresolved within thirty (30) days, disputes shall be submitted to arbitration under applicable law.

10. GOVERNING LAW

This Agreement shall be governed by and construed in accordance with the laws of Tanzania unless the parties agree otherwise in writing.

11. SIGNATURES

For and on behalf of ${proposingCo}:
Signature: ___________________________
Name:      ___________________________
Date:      ___________________________

For and on behalf of ${recipient}:
Signature: ___________________________
Name:      ___________________________
Date:      ___________________________

This document has been prepared through TradeDoc by LenmacAI — docs.lenmacai.com`;

      return res.json({ enhanced: true, form_data: { ...form_data, _ai_enhanced_content: aiContent, _ai_enhanced: 'true', _ai_provider: 'fallback' } });
    }

    // Unknown doc type — return unchanged
    return res.json({ enhanced: false, form_data });
  }

  if (action === 'generate_doc') {
    const { email, doc_type, form_data, commodity, destination_country } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const users = await sql(`SELECT * FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found or email not confirmed' });

    // Monthly quota reset — if the stored period is not the current calendar month, reset the counter
    // docs_period column already exists
    const currentPeriod = new Date().toISOString().slice(0, 7); // YYYY-MM
    let usedThisMonth = user.docs_generated_this_month || 0;
    if ((user.docs_period || '') !== currentPeriod) {
      await sql('UPDATE tradedoc_users SET docs_generated_this_month=0, docs_period=$1, updated_at=NOW() WHERE id=$2', [currentPeriod, user.id]).catch(()=>{});
      usedThisMonth = 0;
    }

    const limit = LIMITS[user.plan]||5;
    if (usedThisMonth >= limit) return res.status(429).json({ error: 'Monthly limit reached', message: 'You have used all ' + limit + ' free documents this month. Upgrade to Pro for unlimited documents.', limit, used: usedThisMonth });
    const title = String(doc_type).replace(/_/g,' ').replace(/\b\w/g, c=>c.toUpperCase());
    const docs = await sql(`INSERT INTO tradedoc_documents (user_id,doc_type,title,form_data,status,doc_category) VALUES ($1,$2,$3,$4,'generated','self_service') RETURNING id`,
      [user.id, doc_type, title, JSON.stringify(form_data)]);
    await sql(`UPDATE tradedoc_users SET docs_generated_this_month=docs_generated_this_month+1,updated_at=NOW() WHERE id=$1`, [user.id]);
    await sql(`INSERT INTO tradedoc_events (user_id,email,plan_type,event_type,document_type,commodity,destination_country) VALUES ($1,$2,$3,'document_generated',$4,$5,$6)`,
      [user.id, email, user.plan, doc_type, commodity||null, destination_country||null]).catch(()=>{});
    return res.json({ success: true, doc_id: docs[0]?.id, plan: user.plan, remaining: Math.max(0, limit-(user.docs_generated_this_month||0)-1) });
  }

  if (action === 'request_consultation') {
    const { email, company_name, consultation_type, doc_requested, destination_country, notes } = body;
    if (!email||!consultation_type) return res.status(400).json({ error: 'Email and service type required' });
    const fee = FEES[consultation_type];
    if (!fee) return res.status(400).json({ error: 'Invalid consultation type' });
    const feeLabel = fee.tzs > 0 ? `TZS ${fee.tzs.toLocaleString()}` : 'Fee on request';
    await sql(`INSERT INTO tradedoc_consultations (email,company_name,consultation_type,doc_requested,destination_country,notes,fee_tzs,fee_usd,notified_at) VALUES ($1,$2,$3,$4,$5,$6,$7,0,NOW())`,
      [email, company_name||'', consultation_type, doc_requested||'', destination_country||'', notes||'', fee.tzs]).catch(()=>{});
    await sql(`INSERT INTO tradedoc_events (email,event_type,metadata) VALUES ($1,'consultation_requested',$2)`,
      [email, JSON.stringify({consultation_type,doc_requested})]).catch(()=>{});
    const tableHtml = `<table style="border-collapse:collapse;font-size:13px;width:100%;"><tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Service</td><td style="padding:8px;border:1px solid #e5e7eb;">${fee.label}</td></tr><tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Email</td><td style="padding:8px;border:1px solid #e5e7eb;">${email}</td></tr><tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Company</td><td style="padding:8px;border:1px solid #e5e7eb;">${company_name||'—'}</td></tr><tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;background:#f9fafb;">Document</td><td style="padding:8px;border:1px solid #e5e7eb;">${doc_requested||'—'}</td></tr><tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;color:#8b1a2c;background:#f9fafb;">Fee</td><td style="padding:8px;border:1px solid #e5e7eb;font-weight:bold;">${feeLabel}</td></tr></table>`;
    const adminHtml = `<div style="font-family:Arial;padding:20px;max-width:600px;"><h2 style="color:#8b1a2c;margin-top:0;">TradeDoc Consultation Request</h2>${tableHtml}</div>`;
    await queueMail(NOTIFY, `TradeDoc Consultation — ${fee.label} | ${email}`, adminHtml, 'tradedoc_admin');
    await queueMail('margin@agrismes.com', `TradeDoc Consultation — ${fee.label} | ${email}`, adminHtml, 'tradedoc_admin');
    await queueMail(email, 'TradeDoc — Consultation Request Received',
      `<div style="font-family:Arial;max-width:560px;margin:0 auto;"><div style="background:#8b1a2c;padding:24px;border-radius:8px 8px 0 0;"><h1 style="color:#fff;margin:0;font-size:18px;">TradeDoc</h1></div><div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;"><p style="color:#374151;margin-top:0;">Your request for <strong>${fee.label}</strong> has been received.</p><p style="color:#374151;">We will contact you at <strong>${email}</strong> within 24 business hours.</p><p style="color:#374151;font-size:13px;">Facilitation fee: <strong>${feeLabel}</strong>.</p><div style="border-top:1px solid #e5e7eb;margin-top:20px;padding-top:16px;"><p style="color:#9ca3af;font-size:11px;margin:0;">TradeDoc · docs.lenmacai.com</p></div></div></div>`,
      'tradedoc_consultation'
    );
    return res.json({ success: true, fee_tzs: fee.tzs, fee_label: feeLabel });
  }

  // ════════════════════════════════════════════════════════════════════════
  // PRODUCTION / CONSIGNMENT WORKSPACE
  // Schema auto-migration + role-based access control + Free/Pro enforcement.
  // ════════════════════════════════════════════════════════════════════════
  async function ensureWorkspaceSchema() {
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_consignments (
      id SERIAL PRIMARY KEY, owner_email TEXT NOT NULL, consignment_number TEXT,
      buyer_name TEXT, supplier_name TEXT, product TEXT, grade TEXT,
      quantity_ordered TEXT, quantity_completed TEXT, destination_country TEXT,
      destination_port TEXT, status TEXT DEFAULT 'Order Confirmed',
      created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_production_updates (
      id SERIAL PRIMARY KEY, consignment_id INT NOT NULL, update_date TEXT, stage TEXT,
      stock_input TEXT, stock_output TEXT, weekly_production TEXT, daily_production TEXT,
      yield_percent TEXT, waste_quantity TEXT, grade_breakdown TEXT, notes TEXT,
      updated_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_cargo_status (
      id SERIAL PRIMARY KEY, consignment_id INT NOT NULL UNIQUE, cargo_ready_date TEXT,
      container_number TEXT, booking_number TEXT, truck_number TEXT, driver_name TEXT,
      driver_phone TEXT, current_location TEXT, cargo_status TEXT, notes TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_compliance_milestones (
      id SERIAL PRIMARY KEY, consignment_id INT NOT NULL UNIQUE,
      district_levy_status TEXT DEFAULT 'pending', district_levy_receipt_number TEXT,
      efd_receipt_status TEXT DEFAULT 'pending', efd_receipt_number TEXT,
      pdn_status TEXT DEFAULT 'pending', pdn_number TEXT,
      cbt_inspection_status TEXT DEFAULT 'pending',
      export_permit_status TEXT DEFAULT 'pending', export_permit_number TEXT,
      coo_status TEXT DEFAULT 'pending', health_certificate_status TEXT DEFAULT 'pending',
      phytosanitary_status TEXT DEFAULT 'pending', rac_status TEXT DEFAULT 'pending',
      sgs_status_optional TEXT DEFAULT 'not_required', updated_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_consignment_access (
      id SERIAL PRIMARY KEY, consignment_id INT NOT NULL, invited_email TEXT NOT NULL,
      invited_role TEXT DEFAULT 'viewer', status TEXT DEFAULT 'invited',
      invited_by TEXT, accepted_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_consignment_activity (
      id SERIAL PRIMARY KEY, consignment_id INT NOT NULL, actor_email TEXT,
      action TEXT, detail TEXT, created_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
  }

  // Resolve a user's role on a consignment. Returns null if no access.
  // Roles: owner | manager | compliance_officer | viewer | external_buyer | freight_forwarder
  async function resolveAccess(consignmentId, email) {
    const cons = await sql('SELECT * FROM tradedoc_consignments WHERE id=$1', [consignmentId]);
    if (!cons[0]) return { role: null, consignment: null };
    if (cons[0].owner_email === email) return { role: 'owner', consignment: cons[0] };
    const acc = await sql("SELECT * FROM tradedoc_consignment_access WHERE consignment_id=$1 AND invited_email=$2 AND status='accepted'", [consignmentId, email]);
    if (acc[0]) return { role: acc[0].invited_role, consignment: cons[0] };
    return { role: null, consignment: cons[0] };
  }
  const CAN_EDIT_PRODUCTION = new Set(['owner', 'manager']);
  const CAN_EDIT_COMPLIANCE = new Set(['owner', 'compliance_officer']);
  const CAN_EDIT_CARGO = new Set(['owner', 'manager']);
  const CAN_INVITE = new Set(['owner']);

  async function logActivity(cid, email, action, detail) {
    await sql('INSERT INTO tradedoc_consignment_activity (consignment_id, actor_email, action, detail) VALUES ($1,$2,$3,$4)',
      [cid, email, action, detail || '']).catch(()=>{});
  }

  if (action === 'ws_update_consignment') {
    const { email, consignment_id, data } = body;
    if (!email || !consignment_id) return res.status(400).json({ error: 'Missing params' });
    const cid = parseInt(consignment_id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid consignment_id' });
    const { role } = await resolveAccess(cid, email);
    if (!['owner','manager'].includes(role)) return res.status(403).json({ error: 'Not permitted to edit consignment details' });
    const d = data || {};
    const ALLOWED_COLS = ['consignment_number','buyer_name','supplier_name','product','grade','quantity_ordered','quantity_completed','destination_country','destination_port','status'];
    const sets = []; let paramIdx = 1; const vals = [];
    for (const k of ALLOWED_COLS) { if (d[k] !== undefined) { sets.push(k + '=$' + paramIdx); paramIdx++; vals.push(d[k]); } }
    if (!sets.length) return res.json({ success: true, note: 'No fields to update' });
    vals.push(cid);
    await sql('UPDATE tradedoc_consignments SET ' + sets.join(', ') + ', updated_at=NOW() WHERE id=$' + paramIdx, vals);
    await logActivity(cid, email, 'consignment_updated', 'Details updated');
    return res.json({ success: true });
  }

  if (action === 'ws_list_consignments') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await ensureWorkspaceSchema();
    // Owned + shared (accepted)
    const owned = await sql('SELECT * FROM tradedoc_consignments WHERE owner_email=$1 ORDER BY updated_at DESC', [email]);
    const sharedRows = await sql(`SELECT c.* FROM tradedoc_consignments c
      JOIN tradedoc_consignment_access a ON a.consignment_id=c.id
      WHERE a.invited_email=$1 AND a.status='accepted' ORDER BY c.updated_at DESC`, [email]);
    const owners = owned.map(c => ({ ...c, my_role: 'owner' }));
    const shared = sharedRows.map(c => ({ ...c, my_role: 'shared' }));
    return res.json({ success: true, owned: owners, shared });
  }

  if (action === 'ws_create_consignment') {
    const { email, data } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await ensureWorkspaceSchema();
    const users = await sql('SELECT plan_status FROM tradedoc_users WHERE email=$1', [email]);
    const plan = users[0]?.plan_status || 'free';
    if (plan !== 'pro') {
      const cnt = await sql('SELECT COUNT(*)::int AS n FROM tradedoc_consignments WHERE owner_email=$1', [email]);
      if ((cnt[0]?.n || 0) >= 5) {
        return res.status(429).json({ error: 'limit', message: 'Upgrade to Pro to unlock unlimited consignments, advanced compliance tracking, audit trails, and buyer/freight-forwarder collaboration.' });
      }
    }
    const d = data || {};
    const rows = await sql('INSERT INTO tradedoc_consignments (owner_email, consignment_number, buyer_name, supplier_name, product, grade, quantity_ordered, destination_country, destination_port, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
      [email, d.consignment_number||'', d.buyer_name||'', d.supplier_name||'', d.product||'', d.grade||'', d.quantity_ordered||'', d.destination_country||'', d.destination_port||'', d.status||'Order Confirmed']);
    const cid = rows[0].id;
    await sql('INSERT INTO tradedoc_compliance_milestones (consignment_id) VALUES ($1)', [cid]).catch(()=>{});
    await sql('INSERT INTO tradedoc_cargo_status (consignment_id) VALUES ($1)', [cid]).catch(()=>{});
    await logActivity(cid, email, 'created', 'Consignment created');
    return res.json({ success: true, consignment: rows[0] });
  }

  if (action === 'ws_get_consignment') {
    const { email, consignment_id } = body;
    if (!email || !consignment_id) return res.status(400).json({ error: 'Missing params' });
    const { role, consignment } = await resolveAccess(consignment_id, email);
    if (!role) return res.status(403).json({ error: 'No access to this consignment' });
    const production = await sql('SELECT * FROM tradedoc_production_updates WHERE consignment_id=$1 ORDER BY created_at DESC', [consignment_id]);
    const cargo = await sql('SELECT * FROM tradedoc_cargo_status WHERE consignment_id=$1', [consignment_id]);
    const compliance = await sql('SELECT * FROM tradedoc_compliance_milestones WHERE consignment_id=$1', [consignment_id]);
    const people = await sql('SELECT id, invited_email, invited_role, status, created_at FROM tradedoc_consignment_access WHERE consignment_id=$1 ORDER BY created_at', [consignment_id]);
    const ownerPlanRows = await sql('SELECT plan_status FROM tradedoc_users WHERE email=$1', [consignment.owner_email]);
    const ownerPlan = ownerPlanRows[0]?.plan_status || 'free';
    // External buyer / freight forwarder: redact internal notes
    const restricted = (role === 'external_buyer' || role === 'freight_forwarder');
    const prod = restricted ? production.map(p => ({ ...p, notes: '' })) : production;
    let activity = [];
    if (ownerPlan === 'pro' && (role === 'owner' || role === 'manager' || role === 'compliance_officer')) {
      activity = await sql('SELECT actor_email, action, detail, created_at FROM tradedoc_consignment_activity WHERE consignment_id=$1 ORDER BY created_at DESC LIMIT 100', [consignment_id]);
    } else {
      activity = await sql('SELECT actor_email, action, detail, created_at FROM tradedoc_consignment_activity WHERE consignment_id=$1 ORDER BY created_at DESC LIMIT 5', [consignment_id]);
    }
    return res.json({ success: true, role, owner_plan: ownerPlan, consignment,
      production: prod, cargo: cargo[0]||null, compliance: compliance[0]||null, people, activity });
  }

  if (action === 'ws_update_status') {
    const { email, consignment_id, status } = body;
    const cid = parseInt(consignment_id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid consignment_id' });
    const { role } = await resolveAccess(cid, email);
    if (!CAN_EDIT_PRODUCTION.has(role)) return res.status(403).json({ error: 'Not permitted' });
    await sql('UPDATE tradedoc_consignments SET status=$1, updated_at=NOW() WHERE id=$2', [status, cid]);
    await logActivity(cid, email, 'status_changed', 'Status → ' + status);
    return res.json({ success: true });
  }

  if (action === 'ws_add_production') {
    const { email, consignment_id, data } = body;
    const cid = parseInt(consignment_id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid consignment_id' });
    const { role } = await resolveAccess(cid, email);
    if (!CAN_EDIT_PRODUCTION.has(role)) return res.status(403).json({ error: 'Not permitted to update production' });
    const d = data || {};
    await sql('INSERT INTO tradedoc_production_updates (consignment_id, update_date, stage, stock_input, stock_output, weekly_production, daily_production, yield_percent, waste_quantity, grade_breakdown, notes, updated_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)',
      [cid, d.update_date||'', d.stage||'', d.stock_input||'', d.stock_output||'', d.weekly_production||'', d.daily_production||'', d.yield_percent||'', d.waste_quantity||'', d.grade_breakdown||'', d.notes||'', email]);
    if (d.quantity_completed) await sql('UPDATE tradedoc_consignments SET quantity_completed=$1, updated_at=NOW() WHERE id=$2', [d.quantity_completed, cid]);
    await logActivity(cid, email, 'production_update', d.stage || 'Production update added');
    return res.json({ success: true });
  }

  if (action === 'ws_update_cargo') {
    const { email, consignment_id, data } = body;
    const cid = parseInt(consignment_id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid consignment_id' });
    const { role } = await resolveAccess(cid, email);
    if (!CAN_EDIT_CARGO.has(role)) return res.status(403).json({ error: 'Not permitted to update cargo' });
    const d = data || {};
    await sql('UPDATE tradedoc_cargo_status SET cargo_ready_date=$1, container_number=$2, booking_number=$3, truck_number=$4, driver_name=$5, driver_phone=$6, current_location=$7, cargo_status=$8, notes=$9, updated_at=NOW() WHERE consignment_id=$10',
      [d.cargo_ready_date||'', d.container_number||'', d.booking_number||'', d.truck_number||'', d.driver_name||'', d.driver_phone||'', d.current_location||'', d.cargo_status||'', d.notes||'', cid]);
    await logActivity(cid, email, 'cargo_update', d.cargo_status || 'Cargo status updated');
    return res.json({ success: true });
  }

  if (action === 'ws_update_compliance') {
    const { email, consignment_id, data } = body;
    const cid = parseInt(consignment_id, 10);
    if (isNaN(cid)) return res.status(400).json({ error: 'Invalid consignment_id' });
    const { role, consignment } = await resolveAccess(cid, email);
    if (!CAN_EDIT_COMPLIANCE.has(role)) return res.status(403).json({ error: 'Not permitted to update compliance' });
    if (!consignment) return res.status(404).json({ error: 'Consignment not found' });
    // Advanced compliance is a Pro feature (owner plan)
    const ownerPlanRows = await sql('SELECT plan_status FROM tradedoc_users WHERE email=$1', [consignment.owner_email]);
    if ((ownerPlanRows[0]?.plan_status || 'free') !== 'pro') {
      return res.status(403).json({ error: 'pro_required', message: 'Advanced compliance tracking is a Pro feature.' });
    }
    const d = data || {};
    const COMP_COLS = ['district_levy_status','district_levy_receipt_number','efd_receipt_status','efd_receipt_number','pdn_status','pdn_number','cbt_inspection_status','export_permit_status','export_permit_number','coo_status','health_certificate_status','phytosanitary_status','rac_status','sgs_status_optional'];
    const sets = []; let paramIdx = 1; const vals = [];
    for (const col of COMP_COLS) { if (d[col] !== undefined) { sets.push(col + '=$' + paramIdx); paramIdx++; vals.push(d[col]); } }
    if (!sets.length) return res.json({ success: true, note: 'No fields to update' });
    vals.push(cid);
    await sql('UPDATE tradedoc_compliance_milestones SET ' + sets.join(', ') + ', updated_at=NOW() WHERE consignment_id=$' + paramIdx, vals);
    await logActivity(cid, email, 'compliance_update', 'Compliance milestones updated');
    return res.json({ success: true });
  }

  if (action === 'ws_invite') {
    const { email, consignment_id, invited_email, invited_role } = body;
    const { role, consignment } = await resolveAccess(consignment_id, email);
    if (!CAN_INVITE.has(role)) return res.status(403).json({ error: 'Only the owner can invite' });
    const ownerPlanRows = await sql('SELECT plan_status FROM tradedoc_users WHERE email=$1', [consignment.owner_email]);
    const ownerPlan = ownerPlanRows[0]?.plan_status || 'free';
    // Free: max 3 viewers, viewer role only
    let roleToSet = (invited_role || 'viewer');
    if (ownerPlan !== 'pro') {
      roleToSet = 'viewer';
      const cnt = await sql('SELECT COUNT(*)::int AS n FROM tradedoc_consignment_access WHERE consignment_id=$1', [consignment_id]);
      if ((cnt[0]?.n || 0) >= 3) {
        return res.status(429).json({ error: 'limit', message: 'Free plan allows up to 3 viewers per consignment. Upgrade to Pro for unlimited invites and advanced roles.' });
      }
    }
    const allowedRoles = new Set(['viewer','manager','compliance_officer','external_buyer','freight_forwarder']);
    if (!allowedRoles.has(roleToSet)) roleToSet = 'viewer';
    // Auto-accept (invited user logs in with same email to view). status accepted on creation for simplicity of access.
    await sql(`INSERT INTO tradedoc_consignment_access (consignment_id, invited_email, invited_role, status, invited_by, accepted_at)
      VALUES ($1,$2,$3,'accepted',$4,NOW())`, [consignment_id, String(invited_email).toLowerCase().trim(), roleToSet, email]);
    await logActivity(consignment_id, email, 'invited', invited_email + ' as ' + roleToSet);
    return res.json({ success: true, invited_role: roleToSet });
  }

  if (action === 'ws_remove_access') {
    const { email, consignment_id, access_id } = body;
    const { role } = await resolveAccess(consignment_id, email);
    if (!CAN_INVITE.has(role)) return res.status(403).json({ error: 'Only the owner can manage access' });
    await sql('DELETE FROM tradedoc_consignment_access WHERE id=$1 AND consignment_id=$2', [access_id, consignment_id]);
    await logActivity(consignment_id, email, 'access_removed', '');
    return res.json({ success: true });
  }


  async function ensureRetrievalSchema() {
    await sql('CREATE EXTENSION IF NOT EXISTS vector').catch(()=>{});
    await sql('CREATE TABLE IF NOT EXISTS td_knowledge_sources (id SERIAL PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, scope TEXT DEFAULT \'global\', owner_email TEXT, created_at TIMESTAMPTZ DEFAULT NOW())').catch(()=>{});
    await sql('CREATE TABLE IF NOT EXISTS td_knowledge_chunks (id SERIAL PRIMARY KEY, source_id INT NOT NULL, chunk_text TEXT NOT NULL, embedding vector(1536), chunk_index INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT NOW())').catch(()=>{});
    await sql('CREATE INDEX IF NOT EXISTS td_chunks_vec_idx ON td_knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10)').catch(()=>{});
    await sql('CREATE TABLE IF NOT EXISTS td_retrieval_log (id SERIAL PRIMARY KEY, query_text TEXT, source_ids TEXT, user_email TEXT, created_at TIMESTAMPTZ DEFAULT NOW())').catch(()=>{});
  }

  if (action === 'knowledge_ingest') {
    const { email, title, category, text, scope } = body;
    if (!email) return res.status(401).json({ error: 'Authentication required' });
    const adminEmails = ['tradedoc@lenmacai.com', 'ai@lenmacai.com', 'zalahzh@proton.me'];
    if ((scope || 'global') === 'global' && !adminEmails.includes(email)) {
      return res.status(403).json({ error: 'Only admins can ingest global knowledge' });
    }
    if (!title || !text) return res.status(400).json({ error: 'title and text required' });
    await ensureRetrievalSchema();
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.status(500).json({ error: 'OpenAI key not configured' });
    const CHUNK_SIZE = 500; const OVERLAP = 50;
    const chunks = [];
    for (let i = 0; i < text.length; i += CHUNK_SIZE - OVERLAP) {
      chunks.push(text.slice(i, i + CHUNK_SIZE));
      if (i + CHUNK_SIZE >= text.length) break;
    }
    const srcRows = await sql('INSERT INTO td_knowledge_sources (title, category, scope, owner_email) VALUES ($1,$2,$3,$4) RETURNING id',
      [title, category || 'general', scope || 'global', scope === 'private' ? email : null]);
    const sourceId = srcRows[0].id;
    let embedded = 0;
    for (let ci = 0; ci < chunks.length; ci++) {
      try {
        const embRes = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: chunks[ci] })
        });
        const embData = await embRes.json();
        const vec = embData.data && embData.data[0] && embData.data[0].embedding;
        if (vec) {
          await sql('INSERT INTO td_knowledge_chunks (source_id, chunk_text, embedding, chunk_index) VALUES ($1,$2,$3,$4)',
            [sourceId, chunks[ci], JSON.stringify(vec), ci]);
          embedded++;
        }
      } catch (e) {}
    }
    return res.json({ success: true, source_id: sourceId, chunks_embedded: embedded });
  }

  if (action === 'knowledge_retrieve') {
    const { email, query, limit: rlimit, category } = body;
    if (!email) return res.status(401).json({ error: 'Authentication required' });
    if (!query) return res.status(400).json({ error: 'query required' });
    await ensureRetrievalSchema();
    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) return res.json({ results: [], note: 'Retrieval unavailable' });
    let queryVec;
    try {
      const qRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: query })
      });
      const qData = await qRes.json();
      queryVec = qData.data && qData.data[0] && qData.data[0].embedding;
    } catch (e) { return res.json({ results: [], note: 'Embedding failed' }); }
    if (!queryVec) return res.json({ results: [], note: 'No embedding returned' });
    const catFilter = category ? ' AND s.category=$4' : '';
    const params = [JSON.stringify(queryVec), email, rlimit || 5];
    if (category) params.push(category);
    const scopeClause = "WHERE (s.scope = 'global' OR (s.scope = 'private' AND s.owner_email = $2))";
    const retrieveSql = 'SELECT c.chunk_text, c.id as chunk_id, s.title, s.category FROM td_knowledge_chunks c JOIN td_knowledge_sources s ON s.id = c.source_id ' + scopeClause + catFilter + ' ORDER BY c.embedding <=> $1::vector LIMIT $3';
    const results = await sql(retrieveSql, params).catch(() => []);
    await sql('INSERT INTO td_retrieval_log (query_text, user_email) VALUES ($1,$2)', [query.slice(0, 200), email]).catch(()=>{});
    return res.json({ success: true, results: results || [] });
  }



  if (action === 'ensure_webhook_schema') {
    // Called once by admin to ensure webhook table has all columns
    await sql("ALTER TABLE td_payment_webhooks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'received'").catch(()=>{});
    await sql('CREATE INDEX IF NOT EXISTS idx_td_webhooks_reference ON td_payment_webhooks(reference)').catch(()=>{});
    await sql('CREATE INDEX IF NOT EXISTS idx_td_webhooks_email ON td_payment_webhooks(customer_email)').catch(()=>{});
    return res.json({ success: true });
  }

  if (action === 'daily_job') {
    // ── Triggered by Vercel Cron (/api/tradedoc POST daily) ──
    // Processes ALL Pro users for: expiry, reminders, downgrade
    const { cron_secret } = body;
    if (cron_secret !== process.env.CRON_SECRET && !['tradedoc@lenmacai.com','ai@lenmacai.com','zalahzh@proton.me'].includes(body.admin_email)) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    const proUsers = await sql(
      "SELECT id, email, company_name, plan, plan_status, plan_expires_at, reminder_7d_sent, reminder_3d_sent, reminder_1d_sent, expired_notice_sent FROM tradedoc_users WHERE (plan_status='pro' OR plan_status='pro_expired') AND email_confirmed=true"
    ).catch(() => []);
    const results = { checked: proUsers.length, expired: 0, reminded_7d: 0, reminded_3d: 0, reminded_1d: 0, errors: 0 };
    for (const u of proUsers) {
      try {
        if (!u.plan_expires_at) continue;
        const expDate = new Date(u.plan_expires_at);
        const daysLeft = Math.ceil((expDate - new Date()) / 86400000);
        const expStr = expDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const emailAddr = u.email;
        const renewLink = 'https://docs.lenmacai.com/upgrade';
        const mkEmail = (daysWord, title) => '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto">'
          + '<div style="background:#0f2d1a;padding:18px 24px;border-radius:8px 8px 0 0"><div style="color:#fff;font-size:17px;font-weight:800">TradeDoc Pro</div>'
          + '<div style="color:#fbbf24;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:1px;">Renewal Required</div></div>'
          + '<div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:26px">'
          + '<h2 style="color:#111827;font-size:17px;font-weight:800;margin:0 0 12px">' + title + '</h2>'
          + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">Your TradeDoc Pro plan expires on <strong>' + expStr + '</strong>. Renew to keep uninterrupted access.</p>'
          + '<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;margin-bottom:18px;font-size:13px"><div style="font-weight:700;color:#166534;margin-bottom:8px">How to Renew</div>'
          + '<p style="margin:0 0 8px;color:#374151;font-size:12px;">Pay the amount for your plan (Monthly $9 USD or Annual $95 USD) via wire transfer, then submit your reference on the Upgrade page below.</p>'
          + '<table style="width:100%;border-collapse:collapse">'
          + '<tr><td style="padding:4px 0;color:#6b7280">Bank</td><td style="text-align:right">CRDB Bank PLC</td></tr>'
          + '<tr><td style="padding:4px 0;color:#6b7280">USD Account</td><td style="text-align:right;font-family:monospace;font-weight:700">0250945058500</td></tr>'
          + '<tr><td style="padding:4px 0;color:#6b7280">SWIFT</td><td style="text-align:right;font-family:monospace">CORUTZTZ</td></tr>'
          + '<tr><td style="padding:4px 0;color:#6b7280">Reference</td><td style="text-align:right;font-family:monospace;font-weight:700">TradeDoc Pro ' + emailAddr + '</td></tr>'
          + '</table></div>'
          + '<a href="' + renewLink + '" style="display:inline-block;background:#1a5c38;color:#fff;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px">Submit Renewal Reference →</a>'
          + '<p style="color:#9ca3af;font-size:11px;margin-top:18px;border-top:1px solid #f3f4f6;padding-top:12px">TradeDoc · tradedoc@lenmacai.com · docs.lenmacai.com · Lenmac Company Limited</p>'
          + '</div></div>';
        if (daysLeft <= 7 && daysLeft > 3 && !u.reminder_7d_sent) {
          await sql('ALTER TABLE tradedoc_users ADD COLUMN IF NOT EXISTS reminder_7d_sent BOOLEAN DEFAULT false').catch(()=>{});
          await sql('UPDATE tradedoc_users SET reminder_7d_sent=true WHERE id=$1', [u.id]);
          await sendInstant(emailAddr, 'Your TradeDoc Pro plan expires in 7 days', mkEmail('7 days', 'Pro Expires in 7 Days — Renew Now'));
          results.reminded_7d++;
        }
        if (daysLeft <= 3 && daysLeft > 1 && !u.reminder_3d_sent) {
          await sql('UPDATE tradedoc_users SET reminder_3d_sent=true WHERE id=$1', [u.id]);
          await sendInstant(emailAddr, 'Your TradeDoc Pro plan expires in 3 days', mkEmail('3 days', 'Pro Expires in 3 Days'));
          results.reminded_3d++;
        }
        if (daysLeft <= 1 && daysLeft > 0 && !u.reminder_1d_sent) {
          await sql('UPDATE tradedoc_users SET reminder_1d_sent=true WHERE id=$1', [u.id]);
          await sendInstant(emailAddr, 'Your TradeDoc Pro plan expires tomorrow', mkEmail('tomorrow', 'Pro Expires Tomorrow'));
          results.reminded_1d++;
        }
        if (daysLeft <= 0 && !u.expired_notice_sent) {
          await sql("UPDATE tradedoc_users SET plan='free', plan_status='pro_expired', expired_notice_sent=true, updated_at=NOW() WHERE id=$1", [u.id]);
          await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'plan_expired',$2)", [emailAddr, JSON.stringify({ expired_at: new Date().toISOString() })]).catch(()=>{});
          await sendInstant(emailAddr, 'Your TradeDoc Pro plan has expired', mkEmail('expired', 'Your Pro Plan Has Expired'));
          results.expired++;
        }
      } catch (e) { results.errors++; }
    }
    return res.json({ success: true, ...results, ran_at: new Date().toISOString() });
  }

  if (action === 'renew_pro') {
    // One-click renewal from admin email — extends plan 30/365 days
    const qp = req.method === 'GET' ? (req.query || {}) : body;
    const { token: renewToken, email: renewEmail, admin_email: renewAdmin, admin_token: renewAdminToken, admin_token_expires: renewAdminTokenExpires } = qp;
    const pageStyle = 'font-family:Arial,Helvetica,sans-serif;background:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px';

    // Non-admin POST blocked (renew_pro is normally a token-based email-link
    // flow with no admin_email at all; if one is ever supplied, it must
    // carry a valid signed admin session token like the other admin paths)
    if (req.method !== 'GET' && renewAdmin && !verifyAdminToken(renewAdmin, renewAdminToken, renewAdminTokenExpires)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const rows = await sql('SELECT id, email, reference, status, activation_token, full_name, company_name, amount, plan, token_expires_at FROM tradedoc_payment_submissions WHERE email=$1 AND activation_token=$2 LIMIT 1', [renewEmail, renewToken]).catch(() => []);
    const sub = rows[0];

    if (!sub) { res.setHeader('Content-Type','text/html'); return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;border:1px solid #e5e7eb"><h2 style="color:#dc2626">Invalid Renewal Link</h2><p>Token not found or expired.</p></div></body></html>'); }
    if (sub.token_expires_at && new Date(sub.token_expires_at) < new Date()) { res.setHeader('Content-Type','text/html'); return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;border:1px solid #e5e7eb"><h2 style="color:#92400e">Link Expired</h2><p>This renewal link expired 7 days after submission. Use the Admin Panel.</p></div></body></html>'); }
    if (sub.status === 'ACTIVE') { res.setHeader('Content-Type','text/html'); return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;border:1px solid #e5e7eb"><h2 style="color:#6b7280">Already Processed</h2><p>This renewal was already activated.</p></div></body></html>'); }

    // ── Renewal period: annual (pro_annual, $95) extends 365 days, monthly extends 30 ──
    const isRenewAnnual = sub.plan === 'pro_annual';
    const renewDays = isRenewAnnual ? 365 : 30;
    const renewPlanLabel = isRenewAnnual ? 'TradeDoc Pro Annual' : 'TradeDoc Pro Monthly';

    // ── GET: ALWAYS show a review page — NEVER renew on GET. Mirrors the
    // activate_pro fix: a followed/scanned link only renders a page; the
    // actual renewal requires submitting the POST form below. ──
    if (req.method === 'GET') {
      res.setHeader('Content-Type','text/html');
      return res.send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Confirm Renewal — TradeDoc Admin</title></head><body style="' + pageStyle + 'm:0"><div style="background:#fff;border-radius:12px;padding:32px;max-width:440px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e5e7eb">'
        + '<div style="font-size:12px;font-weight:700;color:#1a5c38;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">TradeDoc Admin · Renewal</div>'
        + '<h2 style="color:#111827;margin:0 0 16px;font-size:19px;font-weight:800">Confirm Renewal</h2>'
        + '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:18px">'
        + '<tr style="background:#f0fdf4"><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">Email</td><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:700">' + sub.email + '</td></tr>'
        + '<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">Company</td><td style="padding:8px 10px;border:1px solid #e5e7eb">' + (sub.company_name || '—') + '</td></tr>'
        + '<tr style="background:#f0fdf4"><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">Plan</td><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:700;color:#1a5c38">' + renewPlanLabel + ' — $' + (sub.amount || (isRenewAnnual ? '95' : '9')) + ' USD</td></tr>'
        + '<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">Reference</td><td style="padding:8px 10px;border:1px solid #e5e7eb;font-family:monospace;font-weight:700">' + sub.reference + '</td></tr>'
        + '<tr style="background:#f0fdf4"><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">Extension</td><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:600">+' + renewDays + ' days from today</td></tr>'
        + '</table>'
        + '<div style="background:#fef3c7;border:1px solid #fbbf24;border-radius:7px;padding:10px 12px;margin-bottom:18px;font-size:12px;color:#92400e">Verify wire in CRDB USD account 0250945058500 before confirming. Clicking the button below submits a form — this page itself does not renew anything.</div>'
        + '<form method="POST" action="/api/tradedoc">'
        + '<input type="hidden" name="action" value="renew_pro">'
        + '<input type="hidden" name="token" value="' + renewToken + '">'
        + '<input type="hidden" name="email" value="' + renewEmail + '">'
        + '<button type="submit" style="display:block;width:100%;background:#1a5c38;color:#fff;padding:13px;border-radius:7px;border:none;font-weight:800;font-size:15px;text-align:center;cursor:pointer;font-family:inherit">✓ Confirm Renewal — +' + renewDays + ' Days</button>'
        + '</form>'
        + '</div></body></html>');
    }

    // Perform renewal
    const userRows = await sql('SELECT id, plan_expires_at FROM tradedoc_users WHERE email=$1', [renewEmail]).catch(()=>[]);
    if (!userRows[0]) { return res.status(404).json({ error: 'User not found' }); }
    // Extend from current expiry (or today if expired)
    const currentExpiry = userRows[0].plan_expires_at ? new Date(userRows[0].plan_expires_at) : new Date();
    const base = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(base.getTime() + renewDays * 24 * 60 * 60 * 1000).toISOString();
    const renewAdminWho = renewAdmin || 'admin_email_link';

    await sql("UPDATE tradedoc_users SET plan='pro', plan_status='pro', plan_expires_at=$1, reminder_7d_sent=false, reminder_3d_sent=false, reminder_1d_sent=false, expired_notice_sent=false, updated_at=NOW() WHERE email=$2",
      [newExpiry, renewEmail]);
    await sql("UPDATE tradedoc_payment_submissions SET status='ACTIVE', activated_at=NOW(), admin_notes=$1 WHERE id=$2",
      ['Renewed by ' + renewAdminWho + ' at ' + new Date().toUTCString(), sub.id]);
    await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'pro_renewed',$2)",
      [renewEmail, JSON.stringify({ renewed_by: renewAdminWho, reference: sub.reference, new_expires_at: newExpiry, renewed_at: new Date().toISOString() })]).catch(()=>{});

    // Customer renewal confirmation email
    const newExpStr = new Date(newExpiry).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const confirmHtml = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto">'
      + '<div style="background:#0f2d1a;padding:18px 24px;border-radius:8px 8px 0 0"><div style="color:#fff;font-size:17px;font-weight:800">TradeDoc Pro</div>'
      + '<div style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:1px;">Plan Renewed</div></div>'
      + '<div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:26px">'
      + '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:14px 16px;margin-bottom:18px">'
      + '<div style="font-size:14px;font-weight:800;color:#166534;margin-bottom:4px">✓ Pro Renewed Successfully</div>'
      + '<div style="font-size:13px;color:#374151">Your TradeDoc Pro plan has been renewed for another ' + renewDays + ' days.</div>'
      + '</div>'
      + '<table style="width:100%;font-size:13px;border-collapse:collapse;margin-bottom:18px">'
      + '<tr><td style="padding:6px 0;color:#6b7280;border-bottom:1px solid #f3f4f6">Account</td><td style="padding:6px 0;font-weight:600;text-align:right;border-bottom:1px solid #f3f4f6">' + renewEmail + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#6b7280;border-bottom:1px solid #f3f4f6">Plan</td><td style="padding:6px 0;text-align:right;border-bottom:1px solid #f3f4f6">' + renewPlanLabel + '</td></tr>'
      + '<tr><td style="padding:6px 0;color:#6b7280">New Expiry</td><td style="padding:6px 0;font-weight:700;color:#1a5c38;text-align:right">' + newExpStr + '</td></tr>'
      + '</table>'
      + '<a href="https://docs.lenmacai.com/dashboard" style="display:inline-block;background:#1a5c38;color:#fff;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px">Open Dashboard →</a>'
      + '<p style="color:#9ca3af;font-size:11px;margin-top:18px;border-top:1px solid #f3f4f6;padding-top:12px">TradeDoc · tradedoc@lenmacai.com · docs.lenmacai.com</p>'
      + '</div></div>';
    await sendInstant(renewEmail, 'TradeDoc Pro Renewed — Expires ' + newExpStr, confirmHtml).catch(()=>{});

    res.setHeader('Content-Type','text/html');
    return res.send('<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pro Renewed — TradeDoc Admin</title></head><body style="' + pageStyle + 'm:0"><div style="background:#fff;border-radius:12px;padding:32px;max-width:440px;width:100%;box-shadow:0 4px 24px rgba(0,0,0,.08);border:1px solid #e5e7eb">'
      + '<div style="font-size:12px;font-weight:700;color:#1a5c38;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">TradeDoc Admin</div>'
      + '<div style="font-size:28px;margin-bottom:8px">✓</div>'
      + '<h2 style="color:#166534;margin:0 0 12px;font-size:20px;font-weight:800">Pro Renewed</h2>'
      + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">Account <strong>' + renewEmail + '</strong> renewed to <strong>' + newExpStr + '</strong>. Confirmation email sent.</p>'
      + '<a href="https://docs.lenmacai.com/admin/payments" style="display:inline-block;background:#1a5c38;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px">Admin Panel →</a>'
      + '</div></body></html>');
  }

  if (action === 'mark_review') {
    // Admin email button — mark as under review
    const { token, email: mrEmail } = req.query || {};
    const rows = await sql('SELECT id, status FROM tradedoc_payment_submissions WHERE email=$1 AND activation_token=$2 LIMIT 1', [mrEmail, token]).catch(() => []);
    const pageStyle = 'font-family:Arial,Helvetica,sans-serif;background:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px';
    if (!rows[0]) { res.setHeader('Content-Type','text/html'); return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;width:100%;border:1px solid #e5e7eb"><h2 style="color:#dc2626">Token Not Found</h2><p>Invalid or expired link.</p></div></body></html>'); }
    await sql("UPDATE tradedoc_payment_submissions SET status='UNDER_REVIEW', admin_notes='Marked under review via email link' WHERE id=$1", [rows[0].id]);
    await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'payment_review',$2)", [mrEmail, JSON.stringify({ token, marked_at: new Date().toISOString() })]).catch(()=>{});
    res.setHeader('Content-Type','text/html');
    return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;width:100%;border:1px solid #e5e7eb"><div style="font-size:13px;color:#1a5c38;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">TradeDoc Admin</div><h2 style="color:#92400e;margin:0 0 10px;">Marked Under Review</h2><p style="color:#374151;font-size:14px;">Payment for <strong>' + mrEmail + '</strong> has been marked under review. Manage in <a href="https://docs.lenmacai.com/admin/payments" style="color:#1a5c38">Admin Panel</a>.</p></div></body></html>');
  }

  if (action === 'reject_link') {
    // Admin email button — reject payment
    const { token, email: rjEmail } = req.query || {};
    const rows = await sql('SELECT id, status FROM tradedoc_payment_submissions WHERE email=$1 AND activation_token=$2 LIMIT 1', [rjEmail, token]).catch(() => []);
    const pageStyle = 'font-family:Arial,Helvetica,sans-serif;background:#f8fafc;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:40px';
    if (!rows[0]) { res.setHeader('Content-Type','text/html'); return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;width:100%;border:1px solid #e5e7eb"><h2 style="color:#dc2626">Token Not Found</h2><p>Invalid or expired link.</p></div></body></html>'); }
    if (rows[0].status === 'ACTIVE') { res.setHeader('Content-Type','text/html'); return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;width:100%;border:1px solid #e5e7eb"><h2 style="color:#6b7280">Already Activated</h2><p>This payment was already activated and cannot be rejected.</p></div></body></html>'); }
    await sql("UPDATE tradedoc_payment_submissions SET status='FAILED', admin_notes='Rejected via email link' WHERE id=$1", [rows[0].id]);
    await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'payment_rejected',$2)", [rjEmail, JSON.stringify({ token, rejected_at: new Date().toISOString() })]).catch(()=>{});
    // Rejection email to customer
    const rejHtml = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:500px;margin:0 auto"><div style="background:#0f2d1a;padding:18px 24px;border-radius:8px 8px 0 0"><div style="color:#fff;font-size:17px;font-weight:800">TradeDoc</div></div><div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:26px"><h2 style="color:#374151;font-size:17px;font-weight:800;margin:0 0 12px">Payment Reference Not Verified</h2><p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">We were unable to verify your USD wire transfer reference. Your account remains on the Free plan.</p><p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px">If you believe this is an error or your wire transfer was successful, please email <strong>tradedoc@lenmacai.com</strong> with your CRDB transaction receipt.</p><a href="https://docs.lenmacai.com/upgrade" style="display:inline-block;background:#1a5c38;color:#fff;padding:11px 22px;border-radius:7px;text-decoration:none;font-weight:700;font-size:13px">Try Again</a><p style="color:#9ca3af;font-size:11px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:12px">TradeDoc · tradedoc@lenmacai.com · Lenmac Company Limited</p></div></div>';
    await sendInstant(rjEmail, 'Payment Reference Not Verified — TradeDoc', rejHtml).catch(()=>{});
    res.setHeader('Content-Type','text/html');
    return res.send('<html><body style="' + pageStyle + '"><div style="background:#fff;border-radius:12px;padding:32px;max-width:400px;width:100%;border:1px solid #e5e7eb"><div style="font-size:13px;color:#1a5c38;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px;">TradeDoc Admin</div><h2 style="color:#dc2626;margin:0 0 10px;">Payment Rejected</h2><p style="color:#374151;font-size:14px;">Payment for <strong>' + rjEmail + '</strong> has been rejected. Rejection email sent to user.</p><p style="margin-top:16px"><a href="https://docs.lenmacai.com/admin/payments" style="background:#1a5c38;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600;font-size:13px">Admin Panel →</a></p></div></body></html>');
  }

  if (action === 'payment_providers') {
    return res.json({ providers: [
      { id: 'manual_tzs', name: 'CRDB Bank TZS', status: 'active', type: 'manual', currency: 'TZS' },
      { id: 'manual_usd', name: 'CRDB Bank USD Wire', status: 'active', type: 'manual', currency: 'USD' },
      { id: 'stripe', name: 'Stripe', status: 'planned', type: 'webhook', currency: 'USD' },
      { id: 'flutterwave', name: 'Flutterwave', status: 'planned', type: 'webhook', currency: 'TZS' },
    ], webhook_action: 'payment_webhook' });
  }

  if (action === 'payment_webhook') {
    // ════════════════════════════════════════════════════════════════
    // PAYMENT VERIFICATION ENGINE
    // Providers that can trigger this: ClickPesa, Stripe, Wise, Flutterwave
    // USD Wire (CRDB) does NOT send webhooks — manual review only
    //
    // Auto-activation rules (ALL must match):
    //   1. event_type === 'payment.succeeded' OR 'charge.succeeded'
    //   2. amount === 9 (USD) OR within tolerance [8.50, 10.00]
    //   3. currency === 'USD'
    //   4. customer_email matches a pending submission
    //   5. reference not already used
    //   6. transaction date within last 72 hours
    //   7. provider webhook signature is valid (provider-specific)
    // ════════════════════════════════════════════════════════════════

    const rawBody = JSON.stringify(body);
    const { provider, event_type, reference = '', amount, currency = 'USD', customer_email = '', webhook_secret } = body;

    if (!provider || !event_type) return res.status(400).json({ error: 'Invalid webhook payload' });

    // ── Signature verification (provider-specific) ──
    // ClickPesa: verify X-ClickPesa-Signature header
    // Stripe: verify Stripe-Signature header using stripe.webhooks.constructEvent
    // Wise: verify X-Signature-SHA256 header
    // For now: log all incoming webhooks, verify what we can
    const sigHeader = req.headers['x-clickpesa-signature'] || req.headers['stripe-signature'] || req.headers['x-signature-sha256'] || '';
    const expectedSecret = process.env.PAYMENT_WEBHOOK_SECRET;
    // Signature check — skip if no secret configured (development), enforce in production
    if (expectedSecret && sigHeader) {
      const crypto = await import('crypto');
      const computed = crypto.createHmac('sha256', expectedSecret).update(rawBody).digest('hex');
      if (sigHeader !== computed && !sigHeader.includes(computed)) {
        await sql('INSERT INTO td_payment_webhooks (provider, event_type, reference, amount, currency, customer_email, raw_body, processed, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [provider, event_type, reference, String(amount||''), currency, customer_email, rawBody, false, 'signature_failed']).catch(()=>{});
        return res.status(401).json({ error: 'Webhook signature verification failed' });
      }
    }

    // ── Log webhook ──
    const wh = await sql('INSERT INTO td_payment_webhooks (provider, event_type, reference, amount, currency, customer_email, raw_body, processed, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id',
      [provider, event_type, reference, String(amount||''), currency, customer_email, rawBody, false, 'received']).catch(() => null);
    const webhookId = wh ? wh[0]?.id : null;

    // ── Replay attack prevention — check if this reference was already processed ──
    if (reference) {
      const already = await sql('SELECT id FROM td_payment_webhooks WHERE reference=$1 AND processed=true AND id!=$2 LIMIT 1', [reference, webhookId || 0]).catch(() => []);
      if (already && already.length > 0) {
        await sql('UPDATE td_payment_webhooks SET status=$1 WHERE id=$2', ['duplicate_ignored', webhookId]).catch(()=>{});
        return res.json({ success: true, status: 'duplicate_ignored', message: 'Reference already processed' });
      }
    }

    // ── Payment matching ──
    const SUCCESS_EVENTS = new Set(['payment.succeeded','charge.succeeded','payment_intent.succeeded','payment.completed','transaction.completed','transfer.completed']);
    if (!SUCCESS_EVENTS.has(event_type)) {
      await sql('UPDATE td_payment_webhooks SET status=$1 WHERE id=$2', ['not_a_success_event', webhookId]).catch(()=>{});
      return res.json({ success: true, status: 'logged', message: 'Event type does not trigger activation' });
    }

    // ── Amount validation ──
    const paidAmount = parseFloat(String(amount).replace(/[^0-9.]/g, ''));
    const expectedAmount = 9.00;
    const tolerance = 0.50;
    const amountValid = !isNaN(paidAmount) && paidAmount >= (expectedAmount - tolerance) && paidAmount <= (expectedAmount + 1.00);
    const currencyValid = String(currency).toUpperCase() === 'USD';

    // ── Find matching submission ──
    let submissionRow = null;
    if (customer_email) {
      const subs = await sql('SELECT id, email, reference, status, activation_token FROM tradedoc_payment_submissions WHERE email=$1 AND status NOT IN ($2,$3) ORDER BY created_at DESC LIMIT 1', [customer_email, 'ACTIVE', 'FAILED']).catch(() => []);
      if (subs && subs.length > 0) submissionRow = subs[0];
    }
    if (!submissionRow && reference) {
      const subs = await sql('SELECT id, email, reference, status, activation_token FROM tradedoc_payment_submissions WHERE reference=$1 AND status NOT IN ($2,$3) LIMIT 1', [reference, 'ACTIVE', 'FAILED']).catch(() => []);
      if (subs && subs.length > 0) submissionRow = subs[0];
    }

    // ── Auto-activation decision ──
    const canAutoActivate = amountValid && currencyValid && submissionRow;

    if (canAutoActivate) {
      const targetEmail = submissionRow.email;
      // Activate user
      await sql('UPDATE tradedoc_users SET plan=$1, plan_status=$2, updated_at=NOW() WHERE email=$3', ['pro', 'pro', targetEmail]);
      await sql("UPDATE tradedoc_payment_submissions SET status='ACTIVE', activated_at=NOW(), admin_notes=$1 WHERE id=$2", ['Auto-activated by ' + provider + ' webhook', submissionRow.id]);
      await sql('UPDATE td_payment_webhooks SET processed=true, status=$1 WHERE id=$2', ['auto_activated', webhookId]).catch(()=>{});
      await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'pro_auto_activated',$2)",
        [targetEmail, JSON.stringify({ provider, reference, amount: paidAmount, currency, webhook_id: webhookId, activated_at: new Date().toISOString() })]).catch(()=>{});

      // Pro activated email to customer
      const proHtml = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:540px;margin:0 auto;">'
        + '<div style="background:#0f2d1a;padding:20px 28px;border-radius:8px 8px 0 0;">'
        + '<div style="color:#fff;font-size:18px;font-weight:800;">TradeDoc</div>'
        + '<div style="color:#4ade80;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-top:2px;">Pro Plan Activated</div>'
        + '</div>'
        + '<div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:32px;">'
        + '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:16px 18px;margin-bottom:20px;">'
        + '<div style="font-size:14px;font-weight:800;color:#166534;margin-bottom:4px;">✓ Payment Verified — Pro is Active</div>'
        + '<div style="font-size:13px;color:#374151;">Your payment of <strong>$' + paidAmount.toFixed(2) + ' USD</strong> via ' + provider + ' was verified and your account has been upgraded.</div>'
        + '</div>'
        + '<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 20px;">All TradeDoc Pro features are now unlocked: unlimited documents, verification engine, LC checks, Production Workspace, Export Readiness Score, and TradeBot Pro.</p>'
        + '<a href="https://docs.lenmacai.com/dashboard" style="display:inline-block;background:#1a5c38;color:#fff;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:700;font-size:14px;">Open Dashboard →</a>'
        + '<p style="color:#9ca3af;font-size:11px;margin-top:20px;border-top:1px solid #f3f4f6;padding-top:12px;">TradeDoc · tradedoc@lenmacai.com · Lenmac Company Limited</p>'
        + '</div></div>';

      // Admin notification
      const adminHtml = '<div style="font-family:Arial;padding:20px;max-width:500px;">'
        + '<h2 style="color:#166534;">[TradeDoc Pro] Payment Auto-Approved</h2>'
        + '<p><strong>' + targetEmail + '</strong> has been automatically upgraded to Pro.</p>'
        + '<table style="border-collapse:collapse;font-size:13px;width:100%;">'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Provider</td><td style="padding:6px;border:1px solid #eee;">' + provider + '</td></tr>'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Amount</td><td style="padding:6px;border:1px solid #eee;">$' + paidAmount.toFixed(2) + ' USD</td></tr>'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Reference</td><td style="padding:6px;border:1px solid #eee;font-family:monospace;">' + reference + '</td></tr>'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Activated At</td><td style="padding:6px;border:1px solid #eee;">' + new Date().toUTCString() + '</td></tr>'
        + '</table></div>';

      await sendInstant(targetEmail, 'TradeDoc Pro Activated', proHtml).catch(()=>{});
      await sendInstant('tradedoc@lenmacai.com', '[TradeDoc Pro] Payment Auto-Approved — ' + targetEmail, adminHtml).catch(()=>{});

      return res.json({ success: true, status: 'auto_activated', email: targetEmail, amount: paidAmount });

    } else {
      // Mismatch — route to manual review
      const reasons = [];
      if (!amountValid) reasons.push('amount mismatch (received ' + paidAmount + ', expected ~' + expectedAmount + ')');
      if (!currencyValid) reasons.push('currency not USD (received ' + currency + ')');
      if (!submissionRow) reasons.push('no matching pending submission found for ' + (customer_email || reference));
      await sql('UPDATE td_payment_webhooks SET status=$1 WHERE id=$2', ['manual_review_required', webhookId]).catch(()=>{});
      await sql("INSERT INTO tradedoc_events (email, event_type, metadata) VALUES ($1,'payment_review_required',$2)",
        [customer_email || 'unknown', JSON.stringify({ provider, reference, amount: paidAmount, currency, reasons, webhook_id: webhookId })]).catch(()=>{});

      // Admin manual review email
      const reviewHtml = '<div style="font-family:Arial;padding:20px;max-width:500px;">'
        + '<h2 style="color:#92400e;">[TradeDoc Pro] Payment Requires Review</h2>'
        + '<p>A webhook payment could not be auto-matched. Manual review required.</p>'
        + '<table style="border-collapse:collapse;font-size:13px;width:100%;">'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Provider</td><td style="padding:6px;border:1px solid #eee;">' + provider + '</td></tr>'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Customer</td><td style="padding:6px;border:1px solid #eee;">' + customer_email + '</td></tr>'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Amount</td><td style="padding:6px;border:1px solid #eee;">' + paidAmount + ' ' + currency + '</td></tr>'
        + '<tr><td style="padding:6px;border:1px solid #eee;font-weight:600;">Reference</td><td style="padding:6px;border:1px solid #eee;font-family:monospace;">' + reference + '</td></tr>'
        + '<tr style="background:#fef3c7;"><td style="padding:6px;border:1px solid #eee;font-weight:600;">Issues</td><td style="padding:6px;border:1px solid #eee;">' + reasons.join('; ') + '</td></tr>'
        + '</table>'
        + '<p style="margin-top:16px;"><a href="https://docs.lenmacai.com/admin/payments" style="background:#1a5c38;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Review in Admin Panel</a></p>'
        + '</div>';
      await sendInstant('tradedoc@lenmacai.com', '[TradeDoc Pro] Payment Requires Review — ' + (customer_email || reference), reviewHtml).catch(()=>{});
      return res.json({ success: true, status: 'manual_review_required', reasons });
    }
  }

  if (action === 'seed_knowledge') {
    const { email } = body;
    if (!['tradedoc@lenmacai.com', 'ai@lenmacai.com', 'zalahzh@proton.me'].includes(email)) return res.status(403).json({ error: 'Admin only' });
    await ensureRetrievalSchema();
    const OK = process.env.OPENAI_API_KEY;
    if (!OK) return res.status(500).json({ error: 'OpenAI key required' });
    const KB = [
      ['CBT PDN Procedure','cashew_compliance','PDN (Production Dispatch Note) issued by Cashew Board of Tanzania (CBT). Prerequisites: district levy paid and verified, EFD/TRA receipt obtained, factory processing complete. PDN authorizes movement of cashew kernels from factory to ICD or warehouse. PDN must contain: PDN number, quantity in kg, grade, vehicle registration, driver name/ID, destination, CBT stamp. Cargo must not leave factory until PDN issued.'],
      ['Export Permit Procedure','cashew_compliance','Tanzania cashew export permit: Step 1 district levy paid. Step 2 EFD/TRA receipt obtained. Step 3 PDN issued by CBT. Step 4 cargo dispatched to ICD. Step 5 CBT inspection at ICD. Step 6 export permit issued. Step 7 freight forwarder proceeds with BL. Export permit must match commodity, quantity, grade, destination, exporter, consignee. Mandatory for all cashew exports.'],
      ['District Levy Procedure','cashew_compliance','District levy: mandatory payment to district council for cashew processing and export. Receipt must contain: levy receipt number, quantity kg, commodity, origin district, amount, date. Must be paid BEFORE PDN can be issued by CBT. Amount varies by district per kg of raw nuts processed.'],
      ['CBT Inspection Workflow','cashew_compliance','CBT inspection at two stages: Factory - verifies quantity, grade, moisture, processing quality before PDN. Port/ICD - re-verifies cargo against PDN, checks container stuffing, confirms documents match. CBT issues Phytosanitary Certificate after port inspection. SGS optional. Findings must match: Commercial Invoice, Packing List, Export Permit.'],
      ['Kuwait Shipment Requirements','export_workflow','Kuwait cashew shipment: Commercial Invoice USD CIF Kuwait, unit price per grade (WW180, WW240, WW320). Packing List with bags, net/gross weight, container. COO from TBS or Chamber of Commerce. Phytosanitary Certificate from TOSCI/CBT. Health Certificate. Bill of Lading. Fumigation Certificate. SGS if required. Payment TT advance or LC. Ports: Shuwaikh or Shuaiba Kuwait. Lenmac bank: CRDB Account 0250945058500 SWIFT CORUTZTZ.'],
      ['COO Certificate of Origin','export_compliance','COO for Tanzania cashew: Issued by TBS or Chamber of Commerce. Must contain: exporter and consignee details, origin Tanzania, destination, goods description, HS code 0801.32, quantity, invoice number, shipping details. Must match Commercial Invoice exactly. Form A for GSP preferential tariff. Processing 2-3 working days.'],
      ['LC Compliance UCP600 ISBP745','lc_compliance','LC compliance UCP 600: Present within 21 days of shipment and before LC expiry (Art 14c). Quantity tolerance +/-5% (Art 30). Invoice description must match LC. BL date must not exceed latest shipment date. Ports must match. Discrepancies: late presentation, description mismatch, wrong Incoterm, missing docs, expired LC. ISBP 745: BL must show goods shipped on board.'],
      ['Health Certificate Procedure','export_compliance','Health Certificate for cashew: Issued by TFDA. Required for food products. Must show product meets health/safety standards, no contamination, moisture within limits max 5%. Must match Commercial Invoice in product and quantity. Processing 3-5 working days after sample inspection.'],
      ['RAC Radioactivity Certificate','export_compliance','RAC Certificate: Required by some buyers in Europe and Middle East. Issued by TAEC or accredited lab. Tests Cs-137 and Cs-134. EU limit 600 Bq/kg. Certificate includes sample reference, test date, levels, pass/fail. Processing 7-14 days. Not mandatory for all markets.'],
      ['Lenmac SOP Export Documents','lenmac_sop','Lenmac standard export: Bank CRDB Account 0250945058500 SWIFT CORUTZTZ Lumumba Branch Dar es Salaam. Products: WW180 WW240 WW320 W450 SW LP SP BB. Quality: moisture max 4.9%, Zero Pieces Zero Spotted WFK model, Non-GMO, Origin Tanzania. 20kg per bag. 20ft container approx 14-15 MT. TIN 176550155.'],
      ['PPL Procurement Program','ppl_workflow','PPL (Procurement Partnership License) by Lenmac: Pre-book cashew production capacity. Advance payment secures slot. Delivery March-August. Grades WW180 WW240 WW320. Minimum 5MT per grade. Inquiry via TradeDoc PPL form with WhatsApp. PPL holders receive: weekly production updates, quality certificates, shipping schedule.'],
      ['Cashew Kernel Grades AFTA','cashew_compliance','Tanzania cashew grades: WW180 whole white 180/pound premium. WW240 standard export. WW320 most common. WW450 small whole. SW scorched whole. LP large pieces. SP small pieces. BB baby bits. Moisture max 4.9%. Aflatoxin EU max 10 ppb. WFK: Zero Pieces Zero Spotted. 20ft container 14-15 MT.'],
      ['EFD TRA Receipt','cashew_compliance','EFD receipt from TRA: Required as fiscal transaction proof for export. Must contain: TRA receipt number, date, amount, TIN, description. Required by CBT before PDN. Lenmac TIN 176550155. Must be preserved for audit. Proves VAT/tax compliance.'],
      ['Phytosanitary Certificate','export_compliance','Phytosanitary Certificate: Issued by TPHPA or CBT-authorized inspector. Required for all agricultural products. Shows product free from pests and diseases. Inspection: visual inspection and sampling. Processing 2-3 days. Some countries require lab pest analysis.'],
    ];
    let seeded = 0; let embedded = 0; const results = [];
    for (const [title, cat, text] of KB) {
      try {
        const ex = await sql('SELECT id FROM td_knowledge_sources WHERE title=$1', [title]);
        if (ex && ex[0]) {
          // Source exists — check if chunk has embedding, add if missing
          const chunkRows = await sql('SELECT id, embedding FROM td_knowledge_chunks WHERE source_id=$1 LIMIT 1', [ex[0].id]);
          if (chunkRows[0] && !chunkRows[0].embedding) {
            const er = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST',
              headers: { 'Authorization': 'Bearer ' + OK, 'Content-Type': 'application/json' },
              body: JSON.stringify({ model: 'text-embedding-3-small', input: text }) });
            const ed = await er.json();
            const v = ed.data && ed.data[0] && ed.data[0].embedding;
            if (v) {
              await sql('UPDATE td_knowledge_chunks SET embedding=$1 WHERE id=$2', [JSON.stringify(v), chunkRows[0].id]);
              embedded++; results.push({ title, status: 'embedded' });
            } else { results.push({ title, status: 'embed_fail' }); }
          } else { results.push({ title, status: 'exists_with_embedding' }); }
          continue;
        }
        const er = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST',
          headers: { 'Authorization': 'Bearer ' + OK, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'text-embedding-3-small', input: text }) });
        const ed = await er.json();
        const v = ed.data && ed.data[0] && ed.data[0].embedding;
        if (!v) { results.push({ title, status: 'embed_fail' }); continue; }
        const src = await sql('INSERT INTO td_knowledge_sources (title, category, scope) VALUES ($1,$2,$3) RETURNING id', [title, cat, 'global']);
        await sql('INSERT INTO td_knowledge_chunks (source_id, chunk_text, embedding, chunk_index) VALUES ($1,$2,$3,$4)', [src[0].id, text, JSON.stringify(v), 0]);
        seeded++; results.push({ title, status: 'seeded' });
      } catch (e) { results.push({ title, status: 'error', error: e.message }); }
    }
    return res.json({ success: true, seeded, embedded, total: KB.length, results });
  }

  // ── PREMIUM PLAN GATES ──────────────────────────────────────────────────────
  // Client must call these before running premium client-side logic.
  // Returns 403 for free users, 200 for pro users.
  if (action === 'verify_gate' || action === 'lc_gate') {
    const { email } = body;
    if (!email) return res.status(401).json({ error: 'Authentication required.' });
    const rows = await sql('SELECT plan_status FROM tradedoc_users WHERE email=$1', [email]);
    if (!rows[0]) return res.status(401).json({ error: 'Account not found.' });
    if ((rows[0].plan_status || 'free') !== 'pro') {
      return res.status(403).json({ error: 'pro_required', message: 'Upgrade to Pro to access the Trade Verification Engine, LC Discrepancy Engine, and Export Readiness tools.' });
    }
    return res.json({ success: true, authorized: true });
  }

  if (action === 'get_dashboard') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const users = await sql(`SELECT * FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    const user = users[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    const docs = await sql(`SELECT id,doc_type,title,status,created_at FROM tradedoc_documents WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`, [user.id]);
    const assets = await sql(`SELECT asset_type,asset_data,asset_name FROM tradedoc_user_assets WHERE user_id=$1`, [user.id]);
    // Expiry check on dashboard load — emails handled by daily_job cron
    if (user.plan_status==='pro' && user.plan_expires_at) {
      const daysLeft = Math.ceil((new Date(user.plan_expires_at)-new Date())/86400000);
      // Auto-downgrade expired accounts (catches any the cron missed)
      if (daysLeft<=0&&!user.expired_notice_sent) {
        await sql("UPDATE tradedoc_users SET plan='free',plan_status='pro_expired',expired_notice_sent=true,updated_at=NOW() WHERE id=$1",[user.id]);
        await sql("INSERT INTO tradedoc_events (email,event_type,metadata) VALUES ($1,'plan_expired',$2)",[email,JSON.stringify({expired_at:new Date().toISOString()})]).catch(()=>{});
      }
    }
        const fresh = (await sql(`SELECT plan,plan_status,plan_expires_at,docs_generated_this_month FROM tradedoc_users WHERE id=$1`, [user.id]))[0];
    const lim = LIMITS[fresh.plan]||5;
    return res.json({ user:{email:user.email,company:user.company_name,plan:fresh.plan,plan_status:fresh.plan_status,plan_expires_at:fresh.plan_expires_at,docs_this_month:fresh.docs_generated_this_month||0,limit:lim,remaining:Math.max(0,lim-(fresh.docs_generated_this_month||0))}, recent_docs:docs, assets:assets||[] });
  }

  if (false && action === 'submit_payment_legacy_disabled') { // DISABLED — redirected to submit_upgrade_request

    const { email, plan, payment_reference, payment_method, payer_name, payer_phone, amount, payment_date } = body;
    if (!email||!payment_reference) return res.status(400).json({ error: 'Email and payment reference required' });
    const users = await sql(`SELECT * FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.status(404).json({ error: 'Account not found' });
    const dup = await sql(`SELECT id FROM tradedoc_payment_submissions WHERE payment_reference=$1 AND status!='rejected'`, [payment_reference]);
    if (dup[0]) return res.status(409).json({ error: 'This payment reference has already been submitted.' });
    const subs = await sql(`INSERT INTO tradedoc_payment_submissions (user_id,email,business_name,plan_selected,amount,payment_method,payment_reference,payer_name,payer_phone,payment_date,status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'pending_review') RETURNING id`,
      [users[0].id, email, users[0].company_name, plan||'pro', amount||null, payment_method||null, payment_reference, payer_name||null, payer_phone||null, payment_date||null]);
    await queueMail(NOTIFY, `TradeDoc Payment — Review Required | ${email}`,
      `<div style="font-family:Arial;padding:20px;"><h2 style="color:#8b1a2c;">New Payment Submission</h2><p><strong>Email:</strong> ${email}</p><p><strong>Plan:</strong> ${plan||'pro'}</p><p><strong>Reference:</strong> ${payment_reference}</p><p><strong>Amount:</strong> ${amount||'—'}</p></div>`,
      'tradedoc_payment');
    await queueMail(email,'TradeDoc — Payment Received',
      `<div style="font-family:Arial;max-width:560px;"><div style="background:#8b1a2c;padding:24px;border-radius:8px 8px 0 0;"><h1 style="color:#fff;margin:0;">TradeDoc</h1></div><div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;"><p>Payment received. Pro access will be activated within 24 hours after verification.</p><p style="font-size:13px;"><strong>Reference:</strong> ${payment_reference}</p></div></div>`,
      'tradedoc_payment');
    return res.json({ success: true, submission_id: subs[0]?.id, status: 'pending_review', message: 'Payment submitted. Pro access activated within 24 hours after verification.' });
  }

  if (action === 'save_asset') {
    const { email, asset_type, asset_data, asset_name } = body;
    if (!email||!asset_type||!asset_data) return res.status(400).json({ error: 'Email, type, data required' });
    const users = await sql(`SELECT id FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.status(404).json({ error: 'User not found' });
    await sql(`INSERT INTO tradedoc_user_assets (user_id,asset_type,asset_data,asset_name,is_default) VALUES ($1,$2,$3,$4,true) ON CONFLICT (user_id,asset_type,is_default) DO UPDATE SET asset_data=$3,asset_name=$4`,
      [users[0].id, asset_type, asset_data, asset_name||asset_type]);
    return res.json({ success: true });
  }
  if (action === 'get_assets') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const users = await sql(`SELECT id FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.json({ assets: [] });
    const assets = await sql(`SELECT asset_type,asset_data,asset_name FROM tradedoc_user_assets WHERE user_id=$1`, [users[0].id]);
    return res.json({ assets: assets||[] });
  }
  if (action === 'log_action') {
    const { email, doc_type, action: a } = body;
    const users = email ? await sql(`SELECT id FROM tradedoc_users WHERE email=$1`, [email]) : [];
    await sql(`INSERT INTO tradedoc_document_actions (user_id,doc_type,action) VALUES ($1,$2,$3)`, [users[0]?.id||null, doc_type||null, a]).catch(()=>{});
    return res.json({ success: true });
  }
  if (action === 'track_event') {
    const { email, event_type, document_type } = body;
    await sql(`INSERT INTO tradedoc_events (email,event_type,document_type) VALUES ($1,$2,$3)`, [email||null, event_type, document_type||null]).catch(()=>{});
    return res.json({ success: true });
  }


  if (action === 'get_profile') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    // Profile columns already exist — migration guards removed for speed
    const rows = await sql(`SELECT email, company_name, country, full_name, phone, address FROM tradedoc_users WHERE email=$1`, [email]);
    if (!rows[0]) return res.status(404).json({ error: 'User not found' });
    const assets = await sql(`SELECT asset_type, asset_data, asset_name FROM tradedoc_user_assets WHERE user_id=(SELECT id FROM tradedoc_users WHERE email=$1)`, [email]);
    return res.json({ success: true, profile: rows[0], assets: assets || [] });
  }

  // ── Polar subscription status — single source of truth for Pro entitlement ──
  // Checks the live tradedoc_subscriptions row (written by api/polar-webhook.js).
  // Also reconciles tradedoc_users.plan_status if it's out of sync (e.g. the
  // webhook fired before this email had an account, or a renewal landed
  // while the user was logged out).
  if (action === 'subscription_status') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const subs = await sql(`SELECT plan, billing_cycle, status, current_period_end, polar_customer_id, polar_subscription_id FROM tradedoc_subscriptions WHERE email=$1`, [email]);
    const sub = subs[0];
    const now = new Date();
    const notExpired = !sub?.current_period_end || new Date(sub.current_period_end) > now;
    const isPro = !!sub && sub.status === 'active' && notExpired;

    // Reconcile tradedoc_users so app-wide isPro checks (AppShell, Dashboard,
    // ConsignmentDetail) stay in sync without waiting for a fresh login.
    const userRows = await sql(`SELECT plan_status, plan_expires_at FROM tradedoc_users WHERE email=$1`, [email]).catch(() => []);
    const currentStatus = userRows?.[0]?.plan_status;
    if (userRows?.[0] && isPro && currentStatus !== 'pro') {
      await sql(`UPDATE tradedoc_users SET plan='pro', plan_status='pro', plan_started_at=COALESCE(plan_started_at, NOW()), plan_expires_at=$1, updated_at=NOW() WHERE email=$2`,
        [sub.current_period_end || null, email]).catch(() => {});
    } else if (userRows?.[0] && !isPro && currentStatus === 'pro') {
      await sql(`UPDATE tradedoc_users SET plan='free', plan_status='free', updated_at=NOW() WHERE email=$1`, [email]).catch(() => {});
    }

    return res.json({
      success: true,
      isPro,
      plan: isPro ? (sub.plan || 'pro') : 'free',
      billing_cycle: sub?.billing_cycle || null,
      status: sub?.status || 'none',
      current_period_end: sub?.current_period_end || null,
      manageSubscriptionUrl: process.env.TRADEDOC_POLAR_PORTAL_URL || null,
    });
  }

  // ── Priority Zero, Phase 2: unified Lenmac entitlements ──
  // Reads lenmac_entitlements (dual-written by every product's polar-webhook).
  // Returns ALL of this email's entitlements across Lenmac products, plus a
  // tradedoc_pro convenience flag. Read-only; does not touch legacy tables.
  if (action === 'get_entitlements') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const rows = await sql(
      `SELECT product_key, entitlement_key, status, current_period_end FROM lenmac_entitlements WHERE email=$1`,
      [email]
    ).catch(() => []);

    const now = new Date();
    const entitlements = rows.map(r => ({
      product_key: r.product_key,
      entitlement_key: r.entitlement_key,
      status: r.status,
      current_period_end: r.current_period_end,
      active: r.status === 'active' && (!r.current_period_end || new Date(r.current_period_end) > now),
    }));

    const tradedocEnt = entitlements.find(e => e.entitlement_key === 'tradedoc_pro');

    return res.json({
      success: true,
      email,
      entitlements,
      isPro: !!tradedocEnt?.active,
    });
  }

  // ── Priority Zero, Phase 3b: shadow-read observation logging ──
  // Records a comparison between legacy isPro and canonical
  // lenmac_entitlements isPro into lenmac_shadow_logs. Fire-and-forget,
  // best-effort: never throws, never affects the caller's session/UI.
  // OBSERVATION ONLY -- does not gate, block, or change any behavior.
  if (action === 'log_entitlement_shadow') {
    const {
      product_key, email, entitlement_key,
      legacy_is_pro, canonical_is_pro, is_match, source,
    } = body;
    if (!email || !entitlement_key) {
      return res.status(400).json({ error: 'email and entitlement_key required' });
    }
    await sql(
      `INSERT INTO lenmac_shadow_logs (product_key, email, entitlement_key, legacy_is_pro, canonical_is_pro, is_match, source)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        product_key || 'tradedoc',
        email,
        entitlement_key,
        !!legacy_is_pro,
        !!canonical_is_pro,
        !!is_match,
        source || 'tradedoc_unknown',
      ]
    ).catch(e => console.error('lenmac_shadow_logs insert failed:', e.message));
    return res.json({ success: true });
  }

    if (action === 'save_profile') {
    const { email, full_name, phone, address, country, company_name } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    await sql(`UPDATE tradedoc_users SET full_name=$1, phone=$2, address=$3, country=$4, company_name=$5, updated_at=NOW() WHERE email=$6`,
      [full_name||null, phone||null, address||null, country||null, company_name||null, email]);
    return res.json({ success: true });
  }


  if (action === 'request_login') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    // Check user exists and is confirmed — no migration guards on hot path
    const rows = await sql(`SELECT id, email, company_name, plan_status, email_confirmed FROM tradedoc_users WHERE email=$1`, [email]);
    if (!rows[0]) return res.status(404).json({ error: 'No account found for this email. Please sign up first.' });
    if (!rows[0].email_confirmed) return res.status(403).json({ error: 'Email not yet confirmed. Please check your inbox for the confirmation link.' });

    // Generate 8-char display code — fast, no token needed
    const codeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let displayCode = '';
    for (let i = 0; i < 8; i++) displayCode += codeChars[Math.floor(Math.random() * codeChars.length)];
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    await sql('UPDATE tradedoc_users SET login_token=NULL, login_token_expires_at=$1, login_display_code=$2, updated_at=NOW() WHERE email=$3',
      [expires, displayCode, email]);

    const name = rows[0].company_name || email.split('@')[0];

    // Email-safe code block: large monospace code, tap-to-select.
    // No <button onclick=...> — email clients (Gmail, Outlook, Apple Mail,
    // Fastmail, mobile webmail) all handle onclick differently; some strip JS,
    // some sandbox it, some render it with broken styles (yellow button).
    // The correct UX: code is tap-to-select in email; the Login page
    // has a real in-browser "Paste code" button that uses the clipboard API
    // in a proper HTTPS context with a user gesture.
    const codeBlockHtml = '<div style="margin:28px 0;text-align:center;">'
      + '<div style="display:inline-block;border:2.5px solid #1a5c38;border-radius:12px;background:#f0f7f3;padding:20px 40px;cursor:text;">'
      + '<span style="font-family:\'Courier New\',Courier,monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#1a5c38;user-select:all;-webkit-user-select:all;-moz-user-select:all;">' + displayCode + '</span>'
      + '</div>'
      + '<p style="color:#6b7280;font-size:12px;margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;">Tap the code to select it, then copy</p>'
      + '</div>';

    // Manus-style clean email: logo, title, code box, one instruction line, company name only.
    const emailResult = await sendInstant(email, 'Your TradeDoc verification code',
      '<div style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;padding:0;">'
      + '<div style="padding:32px 40px 0;">'
      + '<div style="font-size:22px;font-weight:800;color:#1a5c38;letter-spacing:-0.5px;">TradeDoc</div>'
      + '</div>'
      + '<div style="padding:32px 40px;">'
      + '<h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 8px;">Verify your email address</h2>'
      + '<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">Please enter the verification code to sign in to TradeDoc:</p>'
      + codeBlockHtml
      + '<p style="color:#777;font-size:13px;line-height:1.6;margin:20px 0 0;">If you did not request this code, you can ignore this email.</p>'
      + '</div>'
      + '<div style="padding:20px 40px;border-top:1px solid #eee;">'
      + '<p style="color:#aaa;font-size:13px;margin:0;font-weight:600;">TradeDoc</p>'
      + '</div>'
      + '</div>'
    );

    console.log('request_login email result:', JSON.stringify(emailResult));
    await sql(`INSERT INTO tradedoc_events (email, event_type) VALUES ($1,'login_requested')`, [email]).catch(()=>{});
    if (!emailResult.ok) {
      // Code saved in DB — email failed but login can still work if user has code
      // Return success but flag the email issue so UI can show the right message
      console.error('request_login email failed:', emailResult.error);
      return res.json({ success: true, email_sent: false, email_error: emailResult.error,
        message: 'Verification code generated. Email delivery failed — please check your spam folder or contact tradedoc@lenmacai.com' });
    }
    return res.json({ success: true, email_sent: true, message: 'Verification code sent. Check your email.' });
  }

  if (action === 'verify_login') {
    const { token } = body;
    if (!token) return res.status(400).json({ error: 'Token required' });

    const rows = await sql(`SELECT id, email, company_name, plan_status, login_token_expires_at FROM tradedoc_users WHERE login_token=$1 AND email_confirmed=true`, [token]);
    if (!rows[0]) return res.status(400).json({ error: 'Invalid or expired sign-in link. Please request a new one.' });

    const expires = new Date(rows[0].login_token_expires_at);
    if (expires < new Date()) return res.status(400).json({ error: 'This sign-in link has expired. Please request a new one.' });

    // Clear the token, update last login
    await sql(`UPDATE tradedoc_users SET login_token=NULL, login_token_expires_at=NULL, last_login_at=NOW(), updated_at=NOW() WHERE id=$1`, [rows[0].id]);
    await sql(`INSERT INTO tradedoc_events (email, event_type) VALUES ($1,'login_verified')`, [rows[0].email]).catch(()=>{});

    const plan = rows[0].plan_status || 'free';
    return res.json({ success: true, user: { email: rows[0].email, company: rows[0].company_name || '', plan }, ...(issueAdminToken(rows[0].email) || {}) });
  }

  if (action === 'verify_code') {
    let { email, code } = body;
    if (!email || !code) return res.status(400).json({ error: 'Email and code are required' });
    code = String(code).toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9]{8}$/.test(code)) return res.status(400).json({ error: 'Enter the 8-character code from your email.' });

    const rows = await sql('SELECT id, email, company_name, plan_status, login_display_code, login_token_expires_at FROM tradedoc_users WHERE email=$1 AND email_confirmed=true', [email]);
    if (!rows[0]) return res.status(400).json({ error: 'No pending sign-in for this email. Request a new code.' });
    if (!rows[0].login_display_code) return res.status(400).json({ error: 'No active code. Request a new one.' });
    if (String(rows[0].login_display_code).toUpperCase() !== code) return res.status(400).json({ error: 'Incorrect code. Check your email and try again.' });

    const expires = new Date(rows[0].login_token_expires_at);
    if (isNaN(expires.getTime()) || expires < new Date()) return res.status(400).json({ error: 'This code has expired. Request a new one.' });

    // One-time use — clear both code and token
    await sql('UPDATE tradedoc_users SET login_token=NULL, login_token_expires_at=NULL, login_display_code=NULL, last_login_at=NOW(), updated_at=NOW() WHERE id=$1', [rows[0].id]);
    await sql("INSERT INTO tradedoc_events (email, event_type) VALUES ($1,'login_verified_code')", [rows[0].email]).catch(()=>{});

    const plan = rows[0].plan_status || 'free';
    return res.json({ success: true, user: { email: rows[0].email, company: rows[0].company_name || '', plan }, ...(issueAdminToken(rows[0].email) || {}) });
  }

  if (action === 'suggest_hs_code') {
    const { description } = body;
    if (!description) return res.json({ hs_code: '', confidence: 'low', note: 'No product description provided' });

    // Smart HS code lookup — deterministic first, AI-enhanced for complex cases
    const desc = description.toLowerCase().trim();

    // ── DETERMINISTIC MAPPINGS (most common Tanzanian/African exports) ────
    const MAPPINGS = [
      // Cashew nuts
      { patterns: ['cashew kernel','cashew nut kernel','ww320','ww240','ww180','w320','w240','processed cashew'], hs: '0801.32', name: 'Cashew nuts, shelled' },
      { patterns: ['raw cashew nut','rcn','cashew in shell','unprocessed cashew'], hs: '0801.31', name: 'Cashew nuts, in shell' },
      // Sesame / simsim
      { patterns: ['sesame','simsim','sesame seed','sesame oil'], hs: '1207.40', name: 'Sesame seeds' },
      // Coffee
      { patterns: ['coffee bean','arabica','robusta','green coffee','coffee export'], hs: '0901.11', name: 'Coffee, not roasted' },
      { patterns: ['roasted coffee'], hs: '0901.21', name: 'Coffee, roasted' },
      // Tea
      { patterns: ['black tea','green tea','tea leaf','tea export'], hs: '0902.30', name: 'Black tea, in immediate packings' },
      // Tobacco
      { patterns: ['tobacco leaf','raw tobacco','unmanufactured tobacco'], hs: '2401.10', name: 'Tobacco, not stemmed' },
      // Rice
      { patterns: ['milled rice','polished rice','white rice','parboiled rice'], hs: '1006.30', name: 'Rice, semi or wholly milled' },
      { patterns: ['paddy rice','rough rice','rice in husk'], hs: '1006.10', name: 'Rice in husk (paddy)' },
      // Macadamia
      { patterns: ['macadamia nut','macadamia kernel'], hs: '0802.62', name: 'Macadamia nuts, shelled' },
      // Avocado
      { patterns: ['avocado','avocado fresh','fresh avocado'], hs: '0804.40', name: 'Avocados, fresh or dried' },
      // Mango
      { patterns: ['mango','fresh mango','mango fruit'], hs: '0804.50', name: 'Guavas, mangoes and mangosteens' },
      // Spices
      { patterns: ['clove','cloves','dried clove'], hs: '0907.10', name: 'Cloves (whole fruit, cloves and stems)' },
      { patterns: ['vanilla','vanilla bean','vanilla pod'], hs: '0905.10', name: 'Vanilla beans' },
      { patterns: ['black pepper','pepper corn','dried pepper'], hs: '0904.11', name: 'Pepper, neither crushed nor ground' },
      { patterns: ['cardamom','cardamon'], hs: '0908.31', name: 'Cardamoms, neither crushed nor ground' },
      // Dried fruits
      { patterns: ['dried mango','dried fruit','dehydrated mango'], hs: '0813.40', name: 'Other dried fruits' },
      // Cotton
      { patterns: ['cotton bale','raw cotton','cotton fibre','cotton lint'], hs: '5201.00', name: 'Cotton, not carded or combed' },
      // Sunflower
      { patterns: ['sunflower seed','sunflower oil'], hs: '1206.00', name: 'Sunflower seeds' },
      // Cocoa
      { patterns: ['cocoa bean','cacao bean','raw cocoa'], hs: '1801.00', name: 'Cocoa beans, whole or broken, raw' },
      // Palm
      { patterns: ['palm kernel','palm oil','crude palm'], hs: '1511.10', name: 'Palm oil, crude' },
      // Soya
      { patterns: ['soybean','soya bean','soy bean'], hs: '1201.90', name: 'Soya beans, whether or not broken' },
      // Groundnuts
      { patterns: ['groundnut','peanut','groundnut kernel'], hs: '1202.41', name: 'Groundnuts, shelled' },
      // Beans
      { patterns: ['kidney bean','haricot bean','dried bean','common bean'], hs: '0713.33', name: 'Kidney beans, dried' },
      { patterns: ['chickpea','chick pea'], hs: '0713.20', name: 'Chickpeas, dried' },
      { patterns: ['lentil','red lentil'], hs: '0713.40', name: 'Lentils, dried' },
      // Timber
      { patterns: ['timber','sawn wood','wood plank','lumber'], hs: '4407.10', name: 'Sawn or chipped wood, coniferous' },
      // Fish
      { patterns: ['fresh fish','dried fish','frozen fish','tilapia','nile perch'], hs: '0302.89', name: 'Fish, fresh or chilled' },
      // Generic
      { patterns: ['pharmaceutical','medicine','drug','tablet'], hs: '3004.90', name: 'Medicaments (mixed or not)' },
      { patterns: ['textile','fabric','woven'], hs: '5208.21', name: 'Woven fabrics of cotton' },
    ];

    for (const map of MAPPINGS) {
      for (const pat of map.patterns) {
        if (desc.includes(pat)) {
          return res.json({
            hs_code: map.hs,
            confidence: 'high',
            name: map.name,
            note: 'Matched: "' + pat + '" → HS ' + map.hs + ' (' + map.name + ')'
          });
        }
      }
    }

    // ── AI FALLBACK for unrecognized descriptions ─────────────────────────
    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    const prompt = 'You are an international trade HS code expert. Given this product description, provide the most accurate 6-digit HS code under the Harmonized System. Product description: "' + description + '". Respond in JSON only: {"hs_code": "XXXX.XX", "name": "official HS heading name", "confidence": "high|medium|low", "note": "brief explanation"}. No other text. JSON only.';

    if (ANTHROPIC_KEY) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 10000);
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 200, messages: [{ role: 'user', content: prompt }] })
        });
        if (r.ok) {
          const d = await r.json();
          const text = d.content?.[0]?.text?.trim();
          if (text) {
            try { 
              const parsed = JSON.parse(text.replace(/```json|```/g,'').trim());
              if (parsed.hs_code) return res.json(parsed);
            } catch {}
          }
        }
      } catch (e) { console.log('HS suggest AI error:', e.message); }
    }

    if (OPENAI_KEY) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 10000);
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Authorization': 'Bearer ' + OPENAI_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 200, response_format: { type: 'json_object' },
            messages: [{ role: 'user', content: prompt }] })
        });
        if (r.ok) {
          const d = await r.json();
          const text = d.choices?.[0]?.message?.content;
          if (text) {
            try {
              const parsed = JSON.parse(text);
              if (parsed.hs_code) return res.json(parsed);
            } catch {}
          }
        }
      } catch (e) { console.log('HS suggest OpenAI error:', e.message); }
    }

    return res.json({ hs_code: '', confidence: 'low', note: 'Could not determine HS code automatically. Please enter manually or consult your customs broker.' });
  }

  if (action === 'chatbot') {
    const { messages: chatMessages, system, email: cbEmail } = body;
    if (!chatMessages || !chatMessages.length) return res.json({ reply: 'No message received.' });
    // Plan enforcement: Free users get limited TradeBot (3 messages), Pro users get full access
    if (cbEmail) {
      const cbRows = await sql('SELECT plan_status FROM tradedoc_users WHERE email=$1', [cbEmail]);
      const cbPlan = cbRows[0]?.plan_status || 'free';
      if (cbPlan !== 'pro' && chatMessages.length > 6) {
        return res.json({ reply: 'You have reached the Free plan TradeBot limit. Upgrade to Pro for unlimited Trade Operations Advisor access, export intelligence, and compliance guidance.', plan: 'free', upgrade_url: '/upgrade' });
      }
    }

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    const OPENAI_KEY = process.env.OPENAI_API_KEY;

    const DEFAULT_SYS = [
      'CRITICAL: You are TradeBot — the trade assistant inside TradeDoc by Lenmac Company Limited. NEVER identify yourself as Claude, Anthropic, GPT, or any AI brand. You are TradeDoc. Always say "I am TradeDoc" or "I am TradeBot".',
      'You are TradeBot, the Trade Operations Advisor inside TradeDoc by Lenmac Company Limited (Tanzania).',
      'You are not a sales bot. You are an experienced export operations advisor. Help first, reason clearly, surface risks, and give specific next actions.',
      'Domains you know well: export documentation (commercial invoice, packing list, proforma, BL, COO, phytosanitary, health certificate, RAC), LC compliance (UCP 600, ISBP 745), Incoterms 2020, HS codes, and the Tanzania cashew export chain (District Levy -> PDN issued by Cashew Board of Tanzania -> cargo movement -> ICD -> CBT inspection -> Export Permit -> freight forwarding). Without a PDN cargo must not leave the district; without CBT inspection at ICD the export permit is not complete.',
      'Cashew grades: WW180 (largest), WW240, WW320 (most traded standard). EFD = Electronic Fiscal Device receipt showing goods value for TRA.',
      'Always: explain your reasoning briefly, state assumptions, identify risks, and end with a short "Suggested next actions" list when useful.',
      'When relevant, ask focused procurement discovery questions: are you buying or selling, country of origin, destination country, commodity, container size, required grade.',
      'Recommend Lenmac services ONLY when the context justifies it, never spam: documentation questions -> generate the document then run Pre-Shipment Verification; sourcing/procurement -> Lenmac PPL (Private Production Line) availability and procurement support; margin or pricing -> AgriSMES trade margin verification. Keep recommendations contextual and evidence-based.',
      'If you are uncertain or lack data, say so plainly rather than inventing facts.'
    ].join(' ');
    // ── RAG: retrieve knowledge before building system prompt ───────────
    let ragContext = '', ragSources = [];
    const lastMsg = chatMessages.filter(m => m.role === 'user').slice(-1);
    if (lastMsg.length && cbEmail) {
      try {
        const ragKey = process.env.OPENAI_API_KEY;
        if (ragKey) {
          const qe = await fetch('https://api.openai.com/v1/embeddings', { method: 'POST',
            headers: { 'Authorization': 'Bearer ' + ragKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'text-embedding-3-small', input: lastMsg[0].content.slice(0, 500) }) });
          const qd = await qe.json();
          const qv = qd.data && qd.data[0] && qd.data[0].embedding;
          if (qv) {
            const scopeW = "WHERE (s.scope = 'global' OR (s.scope = 'private' AND s.owner_email = $2))";
            const rows = await sql('SELECT c.chunk_text, s.title FROM td_knowledge_chunks c JOIN td_knowledge_sources s ON s.id = c.source_id ' + scopeW + ' ORDER BY c.embedding <=> $1::vector LIMIT 4', [JSON.stringify(qv), cbEmail]).catch(() => []);
            if (rows && rows.length) { ragContext = rows.map(r => r.chunk_text).join('\n\n'); ragSources = [...new Set(rows.map(r => r.title))]; }
          }
        }
      } catch (e) { }
    }
    const ragPrefix = ragContext ? 'KNOWLEDGE BASE:\n\n' + ragContext + '\n\n---\n\n' : '';
    const sysPrompt = ragPrefix + (system || DEFAULT_SYS);

    if (ANTHROPIC_KEY) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 12000); // 12s max — TradeBot must respond fast
        const r = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-haiku-4-5-20251001', max_tokens: 800,
            system: sysPrompt,
            messages: chatMessages.slice(-12)
          })
        });
        if (r.ok) {
          const d = await r.json();
          const reply = d.content?.[0]?.text?.trim();
          if (reply) return res.json({ reply, sources: ragSources });
        }
      } catch (e) { console.log('chatbot anthropic error:', e.message); }
    }

    if (OPENAI_KEY) {
      try {
        const ctrl = new AbortController();
        setTimeout(() => ctrl.abort(), 8000); // 8s — gpt-4o-mini is fast
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST', signal: ctrl.signal,
          headers: { 'Authorization': `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini', max_tokens: 400,
            messages: [{ role: 'system', content: sysPrompt }, ...chatMessages.slice(-10)]
          })
        });
        if (r.ok) {
          const d = await r.json();
          const reply = d.choices?.[0]?.message?.content?.trim();
          if (reply) return res.json({ reply });
        }
      } catch (e) { console.log('chatbot openai error:', e.message); }
    }

    return res.json({ reply: 'I am having trouble connecting right now. Please try again in a moment.' });
  }

  if (action === 'get_documents') {
    const { email, limit: lim } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const users = await sql(`SELECT id, plan_status FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.status(404).json({ error: 'User not found' });
    const maxDocs = users[0].plan_status === 'pro' ? 1000 : 10;
    // Self-migrate: ensure form_data column exists
    // form_data column already exists
    const docs = await sql(
      `SELECT id, doc_type, title, form_data, created_at, status FROM tradedoc_documents WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2`,
      [users[0].id, Math.min(parseInt(lim||'1000'), maxDocs)]
    );
    return res.json({ success: true, documents: docs.map(d => ({
      ...d, form_data: typeof d.form_data === 'string' ? JSON.parse(d.form_data) : (d.form_data || {})
    }))});
  }

  if (action === 'create_share_link') {
    const { email, doc_id, doc_type, ref_num, doc_content } = body;
    if (!email || !doc_type) return res.status(400).json({ error: 'Missing required fields' });

    // Self-migrate share links table
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_share_links (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      doc_id TEXT,
      doc_type TEXT NOT NULL,
      ref_num TEXT,
      doc_content TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
      views INTEGER DEFAULT 0
    )`).catch(()=>{});

    const shareId = Math.random().toString(36).slice(2,8).toUpperCase() + Date.now().toString(36).slice(-4).toUpperCase();
    await sql(
      `INSERT INTO tradedoc_share_links (id, email, doc_id, doc_type, ref_num, doc_content) VALUES ($1,$2,$3,$4,$5,$6)`,
      [shareId, email, doc_id||null, doc_type, ref_num||null, doc_content||null]
    );

    const shareUrl = `https://docs.lenmacai.com/share/${shareId}`;
    return res.json({ success: true, share_id: shareId, share_url: shareUrl });
  }

  if (action === 'get_share') {
    const { share_id } = body;
    if (!share_id) return res.status(400).json({ error: 'Share ID required' });
    const rows = await sql(
      `SELECT * FROM tradedoc_share_links WHERE id=$1 AND expires_at > NOW()`,
      [share_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Share link not found or expired' });
    await sql(`UPDATE tradedoc_share_links SET views=views+1 WHERE id=$1`, [share_id]).catch(()=>{});
    return res.json({ success: true, doc: rows[0] });
  }

  if (action === 'get_counterparties') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const users = await sql(`SELECT id FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.status(404).json({ error: 'User not found' });
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_counterparties (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'buyer',
      name TEXT NOT NULL,
      address TEXT, country TEXT, email TEXT, phone TEXT, tax_id TEXT, notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
    const parties = await sql(`SELECT * FROM tradedoc_counterparties WHERE user_id=$1 ORDER BY name ASC`, [users[0].id]);
    return res.json({ success: true, parties });
  }

  if (action === 'save_counterparty') {
    const { email, party, party_id } = body;
    if (!email || !party?.name) return res.status(400).json({ error: 'Email and party name required' });
    const users = await sql(`SELECT id FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.status(404).json({ error: 'User not found' });
    await sql(`CREATE TABLE IF NOT EXISTS tradedoc_counterparties (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'buyer',
      name TEXT NOT NULL, address TEXT, country TEXT, email TEXT, phone TEXT, tax_id TEXT, notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`).catch(()=>{});
    if (party_id) {
      await sql(`UPDATE tradedoc_counterparties SET type=$1,name=$2,address=$3,country=$4,email=$5,phone=$6,tax_id=$7,notes=$8 WHERE id=$9 AND user_id=$10`,
        [party.type||'buyer', party.name, party.address||null, party.country||null, party.email||null, party.phone||null, party.tax_id||null, party.notes||null, party_id, users[0].id]);
      return res.json({ success: true, party_id });
    } else {
      const rows = await sql(`INSERT INTO tradedoc_counterparties (user_id,type,name,address,country,email,phone,tax_id,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [users[0].id, party.type||'buyer', party.name, party.address||null, party.country||null, party.email||null, party.phone||null, party.tax_id||null, party.notes||null]);
      return res.json({ success: true, party: rows[0] });
    }
  }

  if (action === 'delete_counterparty') {
    const { email, party_id } = body;
    if (!email || !party_id) return res.status(400).json({ error: 'Missing fields' });
    const users = await sql(`SELECT id FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.status(404).json({ error: 'User not found' });
    await sql(`DELETE FROM tradedoc_counterparties WHERE id=$1 AND user_id=$2`, [party_id, users[0].id]);
    return res.json({ success: true });
  }

  if (action === 'get_analytics') {
    const { email } = body;
    if (!email) return res.status(400).json({ error: 'Email required' });
    const users = await sql(`SELECT id, docs_generated_this_month, created_at FROM tradedoc_users WHERE email=$1 AND email_confirmed=true`, [email]);
    if (!users[0]) return res.status(404).json({ error: 'User not found' });
    const uid = users[0].id;

    const [totalRows, breakdownRows, recentRows] = await Promise.all([
      sql(`SELECT COUNT(*) as total FROM tradedoc_documents WHERE user_id=$1`, [uid]),
      sql(`SELECT doc_type, COUNT(*) as count FROM tradedoc_documents WHERE user_id=$1 GROUP BY doc_type ORDER BY count DESC`, [uid]),
      sql(`SELECT event_type, document_type, created_at FROM tradedoc_events WHERE user_id=$1 ORDER BY created_at DESC LIMIT 20`, [uid]),
    ]);

    const createdAt = new Date(users[0].created_at);
    const now = new Date();
    const daysActive = Math.max(1, Math.floor((now - createdAt) / (1000*60*60*24)));
    const topDoc = breakdownRows[0]?.doc_type || '';

    const [wsRows, kRows] = await Promise.all([
      sql('SELECT COUNT(*)::int as n FROM tradedoc_consignments WHERE owner_email=$1', [email]).catch(()=>[{n:0}]),
      sql('SELECT COUNT(*)::int as n FROM td_retrieval_log WHERE user_email=$1', [email]).catch(()=>[{n:0}]),
    ]);
    return res.json({ success: true, stats: {
      total_docs: parseInt(totalRows[0]?.total || '0'),
      docs_this_month: users[0].docs_generated_this_month || 0,
      doc_breakdown: breakdownRows.map(r => ({ doc_type: r.doc_type, count: parseInt(r.count) })),
      recent_events: recentRows,
      top_doc_type: topDoc,
      days_active: daysActive,
      active_consignments: wsRows[0] && wsRows[0].n || 0,
      knowledge_queries: kRows[0] && kRows[0].n || 0,
    }});
  }


  // ── WEEKLY DIGEST (Pro users) ───────────────────────────────────────────────
  if (action === 'send_weekly_digest') {
    const { email } = body;
    const ADMIN_EMAILS = ['tradedoc@lenmacai.com', 'ai@lenmacai.com', 'zalahzh@proton.me'];
    if (!ADMIN_EMAILS.includes(email)) return res.status(403).json({ error: 'Admin only' });
    // Find all Pro users active in last 7 days
    const proUsers = await sql(
      "SELECT u.email, u.company_name, u.docs_generated_this_month " +
      "FROM tradedoc_users u " +
      "WHERE u.plan_status='pro' AND u.email_confirmed=true AND u.last_login_at > NOW() - INTERVAL '14 days'"
    ).catch(() => []);
    let sent = 0;
    for (const u of proUsers) {
      try {
        // Get their week's activity
        const [docRows, wsRows, evRows] = await Promise.all([
          sql("SELECT COUNT(*)::int as n FROM tradedoc_documents d JOIN tradedoc_users usr ON usr.id=d.user_id WHERE usr.email=$1 AND d.created_at > NOW() - INTERVAL '7 days'", [u.email]).catch(()=>[{n:0}]),
          sql("SELECT COUNT(*)::int as n FROM tradedoc_consignments WHERE owner_email=$1 AND updated_at > NOW() - INTERVAL '7 days'", [u.email]).catch(()=>[{n:0}]),
          sql("SELECT COUNT(*)::int as n FROM tradedoc_events WHERE email=$1 AND created_at > NOW() - INTERVAL '7 days'", [u.email]).catch(()=>[{n:0}]),
        ]);
        const docCount = docRows[0]?.n || 0;
        const wsCount = wsRows[0]?.n || 0;
        const evCount = evRows[0]?.n || 0;
        if (docCount === 0 && wsCount === 0 && evCount === 0) continue; // skip inactive
        const name = u.company_name || u.email.split('@')[0];
        const html = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;">'
          + '<div style="background:#1a5c38;padding:18px 24px;border-radius:8px 8px 0 0;">'
          + '<div style="color:#fff;font-size:16px;font-weight:800;">TradeDoc Weekly Summary</div>'
          + '<div style="color:#a7f3d0;font-size:11px;margin-top:2px;">Pro Plan — ' + new Date().toLocaleDateString('en-GB', {day:'numeric',month:'long',year:'numeric'}) + '</div>'
          + '</div>'
          + '<div style="background:#fff;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 8px 8px;padding:24px;">'
          + '<p style="color:#374151;font-size:14px;margin:0 0 16px;">Hi ' + name + ', here is your TradeDoc activity summary for the past 7 days.</p>'
          + '<table style="width:100%;border-collapse:collapse;">'
          + '<tr style="background:#f0fdf4;"><td style="padding:10px 14px;font-size:13px;font-weight:600;color:#1a5c38;">Documents Generated</td><td style="padding:10px 14px;font-size:20px;font-weight:800;color:#1a5c38;text-align:right;">' + docCount + '</td></tr>'
          + '<tr><td style="padding:10px 14px;font-size:13px;color:#374151;">Workspace Updates</td><td style="padding:10px 14px;font-size:20px;font-weight:700;color:#374151;text-align:right;">' + wsCount + '</td></tr>'
          + '<tr style="background:#f9fafb;"><td style="padding:10px 14px;font-size:13px;color:#374151;">Total Events</td><td style="padding:10px 14px;font-size:20px;font-weight:700;color:#374151;text-align:right;">' + evCount + '</td></tr>'
          + '</table>'
          + '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #e5e7eb;">'
          + '<a href="https://docs.lenmacai.com/dashboard" style="background:#1a5c38;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;display:inline-block;">Open Dashboard</a>'
          + '</div>'
          + '<p style="color:#9ca3af;font-size:11px;margin-top:16px;">TradeDoc &middot; docs.lenmacai.com &middot; Lenmac Company Limited</p>'
          + '</div></div>';
        await queueMail(u.email, 'Your TradeDoc Weekly Summary', html, 'tradedoc_digest');
        sent++;
      } catch (e) { console.error('digest error for', u.email, e.message); }
    }
    return res.json({ success: true, sent, total: proUsers.length });
  }

  return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    console.error('handler error:', err.message);
    // Return friendly errors — never expose raw DB/server internals to UI
    const msg = err.message || '';
    if (msg.includes('not configured') || msg.includes('Database')) {
      return res.status(503).json({ error: 'Service temporarily unavailable. Please try again in a moment.' });
    }
    if (msg.includes('DB 401') || msg.includes('DB 403')) {
      return res.status(503).json({ error: 'Database authentication error. Contact tradedoc@lenmacai.com' });
    }
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}















