-- Create AI model configuration table for dynamic updates
CREATE TABLE public.ai_model_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE DEFAULT 'default',
  model_name TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.3,
  max_tokens INTEGER NOT NULL DEFAULT 1000,
  fallback_model TEXT DEFAULT 'google/gemini-2.5-flash',
  is_active BOOLEAN NOT NULL DEFAULT true,
  auto_update_enabled BOOLEAN NOT NULL DEFAULT true,
  last_updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by TEXT DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default configuration
INSERT INTO public.ai_model_config (config_key, model_name, temperature, max_tokens, fallback_model, notes)
VALUES ('default', 'google/gemini-3-flash-preview', 0.3, 1000, 'google/gemini-2.5-flash', 'Auto-managed configuration for Alex AI assistant');

-- Create model update history table for audit trail
CREATE TABLE public.ai_model_update_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id UUID REFERENCES public.ai_model_config(id) ON DELETE CASCADE,
  previous_model TEXT,
  new_model TEXT NOT NULL,
  update_reason TEXT,
  updated_by TEXT DEFAULT 'system',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_model_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_model_update_history ENABLE ROW LEVEL SECURITY;

-- Allow edge functions to read config (service role)
CREATE POLICY "Service role can read ai_model_config" 
ON public.ai_model_config 
FOR SELECT 
USING (true);

CREATE POLICY "Service role can read ai_model_update_history" 
ON public.ai_model_update_history 
FOR SELECT 
USING (true);

-- Create function to log model updates
CREATE OR REPLACE FUNCTION public.log_model_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.model_name IS DISTINCT FROM NEW.model_name THEN
    INSERT INTO public.ai_model_update_history (config_id, previous_model, new_model, update_reason, updated_by)
    VALUES (NEW.id, OLD.model_name, NEW.model_name, NEW.notes, NEW.updated_by);
  END IF;
  NEW.last_updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for model update logging
CREATE TRIGGER log_ai_model_update
BEFORE UPDATE ON public.ai_model_config
FOR EACH ROW
EXECUTE FUNCTION public.log_model_update();