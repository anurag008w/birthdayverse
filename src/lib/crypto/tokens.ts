import crypto from 'node:crypto';

// Character alphabet for clean, URL-safe, human-friendly, unpredictable public IDs
const ID_ALPHABET = '23456789abcdefghjkmnpqrstuvwxyz'; // 31 chars, avoids 0/O, 1/I/l

/**
 * Generates a cryptographically random, unpredictable public ID.
 * Example: "a7f92k3x9d"
 */
export function generatePublicId(length = 10): string {
  const bytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  }
  return result;
}

/**
 * Generates an owner identifier for creator sessions.
 * Example: "own_7f9b8c2d1e0a4f5b"
 */
export function generateOwnerId(): string {
  return 'own_' + crypto.randomBytes(12).toString('hex');
}

/**
 * Generates a cryptographically secure management secret token.
 * This is given once to the creator and stored in their secure session cookie.
 */
export function generateManagementToken(): string {
  return 'mgmt_' + crypto.randomBytes(24).toString('hex');
}

/**
 * Computes SHA-256 hash of a management token for durable storage.
 * The plaintext token is NEVER stored in the repository.
 */
export function hashManagementToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

/**
 * Verifies a provided plaintext management token against the stored hash.
 * Uses timingSafeEqual to protect against timing attacks.
 */
export function verifyManagementToken(providedToken: string, storedHash: string): boolean {
  if (!providedToken || !storedHash) return false;
  const computedHash = hashManagementToken(providedToken);
  const a = Buffer.from(computedHash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Hashes a recipient password for password-protected experiences.
 */
export function hashExperiencePassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
  return `${salt}:${derived}`;
}

/**
 * Verifies a recipient password against the stored salt:hash format.
 */
export function verifyExperiencePassword(password: string, storedRecord?: string): boolean {
  if (!password || !storedRecord) return false;
  const parts = storedRecord.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHash] = parts;
  const derived = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha256').toString('hex');
  const a = Buffer.from(derived, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Creates a clean public slug from a name and publicId.
 * Example: "shanti-a7f92k3x"
 */
export function createPublicSlug(name: string, publicId: string): string {
  const sanitizedName = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30) || 'birthday';
  return `${sanitizedName}-${publicId.slice(0, 6)}`;
}

/**
 * Shards public ID into a 2-character hex directory (00 through ff).
 * Derived deterministically from SHA-256 of publicId.
 */
export function getExperienceShard(publicId: string): string {
  const hash = crypto.createHash('sha256').update(publicId.toLowerCase().trim()).digest('hex');
  return hash.slice(0, 2);
}

/**
 * Shards owner ID into a 2-character directory.
 */
export function getOwnerShard(ownerId: string): string {
  const hash = crypto.createHash('sha256').update(ownerId.toLowerCase().trim()).digest('hex');
  return hash.slice(0, 2);
}
