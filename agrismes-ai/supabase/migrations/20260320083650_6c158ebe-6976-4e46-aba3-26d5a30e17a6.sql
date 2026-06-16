
CREATE TABLE public.waitlist_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL DEFAULT 'other',
  source text NOT NULL DEFAULT 'upgrade_plan',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert waitlist" ON public.waitlist_users
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Admins can view waitlist" ON public.waitlist_users
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
