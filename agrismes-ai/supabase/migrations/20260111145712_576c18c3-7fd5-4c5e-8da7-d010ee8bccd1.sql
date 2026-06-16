-- Create inquiries table for form submissions
CREATE TABLE public.inquires (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  organization_name TEXT,
  commodity_type TEXT NOT NULL,
  country_region TEXT,
  email TEXT NOT NULL,
  phone_number TEXT,
  short_message TEXT,
  source TEXT NOT NULL DEFAULT 'website',
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on the table
ALTER TABLE public.inquires ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous inserts (public form submissions)
CREATE POLICY "Allow anonymous inserts" 
ON public.inquires 
FOR INSERT 
WITH CHECK (true);

-- Create policy to prevent public reads (only admins should read)
-- No SELECT policy = no public access to read data