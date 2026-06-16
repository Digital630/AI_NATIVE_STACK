import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const ACTIVE_STATUSES = new Set(['active', 'paid', 'trialing']);

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function readRawBody(req) {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (req.body && typeof req.body === 'object') return JSON.stringify(req.body);

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

function safeEqual(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function decodeWebhookSecret(secret) {
  const normalized = secret.startsWith('whsec_') ? secret.slice(6) : secret;
  try {
    return Buffer.from(normalized, 'base64');
  } catch {
    return Buffer.from(secret, 'utf8');
  }
}

export function verifyPolarSignature({ rawBody, headers, secret }) {
  if (!secret) throw new Error('POLAR_WEBHOOK_SECRET is required.');

  const eventId = headers['webhook-id'] || headers['svix-id'];
  const timestamp = headers['webhook-timestamp'] || headers['svix-timestamp'];
  const signatureHeader = headers['webhook-signature'] || headers['svix-signature'];

  if (!eventId || !timestamp || !signatureHeader) {
    return false;
  }

  const signedPayload = `${eventId}.${timestamp}.${rawBody}`;
  const expected = crypto
    .createHmac('sha256', decodeWebhookSecret(secret))
    .update(signedPayload)
    .digest('base64');

  return String(signatureHeader)
    .split(' ')
    .some((part) => {
      const signature = part.startsWith('v1,') ? part.slice(3) : part;
      return safeEqual(signature, expected);
    });
}

export function isActiveStatus(status) {
  return ACTIVE_STATUSES.has(String(status || '').toLowerCase());
}

function pick(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '');
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizePlan(productName, productId) {
  const proProductId = process.env.POLAR_AGRISMES_PRO_PRODUCT_ID;
  const enterpriseProductId = process.env.POLAR_AGRISMES_ENTERPRISE_PRODUCT_ID;
  const name = String(productName || '').toLowerCase();

  if (enterpriseProductId && productId === enterpriseProductId) return 'enterprise';
  if (proProductId && productId === proProductId) return 'pro';
  if (name.includes('enterprise')) return 'enterprise';
  if (name.includes('pro') || name.includes('agrismes')) return 'pro';
  return 'pro';
}

export function extractPolarSubscription(event) {
  const type = event.type || event.event_type || '';
  const data = event.data || event.payload?.data || event.payload || {};
  const customer = data.customer || data.customer_data || data.customer_details || {};
  const subscription = data.subscription || data.subscription_data || {};
  const product = data.product || data.product_data || data.product_details || {};
  const checkout = data.checkout || {};
  const benefit = data.benefit || data.benefit_data || {};

  const email = normalizeEmail(
    pick(data.customer_email, data.email, data.billing_email, customer.email, checkout.customer_email)
  );
  const polarCustomerId = pick(data.customer_id, customer.id, subscription.customer_id, checkout.customer_id);
  const polarSubscriptionId = pick(
    data.subscription_id,
    subscription.id,
    type.startsWith('subscription.') ? data.id : null
  );
  const polarOrderId = pick(data.order_id, data.id && type.startsWith('order.') ? data.id : null, checkout.order_id);
  const polarProductId = pick(data.product_id, product.id, subscription.product_id, benefit.product_id);
  const productName = pick(data.product_name, product.name, subscription.product_name, benefit.name, 'AgriSMES Pro');

  const activeFromEvent = ['order.paid', 'subscription.active', 'benefit_grant.created'].includes(type);
  const canceledFromEvent = ['subscription.canceled', 'benefit_grant.revoked'].includes(type);
  const status = canceledFromEvent
    ? 'canceled'
    : activeFromEvent
      ? 'active'
      : String(pick(data.status, subscription.status, activeFromEvent ? 'active' : 'pending')).toLowerCase();

  return {
    email,
    polar_customer_id: polarCustomerId || null,
    polar_subscription_id: polarSubscriptionId || null,
    polar_order_id: polarOrderId || null,
    polar_product_id: polarProductId || null,
    product_name: productName || 'AgriSMES Pro',
    plan: normalizePlan(productName, polarProductId),
    status,
    current_period_start: toIso(pick(data.current_period_start, subscription.current_period_start, data.started_at)),
    current_period_end: toIso(pick(data.current_period_end, subscription.current_period_end, data.ends_at, data.renews_at)),
    cancel_at_period_end: Boolean(pick(data.cancel_at_period_end, subscription.cancel_at_period_end, false)),
  };
}

export async function findUserIdByEmail(supabase, email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', normalizedEmail)
    .maybeSingle();

  if (profile?.id) return profile.id;

  const { data } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const match = data?.users?.find((user) => normalizeEmail(user.email) === normalizedEmail);
  return match?.id || null;
}

export async function syncLegacyPlan(supabase, userId, plan, status) {
  if (!userId) return;

  const isActive = isActiveStatus(status);
  await supabase
    .from('user_plans')
    .upsert(
      {
        user_id: userId,
        plan: isActive ? plan : 'free',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )
    .throwOnError();
}

export async function upsertSubscription(supabase, subscription) {
  if (!subscription.email) {
    throw new Error('Polar event did not include a customer email.');
  }

  const userId = await findUserIdByEmail(supabase, subscription.email);
  const row = {
    ...subscription,
    user_id: userId,
    updated_at: new Date().toISOString(),
  };

  let existing = null;
  if (row.polar_subscription_id) {
    const { data } = await supabase
      .from('agrismes_subscriptions')
      .select('id')
      .eq('polar_subscription_id', row.polar_subscription_id)
      .maybeSingle();
    existing = data;
  }

  if (!existing && row.email && row.polar_product_id) {
    const { data } = await supabase
      .from('agrismes_subscriptions')
      .select('id')
      .ilike('email', row.email)
      .eq('polar_product_id', row.polar_product_id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    existing = data;
  }

  const result = existing?.id
    ? await supabase.from('agrismes_subscriptions').update(row).eq('id', existing.id).select('*').single()
    : await supabase.from('agrismes_subscriptions').insert(row).select('*').single();

  if (result.error) throw result.error;

  try {
    await syncLegacyPlan(supabase, result.data.user_id, result.data.plan, result.data.status);
  } catch (error) {
    console.warn('[polar-webhook] Legacy user_plans sync skipped:', error.message);
  }

  return result.data;
}

export async function syncSubscriptionForUser(supabase, email, userId) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !userId) return null;

  const { data, error } = await supabase
    .from('agrismes_subscriptions')
    .select('*')
    .or(`user_id.eq.${userId},email.ilike.${normalizedEmail}`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  let row = data;
  if (!row.user_id) {
    const update = await supabase
      .from('agrismes_subscriptions')
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .select('*')
      .single();
    if (update.error) throw update.error;
    row = update.data;
  }

  try {
    await syncLegacyPlan(supabase, userId, row.plan, row.status);
  } catch (error) {
    console.warn('[subscription-status] Legacy user_plans sync skipped:', error.message);
  }

  return row;
}
