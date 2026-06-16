// AgriSMES Behaviour Tracking — calls Supabase Edge Function
const SB_URL = 'https://pttcugqwslvdstmrbyhu.supabase.co';

export async function track(
  event_type: string,
  options: {
    user_id?: string;
    email?: string;
    session_id?: string;
    page?: string;
    metadata?: Record<string, unknown>;
  } = {}
) {
  try {
    await fetch(`${SB_URL}/functions/v1/track-behaviour`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type, ...options }),
    });
  } catch (_) {
    // Silent fail — tracking must never break the app
  }
}
