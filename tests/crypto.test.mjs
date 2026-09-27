import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { encryptData, decryptData, getEncryptionKeyBuffer } from '../src/lib/crypto/aes.ts';
import {
  generatePublicId,
  createPublicSlug,
  generateManagementToken,
  hashManagementToken,
  verifyManagementToken,
  hashExperiencePassword,
  verifyExperiencePassword,
  getExperienceShard
} from '../src/lib/crypto/tokens.ts';

const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('AES-256-GCM Cryptography Layer', () => {
  test('successfully encrypts and decrypts string data with integrity verification', () => {
    const message = 'Happy 25th Birthday, Maya! You are incredible.';
    const encrypted = encryptData(message, TEST_KEY);

    assert.equal(encrypted.algorithm, 'aes-256-gcm');
    assert.equal(encrypted.encryptionVersion, 1);
    assert.ok(encrypted.iv.length === 24, 'IV must be 12 bytes (24 hex characters)');
    assert.ok(encrypted.authTag.length === 32, 'Auth tag must be 16 bytes (32 hex characters)');
    assert.ok(encrypted.contentHash, 'Content hash must be present');

    const decrypted = decryptData(encrypted, TEST_KEY);
    assert.equal(decrypted, message);
  });

  test('encrypts and decrypts structured JSON objects', () => {
    const payload = {
      birthdayName: 'Aarav',
      age: 30,
      wishes: ['Joy', 'Health', 'Adventures'],
      metadata: { privateNote: 'Secret surprise planned' }
    };

    const encrypted = encryptData(payload, TEST_KEY);
    const decrypted = decryptData(encrypted, TEST_KEY);
    assert.deepEqual(decrypted, payload);
  });

  test('never reuses IV across multiple encryptions of the same payload', () => {
    const text = 'Same message repeated';
    const enc1 = encryptData(text, TEST_KEY);
    const enc2 = encryptData(text, TEST_KEY);

    assert.notEqual(enc1.iv, enc2.iv, 'Each encryption MUST produce a fresh unique IV');
    assert.notEqual(enc1.ciphertext, enc2.ciphertext, 'Ciphertext must differ due to unique IV');
  });

  test('fails safely when ciphertext or auth tag has been tampered with', () => {
    const encrypted = encryptData('Authentic data', TEST_KEY);
    
    // Tamper with ciphertext
    const tampered = {
      ...encrypted,
      ciphertext: '00' + encrypted.ciphertext.slice(2)
    };

    assert.throws(() => {
      decryptData(tampered, TEST_KEY);
    }, /PERSISTENCE_CRYPTO_ERROR/);
  });

  test('fails safely with wrong encryption key', () => {
    const wrongKey = 'fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210';
    const encrypted = encryptData('Secret data', TEST_KEY);

    assert.throws(() => {
      decryptData(encrypted, wrongKey);
    }, /PERSISTENCE_CRYPTO_ERROR/);
  });
});

describe('Token Generation, Hashing & Verification', () => {
  test('generates unpredictable public IDs', () => {
    const id1 = generatePublicId();
    const id2 = generatePublicId();

    assert.equal(id1.length, 10);
    assert.equal(id2.length, 10);
    assert.notEqual(id1, id2);
    assert.match(id1, /^[23456789abcdefghjkmnpqrstuvwxyz]+$/);
  });

  test('creates clean human-friendly public slugs', () => {
    const slug = createPublicSlug('Shanti Sharma!', 'a7f92k3x9d');
    assert.equal(slug, 'shanti-sharma-a7f92k');
  });

  test('hashes management token using SHA-256 and verifies securely', () => {
    const rawToken = generateManagementToken();
    const hash = hashManagementToken(rawToken);

    assert.ok(hash.length === 64, 'SHA-256 hash must be 64 hex characters');
    assert.ok(verifyManagementToken(rawToken, hash), 'Plaintext token must match stored hash');
    assert.ok(!verifyManagementToken('wrong_token', hash), 'Invalid token must be rejected');
  });

  test('hashes and verifies optional experience passwords', () => {
    const pass = 'SecretParty2026';
    const hash = hashExperiencePassword(pass);

    assert.ok(verifyExperiencePassword(pass, hash));
    assert.ok(!verifyExperiencePassword('WrongPassword', hash));
  });

  test('deterministically shards public IDs into 2-char hex', () => {
    const shard1 = getExperienceShard('a7f92k3x9d');
    const shard2 = getExperienceShard('a7f92k3x9d');
    assert.equal(shard1, shard2);
    assert.match(shard1, /^[0-9a-f]{2}$/);
  });
});
