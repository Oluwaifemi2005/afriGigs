import fs from 'node:fs';
const path = 'src/controllers/authController.js';
let s = fs.readFileSync(path, 'utf8');
s = s.replace("import User from '../models/User.js';", "import User from '../models/User.js';\nimport { sendCode, consumeCode, secret } from '../services/authCodes.js';");
s = s.replace("jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_gigafrik_hackathon_jwt_key_2026'", "jwt.sign({ id, authMethod: 'email-otp' }, secret()");
s = s.replace("expiresIn: '30d'", "expiresIn: process.env.JWT_EXPIRES_IN || '1h'");
s = s.replaceAll('email.toLowerCase()', 'email.trim().toLowerCase()');
s = s.replace('if (!name || !email || !password || !role)', "if (!name || typeof email !== 'string' || typeof password !== 'string' || !password || !role)");
s = s.replace('if (!email || !password)', "if (typeof email !== 'string' || typeof password !== 'string' || !password)");
const first = s.indexOf('    const token = generateToken(user._id);');
const end = s.indexOf('  } catch (error)', first);
s = s.slice(0, first) + '    res.status(201).json(await sendCode(user, "verify"));\n' + s.slice(end);
const second = s.indexOf('    const token = generateToken(user._id);');
const end2 = s.indexOf('  } catch (error)', second);
s = s.slice(0, second) + '    res.json(await sendCode(user, user.emailVerified ? "login" : "verify"));\n' + s.slice(end2);
s += `
export const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (typeof email !== 'string') return res.status(400).json({ success: false, message: 'Please provide an email address.' });
    const user = await User.findOne({ email: email.trim().toLowerCase(), emailVerified: { $ne: true } });
    if (!user) return res.status(400).json({ success: false, message: 'Unable to send verification. Try signing in.' });
    res.json(await sendCode(user, 'verify'));
  } catch (error) { next(error); }
};

const verify = (purpose) => async (req, res, next) => {
  try {
    const user = await consumeCode(req.body.challengeId, req.body.code, purpose);
    if (!user) return res.status(400).json({ success: false, message: 'Invalid or expired code. After five attempts, request a new code.' });
    if (purpose === 'verify') return res.json({ success: true, message: 'Email verified. Please sign in to receive your login code.' });
    if (!user.emailVerified) return res.status(403).json({ success: false, message: 'Please verify your email first.' });
    const token = generateToken(user._id);
    res.json({ success: true, token, expiresAt: new Date(jwt.decode(token).exp * 1000), user });
  } catch (error) { next(error); }
};
export const verifyEmail = verify('verify');
export const verifyLogin = verify('login');
`;
fs.writeFileSync(path, s);
