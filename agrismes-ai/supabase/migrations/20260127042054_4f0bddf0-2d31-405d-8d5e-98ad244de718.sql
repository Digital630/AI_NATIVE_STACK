-- Fix submissions_research RLS: allow inserts but deny reads
-- Drop conflicting policy
DROP POLICY IF EXISTS "Deny all user access to research" ON public.submissions_research;

-- Recreate policies with proper separation
CREATE POLICY "Deny read access to research"
ON public.submissions_research FOR SELECT
USING (false);

CREATE POLICY "Deny update access to research"
ON public.submissions_research FOR UPDATE
USING (false);

CREATE POLICY "Deny delete access to research"
ON public.submissions_research FOR DELETE
USING (false);