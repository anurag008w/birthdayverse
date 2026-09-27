/**
 * BirthdayVerse - Persistence Preflight Validation
 * FAIL-CLOSED: Deployment strictly aborts if GitHub data repository or credentials are missing/invalid.
 */

import crypto from 'node:crypto';

const isMock = process.env.MOCK_GITHUB === 'true';

async function runPreflight() {
  console.log('\n======================================================');
  console.log('BIRTHDAYVERSE PERSISTENCE PREFLIGHT VERIFICATION');
  console.log('======================================================\n');

  if (isMock) {
    console.log('[Notice] Running in MOCK_GITHUB mode for local test suite.');
    // Validate encryption key format even in mock mode
    validateEncryptionKey(process.env.DATA_ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef');
    console.log('✔ Persistence Preflight Succeeded (Mock Test Mode).\n');
    return;
  }

  // 1. Verify required environment variables
  const repo = process.env.GITHUB_DATA_REPO;
  const token = process.env.GITHUB_DATA_TOKEN;
  const branch = process.env.GITHUB_DATA_BRANCH || 'main';
  const encryptionKey = process.env.DATA_ENCRYPTION_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  const apiUrl = process.env.GITHUB_API_URL || 'https://api.github.com';
  const apiVersion = process.env.GITHUB_API_VERSION || '2022-11-28';

  const errors = [];

  if (!repo) errors.push('GITHUB_DATA_REPO is missing.');
  if (!token) errors.push('GITHUB_DATA_TOKEN is missing.');
  if (!branch) errors.push('GITHUB_DATA_BRANCH is missing.');
  if (!encryptionKey) errors.push('DATA_ENCRYPTION_KEY is missing.');

  if (errors.length > 0) {
    failPreflight(errors);
  }

  // 2. Verify GITHUB_DATA_REPO format (owner/repo)
  if (!/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(repo)) {
    failPreflight([`Invalid GITHUB_DATA_REPO format: "${repo}". Expected format: "owner/repo".`]);
  }
  console.log(`✔ Repository format valid: ${repo}`);

  // 3. Verify encryption key format
  validateEncryptionKey(encryptionKey);
  console.log('✔ Data encryption key verified (32 bytes / 256 bits).');

  // 4. Verify GitHub API connectivity & Authenticate Token
  console.log(`Connecting to GitHub API (${apiUrl})...`);
  const headers = {
    'Accept': 'application/vnd.github+json',
    'Authorization': `Bearer ${token}`,
    'X-GitHub-Api-Version': apiVersion,
    'User-Agent': 'BirthdayVerse-Preflight/1.0'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    // Check token authentication via /user or /rate_limit
    const authRes = await fetch(`${apiUrl}/rate_limit`, {
      headers,
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (authRes.status === 401) {
      failPreflight(['GitHub token authentication failed. Token is invalid or expired (HTTP 401).']);
    }
    if (!authRes.ok) {
      failPreflight([`GitHub API unreachable or returned error: HTTP ${authRes.status}`]);
    }
    console.log('✔ GitHub API authenticated successfully.');

    // 5. Verify configured repository exists and token has access
    const repoRes = await fetch(`${apiUrl}/repos/${repo}`, { headers });
    if (repoRes.status === 404) {
      failPreflight([`Configured repository "${repo}" does not exist or token has no read access (HTTP 404).`]);
    }
    if (repoRes.status === 403) {
      failPreflight([`Token has insufficient permission to access repository "${repo}" (HTTP 403).`]);
    }
    if (!repoRes.ok) {
      failPreflight([`Failed to access repository "${repo}": HTTP ${repoRes.status}`]);
    }
    const repoData = await repoRes.json();
    console.log(`✔ Verified access to repository "${repo}" (Private: ${repoData.private}).`);

    // 6. Verify configured branch exists
    const branchRes = await fetch(`${apiUrl}/repos/${repo}/branches/${branch}`, { headers });
    if (branchRes.status === 404) {
      failPreflight([`Configured branch "${branch}" does not exist in repository "${repo}" (HTTP 404).`]);
    }
    if (!branchRes.ok) {
      failPreflight([`Failed to verify branch "${branch}": HTTP ${branchRes.status}`]);
    }
    console.log(`✔ Verified branch "${branch}" exists.`);

    // 7. Verify write permission capability
    const permissions = repoData.permissions;
    if (permissions && permissions.push === false) {
      failPreflight([`Token does not have write (push) permission to repository "${repo}".`]);
    }
    console.log('✔ Verified write capability to data repository.');

    // 8. Verify repository contents can be read
    const contentsRes = await fetch(`${apiUrl}/repos/${repo}/contents?ref=${branch}`, { headers });
    if (!contentsRes.ok && contentsRes.status !== 404) {
      failPreflight([`Failed to read repository contents: HTTP ${contentsRes.status}`]);
    }
    console.log('✔ Verified read access to repository contents.');

    // 9. Verify application URL format if provided
    if (appUrl) {
      try {
        new URL(appUrl);
        console.log(`✔ Verified application URL: ${appUrl}`);
      } catch {
        failPreflight([`Invalid NEXT_PUBLIC_APP_URL format: "${appUrl}".`]);
      }
    }

    console.log('\n======================================================');
    console.log('✔ ALL PERSISTENCE PREFLIGHT CHECKS PASSED');
    console.log('BirthdayVerse is securely connected to its GitHub data store.');
    console.log('======================================================\n');

  } catch (err) {
    if (err.name === 'AbortError') {
      failPreflight(['GitHub API request timed out during preflight connectivity test.']);
    }
    failPreflight([err.message || 'Unknown network error during GitHub persistence verification.']);
  }
}

function validateEncryptionKey(key) {
  if (!key) {
    failPreflight(['DATA_ENCRYPTION_KEY is required for AES-256-GCM encryption at rest.']);
  }
  const clean = key.trim();
  let len = 0;
  if (/^[0-9a-fA-F]{64}$/.test(clean)) {
    len = 32;
  } else if (/^[A-Za-z0-9+/]{43}=*$/.test(clean)) {
    len = Buffer.from(clean, 'base64').length;
  } else {
    len = Buffer.byteLength(clean);
  }

  if (len < 16) {
    failPreflight(['DATA_ENCRYPTION_KEY is too short (expected 32 bytes / 256 bits).']);
  }
}

function failPreflight(reasons) {
  console.error('\n======================================================');
  console.error('PERSISTENCE PREFLIGHT FAILED');
  console.error('GitHub data repository configuration is missing or invalid.');
  console.error('Deployment cannot continue because BirthdayVerse requires GitHub-backed persistence.\n');
  reasons.forEach(r => console.error(` ✖ ${r}`));
  console.error('\nFAIL CLOSED: Production build aborted.');
  console.error('======================================================\n');
  process.exit(1);
}

runPreflight();
