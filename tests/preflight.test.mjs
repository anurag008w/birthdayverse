import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

describe('Preflight Fail-Closed Verification', () => {
  test('fails non-zero when required persistence environment variables are missing', () => {
    assert.throws(() => {
      // Execute preflight with stripped environment
      execSync('node scripts/preflight.mjs', {
        cwd: ROOT_DIR,
        env: {
          PATH: process.env.PATH,
          MOCK_GITHUB: 'false' // Enforce real preflight check
        },
        stdio: 'pipe'
      });
    }, /Command failed/, 'Preflight MUST abort with non-zero exit code when GITHUB_DATA_REPO is missing');
  });

  test('succeeds when running in local MOCK_GITHUB test mode with valid encryption key', () => {
    const output = execSync('node scripts/preflight.mjs', {
      cwd: ROOT_DIR,
      env: {
        PATH: process.env.PATH,
        MOCK_GITHUB: 'true',
        DATA_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      },
      encoding: 'utf8'
    });

    assert.match(output, /Persistence Preflight Succeeded/);
  });
});
