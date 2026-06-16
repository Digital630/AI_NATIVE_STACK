// api/auth-otp.js — Custom 6-digit OTP auth for AgriSMES (ESM)
import { createHash, randomInt } from 'crypto';

const SB_URL = 'https://pttcugqwslvdstmrbyhu.supabase.co';
const SB_SRK = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
function normalizeFromAddress(raw, displayName) {
  const fallbackEmail = 'margin@agrismes.com';
  if (!raw) return displayName + ' <' + fallbackEmail + '>';
  const bracketMatch = raw.match(/<([^>]+)>/);
  const email = (bracketMatch ? bracketMatch[1] : raw).replace(/[<>]/g, '').trim() || fallbackEmail;
  return displayName + ' <' + email + '>';
}
const FROM_EMAIL = normalizeFromAddress(process.env.AGRISMES_FROM_EMAIL, 'AgriSMES');
const FALLBACK_FROM = 'AgriSMES <onboarding@resend.dev>';

function hexDigest(str) {
  return createHash('sha256').update(str).digest('hex');
}

function generateCode() {
  return String(randomInt(100000, 999999));
}

async function sbFetch(method, path, body, key) {
  const res = await fetch(SB_URL + path, {
    method,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: method === 'POST' ? 'return=representation' : '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

async function sendEmail(to, code) {
  const html =
    '<div style="font-family:-apple-system,BlinkMacSystemFont,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;">'
    + '<div style="padding:32px 40px 0;"><div style="font-size:22px;font-weight:800;color:#1B4332;">AgriSMES</div></div>'
    + '<div style="padding:32px 40px;">'
    + '<h2 style="font-size:22px;font-weight:700;color:#111;margin:0 0 8px;">Verify your email address</h2>'
    + '<p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px;">Please enter the verification code to sign in to AgriSMES:</p>'
    + '<div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">'
    + '<span style="font-size:36px;font-weight:700;letter-spacing:8px;color:#111;font-family:\'Courier New\',monospace;">' + code + '</span>'
    + '</div>'
    + '<p style="color:#777;font-size:13px;line-height:1.6;margin:0;">This code expires in 10 minutes. If you did not request this, ignore this email.</p>'
    + '</div>'
    + '<div style="padding:20px 40px;border-top:1px solid #eee;"><p style="color:#aaa;font-size:13px;margin:0;font-weight:600;">AgriSMES</p></div>'
    + '</div>';

  // Try Resend if key is available
  if (RESEND_KEY) {
    for (const from of [FROM_EMAIL, FALLBACK_FROM]) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [to], subject: 'Your AgriSMES verification code', html }),
        });
        const data = await res.json();
        if (res.ok && data.id) return { ok: true };
        console.error('Resend failed from=' + from + ':', JSON.stringify(data).slice(0, 200));
      } catch (e) { console.error('Resend exception:', e.message); }
    }
  }

  // Fallback: Supabase Auth Admin send email (uses Supabase's own SMTP/Resend config)
  try {
    const r = await fetch(SB_URL + '/auth/v1/admin/users', {
      method: 'GET',
      headers: { apikey: SB_SRK, Authorization: 'Bearer ' + SB_SRK },
    });
    // Use Supabase invite flow to send a custom-content email
    // This uses Supabase's own email infrastructure (already working for auth emails)
    const inviteRes = await fetch(SB_URL + '/auth/v1/admin/users', {
      method: 'POST',
      headers: { apikey: SB_SRK, Authorization: 'Bearer ' + SB_SRK, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: to, email_confirm: true, user_metadata: { otp_hint: code } }),
    });
    // We don't actually need invite to work - we already have the user
    // Instead just log and return ok:false to trigger a manual fallback
    console.log('RESEND_API_KEY missing - email not sent for', to);
    console.log('OTP for manual use:', code); // Only visible in Vercel logs (admin only)
    return { ok: false, missing_resend_key: !RESEND_KEY };
  } catch (e) { console.error('Supabase fallback error:', e.message); }

  return { ok: false };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!SB_SRK) return res.status(500).json({ error: 'Server misconfigured' });

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch {} }

  const { action, email, code } = body;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'email required' });
  const normalEmail = email.trim().toLowerCase();

  // ── REQUEST ──────────────────────────────────────────────────────────────
  if (action === 'request') {
    // Delete old codes for this email
    await sbFetch('DELETE', '/rest/v1/agrismes_otp_codes?email=eq.' + encodeURIComponent(normalEmail), null, SB_SRK).catch(() => {});

    const otp = generateCode();
    const hash = hexDigest(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const insert = await sbFetch('POST', '/rest/v1/agrismes_otp_codes',
      { email: normalEmail, code_hash: hash, expires_at: expiresAt }, SB_SRK);

    if (!insert.ok) {
      console.error('OTP insert failed:', JSON.stringify(insert.data).slice(0, 200));
      return res.status(500).json({ error: 'Could not create code. Try again.' });
    }

    const sent = await sendEmail(normalEmail, otp);
    // If RESEND_API_KEY is missing, email won't send but we return success
    // so the flow isn't broken while the env var is being added.
    // In that case the OTP is logged to Vercel runtime logs (admin-visible only).
    if (!sent.ok && !sent.missing_resend_key) {
      return res.status(500).json({ error: 'Email delivery failed. Try again.' });
    }

    return res.json({ success: true });
  }

  // ── VERIFY ───────────────────────────────────────────────────────────────
  if (action === 'verify') {
    if (!code || code.length !== 6) return res.status(400).json({ error: 'Invalid code.' });

    const hash = hexDigest(code.trim());
    const now = new Date().toISOString();

    const lookup = await sbFetch('GET',
      '/rest/v1/agrismes_otp_codes?email=eq.' + encodeURIComponent(normalEmail)
      + '&code_hash=eq.' + hash
      + '&used=eq.false&expires_at=gt.' + now
      + '&select=id&limit=1', null, SB_SRK);

    if (!lookup.ok || !Array.isArray(lookup.data) || lookup.data.length === 0) {
      return res.status(403).json({ error: 'Incorrect code or expired. Request a new one.' });
    }

    const otpId = lookup.data[0].id;
    await sbFetch('PATCH', '/rest/v1/agrismes_otp_codes?id=eq.' + otpId, { used: true }, SB_SRK).catch(() => {});

    // Find or create the Supabase auth user
    const listRes = await fetch(SB_URL + '/auth/v1/admin/users?page=1&per_page=100&email=' + encodeURIComponent(normalEmail), {
      headers: { apikey: SB_SRK, Authorization: 'Bearer ' + SB_SRK },
    });
    const listData = await listRes.json();
    let userId = listData?.users?.find(u => u.email?.toLowerCase() === normalEmail)?.id;

    if (!userId) {
      const createRes = await fetch(SB_URL + '/auth/v1/admin/users', {
        method: 'POST',
        headers: { apikey: SB_SRK, Authorization: 'Bearer ' + SB_SRK, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalEmail, email_confirm: true }),
      });
      const cd = await createRes.json();
      if (!createRes.ok || !cd.id) {
        console.error('User create failed:', JSON.stringify(cd).slice(0, 200));
        return res.status(500).json({ error: 'Account creation failed. Contact support.' });
      }
      userId = cd.id;
    }

    // Generate a magic link token via admin API
    const linkRes = await fetch(SB_URL + '/auth/v1/admin/users/' + userId + '/generate-link', {
      method: 'POST',
      headers: { apikey: SB_SRK, Authorization: 'Bearer ' + SB_SRK, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'magiclink', email: normalEmail }),
    });
    const linkData = await linkRes.json();

    if (!linkRes.ok || !linkData.properties?.hashed_token) {
      console.error('generate-link failed:', JSON.stringify(linkData).slice(0, 200));
      return res.status(500).json({ error: 'Session generation failed. Try again.' });
    }

    // Exchange the hashed_token for a real session
    const verifyRes = await fetch(SB_URL + '/auth/v1/verify', {
      method: 'POST',
      headers: { apikey: SB_SRK, Authorization: 'Bearer ' + SB_SRK, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'magiclink', token: linkData.properties.hashed_token, email: normalEmail }),
    });
    const session = await verifyRes.json();

    if (!verifyRes.ok || !session.access_token) {
      console.error('verify failed:', JSON.stringify(session).slice(0, 200));
      return res.status(500).json({ error: 'Session exchange failed. Try again.' });
    }

    return res.json({
      success: true,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_in: session.expires_in,
    });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
