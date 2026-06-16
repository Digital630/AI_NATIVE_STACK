
CREATE TABLE public.trade_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  visitor_id text,
  query text NOT NULL,
  decision_signal text,
  confidence_level text,
  risk_level text,
  commodity text,
  origin text,
  destination text,
  summary text,
  result_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_saved boolean NOT NULL DEFAULT false,
  is_deep_research boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trade_analyses ENABLE ROW LEVEL SECURITY;

-- Authenticated users can CRUD own analyses
CREATE POLICY "Users can insert own analyses"
  ON public.trade_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own analyses"
  ON public.trade_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own analyses"
  ON public.trade_analyses FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.trade_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Anonymous users can CRUD via visitor_id header
CREATE POLICY "Anon can insert analyses"
  ON public.trade_analyses FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon can view own analyses"
  ON public.trade_analyses FOR SELECT
  TO anon
  USING (visitor_id = ((current_setting('request.headers'::text, true))::json ->> 'x-visitor-id'));

CREATE POLICY "Anon can update own analyses"
  ON public.trade_analyses FOR UPDATE
  TO anon
  USING (visitor_id = ((current_setting('request.headers'::text, true))::json ->> 'x-visitor-id'));
