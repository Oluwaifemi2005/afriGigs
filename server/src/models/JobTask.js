import mongoose from 'mongoose';

const jobTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    category: {
      type: String,
      required: [true, 'Job category is required'],
      enum: [
        'Frontend',
        'Backend',
        'Full Stack',
        'Mobile App',
        'UI/UX Design',
        'DevOps/Cloud',
        'AI/Data',
      ],
      default: 'Full Stack',
    },
    budget: {
      type: Number,
      required: [true, 'Budget amount is required'],
      min: [1, 'Budget must be greater than zero'],
    },
    currency: {
      type: String,
      required: true,
      enum: ['USD', 'NGN', 'KES', 'GHS', 'ZAR', 'RWF'],
      default: 'USD',
    },
    deadline: {
      type: Date,
      required: [true, 'Project deadline date is required'],
    },
    // Client who posted this gig
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Developer assigned to the gig (null until accepted)
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    // Gig Status Workflow: 'open' -> 'in_progress' -> 'in_review' -> 'completed'
    status: {
      type: String,
      enum: ['open', 'in_progress', 'in_review', 'completed', 'cancelled'],
      default: 'open',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'escrow_held', 'paid'],
      default: 'unpaid',
    },
    // Proof of work submitted by developer for client inspection
    deliverables: {
      previewUrl: {
        type: String,
        trim: true,
        default: null,
      },
      repoUrl: {
        type: String,
        trim: true,
        default: null,
      },
      notes: {
        type: String,
        trim: true,
        default: null,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
    // Client evaluation & payment release confirmation
    review: {
      rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
      },
      feedback: {
        type: String,
        default: null,
      },
      approvedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('JobTask', jobTaskSchema);
