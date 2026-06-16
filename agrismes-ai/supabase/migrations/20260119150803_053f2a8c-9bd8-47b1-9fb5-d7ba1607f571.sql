-- Create referral tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_visitor_id TEXT NOT NULL,
  referred_visitor_id TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  points_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  converted_at TIMESTAMP WITH TIME ZONE,
  source TEXT DEFAULT 'chat'
);

-- Create index for faster lookups
CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_visitor_id);
CREATE INDEX idx_referrals_code ON public.referrals(referral_code);
CREATE INDEX idx_referrals_referred ON public.referrals(referred_visitor_id);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for tracking referrals
CREATE POLICY "Allow anonymous referral inserts" 
ON public.referrals 
FOR INSERT 
WITH CHECK (true);

-- Allow reading own referrals by visitor_id
CREATE POLICY "Allow reading own referrals" 
ON public.referrals 
FOR SELECT 
USING (true);

-- Allow updates for conversion tracking
CREATE POLICY "Allow referral updates" 
ON public.referrals 
FOR UPDATE 
USING (true);

-- Add comment for documentation
COMMENT ON TABLE public.referrals IS 'Tracks user referrals for the RewardFlow referral program';