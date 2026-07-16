const crypto = require('node:crypto');

function createStore(initial = {}) {
  return {
    workers: initial.workers || [],
    attendance: initial.attendance || [],
  };
}

function normalizeWorker(input) {
  const dailyWage = Number(input.dailyWage ?? input.wages);

  return {
    name: String(input.name || '').trim(),
    phone: String(input.phone || '').trim(),
    dailyWage,
  };
}

function addWorker(store, input) {
  const worker = normalizeWorker(input);
  if (!worker.name || !worker.phone || !Number.isFinite(worker.dailyWage) || worker.dailyWage <= 0) {
    throw new Error('Name, phone, and daily wage are required');
  }

  const newWorker = {
    id: crypto.randomUUID(),
    ...worker,
  };

  store.workers.push(newWorker);
  return newWorker;
}

function updateWorker(store, workerId, input) {
  const worker = store.workers.find((item) => item.id === workerId);
  if (!worker) {
    throw new Error('Worker not found');
  }

  const updated = normalizeWorker(input);
  if (!updated.name || !updated.phone || !Number.isFinite(updated.dailyWage) || updated.dailyWage <= 0) {
    throw new Error('Name, phone, and daily wage are required');
  }

  Object.assign(worker, updated);
  return worker;
}

function deleteWorker(store, workerId) {
  const index = store.workers.findIndex((item) => item.id === workerId);
  if (index === -1) {
    throw new Error('Worker not found');
  }

  store.workers.splice(index, 1);
  store.attendance = store.attendance.filter((entry) => entry.workerId !== workerId);
}

function markAttendance(store, workerId, date, status) {
  const worker = store.workers.find((item) => item.id === workerId);
  if (!worker) {
    throw new Error('Worker not found');
  }

  const existing = store.attendance.find((entry) => entry.workerId === workerId && entry.date === date);
  const record = {
    id: existing?.id || crypto.randomUUID(),
    workerId,
    date,
    status,
  };

  if (existing) {
    Object.assign(existing, record);
    return existing;
  }

  store.attendance.push(record);
  return record;
}

function getMonthlyReport(store, month) {
  return store.workers.map((worker) => {
    const wage = Number(worker.dailyWage || 0);
    const entries = store.attendance.filter((entry) => entry.workerId === worker.id && entry.date.startsWith(month));
    const present = entries.filter((entry) => entry.status === 'present').length;
    const halfDay = entries.filter((entry) => entry.status === 'half-day').length;
    const absent = entries.filter((entry) => entry.status === 'absent').length;

    return {
      workerId: worker.id,
      workerName: worker.name,
      phone: worker.phone,
      dailyWage: wage,
      present,
      halfDay,
      absent,
      workingDays: present + halfDay,
      monthlySalary: present * wage + halfDay * (wage / 2),
    };
  });
}

module.exports = {
  createStore,
  addWorker,
  updateWorker,
  deleteWorker,
  markAttendance,
  getMonthlyReport,
};
