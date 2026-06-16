-- Create function to update timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create chat_conversations table for session tracking
CREATE TABLE public.chat_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  visitor_id TEXT NOT NULL,
  page_path TEXT,
  user_language_detected TEXT DEFAULT 'en',
  user_role TEXT,
  commodity TEXT,
  intent_stage TEXT,
  escalation_flag BOOLEAN DEFAULT false,
  email_sent_flag BOOLEAN DEFAULT false,
  message_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages_log table for individual messages
CREATE TABLE public.chat_messages_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  message_role TEXT NOT NULL CHECK (message_role IN ('user', 'assistant')),
  message_text_original TEXT NOT NULL,
  message_text_english TEXT,
  key_topics TEXT[] DEFAULT '{}',
  extracted_keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for efficient queries
CREATE INDEX idx_chat_conversations_created_at ON public.chat_conversations(created_at DESC);
CREATE INDEX idx_chat_conversations_commodity ON public.chat_conversations(commodity);
CREATE INDEX idx_chat_conversations_intent ON public.chat_conversations(intent_stage);
CREATE INDEX idx_chat_messages_log_conversation ON public.chat_messages_log(conversation_id);
CREATE INDEX idx_chat_messages_log_keywords ON public.chat_messages_log USING GIN(extracted_keywords);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages_log ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert conversations and messages
CREATE POLICY "Allow anonymous insert conversations"
ON public.chat_conversations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous update own conversation"
ON public.chat_conversations
FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow anonymous insert messages"
ON public.chat_messages_log
FOR INSERT
WITH CHECK (true);

-- Only admins can read conversations and messages
CREATE POLICY "Admins can view all conversations"
ON public.chat_conversations
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view all messages"
ON public.chat_messages_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete
CREATE POLICY "Admins can delete conversations"
ON public.chat_conversations
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete messages"
ON public.chat_messages_log
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger to update updated_at
CREATE TRIGGER update_chat_conversations_updated_at
BEFORE UPDATE ON public.chat_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();