/**
 * BirthdayVerse - GitHub Persistence Engine
 * Single Canonical Source of Truth for Durable Application Data.
 */

import { encryptData, decryptData } from '../crypto/aes.ts';
import {
  hashManagementToken,
  verifyManagementToken,
  getExperienceShard,
  getOwnerShard,
  generatePublicId,
  createPublicSlug,
  generateManagementToken
} from '../crypto/tokens.ts';
import type {
  CanonicalExperienceRecord,
  PublicPresentationData,
  OwnerIndexRecord,
  OwnerExperienceSummary,
  TombstoneRecord,
  ReportRecord,
  EncryptedPayload,
  MediaReference
} from '../../types/schema.ts';

export interface GitHubConfig {
  repo: string; // "owner/repo"
  branch: string; // "main"
  token: string;
  apiUrl?: string; // "https://api.github.com"
  apiVersion?: string; // "2022-11-28"
  committerName?: string;
  committerEmail?: string;
  mockMode?: boolean; // Set true for isolated automated tests
}

export interface TreeItem {
  path: string;
  mode: '100644';
  type: 'blob';
  content?: string;
  sha?: string;
}

export class GitHubPersistenceError extends Error {
  code: string;
  statusCode?: number;
  originalError?: any;

  constructor(
    code: string,
    message: string,
    statusCode?: number,
    originalError?: any
  ) {
    super(message);
    this.name = 'GitHubPersistenceError';
    this.code = code;
    this.statusCode = statusCode;
    this.originalError = originalError;
  }
}

export class GitHubDataClient {
  private config: GitHubConfig;
  private idempotencyStore = new Map<string, any>();
  private inMemoryMockStorage = new Map<string, { content: string; encoding: 'utf-8' | 'base64'; sha: string }>();
  private mockCommitSha = 'mock_head_commit_sha_' + Date.now();
  private analyticsBuffer: any[] = [];
  private flushTimer: any = null;

  constructor(customConfig?: Partial<GitHubConfig>) {
    const isMock = customConfig?.mockMode || process.env.MOCK_GITHUB === 'true';
    this.config = {
      repo: customConfig?.repo || process.env.GITHUB_DATA_REPO || '',
      branch: customConfig?.branch || process.env.GITHUB_DATA_BRANCH || 'main',
      token: customConfig?.token || process.env.GITHUB_DATA_TOKEN || '',
      apiUrl: customConfig?.apiUrl || process.env.GITHUB_API_URL || 'https://api.github.com',
      apiVersion: customConfig?.apiVersion || process.env.GITHUB_API_VERSION || '2022-11-28',
      committerName: customConfig?.committerName || process.env.GITHUB_COMMITTER_NAME || 'BirthdayVerse',
      committerEmail: customConfig?.committerEmail || process.env.GITHUB_COMMITTER_EMAIL || 'bot@birthdayverse.internal',
      mockMode: isMock
    };

    // If mock mode is initialized, seed default meta files
    if (this.config.mockMode) {
      this.seedMockStorage();
    }
  }

  private seedMockStorage() {
    this.mockSetFile('_meta/schema.json', JSON.stringify({
      schemaVersion: '1.0.0',
      minAppVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      description: 'BirthdayVerse Canonical Persistence Schema'
    }));
    this.mockSetFile('_meta/health.json', JSON.stringify({
      status: 'ok',
      initializedAt: new Date().toISOString()
    }));
  }

  private mockSetFile(path: string, content: string, encoding: 'utf-8' | 'base64' = 'utf-8') {
    const sha = 'sha_' + Math.random().toString(36).slice(2);
    this.inMemoryMockStorage.set(path, { content, encoding, sha });
  }

  public isMock(): boolean {
    return !!this.config.mockMode;
  }

  /**
   * Helper to perform authenticated GitHub API requests with rate-limit and error handling
   */
  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (this.config.mockMode) {
      return this.handleMockRequest(endpoint, options);
    }

    if (!this.config.token || !this.config.repo) {
      throw new GitHubPersistenceError(
        'UNCONFIGURED_PERSISTENCE',
        'GitHub persistence is unconfigured. GITHUB_DATA_REPO and GITHUB_DATA_TOKEN are required.',
        500
      );
    }

