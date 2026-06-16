-- Create redemption_tokens table for QR code session tokens
CREATE TABLE public.redemption_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  points_at_creation INTEGER NOT NULL DEFAULT 0,
  level_at_creation TEXT NOT NULL DEFAULT 'none',
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  redeemed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create redeemed_services table for tracking unlocked services
CREATE TABLE public.redeemed_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  service_type TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  access_minutes INTEGER NOT NULL,
  access_started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  access_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create service_catalog table for available redemption services
CREATE TABLE public.service_catalog (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_key TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  description TEXT,
  points_required INTEGER NOT NULL,
  access_minutes INTEGER NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.redemption_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemed_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- RLS Policies for redemption_tokens (anonymous access with visitor_id matching)
CREATE POLICY "Allow anonymous insert of redemption tokens"
ON public.redemption_tokens
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous select own tokens"
ON public.redemption_tokens
FOR SELECT
USING (true);

CREATE POLICY "Allow anonymous update own tokens"
ON public.redemption_tokens
FOR UPDATE
USING (true);

-- RLS Policies for redeemed_services
CREATE POLICY "Allow anonymous insert of redeemed services"
ON public.redeemed_services
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow anonymous select own services"
ON public.redeemed_services
FOR SELECT
USING (true);

CREATE POLICY "Allow anonymous update own services"
ON public.redeemed_services
FOR UPDATE
USING (true);

-- RLS Policies for service_catalog (public read)
CREATE POLICY "Allow public read of service catalog"
ON public.service_catalog
FOR SELECT
USING (true);

-- Insert default service catalog entries
INSERT INTO public.service_catalog (service_key, service_name, description, points_required, access_minutes) VALUES
('matchmaking_basic', 'Buyer-Seller Matchmaking (Basic)', 'Connect with potential buyers or sellers in the agri-commodity sector for 5 minutes', 1000, 5),
('matchmaking_extended', 'Buyer-Seller Matchmaking (Extended)', 'Extended matchmaking session with multiple potential partners', 2500, 15),
('trade_consultation', 'Trade Readiness Consultation', 'Expert consultation on export readiness and documentation', 1500, 10),
('trade_consultation_premium', 'Trade Consultation (Premium)', 'Comprehensive trade finance and compliance consultation', 5000, 30),
('market_report_basic', 'Premium Market Report (Basic)', 'Access to basic commodity market insights and trends', 500, 60),
('market_report_full', 'Premium Market Report (Full)', 'Full market analysis with price forecasts and buyer contacts', 2000, 120);

-- Create indexes for performance
CREATE INDEX idx_redemption_tokens_visitor_id ON public.redemption_tokens(visitor_id);
CREATE INDEX idx_redemption_tokens_token ON public.redemption_tokens(token);
CREATE INDEX idx_redeemed_services_visitor_id ON public.redeemed_services(visitor_id);
CREATE INDEX idx_redeemed_services_active ON public.redeemed_services(is_active, access_expires_at);