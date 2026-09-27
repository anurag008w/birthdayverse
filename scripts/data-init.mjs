/**
 * BirthdayVerse - Data Repository Initialization Script
 * npm run data:init
 */

import { GitHubDataClient } from '../src/lib/github-data/client.ts';

async function initDataRepo() {
  console.log('[BirthdayVerse] Initializing GitHub Data Repository structure...');
  const client = new GitHubDataClient();

  const metaFiles = [
    {
      path: '_meta/schema.json',
      content: JSON.stringify({
        schemaVersion: '1.0.0',
        minimumAppVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        description: 'BirthdayVerse Canonical Persistence Schema'
      }, null, 2)
    },
    {
      path: '_meta/version.json',
      content: JSON.stringify({
        dataRepoVersion: '1.0.0',
        updatedAt: new Date().toISOString()
      }, null, 2)
    },
    {
      path: '_meta/health.json',
      content: JSON.stringify({
        status: 'healthy',
        lastInitialized: new Date().toISOString()
      }, null, 2)
    },
    {
      path: '_meta/counters.json',
      content: JSON.stringify({
        totalExperiencesCreated: 0,
        totalExperiencesPublished: 0
      }, null, 2)
    }
  ];

  try {
    const result = await client.commitFiles(
      metaFiles,
      'BirthdayVerse: initialize data repository metadata'
    );
    console.log(`[BirthdayVerse] Initialization succeeded! Commit SHA: ${result.commitSha}`);
  } catch (err) {
    console.error('[BirthdayVerse] Initialization failed:', err.message);
    process.exit(1);
  }
}

initDataRepo();
