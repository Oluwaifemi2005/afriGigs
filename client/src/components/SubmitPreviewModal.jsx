import React, { useState } from 'react';
import { X, Send, Link, Github, FileText, AlertCircle } from 'lucide-react';
import { jobApi } from '../api/client';

export const SubmitPreviewModal = ({ job, isOpen, onClose, onSuccess }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !job) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!previewUrl) {
      setError('Please provide a live preview URL');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await jobApi.submitDeliverable(job._id, {
        previewUrl,
        repoUrl,
        notes,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-lg rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">Submit Deliverable & Preview</h2>
        <p className="text-xs text-slate-400 mb-4">
          Submitting for gig: <span className="text-brand-400 font-semibold">{job.title}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-brand-400" />
              Live Preview URL <span className="text-rose-400">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://your-preview-demo.vercel.app"
              value={previewUrl}
              onChange={(e) => setPreviewUrl(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">Provide a working Vercel, Netlify, Render, or staged link for client testing.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Github className="w-3.5 h-3.5 text-slate-400" />
              GitHub / Git Repository URL <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://github.com/your-username/repo-name"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Handover Notes & Documentation
            </label>
            <textarea
              rows={3}
              placeholder="Explain how to run the project, test credentials, or notes on features implemented..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 hover:from-brand-500 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? 'Submitting...' : 'Send for Client Review'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default SubmitPreviewModal;
