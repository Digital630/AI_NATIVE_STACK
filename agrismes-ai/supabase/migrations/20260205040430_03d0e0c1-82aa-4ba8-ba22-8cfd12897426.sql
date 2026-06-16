-- Drop the restrictive check constraint and add one that supports all listing types
ALTER TABLE public.commodity_listings 
DROP CONSTRAINT IF EXISTS commodity_listings_listing_type_check;

-- Add new constraint with all supported listing types
ALTER TABLE public.commodity_listings 
ADD CONSTRAINT commodity_listings_listing_type_check 
CHECK (listing_type IN (
  'buy', 'sell', 'buyer', 'seller', 'third_party',
  'service_agent', 'service_logistics', 'service_warehouse',
  'service_qc', 'service_finance', 'service_certification', 'service_other'
));