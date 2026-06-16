
-- Fix 1: Restrict visitor_profiles SELECT to own data only (via visitor_id header)
DROP POLICY IF EXISTS "Allow anonymous select own profile" ON public.visitor_profiles;
CREATE POLICY "Allow anonymous select own profile"
  ON public.visitor_profiles
  FOR SELECT
  USING (
    visitor_id = ((current_setting('request.headers'::text, true))::json ->> 'x-visitor-id'::text)
  );

-- Fix 2: Restrict visitor_profiles UPDATE to own data only
DROP POLICY IF EXISTS "Allow anonymous update own profile" ON public.visitor_profiles;
CREATE POLICY "Allow anonymous update own profile"
  ON public.visitor_profiles
  FOR UPDATE
  USING (
    visitor_id = ((current_setting('request.headers'::text, true))::json ->> 'x-visitor-id'::text)
  );

-- Fix 3: Restrict commodity_listings public SELECT to exclude contact details
-- Drop the overly permissive public read policy
DROP POLICY IF EXISTS "Allow public read of listings view" ON public.commodity_listings;

-- The commodity_listings_public view already strips contact info.
-- We keep owner + admin access on the base table, and direct public reads to the view.
-- No replacement public SELECT on the base table - public should use the view.

-- Ensure the "Owners can view own listings" policy still works for owners
-- (it already exists and checks visitor_id header)
