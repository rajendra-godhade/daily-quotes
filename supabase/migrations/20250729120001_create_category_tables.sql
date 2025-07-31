-- Create separate tables for different quote categories

-- Motivational Quotes Table
CREATE TABLE IF NOT EXISTS motivational_quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    author_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inspirational Quotes Table
CREATE TABLE IF NOT EXISTS inspirational_quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    author_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wisdom Quotes Table
CREATE TABLE IF NOT EXISTS wisdom_quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    author_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Success Quotes Table
CREATE TABLE IF NOT EXISTS success_quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    author_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Love Quotes Table
CREATE TABLE IF NOT EXISTS love_quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    author_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Life Quotes Table
CREATE TABLE IF NOT EXISTS life_quotes (
    id SERIAL PRIMARY KEY,
    quote TEXT NOT NULL,
    author VARCHAR(255) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    author_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_motivational_quotes_date ON motivational_quotes(date);
CREATE INDEX IF NOT EXISTS idx_inspirational_quotes_date ON inspirational_quotes(date);
CREATE INDEX IF NOT EXISTS idx_wisdom_quotes_date ON wisdom_quotes(date);
CREATE INDEX IF NOT EXISTS idx_success_quotes_date ON success_quotes(date);
CREATE INDEX IF NOT EXISTS idx_love_quotes_date ON love_quotes(date);
CREATE INDEX IF NOT EXISTS idx_life_quotes_date ON life_quotes(date);

-- Insert sample data for each category

-- Motivational Quotes
INSERT INTO motivational_quotes (quote, author, date) VALUES
('The only way to do great work is to love what you do.', 'Steve Jobs', '2024-01-01'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', '2024-01-02'),
('The future belongs to those who believe in the beauty of their dreams.', 'Eleanor Roosevelt', '2024-01-03'),
('Don''t watch the clock; do what it does. Keep going.', 'Sam Levenson', '2024-01-04'),
('The only limit to our realization of tomorrow is our doubts of today.', 'Franklin D. Roosevelt', '2024-01-05'),
('Believe you can and you''re halfway there.', 'Theodore Roosevelt', '2024-01-06'),
('It does not matter how slowly you go as long as you do not stop.', 'Confucius', '2024-01-07'),
('The way to get started is to quit talking and begin doing.', 'Walt Disney', '2024-01-08'),
('Success usually comes to those who are too busy to be looking for it.', 'Henry David Thoreau', '2024-01-09'),
('The harder you work for something, the greater you''ll feel when you achieve it.', 'Unknown', '2024-01-10');

-- Inspirational Quotes
INSERT INTO inspirational_quotes (quote, author, date) VALUES
('The best way to predict the future is to create it.', 'Peter Drucker', '2024-01-01'),
('Everything you''ve ever wanted is on the other side of fear.', 'George Addair', '2024-01-02'),
('The mind is everything. What you think you become.', 'Buddha', '2024-01-03'),
('The only person you are destined to become is the person you decide to be.', 'Ralph Waldo Emerson', '2024-01-04'),
('Life is 10% what happens to you and 90% how you react to it.', 'Charles R. Swindoll', '2024-01-05'),
('The greatest glory in living lies not in never falling, but in rising every time we fall.', 'Nelson Mandela', '2024-01-06'),
('In the middle of difficulty lies opportunity.', 'Albert Einstein', '2024-01-07'),
('What you get by achieving your goals is not as important as what you become by achieving your goals.', 'Zig Ziglar', '2024-01-08'),
('The only impossible journey is the one you never begin.', 'Tony Robbins', '2024-01-09'),
('Dream big and dare to fail.', 'Norman Vaughan', '2024-01-10');

-- Wisdom Quotes
INSERT INTO wisdom_quotes (quote, author, date) VALUES
('The only true wisdom is in knowing you know nothing.', 'Socrates', '2024-01-01'),
('Knowledge speaks, but wisdom listens.', 'Jimi Hendrix', '2024-01-02'),
('The fool doth think he is wise, but the wise man knows himself to be a fool.', 'William Shakespeare', '2024-01-03'),
('Wisdom comes from experience, and experience comes from mistakes.', 'Unknown', '2024-01-04'),
('The more you know, the more you realize you don''t know.', 'Aristotle', '2024-01-05'),
('Wisdom is not a product of schooling but of the lifelong attempt to acquire it.', 'Albert Einstein', '2024-01-06'),
('The wise man learns more from his enemies than the fool from his friends.', 'Baltasar Gracián', '2024-01-07'),
('Wisdom is the reward you get for a lifetime of listening when you''d have preferred to talk.', 'Doug Larson', '2024-01-08'),
('The older I get, the more I realize that the greatest wisdom is kindness.', 'Unknown', '2024-01-09'),
('Wisdom begins in wonder.', 'Socrates', '2024-01-10');

-- Success Quotes
INSERT INTO success_quotes (quote, author, date) VALUES
('Success is walking from failure to failure with no loss of enthusiasm.', 'Winston Churchill', '2024-01-01'),
('The road to success and the road to failure are almost exactly the same.', 'Colin R. Davis', '2024-01-02'),
('Success is not the key to happiness. Happiness is the key to success.', 'Albert Schweitzer', '2024-01-03'),
('I find that the harder I work, the more luck I seem to have.', 'Thomas Jefferson', '2024-01-04'),
('Success is not in what you have, but who you are.', 'Bo Bennett', '2024-01-05'),
('The secret of success is to do the common thing uncommonly well.', 'John D. Rockefeller Jr.', '2024-01-06'),
('Success is not just about making money. It''s about making a difference.', 'Unknown', '2024-01-07'),
('The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack in will.', 'Vince Lombardi', '2024-01-08'),
('Success is not final, failure is not fatal: it is the courage to continue that counts.', 'Winston Churchill', '2024-01-09'),
('The only place where success comes before work is in the dictionary.', 'Vidal Sassoon', '2024-01-10');

-- Love Quotes
INSERT INTO love_quotes (quote, author, date) VALUES
('The best thing to hold onto in life is each other.', 'Audrey Hepburn', '2024-01-01'),
('Love is composed of a single soul inhabiting two bodies.', 'Aristotle', '2024-01-02'),
('The greatest happiness of life is the conviction that we are loved.', 'Victor Hugo', '2024-01-03'),
('Love is not about how many days, months, or years you have been together. Love is about how much you love each other every single day.', 'Unknown', '2024-01-04'),
('In all the world, there is no heart for me like yours.', 'Maya Angelou', '2024-01-05'),
('Love is the poetry of the senses.', 'Honoré de Balzac', '2024-01-06'),
('The only thing we never get enough of is love; and the only thing we never give enough of is love.', 'Henry Miller', '2024-01-07'),
('Love is like the wind, you can''t see it but you can feel it.', 'Nicholas Sparks', '2024-01-08'),
('To love and be loved is to feel the sun from both sides.', 'David Viscott', '2024-01-09'),
('Love is the master key that opens the gates of happiness.', 'Oliver Wendell Holmes', '2024-01-10');

-- Life Quotes
INSERT INTO life_quotes (quote, author, date) VALUES
('Life is what happens when you''re busy making other plans.', 'John Lennon', '2024-01-01'),
('The purpose of our lives is to be happy.', 'Dalai Lama', '2024-01-02'),
('Life is really simple, but we insist on making it complicated.', 'Confucius', '2024-01-03'),
('Get busy living or get busy dying.', 'Stephen King', '2024-01-04'),
('You only live once, but if you do it right, once is enough.', 'Mae West', '2024-01-05'),
('Life is not a problem to be solved, but a reality to be experienced.', 'Søren Kierkegaard', '2024-01-06'),
('The good life is one inspired by love and guided by knowledge.', 'Bertrand Russell', '2024-01-07'),
('Life is either a daring adventure or nothing at all.', 'Helen Keller', '2024-01-08'),
('The unexamined life is not worth living.', 'Socrates', '2024-01-09'),
('Life is a journey, not a destination.', 'Ralph Waldo Emerson', '2024-01-10'); 