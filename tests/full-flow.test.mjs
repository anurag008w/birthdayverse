import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { GitHubDataClient } from '../src/lib/github-data/client.ts';
import { getTemplateById } from '../src/lib/templates/registry.ts';

describe('Full End-to-End Experience Lifecycle (Zero Media)', () => {
  const client = new GitHubDataClient({
    repo: 'test-org/test-birthdayverse-data',
    branch: 'main',
    token: 'test_token',
    mockMode: true
  });

  process.env.DATA_ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

  test('successfully executes complete lifecycle: create -> draft -> update -> preview -> publish -> public access -> delete', async () => {
    // 1. CREATE: Zero photos, zero video, zero audio
    const ownerId = 'own_flow_tester_1';
    const createResult = await client.createExperience({
      ownerId,
      status: 'draft',
      templateId: 'night-sky',
      templateVersion: '1.0.0',
      birthdayName: 'Aria',
      creatorName: 'Leo',
      relationship: 'bestie',
      birthdayDate: '2026-10-20',
      timezone: 'America/Los_Angeles',
      personality: ['Creative', 'Soulful'],
      bond: 'Best friends for 10 years',
      tone: 'cosmic',
      mood: 'midnight',
      experienceMode: 'nightsky',
      coreMessage: 'You are the calm in every storm.',
      finalWish: 'May the stars light your every step.',
      sceneConfiguration: getTemplateById('night-sky').defaultScenes,
      interactionConfiguration: {
        hasCake: true,
        cake: { candlesCount: 3, blowoutMethod: 'both', blowoutCelebration: 'fireworks' },
        hasEnvelope: true,
        hasConstellation: true
      },
      mediaReferences: [], // ZERO PHOTOS, ZERO AUDIO, ZERO VIDEO
      audioConfiguration: { enabled: false, allowMute: true, autoPlayAllowed: false },
      releaseConfiguration: {
        releaseAt: '2026-10-20',
        timezone: 'America/Los_Angeles',
        isAuthoritative: true
      },
      privacyConfiguration: { visibility: 'public', allowSearchIndexing: false },
      seoConfiguration: { title: 'Happy Birthday Aria', description: 'Cosmic birthday journey' }
    });

    const publicId = createResult.experience.publicId;
    const mgmtToken = createResult.managementToken;

    assert.ok(publicId, 'Public ID must be created');
    assert.ok(mgmtToken, 'Management token must be created');

    // 2. REFRESH / RESUME: Read from owner index
    const ownerIndex = await client.getOwnerIndex(ownerId);
    assert.ok(ownerIndex, 'Owner index must exist');
    const summary = ownerIndex.experiences.find(e => e.publicId === publicId);
    assert.ok(summary, 'Experience must be listed in owner index');
    assert.equal(summary.status, 'draft');

    // 3. UPDATE / SWITCH TEMPLATE: Choose 'chaos-bestie'
    const updated = await client.updateExperience(
      publicId,
      {
        templateId: 'chaos-bestie',
        coreMessage: 'Updated: You are officially the most chaotic and wonderful human.'
      },
      mgmtToken
    );
    assert.equal(updated.templateId, 'chaos-bestie');

    // 4. PREVIEW: Public endpoint before publish should return draft data
    const previewData = await client.getPublicExperience(publicId);
    assert.ok(previewData);
    assert.equal(previewData.status, 'draft');
    assert.equal(previewData.mediaReferences.length, 0, 'Zero media confirmed');

    // 5. ATOMIC PUBLISH: Mark published
    const published = await client.publishExperience(publicId, mgmtToken);
    assert.equal(published.status, 'published');
    assert.ok(published.publishedAt);

    // 6. PUBLIC ACCESS: Recipient loads public page
    const publicPublished = await client.getPublicExperience(publicId);
    assert.ok(publicPublished);
    assert.equal(publicPublished.status, 'published');
    assert.equal(publicPublished.birthdayName, 'Aria');
    assert.equal(publicPublished.ownerId, undefined, 'ownerId MUST NOT be exposed');
    assert.equal(publicPublished.managementTokenHash, undefined, 'managementTokenHash MUST NOT be exposed');

    // 7. RECORD ANALYTICS EVENT
    client.recordAnalyticsEvent({
      publicId,
      eventType: 'opened'
    });
    await client.flushAnalytics();

    // 8. DELETE: Soft delete tombstone
    const deleted = await client.deleteExperience(publicId, mgmtToken);
    assert.equal(deleted, true);

    // 9. VERIFY DELETED STATE: Public route stops serving
    const afterDelete = await client.getPublicExperience(publicId);
    assert.equal(afterDelete, null, 'Deleted experience must not be served publicly');
  });
});
