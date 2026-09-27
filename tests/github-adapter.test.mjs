import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GitHubDataClient, GitHubPersistenceError } from '../src/lib/github-data/client.ts';

describe('GitHub Persistence Client (Adapter & Concurrency)', () => {
  const client = new GitHubDataClient({
    repo: 'test-org/test-birthdayverse-data',
    branch: 'main',
    token: 'test_token',
    mockMode: true
  });

  process.env.DATA_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  test('creates, encrypts, and persists a canonical experience record', async () => {
    const created = await client.createExperience({
      ownerId: 'own_test_123',
      status: 'draft',
      templateId: 'night-sky',
      templateVersion: '1.0.0',
      birthdayName: 'Priya',
      creatorName: 'Ananya',
      relationship: 'bestie',
      birthdayDate: '2026-10-15',
      timezone: 'Asia/Kolkata',
      personality: ['Bright', 'Funny'],
      bond: 'Unbreakable',
      tone: 'aesthetic',
      mood: 'cosmic',
      experienceMode: 'nightsky',
      coreMessage: 'You are the brightest star in every room.',
      finalWish: 'May all your constellations align.',
      sceneConfiguration: [],
      interactionConfiguration: { hasCake: true },
      mediaReferences: [],
      audioConfiguration: { enabled: true, allowMute: true, autoPlayAllowed: false },
      releaseConfiguration: { timezone: 'Asia/Kolkata', isAuthoritative: true },
      privacyConfiguration: { visibility: 'public', allowSearchIndexing: false },
      seoConfiguration: { title: 'Happy Birthday Priya', description: 'Cosmic celebration' }
    });

    assert.ok(created.experience.publicId, 'Must generate publicId');
    assert.ok(created.managementToken, 'Must generate private management token');
    assert.ok(created.experience.managementTokenHash, 'Must store token hash, not plaintext');
    assert.notEqual(created.managementToken, created.experience.managementTokenHash);

    // Retrieve and verify
    const fetched = await client.getExperience(created.experience.publicId);
    assert.ok(fetched);
    assert.equal(fetched.birthdayName, 'Priya');
    assert.equal(fetched.status, 'draft');
  });

  test('sanitizes public presentation data (stripping ownerId and management secrets)', async () => {
    const created = await client.createExperience({
      ownerId: 'own_secret_owner_999',
      status: 'published',
      templateId: 'chaos-bestie',
      templateVersion: '1.0.0',
      birthdayName: 'Rohan',
      creatorName: 'Vikram',
      relationship: 'brother',
      birthdayDate: '2026-11-01',
      timezone: 'America/New_York',
      personality: ['Chaotic', 'Loyal'],
      bond: 'Brothers for life',
      tone: 'chaotic',
      mood: 'chaotic',
      experienceMode: 'arcade',
      coreMessage: 'Half arguments, half laughter.',
      finalWish: 'Happy birthday bro!',
      sceneConfiguration: [],
      interactionConfiguration: { hasCake: true },
      mediaReferences: [],
      audioConfiguration: { enabled: true, allowMute: true, autoPlayAllowed: false },
      releaseConfiguration: { timezone: 'America/New_York', isAuthoritative: true },
      privacyConfiguration: { visibility: 'public', allowSearchIndexing: false },
      seoConfiguration: { title: 'Happy Birthday Rohan', description: 'Bro celebration' }
    });

    const publicView = await client.getPublicExperience(created.experience.publicId);
    assert.ok(publicView);
    assert.equal(publicView.birthdayName, 'Rohan');

    // VERIFY CRITICAL DATA BOUNDARY ISOLATION
    assert.equal(publicView.ownerId, undefined, 'ownerId MUST NEVER be leaked in public presentation data');
    assert.equal(publicView.managementTokenHash, undefined, 'managementTokenHash MUST NEVER be leaked');
    assert.equal(publicView.managementToken, undefined, 'managementToken MUST NEVER be leaked');
  });

  test('updates experience only with valid management token', async () => {
    const created = await client.createExperience({
      ownerId: 'own_author_1',
      status: 'draft',
      templateId: 'paper-story',
      templateVersion: '1.0.0',
      birthdayName: 'Sara',
      creatorName: 'Karan',
      relationship: 'partner',
      birthdayDate: '2026-12-25',
      timezone: 'UTC',
      personality: ['Gentle'],
      bond: 'Soulmates',
      tone: 'romantic',
      mood: 'handwritten',
      experienceMode: 'letter',
      coreMessage: 'Every word is for you.',
      finalWish: 'Forever with you.',
      sceneConfiguration: [],
      interactionConfiguration: {},
      mediaReferences: [],
      audioConfiguration: { enabled: true, allowMute: true, autoPlayAllowed: false },
      releaseConfiguration: { timezone: 'UTC', isAuthoritative: true },
      privacyConfiguration: { visibility: 'public', allowSearchIndexing: false },
      seoConfiguration: { title: 'For Sara', description: 'Love letter' }
    });

    // Update with wrong token -> must fail with 403
    await assert.rejects(async () => {
      await client.updateExperience(created.experience.publicId, { birthdayName: 'Updated Name' }, 'invalid_token');
    }, /Invalid management token/);

    // Update with correct token -> succeeds
    const updated = await client.updateExperience(
      created.experience.publicId,
      { birthdayName: 'Sara Darling' },
      created.managementToken
    );
    assert.equal(updated.birthdayName, 'Sara Darling');
  });

  test('duplicates experience with brand new public ID and zero copied analytics', async () => {
    const original = await client.createExperience({
      ownerId: 'own_user_abc',
      status: 'published',
      templateId: 'midnight-love',
      templateVersion: '1.0.0',
      birthdayName: 'Original Recipient',
      creatorName: 'Sender',
      relationship: 'partner',
      birthdayDate: '2026-05-10',
      timezone: 'UTC',
      personality: ['Kind'],
      bond: 'Cherished',
      tone: 'aesthetic',
      mood: 'midnight',
      experienceMode: 'story',
      coreMessage: 'Original message',
      finalWish: 'Original wish',
      sceneConfiguration: [],
      interactionConfiguration: {},
      mediaReferences: [],
      audioConfiguration: { enabled: true, allowMute: true, autoPlayAllowed: false },
      releaseConfiguration: { timezone: 'UTC', isAuthoritative: true },
      privacyConfiguration: { visibility: 'public', allowSearchIndexing: false },
      seoConfiguration: { title: 'Title', description: 'Desc' }
    });

    const duplicated = await client.duplicateExperience(original.experience.publicId, original.managementToken);
    assert.notEqual(duplicated.experience.publicId, original.experience.publicId, 'Duplicated record must have unique publicId');
    assert.notEqual(duplicated.managementToken, original.managementToken, 'Duplicated record must have fresh management token');
    assert.equal(duplicated.experience.status, 'draft', 'Duplicated record starts as draft');
  });

  test('soft-deletes experience with tombstone record', async () => {
    const created = await client.createExperience({
      ownerId: 'own_delete_test',
      status: 'published',
      templateId: 'the-cinema',
      templateVersion: '1.0.0',
      birthdayName: 'To Be Deleted',
      creatorName: 'Sender',
      relationship: 'colleague',
      birthdayDate: '2026-01-01',
      timezone: 'UTC',
      personality: [],
      bond: 'Good',
      tone: 'minimal',
      mood: 'minimal',
      experienceMode: 'cinematic',
      coreMessage: 'Will be deleted',
      finalWish: 'Goodbye',
      sceneConfiguration: [],
      interactionConfiguration: {},
      mediaReferences: [],
      audioConfiguration: { enabled: false, allowMute: true, autoPlayAllowed: false },
      releaseConfiguration: { timezone: 'UTC', isAuthoritative: true },
      privacyConfiguration: { visibility: 'public', allowSearchIndexing: false },
      seoConfiguration: { title: 'TBD', description: 'TBD' }
    });

    const success = await client.deleteExperience(created.experience.publicId, created.managementToken);
    assert.equal(success, true);

    // Public view must return null for deleted experiences
    const publicView = await client.getPublicExperience(created.experience.publicId);
    assert.equal(publicView, null, 'Public endpoint must never serve deleted experiences');
  });
});
