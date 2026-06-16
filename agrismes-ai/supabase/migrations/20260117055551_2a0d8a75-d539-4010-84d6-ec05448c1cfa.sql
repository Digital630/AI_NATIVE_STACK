-- Add new columns to chat_conversations for enhanced logging
ALTER TABLE public.chat_conversations
ADD COLUMN IF NOT EXISTS user_name text,
ADD COLUMN IF NOT EXISTS user_email text,
ADD COLUMN IF NOT EXISTS user_phone_whatsapp text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS submitted_contact_form boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS provided_whatsapp boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS asked_for_price boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS asked_for_documents boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS feedback_rating text, -- 'helpful' or 'not_helpful'
ADD COLUMN IF NOT EXISTS feedback_text text,
ADD COLUMN IF NOT EXISTS quality_tag text, -- 'high_quality' or 'needs_improvement'
ADD COLUMN IF NOT EXISTS session_duration_seconds integer,
ADD COLUMN IF NOT EXISTS transcript jsonb DEFAULT '[]'::jsonb;

-- Create table for FAQ/Knowledge snippets that can be updated weekly
CREATE TABLE IF NOT EXISTS public.chat_knowledge_snippets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  keywords text[] DEFAULT '{}'::text[],
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create table for chat system prompts/rules
CREATE TABLE IF NOT EXISTS public.chat_system_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  content text NOT NULL,
  is_active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.chat_knowledge_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_system_prompts ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_knowledge_snippets
CREATE POLICY "Admins can manage knowledge snippets"
ON public.chat_knowledge_snippets
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Allow anonymous read active snippets"
ON public.chat_knowledge_snippets
FOR SELECT
USING (is_active = true);

-- RLS policies for chat_system_prompts
CREATE POLICY "Admins can manage system prompts"
ON public.chat_system_prompts
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Allow anonymous read active prompts"
ON public.chat_system_prompts
FOR SELECT
USING (is_active = true);

-- Add triggers for updated_at
CREATE TRIGGER update_chat_knowledge_snippets_updated_at
BEFORE UPDATE ON public.chat_knowledge_snippets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chat_system_prompts_updated_at
BEFORE UPDATE ON public.chat_system_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default system prompt
INSERT INTO public.chat_system_prompts (name, content, is_active)
VALUES (
  'main_rules',
  'You are FundMySME''s AI assistant. Help users understand trade finance, commodity sourcing, and SME funding. Be professional, helpful, and guide users toward submitting inquiries for commodities they''re interested in. Never provide specific pricing - always encourage direct contact for quotes.',
  true
) ON CONFLICT (name) DO NOTHING;