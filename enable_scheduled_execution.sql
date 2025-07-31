-- Enable Scheduled Execution for Daily Quote Function
-- Run this in Supabase SQL Editor

-- Step 1: Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create a simple function to call the Edge Function
CREATE OR REPLACE FUNCTION call_daily_quote_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- This will call your Edge Function at 6:30 PM daily
  -- The function URL is: https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/send-daily-quote
  PERFORM net.http_post(
    url := 'https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/send-daily-quote',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  
  RAISE NOTICE 'Daily quote function triggered at %', now();
END;
$$;

-- Step 3: Schedule the cron job for 6:30 PM daily
SELECT cron.schedule(
  'daily-quote-6-30-pm',  -- job name
  '30 18 * * *',          -- cron expression (6:30 PM daily)
  'SELECT call_daily_quote_function();'  -- function to call
);

-- Step 4: Verify the cron job was created
SELECT * FROM cron.job WHERE jobname = 'daily-quote-6-30-pm';

-- To test immediately (optional):
-- SELECT call_daily_quote_function();

-- To remove the cron job if needed:
-- SELECT cron.unschedule('daily-quote-6-30-pm'); 