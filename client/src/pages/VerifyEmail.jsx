import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client';

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState(location.state?.message || 'Enter your registered email and its six-digit verification OTP. If you need a code, choose Resend OTP.');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(location.state?.retryAfter || 0);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(value => Math.max(0, value - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  const run = async (action) => {
    setLoading(true); setError('');
    try { await action(); }
    catch (err) {
      setError(err.message || 'Please try again.');
      if (err.response?.status === 429) setCooldown(Number(err.response.headers['retry-after']) || 60);
    } finally { setLoading(false); }
  };
  const verify = (event) => {
    event.preventDefault();
    run(async () => {
      await authApi.verifyEmail({ email, code });
      navigate('/login', { replace: true, state: { email, message: 'Email verified successfully. Please sign in.' } });
    });
  };
  const resend = () => run(async () => {
    const { data } = await authApi.resendVerification(email);
    setMessage('A new registration OTP has been sent. It expires in 10 minutes.');
    setCooldown(data.retryAfter || 60); setCode('');
  });
  return <div className="max-w-md mx-auto my-16 glass-panel rounded-2xl p-8 space-y-5">
    <h1 className="text-2xl font-bold">Verify your email</h1>
    <p role="status" className="text-sm text-slate-300">{message}</p>
    {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
    <form onSubmit={verify} className="space-y-4">
      <label className="block text-sm">Registered email
        <input required type="email" autoComplete="email" disabled={loading} value={email} onChange={e => { setEmail(e.target.value); setCode(''); }} className="w-full glass-input rounded-xl p-3 mt-2" />
      </label>
      <label className="block text-sm">Six-digit registration OTP
        <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} disabled={loading} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} className="w-full glass-input rounded-xl p-3 mt-2" />
      </label>
      <button disabled={loading} className="w-full rounded-xl bg-brand-500 text-slate-950 p-3 font-bold disabled:opacity-50">{loading ? 'Please wait...' : 'Verify'}</button>
    </form>
    <button type="button" onClick={resend} disabled={loading || cooldown > 0 || !email.trim()} className="block text-brand-400 disabled:opacity-50">Resend OTP{cooldown > 0 ? ` (${cooldown}s)` : ''}</button>
    <Link className="text-brand-400" to="/login">Back to login</Link>
  </div>;
}
