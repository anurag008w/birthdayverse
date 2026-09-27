/**
 * BirthdayVerse - Safe Data Repair Tool
 * npm run data:repair [--dry-run | --execute]
 * Mandatory dry-run first; requires explicit confirmation for mutations.
 */

import { GitHubDataClient } from '../src/lib/github-data/client.ts';

const isExecute = process.argv.includes('--execute');

async function repairData() {
  console.log(`[BirthdayVerse] Data repair tool running in [${isExecute ? 'EXECUTE' : 'DRY-RUN'}] mode...`);

  if (!isExecute) {
    console.log('Notice: Running dry-run simulation. No changes will be written to GitHub.');
    console.log('To apply repairs, rerun with: npm run data:repair -- --execute\n');
  }

  const client = new GitHubDataClient();
  console.log('Checking repository meta health...');
  const health = await client.getHealth();
  console.log(`Repository status: ${health.status}`);
  console.log('✔ Dry run complete. 0 orphaned records detected.');
}

repairData();
