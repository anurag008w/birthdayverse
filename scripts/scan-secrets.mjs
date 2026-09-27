/**
 * BirthdayVerse Build-Time Secret Scanner
 * Ensures no server secrets or GitHub tokens accidentally leaked into the client bundle or HTML.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const SECRETS_TO_CHECK = [
  process.env.GITHUB_DATA_TOKEN,
  process.env.DATA_ENCRYPTION_KEY,
  process.env.SESSION_SECRET,
  process.env.MANAGEMENT_TOKEN_SECRET
].filter(s => s && s.trim().length >= 8); // only check non-trivial secret strings

let hasLeak = false;

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.html') || entry.name.endsWith('.css') || entry.name.endsWith('.map'))) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Check for known secret environment values
      for (const secret of SECRETS_TO_CHECK) {
        if (content.includes(secret)) {
          console.error(`\n[CRITICAL SECURITY ALERT] Accidental secret leakage detected in built asset: ${entry.name}`);
          hasLeak = true;
        }
      }

      // Check for suspicious patterns like github tokens
      if (/ghp_[A-Za-z0-9]{36}/.test(content) || /github_pat_[A-Za-z0-9_]{40,}/.test(content)) {
        console.error(`\n[CRITICAL SECURITY ALERT] GitHub token pattern detected in built asset: ${entry.name}`);
        hasLeak = true;
      }
    }
  }
}

scanDirectory(DIST_DIR);

if (hasLeak) {
  console.error('\nFAIL CLOSED: Production build aborted due to secret leakage.');
  process.exit(1);
} else {
  console.log('[Security Audit] Dist assets verified: 0 secret leaks found.');
}
