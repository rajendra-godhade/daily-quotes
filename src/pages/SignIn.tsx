import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNavigate } from 'react-router-dom';

const PLANT_IMG = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80';

const SignIn: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

// Redirect to dashboard if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          navigate('/dashboard');
        }
      } catch (error) {
        console.error('Auth check error:', error);
      }
    };
    checkAuth();
  }, [navigate]);

  // Format phone number to international format
  const formatPhoneNumber = (phoneNumber: string) => {
    // Remove any non-digit characters
    const digits = phoneNumber.replace(/\D/g, '');
    
    // Add the + prefix if not present
    if (!phoneNumber.startsWith('+')) {
      // Assuming Indian numbers if no country code is provided
      return digits.startsWith('91') ? `+${digits}` : `+91${digits}`;
    }
    return phoneNumber;
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const formattedPhone = formatPhoneNumber(phone);
      
  const { error } = await supabase.auth.signInWithOtp({ 
    phone: formattedPhone,
  });

      if (error) {
        throw error;
      }

      setPhone(formattedPhone);
      setStep('otp');
      setMessage('OTP sent! Please check your phone.');
    } catch (error: any) {
      console.error('Send OTP Error:', error);
      setMessage(error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms'
      });

      if (error) {
        throw error;
      }

      if (!data?.user) {
        throw new Error('Verification successful but no user data received');
      }

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('No session found after verification');
      }

      // Create/update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          phone: phone
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }

      setMessage('Logged in successfully!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      console.error('Sign in Error:', error);
      setMessage(error.message || 'Failed to verify OTP. Please try again.');
      try {
        await supabase.auth.signOut();
      } catch (signOutError) {
        console.error('Sign out error:', signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setMessage('');

try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      
      if (error) {
        throw error;
      }
      
      setMessage('OTP resent! Please check your phone.');
    } catch (error: any) {
      console.error('Resend OTP Error:', error);
      setMessage(error.message || 'Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setMessage('');
    setOtp('');
  };


  return (
    <div className="signin-root">
      <div className="signin-plant-img" />
      <div className="signin-form-wrap">
        <div className="signin-form-box">
          <div className="signin-header">
            <h1 className="signin-title">Welcome Back</h1>
            <p className="signin-subtitle">Sign in to your Daily Quotes account</p>
          </div>
          
          {step === 'phone' && (
            <form onSubmit={handleSendOtp} className="signin-form">
              <div className="form-group">
                <label htmlFor="phone" className="signin-label">Mobile Number</label>
                <input
                  id="phone"
                  type="tel"
                  placeholder="Enter your mobile number (e.g., +919876543210)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  pattern="^\+?[1-9]\d{1,14}$"
                  className="signin-input"
                />
                <p className="signin-help">Enter number with country code (e.g., +91 for India)</p>
                {import.meta.env.DEV && (
                  <div className="signin-dev-help">
                    <p><strong>Development Test Numbers:</strong></p>
                    <p>+919876543210, +1234567890, +919890050022 (OTP: 123456)</p>
                  </div>
                )}
              </div>
              
              <button type="submit" disabled={loading} className="signin-btn">
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Sending OTP...
                  </>
                ) : (
                  <>
                    Send OTP
                    <span className="signin-arrow">→</span>
                  </>
                )}
              </button>
            </form>
          )}
          
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="signin-form">
              <div className="form-group">
                <label htmlFor="otp" className="signin-label">OTP</label>
                <input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  className="signin-input otp-input"
                />
                <p className="signin-help">Enter the 6-digit code sent to {phone}</p>
              </div>
              
              
              <button type="submit" disabled={loading} className="signin-btn">
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <span className="signin-arrow">→</span>
                  </>
                )}
              </button>
              
              <div className="signin-actions">
                <button 
                  type="button" 
                  onClick={handleResendOtp} 
                  disabled={loading}
                  className="signin-resend-btn"
                >
                  Resend OTP
                </button>
                <button 
                  type="button" 
                  onClick={handleBackToPhone}
                  className="signin-back-btn"
                >
                  ← Back to Phone
                </button>
              </div>
            </form>
          )}
          
          {message && (
            <div className={`signin-message ${message.includes('success') || message.includes('sent') ? 'success' : 'error'}`}>
              <span className="message-icon">
                {message.includes('success') || message.includes('sent') ? '✓' : '⚠'}
              </span>
              {message}
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        body, #root {
          background: #fff !important;
          margin: 0;
          padding: 0;
        }
        
        .signin-root {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: row;
          background: #fff;
          overflow: hidden;
        }
        
        .signin-plant-img {
          width: 50vw;
          min-width: 400px;
          max-width: 50vw;
          height: 100vh;
          background: url(${PLANT_IMG}) center center/cover no-repeat;
          display: block;
          position: relative;
        }
        
        .signin-plant-img::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
        }
        
        .signin-form-wrap {
          width: 50vw;
          min-width: 400px;
          max-width: 50vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff;
          padding: 2rem;
        }
        
        .signin-form-box {
          width: 100%;
          max-width: 420px;
          background: #fff;
          padding: 0;
        }
        
        .signin-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }
        
        .signin-title {
          font-weight: 700;
          font-size: 2.25rem;
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
          letter-spacing: -0.025em;
        }
        
        .signin-subtitle {
          font-size: 1.125rem;
          margin: 0;
          color: #6b7280;
          font-weight: 400;
        }
        
        .signin-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .signin-label {
          font-weight: 600;
          font-size: 0.875rem;
          color: #374151;
          margin: 0;
        }
        
        .signin-input {
          padding: 0.875rem 1rem;
          font-size: 1rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: #fff;
          color: #1f2937;
          transition: all 0.2s ease;
          font-weight: 400;
        }
        
        .signin-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .signin-input::placeholder {
          color: #9ca3af;
        }
        
        .otp-input {
          text-align: center;
          font-size: 1.25rem;
          font-weight: 600;
          letter-spacing: 0.1em;
        }
        
        .signin-help {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
          font-weight: 400;
        }
        
        .signin-dev-help {
          background: #f0f9ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          padding: 0.75rem;
          margin-top: 0.5rem;
        }
        
        .signin-dev-help p {
          margin: 0;
          font-size: 0.75rem;
          color: #1e40af;
        }
        
        .signin-dev-help p:first-child {
          margin-bottom: 0.25rem;
        }
        
        
        .signin-btn {
          background: #1f2937;
          color: #fff;
          font-weight: 600;
          font-size: 1rem;
          padding: 0.875rem 1.5rem;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 48px;
        }
        
        .signin-btn:hover:not(:disabled) {
          background: #111827;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .signin-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        
        .signin-arrow {
          font-size: 1.125rem;
          transition: transform 0.2s ease;
        }
        
        .signin-btn:hover:not(:disabled) .signin-arrow {
          transform: translateX(2px);
        }
        
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid #fff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .signin-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 1rem;
        }
        
        .signin-resend-btn,
        .signin-back-btn {
          background: transparent;
          color: #3b82f6;
          border: none;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          padding: 0.5rem;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .signin-resend-btn:hover:not(:disabled),
        .signin-back-btn:hover {
          background: #f3f4f6;
          color: #2563eb;
        }
        
        .signin-resend-btn:disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        .signin-message {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem;
          border-radius: 8px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-top: 1rem;
        }
        
        .signin-message.success {
          background: #f0fdf4;
          color: #166534;
          border: 1px solid #bbf7d0;
        }
        
        .signin-message.error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        
        .message-icon {
          font-size: 1rem;
          font-weight: bold;
        }
        
        @media (max-width: 1024px) {
          .signin-form-wrap {
            padding: 1.5rem;
          }
          
          .signin-form-box {
            max-width: 100%;
          }
        }
        
        @media (max-width: 800px) {
          .signin-root {
            flex-direction: column;
          }
          
          .signin-plant-img {
            display: none;
          }
          
          .signin-form-wrap {
            width: 100vw;
            min-width: 0;
            max-width: 100vw;
            height: 100vh;
            padding: 1rem;
          }
          
          .signin-title {
            font-size: 2rem;
          }
        }
        
        @media (max-width: 480px) {
          .signin-form-wrap {
            padding: 1rem 0.5rem;
          }
          
          .signin-form-box {
            padding: 0;
          }
          
          .signin-title {
            font-size: 1.75rem;
          }
          
          .signin-subtitle {
            font-size: 1rem;
          }
          
          .signin-actions {
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default SignIn; 