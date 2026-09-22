import React from 'react';

const statusConfig = {
  open: {
    label: 'Open for Bids',
    classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    dot: 'bg-emerald-400 animate-pulse',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    dot: 'bg-blue-400',
  },
  in_review: {
    label: 'Needs Review',
    classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    dot: 'bg-amber-400 animate-bounce',
  },
  completed: {
    label: 'Completed & Paid',
    classes: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
    dot: 'bg-teal-300',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    dot: 'bg-rose-400',
  },
};

export const StatusBadge = ({ status }) => {
  const config = statusConfig[status] || {
    label: status,
    classes: 'bg-slate-800 text-slate-300 border-slate-700',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};

export default StatusBadge;
