-- Add is_urgent column to commodity_listings table
ALTER TABLE public.commodity_listings
ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT false;

-- Add index for urgent listings filtering
CREATE INDEX IF NOT EXISTS idx_commodity_listings_is_urgent 
ON public.commodity_listings (is_urgent) 
WHERE is_urgent = true;

-- Update the commodity_listings_public view to include is_urgent and country fields
DROP VIEW IF EXISTS public.commodity_listings_public;

CREATE VIEW public.commodity_listings_public AS
SELECT 
  id,
  visitor_id,
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
  is_visible,
  is_urgent,
  trade_readiness_stage,
  listing_completeness,
  admin_review_status,
  created_at,
  updated_at
FROM public.commodity_listings
WHERE is_visible = true;