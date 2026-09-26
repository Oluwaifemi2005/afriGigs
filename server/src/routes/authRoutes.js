import express from 'express';
import { registerUser, loginUser, getMe, verifyEmail, verifyLogin, resendVerification, resendLogin } from '../controllers/authController.js';
import { rateLimit } from 'express-rate-limit';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/me', protect, getMe);
router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false, message: { success: false, message: 'Too many authentication requests. Please try again later.' } }));

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-email', verifyEmail);
router.post('/verify-login', verifyLogin);
router.post('/resend-verification', resendVerification);
router.post('/resend-login', resendLogin);

// Protected routes

export default router;
