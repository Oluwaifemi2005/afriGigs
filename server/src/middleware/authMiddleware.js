import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { secret } from '../services/authCodes.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, secret(), { algorithms: ['HS256'] });
      if (!Number.isFinite(decoded.exp) || !['password', 'email-otp'].includes(decoded.authMethod)) return res.status(401).json({ success: false, code: 'SESSION_INVALID', message: 'Please sign in again.' });

      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found with this token' });
      }
      if (!req.user.emailVerified) return res.status(401).json({ success: false, code: 'SESSION_INVALID', message: 'Please verify your email and sign in again.' });

      return next();
    } catch (error) {
      if (!['JsonWebTokenError', 'TokenExpiredError', 'NotBeforeError'].includes(error.name)) return next(error);
      return res.status(401).json({ success: false, code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'SESSION_INVALID', message: 'Your session has expired. Please sign in again.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role "${req.user?.role}" is not authorized to access this resource. Required: ${roles.join(', ')}`,
      });
    }
    next();
  };
};
