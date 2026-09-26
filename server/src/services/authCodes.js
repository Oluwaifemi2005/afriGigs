import { createHmac, randomInt, randomUUID, randomBytes, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';
import { sendRegistrationOtp } from './registrationOtp.js';

export const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured');
  return process.env.JWT_SECRET;
};
export const hashCode = (id, code) => createHmac('sha256', secret()).update(`${id}:${code}`).digest('hex');

export async function sendCode(user, purpose, previousId) {
  // Email verification has separate storage; the login OTP path below is unchanged.
  if (purpose === 'verify') return sendRegistrationOtp(user);
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.CLIENT_URL) {
    throw Object.assign(new Error('Email delivery is not configured. Please contact support.'), { status: 503 });
  }
  const link = new URL('/verify-email', process.env.CLIENT_URL);
  if (!['http:', 'https:'].includes(link.protocol)) throw new Error('CLIENT_URL must be an HTTP(S) URL');
  const id = randomUUID();
  const code = purpose === 'verify' ? randomBytes(32).toString('hex') : String(randomInt(0, 1000000)).padStart(6, '0');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + (purpose === 'verify' ? 30 : 10) * 60 * 1000);
  const updated = await User.findOneAndUpdate({
    _id: user._id,
    ...(purpose === 'verify' ? { emailVerified: { $ne: true } } : { emailVerified: true }),
    ...(previousId ? { 'authCode.id': previousId, 'authCode.purpose': 'login' } : {}),
    $or: [{ lastAuthEmailAt: { $exists: false } }, { lastAuthEmailAt: { $lte: new Date(now.getTime() - 60000) } }],
  }, { $set: { lastAuthEmailAt: now, authCode: { id, hash: hashCode(id, code), purpose, expiresAt, sentAt: now, attempts: 0 } } });
  if (!updated) throw Object.assign(new Error('Please wait 60 seconds before requesting another code.'), { status: 429 });
  try {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 10000,
      socketTimeout: 15000,
    });
    link.hash = new URLSearchParams({ challengeId: id, token: code }).toString();
    await transport.sendMail({
      from: process.env.EMAIL_USER, to: user.email,
      subject: purpose === 'verify' ? 'Verify your GigAfrik email' : 'Your GigAfrik login code',
      text: purpose === 'verify'
        ? `Verify your email by opening this link: ${link.href}\nThis link expires in 30 minutes. If you did not register, ignore this email.`
        : `Your login code is ${code}. It expires in 10 minutes. If you did not request this, ignore this email.`,
    });
  } catch {
    await User.updateOne({ _id: user._id, 'authCode.id': id }, { $unset: { authCode: 1 } });
    throw Object.assign(new Error('Could not send your email. Wait 60 seconds, then retry login or resend verification.'), { status: 503 });
  }
  return { success: true, ...(purpose === 'login' ? { challengeId: id } : {}), purpose, email: user.email, expiresAt, retryAfter: 60, message: purpose === 'verify' ? 'Check your email for a verification link.' : 'Check your email for your six-digit code.' };
}

export async function consumeCode(challengeId, code, purpose) {
  if (typeof challengeId !== 'string' || challengeId.length > 64 || typeof code !== 'string' || !(purpose === 'verify' ? /^[a-f0-9]{64}$/ : /^\d{6}$/).test(code)) return null;
  const filter = { 'authCode.id': challengeId, 'authCode.purpose': purpose, 'authCode.expiresAt': { $gt: new Date() }, 'authCode.attempts': { $lt: 5 } };
  // Reserve an attempt atomically so simultaneous requests cannot bypass the limit.
  const attempt = await User.findOneAndUpdate(filter, { $inc: { 'authCode.attempts': 1 } }, { new: true }).select('+authCode');
  if (!attempt || !timingSafeEqual(Buffer.from(attempt.authCode.hash, 'hex'), Buffer.from(hashCode(challengeId, code), 'hex'))) return null;
  return User.findOneAndUpdate({ ...filter, 'authCode.attempts': { $lte: 5 }, 'authCode.hash': hashCode(challengeId, code) }, {
    $unset: { authCode: 1 }, ...(purpose === 'verify' ? { $set: { emailVerified: true } } : {}),
  }, { new: true });
}
