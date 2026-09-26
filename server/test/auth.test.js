import { test, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../src/models/User.js';
import { sendCode, consumeCode, hashCode } from '../src/services/authCodes.js';
import { loginUser, verifyLogin, verifyEmail } from '../src/controllers/authController.js';
import { protect } from '../src/middleware/authMiddleware.js';
import { sendRegistrationOtp, consumeRegistrationOtp } from '../src/services/registrationOtp.js';

// Model doubles exercise the real service/controller without a live database or email account.
let record, mail, transportOptions;
const get = (object, path) => path.split('.').reduce((value, key) => value?.[key], object);
const matches = (filter) => Object.entries(filter).every(([key, expected]) => {
  if (key === '$or') return expected.some(matches);
  const actual = get(record, key);
  if (expected && typeof expected === 'object' && !(expected instanceof Date)) {
    return Object.entries(expected).every(([operator, value]) => {
      if (operator === '$exists') return (actual !== undefined) === value;
      if (operator === '$ne') return actual !== value;
      if (operator === '$gt') return actual > value;
      if (operator === '$lt') return actual < value;
      if (operator === '$lte') return actual <= value;
      throw new Error(`Unsupported test operator: ${operator}`);
    });
  }
  return actual === expected;
});
const update = (filter, changes) => {
  if (!matches(filter)) return null;
  for (const [key, value] of Object.entries(changes.$set || {})) record[key] = value;
  for (const key of Object.keys(changes.$unset || {})) delete record[key];
  for (const [path, value] of Object.entries(changes.$inc || {})) {
    const [field, key] = path.split('.');
    record[field][key] += value;
  }
  return structuredClone(record);
};
const query = (value) => ({ select: async () => value, then: (resolve, reject) => Promise.resolve(value).then(resolve, reject) });
const response = () => ({ statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } });
const fail = (error) => { throw error; };
const otp = () => mail.text.match(/code is (\d{6})/)[1];

beforeEach(() => {
  process.env.JWT_SECRET = randomBytes(32).toString('hex');
  process.env.EMAIL_USER = 'sender@example.test';
  process.env.EMAIL_PASS = randomBytes(16).toString('hex');
  process.env.CLIENT_URL = 'https://client.example.test';
  process.env.JWT_EXPIRES_IN = '1h';
  record = { _id: 'user-id', email: 'person@example.test', emailVerified: true };
  mail = null;
  mock.method(User, 'findOneAndUpdate', (filter, changes) => query(update(filter, changes)));
  mock.method(User, 'updateOne', async (filter, changes) => update(filter, changes));
  mock.method(nodemailer, 'createTransport', (options) => {
    transportOptions = options;
    return { sendMail: async (message) => { mail = message; } };
  });
});
afterEach(() => mock.restoreAll());

test('registration uses a hashed ten-minute OTP and is single-use; no JWT is issued', async () => {
  record.emailVerified = false;
  const sent = await sendCode(record, 'verify');
  assert.equal(transportOptions.service, 'gmail');
  assert.equal(transportOptions.auth.user, process.env.EMAIL_USER);
  assert.equal(transportOptions.auth.pass, process.env.EMAIL_PASS);
  const code = otp();
  const body = { email: record.email, code };
  assert.match(record.registrationOtp.hash, /^[a-f0-9]{64}$/);
  assert.notEqual(record.registrationOtp.hash, code);
  assert.equal(record.registrationOtp.expiresAt.getTime() - record.lastRegistrationEmailAt.getTime(), 600000);
  assert.equal(sent.code, undefined);
  assert.equal(record.authCode, undefined);
  assert.equal(mail.text.includes('https://'), false);
  const res = response();
  await verifyEmail({ body }, res, fail);
  assert.equal(record.emailVerified, true);
  assert.equal(res.body.token, undefined);
  assert.equal(record.registrationOtp, undefined);
  assert.equal(await consumeRegistrationOtp(body.email, code), null);
});

