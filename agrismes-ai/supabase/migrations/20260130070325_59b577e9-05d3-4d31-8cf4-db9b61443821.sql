-- Update user_type to include 'other' instead of 'both'
-- First update any existing 'both' values to 'other'
UPDATE public.profiles 
SET user_type = 'other' 
WHERE user_type = 'both';

-- Add constraint to ensure valid user types
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_user_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_user_type_check 
CHECK (user_type IN ('buyer', 'seller', 'other') OR user_type IS NULL);

-- Update default value
ALTER TABLE public.profiles 
ALTER COLUMN user_type SET DEFAULT 'seller';