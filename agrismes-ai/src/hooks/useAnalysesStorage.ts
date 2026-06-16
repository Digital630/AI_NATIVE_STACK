import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { ThreadMessage, TradeAnswer } from "@/types/trade";

export interface StoredAnalysis {
  id: string;
  query: string;
  decision_signal: string | null;
  confidence_level: string | null;
  risk_level: string | null;
  commodity: string | null;
  origin: string | null;
  destination: string | null;
  summary: string | null;
  result_json: any;
  is_saved: boolean;
  is_deep_research: boolean;
  created_at: string;
}

function getVisitorId(): string {
  let id = localStorage.getItem("agrismes_visitor_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("agrismes_visitor_id", id);
  }
  return id;
}

export function useAnalysesStorage() {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<StoredAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const query = supabase
        .from("trade_analyses")
        .select("*")
        .order("created_at", { ascending: false });

      const { data, error: err } = await query;
      if (err) throw err;
      setAnalyses((data as StoredAnalysis[]) || []);
    } catch (e: any) {
      setError(e.message || "Failed to load analyses");
      setAnalyses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const saveAnalysis = useCallback(
    async (msg: ThreadMessage) => {
      const answer = msg.answer;
      const ev = answer?.deal_evaluation;
      const insert: any = {
        query: msg.content || answer?.direct_answer?.slice(0, 200) || "Analysis",
        decision_signal: ev?.decision_signal || null,
        confidence_level: ev?.confidence_level || null,
        risk_level: ev?.risk_level || null,
        commodity: answer?.trade_brief?.commodity || msg.context_variables?.commodity || null,
        origin: answer?.trade_brief?.origin || msg.context_variables?.origin || null,
        destination: answer?.trade_brief?.destination || msg.context_variables?.destination || null,
        summary: ev?.summary || answer?.direct_answer?.slice(0, 500) || null,
        result_json: { answer, sources: msg.sources, follow_up_questions: msg.follow_up_questions },
        is_deep_research: msg.is_deep_research || false,
        visitor_id: getVisitorId(),
      };
      if (user) insert.user_id = user.id;

      const { data, error: err } = await supabase
        .from("trade_analyses")
        .insert(insert)
        .select()
        .single();

      if (err) throw err;
      setAnalyses((prev) => [data as StoredAnalysis, ...prev]);
      return data as StoredAnalysis;
    },
    [user]
  );

  const toggleSaved = useCallback(async (id: string, saved: boolean) => {
    const { error: err } = await supabase
      .from("trade_analyses")
      .update({ is_saved: saved })
      .eq("id", id);
    if (err) throw err;
    setAnalyses((prev) =>
      prev.map((a) => (a.id === id ? { ...a, is_saved: saved } : a))
    );
  }, []);

  const deleteAnalysis = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from("trade_analyses")
      .delete()
      .eq("id", id);
    if (err) throw err;
    setAnalyses((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return {
    analyses,
    savedAnalyses: analyses.filter((a) => a.is_saved),
    isLoading,
    error,
    saveAnalysis,
    toggleSaved,
    deleteAnalysis,
    refetch: fetchAnalyses,
  };
}
