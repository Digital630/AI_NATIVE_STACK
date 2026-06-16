// api/polar-webhook.js — TradeDoc Polar Subscription Webhook
// Mirrors the working AgriSMES pattern: verify signature -> idempotent event
// storage -> upsert tradedoc_subscriptions by email -> Pro activation.
//
// Official endpoint: https://docs.lenmacai.com/api/polar-webhook

import { createHmac } from 'crypto';
import { captureError } from './_observability.js';

// Map Polar product IDs -> plan metadata. Fill in once TradeDoc's real
// Polar product IDs are known. Unknown product IDs still activate Pro
// (monthly default, amount inferred from the event) so a real payment is
// never silently dropped while this map is incomplete.
const PRODUCT_PLAN = {
  '02312c5c-3efc-4adf-b0a0-0be2c36d4440': { plan: 'pro', cycle: 'monthly', amount: 9 },
  '5041b514-3f9c-4e68-8006-fa29f95df35e': { plan: 'pro', cycle: 'yearly',  amount: 95 },
};

const SB_URL = process.env.SUPABASE_URL || 'https://pttcugqwslvdstmrbyhu.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // service role bypasses RLS
const WEBHOOK_SECRET = process.env.TRADEDOC_POLAR_WEBHOOK_SECRET || process.env.POLAR_WEBHOOK_SECRET;
const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.TRADEDOC_FROM_EMAIL || 'TradeDoc <onboarding@resend.dev>';
const NOTIFY_EMAIL = 'tradedoc@lenmacai.com';

// ── Lenmac unified entitlement schema (Priority Zero, Phase 1) ──
// Dual-written alongside tradedoc_subscriptions/tradedoc_users. See
// lenmac_customers / lenmac_subscriptions / lenmac_entitlements /
// lenmac_webhook_events in pttcugqwslvdstmrbyhu.
const LENMAC_PRODUCT_KEY = 'tradedoc';
const LENMAC_ENTITLEMENT_KEY = 'tradedoc_pro';


// ── Supabase REST helper (service role; bypasses RLS) ──
async function sbRaw(method, table, params, body) {
  if (!SB_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY not set'); return null; }
  const url = SB_URL + '/rest/v1/' + table + (params ? '?' + params : '');
  const headers = {
    apikey: SB_KEY,
    Authorization: 'Bearer ' + SB_KEY,
    'Content-Type': 'application/json',
    Prefer: 'return=representation,resolution=merge-duplicates',
  };
  try {
    const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    const txt = await r.text();
    if (!r.ok) {
      console.error('Supabase error:', method, table, r.status, txt.slice(0, 200));
      return null;
    }
    return txt ? JSON.parse(txt) : null;
  } catch (e) {
    console.error('Supabase fetch exception:', e.message);
    return null;
  }
}

// ── Email helper (best-effort, never blocks activation) ──
async function sendEmail(to, subject, html) {
  if (!RESEND_KEY) return;
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + RESEND_KEY },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html, reply_to: NOTIFY_EMAIL }),
    });
    const d = await r.json();
    if (!r.ok) console.error('email failed:', r.status, JSON.stringify(d).slice(0, 120));
  } catch (e) { console.error('email error:', e.message); }
}

// ── Plan inference (used when productId isn't in PRODUCT_PLAN yet) ──
function inferCycle(data) {
  const interval = data?.recurringInterval || data?.product?.recurringInterval
    || data?.price?.recurringInterval || data?.subscription?.recurringInterval;
  return (interval === 'year' || interval === 'yearly') ? 'yearly' : 'monthly';
}
function inferAmount(data) {
  const cents = data?.amount ?? data?.totalAmount ?? data?.price?.priceAmount
    ?? data?.subscription?.amount;
  return typeof cents === 'number' ? Math.round(cents) / 100 : null;
}

