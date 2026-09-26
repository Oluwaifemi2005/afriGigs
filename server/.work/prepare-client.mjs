import fs from 'node:fs';
const read = p => fs.readFileSync('../client/src/' + p, 'utf8');
const save = (p, s) => fs.writeFileSync('.work/' + p, s);
let api = read('api/client.js');
api = api.replace("    const message = error.response", `    if (error.response?.status === 401 && error.config?.headers?.Authorization &&
        !['/auth/login', '/auth/verify-login'].includes(error.config?.url)) {
      window.dispatchEvent(new Event('gigafrik-session-expired'));
    }
    const message = error.response`);
api = api.replace('  getMe:', `  verifyEmail: (data) => api.post('/auth/verify-email', data),
  verifyLogin: (data) => api.post('/auth/verify-login', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  getMe:`);
save('client.js', api);
save('AuthContext.jsx', `import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
`);
let register = read('pages/Register.jsx');
const start = register.indexOf('      const newUser = await register(userData);');
const end = register.indexOf('    } catch', start);
register = register.slice(0, start) + `      const challenge = await register(userData);
      navigate('/login', { state: { challenge } });
` + register.slice(end);
save('Register.jsx', register);
save('Login.jsx', `import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/client';

export const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, verifyLogin } = useAuth();
  const [challenge, setChallenge] = useState(location.state?.challenge || null);
  const [email, setEmail] = useState(location.state?.challenge?.email || '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(new URLSearchParams(location.search).has('expired') ? 'Your session expired. Please sign in again.' : '');
  const run = async task => {
    setLoading(true); setError('');
    try { await task(); } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };
  const submit = event => {
    event.preventDefault();
    run(async () => {
      if (!challenge) {
        setChallenge(await login(email, password));
        setCode(''); setNotice('A code has been sent to your email.');
      } else if (challenge.purpose === 'verify') {
        await authApi.verifyEmail({ challengeId: challenge.challengeId, code });
        setChallenge(null); setCode('');
        navigate('/login', { replace: true, state: null });
        setNotice('Email verified. Sign in to receive your login code.');
      } else {
        const user = await verifyLogin({ challengeId: challenge.challengeId, code });
        navigate('/dashboard/' + user.role, { replace: true });
      }
    });
  };
  const resend = () => run(async () => {
    const next = challenge?.purpose === 'login'
      ? await login(email, password)
      : (await authApi.resendVerification(email)).data;
    setChallenge(next); setCode(''); setNotice('A new code was sent. It expires in 10 minutes.');
  });
  return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
    <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-slate-800 shadow-2xl">
      <h1 className="text-2xl font-extrabold text-white mb-2">{challenge ? challenge.purpose === 'verify' ? 'Verify your email' : 'Enter your login code' : 'Welcome to GigAfrik'}</h1>
      <p className="text-sm text-slate-400 mb-6">{challenge ? 'Enter the six-digit code sent to ' + challenge.email + '. Codes expire in 10 minutes.' : 'Sign in with your password and an email code.'}</p>
      {notice && <p role="status" className="text-sm text-emerald-400 mb-4">{notice}</p>}
      {error && <p role="alert" className="text-sm text-rose-400 mb-4">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        {!challenge ? <>
          <label className="block text-sm text-slate-300">Email address<input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="block w-full glass-input rounded-xl p-3 mt-2" /></label>
          <label className="block text-sm text-slate-300">Password<input type="password" required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="block w-full glass-input rounded-xl p-3 mt-2" /></label>
        </> : <label className="block text-sm text-slate-300">Verification code<input autoFocus required type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\\D/g, ''))} className="block w-full glass-input rounded-xl p-3 mt-2 tracking-widest" /></label>}
        <button disabled={loading} className="w-full rounded-xl bg-brand-500 text-slate-950 font-bold p-3 disabled:opacity-50">{loading ? 'Please wait...' : challenge ? 'Verify code' : 'Send login code'}</button>
      </form>
      <button type="button" disabled={loading || !email} onClick={resend} className="text-brand-400 text-sm mt-4 disabled:opacity-50">{challenge ? 'Resend code (wait 60 seconds)' : 'Resend signup verification'}</button>
      {challenge && <button type="button" disabled={loading} onClick={() => { setChallenge(null); setCode(''); setError(''); setNotice(''); navigate('/login', { replace: true, state: null }); }} className="block text-slate-400 text-sm mt-4">Back to sign in</button>}
      <p className="text-sm text-slate-400 mt-6">New to GigAfrik? <Link to="/register" className="text-brand-400">Create an account</Link></p>
    </div>
  </div>;
};
export default Login;
`);
