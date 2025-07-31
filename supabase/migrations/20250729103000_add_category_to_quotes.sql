-- Add category column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'motivation';

-- Create index for category
CREATE INDEX IF NOT EXISTS quotes_category_idx ON public.quotes(category);

-- Update existing quotes with categories
UPDATE public.quotes SET category = 'motivation' WHERE category IS NULL OR category = '';

-- Insert more quotes with different categories (use ON CONFLICT to avoid duplicates)
INSERT INTO public.quotes (quote, author, date, category) VALUES
('Happiness is not something ready made. It comes from your own actions.', 'Dalai Lama', '2025-08-08', 'happiness'),
('The mind is everything. What you think you become.', 'Buddha', '2025-08-09', 'wisdom'),
('Life is what happens when you''re busy making other plans.', 'John Lennon', '2025-08-10', 'life'),
('The greatest glory in living lies not in never falling, but in rising every time we fall.', 'Nelson Mandela', '2025-08-11', 'perseverance'),
('In the middle of difficulty lies opportunity.', 'Albert Einstein', '2025-08-12', 'opportunity'),
('The only impossible journey is the one you never begin.', 'Tony Robbins', '2025-08-13', 'motivation'),
('What you get by achieving your goals is not as important as what you become by achieving your goals.', 'Zig Ziglar', '2025-08-14', 'success'),
('The best way to predict the future is to create it.', 'Peter Drucker', '2025-08-15', 'leadership'),
('Don''t count the days, make the days count.', 'Muhammad Ali', '2025-08-16', 'motivation'),
('The only way to achieve the impossible is to believe it is possible.', 'Charles Kingsleigh', '2025-08-17', 'belief'),
('Your time is limited, don''t waste it living someone else''s life.', 'Steve Jobs', '2025-08-18', 'life'),
('The journey of a thousand miles begins with one step.', 'Lao Tzu', '2025-08-19', 'wisdom'),
('Everything you''ve ever wanted is on the other side of fear.', 'George Addair', '2025-08-20', 'courage'),
('The only person you should try to be better than is the person you were yesterday.', 'Matty Mullins', '2025-08-21', 'self-improvement'),
('Success is walking from failure to failure with no loss of enthusiasm.', 'Winston Churchill', '2025-08-22', 'perseverance'),
('The harder you work for something, the greater you''ll feel when you achieve it.', 'Unknown', '2025-08-23', 'motivation'),
('Dream big and dare to fail.', 'Norman Vaughan', '2025-08-24', 'dreams'),
('The only limit to our realization of tomorrow will be our doubts of today.', 'Franklin D. Roosevelt', '2025-08-25', 'belief'),
('What lies behind us and what lies before us are tiny matters compared to what lies within us.', 'Ralph Waldo Emerson', '2025-08-26', 'inner-strength'),
('The future depends on what you do today.', 'Mahatma Gandhi', '2025-08-27', 'action')
ON CONFLICT (date) DO NOTHING;
