-- Create quotes table
CREATE TABLE IF NOT EXISTS public.quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author TEXT NOT NULL,
    date DATE NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Quotes are viewable by everyone" ON public.quotes
    FOR SELECT USING (true);

-- Create index for date
CREATE INDEX IF NOT EXISTS quotes_date_idx ON public.quotes(date);

-- Insert sample quotes starting from current date
INSERT INTO public.quotes (quote, author, date) VALUES
('The only way to do great work is to love what you do.', 'Steve Jobs', CURRENT_DATE),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', CURRENT_DATE + INTERVAL '1 day'),
('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', CURRENT_DATE + INTERVAL '2 days'),
('It does not matter how slowly you go as long as you do not stop.', 'Confucius', CURRENT_DATE + INTERVAL '3 days'),
('The only limit to our realization of tomorrow will be our doubts of today.', 'Franklin D. Roosevelt', CURRENT_DATE + INTERVAL '4 days'),
('Believe you can and you''re halfway there.', 'Theodore Roosevelt', CURRENT_DATE + INTERVAL '5 days'),
('The way to get started is to quit talking and begin doing.', 'Walt Disney', CURRENT_DATE + INTERVAL '6 days'),
('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', CURRENT_DATE + INTERVAL '7 days'),
('The only person you are destined to become is the person you decide to be.', 'Ralph Waldo Emerson', CURRENT_DATE + INTERVAL '8 days'),
('Success usually comes to those who are too busy to be looking for it.', 'Henry David Thoreau', CURRENT_DATE + INTERVAL '9 days')
ON CONFLICT (date) DO NOTHING;
