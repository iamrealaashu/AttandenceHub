const test = require('node:test');
const assert = require('node:assert/strict');
const { createStore, addWorker, updateWorker, deleteWorker, markAttendance, getMonthlyReport } = require('../attendanceService');

function makeTempStore() {
  return createStore({ workers: [], attendance: [] });
}

test('addWorker stores a worker with normalized details and daily wage', () => {
  const store = makeTempStore();
  const worker = addWorker(store, { name: 'Asha', phone: ' 9876543210 ', dailyWage: '500' });

  assert.equal(worker.name, 'Asha');
  assert.equal(worker.phone, '9876543210');
  assert.equal(worker.dailyWage, 500);
  assert.equal(worker.id.length > 0, true);
});

test('markAttendance records a status for a given date', () => {
  const store = makeTempStore();
  const worker = addWorker(store, { name: 'Ravi', phone: '1234567890', dailyWage: 500 });

  const entry = markAttendance(store, worker.id, '2026-07-14', 'present');

  assert.equal(entry.status, 'present');
  assert.equal(entry.date, '2026-07-14');
  assert.equal(store.attendance.length, 1);
});

test('getMonthlyReport returns totals for each worker', () => {
  const store = makeTempStore();
  const worker = addWorker(store, { name: 'Nina', phone: '5555555555', dailyWage: 500 });
  markAttendance(store, worker.id, '2026-07-01', 'present');
  markAttendance(store, worker.id, '2026-07-02', 'half-day');
  markAttendance(store, worker.id, '2026-07-03', 'absent');

  const report = getMonthlyReport(store, '2026-07');

  assert.equal(report[0].workerName, 'Nina');
  assert.equal(report[0].present, 1);
  assert.equal(report[0].halfDay, 1);
  assert.equal(report[0].absent, 1);
  assert.equal(report[0].workingDays, 2);
  assert.equal(report[0].monthlySalary, 500 + 250);
});

test('deleteWorker removes the worker and related attendance', () => {
  const store = makeTempStore();
  const worker = addWorker(store, { name: 'Kiran', phone: '4444444444', dailyWage: 500 });
  markAttendance(store, worker.id, '2026-07-14', 'present');

  deleteWorker(store, worker.id);

  assert.equal(store.workers.length, 0);
  assert.equal(store.attendance.length, 0);
});
