import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { createSubscriptionOrder, initializeRazorpayPayment } from '../services/razorpayService';

interface TopNavProps {
  userName?: string;
  userEmail?: string;
  onUserClick?: () => void;
  onSignOut?: () => void;
  onHomeClick?: () => void;
  onSavedQuotesClick?: () => void;
}

const TopNav: React.FC<TopNavProps> = ({ userName, userEmail, onUserClick, onSignOut, onHomeClick, onSavedQuotesClick }) => {
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'subscribed' | 'unsubscribed' | null>(null);

  // Check subscription status on mount
  React.useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  const checkSubscriptionStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('is_subscribed, subscription_end_date, subscription_status')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      // Check if subscription is active and not expired
      const now = new Date();
      const endDate = data?.subscription_end_date ? new Date(data.subscription_end_date) : null;
      
      const isActive = data?.is_subscribed === true && 
                      data?.subscription_status === 'active' && 
                      endDate && 
                      endDate > now;

      setSubscriptionStatus(isActive ? 'subscribed' : 'unsubscribed');
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const handleSubscriptionToggle = async () => {
    try {
      setIsSubscribing(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Please sign in to subscribe');
        return;
      }

      // Get user's WhatsApp number from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile?.phone) {
        alert('Please add your WhatsApp number in profile settings first');
        return;
      }

      if (subscriptionStatus === 'subscribed') {
        // Handle unsubscribe
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            is_subscribed: false,
            subscription_status: 'cancelled'
          })
          .eq('id', user.id);

        if (updateError) throw updateError;

        setSubscriptionStatus('unsubscribed');
        alert('Successfully unsubscribed from daily quotes');
      } else {
        // Handle new subscription with payment
        try {
          // Create order
          const orderData = await createSubscriptionOrder();

          // Initialize Razorpay payment
          await initializeRazorpayPayment(
            orderData,
            () => {
              // Success callback
              setSubscriptionStatus('subscribed');
              alert('Successfully subscribed to daily quotes!');
            },
            (error) => {
              // Error callback
              console.error('Payment failed:', error);
              alert('Payment failed. Please try again.');
            }
          );
        } catch (error) {
          console.error('Subscription error:', error);
          alert('Failed to process subscription. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
      alert('Failed to update subscription. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <nav className="dashboard-nav">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span className="dashboard-home-icon" onClick={onHomeClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <svg width="28" height="28" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12L12 4l9 8"/><path d="M9 21V9h6v12"/></svg>
        </span>
        <div className="dashboard-user" onClick={onUserClick} style={{ cursor: 'pointer' }}>
          <span className="dashboard-user-icon">
            <svg width="28" height="28" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-2.2 3.6-4 8-4s8 1.8 8 4"/></svg>
          </span>
          <span className="dashboard-user-name">{userName || userEmail || 'User'}</span>
        </div>
        {onSavedQuotesClick && (
          <button className="dashboard-savedquotes-btn" onClick={onSavedQuotesClick}>
            Saved Quotes
          </button>
        )}
        <button 
          className={`dashboard-subscription-btn ${subscriptionStatus === 'subscribed' ? 'subscribed' : ''}`} 
          onClick={handleSubscriptionToggle}
          disabled={isSubscribing}
        >
          {isSubscribing ? 'Processing...' : subscriptionStatus === 'subscribed' ? 'Unsubscribe' : 'Subscribe (₹99/month)'}
        </button>
      </div>
      {onSignOut && (
        <button className="dashboard-signout" onClick={onSignOut}>
          SIGN OUT <span style={{marginLeft: 6}}>&#8594;</span>
        </button>
      )}
      <style>{`
        .dashboard-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem 2rem 1.5rem 2rem;
          border-bottom: 2px solid #eee;
        }
        .dashboard-home-icon {
          display: flex;
          align-items: center;
          margin-right: 8px;
        }
        .dashboard-user {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }
        .dashboard-user-icon {
          display: flex;
          align-items: center;
        }
        .dashboard-user-name {
          font-size: 1.1rem;
          color: #111;
          font-weight: 500;
          min-width: 60px;
          display: inline-block;
          vertical-align: middle;
        }
        .dashboard-savedquotes-btn {
          background: #fff;
          color: #111;
          font-weight: 600;
          font-size: 1rem;
          border: 1.5px solid #111;
          border-radius: 4px;
          padding: 0.5rem 1.2rem;
          cursor: pointer;
          letter-spacing: 1px;
          margin-left: 16px;
          transition: background 0.2s, color 0.2s;
        }
        .dashboard-savedquotes-btn:hover {
          background: #111;
          color: #fff;
        }
        .dashboard-subscription-btn {
          background: #4CAF50;
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1.2rem;
          cursor: pointer;
          letter-spacing: 1px;
          margin-left: 16px;
          transition: background 0.2s;
        }
        .dashboard-subscription-btn:hover {
          background: #388E3C;
        }
        .dashboard-subscription-btn.subscribed {
          background: #f44336;
        }
        .dashboard-subscription-btn.subscribed:hover {
          background: #d32f2f;
        }
        .dashboard-subscription-btn:disabled {
          background: #9E9E9E;
          cursor: not-allowed;
        }
        .dashboard-signout {
          background: #fff;
          color: #111;
          font-weight: 600;
          font-size: 1rem;
          border: 1.5px solid #111;
          border-radius: 4px;
          padding: 0.5rem 1.2rem;
          cursor: pointer;
          letter-spacing: 1px;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: background 0.2s, color 0.2s;
        }
        .dashboard-signout:hover {
          background: #111;
          color: #fff;
        }
        @media (max-width: 600px) {
          .dashboard-nav {
            padding: 1rem 0.5rem 1rem 0.5rem;
          }
        }
      `}</style>
    </nav>
  );
};

export default TopNav; 