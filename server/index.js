const express = require('express');
const path = require('node:path');
const crypto = require('node:crypto');
const cors = require('cors');
const { createStore, addWorker, updateWorker, deleteWorker, markAttendance, getMonthlyReport } = require('./attendanceService');
const { createAuthStore, sendOtp, verifyOtp, registerUser, loginUser } = require('./authService');

const app = express();
const port = process.env.PORT || 3001;
const store = createStore();
const authStore = createAuthStore();
const sessions = new Map();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

function requireAuth(req, res, next) {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(401).json({ message: 'Please log in first' });
  }
  req.user = session.user;
  next();
}

app.get('/', (req, res) => {
  const indexPath = path.resolve(__dirname, '..', 'client', 'index.html');
  console.log('Serving homepage from', indexPath);
  res.sendFile(indexPath, (error) => {
    if (error) {
      console.error(error);
      res.status(500).send('Unable to load the attendance page.');
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/otp', (req, res) => {
  try {
    const otp = sendOtp(authStore, req.body);
    res.json({ ok: true, message: 'OTP sent', otp });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

app.post('/verify-otp', (req, res) => {
  try {
    verifyOtp(authStore, req.body);
    res.json({ ok: true, message: 'OTP verified' });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

app.post('/register', async (req, res) => {
  try {
    const user = await registerUser(authStore, req.body);
    res.status(201).json({ ok: true, user });
  } catch (error) {
    res.status(400).json({ ok: false, message: error.message });
  }
});

app.post('/login', async (req, res) => {
  const result = await loginUser(authStore, req.body);
  if (!result.ok) {
    return res.status(401).json(result);
  }

  const sessionId = crypto.randomUUID();
  sessions.set(sessionId, { user: result.user });
  res.json({ ok: true, user: result.user, sessionId });
});

app.get('/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.user });
});

app.get('/workers', requireAuth, (req, res) => {
  res.json(store.workers);
});

app.post('/workers', requireAuth, (req, res) => {
  try {
    const worker = addWorker(store, req.body);
    res.status(201).json(worker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.put('/workers/:id', requireAuth, (req, res) => {
  try {
    const worker = updateWorker(store, req.params.id, req.body);
    res.json(worker);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.delete('/workers/:id', requireAuth, (req, res) => {
  try {
    deleteWorker(store, req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.post('/attendance', requireAuth, (req, res) => {
  try {
    const { workerId, date, status } = req.body;
    const entry = markAttendance(store, workerId, date, status);
    res.status(201).json(entry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/reports/:month', requireAuth, (req, res) => {
  res.json(getMonthlyReport(store, req.params.month));
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

module.exports = { app, store };
