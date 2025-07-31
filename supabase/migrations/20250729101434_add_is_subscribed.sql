-- Add is_subscribed column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false NOT NULL;

-- Create index for is_subscribed column
CREATE INDEX IF NOT EXISTS profiles_is_subscribed_idx ON public.profiles(is_subscribed);
