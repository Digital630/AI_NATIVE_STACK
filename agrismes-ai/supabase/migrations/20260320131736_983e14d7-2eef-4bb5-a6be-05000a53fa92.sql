ALTER TABLE public.ask_agrismes_queries 
ADD COLUMN IF NOT EXISTS resolved_model text,
ADD COLUMN IF NOT EXISTS provider text;