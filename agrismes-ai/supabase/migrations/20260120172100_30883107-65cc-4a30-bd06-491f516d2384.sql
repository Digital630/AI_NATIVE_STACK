-- Create visitor_profiles table for user personalization and behavioral tracking
CREATE TABLE public.visitor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL UNIQUE,
  
  -- User identification
  email TEXT,
  display_name TEXT,
  preferred_language TEXT DEFAULT 'en',
  
  -- Visit tracking
  first_visit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_visit_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_visits INTEGER DEFAULT 1,
  total_session_duration_seconds INTEGER DEFAULT 0,
  
  -- Behavioral data
  pages_visited TEXT[] DEFAULT '{}',
  commodities_interested TEXT[] DEFAULT '{}',
  services_accessed TEXT[] DEFAULT '{}',
  search_queries TEXT[] DEFAULT '{}',
  
  -- Engagement metrics
  messages_sent INTEGER DEFAULT 0,
  forms_submitted INTEGER DEFAULT 0,
  documents_uploaded INTEGER DEFAULT 0,
  moisture_tests_completed INTEGER DEFAULT 0,
  
  -- User preferences
  preferred_commodities TEXT[] DEFAULT '{}',
  preferred_regions TEXT[] DEFAULT '{}',
  user_role TEXT, -- 'exporter', 'importer', 'both', 'undecided'
  business_type TEXT,
  
  -- Personalization flags
  is_returning_user BOOLEAN DEFAULT FALSE,
  welcome_back_shown BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  
  -- Last interaction context
  last_commodity_viewed TEXT,
  last_service_accessed TEXT,
  last_chat_topic TEXT,
  
  -- Metadata
  source_referrer TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  device_type TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for fast visitor lookups
CREATE INDEX idx_visitor_profiles_visitor_id ON public.visitor_profiles(visitor_id);
CREATE INDEX idx_visitor_profiles_email ON public.visitor_profiles(email) WHERE email IS NOT NULL;
CREATE INDEX idx_visitor_profiles_last_visit ON public.visitor_profiles(last_visit_at);

-- Enable RLS
ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts and updates (visitor_id based)
CREATE POLICY "Allow anonymous insert"
ON public.visitor_profiles
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous select own profile"
ON public.visitor_profiles
FOR SELECT
USING (true);

CREATE POLICY "Allow anonymous update own profile"
ON public.visitor_profiles
FOR UPDATE
USING (true);

-- Create page_visit_logs table for detailed journey tracking
CREATE TABLE public.page_visit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  visit_duration_seconds INTEGER DEFAULT 0,
  scroll_depth_percent INTEGER DEFAULT 0,
  interactions_count INTEGER DEFAULT 0,
  referrer_path TEXT,
  visited_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for visitor page history
CREATE INDEX idx_page_visit_logs_visitor ON public.page_visit_logs(visitor_id);
CREATE INDEX idx_page_visit_logs_visited_at ON public.page_visit_logs(visited_at);

-- Enable RLS
ALTER TABLE public.page_visit_logs ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts
CREATE POLICY "Allow anonymous insert page logs"
ON public.page_visit_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous select own page logs"
ON public.page_visit_logs
FOR SELECT
USING (true);

-- Create user_recommendations table for AI-generated suggestions
CREATE TABLE public.user_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL, -- 'service', 'commodity', 'article', 'action'
  title TEXT NOT NULL,
  description TEXT,
  target_url TEXT,
  priority INTEGER DEFAULT 1,
  is_dismissed BOOLEAN DEFAULT FALSE,
  is_clicked BOOLEAN DEFAULT FALSE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for recommendations
CREATE INDEX idx_user_recommendations_visitor ON public.user_recommendations(visitor_id);
CREATE INDEX idx_user_recommendations_type ON public.user_recommendations(recommendation_type);

-- Enable RLS
ALTER TABLE public.user_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert recommendations"
ON public.user_recommendations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous select own recommendations"
ON public.user_recommendations
FOR SELECT
USING (true);

CREATE POLICY "Allow anonymous update own recommendations"
ON public.user_recommendations
FOR UPDATE
USING (true);

-- Add trigger for updated_at on visitor_profiles
CREATE TRIGGER update_visitor_profiles_updated_at
BEFORE UPDATE ON public.visitor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();