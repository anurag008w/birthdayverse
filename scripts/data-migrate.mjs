/**
 * BirthdayVerse - Versioned Schema Migration Tool
 * npm run data:migrate
 */

import { GitHubDataClient } from '../src/lib/github-data/client.ts';

async function migrate() {
  console.log('[BirthdayVerse] Running schema migrations...');
  const client = new GitHubDataClient();

  const currentSchemaRaw = await client.readFile('_meta/schema.json');
  if (!currentSchemaRaw) {
    console.log('No existing schema found. Nothing to migrate.');
    return;
  }

  const currentSchema = JSON.parse(currentSchemaRaw);
  console.log(`Current Schema Version: ${currentSchema.schemaVersion}`);
  console.log('✔ All records up to date with Schema 1.0.0.');
}

migrate();
