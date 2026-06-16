-- ==============================================
-- PHASE 1: AI TRADE DECISION SYSTEM - DATABASE SCHEMA
-- ==============================================

-- 1. Create enum for trade readiness stages
CREATE TYPE public.trade_readiness_stage AS ENUM (
  'explorer',
  'emerging', 
  'trade_ready',
  'institutional_ready'
);

-- 2. Create enum for admin review likelihood
CREATE TYPE public.admin_review_status AS ENUM (
  'pending',
  'conditional',
  'not_ready',
  'approved',
  'rejected'
);

-- 3. Create enum for listing completeness
CREATE TYPE public.listing_completeness AS ENUM (
  'in_progress',
  'optimized'
);

-- 4. Create enum for admin tags (internal only)
CREATE TYPE public.admin_listing_tag AS ENUM (
  'approved',
  'clarification_needed',
  'rejected',
  'high_risk',
  'promising'
);

-- 5. Add new columns to commodity_listings for structured fields
ALTER TABLE public.commodity_listings 
ADD COLUMN IF NOT EXISTS trade_readiness_stage trade_readiness_stage DEFAULT 'explorer',
ADD COLUMN IF NOT EXISTS primary_risk text,
ADD COLUMN IF NOT EXISTS admin_review_status admin_review_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS listing_completeness listing_completeness DEFAULT 'in_progress',
ADD COLUMN IF NOT EXISTS admin_tag admin_listing_tag,
ADD COLUMN IF NOT EXISTS next_best_action text,
ADD COLUMN IF NOT EXISTS ai_do_briefing text,
ADD COLUMN IF NOT EXISTS ai_dont_briefing text,
-- Intent commitment fields (Part B)
ADD COLUMN IF NOT EXISTS confirmed_role boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_no_direct_contact boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS confirmed_verification_timeline boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS realistic_constraint text,
-- Buyer-specific structured fields (Part E)
ADD COLUMN IF NOT EXISTS price_range_min numeric,
ADD COLUMN IF NOT EXISTS price_range_max numeric,
ADD COLUMN IF NOT EXISTS incoterms text,
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS destination_country text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS quantity_frequency text,
-- Seller-specific structured fields
ADD COLUMN IF NOT EXISTS commodity_grade text,
ADD COLUMN IF NOT EXISTS monthly_capacity text,
ADD COLUMN IF NOT EXISTS price_expectation numeric,
ADD COLUMN IF NOT EXISTS payment_terms text,
ADD COLUMN IF NOT EXISTS origin_country text;

-- 6. Create admin_user_messages table for private inbox (Part F prep)
CREATE TABLE IF NOT EXISTS public.admin_user_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES public.commodity_listings(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('user', 'admin')),
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_user_messages
ALTER TABLE public.admin_user_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_user_messages
CREATE POLICY "Users can insert their own messages"
ON public.admin_user_messages
FOR INSERT
WITH CHECK (sender_type = 'user');

CREATE POLICY "Users can view messages on their listings"
ON public.admin_user_messages
FOR SELECT
USING (
  visitor_id = current_setting('request.jwt.claims', true)::json->>'visitor_id'
  OR has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can manage all messages"
ON public.admin_user_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. Update the public view to NOT expose sensitive fields
DROP VIEW IF EXISTS public.commodity_listings_public;
CREATE VIEW public.commodity_listings_public AS
SELECT 
  id,
  listing_type,
  commodity_name,
  quantity,
  quantity_unit,
  preferred_regions,
  region_of_origin,
  origin_country,
  destination_country,
  description,
  status,
  trade_readiness_stage,
  listing_completeness,
  admin_review_status,
  is_visible,
  created_at,
  updated_at,
  visitor_id
FROM public.commodity_listings
WHERE is_visible = true;

-- 8. Create trigger for updated_at on admin_user_messages
CREATE TRIGGER update_admin_user_messages_updated_at
BEFORE UPDATE ON public.admin_user_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Create index for performance
CREATE INDEX IF NOT EXISTS idx_commodity_listings_trade_stage 
ON public.commodity_listings(trade_readiness_stage);

CREATE INDEX IF NOT EXISTS idx_commodity_listings_admin_tag 
ON public.commodity_listings(admin_tag);

CREATE INDEX IF NOT EXISTS idx_admin_user_messages_listing 
ON public.admin_user_messages(listing_id);

CREATE INDEX IF NOT EXISTS idx_admin_user_messages_visitor 
ON public.admin_user_messages(visitor_id);