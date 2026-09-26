import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendCode, consumeCode, secret } from '../services/authCodes.js';
import { sendRegistrationOtp, consumeRegistrationOtp } from '../services/registrationOtp.js';

// Helper to sign JWT
const generateToken = (id, authMethod = 'email-otp') => {
  return jwt.sign({ id, authMethod }, secret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
};

// @desc    Register a new user (Client or Developer)
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role, country, city, phone, skills, companyName, bio, githubOrPortfolio } = req.body;

    if (!name || typeof email !== 'string' || typeof password !== 'string' || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, password, and role' });
    }

    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.trim().toLowerCase(),
      password,
      emailVerified: false,
      role,
      country: country || 'Nigeria',
      city: city || 'Lagos',
      phone: phone || '',
      skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      companyName: companyName || '',
      bio: bio || '',
      githubOrPortfolio: githubOrPortfolio || '',
    });

    res.status(201).json(await sendRegistrationOtp(user));
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate a verified user with email and password
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ success: false, code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in.' });
    }
    const token = generateToken(user._id, 'password');
    user.password = undefined;
    res.json({ success: true, token, expiresAt: new Date(jwt.decode(token).exp * 1000), user });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Protected
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    const user = await User.findOne({ email: email.trim().toLowerCase(), emailVerified: { $ne: true } });
    if (!user) return res.status(400).json({ success: false, message: 'Unable to send verification. Try signing in.' });
    res.json(await sendRegistrationOtp(user));
  } catch (error) { next(error); }
};

const verify = (purpose) => async (req, res, next) => {
  try {
    const user = await consumeCode(req.body.challengeId, purpose === 'verify' ? req.body.token : req.body.code, purpose);
    if (!user) return res.status(400).json({ success: false, message: purpose === 'verify' ? 'This verification link is invalid, expired, or already used. Request a new link from the login page.' : 'Invalid or expired code. After five attempts, request a new code.' });
    if (purpose === 'verify') return res.json({ success: true, message: 'Email verified. Please sign in to receive your login code.' });
    if (!user.emailVerified) return res.status(403).json({ success: false, message: 'Please verify your email first.' });
    const token = generateToken(user._id);
    res.json({ success: true, token, expiresAt: new Date(jwt.decode(token).exp * 1000), user });
  } catch (error) { next(error); }
};
export const verifyEmail = async (req, res, next) => {
  try {
    const user = await consumeRegistrationOtp(req.body.email, req.body.code);
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired registration OTP. After five attempts, resend the OTP.' });
    res.json({ success: true, message: 'Email verified. Please sign in.' });
  } catch (error) { next(error); }
};
export const verifyLogin = verify('login');

export const resendLogin = async (req, res, next) => {
  try {
    const { challengeId } = req.body;
    if (typeof challengeId !== 'string' || challengeId.length > 64) return res.status(400).json({ success: false, message: 'Please sign in again.' });
    const user = await User.findOne({ 'authCode.id': challengeId, 'authCode.purpose': 'login', 'authCode.sentAt': { $gt: new Date(Date.now() - 30 * 60 * 1000) }, emailVerified: true });
    if (!user) return res.status(400).json({ success: false, message: 'Your login request expired. Please sign in again.' });
    res.json(await sendCode(user, 'login', challengeId));
  } catch (error) { next(error); }
};