    const url = endpoint.startsWith('http') ? endpoint : `${this.config.apiUrl}/repos/${this.config.repo}${endpoint}`;
    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${this.config.token}`,
      'X-GitHub-Api-Version': this.config.apiVersion || '2022-11-28',
      'User-Agent': 'BirthdayVerse-App/1.0',
      ...(options.headers as Record<string, string> || {})
    };

    let attempts = 0;
    const maxRetries = 3;

    while (attempts < maxRetries) {
      attempts++;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15-second timeout

        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        // Check rate limiting headers
        const rateLimitRemaining = response.headers.get('x-ratelimit-remaining');
        if (rateLimitRemaining && parseInt(rateLimitRemaining, 10) === 0) {
          const resetTime = response.headers.get('x-ratelimit-reset');
          const delaySec = resetTime ? Math.max(1, parseInt(resetTime, 10) - Math.floor(Date.now() / 1000)) : 60;
          throw new GitHubPersistenceError('DATA_RATE_LIMITED', `GitHub rate limit exceeded. Retry in ${delaySec}s`, 429);
        }

        if (response.status === 404) {
          return null;
        }

        if (response.status === 409) {
          throw new GitHubPersistenceError('DATA_CONFLICT', 'Git reference concurrency conflict.', 409);
        }

        if (response.status === 401) {
          throw new GitHubPersistenceError('UNAUTHORIZED_GITHUB_ACCESS', 'Invalid or expired GitHub token.', 401);
        }

        if (response.status === 403) {
          throw new GitHubPersistenceError('GITHUB_FORBIDDEN', 'Insufficient permissions for GitHub data repository.', 403);
        }

        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status >= 500 && attempts < maxRetries) {
            // Transient 5xx retry with backoff
            await new Promise(r => setTimeout(r, attempts * 500));
            continue;
          }
          throw new GitHubPersistenceError('GITHUB_API_ERROR', `GitHub API error ${response.status}: ${errorBody}`, response.status);
        }

        if (response.status === 204) {
          return true;
        }

        return await response.json();
      } catch (err: any) {
        if (err.name === 'AbortError') {
          if (attempts < maxRetries) {
            await new Promise(r => setTimeout(r, attempts * 500));
            continue;
          }
          throw new GitHubPersistenceError('GITHUB_TIMEOUT', 'GitHub API request timed out.', 504, err);
        }
        if (err instanceof GitHubPersistenceError) {
          throw err;
        }
        if (attempts < maxRetries) {
          await new Promise(r => setTimeout(r, attempts * 500));
          continue;
        }
        throw new GitHubPersistenceError('TRANSIENT_GITHUB_ERROR', err.message || 'Network error reaching GitHub', 500, err);
      }
    }
  }

  /**
   * Internal simulation for unit testing
   */
  private handleMockRequest(endpoint: string, options: RequestInit = {}): any {
    const method = (options.method || 'GET').toUpperCase();

    // Check ref
    if (endpoint.includes('/git/ref/heads/') || endpoint.includes('/git/refs/heads/')) {
      return {
        ref: `refs/heads/${this.config.branch}`,
        object: { sha: this.mockCommitSha }
      };
    }

    // Check commit
    if (endpoint.includes('/git/commits/')) {
      return {
        sha: this.mockCommitSha,
        tree: { sha: 'mock_tree_sha' }
      };
    }

    // Create blobs
    if (endpoint.includes('/git/blobs') && method === 'POST') {
      return { sha: 'blob_sha_' + Math.random().toString(36).slice(2) };
    }

    // Create tree
    if (endpoint.includes('/git/trees') && method === 'POST') {
      const body = JSON.parse(options.body as string);
      for (const item of (body.tree || [])) {
        if (item.content) {
          this.mockSetFile(item.path, item.content);
        }
      }
      return { sha: 'new_tree_sha_' + Math.random().toString(36).slice(2) };
    }

    // Create commit
    if (endpoint.includes('/git/commits') && method === 'POST') {
      this.mockCommitSha = 'commit_sha_' + Math.random().toString(36).slice(2);
      return { sha: this.mockCommitSha };
    }

    // Update ref
    if (endpoint.includes('/git/refs/heads/') && method === 'PATCH') {
      return { object: { sha: this.mockCommitSha } };
    }

    // Contents API
    if (endpoint.includes('/contents/')) {
      const filePath = endpoint.split('/contents/')[1]?.split('?')[0];
      const found = this.inMemoryMockStorage.get(filePath);
      if (!found) return null;
      return {
        path: filePath,
        content: found.encoding === 'base64' ? found.content : Buffer.from(found.content).toString('base64'),
        encoding: 'base64',
        sha: found.sha
      };
    }

    return { status: 'ok' };
  }

  /**
   * Reads raw file content from GitHub repository (Contents API)
   */
  public async readFile(path: string): Promise<string | null> {
    if (this.config.mockMode) {
      const found = this.inMemoryMockStorage.get(path);
      return found ? found.content : null;
    }

    const data = await this.request(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${this.config.branch}`);
    if (!data || !data.content) return null;

    if (data.encoding === 'base64') {
      return Buffer.from(data.content, 'base64').toString('utf8');
    }
    return data.content;
  }

  /**
   * Reads raw binary file content from GitHub repository (returns Buffer)
   */
  public async readBinaryFile(path: string): Promise<Buffer | null> {
    if (this.config.mockMode) {
      const found = this.inMemoryMockStorage.get(path);
      if (!found) return null;
      return Buffer.from(found.content, found.encoding === 'base64' ? 'base64' : 'utf8');
    }

    const data = await this.request(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${this.config.branch}`);
    if (!data || !data.content) return null;

    return Buffer.from(data.content, 'base64');
  }

  /**
   * Atomic multi-file commit using Git Data API (Blobs -> Tree -> Commit -> Fast-Forward Ref).
   * Implements optimistic concurrency with automatic retry on 409 conflict.
   */
  public async commitFiles(
    files: Array<{ path: string; content: string }>,
    commitMessage: string,
    idempotencyKey?: string
  ): Promise<{ commitSha: string }> {
    if (idempotencyKey && this.idempotencyStore.has(idempotencyKey)) {
      return this.idempotencyStore.get(idempotencyKey);
    }

    if (this.config.mockMode) {
      for (const f of files) {
        this.mockSetFile(f.path, f.content);
      }
      this.mockCommitSha = 'mock_commit_' + Date.now();
      const res = { commitSha: this.mockCommitSha };
      if (idempotencyKey) this.idempotencyStore.set(idempotencyKey, res);
      return res;
    }

    let retryCount = 0;
    const maxRetries = 4;

    while (retryCount < maxRetries) {
      try {
        // 1. Read current HEAD ref
        const refData = await this.request(`/git/ref/heads/${this.config.branch}`);
        if (!refData || !refData.object || !refData.object.sha) {
          throw new GitHubPersistenceError('BRANCH_NOT_FOUND', `Configured branch "${this.config.branch}" does not exist in repository.`, 404);
        }
        const currentHeadCommitSha = refData.object.sha;

        // 2. Fetch the current commit to retrieve its base tree SHA
        const commitData = await this.request(`/git/commits/${currentHeadCommitSha}`);
        const baseTreeSha = commitData.tree.sha;

        // 3. Prepare tree items
        const treeItems: TreeItem[] = files.map(f => ({
          path: f.path,
          mode: '100644',
          type: 'blob',
          content: f.content
        }));

        // 4. Create new tree pointing to baseTreeSha
        const newTree = await this.request('/git/trees', {
          method: 'POST',
          body: JSON.stringify({
            base_tree: baseTreeSha,
            tree: treeItems
          })
        });

        // 5. Create new commit with current HEAD as parent
        const newCommit = await this.request('/git/commits', {
          method: 'POST',
          body: JSON.stringify({
            message: commitMessage,
            tree: newTree.sha,
            parents: [currentHeadCommitSha],
            committer: {
              name: this.config.committerName,
              email: this.config.committerEmail,
              date: new Date().toISOString()
            }
          })
        });

        // 6. Update branch reference fast-forward only (force: false)
        await this.request(`/git/refs/heads/${this.config.branch}`, {
          method: 'PATCH',
          body: JSON.stringify({
            sha: newCommit.sha,
            force: false
          })
        });

        const result = { commitSha: newCommit.sha };
        if (idempotencyKey) {
          this.idempotencyStore.set(idempotencyKey, result);
        }
        return result;

      } catch (err: any) {
        if (err.code === 'DATA_CONFLICT' || err.statusCode === 409) {
          retryCount++;
          if (retryCount >= maxRetries) {
            throw new GitHubPersistenceError(
              'CONCURRENCY_CONFLICT_EXHAUSTED',
              'Multiple simultaneous writes occurred. Please retry your save.',
              409
            );
          }
          // Exponential backoff with jitter (50ms - 300ms)
          const delay = Math.pow(2, retryCount) * 50 + Math.random() * 100;
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        throw err;
      }
    }

    throw new GitHubPersistenceError('PERSISTENCE_FAILED', 'Failed to commit changes after concurrency reconciliation.', 500);
  }

  // ==========================================
  // Canonical Experience Operations
  // ==========================================

  /**
   * Retrieves an encrypted canonical experience by publicId, decrypts it, and returns the full record.
   */
  public async getExperience(publicId: string): Promise<CanonicalExperienceRecord | null> {
    const shard = getExperienceShard(publicId);
    const path = `experiences/${shard}/${publicId}.json.enc`;

    const rawEncrypted = await this.readFile(path);
    if (!rawEncrypted) return null;

    try {
      const payload: EncryptedPayload = JSON.parse(rawEncrypted);
      const record = decryptData<CanonicalExperienceRecord>(payload);
      return record;
    } catch (err: any) {
      throw new GitHubPersistenceError(
        'DATA_CORRUPTION',
        `Failed to decrypt or authenticate record for public ID "${publicId}".`,
        500,
        err
      );
    }
  }

  /**
   * Retrieves an experience and returns only the sanitized public presentation data.
   * Ensures ownerId, managementTokenHash, and private fields are NEVER leaked.
   */
  public async getPublicExperience(publicId: string): Promise<PublicPresentationData | null> {
    const record = await this.getExperience(publicId);
    if (!record) return null;

    // Check tombstone or soft-deletion
    if (record.status === 'deleted') {
      return null;
    }

    const publicData: PublicPresentationData = {
      schemaVersion: record.schemaVersion,
      publicId: record.publicId,
      publicSlug: record.publicSlug,
      status: record.status,
      templateId: record.templateId,
      templateVersion: record.templateVersion,
      birthdayName: record.birthdayName,
      nickname: record.nickname,
      creatorName: record.creatorName,
      relationship: record.relationship,
      birthdayDate: record.birthdayDate,
      timezone: record.timezone,
      age: record.age,
      mood: record.mood,
      experienceMode: record.experienceMode,
      coreMessage: record.coreMessage,
      funnyDetails: record.funnyDetails,
      memories: record.memories,
      finalWish: record.finalWish,
      sceneConfiguration: record.sceneConfiguration,
      interactionConfiguration: record.interactionConfiguration,
      mediaReferences: record.mediaReferences || [],
      audioConfiguration: record.audioConfiguration,
      releaseConfiguration: record.releaseConfiguration,
      isPasswordProtected: record.privacyConfiguration?.visibility === 'password_protected',
      seoConfiguration: record.seoConfiguration,
      publishedAt: record.publishedAt
    };

    return publicData;
  }

  /**
   * Creates a new experience, persists encrypted record to GitHub, and updates the owner's index.
   */
  public async createExperience(
    data: Omit<CanonicalExperienceRecord, 'publicId' | 'publicSlug' | 'managementTokenHash' | 'createdAt' | 'updatedAt' | 'schemaVersion'>,
    options?: { idempotencyKey?: string; managementToken?: string }
  ): Promise<{ experience: CanonicalExperienceRecord; managementToken: string }> {
    const publicId = generatePublicId();
    const publicSlug = createPublicSlug(data.birthdayName, publicId);
    const managementToken = options?.managementToken || generateManagementToken();
    const managementTokenHash = hashManagementToken(managementToken);
    const now = new Date().toISOString();

    const record: CanonicalExperienceRecord = {
      ...data,
      schemaVersion: '1.0.0',
      publicId,
      publicSlug,
      managementTokenHash,
      createdAt: now,
      updatedAt: now
    };

    const shard = getExperienceShard(publicId);
    const experiencePath = `experiences/${shard}/${publicId}.json.enc`;
    const encryptedPayload = encryptData(record);

    // Prepare owner index update
    const ownerIndex = await this.getOwnerIndex(record.ownerId) || {
      schemaVersion: '1.0.0',
      ownerId: record.ownerId,
      experiences: [],
      updatedAt: now
    };

    const summary: OwnerExperienceSummary = {
      publicId: record.publicId,
      publicSlug: record.publicSlug,
      birthdayName: record.birthdayName,
      templateId: record.templateId,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      publishedAt: record.publishedAt
    };
    ownerIndex.experiences.unshift(summary);
    ownerIndex.updatedAt = now;

    const ownerShard = getOwnerShard(record.ownerId);
    const ownerIndexPath = `owners/${ownerShard}/${record.ownerId}/index.json.enc`;
    const encryptedOwnerIndex = encryptData(ownerIndex);

    // Atomic commit of both canonical record and owner index
    await this.commitFiles(
      [
        { path: experiencePath, content: JSON.stringify(encryptedPayload, null, 2) },
        { path: ownerIndexPath, content: JSON.stringify(encryptedOwnerIndex, null, 2) }
      ],
      `BirthdayVerse: create experience ${publicId}`,
      options?.idempotencyKey
    );

    return { experience: record, managementToken };
  }

  /**
   * Updates an experience with ownership verification.
   */
  public async updateExperience(
    publicId: string,
    patch: Partial<CanonicalExperienceRecord>,
    managementToken: string,
    idempotencyKey?: string
  ): Promise<CanonicalExperienceRecord> {
    const existing = await this.getExperience(publicId);
    if (!existing) {
      throw new GitHubPersistenceError('EXPERIENCE_NOT_FOUND', `Experience "${publicId}" not found.`, 404);
    }

    if (!verifyManagementToken(managementToken, existing.managementTokenHash)) {
      throw new GitHubPersistenceError('UNAUTHORIZED', 'Invalid management token for this experience.', 403);
    }

    const now = new Date().toISOString();
    const updated: CanonicalExperienceRecord = {
      ...existing,
      ...patch,
      publicId: existing.publicId, // Immutable
      ownerId: existing.ownerId, // Immutable
      managementTokenHash: existing.managementTokenHash, // Immutable
      createdAt: existing.createdAt,
      updatedAt: now
    };

    const shard = getExperienceShard(publicId);
    const experiencePath = `experiences/${shard}/${publicId}.json.enc`;
    const encryptedPayload = encryptData(updated);

    // Update summary in owner index
    const ownerIndex = await this.getOwnerIndex(updated.ownerId);
    const filesToCommit: Array<{ path: string; content: string }> = [
      { path: experiencePath, content: JSON.stringify(encryptedPayload, null, 2) }
    ];

    if (ownerIndex) {
      const idx = ownerIndex.experiences.findIndex(e => e.publicId === publicId);
      if (idx !== -1) {
        ownerIndex.experiences[idx] = {
          ...ownerIndex.experiences[idx],
          birthdayName: updated.birthdayName,
          templateId: updated.templateId,
          status: updated.status,
          updatedAt: now,
          publishedAt: updated.publishedAt
        };
      } else {
        ownerIndex.experiences.unshift({
          publicId: updated.publicId,
          publicSlug: updated.publicSlug,
          birthdayName: updated.birthdayName,
          templateId: updated.templateId,
          status: updated.status,
          createdAt: updated.createdAt,
          updatedAt: now,
          publishedAt: updated.publishedAt
        });
      }
      ownerIndex.updatedAt = now;

      const ownerShard = getOwnerShard(updated.ownerId);
      const ownerIndexPath = `owners/${ownerShard}/${updated.ownerId}/index.json.enc`;
      filesToCommit.push({
        path: ownerIndexPath,
        content: JSON.stringify(encryptData(ownerIndex), null, 2)
      });
    }

    await this.commitFiles(
      filesToCommit,
      `BirthdayVerse: update experience ${publicId}`,
      idempotencyKey
    );

    return updated;
  }

  /**
   * Publishes an experience atomically.
   */
  public async publishExperience(
    publicId: string,
    managementToken: string,
    idempotencyKey?: string
  ): Promise<CanonicalExperienceRecord> {
    const existing = await this.getExperience(publicId);
    if (!existing) {
      throw new GitHubPersistenceError('EXPERIENCE_NOT_FOUND', `Experience "${publicId}" not found.`, 404);
    }

    if (!verifyManagementToken(managementToken, existing.managementTokenHash)) {
      throw new GitHubPersistenceError('UNAUTHORIZED', 'Invalid management token.', 403);
    }

    const now = new Date().toISOString();
    return await this.updateExperience(
      publicId,
      {
        status: 'published',
        publishedAt: existing.publishedAt || now
      },
      managementToken,
      idempotencyKey
    );
  }

  /**
   * Duplicates an experience with a new publicId, clean credentials, and zero analytics.
   */
  public async duplicateExperience(
    publicId: string,
    managementToken: string,
    targetOwnerId?: string
  ): Promise<{ experience: CanonicalExperienceRecord; managementToken: string }> {
    const existing = await this.getExperience(publicId);
    if (!existing) {
      throw new GitHubPersistenceError('EXPERIENCE_NOT_FOUND', `Experience "${publicId}" not found.`, 404);
    }

    if (!verifyManagementToken(managementToken, existing.managementTokenHash)) {
      throw new GitHubPersistenceError('UNAUTHORIZED', 'Invalid management token.', 403);
    }

    const newOwnerId = targetOwnerId || existing.ownerId;
    const copyData = {
      ...existing,
      ownerId: newOwnerId,
      status: 'draft' as const,
      publishedAt: undefined
    };

    return await this.createExperience(copyData);
  }

  /**
   * Deletes an experience safely (soft delete tombstone) without rewriting history.
   */
  public async deleteExperience(
    publicId: string,
    managementToken: string,
    reason = 'Deleted by user'
  ): Promise<boolean> {
    const existing = await this.getExperience(publicId);
    if (!existing) return false;

    if (!verifyManagementToken(managementToken, existing.managementTokenHash)) {
      throw new GitHubPersistenceError('UNAUTHORIZED', 'Invalid management token.', 403);
    }

    const now = new Date().toISOString();
    const updated: CanonicalExperienceRecord = {
      ...existing,
      status: 'deleted',
      updatedAt: now
    };

    const shard = getExperienceShard(publicId);
    const experiencePath = `experiences/${shard}/${publicId}.json.enc`;
    const encryptedPayload = encryptData(updated);

    const tombstone: TombstoneRecord = {
      publicId,
      deletedAt: now,
      reason,
      deletedByOwnerId: existing.ownerId
    };
    const tombstonePath = `tombstones/${publicId}.json`;

    // Remove from owner index
    const ownerIndex = await this.getOwnerIndex(existing.ownerId);
    const filesToCommit: Array<{ path: string; content: string }> = [
      { path: experiencePath, content: JSON.stringify(encryptedPayload, null, 2) },
      { path: tombstonePath, content: JSON.stringify(tombstone, null, 2) }
    ];

    if (ownerIndex) {
      ownerIndex.experiences = ownerIndex.experiences.filter(e => e.publicId !== publicId);
      ownerIndex.updatedAt = now;
      const ownerShard = getOwnerShard(existing.ownerId);
      filesToCommit.push({
        path: `owners/${ownerShard}/${existing.ownerId}/index.json.enc`,
        content: JSON.stringify(encryptData(ownerIndex), null, 2)
      });
    }

    await this.commitFiles(
      filesToCommit,
      `BirthdayVerse: delete experience ${publicId}`
    );

    return true;
  }

  // ==========================================
  // Owner Operations
  // ==========================================

  public async getOwnerIndex(ownerId: string): Promise<OwnerIndexRecord | null> {
    const shard = getOwnerShard(ownerId);
    const path = `owners/${shard}/${ownerId}/index.json.enc`;
    const raw = await this.readFile(path);
    if (!raw) return null;

    try {
      const payload: EncryptedPayload = JSON.parse(raw);
      return decryptData<OwnerIndexRecord>(payload);
    } catch {
      return null;
    }
  }

  // ==========================================
  // Media Storage Operations
  // ==========================================

  public async saveMedia(asset: {
    assetId: string;
    type: 'image' | 'audio' | 'voice' | 'video';
    buffer: Buffer;
    mime: string;
    ext: string;
    role?: 'hero' | 'gallery' | 'polaroid' | 'bgm' | 'voicenote' | 'video_clip';
  }): Promise<MediaReference> {
    // Enforce strict size limits
    const limits: Record<string, number> = {
      image: 10 * 1024 * 1024,
      audio: 15 * 1024 * 1024,
      voice: 10 * 1024 * 1024,
      video: 25 * 1024 * 1024
    };

    if (asset.buffer.length > (limits[asset.type] || 10 * 1024 * 1024)) {
      throw new GitHubPersistenceError(
        'FILE_TOO_LARGE',
        `Asset size ${asset.buffer.length} exceeds max allowed for ${asset.type}.`,
        413
      );
    }

    const crypto = await import('node:crypto');
    const sha256 = crypto.createHash('sha256').update(asset.buffer).digest('hex');
    const path = `media/${asset.type}s/${asset.assetId}.${asset.ext}`;

    if (this.config.mockMode) {
      this.mockSetFile(path, asset.buffer.toString('base64'), 'base64');
    } else {
      // Use Contents API or blob creation for binary asset
      await this.request(`/contents/${path}`, {
        method: 'PUT',
        body: JSON.stringify({
          message: `BirthdayVerse: add media asset ${asset.assetId}`,
          content: asset.buffer.toString('base64'),
          branch: this.config.branch
        })
      });
    }

    return {
      assetId: asset.assetId,
      type: asset.type,
      mime: asset.mime,
      size: asset.buffer.length,
      path,
      sha256,
      role: asset.role
    };
  }

  // ==========================================
  // Analytics & Health Operations
  // ==========================================

  public recordAnalyticsEvent(event: {
    publicId: string;
    eventType: 'opened' | 'started' | 'scene_viewed' | 'interaction_completed' | 'finale_reached' | 'shared';
    sceneId?: string;
  }) {
    this.analyticsBuffer.push({
      ...event,
      timestamp: new Date().toISOString()
    });

    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flushAnalytics().catch(() => {});
        this.flushTimer = null;
      }, 30000); // Batch flush every 30s
    }
  }

  public async flushAnalytics() {
    if (this.analyticsBuffer.length === 0) return;
    const events = [...this.analyticsBuffer];
    this.analyticsBuffer = [];

    const now = new Date();
    const YYYY = now.getUTCFullYear();
    const MM = String(now.getUTCMonth() + 1).padStart(2, '0');
    const DD = String(now.getUTCDate()).padStart(2, '0');
    const shard = Math.floor(Math.random() * 16).toString(16);
    const path = `analytics/daily/${YYYY}/${MM}/${DD}/${shard}.json.enc`;

    try {
      const encrypted = encryptData(events);
      await this.commitFiles(
        [{ path, content: JSON.stringify(encrypted) }],
        `BirthdayVerse: log analytics batch ${YYYY}-${MM}-${DD}`
      );
    } catch {
      // Analytics persistence failure must never break user experience
    }
  }

  public async createReport(report: Omit<ReportRecord, 'reportId' | 'createdAt'>): Promise<string> {
    const reportId = 'rep_' + Math.random().toString(36).slice(2, 10);
    const record: ReportRecord = {
      ...report,
      reportId,
      createdAt: new Date().toISOString()
    };
    const path = `reports/${reportId}.json`;
    await this.commitFiles(
      [{ path, content: JSON.stringify(record, null, 2) }],
      `BirthdayVerse: add report ${reportId}`
    );
    return reportId;
  }

  public async getHealth(): Promise<{ status: string; service: string; persistence: string }> {
    if (this.config.mockMode) {
      return { status: 'ok', service: 'birthdayverse', persistence: 'mock-ok' };
    }

    try {
      const repoData = await this.request('');
      if (repoData && repoData.id) {
        return { status: 'ok', service: 'birthdayverse', persistence: 'ok' };
      }
      return { status: 'degraded', service: 'birthdayverse', persistence: 'unreachable' };
    } catch {
      return { status: 'degraded', service: 'birthdayverse', persistence: 'error' };
    }
  }
}
