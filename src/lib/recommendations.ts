import { TEMPLATES_CATALOG } from './templates/registry.ts';
import type { TemplateDefinition } from './templates/registry.ts';
import type { RelationshipType, MoodType, ExperienceMode } from '../types/schema.ts';

export interface RecommendationInput {
  relationship: RelationshipType;
  personality?: string[];
  bond?: string;
  mood?: MoodType;
  experienceMode?: ExperienceMode;
  messageLength?: number;
  hasPhotos?: boolean;
  hasAudio?: boolean;
  animationPreference?: 'gentle' | 'balanced' | 'intense';
}

export interface RecommendationResult {
  topTemplates: Array<{
    template: TemplateDefinition;
    score: number;
    matchLabel: 'Recommended For You' | 'Matches Your Vibe' | 'Based on Your Choices';
    reason: string;
  }>;
  recommendedInteractions: Array<'cake' | 'envelope' | 'giftBox' | 'scratchCard' | 'constellation' | 'quiz' | 'memoryGame' | 'wishJar'>;
  recommendedFinale: 'confetti' | 'fireworks' | 'stars' | 'hearts';
  recommendedVisualIntensity: 'light' | 'medium' | 'heavy';
}

export function recommendExperiences(input: RecommendationInput): RecommendationResult {
  const scored = TEMPLATES_CATALOG.map(template => {
    let score = 0;
    const reasons: string[] = [];

    // Relationship match (+35 points)
    if (template.relationships.includes(input.relationship)) {
      score += 35;
      reasons.push(`Designed specifically for ${input.relationship} bonds`);
    }

    // Mood match (+30 points)
    if (input.mood && template.moods.includes(input.mood)) {
      score += 30;
      reasons.push(`Matches your selected vibe: ${input.mood}`);
    }

    // Experience Mode match (+20 points)
    if (input.experienceMode && template.experienceMode === input.experienceMode) {
      score += 20;
      reasons.push(`Aligns with ${input.experienceMode} storytelling`);
    }

    // Zero-photo bonus if creator has no photos (+15 points)
    if (!input.hasPhotos && template.zeroPhotoSafe) {
      score += 15;
      reasons.push('Features full kinetic typography & zero-photo animations');
    }

    // Interaction preference match (+10 points)
    if (input.animationPreference === 'intense' && (template.interactionLevel === 'game' || template.interactionLevel === 'interactive')) {
      score += 10;
    } else if (input.animationPreference === 'gentle' && template.interactionLevel === 'gentle') {
      score += 10;
    }

    // Base uniqueness score for variety
    score += (template.name.charCodeAt(0) % 7);

    return {
      template,
      score,
      reason: reasons[0] || 'Curated premium template'
    };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  const top = scored.slice(0, 5).map((item, idx) => {
    let matchLabel: 'Recommended For You' | 'Matches Your Vibe' | 'Based on Your Choices' = 'Recommended For You';
    if (idx === 1) matchLabel = 'Matches Your Vibe';
    if (idx >= 2) matchLabel = 'Based on Your Choices';

    return {
      template: item.template,
      score: item.score,
      matchLabel,
      reason: item.reason
    };
  });

  // Recommend interactions based on relationship and mood
  const interactions: Array<'cake' | 'envelope' | 'giftBox' | 'scratchCard' | 'constellation' | 'quiz' | 'memoryGame' | 'wishJar'> = ['cake'];

  if (input.relationship === 'partner' || input.relationship === 'mom') {
    interactions.push('envelope', 'wishJar');
  } else if (input.relationship === 'bestie' || input.relationship === 'sister' || input.relationship === 'brother') {
    interactions.push('giftBox', 'scratchCard', 'quiz');
  } else {
    interactions.push('envelope', 'scratchCard');
  }

  // Recommended finale
  let finale: 'confetti' | 'fireworks' | 'stars' | 'hearts' = 'confetti';
  if (input.relationship === 'partner') finale = 'hearts';
  else if (input.mood === 'cosmic' || input.mood === 'midnight') finale = 'stars';
  else if (input.mood === 'luxury' || input.mood === 'neon') finale = 'fireworks';

  const visualIntensity: 'light' | 'medium' | 'heavy' = 
    input.animationPreference === 'gentle' ? 'light' : input.animationPreference === 'intense' ? 'heavy' : 'medium';

  return {
    topTemplates: top,
    recommendedInteractions: interactions,
    recommendedFinale: finale,
    recommendedVisualIntensity: visualIntensity
  };
}
