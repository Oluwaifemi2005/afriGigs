import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jobApi } from '../api/client';
import JobCard from '../components/JobCard';
import { useAuth } from '../context/AuthContext';
import { Search, Sparkles, Shield, Zap, Globe, Users, ArrowRight, CheckCircle } from 'lucide-react';

const categories = ['All', 'Full Stack', 'Frontend', 'Backend', 'Mobile App', 'UI/UX Design', 'AI/Data'];

export const Home = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const { isAuthenticated, isDeveloper, quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await jobApi.getJobs({
        category: selectedCategory,
        search,
      });
      setJobs(res.data?.jobs || []);
    } catch (err) {
      console.error('Error fetching jobs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedCategory]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs();
  };

  const handleAcceptJob = async (jobId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      await jobApi.acceptJob(jobId);
      navigate('/dashboard/developer');
    } catch (err) {
      alert(err.message || 'Failed to accept job');
    }
  };

  const handleDemo = async (role) => {
    try {
      await quickDemoLogin(role);
      navigate(role === 'client' ? '/dashboard/client' : '/dashboard/developer');
    } catch (err) {
      alert('Demo login failed: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen">
      
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-brand-500/30 text-xs font-semibold text-brand-300 mb-6 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>StactStart Hackathon • Future of Work Track</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight mb-6">
            The Freelance Engine for <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-emerald-300 to-amber-300">African Tech Talent</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 mb-8 leading-relaxed">
            Connect directly with high-growth African businesses. Post projects in local currencies (<span className="text-amber-300 font-semibold">NGN, KES, GHS, ZAR, USD</span>), review live preview links before release, and eliminate cross-border payment barriers.
          </p>

          {/* Call to Actions & Demo Shortcuts */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-sm shadow-xl shadow-brand-500/25 transition-all hover:scale-105"
            >
              Get Started Now <ArrowRight className="w-4 h-4" />
            </Link>

            {/* Quick Demo Buttons for Hackathon Judges */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleDemo('client')}
                className="flex-1 sm:flex-initial text-xs font-bold px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 hover:border-amber-400/60 transition-all shadow-md"
              >
                Demo as Client 💼
              </button>
              <button
                onClick={() => handleDemo('developer')}
                className="flex-1 sm:flex-initial text-xs font-bold px-3.5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-brand-300 border border-brand-500/30 hover:border-brand-400/60 transition-all shadow-md"
              >
                Demo as Developer 💻
              </button>
            </div>
          </div>

          {/* African Tech Value Pillars */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left pt-6 border-t border-slate-800/80">
            <div className="glass-card p-3.5 rounded-xl border border-slate-800">
              <div className="text-brand-400 font-extrabold text-lg">Local Currencies</div>
              <p className="text-xs text-slate-400">NGN, KES, GHS, ZAR & USD</p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800">
              <div className="text-amber-400 font-extrabold text-lg">Preview Approval</div>
              <p className="text-xs text-slate-400">Inspect live demo before pay</p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800">
              <div className="text-teal-400 font-extrabold text-lg">Verified Talent</div>
              <p className="text-xs text-slate-400">Nigeria, Ghana, Kenya & more</p>
            </div>
            <div className="glass-card p-3.5 rounded-xl border border-slate-800">
              <div className="text-blue-400 font-extrabold text-lg">Zero Friction</div>
              <p className="text-xs text-slate-400">Fast milestone release</p>
            </div>
          </div>

        </div>
      </section>

      {/* How GigAfrik Works Workflow Section */}
      <section className="py-12 bg-slate-900/40 border-y border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-white">How GigAfrik Works</h2>
            <p className="text-xs text-slate-400 mt-1">
              Transparent, milestone-based collaboration built for the African tech ecosystem.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-sm mb-3">1</div>
              <h4 className="text-sm font-bold text-white mb-1">Post a Project</h4>
              <p className="text-xs text-slate-400">Client defines project requirements, budget in local currency, and expected deadline.</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center text-sm mb-3">2</div>
              <h4 className="text-sm font-bold text-white mb-1">Developer Accepts</h4>
              <p className="text-xs text-slate-400">Vetted developer reviews scope, claims the gig, and kicks off building immediately.</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 font-bold flex items-center justify-center text-sm mb-3">3</div>
              <h4 className="text-sm font-bold text-white mb-1">Submit Live Preview</h4>
              <p className="text-xs text-slate-400">Developer delivers a live deployment link (Vercel/Netlify) and repository for inspection.</p>
            </div>
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-sm mb-3">4</div>
              <h4 className="text-sm font-bold text-white mb-1">Approve & Release Pay</h4>
              <p className="text-xs text-slate-400">Client confirms the work works smoothly, clicks approve, and releases payment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Section */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-white">Live African Marketplace Gigs</h2>
            <p className="text-xs text-slate-400">Explore open projects ready for African developers to claim.</p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search web, mobile, payments, UI/UX..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass-input rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-xl text-white transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-500 text-slate-950 shadow-md shadow-brand-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-400">Loading marketplace opportunities...</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
            <Globe className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Gigs Found</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Try adjusting your search query or click "Demo Data" on the top header to seed sample opportunities!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onAccept={handleAcceptJob}
              />
            ))}
          </div>
        )}

      </section>

    </div>
  );
};

export default Home;
