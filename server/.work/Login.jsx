import React, { useState } from 'react';
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
        </> : <label className="block text-sm text-slate-300">Verification code<input autoFocus required type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="block w-full glass-input rounded-xl p-3 mt-2 tracking-widest" /></label>}
        <button disabled={loading} className="w-full rounded-xl bg-brand-500 text-slate-950 font-bold p-3 disabled:opacity-50">{loading ? 'Please wait...' : challenge ? 'Verify code' : 'Send login code'}</button>
      </form>
      <button type="button" disabled={loading || !email} onClick={resend} className="text-brand-400 text-sm mt-4 disabled:opacity-50">{challenge ? 'Resend code (wait 60 seconds)' : 'Resend signup verification'}</button>
      {challenge && <button type="button" disabled={loading} onClick={() => { setChallenge(null); setCode(''); setError(''); setNotice(''); navigate('/login', { replace: true, state: null }); }} className="block text-slate-400 text-sm mt-4">Back to sign in</button>}
      <p className="text-sm text-slate-400 mt-6">New to GigAfrik? <Link to="/register" className="text-brand-400">Create an account</Link></p>
    </div>
  </div>;
};
export default Login;
