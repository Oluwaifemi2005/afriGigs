import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);
const expiry = token => {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).exp * 1000 || 0;
  } catch { return 0; }
};
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gigafrik_token'));
  const [loading, setLoading] = useState(true);
  const logout = useCallback(() => {
    localStorage.removeItem('gigafrik_token');
    localStorage.removeItem('gigafrik_user');
    setUser(null);
    setToken(null);
  }, []);
  useEffect(() => {
    const expire = () => {
      logout();
      window.location.replace('/login?expired=1');
    };
    window.addEventListener('gigafrik-session-expired', expire);
    if (!token) { setLoading(false); return () => window.removeEventListener('gigafrik-session-expired', expire); }
    let cancelled = false;
    let timer;
    const check = () => {
      clearTimeout(timer);
      const remaining = expiry(token) - Date.now();
      if (remaining <= 0) { expire(); return false; }
      timer = setTimeout(check, Math.min(remaining, 2147483647));
      return true;
    };
    const sync = event => {
      if (event.key === 'gigafrik_token') {
        setUser(null);
        setLoading(true);
        setToken(event.newValue);
      }
    };
    window.addEventListener('focus', check);
    window.addEventListener('storage', sync);
    document.addEventListener('visibilitychange', check);
    if (check()) authApi.getMe().then(res => {
      if (!cancelled) setUser(res.data.user);
    }).catch(() => {
      if (!cancelled) logout();
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener('gigafrik-session-expired', expire);
      window.removeEventListener('focus', check);
      window.removeEventListener('storage', sync);
      document.removeEventListener('visibilitychange', check);
    };
  }, [token, logout]);
  const login = async (email, password) => (await authApi.login({ email, password })).data;
  const register = async data => (await authApi.register(data)).data;
  const verifyLogin = async data => {
    const { token: newToken, user: newUser } = (await authApi.verifyLogin(data)).data;
    localStorage.setItem('gigafrik_token', newToken);
    localStorage.setItem('gigafrik_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };
  const quickDemoLogin = async () => { throw new Error('Please sign in with an email you can verify. Demo shortcuts are disabled.'); };
  return <AuthContext.Provider value={{ user, token, loading, isAuthenticated: !!user, isClient: user?.role === 'client', isDeveloper: user?.role === 'developer', login, register, verifyLogin, logout, quickDemoLogin }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
