import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const location = useLocation();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const submit = async (event) => {
    event.preventDefault();
    setLoading(true); setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'client' ? '/dashboard/client' : '/dashboard/developer', { replace: true });
    } catch (err) {
      if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
        navigate('/verify-email', { state: { email, message: 'Verify your email to continue. Enter your registration OTP or choose Resend OTP.' } });
      } else { setError(err.message || 'Login failed. Please try again.'); }
    } finally { setLoading(false); }
  };
  return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
    <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-slate-800 space-y-5">
      <h1 className="text-2xl font-extrabold text-white">Welcome to GigAfrik</h1>
      <p className="text-sm text-slate-400">Log in with your email and password.</p>
      {location.state?.message && <p role="status" className="text-sm text-brand-300">{location.state.message}</p>}
      {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">Email address
          <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full glass-input rounded-xl p-3 mt-2" />
        </label>
        <div>
          <label htmlFor="login-password" className="block text-sm">Password</label>
          <div className="relative mt-2">
            <input id="login-password" required type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="w-full glass-input rounded-xl p-3 pr-16" />
            <button type="button" aria-controls="login-password" aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-brand-400">{showPassword ? 'Hide' : 'Show'}</button>
          </div>
        </div>
        <button disabled={loading} className="w-full rounded-xl bg-brand-500 text-slate-950 p-3 font-bold disabled:opacity-50">{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      <Link to="/verify-email" state={{ email }} className="block text-sm text-brand-400">Verify email / resend registration OTP</Link>
      <p className="text-sm text-slate-400">New here? <Link className="text-brand-400" to="/register">Create an account</Link></p>
    </div>
  </div>;
};
export default Login;
