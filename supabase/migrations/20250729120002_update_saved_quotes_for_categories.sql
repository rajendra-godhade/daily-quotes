-- Update saved_quotes table to handle category quotes
-- Add new columns to track which table the quote came from

ALTER TABLE saved_quotes 
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS source_table VARCHAR(50);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_saved_quotes_category ON saved_quotes(category);
CREATE INDEX IF NOT EXISTS idx_saved_quotes_source_table ON saved_quotes(source_table); 