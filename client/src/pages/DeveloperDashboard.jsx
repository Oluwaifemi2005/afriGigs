import React, { useState, useEffect } from 'react';
import { jobApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import JobCard from '../components/JobCard';
import SubmitPreviewModal from '../components/SubmitPreviewModal';
import { Code, Clock, CheckCircle, Search, Sparkles, ExternalLink, ArrowRight } from 'lucide-react';

export const DeveloperDashboard = () => {
  const { user } = useAuth();
  const [myJobs, setMyJobs] = useState([]);
  const [openMarketJobs, setOpenMarketJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contracts'); // 'contracts' or 'marketplace'
  
  // Submit Preview Modal State
  const [selectedJobToSubmit, setSelectedJobToSubmit] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [myRes, marketRes] = await Promise.all([
        jobApi.getDeveloperJobs(),
        jobApi.getJobs({ status: 'open' }),
      ]);
      setMyJobs(myRes.data?.jobs || []);
      setOpenMarketJobs(marketRes.data?.jobs || []);
    } catch (err) {
      console.error('Error loading developer dashboard:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenSubmit = (job) => {
    setSelectedJobToSubmit(job);
    setIsSubmitModalOpen(true);
  };

  const handleAcceptJob = async (jobId) => {
    try {
      await jobApi.acceptJob(jobId);
      await fetchDashboardData();
      setActiveTab('contracts');
    } catch (err) {
      alert(err.message || 'Failed to accept gig');
    }
  };

  const activeContractsCount = myJobs.filter((j) => j.status === 'in_progress').length;
  const inReviewCount = myJobs.filter((j) => j.status === 'in_review').length;
  const completedCount = myJobs.filter((j) => j.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      
      {/* Dev Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Developer Portal
            </span>
            <span className="text-xs text-slate-400">{user?.name} • {user?.city || user?.country}</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Developer Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Deliver code, submit live demo previews, and get paid directly in your regional currency.
          </p>
        </div>

        {user?.skills?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 max-w-md">
            {user.skills.map((skill) => (
              <span key={skill} className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-300">
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-4 rounded-xl border border-blue-500/20 bg-blue-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-300 font-medium">Active In Build</span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-black text-blue-200 mt-1">{activeContractsCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-amber-500/20 bg-amber-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300 font-medium">Awaiting Client Review</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-200 mt-1">{inReviewCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-teal-500/20 bg-teal-950/10">
          <div className="flex items-center justify-between">
            <span className="text-xs text-teal-300 font-medium">Approved & Paid</span>
            <CheckCircle className="w-4 h-4 text-teal-400" />
          </div>
          <p className="text-2xl font-black text-teal-200 mt-1">{completedCount}</p>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium">Open Gigs on Market</span>
          <p className="text-2xl font-black text-white mt-1">{openMarketJobs.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-4 mb-6">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'contracts'
              ? 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          My Contracts ({myJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'marketplace'
              ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
              : 'text-slate-400 hover:text-brand-300'
          }`}
        >
          Explore Open Marketplace ({openMarketJobs.length})
        </button>
      </div>

      {/* Content Feed */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-2 border-brand-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading your developer dashboard...</p>
        </div>
      ) : activeTab === 'contracts' ? (
        myJobs.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
            <Code className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Active Contracts Yet</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Browse the open marketplace and accept a gig to get started!
            </p>
            <button
              onClick={() => setActiveTab('marketplace')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs"
            >
              Browse Open Gigs <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onSubmitPreview={handleOpenSubmit}
              />
            ))}
          </div>
        )
      ) : (
        openMarketJobs.length === 0 ? (
          <div className="text-center py-16 glass-panel rounded-2xl border border-slate-800 max-w-lg mx-auto">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">No Open Gigs Right Now</h3>
            <p className="text-xs text-slate-400 mt-1">
              Check back soon or click "Demo Data" at the top header to seed new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {openMarketJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                onAccept={handleAcceptJob}
              />
            ))}
          </div>
        )
      )}

      {/* Submit Preview Modal */}
      <SubmitPreviewModal
        job={selectedJobToSubmit}
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={fetchDashboardData}
      />

    </div>
  );
};

export default DeveloperDashboard;
