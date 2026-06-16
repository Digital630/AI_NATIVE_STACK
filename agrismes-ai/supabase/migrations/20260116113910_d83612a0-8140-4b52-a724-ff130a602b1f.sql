-- Create reward points tracking table
CREATE TABLE public.reward_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_level TEXT NOT NULL DEFAULT 'none',
  messages_sent INTEGER NOT NULL DEFAULT 0,
  forms_submitted INTEGER NOT NULL DEFAULT 0,
  images_generated INTEGER NOT NULL DEFAULT 0,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(visitor_id)
);

-- Enable RLS
ALTER TABLE public.reward_points ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert their own points record
CREATE POLICY "Allow anonymous insert points"
ON public.reward_points
FOR INSERT
WITH CHECK (true);

-- Allow anonymous users to update their own points record by visitor_id
CREATE POLICY "Allow anonymous update own points"
ON public.reward_points
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anonymous users to read their own points record
CREATE POLICY "Allow anonymous read own points"
ON public.reward_points
FOR SELECT
USING (true);

-- Admins can view all points
CREATE POLICY "Admins can view all points"
ON public.reward_points
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete points records
CREATE POLICY "Admins can delete points"
ON public.reward_points
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reward_points_updated_at
BEFORE UPDATE ON public.reward_points
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create points history table for tracking individual point awards
CREATE TABLE public.reward_points_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  points_awarded INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_points_history ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert
CREATE POLICY "Allow anonymous insert points history"
ON public.reward_points_history
FOR INSERT
WITH CHECK (true);

-- Allow anonymous read own history
CREATE POLICY "Allow anonymous read own history"
ON public.reward_points_history
FOR SELECT
USING (true);

-- Admins can view all history
CREATE POLICY "Admins can view all points history"
ON public.reward_points_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));