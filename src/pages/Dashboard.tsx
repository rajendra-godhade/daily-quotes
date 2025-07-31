import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import { User } from '@supabase/supabase-js';

interface Profile {
  email?: string;
  full_name?: string;
  avatar_url?: string;
}

interface Quote {
  id: number;
  quote: string;
  author: string;
  date: string;
  author_photo?: string;
  category?: string;
}

const Dashboard: React.FC = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const [savedIds, setSavedIds] = useState<number[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [whatsappTesting, setWhatsappTesting] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [dailyQuoteTesting, setDailyQuoteTesting] = useState(false);
  const [dailyQuoteMessage, setDailyQuoteMessage] = useState('');
  
  // Category-based quotes state
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoryQuotes, setCategoryQuotes] = useState<Quote[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const quotesPerPage = 30;

  // Fetch user and profile
  useEffect(() => {
    let mounted = true;

    const checkAuthAndProfile = async () => {
      try {
        if (!mounted) return;
        setProfileLoading(true);
        
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return; // Check again after async operation
        
        if (!session) {
          console.log('No active session found, redirecting to signin');
          navigate('/signin', { replace: true });
          return;
        }

        // Get user details
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!mounted) return; // Check again after async operation
        
        if (!user) {
          throw new Error('No user found');
        }

        if (mounted) {
          setUser(user);
        }
        
        // Try to get the profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST204') {
          throw profileError;
        }

        if (!profileData) {
          // Create a basic profile
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              phone: user.phone || '',
              email: user.email || '',
              full_name: ''
            });

          if (createError) {
            console.error('Error creating profile:', createError);
          }

          if (mounted) {
            setProfile({
              full_name: '',
              email: user.email || '',
            });
          }
        } else if (mounted) {
          setProfile({
            full_name: profileData.full_name || '',
            email: user.email || '',
          });
        }
      } catch (error) {
        console.error('Dashboard auth check error:', error);
        if (mounted) {
          // Clear any stale auth state
          await supabase.auth.signOut();
          navigate('/signin', { replace: true });
        }
      } finally {
        if (mounted) {
          setProfileLoading(false);
        }
      }
    };

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/signin', { replace: true });
      }
    });

    // Initial check
    checkAuthAndProfile();

    // Cleanup
    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Fetch quotes from Supabase
  useEffect(() => {
    const fetchQuotes = async () => {
      setQuotesLoading(true);
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .order('date', { ascending: true });
      if (error) {
        console.error('Error fetching quotes:', error);
        setQuotes([]);
        setCurrentQuoteIndex(0);
      } else {
        const quotesArr = data || [];
        // Find today's date in the sorted array
        const today = new Date().toISOString().split('T')[0];
        let todayIndex = quotesArr.findIndex(q => q.date === today);
        // If no quote for today, show the next available quote (or last if today is after all quotes)
        if (todayIndex === -1) {
          todayIndex = quotesArr.findIndex(q => q.date > today);
          if (todayIndex === -1 && quotesArr.length > 0) todayIndex = quotesArr.length - 1;
        }
        setQuotes(quotesArr);
        setCurrentQuoteIndex(todayIndex >= 0 ? todayIndex : 0);
      }
      setQuotesLoading(false);
    };
    fetchQuotes();
  }, []);

  // Fetch categories and category quotes
  useEffect(() => {
    const fetchCategoriesAndQuotes = async () => {
      setCategoryLoading(true);
      
      try {
        console.log('Starting to fetch category quotes...');
        
        // Define category table mappings
        const categoryTables = {
          'motivational': 'motivational_quotes',
          'inspirational': 'inspirational_quotes',
          'wisdom': 'wisdom_quotes',
          'success': 'success_quotes',
          'love': 'love_quotes',
          'life': 'life_quotes'
        };

        // Set available categories
        setCategories(['motivational', 'inspirational', 'wisdom', 'success', 'love', 'life']);

        // Fetch quotes from all category tables in parallel
        const fetchPromises = Object.entries(categoryTables).map(async ([category, tableName]) => {
          console.log(`Fetching from table: ${tableName}`);
          
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .order('date', { ascending: false });

            if (error) {
              console.error(`Error fetching ${category} quotes:`, error);
              return [];
            }
            
            if (data) {
              console.log(`Found ${data.length} quotes in ${category} table`);
              // Add category to each quote
              return data.map(quote => ({
                ...quote,
                category: category
              }));
            }
            
            console.log(`No data found in ${category} table`);
            return [];
          } catch (error) {
            console.error(`Error fetching ${category} quotes:`, error);
            return [];
          }
        });
        
        const results = await Promise.all(fetchPromises);
        const allQuotes: Quote[] = results.flat();

        console.log('Total quotes fetched:', allQuotes.length);
        setCategoryQuotes(allQuotes);
      } catch (error) {
        console.error('Error fetching category quotes:', error);
        setCategoryQuotes([]);
        setCategories([]);
      }
      
      setCategoryLoading(false);
    };

    fetchCategoriesAndQuotes();
  }, []);

  // Reset pagination when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  // Filter quotes by selected category
  const filteredCategoryQuotes = selectedCategory === 'all' 
    ? categoryQuotes 
    : categoryQuotes.filter(quote => quote.category === selectedCategory);

  // Pagination logic
  const totalPages = Math.ceil(filteredCategoryQuotes.length / quotesPerPage);
  const startIndex = (currentPage - 1) * quotesPerPage;
  const endIndex = startIndex + quotesPerPage;
  const paginatedQuotes = filteredCategoryQuotes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of category section when page changes
    const categorySection = document.querySelector('.category-quotes-section');
    if (categorySection) {
      categorySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const quote = quotes[currentQuoteIndex];

  const hasPrev = currentQuoteIndex > 0;
  const hasNext = currentQuoteIndex < quotes.length - 1;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/signin';
  };

  // Navigation for previous/next day
  const changeDay = (delta: number) => {
    let newIndex = currentQuoteIndex + delta;
    if (newIndex < 0 || newIndex >= quotes.length) return;
    setCurrentQuoteIndex(newIndex);
  };

  const handleSaveQuote = async (quote: Quote) => {
    if (!user || !quote) return;
    setSavingId(quote.id);
    
    try {
      // Determine the source table based on category
      let sourceTable = 'quotes'; // default for main quotes table
      if (quote.category) {
        const categoryTableMap: { [key: string]: string } = {
          'motivational': 'motivational_quotes',
          'inspirational': 'inspirational_quotes',
          'wisdom': 'wisdom_quotes',
          'success': 'success_quotes',
          'love': 'love_quotes',
          'life': 'life_quotes'
        };
        sourceTable = categoryTableMap[quote.category] || 'quotes';
      }

      const { error } = await supabase
        .from('saved_quotes')
        .insert([{ 
          user_id: user.id, 
          quote_id: quote.id,
          category: quote.category,
          source_table: sourceTable
        }]);
      
      if (!error) {
        setSavedIds((prev) => [...prev, quote.id]);
      } else {
        console.error('Error saving quote:', error);
      }
    } catch (error) {
      console.error('Error saving quote:', error);
    } finally {
      setSavingId(null);
    }
  };

  const isSaved = (quoteId: number) => savedIds.includes(quoteId);

  const handleWhatsAppTest = async () => {
    if (!user) {
      alert('Please sign in to test WhatsApp');
      return;
    }

    setWhatsappTesting(true);
    setWhatsappMessage('');

    try {
      // Get user's phone number from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error('Failed to fetch profile');
      }

      if (!profile?.phone) {
        setWhatsappMessage('❌ No WhatsApp number found. Please add your phone number in profile settings.');
        return;
      }

      // Call the test WhatsApp function
      const response = await fetch('https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/test-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          phone: profile.phone
        })
      });

      const result = await response.json();

      if (result.success) {
        setWhatsappMessage('✅ Test WhatsApp message sent successfully! Check your WhatsApp.');
      } else {
        setWhatsappMessage(`❌ Failed to send WhatsApp message: ${result.error}`);
      }
    } catch (error) {
      console.error('WhatsApp test error:', error);
      setWhatsappMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setWhatsappTesting(false);
    }
  };

  const handleDailyQuoteTest = async () => {
    if (!user) {
      alert('Please sign in to test daily quotes');
      return;
    }

    setDailyQuoteTesting(true);
    setDailyQuoteMessage('');

    try {
      // Call the daily quote function
      const response = await fetch('https://hfhiqbjqppyruzkljpvd.supabase.co/functions/v1/send-daily-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setDailyQuoteMessage(`✅ Daily quote function executed successfully! ${result.message}`);
      } else {
        setDailyQuoteMessage(`❌ Daily quote function failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Daily quote test error:', error);
      setDailyQuoteMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDailyQuoteTesting(false);
    }
  };

  return (
    <div className="dashboard-root">
      <TopNav
        userName={profileLoading ? 'Loading...' : (profile?.full_name || 'User')}
        userEmail={profile?.email}
        onUserClick={() => navigate('/profile-settings')}
        onSignOut={handleLogout}
        onHomeClick={() => navigate('/dashboard')}
        onSavedQuotesClick={() => navigate('/saved-quotes')}
      />
      <main className="dashboard-main">
        <h1 className="dashboard-title">Quote of the day</h1>
        <div className="dashboard-quote-card">
          {quotesLoading ? (
            <div className="dashboard-loading">Loading...</div>
          ) : quote ? (
            <>
              <div className="dashboard-quote-img-wrap">
                {quote.author_photo ? (
                  <img
                    src={quote.author_photo}
                    alt={quote.author}
                    className="dashboard-quote-img"
                  />
                ) : (
                  <div className="dashboard-photo-placeholder">
                    <svg width="80" height="80" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-2.2 3.6-4 8-4s8 1.8 8 4"/>
                    </svg>
                  </div>
                )}
              </div>
              <div className="dashboard-quote-content">
                <div className="dashboard-quote-text">"{quote.quote}"</div>
                <div className="dashboard-quote-author">— <b>{quote.author}</b></div>
              </div>
              <div className="dashboard-quote-actions">
                <button
                  className={`favorite-icon-btn${isSaved(quote.id) ? ' saved' : ''}`}
                  onClick={() => handleSaveQuote(quote)}
                  disabled={savingId === quote.id || isSaved(quote.id)}
                  title={isSaved(quote.id) ? 'Saved' : 'Save this quote'}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill={isSaved(quote.id) ? "#e53935" : "none"}
                    stroke="#e53935"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 21C12 21 4 13.36 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.36 16 21 16 21H12Z" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div className="dashboard-loading">No quote found for this day.</div>
          )}
        </div>
        <div className="dashboard-quote-nav">
          <button className="dashboard-quote-nav-btn" onClick={() => changeDay(-1)} disabled={!hasPrev}>&#8592;</button>
          <button className="dashboard-quote-nav-btn" onClick={() => changeDay(1)} disabled={!hasNext}>&#8594;</button>
        </div>
        
        {/* Category-Based Quotes Section */}
        <div className="category-quotes-section">
          <h2 className="category-quotes-title">Explore Quotes by Category</h2>
          
          {/* Category Tabs */}
          <div className="category-tabs">
            <button
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All Categories
            </button>
            {categories.map((category) => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
          
          {/* Category Quotes Grid */}
          <div className="category-quotes-grid">
            {categoryLoading ? (
              <div className="category-loading">Loading quotes...</div>
            ) : filteredCategoryQuotes.length > 0 ? (
              paginatedQuotes.map((quote) => (
<div key={`${String(quote.category || 'unknown')}-${quote.id}`} className="category-quote-card">
                  <div className="category-quote-content">
                    <div className="category-quote-text">"{quote.quote}"</div>
                    <div className="category-quote-author">— {quote.author}</div>
                    {quote.category && (
                      <div className="category-quote-category">{quote.category}</div>
                    )}
                  </div>
                  <div className="category-quote-actions">
                    <button
                      className={`category-favorite-btn${isSaved(quote.id) ? ' saved' : ''}`}
                      onClick={() => handleSaveQuote(quote)}
                      disabled={savingId === quote.id || isSaved(quote.id)}
                      title={isSaved(quote.id) ? 'Saved' : 'Save this quote'}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill={isSaved(quote.id) ? "#e53935" : "none"}
                        stroke="#e53935"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 21C12 21 4 13.36 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.36 16 21 16 21H12Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="category-no-quotes">
                No quotes found for this category.
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {filteredCategoryQuotes.length > quotesPerPage && (
            <div className="pagination-controls">
              <div className="pagination-info">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredCategoryQuotes.length)} of {filteredCategoryQuotes.length} quotes
              </div>
              <div className="pagination-buttons">
                <button
                  className="pagination-btn pagination-prev"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </button>
                
                {/* Page numbers */}
                <div className="pagination-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`pagination-btn pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  className="pagination-btn pagination-next"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* WhatsApp Test Section */}
        <div className="whatsapp-test-section">
          <h3 className="whatsapp-test-title">🧪 WhatsApp Integration Test</h3>
          <p className="whatsapp-test-description">
            Test if WhatsApp messages are working properly. This will send a test message to your registered phone number.
          </p>
          <button 
            className="whatsapp-test-btn"
            onClick={handleWhatsAppTest}
            disabled={whatsappTesting}
          >
            {whatsappTesting ? 'Sending...' : '📱 Test WhatsApp Message'}
          </button>
          {whatsappMessage && (
            <div className={`whatsapp-message ${whatsappMessage.includes('✅') ? 'success' : 'error'}`}>
              {whatsappMessage}
            </div>
          )}
          
          {/* Daily Quote Test Section */}
          <div className="daily-quote-test-section">
            <h3 className="daily-quote-test-title">📅 Daily Quote Auto-Schedule Test</h3>
            <p className="daily-quote-test-description">
              Test the daily quote function that will run automatically at 6:30 PM. This simulates the scheduled job.
            </p>
            <button 
              className="daily-quote-test-btn"
              onClick={handleDailyQuoteTest}
              disabled={dailyQuoteTesting}
            >
              {dailyQuoteTesting ? 'Testing...' : '📅 Test Daily Quote Function'}
            </button>
            {dailyQuoteMessage && (
              <div className={`daily-quote-message ${dailyQuoteMessage.includes('✅') ? 'success' : 'error'}`}>
                {dailyQuoteMessage}
              </div>
            )}
          </div>
        </div>
      </main>
      <style>{`
        .dashboard-root {
          min-height: 100vh;
          background: #fff;
          width:100vw;
        }
        .dashboard-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1rem 0 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .dashboard-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 2.5rem;
          text-align: center;
          color: #000;
        }
        .dashboard-quote-card {
          display: flex;
          flex-direction: row;
          align-items: stretch;
          background: #fff;
          border: 2px solid #444;
          border-radius: 0;
          min-height: 260px;
          width: 100%;
          max-width: 800px;
          margin-bottom: 2.5rem;
          overflow: hidden;
        }
        .dashboard-quote-img-wrap {
          width: 260px;
          height: 260px;
          background: #eee;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .dashboard-photo-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #eee;
        }
        .dashboard-quote-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .dashboard-quote-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 2.5rem 2rem 2.5rem 2rem;
        }
        .dashboard-quote-text {
          font-size: 1.35rem;
          margin-bottom: 2.5rem;
          color: #111;
        }
        .dashboard-quote-author {
          font-size: 1.2rem;
          color: #111;
          text-align: right;
        }
        .dashboard-quote-nav {
          display: flex;
          gap: 2rem;
          margin-top: 0.5rem;
        }
        .dashboard-quote-nav-btn {
          background: #111;
          color: #fff;
          border: none;
          border-radius: 4px;
          font-size: 2rem;
          width: 56px;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .dashboard-quote-nav-btn:hover {
          background: #444;
        }
        .dashboard-loading {
          width: 100%;
          text-align: center;
          padding: 3rem 0;
          color: #888;
        }
        .dashboard-quote-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1.5rem;
          position: relative;
        }
        
        .favorite-icon-btn {
          position: absolute;
          top: -18px;
          right: 4px;
          background: #111;
          border: none;
          border-radius: 50%;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s;
          z-index: 2;
        }
        .favorite-icon-btn svg {
          display: block;
        }
        .favorite-icon-btn.saved {
          background: #fff;
        }
        .favorite-icon-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* WhatsApp Test Section Styles */
        .whatsapp-test-section {
          margin-top: 3rem;
          padding: 2rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px solid #e9ecef;
          max-width: 600px;
          width: 100%;
        }
        
        .whatsapp-test-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #333;
          text-align: center;
        }
        
        .whatsapp-test-description {
          font-size: 1rem;
          color: #666;
          margin-bottom: 1.5rem;
          text-align: center;
          line-height: 1.5;
        }
        
        .whatsapp-test-btn {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          padding: 1rem 2rem;
          background: #25d366;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .whatsapp-test-btn:hover:not(:disabled) {
          background: #128c7e;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        }
        
        .whatsapp-test-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .whatsapp-message {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 500;
          text-align: center;
        }
        
        .whatsapp-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .whatsapp-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
        
        /* Daily Quote Test Section Styles */
        .daily-quote-test-section {
          margin-top: 2rem;
          padding: 2rem;
          background: #f0f8ff;
          border-radius: 12px;
          border: 2px solid #e6f3ff;
          max-width: 600px;
          width: 100%;
        }
        
        .daily-quote-test-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #333;
          text-align: center;
        }
        
        .daily-quote-test-description {
          font-size: 1rem;
          color: #666;
          margin-bottom: 1.5rem;
          text-align: center;
          line-height: 1.5;
        }
        
        .daily-quote-test-btn {
          display: block;
          width: 100%;
          max-width: 300px;
          margin: 0 auto;
          padding: 1rem 2rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .daily-quote-test-btn:hover:not(:disabled) {
          background: #0056b3;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }
        
        .daily-quote-test-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .daily-quote-message {
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 8px;
          font-weight: 500;
          text-align: center;
        }
        
        .daily-quote-message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        
        .daily-quote-message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        /* Category-Based Quotes Section Styles */
        .category-quotes-section {
          margin-top: 4rem;
          width: 100%;
          max-width: 1200px;
        }
        
        .category-quotes-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-align: center;
          color: #000;
        }
        
        .category-tabs {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .category-tab {
          padding: 0.75rem 1.5rem;
          background: #f8f9fa;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.3s ease;
          white-space: nowrap;
        }
        
        .category-tab:hover {
          background: #e9ecef;
          border-color: #dee2e6;
          transform: translateY(-2px);
        }
        
        .category-tab.active {
          background: #007bff;
          border-color: #007bff;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }
        
        .category-quotes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 1.5rem;
          width: 100%;
        }
        
        .category-quote-card {
          background: #fff;
          border: 2px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          position: relative;
          transition: all 0.3s ease;
          min-height: 200px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }
        
        .category-quote-card:hover {
          border-color: #007bff;
          box-shadow: 0 8px 25px rgba(0, 123, 255, 0.15);
          transform: translateY(-4px);
        }
        
        .category-quote-content {
          flex: 1;
        }
        
        .category-quote-text {
          font-size: 1.1rem;
          line-height: 1.6;
          color: #333;
          margin-bottom: 1rem;
          font-style: italic;
        }
        
        .category-quote-author {
          font-size: 1rem;
          color: #666;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .category-quote-category {
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
        
        .category-quote-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: 1rem;
        }
        
        .category-favorite-btn {
          background: #fff;
          border: 2px solid #e53935;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .category-favorite-btn:hover:not(:disabled) {
          background: #e53935;
          transform: scale(1.1);
        }
        
        .category-favorite-btn.saved {
          background: #e53935;
        }
        
        .category-favorite-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .category-loading {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: #666;
          font-size: 1.1rem;
        }
        
        .category-no-quotes {
          grid-column: 1 / -1;
          text-align: center;
          padding: 3rem;
          color: #666;
          font-size: 1.1rem;
          background: #f8f9fa;
          border-radius: 12px;
          border: 2px dashed #dee2e6;
        }
        
        /* Pagination Styles */
        .pagination-controls {
          margin-top: 3rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        
        .pagination-info {
          font-size: 1rem;
          color: #666;
          text-align: center;
        }
        
        .pagination-buttons {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-wrap: wrap;
          justify-content: center;
        }
        
        .pagination-btn {
          padding: 0.75rem 1rem;
          background: #fff;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .pagination-btn:hover:not(:disabled) {
          background: #f8f9fa;
          border-color: #007bff;
          color: #007bff;
          transform: translateY(-2px);
        }
        
        .pagination-btn.active {
          background: #007bff;
          border-color: #007bff;
          color: white;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
        }
        
        .pagination-btn:disabled {
          background: #f8f9fa;
          border-color: #e9ecef;
          color: #adb5bd;
          cursor: not-allowed;
          opacity: 0.6;
        }
        
        .pagination-numbers {
          display: flex;
          gap: 0.25rem;
        }
        
        .pagination-prev,
        .pagination-next {
          padding: 0.75rem 1.5rem;
        }

        @media (max-width: 700px) {
          .dashboard-main {
            padding: 1.5rem 0 0 0;
            max-width: 100vw;
            width: 100vw;
            margin: 0;
          }
          .dashboard-quote-card {
            flex-direction: column;
            min-height: 0;
            max-width: 100vw;
            width: 100vw;
            border-left: none;
            border-right: none;
          }
          .dashboard-quote-img-wrap {
            width: 100vw;
            height: 220px;
          }
          .dashboard-quote-content {
            padding: 1.5rem 1rem 1.5rem 1rem;
          }
          .dashboard-quote-nav {
            width: 100vw;
            justify-content: center;
          }
          .dashboard-quote-nav-btn {
            width: 48px;
            height: 48px;
            font-size: 1.5rem;
          }
          .whatsapp-test-section {
            margin: 2rem 1rem;
            padding: 1.5rem;
          }
          .whatsapp-test-title {
            font-size: 1.3rem;
          }
          .whatsapp-test-btn {
            max-width: 100%;
          }
          .daily-quote-test-section {
            margin: 2rem 1rem;
            padding: 1.5rem;
          }
          .daily-quote-test-title {
            font-size: 1.3rem;
          }
          .daily-quote-test-btn {
            max-width: 100%;
          }
          
          /* Category Quotes Mobile Styles */
          .category-quotes-section {
            margin-top: 2rem;
            padding: 0 1rem;
          }
          
          .category-quotes-title {
            font-size: 1.5rem;
            margin-bottom: 1.5rem;
          }
          
          .category-tabs {
            gap: 0.5rem;
            margin-bottom: 1.5rem;
          }
          
          .category-tab {
            padding: 0.5rem 1rem;
            font-size: 0.9rem;
          }
          
          .category-quotes-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .category-quote-card {
            padding: 1rem;
            min-height: 150px;
          }
          
          .category-quote-text {
            font-size: 1rem;
          }
          
          .category-quote-author {
            font-size: 0.9rem;
          }
          
          .category-quote-category {
            font-size: 0.75rem;
            padding: 0.2rem 0.5rem;
          }
          
          /* Pagination Mobile Styles */
          .pagination-controls {
            margin-top: 2rem;
            gap: 1rem;
            padding: 0 1rem;
          }
          
          .pagination-info {
            font-size: 0.9rem;
          }
          
          .pagination-btn {
            padding: 0.5rem 0.75rem;
            font-size: 0.9rem;
            min-width: 40px;
          }
          
          .pagination-prev,
          .pagination-next {
            padding: 0.5rem 1rem;
          }
          
          .pagination-numbers {
            gap: 0.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard; 