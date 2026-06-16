import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-trade`;

async function callSaveTrade(action: string, body: object = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const res = await fetch(FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action, ...body })
  });
  return res.json();
}

export function useSavedTrades() {
  const [trades, setTrades] = useState<any[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadTrades = async () => {
    setLoading(true);
    const res = await callSaveTrade('list');
    if (res?.trades) { setTrades(res.trades); setCount(res.trades.length); }
    setLoading(false);
  };

  const saveTrade = async (tradeData: object) => {
    const res = await callSaveTrade('save', tradeData);
    if (res?.success) await loadTrades();
    return res;
  };

  const deleteTrade = async (id: string) => {
    await callSaveTrade('delete', { id });
    await loadTrades();
  };

  const toggleFavourite = async (id: string, is_favourite: boolean) => {
    await callSaveTrade('favourite', { id, is_favourite });
    await loadTrades();
  };

  const getCount = async () => {
    const res = await callSaveTrade('count');
    return res?.count || 0;
  };

  useEffect(() => { loadTrades(); }, []);

  return { trades, count, loading, saveTrade, deleteTrade, toggleFavourite, getCount, reload: loadTrades };
}
