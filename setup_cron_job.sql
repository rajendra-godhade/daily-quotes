-- Setup Cron Job for Daily Quote Function
-- This will run the send-daily-quote function at 6:30 PM daily

-- First, enable the pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the Supabase Edge Function
CREATE OR REPLACE FUNCTION trigger_daily_quote()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the Supabase Edge Function via HTTP
  PERFORM net.http_post(
    url := 'https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/send-daily-quote',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  );
END;
$$;

-- Schedule the cron job to run at 6:30 PM daily (18:30 UTC)
-- Format: minute hour day month day_of_week
SELECT cron.schedule(
  'daily-quote-6-30-pm',
  '30 18 * * *',
  'SELECT trigger_daily_quote();'
);

-- Alternative: If you want to test it immediately, you can run:
-- SELECT trigger_daily_quote();

-- To check existing cron jobs:
-- SELECT * FROM cron.job;

-- To remove the cron job if needed:
-- SELECT cron.unschedule('daily-quote-6-30-pm'); 