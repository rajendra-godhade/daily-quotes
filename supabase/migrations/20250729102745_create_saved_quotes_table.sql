-- Create saved_quotes table
CREATE TABLE IF NOT EXISTS public.saved_quotes (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    quote_id INTEGER REFERENCES public.quotes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, quote_id)
);

-- Enable RLS
ALTER TABLE public.saved_quotes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own saved quotes" ON public.saved_quotes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved quotes" ON public.saved_quotes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved quotes" ON public.saved_quotes
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS saved_quotes_user_id_idx ON public.saved_quotes(user_id);
CREATE INDEX IF NOT EXISTS saved_quotes_quote_id_idx ON public.saved_quotes(quote_id);
