import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import ProfileSettings from './pages/ProfileSettings';
import SavedQuotes from './pages/SavedQuotes';
import { supabase } from './services/supabaseClient';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Show loading state while checking auth
  if (isAuthenticated === null) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/signin" 
          element={!isAuthenticated ? <SignIn /> : <Navigate to="/dashboard" replace />} 
        />
        <Route 
          path="/signup" 
          element={!isAuthenticated ? <SignUp /> : <Navigate to="/dashboard" replace />} 
        />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/signin" replace />}
        />
        <Route
          path="/profile-settings"
          element={isAuthenticated ? <ProfileSettings /> : <Navigate to="/signin" replace />}
        />
        <Route
          path="/saved-quotes"
          element={isAuthenticated ? <SavedQuotes /> : <Navigate to="/signin" replace />}
        />
        
        {/* Default route */}
        <Route 
          path="/" 
          element={<Navigate to={isAuthenticated ? "/dashboard" : "/signin"} replace />} 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