// ── Core: activate Pro by email (upsert tradedoc_subscriptions) ──
async function activateProByEmail(customerEmail, subData) {
  const { subId, customerId, orderId, productId, productName, periodStart, periodEnd, cycle, amount, source } = subData;
  const planInfo = PRODUCT_PLAN[productId] || { plan: 'pro', cycle: cycle || 'monthly', amount: amount ?? 9 };

  console.log('activateProByEmail:', customerEmail, 'sub:', subId, 'product:', productId, 'source:', source);

  const result = await sbRaw(
    'POST',
    'tradedoc_subscriptions',
    'on_conflict=email',
    {
      email:                  customerEmail,
      polar_customer_id:      customerId  || null,
      polar_subscription_id:  subId       || null,
      polar_product_id:       productId   || null,
      polar_order_id:         orderId     || null,
      product_name:           productName || null,
      plan:                   planInfo.plan,
      billing_cycle:          planInfo.cycle,
      status:                 'active',
      started_at:             new Date().toISOString(),
      current_period_start:   periodStart || null,
      current_period_end:     periodEnd || null,
      amount_usd:             planInfo.amount,
      currency:               'USD',
      cancel_at_period_end:   false,
      source:                 'polar',
      metadata:               { source, activated_at: new Date().toISOString() },
    }
  );

  if (result) {
    console.log('TradeDoc Pro activated:', customerEmail);
    // Sync the legacy entitlement table used by the rest of the app
    // (AppShell/Dashboard/ConsignmentDetail all gate on user.plan === 'pro',
    // which the login response sources from tradedoc_users.plan_status).
    // PATCH matches 0 rows if this email hasn't signed up yet — that's fine,
    // the tradedoc_subscriptions row above is the durable record and
    // /api/tradedoc subscription_status reconciles it on next login.
    const userPatch = await sbRaw('PATCH', 'tradedoc_users',
      'email=eq.' + encodeURIComponent(customerEmail),
      {
        plan: 'pro',
        plan_status: 'pro',
        plan_started_at: new Date().toISOString(),
        plan_expires_at: periodEnd || null,
        reminder_7d_sent: false,
        reminder_3d_sent: false,
        reminder_1d_sent: false,
        expired_notice_sent: false,
        updated_at: new Date().toISOString(),
      }
    );
    if (!userPatch || userPatch.length === 0) console.log('tradedoc_users not yet created for', customerEmail, '(will reconcile on next login)');

    // Lenmac unified entitlement schema (Phase 1 dual-write)
    await lenmacUpsertCustomer(customerEmail, customerId);
    await lenmacUpsertSubscription(customerEmail, {
      subId, customerId, productId, cycle: planInfo.cycle, amount: planInfo.amount,
      periodStart, periodEnd, status: 'active',
    });
    await lenmacUpsertEntitlement(customerEmail, 'active', periodEnd);

    return true;
  }
  console.error('DB write failed for:', customerEmail);
  return false;
}

// ── Lenmac unified entitlement helpers (Priority Zero, Phase 1) ──
// Best-effort dual-writes: never throw, never block the legacy activation
// path above. A failure here is logged but does not affect the response
// sent to Polar or the legacy tradedoc_subscriptions/tradedoc_users state.
async function lenmacUpsertCustomer(email, polarCustomerId) {
  try {
    await sbRaw('POST', 'lenmac_customers', 'on_conflict=email', {
      email, polar_customer_id: polarCustomerId || null,
    });
  } catch (e) { console.error('lenmacUpsertCustomer failed:', e.message); }
}

async function lenmacUpsertSubscription(email, subData) {
  const { subId, customerId, productId, cycle, amount, periodStart, periodEnd, status } = subData;
  try {
    return await sbRaw('POST', 'lenmac_subscriptions', 'on_conflict=email,product_key', {
      email,
      product_key: LENMAC_PRODUCT_KEY,
      polar_customer_id: customerId || null,
      polar_subscription_id: subId || null,
      polar_product_id: productId || null,
      plan: 'pro',
      billing_cycle: cycle || null,
      status: status || 'active',
      current_period_start: periodStart || null,
      current_period_end: periodEnd || null,
      amount_usd: amount ?? null,
      currency: 'USD',
      cancel_at_period_end: false,
      metadata: { synced_from: 'tradedoc_polar_webhook', synced_at: new Date().toISOString() },
    });
  } catch (e) { console.error('lenmacUpsertSubscription failed:', e.message); return null; }
}

async function lenmacUpsertEntitlement(email, status, periodEnd) {
  try {
    return await sbRaw('POST', 'lenmac_entitlements', 'on_conflict=email,entitlement_key', {
      email,
      product_key: LENMAC_PRODUCT_KEY,
      entitlement_key: LENMAC_ENTITLEMENT_KEY,
      status,
      source: 'polar_webhook',
      current_period_end: periodEnd || null,
    });
  } catch (e) { console.error('lenmacUpsertEntitlement failed:', e.message); return null; }
}

