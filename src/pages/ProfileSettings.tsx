import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import TopNav from '../components/TopNav';

const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
];

const countries = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
];

const ProfileSettings: React.FC = () => {
  // In a real app, fetch these from user profile
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('+919999999999');
  const [language, setLanguage] = useState('en');
  const [country, setCountry] = useState('IN');
  const [saving, setSaving] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Set mobile from auth user object
      setMobile(user.phone || '');
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, phone, language, country')
        .eq('id', user.id)
        .single();
      if (data) {
        setFullName(data.full_name || '');
        // Prefer the phone from auth, but fallback to profile if needed
        setMobile(user.phone || data.phone || '');
        setWhatsappNumber(data.phone || '');
        setLanguage(data.language || 'en');
        setCountry(data.country || 'IN');
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      alert('Not logged in');
      return;
    }
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        full_name: fullName,
        phone: whatsappNumber,  // Save WhatsApp number
        language,
        country,
      });
    setSaving(false);
    if (error) {
      alert('Failed to save profile: ' + error.message);
    } else {
      alert('Profile saved!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="profile-settings-root">
      <TopNav
        userName={fullName}
        userEmail={mobile}
        onUserClick={() => {}}
        onSignOut={() => navigate('/signin')}
        onHomeClick={() => navigate('/dashboard')}
      />
      <div className="profile-settings-main">
        <div className="profile-settings-box">
          <h2 className="profile-settings-title">Profile Settings</h2>
          <form className="profile-settings-form" onSubmit={handleSave}>
            <label className="profile-settings-label">Full Name</label>
            <input
              className="profile-settings-input"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
            <label className="profile-settings-label">Mobile Number</label>
            <input
              className="profile-settings-input"
              type="tel"
              value={mobile}
              disabled
            />
            <label className="profile-settings-label">WhatsApp Number</label>
            <input
              className="profile-settings-input"
              type="tel"
              value={whatsappNumber}
              onChange={e => setWhatsappNumber(e.target.value)}
              placeholder="Enter your WhatsApp number (e.g., +1234567890)"
            />
            <p className="profile-settings-help">
              Enter your WhatsApp number to receive daily quotes at 7 AM
            </p>
            <label className="profile-settings-label">Language</label>
            <select
              className="profile-settings-input"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {languages.map(lang => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
            <label className="profile-settings-label">Country</label>
            <select
              className="profile-settings-input"
              value={country}
              onChange={e => setCountry(e.target.value)}
            >
              {countries.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button className="profile-settings-save" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>
      </div>
      <style>{`
        .profile-settings-root {
          width: 100vw;
          min-height: 100vh;
          background: #fff;
        }
        .profile-settings-main {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 1rem 0 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .profile-settings-box {
          text-align: left;
          color: #000;
          width: 100%;
          max-width: 400px;
          background: #fff;
          padding: 2.5rem 2rem;
          border-radius: 16px;
          box-shadow: 0 2px 24px 0 rgba(0,0,0,0.04);
          margin-top: 2.5rem;
        }
        .profile-settings-title {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 2rem;
          text-align: center;
        }
        .profile-settings-form {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .profile-settings-label {
          font-weight: 500;
          margin-bottom: 4px;
        }
        .profile-settings-input {
          padding: 0.75rem;
          font-size: 1rem;
          border: 1px solid #aaa;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        .profile-settings-save {
          background: #111;
          color: #fff;
          font-weight: 700;
          font-size: 1.1rem;
          padding: 0.9rem 0;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          letter-spacing: 1px;
          margin-top: 10px;
          transition: background 0.2s;
        }
        .profile-settings-save:disabled {
          background: #444;
          cursor: not-allowed;
        }
        .profile-settings-help {
          font-size: 0.8rem;
          color: #666;
          margin-top: -5px;
          margin-bottom: 10px;
        }
        @media (max-width: 600px) {
          .profile-settings-main {
            padding: 1.5rem 0.5rem 0 0.5rem;
          }
          .profile-settings-box {
            max-width: 100vw;
            padding: 1.5rem 0.5rem;
            border-radius: 0;
            box-shadow: none;
            margin-top: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileSettings; 