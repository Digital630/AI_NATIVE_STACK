-- Create a public view that EXCLUDES contact details for non-admin access
CREATE VIEW public.commodity_listings_public
WITH (security_invoker = on) AS
SELECT 
  id,
  visitor_id,
  listing_type,
  commodity_name,
  quantity,
  quantity_unit,
  preferred_regions,
  price_range,
  region_of_origin,
  description,
  status,
  is_visible,
  created_at,
  updated_at
  -- Deliberately EXCLUDES: contact_name, contact_email, contact_phone, contact_company, admin_notes
FROM public.commodity_listings;

-- Allow public read of the safe view
CREATE POLICY "Allow public read of listings view"
ON public.commodity_listings
FOR SELECT
USING (is_visible = true);

-- Drop the old permissive policy that exposed all columns
DROP POLICY IF EXISTS "Allow anonymous select visible listings" ON public.commodity_listings;