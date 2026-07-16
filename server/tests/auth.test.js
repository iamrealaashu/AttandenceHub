const test = require('node:test');
const assert = require('node:assert/strict');
const { createAuthStore, sendOtp, verifyOtp, registerUser, loginUser } = require('../authService');

test('sendOtp stores an OTP for a contact', () => {
  const store = createAuthStore();
  const otp = sendOtp(store, { contact: 'user@example.com' });

  assert.equal(typeof otp, 'string');
  assert.equal(store.pendingOtps['user@example.com'], otp);
});

test('verifyOtp validates the contact OTP', () => {
  const store = createAuthStore();
  const otp = sendOtp(store, { contact: 'user@example.com' });

  assert.equal(verifyOtp(store, { contact: 'user@example.com', otp }), true);
  assert.equal(store.verifiedContacts['user@example.com'], true);
});

test('registerUser requires verified contact and stores user', async () => {
  const store = createAuthStore();
  const otp = sendOtp(store, { contact: 'user@example.com' });
  verifyOtp(store, { contact: 'user@example.com', otp });

  const user = await registerUser(store, { contact: 'user@example.com', password: 'secret123' });

  assert.equal(user.contact, 'user@example.com');
  assert.equal(typeof user.password, 'string');
});

test('loginUser succeeds when password matches and fails otherwise', async () => {
  const store = createAuthStore();
  const otp = sendOtp(store, { contact: 'sam@example.com' });
  verifyOtp(store, { contact: 'sam@example.com', otp });
  await registerUser(store, { contact: 'sam@example.com', password: 'pass123' });

  const success = await loginUser(store, { contact: 'sam@example.com', password: 'pass123' });
  const failure = await loginUser(store, { contact: 'sam@example.com', password: 'wrong' });

  assert.equal(success.ok, true);
  assert.equal(failure.ok, false);
  assert.equal(failure.message, 'Password does not match');
});
