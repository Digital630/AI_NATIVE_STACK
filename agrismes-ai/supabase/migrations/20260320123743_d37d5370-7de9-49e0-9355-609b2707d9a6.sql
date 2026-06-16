CREATE TABLE public.ask_agrismes_queries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  query text NOT NULL,
  response text,
  success boolean NOT NULL DEFAULT true,
  mode text DEFAULT 'ask_agrismes',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ask_agrismes_queries ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for edge function logging)
CREATE POLICY "Service role full access" ON public.ask_agrismes_queries
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated users can view their own queries
CREATE POLICY "Users can view own queries" ON public.ask_agrismes_queries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Allow anon insert for logging (edge function uses service role anyway)
CREATE POLICY "Allow insert from edge function" ON public.ask_agrismes_queries
  FOR INSERT TO anon, authenticated WITH CHECK (true);