async function lenmacRevoke(email) {
  try {
    await sbRaw('PATCH', 'lenmac_subscriptions',
      'email=eq.' + encodeURIComponent(email) + '&product_key=eq.' + LENMAC_PRODUCT_KEY,
      { status: 'canceled', canceled_at: new Date().toISOString() });
    await sbRaw('PATCH', 'lenmac_entitlements',
      'email=eq.' + encodeURIComponent(email) + '&entitlement_key=eq.' + LENMAC_ENTITLEMENT_KEY,
      { status: 'canceled' });
  } catch (e) { console.error('lenmacRevoke failed:', e.message); }
}

// ── Signature verification (Standard Webhooks, same scheme as AgriSMES) ──
// FAIL CLOSED: if no secret is configured, every event is rejected as
// unsigned rather than silently accepted. An attacker (or a misconfigured
// deploy) must not be able to grant Pro access via a forged webhook just
// because an env var was never set.
function verifySignature(webhookId, webhookTimestamp, webhookSig, rawBody) {
  if (!WEBHOOK_SECRET) { console.error('TradeDoc TRADEDOC_POLAR_WEBHOOK_SECRET/POLAR_WEBHOOK_SECRET not set — rejecting all webhook events (fail closed)'); return false; }
  if (!webhookId || !webhookTimestamp || !webhookSig) {
    console.error('Missing Polar webhook headers');
    return false;
  }
  const toSign = webhookId + '.' + webhookTimestamp + '.' + rawBody;
  const computed = createHmac('sha256', WEBHOOK_SECRET).update(toSign, 'utf8').digest('base64');
  for (const sig of webhookSig.split(' ')) {
    const val = sig.startsWith('v1,') ? sig.slice(3) : sig;
    if (val === computed) return true;
  }
  console.error('Signature mismatch');
  return false;
}

// ── Raw body reader ──
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', c => data += c);
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

// ── Extract fields from various Polar event shapes ──
function getEmail(data) {
  return data?.customer?.email || data?.customerEmail || data?.customer?.email_address
    || data?.subscription?.customer?.email || null;
}
function getSubId(data) {
  return data?.id || data?.subscriptionId || data?.subscription?.id || null;
}
function getOrderId(data) {
  return data?.orderId || (data?.object === 'order' ? data?.id : null);
}
function getProductId(data) {
  return data?.productId || data?.product_id || data?.product?.id
    || data?.items?.[0]?.productId || data?.lines?.[0]?.productId || null;
}
function getProductName(data) {
  return data?.product?.name || data?.productName || null;
}
function getCustomerId(data) {
  return data?.customerId || data?.customer?.id || data?.customer_id || null;
}
function getPeriodStart(data) {
  const raw = data?.currentPeriodStart || data?.current_period_start || data?.subscription?.currentPeriodStart;
  return raw ? new Date(raw).toISOString() : null;
}
function getPeriodEnd(data) {
  const raw = data?.currentPeriodEnd || data?.current_period_end || data?.subscription?.currentPeriodEnd;
  return raw ? new Date(raw).toISOString() : null;
}

