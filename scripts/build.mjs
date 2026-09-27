import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const ASSETS_DIR = path.join(DIST_DIR, 'assets');

console.log('[BirthdayVerse] Initiating production build...');

// Ensure dist directories exist
fs.mkdirSync(ASSETS_DIR, { recursive: true });

// 1. Build CSS with Tailwind
console.log('[BirthdayVerse] Compiling Tailwind CSS...');
try {
  execSync(
    './node_modules/.bin/tailwind -i src/index.css -o dist/assets/app.css --minify',
    { cwd: ROOT_DIR, stdio: 'inherit' }
  );
  console.log('[BirthdayVerse] CSS compilation complete: dist/assets/app.css');
} catch (err) {
  console.error('[BirthdayVerse] Failed to compile Tailwind CSS:', err);
  process.exit(1);
}

// 2. Bundle Client React App with esbuild
console.log('[BirthdayVerse] Bundling React TypeScript application with esbuild...');
try {
  execSync(
    './node_modules/.bin/esbuild src/main.tsx --bundle --minify --format=esm --target=es2022 --outfile=dist/assets/app.js',
    { cwd: ROOT_DIR, stdio: 'inherit' }
  );
  console.log('[BirthdayVerse] Client bundle generated: dist/assets/app.js');
} catch (err) {
  console.error('[BirthdayVerse] Failed to bundle client application:', err);
  process.exit(1);
}

// 3. Copy index.html
console.log('[BirthdayVerse] Copying HTML shell...');
fs.copyFileSync(path.join(ROOT_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));

// 4. Scan built assets for secrets
console.log('[BirthdayVerse] Scanning built assets for accidental secret leaks...');
try {
  execSync('node scripts/scan-secrets.mjs', { cwd: ROOT_DIR, stdio: 'inherit' });
} catch (err) {
  console.error('[BirthdayVerse] Secret scan failed!');
  process.exit(1);
}

console.log('[BirthdayVerse] Production build successfully finished! Ready for Render deployment.\n');
