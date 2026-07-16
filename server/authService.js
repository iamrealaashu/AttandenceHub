const crypto = require('node:crypto');

function createAuthStore(initial = {}) {
  return {
    users: initial.users || [],
    pendingOtps: initial.pendingOtps || {},
    verifiedContacts: initial.verifiedContacts || {},
  };
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function normalizeContact(input) {
  const contact = String(input.contact || input.username || '').trim().toLowerCase();
  if (!contact) {
    throw new Error('Email or phone is required');
  }
  return contact;
}

function sendOtp(store, input) {
  const contact = normalizeContact(input);
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  store.pendingOtps[contact] = otp;
  console.log(`OTP for ${contact}: ${otp}`);
  return otp;
}

function verifyOtp(store, input) {
  const contact = normalizeContact(input);
  const otp = String(input.otp || '').trim();
  if (!otp) {
    throw new Error('OTP is required');
  }

  const expected = store.pendingOtps[contact];
  if (!expected || expected !== otp) {
    throw new Error('Invalid OTP');
  }

  delete store.pendingOtps[contact];
  store.verifiedContacts[contact] = true;
  return true;
}

async function registerUser(store, input) {
  const contact = normalizeContact(input);
  const password = String(input.password || '');

  if (!password) {
    throw new Error('Password is required');
  }

  if (!store.verifiedContacts[contact]) {
    throw new Error('Contact must be verified before registering');
  }

  const existing = store.users.find((user) => user.contact === contact);
  if (existing) {
    throw new Error('Account already exists');
  }

  const user = {
    id: crypto.randomUUID(),
    contact,
    password: hashPassword(password),
  };

  store.users.push(user);
  delete store.verifiedContacts[contact];
  return user;
}

async function loginUser(store, input) {
  const contact = normalizeContact(input);
  const password = String(input.password || '');

  const user = store.users.find((entry) => entry.contact === contact);
  if (!user) {
    return { ok: false, message: 'Account not found' };
  }

  if (user.password !== hashPassword(password)) {
    return { ok: false, message: 'Password does not match' };
  }

  return { ok: true, user: { id: user.id, contact: user.contact } };
}

module.exports = {
  createAuthStore,
  sendOtp,
  verifyOtp,
  registerUser,
  loginUser,
};