// ══════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let rawBody = '';
  try { rawBody = await getRawBody(req); }
  catch { return res.status(400).json({ error: 'Cannot read body' }); }

  const valid = verifySignature(
    req.headers['webhook-id'],
    req.headers['webhook-timestamp'],
    req.headers['webhook-signature'],
    rawBody
  );
  if (!valid) return res.status(401).json({ error: 'Invalid signature' });

  let event;
  try { event = JSON.parse(rawBody); }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }

  const eventType = event.type || event.event;
  const eventId   = event.webhookEventId || req.headers['webhook-id'] || event.id || '';
  const data      = event.data || event;

  console.log('TradeDoc Polar event:', eventType, '| id:', eventId);

  // ── Idempotency ──
  if (SB_KEY && eventId) {
    const existing = await sbRaw('GET', 'tradedoc_polar_events',
      'event_id=eq.' + encodeURIComponent(eventId) + '&processed=eq.true&limit=1', null);
    if (existing && existing.length > 0) {
      console.log('Duplicate event skipped:', eventId);
      return res.status(200).json({ ok: true, duplicate: true });
    }
    await sbRaw('POST', 'tradedoc_polar_events', null,
      { event_id: eventId, event_type: eventType, payload: event, processed: false });
    await sbRaw('POST', 'lenmac_webhook_events', null,
      { product_key: LENMAC_PRODUCT_KEY, event_id: eventId, event_type: eventType, payload: event, processed: false })
      .catch(() => {});
  }

  const customerEmail = getEmail(data);
  const subId         = getSubId(data);
  const orderId       = getOrderId(data);
  const productId     = getProductId(data);
  const productName   = getProductName(data);
  const customerId    = getCustomerId(data);
  const periodStart   = getPeriodStart(data);
  const periodEnd     = getPeriodEnd(data);

  try {
    const ACTIVATE_EVENTS = new Set([
      'subscription.created', 'subscription.active', 'subscription.updated',
      'order.paid', 'checkout.completed', 'benefit_grant.created',
    ]);

    if (ACTIVATE_EVENTS.has(eventType)) {
      if (!customerEmail) {
        console.error('No email in event:', eventType, JSON.stringify(data).slice(0, 200));
        return res.status(200).json({ ok: true, warning: 'No email found' });
      }

      const skipStatuses = new Set(['pending', 'failed', 'incomplete', 'past_due']);
      const eventStatus = data?.status || '';
      if (skipStatuses.has(eventStatus) && eventType !== 'order.paid') {
        console.log('Skipping activation for status:', eventStatus);
        return res.status(200).json({ ok: true, skipped: eventStatus });
      }

      const activated = await activateProByEmail(customerEmail, {
        subId, customerId, orderId, productId, productName, periodStart, periodEnd,
        cycle: inferCycle(data), amount: inferAmount(data), source: eventType,
      });

      if (eventType === 'subscription.created' && activated) {
        await Promise.all([
          sendEmail(customerEmail, 'TradeDoc Pro is Now Active',
            `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#0d1117;padding:32px;border-radius:12px">
              <div style="font-size:22px;font-weight:900;color:#2ea043;margin-bottom:4px">TradeDoc</div>
              <h2 style="color:#f0f6fc;font-size:18px;margin-bottom:12px">Pro Access Active</h2>
              <p style="color:#8b949e;font-size:14px;line-height:1.6">
                Your TradeDoc Pro subscription is now active. Pre-Shipment Verification,
                LC Compliance Engine, and Export Operations Workspace are unlocked.
              </p>
              <div style="text-align:center;margin:24px 0">
                <a href="https://docs.lenmacai.com" style="background:#238636;color:#fff;padding:12px 28px;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">Open TradeDoc &rarr;</a>
              </div>
            </div>`),
          sendEmail(NOTIFY_EMAIL, '[TradeDoc Pro] New Subscriber - ' + customerEmail,
            `<p><b>Email:</b> ${customerEmail}</p><p><b>Source event:</b> ${eventType}</p>
             <p><b>Sub ID:</b> ${subId || 'N/A'}</p><p><b>Product:</b> ${productId || 'N/A'}</p>`),
        ]);
      }
    }

    else if (eventType === 'subscription.canceled' || eventType === 'subscription.revoked' || eventType === 'benefit_grant.revoked') {
      if (customerEmail) {
        await sbRaw('PATCH', 'tradedoc_subscriptions',
          'email=eq.' + encodeURIComponent(customerEmail),
          { status: 'canceled', canceled_at: new Date().toISOString(), cancel_at_period_end: false });
        await sbRaw('PATCH', 'tradedoc_users',
          'email=eq.' + encodeURIComponent(customerEmail),
          { plan: 'free', plan_status: 'free', updated_at: new Date().toISOString() });
        await lenmacRevoke(customerEmail);
        console.log('TradeDoc subscription canceled:', customerEmail);
      }
    }

    else if (eventType === 'payment.failed') {
      if (customerEmail) {
        await sbRaw('PATCH', 'tradedoc_subscriptions',
          'email=eq.' + encodeURIComponent(customerEmail), { status: 'past_due' });
      }
    }

    else {
      console.log('Logged event (no action):', eventType);
    }

    if (SB_KEY && eventId) {
      await sbRaw('PATCH', 'tradedoc_polar_events',
        'event_id=eq.' + encodeURIComponent(eventId), { processed: true, processed_at: new Date().toISOString() });
      await sbRaw('PATCH', 'lenmac_webhook_events',
        'product_key=eq.' + LENMAC_PRODUCT_KEY + '&event_id=eq.' + encodeURIComponent(eventId), { processed: true }).catch(() => {});
    }

    return res.status(200).json({ ok: true, event: eventType });

  } catch (err) {
    console.error('TradeDoc webhook handler error:', eventType, err.message);
    captureError(err, { handler: 'polar-webhook', eventType, eventId });
    if (SB_KEY && eventId) {
      await sbRaw('PATCH', 'tradedoc_polar_events',
        'event_id=eq.' + encodeURIComponent(eventId), { error: err.message }).catch(() => {});
    }
    return res.status(500).json({ error: err.message });
  }
}
