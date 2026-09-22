import React from 'react';
import StatusBadge from './StatusBadge';
import { Calendar, DollarSign, MapPin, Building2, ExternalLink, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const currencySymbols = {
  USD: '$',
  NGN: '₦',
  KES: 'KSh ',
  GHS: 'GH₵ ',
  ZAR: 'R ',
  RWF: 'RF ',
};

export const JobCard = ({ job, onAccept, onSubmitPreview, onReviewJob }) => {
  const { user, isDeveloper, isClient } = useAuth();

  const formattedBudget = `${currencySymbols[job.currency] || '$'}${Number(job.budget).toLocaleString()}`;
  const formattedDeadline = new Date(job.deadline).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isAssignedToCurrentDev = isDeveloper && job.developer?._id === user?._id;
  const isOwnerClient = isClient && job.client?._id === user?._id;

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group hover:shadow-xl hover:shadow-brand-950/20">
      <div>
        {/* Top Meta Bar */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-800/80 text-brand-300 border border-slate-700/50">
            {job.category}
          </span>
          <StatusBadge status={job.status} />
        </div>

        {/* Job Title */}
        <h3 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors line-clamp-1 mb-2">
          {job.title}
        </h3>

        {/* Description */}
        <p className="text-slate-400 text-sm line-clamp-2 mb-4 leading-relaxed">
          {job.description}
        </p>

        {/* Client / Location Info */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-4 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{job.client?.companyName || job.client?.name || 'Client'}</span>
          </div>
          {(job.client?.city || job.client?.country) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{job.client?.city ? `${job.client.city}, ` : ''}{job.client?.country}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>Due {formattedDeadline}</span>
          </div>
        </div>

        {/* Deliverable preview link badge (if in review or completed) */}
        {job.deliverables?.previewUrl && (
          <div className="mb-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-300 truncate max-w-[200px]">
              <span className="text-brand-400 font-semibold">Demo: </span>
              {job.deliverables.previewUrl}
            </div>
            <a
              href={job.deliverables.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 shrink-0 ml-2"
            >
              Live <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Bottom Bar: Budget + Action Button */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Budget</span>
          <p className="text-lg font-extrabold text-white">
            {formattedBudget} <span className="text-xs text-slate-400 font-normal">{job.currency}</span>
          </p>
        </div>

        <div>
          {/* Action: Developer accepts open job */}
          {isDeveloper && job.status === 'open' && (
            <button
              onClick={() => onAccept && onAccept(job._id)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-slate-950 font-bold text-xs shadow-md shadow-brand-600/20 transition-all hover:scale-105"
            >
              Accept Gig <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Action: Developer submits deliverable for their in_progress job */}
          {isAssignedToCurrentDev && job.status === 'in_progress' && (
            <button
              onClick={() => onSubmitPreview && onSubmitPreview(job)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 transition-all hover:scale-105"
            >
              Submit Preview <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Action: Client reviews & approves submitted work */}
          {isOwnerClient && job.status === 'in_review' && (
            <button
              onClick={() => onReviewJob && onReviewJob(job)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105"
            >
              Review & Pay <CheckCircle className="w-3.5 h-3.5" />
            </button>
          )}

          {/* In Progress indicator */}
          {job.status === 'in_progress' && !isAssignedToCurrentDev && (
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Active
            </span>
          )}

          {/* Completed indicator */}
          {job.status === 'completed' && (
            <span className="text-xs text-teal-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" /> Settled
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;
