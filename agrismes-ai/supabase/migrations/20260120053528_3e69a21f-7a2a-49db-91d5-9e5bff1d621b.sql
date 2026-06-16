-- Create admin access attempts log table for security tracking
CREATE TABLE public.admin_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  device_fingerprint TEXT,
  ip_hash TEXT,
  attempt_type TEXT NOT NULL CHECK (attempt_type IN ('success', 'failure')),
  lock_duration_minutes INTEGER,
  lock_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient lookups
CREATE INDEX idx_admin_access_logs_visitor ON public.admin_access_logs(visitor_id, created_at DESC);
CREATE INDEX idx_admin_access_logs_device ON public.admin_access_logs(device_fingerprint, created_at DESC);

-- Enable RLS
ALTER TABLE public.admin_access_logs ENABLE ROW LEVEL SECURITY;

-- Only allow insert from edge functions (service role) - no direct client access
CREATE POLICY "No public access to admin logs"
ON public.admin_access_logs
FOR ALL
TO anon, authenticated
USING (false);

-- Allow service role full access
CREATE POLICY "Service role full access"
ON public.admin_access_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create admin lockout state table for persistent lockout tracking
CREATE TABLE public.admin_lockout_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier TEXT NOT NULL UNIQUE, -- visitor_id or device_fingerprint
  failed_attempts INTEGER NOT NULL DEFAULT 0,
  lockout_cycle INTEGER NOT NULL DEFAULT 0, -- tracks which lockout cycle (0=none, 1=15min, 2=30min, 3=24hr)
  locked_until TIMESTAMP WITH TIME ZONE,
  last_attempt_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_lockout_identifier ON public.admin_lockout_state(identifier);

-- Enable RLS
ALTER TABLE public.admin_lockout_state ENABLE ROW LEVEL SECURITY;

-- Only service role access
CREATE POLICY "No public access to lockout state"
ON public.admin_lockout_state
FOR ALL
TO anon, authenticated
USING (false);

CREATE POLICY "Service role lockout access"
ON public.admin_lockout_state
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);