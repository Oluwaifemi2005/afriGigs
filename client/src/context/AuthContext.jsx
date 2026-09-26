import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);
export const tokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return Number.isFinite(payload.exp) ? payload.exp * 1000 : 0;
  } catch { return 0; }
};
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gigafrik_token'));
  const [loading, setLoading] = useState(true);
  const logout = () => {
    localStorage.removeItem('gigafrik_token');
    localStorage.removeItem('gigafrik_user');
    setToken(null);
    setUser(null);
  };
  useEffect(() => {
    let active = true;
    const initialize = async () => {
      const stored = localStorage.getItem('gigafrik_token');
      if (stored && tokenExpiry(stored) > Date.now()) {
        try {
          const { data } = await authApi.getMe();
          if (active && localStorage.getItem('gigafrik_token') === stored) setUser(data.user);
        } catch { if (active) logout(); }
      } else { logout(); }
      if (active) setLoading(false);
    };
    initialize();
    window.addEventListener('auth:expired', logout);
    const sync = (event) => { if (event.key === 'gigafrik_token') window.location.reload(); };
    window.addEventListener('storage', sync);
    return () => {
      active = false;
      window.removeEventListener('auth:expired', logout);
      window.removeEventListener('storage', sync);
    };
  }, []);
  useEffect(() => {
    if (!token) return;
    const check = () => {
      if (tokenExpiry(token) <= Date.now()) { logout(); window.location.replace('/login'); }
    };
    const timer = setTimeout(check, Math.min(Math.max(0, tokenExpiry(token) - Date.now()), 2147483647));
    const interval = setInterval(check, 30000);
    window.addEventListener('focus', check);
    return () => { clearTimeout(timer); clearInterval(interval); window.removeEventListener('focus', check); };
  }, [token]);
  const login = async (email, password) => {
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('gigafrik_token', data.token);
    localStorage.setItem('gigafrik_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (data) => (await authApi.register(data)).data;
  const verifyLogin = async (challengeId, code) => {
    const { data } = await authApi.verifyLogin({ challengeId, code });
    localStorage.setItem('gigafrik_token', data.token);
    localStorage.setItem('gigafrik_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };
  return <AuthContext.Provider value={{ user, token, loading,
    isAuthenticated: !!user && tokenExpiry(token) > Date.now(),
    isClient: user?.role === 'client', isDeveloper: user?.role === 'developer',
    login, register, verifyLogin, logout,
  }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
