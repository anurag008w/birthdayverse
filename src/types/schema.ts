/**
 * BirthdayVerse Canonical Data Schemas & Types
 * Schema Version: 1.0.0
 */

export type ExperienceStatus = 'draft' | 'scheduled' | 'published' | 'unpublished' | 'expired' | 'deleted';

export type ExperienceMode = 'story' | 'cinematic' | 'arcade' | 'museum' | 'room' | 'letter' | 'radio' | 'newspaper' | 'nightsky' | 'magicbox' | 'passport' | 'library' | 'planetarium' | 'timecapsule';

export type RelationshipType = 
  | 'bestie' 
  | 'friend' 
  | 'sister' 
  | 'brother' 
  | 'cousin' 
  | 'mom' 
  | 'dad' 
  | 'partner' 
  | 'family' 
  | 'colleague' 
  | 'mentor' 
  | 'other';

export type MoodType = 
  | 'cute' 
  | 'aesthetic' 
  | 'minimal' 
  | 'luxury' 
  | 'cinematic' 
  | 'dreamy' 
  | 'emotional' 
  | 'funny' 
  | 'chaotic' 
  | 'dark' 
  | 'mystical' 
  | 'cozy' 
  | 'pastel' 
  | 'neon' 
  | 'retro' 
  | 'scrapbook' 
  | 'handwritten' 
  | 'midnight' 
  | 'fairytale' 
  | 'modern' 
  | 'wholesome' 
  | 'playful' 
  | 'magical' 
  | 'cosmic' 
  | 'rainy' 
  | 'sunset' 
  | 'monochrome' 
  | 'paper' 
  | 'pixel' 
  | 'editorial'
  | 'warmest'
  | 'romantic'
  | 'intimate';

export interface MediaReference {
  assetId: string;
  type: 'image' | 'audio' | 'voice' | 'video';
  mime: string;
  size: number;
  path: string;
  sha256: string;
  width?: number;
  height?: number;
  duration?: number;
  caption?: string;
  role?: 'hero' | 'gallery' | 'polaroid' | 'bgm' | 'voicenote' | 'video_clip';
}

export interface InteractiveCakeConfig {
  flavor?: string;
  candlesCount: number;
  blowoutMethod: 'tap' | 'mic' | 'both';
  blowoutCelebration: 'fireworks' | 'confetti' | 'stars';
  customWishPrompt?: string;
}

export interface EnvelopeConfig {
  sealColor: string;
  waxEmblem: string;
  letterTitle: string;
  letterBody: string;
  signature?: string;
  postmark?: string;
}

export interface GiftBoxConfig {
  boxColor: string;
  ribbonColor: string;
  surpriseHeadline: string;
  surpriseMessage: string;
  stages: Array<{
    title: string;
    description: string;
    icon?: string;
    imageAssetId?: string;
  }>;
}

export interface ScratchCardConfig {
  coverColor: string;
  coverPattern?: string;
  revealHeadline: string;
  revealMessage: string;
  thresholdPercent: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface QuizConfig {
  title: string;
  questions: QuizQuestion[];
  rewardMessage: string;
}

export interface MemoryGameConfig {
  pairsCount: number;
  icons: string[];
  completionMessage: string;
}

export interface ConstellationConfig {
  starName: string;
  connectedShape: 'name' | 'heart' | 'cake' | 'crown';
  revealMessage: string;
}

export interface WishJarConfig {
  wishes: string[];
  themeColor: string;
  maxWishes: number;
}

export interface TimeCapsuleConfig {
  unlockDate: string; // ISO string
  sealedMessage: string;
  revealedMessage: string;
}

export interface InteractionConfiguration {
  hasCake?: boolean;
  cake?: InteractiveCakeConfig;
  hasEnvelope?: boolean;
  envelope?: EnvelopeConfig;
  hasGiftBox?: boolean;
  giftBox?: GiftBoxConfig;
  hasScratchCard?: boolean;
  scratchCard?: ScratchCardConfig;
  hasQuiz?: boolean;
  quiz?: QuizConfig;
  hasMemoryGame?: boolean;
  memoryGame?: MemoryGameConfig;
  hasConstellation?: boolean;
  constellation?: ConstellationConfig;
  hasWishJar?: boolean;
  wishJar?: WishJarConfig;
  hasTimeCapsule?: boolean;
  timeCapsule?: TimeCapsuleConfig;
}

export interface SceneConfiguration {
  id: string;
  order: number;
  type: 'opening' | 'curiosity' | 'reveal' | 'interaction' | 'message' | 'surprise' | 'celebration' | 'finale';
  title?: string;
  subtitle?: string;
  text?: string;
  durationSeconds?: number;
  backgroundStyle?: string;
  interactionType?: string;
  soundCue?: string;
  particles?: 'confetti' | 'stars' | 'hearts' | 'bubbles' | 'dust' | 'none';
}

export interface AudioConfiguration {
  enabled: boolean;
  bgmAssetId?: string;
  bgmPresetTrack?: string;
  voiceAssetId?: string;
  allowMute: boolean;
  autoPlayAllowed: boolean;
}

export interface ReleaseConfiguration {
  releaseAt?: string; // ISO string
  timezone: string; // IANA timezone e.g. "Asia/Kolkata", "America/New_York"
  isAuthoritative: boolean;
  countdownMessage?: string;
  earlyVisitorMessage?: string;
}

export interface PrivacyConfiguration {
  visibility: 'public' | 'unlisted' | 'password_protected';
  passwordHash?: string; // SHA-256 or bcrypt hash
  allowSearchIndexing: boolean;
}

export interface SeoConfiguration {
  title: string;
  description: string;
  ogImage?: string;
}

/**
 * The Canonical Durable Record stored encrypted on GitHub:
 * experiences/<shard>/<publicId>.json.enc
 */
export interface CanonicalExperienceRecord {
  schemaVersion: string; // "1.0.0"
  publicId: string;
  publicSlug: string;
  ownerId: string;
  managementTokenHash: string; // SHA-256 of management token
  status: ExperienceStatus;
  templateId: string;
  templateVersion: string;
  
