import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import ReviewJobModal from '../components/ReviewJobModal';
import { PlusCircle, Briefcase, Clock, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'in_review', 'in_progress', 'completed'
  
  // Review Modal State
  const [selectedJobToReview, setSelectedJobToReview] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const fetchMyJobs = async () => {
    try {
      setLoading(true);
      const res = await jobApi.getClientJobs();
      setJobs(res.data?.jobs || []);
    } catch (err) {
      console.error('Error loading client jobs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyJobs();
  }, []);

  const handleOpenReview = (job) => {
    setSelectedJobToReview(job);
    setIsReviewOpen(true);
  };

  const filteredJobs = jobs.filter((j) => {
    if (activeTab === 'all') return true;
    return j.status === activeTab;
  });

  const needsReviewCount = jobs.filter((j) => j.status === 'in_review').length;
  const inProgressCount = jobs.filter((j) => j.status === 'in_progress').length;
  const completedCount = jobs.filter((j) => j.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      
      {/* Client Header & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Client Portal
            </span>
            <span className="text-xs text-slate-400">{user?.companyName || user?.name} • {user?.city || user?.country}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Manage Your Business Projects
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track hired African developers, inspect live preview deliverables, and release payments safely.
          </p>
        </div>

        <Link
          to="/post-job"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition-all hover:scale-105 shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Post a New Gig
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Total Gigs Posted</span>
          <p className="text-2xl font-black text-white mt-1">{jobs.length}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-blue-500/20 bg-blue-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-300 font-medium">In Development</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-200 mt-1">{inProgressCount}</p>
        </div>

        {/* Needs Review Alert Tile */}
        <div className={`glass-card p-4 rounded-xl border transition-all ${
          needsReviewCount > 0
            ? 'border-amber-500/50 bg-amber-950/20 shadow-lg shadow-amber-950/30'
            : 'border-slate-800'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-bold">Needs Review</span>
            {needsReviewCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </div>
          <p className="text-2xl font-black text-amber-300 mt-1">{needsReviewCount}</p>
          {needsReviewCount > 0 && (
            <p className="text-[10px] text-amber-400 mt-1">Developers delivered previews waiting for you!</p>
          )}
        </div>

        <div className="glass-card p-4 rounded-xl border border-teal-500/20 bg-teal-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-teal-300 font-medium">Completed & Settled</span>
            <CheckCircle className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-teal-200 mt-1">{completedCount}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'all'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Gigs ({jobs.length})
        </button>
        <button
          onClick={() => setActiveTab('in_review')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'in_review'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-400 hover:text-amber-300'
          }`}
        >
          Pending Review ({needsReviewCount})
        </button>
        <button
          onClick={() => setActiveTab('in_progress')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'in_progress'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'text-slate-400 hover:text-blue-300'
          }`}
        >
          In Progress ({inProgressCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'completed'
              ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-teal-300'
          }`}
        >
          Completed ({completedCount})
        </button>
      </div>

      {/* Job Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your gigs...</p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No Projects in this Section</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">
            Post your first gig to hire African developers with verified live previews.
          </p>
          <Link
            to="/post-job"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs"
          >
            <PlusCircle className="w-4 h-4" /> Post a Gig Now
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredJobs.map((job) => (
            <JobCard
              key={job._id}
              job={job}
              onReviewJob={handleOpenReview}
            />
          ))}
        </div>
      )}

      {/* Review & Pay Modal */}
      <ReviewJobModal
        job={selectedJobToReview}
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        onSuccess={fetchMyJobs}
      />

    </div>
  );
};

export default ClientDashboard;
