import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, ADMIN_EMAIL } from '../supabaseClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hydrate from existing session on first load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[Auth] getSession error:', error.message);
      }
      if (session) {
        const built = _build(session.user, session.access_token);
        setUser(built.user);
        setToken(built.token);
      }
      setLoading(false);
    });

    // Keep token fresh on every auth event (login, logout, token_refreshed)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        const built = _build(session.user, session.access_token);
        setUser(built.user);
        setToken(built.token);
      } else {
        // SIGNED_OUT or token expired and could not refresh
        setUser(null);
        setToken(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  function _build(supaUser, accessToken) {
    const role = supaUser.email === ADMIN_EMAIL ? 'admin' : 'user';
    return {
      user: {
        id:        supaUser.id,
        email:     supaUser.email,
        full_name: supaUser.user_metadata?.full_name || '',
        role,
      },
      token: accessToken,
    };
  }

  // Called by LoginPage after successful signInWithPassword
  const login = (userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[Auth] logout error:', e.message);
    }
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
