import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApi } from '../api/client';
import { PlusCircle, ArrowLeft, DollarSign, Calendar, Tag, AlertCircle } from 'lucide-react';

const categories = [
  'Full Stack',
  'Frontend',
  'Backend',
  'Mobile App',
  'UI/UX Design',
  'DevOps/Cloud',
  'AI/Data',
];

const currencies = [
  { code: 'USD', name: 'USD ($)', symbol: '$' },
  { code: 'NGN', name: 'Nigerian Naira (₦)', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling (KSh)', symbol: 'KSh ' },
  { code: 'GHS', name: 'Ghanaian Cedi (GH₵)', symbol: 'GH₵ ' },
  { code: 'ZAR', name: 'South African Rand (R)', symbol: 'R ' },
  { code: 'RWF', name: 'Rwandan Franc (RF)', symbol: 'RF ' },
];

export const PostJob = () => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Full Stack');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !budget || !deadline || !description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await jobApi.createJob({
        title,
        category,
        budget: Number(budget),
        currency,
        deadline,
        description,
      });
      navigate('/dashboard/client');
    } catch (err) {
      setError(err.message || 'Failed to post gig');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCurrencySymbol = currencies.find((c) => c.code === currency)?.symbol || '$';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen">
      
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </button>

      <div className="glass-panel rounded-2xl p-8 border border-slate-800 shadow-2xl relative">
        <div className="flex items-center gap-2 text-brand-400 mb-1">
          <PlusCircle className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">New Project Listing</span>
        </div>

        <h1 className="text-2xl font-extrabold text-white mb-1">Post a Gig on GigAfrik</h1>
        <p className="text-xs text-slate-400 mb-6">
          Reach thousands of vetted African developers. Review live demos before funds are released.
        </p>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Project Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Build Mobile-First Food Delivery Checkout for Nairobi"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Technical Category <span className="text-rose-400">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white outline-none bg-slate-900"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Project Deadline Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2 text-xs text-white outline-none bg-slate-900"
              />
            </div>
          </div>

          {/* Localized Currency & Budget */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Local African Currency <span className="text-rose-400">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white outline-none bg-slate-900 font-semibold"
              >
                {currencies.map((curr) => (
                  <option key={curr.code} value={curr.code} className="bg-slate-900 text-white">
                    {curr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Budget Amount ({currency}) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-400">
                  {selectedCurrencySymbol}
                </span>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g. 350000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full glass-input rounded-xl pl-12 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Detailed Scope & Deliverable Requirements <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={5}
              required
              placeholder="Outline what features the developer should deliver, required tech stack, API docs, and acceptance criteria for live preview..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? 'Publishing Gig...' : 'Publish Gig to Marketplace'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PostJob;
