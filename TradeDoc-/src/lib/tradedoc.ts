import { supabase } from './supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const edgeUrl = supabaseUrl ? `${supabaseUrl}/functions/v1/tradedoc` : '';

export type PlanStatus = 'free' | 'pro' | 'expired';

export type Dashboard = {
  company: string | null;
  documents_generated: number;
  document_limit: number;
  plan: PlanStatus;
  plan_status: PlanStatus;
  plan_expires_at: string | null;
  recent_activity: string[];
};

export type GenerateDocResponse = {
  document_id: string;
  allowed: true;
  monthly_count: number;
  monthly_limit: number;
  plan_status: PlanStatus;
};

type ApiAction =
  | 'activate_pro'
  | 'generate_doc'
  | 'get_dashboard'
  | 'renew_pro'
  | 'request_consultation'
  | 'submit_upgrade_request'
  | 'tradebot_message';

type ApiResponse<T> = T & {
  error?: string;
};

async function call<T>(action: ApiAction, body: Record<string, unknown> = {}) {
  if (!edgeUrl || !supabaseAnonKey) {
    throw new Error('TradeDoc API is not configured.');
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    throw new Error('Sign in again to continue.');
  }

  const response = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
    },
    body: JSON.stringify({ action, ...body }),
  });

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || payload?.error) {
    throw new Error(payload?.error ?? 'TradeDoc request failed.');
  }

  if (!payload) {
    throw new Error('TradeDoc returned an empty response.');
  }

  return payload as T;
}

// Legacy shims — used only by pages not loaded by the current App.tsx.
// These are no-ops; do not use in new code.
export const getSession = (): null => null;
export const setSession = (_d: object): void => {};
export const clearSession = (): void => {};

export const tradedoc = {
  signup: async (_d: Record<string, unknown>) => { throw new Error('signup removed — use Supabase OTP'); },
  confirmEmail: async (_token: string) => { throw new Error('confirmEmail removed — use Supabase OTP'); },
  activatePro: (paymentReference: string) => call<Dashboard>('activate_pro', { payment_reference: paymentReference }),
  generateDoc: (d: { doc_type: string; payload: Record<string, string> }) => call<GenerateDocResponse>('generate_doc', d),
  getDashboard: () => call<Dashboard>('get_dashboard'),
  renewPro: (paymentReference: string) => call<Dashboard>('renew_pro', { payment_reference: paymentReference }),
  requestConsultation: (d: Record<string, unknown>) => call<{ ok: true }>('request_consultation', d),
  submitUpgradeRequest: () => call<{ ok: true }>('submit_upgrade_request'),
  tradeBotMessage: (message: string) => call<{ answer: string; usage_remaining: number }>('tradebot_message', { message }),
};
