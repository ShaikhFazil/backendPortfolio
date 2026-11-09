/**
 * Offline smoke test: exercises routing, auth guards, validation and the error
 * handler without a database. Every case below is rejected before any query
 * runs, which is exactly the property worth checking.
 *
 *   node scripts/smoke.test.js
 */
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smoke';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret-'.repeat(3);
process.env.NODE_ENV = 'test';

const assert = require('node:assert');
const http = require('node:http');
const app = require('../src/app');

const server = http.createServer(app);

function call(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        host: '127.0.0.1',
        port: server.address().port,
        method,
        path,
        headers: {
          ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          let parsed = null;
          try { parsed = JSON.parse(data); } catch { /* non-json */ }
          resolve({ status: res.statusCode, body: parsed, headers: res.headers });
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const cases = [
  ['health responds', async () => {
    const r = await call('GET', '/health');
    assert.equal(r.status, 200);
    assert.equal(r.body.data.status, 'ok');
  }],

  ['unknown route returns a clean 404', async () => {
    const r = await call('GET', '/api/does-not-exist');
    assert.equal(r.status, 404);
    assert.equal(r.body.success, false);
    assert.ok(!JSON.stringify(r.body).includes('at Object'), 'must not leak a stack trace');
  }],

  ['login rejects a malformed body with field-level detail', async () => {
    const r = await call('POST', '/api/auth/login', { email: 'nope', password: 'short' });
    assert.equal(r.status, 400);
    assert.equal(r.body.error.message, 'Validation failed');
    assert.ok(r.body.error.details.some((d) => d.field === 'email'));
    assert.ok(r.body.error.details.some((d) => d.field === 'password'));
  }],

  ['/auth/me without a cookie is 401', async () => {
    const r = await call('GET', '/api/auth/me');
    assert.equal(r.status, 401);
  }],

  ['/auth/me with a forged token is 401', async () => {
    const r = await call('GET', '/api/auth/me', null, { Authorization: 'Bearer not.a.real.token' });
    assert.equal(r.status, 401);
  }],

  ['profile write without auth is 401', async () => {
    const r = await call('PUT', '/api/profile', { name: 'X', title: 'Y' });
    assert.equal(r.status, 401);
  }],

  ['project create without auth is 401', async () => {
    const r = await call('POST', '/api/projects', { title: 'Hack' });
    assert.equal(r.status, 401);
  }],

  ['project delete without auth is 401', async () => {
    const r = await call('DELETE', '/api/projects/507f1f77bcf86cd799439011');
    assert.equal(r.status, 401);
  }],

  ['admin listing of unpublished records without auth is 401', async () => {
    const r = await call('GET', '/api/skills/all');
    assert.equal(r.status, 401);
  }],

  ['resume upload without auth is 401', async () => {
    const r = await call('POST', '/api/resume');
    assert.equal(r.status, 401);
  }],

  ['image upload without auth is 401', async () => {
    const r = await call('POST', '/api/uploads/image');
    assert.equal(r.status, 401);
  }],

  ['stats without auth is 401', async () => {
    const r = await call('GET', '/api/stats');
    assert.equal(r.status, 401);
  }],

  ['contact form validates before writing', async () => {
    const r = await call('POST', '/api/contact', { name: 'A', email: 'bad', message: 'hi' });
    assert.equal(r.status, 400);
    const fields = r.body.error.details.map((d) => d.field);
    assert.ok(fields.includes('name') && fields.includes('email') && fields.includes('message'));
  }],

  ['contact honeypot rejects bot submissions', async () => {
    const r = await call('POST', '/api/contact', {
      name: 'Spam Bot',
      email: 'bot@example.com',
      message: 'Buy cheap things right now please',
      website: 'http://spam.example',
    });
    assert.equal(r.status, 400);
  }],

  ['reading contact messages requires auth', async () => {
    const r = await call('GET', '/api/contact');
    assert.equal(r.status, 401);
  }],

  ['skill categories are public', async () => {
    const r = await call('GET', '/api/meta/skill-categories');
    assert.equal(r.status, 200);
    assert.equal(r.body.data.length, 7);
  }],

  ['security headers are set', async () => {
    const r = await call('GET', '/health');
    assert.equal(r.headers['x-content-type-options'], 'nosniff');
    assert.ok(r.headers['x-dns-prefetch-control']);
    assert.equal(r.headers['x-powered-by'], undefined);
  }],
];

(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  let passed = 0;
  let failed = 0;

  for (const [name, fn] of cases) {
    try {
      await fn();
      console.log(`  ok   ${name}`);
      passed += 1;
    } catch (err) {
      console.error(`  FAIL ${name}\n       ${err.message}`);
      failed += 1;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  server.close();
  process.exit(failed ? 1 : 0);
})();
