import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { PostgrestError } from '@supabase/supabase-js';
import TopNav from '../components/TopNav';

interface Quote {
  id: number;
  quote: string;
  author: string;
  date: string;
  author_photo?: string;
  category?: string;
}

interface SavedQuote {
  id: number;
  quote_id: number;
  user_id: string;
  category?: string;
  source_table?: string;
  quotes?: Quote;
  categoryQuote?: Quote; // For quotes from category tables
}

const SavedQuotes: React.FC = () => {
  const [savedQuotes, setSavedQuotes] = useState<SavedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserAndQuotes = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (!user) {
          setSavedQuotes([]);
          return;
        }

        // First, get all saved quotes with their metadata
        const { data: savedQuotesData, error: savedError } = await supabase
          .from('saved_quotes')
          .select('*')
          .eq('user_id', user.id);

        if (savedError) {
          console.error('Error fetching saved quotes:', savedError);
          setSavedQuotes([]);
          return;
        }

        // Fetch quotes from different tables based on source_table
        const quotesWithData: SavedQuote[] = [];
        
        for (const savedQuote of savedQuotesData || []) {
          try {
            if (savedQuote.source_table && savedQuote.source_table !== 'quotes') {
              // Fetch from category table
              const { data: categoryQuote, error: categoryError } = await supabase
                .from(savedQuote.source_table)
                .select('*')
                .eq('id', savedQuote.quote_id)
                .single();

              if (!categoryError && categoryQuote) {
                quotesWithData.push({
                  ...savedQuote,
                  categoryQuote: {
                    ...categoryQuote,
                    category: savedQuote.category
                  }
                });
              }
            } else {
              // Fetch from main quotes table
              const { data: mainQuote, error: mainError } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', savedQuote.quote_id)
                .single();

              if (!mainError && mainQuote) {
                quotesWithData.push({
                  ...savedQuote,
                  quotes: mainQuote
                });
              }
            }
          } catch (error) {
            console.error(`Error fetching quote ${savedQuote.quote_id}:`, error);
          }
        }

        setSavedQuotes(quotesWithData);
      } catch (error) {
        console.error('Error:', error);
        setSavedQuotes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndQuotes();
  }, []);

  const handleRemove = async (savedQuoteId: number) => {
    try {
      setRemovingId(savedQuoteId);
      const { error } = await supabase
        .from('saved_quotes')
        .delete()
        .eq('id', savedQuoteId);

      if (error) {
        console.error('Error removing quote:', error);
        return;
      }

      setSavedQuotes((prev) => prev.filter((q) => q.id !== savedQuoteId));
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="savedquotes-root">
      <TopNav
        userName={user?.user_metadata?.full_name || user?.email || 'User'}
        userEmail={user?.email}
        onUserClick={() => navigate('/profile-settings')}
        onSignOut={async () => { await supabase.auth.signOut(); window.location.href = '/signin'; }}
        onHomeClick={() => navigate('/dashboard')}
        onSavedQuotesClick={() => navigate('/saved-quotes')}
      />
      <main className="savedquotes-main">
        <h1 className="savedquotes-title">Saved Quotes</h1>
        {loading ? (
          <div className="savedquotes-loading">Loading...</div>
        ) : savedQuotes.length === 0 ? (
          <div className="savedquotes-empty">You have no saved quotes yet.</div>
        ) : (
          <div className="savedquotes-list">
            {savedQuotes.map((item) => (
              <div className="savedquotes-card" key={`${item.category || 'main'}-${item.quote_id}-${item.id}`}>
                <div className="savedquotes-quote-text">"{item.quotes?.quote || item.categoryQuote?.quote}"</div>
                <div className="savedquotes-quote-author">— <b>{item.quotes?.author || item.categoryQuote?.author}</b></div>
                {item.quotes?.author_photo && (
                  <div className="savedquotes-quote-img-wrap">
                    <img src={item.quotes.author_photo} alt={item.quotes.author} className="savedquotes-quote-img" />
                  </div>
                )}
                {item.categoryQuote?.author_photo && (
                  <div className="savedquotes-quote-img-wrap">
                    <img src={item.categoryQuote.author_photo} alt={item.categoryQuote.author} className="savedquotes-quote-img" />
                  </div>
                )}
                <div className="savedquotes-quote-date">{item.quotes?.date || item.categoryQuote?.date}</div>
                {item.category && (
                  <div className="savedquotes-category-badge">{item.category}</div>
                )}
                <button
                  className="savedquotes-remove-btn"
                  onClick={() => handleRemove(item.id)}
                  disabled={removingId === item.id}
                  title="Remove from saved quotes"
                >
                  {removingId === item.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <style>{`
        .savedquotes-root {
          min-height: 100vh;
          background: #fff;
          width: 100vw;
        }
        .savedquotes-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1rem 0 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .savedquotes-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 2.5rem;
          text-align: center;
          color: #000;
        }
        .savedquotes-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .savedquotes-card {
          background: #fff;
          border: 2px solid #444;
          border-radius: 0;
          padding: 2rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 1.2rem;
        }
        .savedquotes-quote-text {
          font-size: 1.35rem;
          color: #111;
        }
        .savedquotes-quote-author {
          font-size: 1.2rem;
          color: #111;
        }
        .savedquotes-quote-img-wrap {
          width: 80px;
          height: 80px;
          background: #eee;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .savedquotes-quote-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .savedquotes-quote-date {
          font-size: 1rem;
          color: #888;
        }
        .savedquotes-category-badge {
          display: inline-block;
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .savedquotes-loading, .savedquotes-empty {
          width: 100%;
          text-align: center;
          padding: 3rem 0;
          color: #888;
        }
        .savedquotes-remove-btn {
          background: #fff;
          color: #b00;
          border: 1.5px solid #b00;
          border-radius: 4px;
          font-size: 1rem;
          padding: 0.4rem 1rem;
          cursor: pointer;
          margin-top: 0.5rem;
          transition: background 0.2s, color 0.2s;
        }
        .savedquotes-remove-btn:hover {
          background: #b00;
          color: #fff;
        }
        .savedquotes-remove-btn:disabled {
          background: #eee;
          color: #aaa;
          border-color: #aaa;
          cursor: not-allowed;
        }
        @media (max-width: 700px) {
          .savedquotes-main {
            padding: 1.5rem 0 0 0;
            max-width: 100vw;
            width: 100vw;
            margin: 0;
          }
          .savedquotes-card {
            border-left: none;
            border-right: none;
            border-radius: 0;
            padding: 1.2rem 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SavedQuotes;