  // Personalization attributes
  birthdayName: string;
  nickname?: string;
  creatorName: string;
  relationship: RelationshipType;
  birthdayDate: string; // YYYY-MM-DD
  timezone: string;
  age?: number;
  personality: string[];
  bond: string;
  tone: string;
  mood: MoodType;
  experienceMode: ExperienceMode;
  
  // Core narrative content
  oneLiner?: string;
  coreMessage: string;
  funnyDetails?: string;
  memories?: string[];
  finalWish: string;
  
  // Configurations
  sceneConfiguration: SceneConfiguration[];
  interactionConfiguration: InteractionConfiguration;
  mediaReferences: MediaReference[];
  audioConfiguration: AudioConfiguration;
  releaseConfiguration: ReleaseConfiguration;
  privacyConfiguration: PrivacyConfiguration;
  seoConfiguration: SeoConfiguration;
  
  // Timestamps & Audit
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  contentHash?: string;
}

/**
 * Sanitized representation returned to the public recipient (/b/[id]).
 * Strips ownerId, managementTokenHash, private notes, and internal records.
 */
export interface PublicPresentationData {
  schemaVersion: string;
  publicId: string;
  publicSlug: string;
  status: ExperienceStatus;
  templateId: string;
  templateVersion: string;
  
  birthdayName: string;
  nickname?: string;
  creatorName: string;
  relationship: RelationshipType;
  birthdayDate: string;
  timezone: string;
  age?: number;
  mood: MoodType;
  experienceMode: ExperienceMode;
  
  coreMessage: string;
  funnyDetails?: string;
  memories?: string[];
  finalWish: string;
  
  sceneConfiguration: SceneConfiguration[];
  interactionConfiguration: InteractionConfiguration;
  mediaReferences: MediaReference[];
  audioConfiguration: AudioConfiguration;
  releaseConfiguration: ReleaseConfiguration;
  isPasswordProtected: boolean;
  seoConfiguration: SeoConfiguration;
  
  publishedAt?: string;
}

/**
 * Encrypted payload wrapper format
 */
export interface EncryptedPayload {
  encryptionVersion: number;
  algorithm: 'aes-256-gcm';
  iv: string; // hex
  authTag: string; // hex
  ciphertext: string; // hex
  contentHash: string; // sha256 hex
}

/**
 * Owner index summary stored at:
 * owners/<shard>/<owner-id>/index.json.enc
 */
export interface OwnerExperienceSummary {
  publicId: string;
  publicSlug: string;
  birthdayName: string;
  templateId: string;
  status: ExperienceStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface OwnerIndexRecord {
  schemaVersion: string;
  ownerId: string;
  experiences: OwnerExperienceSummary[];
  updatedAt: string;
}

/**
 * Tombstone record stored at:
 * tombstones/<publicId>.json
 */
export interface TombstoneRecord {
  publicId: string;
  deletedAt: string;
  reason: string;
  deletedByOwnerId: string;
}

/**
 * Report record stored at:
 * reports/<reportId>.json
 */
export interface ReportRecord {
  reportId: string;
  publicId: string;
  reason: string;
  details?: string;
  createdAt: string;
  clientIpHash?: string;
}
