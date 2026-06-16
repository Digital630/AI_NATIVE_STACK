import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

type SubscriptionState = {
  isLoading: boolean;
  isPro: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  status: string;
  manageUrl: string | null;
  supportEmail: string;
  error: string;
};

const INITIAL_STATE: SubscriptionState = {
  isLoading: false,
  isPro: false,
  plan: 'free',
  status: 'free',
  manageUrl: null,
  supportEmail: 'margin@agrismes.com',
  error: '',
};

export function useSubscription(session: Session | null) {
  const [state, setState] = useState<SubscriptionState>(INITIAL_STATE);

  useEffect(() => {
    let ignore = false;

    async function loadSubscription() {
      if (!session?.access_token) {
        setState(INITIAL_STATE);
        return;
      }

      setState((current) => ({ ...current, isLoading: true, error: '' }));

      try {
        const response = await fetch('/api/subscription-status', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load subscription status.');
        }

        if (!ignore) {
          setState({
            isLoading: false,
            isPro: Boolean(data.isPro),
            plan: data.plan || 'free',
            status: data.status || 'free',
            manageUrl: data.manageUrl || null,
            supportEmail: data.supportEmail || 'margin@agrismes.com',
            error: '',
          });
        }
      } catch (error) {
        if (!ignore) {
          setState({
            ...INITIAL_STATE,
            error: error instanceof Error ? error.message : 'Unable to load subscription status.',
          });
        }
      }
    }

    loadSubscription();

    return () => {
      ignore = true;
    };
  }, [session?.access_token]);

  return state;
}
