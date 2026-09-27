import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Full Server HTTP & API Integration', () => {
  let serverProcess;
  const TEST_PORT = 4999;
  const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

  function makeRequest(method, path, body = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, BASE_URL);
      const reqHeaders = {
        'Content-Type': 'application/json',
        ...headers
      };

      const req = http.request(url, { method, headers: reqHeaders }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: json || data
          });
        });
      });

      req.on('error', reject);
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  }

  test('starts server and responds to /health, CRUD, sanitization, and security headers', async () => {
    // Spawn server process
    serverProcess = spawn('node', ['--experimental-strip-types', 'server/index.mjs'], {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        PORT: String(TEST_PORT),
        MOCK_GITHUB: 'true',
        DATA_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      },
      stdio: 'pipe'
    });

    // Wait for server to bind
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server start timed out')), 8000);
      serverProcess.stdout.on('data', (d) => {
        const str = d.toString();
        if (str.includes('Server bound')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
      serverProcess.on('error', reject);
    });

    // 1. GET /health
    const healthRes = await makeRequest('GET', '/health');
    assert.equal(healthRes.status, 200);
    assert.equal(healthRes.body.status, 'ok');
    assert.equal(healthRes.body.service, 'birthdayverse');
    assert.equal(healthRes.headers['x-content-type-options'], 'nosniff');
    assert.equal(healthRes.headers['x-frame-options'], 'SAMEORIGIN');

    // 2. POST /api/experiences (Create experience)
    const createPayload = {
      birthdayName: 'Zoya',
      creatorName: 'Aarav',
      relationship: 'bestie',
      birthdayDate: '2026-11-20',
      timezone: 'Asia/Kolkata',
      mood: 'aesthetic',
      experienceMode: 'nightsky',
      templateId: 'night-sky',
      templateVersion: '1.0.0',
      coreMessage: 'You bring quiet brilliance everywhere you go.',
      finalWish: 'Keep illuminating the world.'
    };

    const createRes = await makeRequest('POST', '/api/experiences', createPayload);
    assert.equal(createRes.status, 201);
    assert.ok(createRes.body.success);
    const publicId = createRes.body.experience.publicId;
    const mgmtToken = createRes.body.managementToken;
    assert.ok(publicId, 'Must return publicId');
    assert.ok(mgmtToken, 'Must return managementToken');

    // Check Set-Cookie headers
    const setCookie = createRes.headers['set-cookie'];
    assert.ok(setCookie, 'Must set secure cookies');
    assert.ok(setCookie.some(c => c.includes('HttpOnly') && c.includes('SameSite=Strict')));

    // 3. GET /api/b/:id (Sanitized public presentation)
    const publicRes = await makeRequest('GET', `/api/b/${publicId}`);
    assert.equal(publicRes.status, 200);
    assert.equal(publicRes.body.success, true);
    assert.equal(publicRes.body.experience.birthdayName, 'Zoya');
    assert.equal(publicRes.body.experience.ownerId, undefined, 'ownerId must NOT be exposed in public API');
    assert.equal(publicRes.body.experience.managementTokenHash, undefined, 'token hash must NOT be exposed');

    // 4. GET /b/:id (HTML Shell with dynamic Open Graph injection)
    const htmlRes = await makeRequest('GET', `/b/${publicId}`);
    assert.equal(htmlRes.status, 200);
    assert.ok(typeof htmlRes.body === 'string');
    assert.ok(htmlRes.body.includes('Happy Birthday, Zoya!'), 'Must dynamically inject recipient name in title');

    // 5. POST /api/experiences/:id/publish (Publish experience)
    const publishRes = await makeRequest('POST', `/api/experiences/${publicId}/publish`, null, {
      'x-management-token': mgmtToken
    });
    assert.equal(publishRes.status, 200);
    assert.equal(publishRes.body.success, true);
    assert.equal(publishRes.body.experience.status, 'published');

    // 6. DELETE /api/experiences/:id (Soft-delete)
    const deleteRes = await makeRequest('DELETE', `/api/experiences/${publicId}`, null, {
      'x-management-token': mgmtToken
    });
    assert.equal(deleteRes.status, 200);
    assert.equal(deleteRes.body.success, true);

    // 7. Verify public access returns 404 after deletion
    const afterDeleteRes = await makeRequest('GET', `/api/b/${publicId}`);
    assert.equal(afterDeleteRes.status, 404);

    // Shutdown server
    serverProcess.kill('SIGTERM');
  });
});
