import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const hashOtp = (id, code) => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET must be configured');
  return createHmac('sha256', process.env.JWT_SECRET).update(`registration:${id}:${code}`).digest('hex');
};

export async function sendRegistrationOtp(user) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw Object.assign(new Error('Email delivery is not configured. Please contact support.'), { status: 503 });
  }
  const id = randomUUID();
  const code = String(randomInt(0, 1000000)).padStart(6, '0');
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);
  const updated = await User.findOneAndUpdate({
    _id: user._id, emailVerified: { $ne: true },
    $or: [{ lastRegistrationEmailAt: { $exists: false } }, { lastRegistrationEmailAt: { $lte: new Date(now.getTime() - 60000) } }],
  }, { $set: {
    lastRegistrationEmailAt: now,
    registrationOtp: { id, hash: hashOtp(id, code), expiresAt, attempts: 0 },
  } });
  if (!updated) throw Object.assign(new Error('Please wait 60 seconds before requesting another registration OTP.'), { status: 429 });
  try {
    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      connectionTimeout: 10000, socketTimeout: 15000,
    });
    await transport.sendMail({
      from: process.env.EMAIL_USER, to: user.email,
      subject: 'Verify your GigAfrik email',
      text: `Your registration verification code is ${code}. Enter it on the email verification page. It expires in 10 minutes. If you did not register, ignore this email.`,
    });
  } catch {
    await User.updateOne({ _id: user._id, 'registrationOtp.id': id }, { $unset: { registrationOtp: 1 } });
    throw Object.assign(new Error('Your account is awaiting verification, but email delivery failed. Wait 60 seconds and resend the OTP on the email verification page.'), { status: 503 });
  }
  return { success: true, purpose: 'verify', email: user.email, expiresAt, retryAfter: 60,
    message: 'Enter the six-digit registration OTP on the email verification page (/verify-email).' };
}

export async function consumeRegistrationOtp(email, code) {
  if (typeof email !== 'string' || typeof code !== 'string' || !/^\d{6}$/.test(code)) return null;
  const filter = {
    email: email.trim().toLowerCase(), emailVerified: { $ne: true },
    'registrationOtp.expiresAt': { $gt: new Date() }, 'registrationOtp.attempts': { $lt: 5 },
  };
  const user = await User.findOneAndUpdate(filter, { $inc: { 'registrationOtp.attempts': 1 } }, { new: true }).select('+registrationOtp');
  if (!user) return null;
  const { id, hash } = user.registrationOtp;
  const expected = hashOtp(id, code);
  if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'))) return null;
  return User.findOneAndUpdate({
    ...filter, 'registrationOtp.attempts': { $lte: 5 }, 'registrationOtp.id': id,
    'registrationOtp.hash': expected,
  }, { $set: { emailVerified: true }, $unset: { registrationOtp: 1 } }, { new: true });
}
