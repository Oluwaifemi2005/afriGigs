import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  acceptJob,
  submitDeliverable,
  approveJob,
  getClientJobs,
  getDeveloperJobs,
} from '../controllers/jobController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

// Role-specific lists (placed before :id to prevent collision)
router.get('/client/my-jobs', protect, authorizeRoles('client'), getClientJobs);
router.get('/developer/my-jobs', protect, authorizeRoles('developer'), getDeveloperJobs);

// General job endpoints
router.route('/')
  .get(getJobs)
  .post(protect, authorizeRoles('client'), createJob);

router.get('/:id', getJobById);

// Workflow state transition endpoints
router.patch('/:id/accept', protect, authorizeRoles('developer'), acceptJob);
router.patch('/:id/submit', protect, authorizeRoles('developer'), submitDeliverable);
router.patch('/:id/approve', protect, authorizeRoles('client'), approveJob);

export default router;
