-- Add explicit UPDATE policy (admin only)
CREATE POLICY "Admin only updates inquiries" 
ON public.inquires 
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add explicit DELETE policy (admin only)
CREATE POLICY "Admin only deletes inquiries" 
ON public.inquires 
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));