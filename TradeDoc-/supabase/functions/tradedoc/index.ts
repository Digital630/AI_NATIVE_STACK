import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.87.1';

type Action =
  | 'activate_pro'
  | 'generate_doc'
  | 'get_dashboard'
  | 'renew_pro'
  | 'request_consultation'
  | 'submit_upgrade_request'
  | 'tradebot_message';

type Profile = {
  user_id: string;
  email: string;
  company: string | null;
  plan: 'free' | 'pro' | 'expired';
  plan_status: 'free' | 'pro' | 'expired';
  plan_expires_at: string | null;
  role: 'user' | 'admin';
};

const FREE_DOCUMENT_LIMIT = 5;
const PRO_DOCUMENT_LIMIT = 100;
const FREE_TRADEBOT_LIMIT = 10;
const PRO_TRADEBOT_LIMIT = 500;
const PRO_DOC_TYPES = new Set(['business_contract', 'export_readiness', 'bank_letter', 'loan_request']);

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

function monthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

function requireString(value: unknown, name: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${name} is required.`);
  }

  return value.trim();
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'TradeDoc server is not configured.' }, 500);
  }

  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace(/^Bearer\s+/i, '');

  if (!token) {
    return json({ error: 'Authentication required.' }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser(token);

  if (authError || !authData.user?.email) {
    return json({ error: 'Invalid or expired session.' }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body.' }, 400);
  }

  const action = body.action as Action | undefined;
  if (!action) {
    return json({ error: 'Action is required.' }, 400);
  }

  const user = authData.user;

  async function loadProfile(): Promise<Profile> {
    const { data: existing, error: readError } = await admin
      .from('tradedoc_profiles')
      .select('user_id,email,company,plan,plan_status,plan_expires_at,role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (readError) {
      throw readError;
    }

    if (!existing) {
      const company = typeof user.user_metadata?.company === 'string' ? user.user_metadata.company : null;
      const { data: created, error: createError } = await admin
        .from('tradedoc_profiles')
        .insert({
          user_id: user.id,
          email: user.email,
          company,
          plan: 'free',
          plan_status: 'free',
          role: 'user',
        })
        .select('user_id,email,company,plan,plan_status,plan_expires_at,role')
        .single();

      if (createError) {
        throw createError;
      }

      return created as Profile;
    }

    const profile = existing as Profile;
    if (profile.plan_status === 'pro' && profile.plan_expires_at && new Date(profile.plan_expires_at).getTime() <= Date.now()) {
      const { data: expired, error: expireError } = await admin
        .from('tradedoc_profiles')
        .update({ plan: 'expired', plan_status: 'expired' })
        .eq('user_id', user.id)
        .select('user_id,email,company,plan,plan_status,plan_expires_at,role')
        .single();

      if (expireError) {
        throw expireError;
      }

      return expired as Profile;
    }

    return profile;
  }

  async function monthlyCount(table: string) {
    const { count, error } = await admin
      .from(table)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', monthStart());

    if (error) {
      throw error;
    }

    return count ?? 0;
  }

  async function dashboard(profile: Profile) {
    const docsCount = await monthlyCount('tradedoc_documents');
    const documentLimit = profile.plan_status === 'pro' ? PRO_DOCUMENT_LIMIT : FREE_DOCUMENT_LIMIT;
    const { data: activity, error: activityError } = await admin
      .from('tradedoc_documents')
      .select('doc_type,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (activityError) {
      throw activityError;
    }

    return {
      company: profile.company,
      documents_generated: docsCount,
      document_limit: documentLimit,
      plan: profile.plan,
      plan_status: profile.plan_status,
      plan_expires_at: profile.plan_expires_at,
      recent_activity: (activity ?? []).map((item) => `${item.doc_type} generated on ${new Date(item.created_at).toLocaleDateString('en-GB')}`),
    };
  }

  try {
    const profile = await loadProfile();

    if (action === 'get_dashboard') {
      return json(await dashboard(profile));
    }

    if (action === 'generate_doc') {
      const docType = requireString(body.doc_type, 'Document type');
      const payload = typeof body.payload === 'object' && body.payload !== null ? body.payload : {};

      if (PRO_DOC_TYPES.has(docType) && profile.plan_status !== 'pro') {
        return json({ error: 'Pro plan required for this document.' }, 403);
      }

      const currentCount = await monthlyCount('tradedoc_documents');
      const monthlyLimit = profile.plan_status === 'pro' ? PRO_DOCUMENT_LIMIT : FREE_DOCUMENT_LIMIT;

      if (currentCount >= monthlyLimit) {
        return json({ error: 'Monthly document limit reached.', monthly_count: currentCount, monthly_limit: monthlyLimit }, 403);
      }

      const { data: documentRecord, error: insertError } = await admin
        .from('tradedoc_documents')
        .insert({
          doc_type: docType,
          form_payload: payload,
          status: 'generated',
          user_id: user.id,
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      return json({
        allowed: true,
        document_id: documentRecord.id,
        monthly_count: currentCount + 1,
        monthly_limit: monthlyLimit,
        plan_status: profile.plan_status,
      });
    }

    if (action === 'tradebot_message') {
      const message = requireString(body.message, 'Message');
      const currentCount = await monthlyCount('tradedoc_tradebot_usage');
      const monthlyLimit = profile.plan_status === 'pro' ? PRO_TRADEBOT_LIMIT : FREE_TRADEBOT_LIMIT;

      if (currentCount >= monthlyLimit) {
        return json({ error: 'Monthly TradeBot limit reached.', usage_remaining: 0 }, 403);
      }

      const { error: usageError } = await admin.from('tradedoc_tradebot_usage').insert({
        message,
        user_id: user.id,
      });

      if (usageError) {
        throw usageError;
      }

      return json({ answer: 'TradeBot usage approved.', usage_remaining: monthlyLimit - currentCount - 1 });
    }

    if (action === 'submit_upgrade_request' || action === 'request_consultation') {
      const { error } = await admin.from('tradedoc_subscription_events').insert({
        event_type: action,
        metadata: body,
        user_id: user.id,
      });

      if (error) {
        throw error;
      }

      return json({ ok: true });
    }

    if (action === 'activate_pro' || action === 'renew_pro') {
      if (profile.role !== 'admin') {
        return json({ error: 'Admin authorization required.' }, 403);
      }

      const targetUserId = requireString(body.target_user_id, 'Target user');
      const paymentReference = requireString(body.payment_reference, 'Payment reference');
      const now = new Date();
      const expires = new Date(now);
      expires.setUTCFullYear(expires.getUTCFullYear() + 1);

      const { error: updateError } = await admin
        .from('tradedoc_profiles')
        .update({
          plan: 'pro',
          plan_status: 'pro',
          plan_started_at: now.toISOString(),
          plan_expires_at: expires.toISOString(),
          payment_reference: paymentReference,
        })
        .eq('user_id', targetUserId);

      if (updateError) {
        throw updateError;
      }

      return json({ ok: true });
    }

    return json({ error: 'Unknown action.' }, 400);
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : 'TradeDoc request failed.' }, 500);
  }
});
