import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import api from '../src/api/client.js';

let storage, redirected, events;
beforeEach(() => {
  storage = new Map([['gigafrik_token', 'test-token'], ['gigafrik_user', '{}']]);
  redirected = null;
  events = [];
  globalThis.localStorage = {
    getItem: key => storage.get(key),
    removeItem: key => storage.delete(key),
  };
  globalThis.window = {
    dispatchEvent: event => events.push(event.type),
    location: { pathname: '/dashboard/client', replace: path => { redirected = path; } },
  };
});
const rejectWith = (status) => async (config) => {
  const error = new Error('Request failed');
  error.config = config;
  error.response = { status, data: { message: 'API error' } };
  throw error;
};

test('protected 401 clears both session keys, notifies context, and redirects', async () => {
  await assert.rejects(api.get('/auth/me', { adapter: rejectWith(401) }), { message: 'API error' });
  assert.equal(storage.size, 0);
  assert.deepEqual(events, ['auth:expired']);
  assert.equal(redirected, '/login');
});
test('incorrect login password does not trigger global session expiration', async () => {
  await assert.rejects(api.post('/auth/login', {}, { adapter: rejectWith(401) }));
  assert.equal(storage.get('gigafrik_token'), 'test-token');
  assert.equal(redirected, null);
  assert.deepEqual(events, []);
});
test('403 authorization and 500 server errors preserve the session and error status', async () => {
  for (const status of [403, 500]) {
    await assert.rejects(api.get('/jobs/client/my-jobs', { adapter: rejectWith(status) }), error => error.response.status === status);
    assert.equal(storage.get('gigafrik_token'), 'test-token');
    assert.equal(redirected, null);
  }
});
test('login OTP requests never attach an existing bearer token', async () => {
  await api.post('/auth/verify-login', {}, { adapter: async config => {
    assert.equal(config.headers.Authorization, undefined);
    return { data: {}, status: 200, config, headers: {} };
  } });
});
