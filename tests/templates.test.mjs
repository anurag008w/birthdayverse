import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TEMPLATES_CATALOG, getTemplateById } from '../src/lib/templates/registry.ts';
import { recommendExperiences } from '../src/lib/recommendations.ts';

describe('Templates Catalog & Engine', () => {
  test('contains at least 80 genuinely distinct premium templates', () => {
    assert.ok(
      TEMPLATES_CATALOG.length >= 80,
      `Expected at least 80 templates, found ${TEMPLATES_CATALOG.length}`
    );
  });

  test('every template has a unique ID, non-empty name, and valid visual theme', () => {
    const ids = new Set();
    const names = new Set();

    for (const t of TEMPLATES_CATALOG) {
      assert.ok(t.id, 'Template must have an ID');
      assert.ok(!ids.has(t.id), `Duplicate template ID found: ${t.id}`);
      ids.add(t.id);

      assert.ok(t.name, 'Template must have a name');
      assert.ok(!names.has(t.name.toLowerCase()), `Duplicate template name found: ${t.name}`);
      names.add(t.name.toLowerCase());

      assert.ok(t.tagline, `Template ${t.id} must have a tagline`);
      assert.ok(t.visualTheme, `Template ${t.id} must have visual theme`);
      assert.ok(t.visualTheme.accent, `Template ${t.id} must have accent color`);
      assert.ok(t.defaultScenes.length >= 3, `Template ${t.id} must define default scenes`);
    }
  });

  test('all templates are zero-photo safe (first-class support for zero photos)', () => {
    for (const t of TEMPLATES_CATALOG) {
      assert.equal(
        t.zeroPhotoSafe,
        true,
        `Template ${t.id} must support zero photos with kinetic typography`
      );
    }
  });

  test('recommendation engine suggests relevant templates and valid match labels', () => {
    const recs = recommendExperiences({
      relationship: 'sister',
      mood: 'chaotic',
      experienceMode: 'arcade',
      hasPhotos: false,
      animationPreference: 'intense'
    });

    assert.ok(recs.topTemplates.length >= 3, 'Must return at least 3 recommendations');
    assert.ok(recs.topTemplates[0].template.id, 'Top recommendation must be valid');
    assert.ok(['Recommended For You', 'Matches Your Vibe', 'Based on Your Choices'].includes(recs.topTemplates[0].matchLabel));
    assert.ok(recs.recommendedInteractions.includes('cake'), 'Cake must be recommended');
  });
});
