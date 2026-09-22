import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Globe, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'client') {
        navigate('/dashboard/client');
      } else {
        navigate('/dashboard/developer');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (role) => {
    try {
      setLoading(true);
      setError('');
      const loggedInUser = await quickDemoLogin(role);
      if (loggedInUser.role === 'client') {
        navigate('/dashboard/client');
      } else {
        navigate('/dashboard/developer');
      }
    } catch (err) {
      setError('Demo login error: Make sure server is running or click "Demo Data" on top to seed. ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-slate-800 shadow-2xl relative">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-brand-500/20">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Welcome to GigAfrik</h1>
          <p className="text-xs text-slate-400 mt-1">Sign in to manage projects or accept developer gigs</p>
        </div>

        {/* 1-Click Demo Section for Hackathon Judges */}
        <div className="mb-6 p-3 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Judge / Evaluator Fast Track (1-Click Login):</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemo('client')}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold border border-amber-500/20 transition-all hover:scale-105"
            >
              Sign in as Client 💼
            </button>
            <button
              type="button"
              onClick={() => handleDemo('developer')}
              disabled={loading}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-300 text-xs font-semibold border border-brand-500/20 transition-all hover:scale-105"
            >
              Sign in as Developer 💻
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="you@company.africa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/25 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold">
            Create an Account
          </Link>
        </p>

      </div>
    </div>
  );
};

export default Login;
