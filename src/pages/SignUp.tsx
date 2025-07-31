import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import SignIn from './SignIn';

// For mobile OTP, sign-up and sign-in are the same. You can extend this for onboarding after OTP.
const SignUp: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        navigate('/dashboard');
      }
    };
    checkAuth();
  }, [navigate]);

  return (
    <div>
      <h2>Sign Up</h2>
      <SignIn />
    </div>
  );
};

export default SignUp; 