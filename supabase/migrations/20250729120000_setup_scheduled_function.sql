-- Setup Scheduled Function for Daily Quotes at 6:30 PM
-- This creates a PostgreSQL function that can be scheduled

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;

-- Create a function to trigger the daily quote
CREATE OR REPLACE FUNCTION trigger_daily_quote_scheduled()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  response_status int;
  response_body text;
BEGIN
  -- Call the Supabase Edge Function
  SELECT 
    status,
    content
  INTO 
    response_status,
    response_body
  FROM 
    http((
      'POST',
      'https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/send-daily-quote',
      ARRAY[
        ('Content-Type', 'application/json')::http_header,
        ('Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true))::http_header
      ],
      'application/json',
      '{}'
    ));
    
  -- Log the response
  RAISE NOTICE 'Daily quote function called. Status: %, Response: %', response_status, response_body;
END;
$$;

-- Schedule the cron job to run at 6:30 PM daily (18:30 UTC)
-- Note: You need to replace 'YOUR_SERVICE_ROLE_KEY' with your actual service role key
SELECT cron.schedule(
  'daily-quote-6-30-pm',
  '30 18 * * *',
  'SELECT trigger_daily_quote_scheduled();'
);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION trigger_daily_quote_scheduled() TO authenticated;
GRANT EXECUTE ON FUNCTION trigger_daily_quote_scheduled() TO anon; 