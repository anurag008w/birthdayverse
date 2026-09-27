import crypto from 'node:crypto';
import type { EncryptedPayload } from '../../types/schema.ts';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH_BYTES = 16; // 128 bits
const CURRENT_ENCRYPTION_VERSION = 1;

/**
 * Normalizes and validates a 32-byte (256-bit) encryption key.
 * Accepts 64-char hex string or 32-byte base64/raw key.
 */
export function getEncryptionKeyBuffer(rawKey?: string): Buffer {
  const keyStr = rawKey || process.env.DATA_ENCRYPTION_KEY;
  if (!keyStr) {
    throw new Error('PERSISTENCE_CRYPTO_ERROR: DATA_ENCRYPTION_KEY environment variable is not defined.');
  }

  const cleanKey = keyStr.trim();
  let keyBuf: Buffer;

  if (/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    keyBuf = Buffer.from(cleanKey, 'hex');
  } else if (/^[A-Za-z0-9+/]{43}=*$/.test(cleanKey)) {
    keyBuf = Buffer.from(cleanKey, 'base64');
  } else {
    // UTF-8 string hashed to 256 bits or direct buffer
    if (Buffer.byteLength(cleanKey) === 32) {
      keyBuf = Buffer.from(cleanKey);
    } else {
      // Deterministic SHA-256 derivation if formatted as passphrase
      keyBuf = crypto.createHash('sha256').update(cleanKey).digest();
    }
  }

  if (keyBuf.length !== 32) {
    throw new Error(`PERSISTENCE_CRYPTO_ERROR: Invalid key length: ${keyBuf.length} bytes (expected 32 bytes / 256 bits).`);
  }

  return keyBuf;
}

/**
 * Encrypts an arbitrary serializable object or string with AES-256-GCM.
 * Generates a fresh random IV per invocation. Never reuses IVs.
 */
export function encryptData<T>(data: T, customKey?: string): EncryptedPayload {
  const key = getEncryptionKeyBuffer(customKey);
  const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
  const plaintextBuf = Buffer.from(plaintext, 'utf8');

  // Compute SHA-256 contentHash of original plaintext for post-decrypt integrity
  const contentHash = crypto.createHash('sha256').update(plaintextBuf).digest('hex');

  // Generate fresh unique 96-bit IV
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });

  const ciphertextBuf = Buffer.concat([
    cipher.update(plaintextBuf),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  return {
    encryptionVersion: CURRENT_ENCRYPTION_VERSION,
    algorithm: ALGORITHM,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    ciphertext: ciphertextBuf.toString('hex'),
    contentHash
  };
}

/**
 * Decrypts an AES-256-GCM EncryptedPayload and parses JSON if requested.
 * Throws a safe error if authTag verification fails or if contentHash is invalid.
 */
export function decryptData<T = any>(payload: EncryptedPayload, customKey?: string): T {
  if (!payload || !payload.ciphertext || !payload.iv || !payload.authTag) {
    throw new Error('PERSISTENCE_CRYPTO_ERROR: Corrupted or missing encrypted payload fields.');
  }

  if (payload.algorithm !== ALGORITHM) {
    throw new Error(`PERSISTENCE_CRYPTO_ERROR: Unsupported algorithm "${payload.algorithm}". Expected "${ALGORITHM}".`);
  }

  const key = getEncryptionKeyBuffer(customKey);
  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const ciphertextBuf = Buffer.from(payload.ciphertext, 'hex');

  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error('PERSISTENCE_CRYPTO_ERROR: Invalid IV length.');
  }
  if (authTag.length !== AUTH_TAG_LENGTH_BYTES) {
    throw new Error('PERSISTENCE_CRYPTO_ERROR: Invalid auth tag length.');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });
  decipher.setAuthTag(authTag);

  let decryptedBuf: Buffer;
  try {
    decryptedBuf = Buffer.concat([
      decipher.update(ciphertextBuf),
      decipher.final()
    ]);
  } catch (err: any) {
    throw new Error('PERSISTENCE_CRYPTO_ERROR: Decryption or authentication failed. Data may have been tampered with or key is incorrect.');
  }

  // Verify content hash integrity if provided
  if (payload.contentHash) {
    const computedHash = crypto.createHash('sha256').update(decryptedBuf).digest('hex');
    if (computedHash !== payload.contentHash) {
      throw new Error('PERSISTENCE_CRYPTO_ERROR: Integrity verification failed. Content hash mismatch.');
    }
  }

  const plaintext = decryptedBuf.toString('utf8');
  try {
    return JSON.parse(plaintext) as T;
  } catch {
    return plaintext as unknown as T;
  }
}