test('OTP is hashed, expires, and concurrent successful submissions consume it once', async () => {
  const sent = await sendCode(record, 'login');
  const code = otp();
  assert.equal(record.authCode.hash, hashCode(sent.challengeId, code));
  assert.equal(JSON.stringify(sent).includes(code), false);
  const results = await Promise.all([consumeCode(sent.challengeId, code, 'login'), consumeCode(sent.challengeId, code, 'login')]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(record.authCode, undefined);
});

test('five incorrect attempts lock out even the correct OTP', async () => {
  const sent = await sendCode(record, 'login');
  const code = otp();
  const wrong = code === '000000' ? '000001' : '000000';
  await Promise.all(Array.from({ length: 10 }, () => consumeCode(sent.challengeId, wrong, 'login')));
  assert.equal(record.authCode.attempts, 5);
  assert.equal(await consumeCode(sent.challengeId, code, 'login'), null);
});

test('correct fifth attempt succeeds; expired and wrong-purpose challenges fail', async () => {
  const sent = await sendCode(record, 'login');
  const code = otp();
  assert.equal(await consumeCode(sent.challengeId, 'a'.repeat(64), 'verify'), null);
  record.authCode.expiresAt = new Date(Date.now() - 1);
  assert.equal(await consumeCode(sent.challengeId, code, 'login'), null);
  record.authCode.expiresAt = new Date(Date.now() + 60000);
  record.authCode.attempts = 4;
  assert.ok(await consumeCode(sent.challengeId, code, 'login'));
});

test('resend cooldown persists after consumption and resending invalidates the old code', async () => {
  const first = await sendCode(record, 'login');
  const oldCode = otp();
  await assert.rejects(sendCode(record, 'login'), { status: 429 });
  record.lastAuthEmailAt = new Date(Date.now() - 61000);
  const second = await sendCode(record, 'login', first.challengeId);
  assert.equal(await consumeCode(first.challengeId, oldCode, 'login'), null);
  assert.ok(await consumeCode(second.challengeId, otp(), 'login'));
  await assert.rejects(sendCode(record, 'login'), { status: 429 });
});

test('failed mail delivery removes the unusable code but keeps the resend cooldown', async () => {
  nodemailer.createTransport.mock.mockImplementation(() => ({ sendMail: async () => { throw new Error('SMTP failure'); } }));
  await assert.rejects(sendCode(record, 'login'), { status: 503 });
  assert.equal(record.authCode, undefined);
  assert.ok(record.lastAuthEmailAt);
  await assert.rejects(sendCode(record, 'login'), { status: 429 });
});

test('verified password login issues an expiring JWT without sending email or exposing the password', async () => {
  mock.method(User, 'findOne', () => query({ ...record, password: 'test-hash', comparePassword: async () => true }));
  const login = response();
  await loginUser({ body: { email: record.email, password: 'test-only-password' } }, login, fail);
  assert.equal(mail, null);
  assert.equal(login.body.user.password, undefined);
  const payload = jwt.verify(login.body.token, process.env.JWT_SECRET);
  assert.equal(payload.authMethod, 'password');
  assert.ok(payload.exp > payload.iat);
  mock.method(User, 'findById', () => query({ ...record }));
  let authorized = false;
  await protect({ headers: { authorization: `Bearer ${login.body.token}` } }, response(), () => { authorized = true; });
  assert.equal(authorized, true);
});

test('unverified password login requires registration verification and issues no JWT', async () => {
  record.emailVerified = false;
  mock.method(User, 'findOne', () => query({ ...record, comparePassword: async () => true }));
  const res = response();
  await loginUser({ body: { email: record.email, password: 'test-only-password' } }, res, fail);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.code, 'EMAIL_NOT_VERIFIED');
  assert.equal(mail, null);
  assert.equal(res.body.token, undefined);
  assert.equal(res.body.challengeId, undefined);
});

test('wrong password cannot create a session or send an email', async () => {
  mock.method(User, 'findOne', () => query({ ...record, comparePassword: async () => false }));
  const res = response();
  await loginUser({ body: { email: record.email, password: 'wrong-password' } }, res, fail);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.token, undefined);
  assert.equal(mail, null);
});

