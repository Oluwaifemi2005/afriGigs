import React, { useState } from 'react';
import { X, ExternalLink, Github, CheckCircle2, Star, ShieldCheck, AlertCircle } from 'lucide-react';
import { jobApi } from '../api/client';

export const ReviewJobModal = ({ job, isOpen, onClose, onSuccess }) => {
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('Excellent delivery! Code works smoothly and matches all project requirements.');
  const [approving, setApproving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !job) return null;

  const handleApprove = async (e) => {
    e.preventDefault();
    try {
      setApproving(true);
      setError('');
      await jobApi.approveJob(job._id, {
        rating,
        feedback,
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to approve work and release payment');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-2xl p-6 border border-slate-700/80 shadow-2xl relative">
        
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-emerald-400 mb-1">
          <ShieldCheck className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Client Escrow & Verification</span>
        </div>

        <h2 className="text-xl font-bold text-white mb-1">Inspect Deliverables & Release Payment</h2>
        <p className="text-xs text-slate-400 mb-4">
          Gig: <span className="text-white font-semibold">{job.title}</span> • Budget: <span className="text-brand-400 font-bold">{job.currency} {Number(job.budget).toLocaleString()}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Deliverables Display Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 mb-5">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1 uppercase font-semibold">Live Preview Link</span>
            {job.deliverables?.previewUrl ? (
              <a
                href={job.deliverables.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/30 text-brand-300 text-sm font-semibold transition-all group"
              >
                <span>{job.deliverables.previewUrl}</span>
                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            ) : (
              <span className="text-xs text-slate-500">No link provided</span>
            )}
          </div>

          {job.deliverables?.repoUrl && (
            <div>
              <span className="text-[11px] text-slate-400 block mb-1 uppercase font-semibold">Repository URL</span>
              <a
                href={job.deliverables.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>{job.deliverables.repoUrl}</span>
              </a>
            </div>
          )}

          {job.deliverables?.notes && (
            <div>
              <span className="text-[11px] text-slate-400 block mb-1 uppercase font-semibold">Developer Notes</span>
              <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed">
                {job.deliverables.notes}
              </p>
            </div>
          )}
        </div>

        {/* Review & Rating Form */}
        <form onSubmit={handleApprove} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Rate Developer Performance
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className="p-1 text-amber-400 hover:scale-110 transition-transform"
                >
                  <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
                </button>
              ))}
              <span className="text-xs text-slate-400 ml-2 font-semibold">({rating} of 5 Stars)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Client Feedback & Recommendation
            </label>
            <textarea
              rows={2}
              required
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <p className="text-[11px] text-slate-400 max-w-[260px]">
              Clicking approve marks this milestone complete and releases payment to the developer.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={approving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {approving ? 'Releasing Funds...' : 'Approve & Release Payment'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ReviewJobModal;
