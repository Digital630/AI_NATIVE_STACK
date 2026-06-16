-- Create commodity listings table for buyer/seller/third-party submissions
CREATE TABLE public.commodity_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('buyer', 'seller', 'third_party')),
  commodity_name TEXT NOT NULL,
  quantity TEXT,
  quantity_unit TEXT DEFAULT 'MT',
  preferred_regions TEXT[],
  price_range TEXT,
  region_of_origin TEXT,
  description TEXT,
  -- Contact details (hidden from users, visible to admin only)
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  contact_company TEXT,
  -- Status and metadata
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'matched')),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commodity_listings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert of listings
CREATE POLICY "Allow anonymous insert listings"
ON public.commodity_listings
FOR INSERT
WITH CHECK (true);

-- Allow users to view listings without contact details (view handled in code)
CREATE POLICY "Allow anonymous select visible listings"
ON public.commodity_listings
FOR SELECT
USING (is_visible = true);

-- Admins can do everything
CREATE POLICY "Admins can manage all listings"
ON public.commodity_listings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_commodity_listings_updated_at
BEFORE UPDATE ON public.commodity_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for efficient queries
CREATE INDEX idx_commodity_listings_type ON public.commodity_listings(listing_type);
CREATE INDEX idx_commodity_listings_commodity ON public.commodity_listings(commodity_name);
CREATE INDEX idx_commodity_listings_status ON public.commodity_listings(status);
CREATE INDEX idx_commodity_listings_visible ON public.commodity_listings(is_visible);