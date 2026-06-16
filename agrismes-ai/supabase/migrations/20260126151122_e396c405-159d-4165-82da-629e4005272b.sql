-- Create role enum for user profiles
CREATE TYPE public.user_profile_role AS ENUM ('farmer', 'exporter', 'buyer', 'other');

-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  role user_profile_role DEFAULT 'other',
  country TEXT,
  region TEXT
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS: users can only access their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create tool_type enum
CREATE TYPE public.analysis_tool_type AS ENUM ('qc', 'moisture', 'kg');

-- Create submissions_user table (Layer 1: User Value)
CREATE TABLE public.submissions_user (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tool_type analysis_tool_type NOT NULL,
  commodity TEXT NOT NULL,
  region TEXT,
  image_path TEXT,
  result_json JSONB NOT NULL,
  consent_research BOOLEAN NOT NULL DEFAULT false,
  consent_store_image BOOLEAN NOT NULL DEFAULT false,
  consent_marketing BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on submissions_user
ALTER TABLE public.submissions_user ENABLE ROW LEVEL SECURITY;

-- submissions_user RLS: users can only access their own submissions
CREATE POLICY "Users can view own submissions"
  ON public.submissions_user FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
  ON public.submissions_user FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own submissions"
  ON public.submissions_user FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own submissions"
  ON public.submissions_user FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create submissions_research table (Layer 2: Research Value - Anonymized)
CREATE TABLE public.submissions_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tool_type analysis_tool_type NOT NULL,
  commodity TEXT NOT NULL,
  country TEXT,
  region TEXT,
  result_json JSONB NOT NULL,
  image_features_json JSONB,
  source_submission_id UUID REFERENCES public.submissions_user(id) ON DELETE SET NULL
);

-- Enable RLS on submissions_research
ALTER TABLE public.submissions_research ENABLE ROW LEVEL SECURITY;

-- submissions_research RLS: deny direct user access, allow service role only
CREATE POLICY "Deny all user access to research"
  ON public.submissions_research FOR ALL
  TO authenticated
  USING (false);

-- Allow anonymous insert for research data (when consent is given, app handles this)
CREATE POLICY "Allow anonymous research insert"
  ON public.submissions_research FOR INSERT
  TO anon
  WITH CHECK (true);

-- Create market_status enum
CREATE TYPE public.market_request_status AS ENUM ('new', 'review', 'matched', 'closed');

-- Create preferred_market enum
CREATE TYPE public.preferred_market_type AS ENUM ('local', 'export', 'both');

-- Create market_access_requests table (Layer 3: Access to Market)
CREATE TABLE public.market_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID NOT NULL REFERENCES public.submissions_user(id) ON DELETE CASCADE,
  commodity TEXT NOT NULL,
  volume_estimate TEXT,
  preferred_market preferred_market_type NOT NULL DEFAULT 'local',
  status market_request_status NOT NULL DEFAULT 'new'
);

-- Enable RLS on market_access_requests
ALTER TABLE public.market_access_requests ENABLE ROW LEVEL SECURITY;

-- market_access_requests RLS: users can only access their own requests
CREATE POLICY "Users can view own market requests"
  ON public.market_access_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own market requests"
  ON public.market_access_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own market requests"
  ON public.market_access_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create fun_outputs table for isolated fun content
CREATE TABLE public.fun_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES public.submissions_user(id) ON DELETE CASCADE,
  fun_type TEXT NOT NULL,
  output_data JSONB,
  storage_path TEXT
);

-- Enable RLS on fun_outputs
ALTER TABLE public.fun_outputs ENABLE ROW LEVEL SECURITY;

-- fun_outputs RLS: users can only access their own fun outputs
CREATE POLICY "Users can view own fun outputs"
  ON public.fun_outputs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fun outputs"
  ON public.fun_outputs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for agri-uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('agri-uploads', 'agri-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for agri-uploads bucket
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'agri-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'agri-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'agri-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create indexes for performance
CREATE INDEX idx_submissions_user_user_id ON public.submissions_user(user_id);
CREATE INDEX idx_submissions_user_tool_type ON public.submissions_user(tool_type);
CREATE INDEX idx_submissions_research_tool_type ON public.submissions_research(tool_type);
CREATE INDEX idx_submissions_research_commodity ON public.submissions_research(commodity);
CREATE INDEX idx_market_access_requests_user_id ON public.market_access_requests(user_id);
CREATE INDEX idx_market_access_requests_status ON public.market_access_requests(status);