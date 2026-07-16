const test = require('node:test');
const assert = require('node:assert/strict');
const { app } = require('../index');

test('GET / serves the client HTML', async () => {
  const server = app.listen(0);

  try {
    const { port } = await new Promise((resolve, reject) => {
      server.once('listening', () => resolve(server.address()));
      server.once('error', reject);
    });

    const response = await fetch(`http://127.0.0.1:${port}/`);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.match(text, /Attendance Hub/);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
});
