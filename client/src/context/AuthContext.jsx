import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('gigafrik_token'));
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('gigafrik_token');
      const storedUser = localStorage.getItem('gigafrik_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Verify with server in background
          const res = await authApi.getMe();
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('gigafrik_user', JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn('Session expired or offline. Resetting auth state:', err.message);
          localStorage.removeItem('gigafrik_token');
          localStorage.removeItem('gigafrik_user');
          setUser(null);
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('gigafrik_token', newToken);
    localStorage.setItem('gigafrik_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('gigafrik_token', newToken);
    localStorage.setItem('gigafrik_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('gigafrik_token');
    localStorage.removeItem('gigafrik_user');
    setToken(null);
    setUser(null);
  };

  // Hackathon demo shortcut helper
  const quickDemoLogin = async (role) => {
    const email = role === 'client' ? 'client@gigafrik.africa' : 'dev@gigafrik.africa';
    return await login(email, 'password123');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isClient: user?.role === 'client',
        isDeveloper: user?.role === 'developer',
        login,
        register,
        logout,
        quickDemoLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
