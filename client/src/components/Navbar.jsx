import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Code, PlusCircle, LogOut, Globe, Sparkles, Database, Check } from 'lucide-react';
import { jobApi } from '../api/client';

export const Navbar = () => {
  const { user, isAuthenticated, isClient, isDeveloper, logout, quickDemoLogin } = useAuth();
  const navigate = useNavigate();
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await jobApi.seedData();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
      window.location.reload();
    } catch (err) {
      alert('Error seeding demo database: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-white">Gig<span className="text-brand-400">Afrik</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">MVP</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-none">Future of Work Africa</p>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <Link to="/" className="hover:text-brand-400 transition-colors">
            Marketplace
          </Link>
          {isAuthenticated && isClient && (
            <>
              <Link to="/dashboard/client" className="hover:text-brand-400 transition-colors">
                Client Dashboard
              </Link>
              <Link to="/post-job" className="flex items-center gap-1.5 text-brand-400 hover:text-brand-300 transition-colors font-semibold">
                <PlusCircle className="w-4 h-4" /> Post a Gig
              </Link>
            </>
          )}
          {isAuthenticated && isDeveloper && (
            <Link to="/dashboard/developer" className="hover:text-brand-400 transition-colors">
              Developer Portal
            </Link>
          )}
        </nav>

        {/* Right Action Area */}
        <div className="flex items-center gap-3">
          
          {/* Quick Seed Demo Button for Hackathon Review */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            title="Reset & populate demo data (clients, developers, gigs)"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:border-brand-500/40 transition-all"
          >
            {seedSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Seeded!</span>
              </>
            ) : (
              <>
                <Database className={`w-3.5 h-3.5 ${seeding ? 'animate-spin text-brand-400' : 'text-slate-400'}`} />
                <span>{seeding ? 'Seeding...' : 'Demo Data'}</span>
              </>
            )}
          </button>

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              {/* User Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isClient ? 'bg-amber-500/20 text-amber-300' : 'bg-brand-500/20 text-brand-300'
                }`}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-400 capitalize">{user.role} • {user.city || user.country}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-900 transition-all"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="text-sm font-semibold bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 px-4 py-2 rounded-xl shadow-md shadow-brand-500/20 font-bold transition-all"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};

export default Navbar;
