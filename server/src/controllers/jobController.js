import JobTask from '../models/JobTask.js';

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Protected (Client only)
export const createJob = async (req, res, next) => {
  try {
    const { title, description, category, budget, currency, deadline } = req.body;

    if (!title || !description || !budget || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, description, budget, and deadline date',
      });
    }

    const job = await JobTask.create({
      title,
      description,
      category: category || 'Full Stack',
      budget: Number(budget),
      currency: currency || 'USD',
      deadline: new Date(deadline),
      client: req.user._id,
      status: 'open',
      paymentStatus: 'unpaid',
    });

    const populatedJob = await JobTask.findById(job._id).populate('client', 'name email companyName country city');

    res.status(201).json({
      success: true,
      message: 'Job posted successfully to African developer marketplace',
      job: populatedJob,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all open jobs (with search and category filters)
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res, next) => {
  try {
    const { category, search, currency, status } = req.query;
    let query = {};

    // Filter by status (default to open if browsing marketplace)
    if (status) {
      query.status = status;
    } else {
      query.status = 'open';
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (currency) {
      query.currency = currency;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await JobTask.find(query)
      .populate('client', 'name companyName country city')
      .populate('developer', 'name skills country')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single job details by ID
// @route   GET /api/jobs/:id
// @access  Public / Protected
export const getJobById = async (req, res, next) => {
  try {
    const job = await JobTask.findById(req.params.id)
      .populate('client', 'name email companyName country city phone')
      .populate('developer', 'name email skills country city githubOrPortfolio');

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job posting not found' });
    }

    res.json({
      success: true,
      job,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Developer accepts an open job
// @route   PATCH /api/jobs/:id/accept
// @access  Protected (Developer only)
export const acceptJob = async (req, res, next) => {
  try {
    const job = await JobTask.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept this gig because it is currently "${job.status}"`,
      });
    }

    // Assign developer and transition status to in_progress
    job.developer = req.user._id;
    job.status = 'in_progress';
    await job.save();

    const updatedJob = await JobTask.findById(job._id)
      .populate('client', 'name companyName email country phone')
      .populate('developer', 'name email skills country');

    res.json({
      success: true,
      message: 'You have accepted this gig! You can now start building.',
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Developer submits finished work (preview link + notes)
// @route   PATCH /api/jobs/:id/submit
// @access  Protected (Developer only)
export const submitDeliverable = async (req, res, next) => {
  try {
    const { previewUrl, repoUrl, notes } = req.body;

    if (!previewUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a live preview link (e.g., Vercel, Netlify, Render demo URL)',
      });
    }

    const job = await JobTask.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify the caller is the assigned developer
    if (job.developer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the assigned developer for this job can submit deliverables',
      });
    }

    if (job.status !== 'in_progress' && job.status !== 'in_review') {
      return res.status(400).json({
        success: false,
        message: `Cannot submit preview while job status is "${job.status}"`,
      });
    }

    job.deliverables = {
      previewUrl,
      repoUrl: repoUrl || '',
      notes: notes || '',
      submittedAt: new Date(),
    };
    job.status = 'in_review';
    await job.save();

    const updatedJob = await JobTask.findById(job._id)
      .populate('client', 'name companyName email')
      .populate('developer', 'name email skills');

    res.json({
      success: true,
      message: 'Deliverable submitted successfully! The client has been notified to review.',
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Client reviews preview link, approves work, and releases payment
// @route   PATCH /api/jobs/:id/approve
// @access  Protected (Client only)
export const approveJob = async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    const job = await JobTask.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Verify caller is the job owner
    if (job.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the client who posted this job can approve and release payment',
      });
    }

    if (job.status !== 'in_review') {
      return res.status(400).json({
        success: false,
        message: `Job cannot be approved in its current state "${job.status}". Deliverables must be submitted first.`,
      });
    }

    job.status = 'completed';
    job.paymentStatus = 'paid';
    job.review = {
      rating: rating ? Number(rating) : 5,
      feedback: feedback || 'Great work delivered on time!',
      approvedAt: new Date(),
    };

    await job.save();

    const updatedJob = await JobTask.findById(job._id)
      .populate('client', 'name companyName')
      .populate('developer', 'name email');

    res.json({
      success: true,
      message: 'Work approved! Payment has been released to the developer.',
      job: updatedJob,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs created by currently logged-in client
// @route   GET /api/jobs/client/my-jobs
// @access  Protected (Client only)
export const getClientJobs = async (req, res, next) => {
  try {
    const jobs = await JobTask.find({ client: req.user._id })
      .populate('developer', 'name email skills country city githubOrPortfolio')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all jobs assigned to currently logged-in developer
// @route   GET /api/jobs/developer/my-jobs
// @access  Protected (Developer only)
export const getDeveloperJobs = async (req, res, next) => {
  try {
    const jobs = await JobTask.find({ developer: req.user._id })
      .populate('client', 'name companyName email country city phone')
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    next(error);
  }
};