test('JWT middleware rejects expired, invalid, missing, and non-OTP tokens', async () => {
  for (const token of [null, 'invalid', jwt.sign({ id: record._id, authMethod: 'email-otp' }, process.env.JWT_SECRET, { expiresIn: -1 }), jwt.sign({ id: record._id }, process.env.JWT_SECRET, { expiresIn: '1h' }), jwt.sign({ id: record._id, authMethod: 'email-otp' }, process.env.JWT_SECRET)]) {
    const res = response();
    await protect({ headers: token ? { authorization: `Bearer ${token}` } : {} }, res, () => assert.fail('Must not authorize'));
    assert.equal(res.statusCode, 401);
  }
});

test('JWT middleware checks the database account and allows a verified valid session', async () => {
  mock.method(User, 'findById', () => query({ ...record }));
  const token = jwt.sign({ id: record._id, authMethod: 'email-otp' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const req = { headers: { authorization: `Bearer ${token}` } };
  let authorized = false;
  await protect(req, response(), () => { authorized = true; });
  assert.equal(authorized, true);
  record.emailVerified = false;
  const res = response();
  await protect(req, res, () => assert.fail('Must not authorize'));
  assert.equal(res.statusCode, 401);
});

test('registration OTP rejects wrong, expired and exhausted codes without altering login state', async () => {
  record.emailVerified = false;
  record.authCode = { id: 'login-challenge', hash: 'login-hash', attempts: 2 };
  record.lastAuthEmailAt = new Date();
  const loginState = structuredClone(record.authCode);
  const loginSentAt = record.lastAuthEmailAt;
  await sendRegistrationOtp(record);
  const code = otp();
  const wrong = code === '000000' ? '000001' : '000000';
  assert.equal(await consumeRegistrationOtp(record.email, wrong), null);
  record.registrationOtp.expiresAt = new Date(Date.now() - 1);
  assert.equal(await consumeRegistrationOtp(record.email, code), null);
  record.registrationOtp.expiresAt = new Date(Date.now() + 60000);
  await Promise.all(Array.from({ length: 8 }, () => consumeRegistrationOtp(record.email, wrong)));
  assert.equal(record.registrationOtp.attempts, 5);
  assert.equal(await consumeRegistrationOtp(record.email, code), null);
  assert.equal(record.emailVerified, false);
  assert.deepEqual(record.authCode, loginState);
  assert.equal(record.lastAuthEmailAt, loginSentAt);
});

test('registration resend has a separate cooldown and concurrent verification succeeds once', async () => {
  record.emailVerified = false;
  await sendRegistrationOtp(record);
  const firstId = record.registrationOtp.id;
  await assert.rejects(sendRegistrationOtp(record), { status: 429 });
  record.lastRegistrationEmailAt = new Date(Date.now() - 61000);
  await sendRegistrationOtp(record);
  assert.notEqual(record.registrationOtp.id, firstId);
  assert.equal(record.registrationOtp.attempts, 0);
  const code = otp();
  const results = await Promise.all([consumeRegistrationOtp(record.email, code), consumeRegistrationOtp(record.email, code)]);
  assert.equal(results.filter(Boolean).length, 1);
  assert.equal(record.registrationOtp, undefined);
});

test('registration delivery failure clears OTP while preserving cooldown and login data', async () => {
  record.emailVerified = false;
  record.authCode = { id: 'existing-login' };
  nodemailer.createTransport.mock.mockImplementation(() => ({ sendMail: async () => { throw new Error('SMTP failure'); } }));
  await assert.rejects(sendRegistrationOtp(record), { status: 503 });
  assert.equal(record.registrationOtp, undefined);
  assert.equal(record.authCode.id, 'existing-login');
  await assert.rejects(sendRegistrationOtp(record), { status: 429 });
});

test('old verification links are rejected by the email verification endpoint', async () => {
  const res = response();
  await verifyEmail({ body: { challengeId: 'legacy-id', token: 'a'.repeat(64) } }, res, fail);
  assert.equal(res.statusCode, 400);
});
