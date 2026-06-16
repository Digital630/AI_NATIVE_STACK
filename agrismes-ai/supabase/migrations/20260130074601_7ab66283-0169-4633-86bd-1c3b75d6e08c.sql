-- Allow owners to SELECT their own listings (including pending/non-visible)
CREATE POLICY "Owners can view own listings"
ON public.commodity_listings
FOR SELECT
TO public
USING (visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id'
   OR is_visible = true);

-- Allow owners to UPDATE their own listings using visitor_id match
CREATE POLICY "Owners can update own listings"
ON public.commodity_listings
FOR UPDATE
TO public
USING (visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id')
WITH CHECK (visitor_id = current_setting('request.headers', true)::json->>'x-visitor-id');