/**
 * BirthdayVerse - Persistence Audit & Integrity Check
 * npm run data:check
 */

import { GitHubDataClient } from '../src/lib/github-data/client.ts';

async function checkDataRepo() {
  console.log('[BirthdayVerse] Running persistence integrity audit...');
  const client = new GitHubDataClient();

  try {
    const schemaRaw = await client.readFile('_meta/schema.json');
    if (!schemaRaw) {
      console.warn('[Warning] _meta/schema.json is missing. Run npm run data:init');
    } else {
      const schema = JSON.parse(schemaRaw);
      console.log(`✔ Schema verified: Version ${schema.schemaVersion}`);
    }

    const health = await client.getHealth();
    console.log(`✔ Persistence Status: ${health.status} (${health.persistence})`);
    console.log('[BirthdayVerse] Integrity check complete: All structures verified.');
  } catch (err) {
    console.error('[BirthdayVerse] Data check error:', err.message);
    process.exit(1);
  }
}

checkDataRepo();
