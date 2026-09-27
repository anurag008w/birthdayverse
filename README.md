# BirthdayVerse 🎂✨

> **Make their birthday unforgettable.**  
> Create a personalized interactive birthday experience and send it as one beautiful link.  
> *Tell us about someone you care about, and BirthdayVerse turns those words into a little world made just for them.*

---

## 1. Product Overview

BirthdayVerse is a full-stack, production-grade web application designed to craft interactive, deeply personalized digital birthday experiences. Unlike static landing pages or generic greeting cards, BirthdayVerse generates bespoke digital universes featuring blowable birthday candles (via tap or microphone detection), wax-sealed letters that crack open, 3D unboxing gift boxes, holographic scratch-to-reveal cards, starlight name constellations, and playful trivia quizzes.

Even with **zero photos or videos**, BirthdayVerse experiences look editorial and premium through kinetic typography, generative SVG starfields, interactive paper pop-ups, and particle physics.

---

## 2. Architecture & Design Principles

```
┌────────────────────────────────────────────────────────┐
│                   Recipient Browser                    │
│   /b/[publicId] — Pure presentation (No Editor/Debug)   │
└───────────────────────────▲────────────────────────────┘
                            │ HTTPS / GET
┌───────────────────────────┴────────────────────────────┐
│              Next.js / Node.js Server Layer             │
│        (Render Web Service: 0.0.0.0:$PORT)             │
│  - Fail-Closed Persistence Preflight                   │
│  - AES-256-GCM Decryption & Sanitization                │
│  - Media Streaming Proxy (/media/*)                    │
│  - Health Check Endpoint (/health)                     │
└───────────────────────────▲────────────────────────────┘
                            │ Git Data API (Blobs, Trees, Commits, Refs)
                            │ Optimistic Concurrency (409 Conflict Retry)
┌───────────────────────────▼────────────────────────────┐
│            ONE Dedicated GitHub Repository             │
│            (e.g., anurag008w/birthdayverse-data)       │
│                                                        │
│  - Canonical Source of Truth for Durable Data          │
│  - Encrypted JSON records at rest                      │
│  - Durable Git commit audit history                    │
│  - ZERO external database required                     │
└────────────────────────────────────────────────────────┘
```

### Core Architectural Guarantees:
1. **The Single Canonical Data Store**: ONE dedicated private GitHub repository is the canonical source of truth for all durable application data. No PostgreSQL, MongoDB, Supabase, Firebase, SQLite, or local filesystems are used for primary persistence.
2. **Fail-Closed Persistence**: If GitHub credentials, repository access, branch existence, or encryption keys are missing or invalid, **production builds and deployments strictly fail**. The application refuses to silently degrade to ephemeral memory or browser LocalStorage.
3. **Data Boundary Isolation**: Public endpoints decrypt canonical records server-side and strip creator metadata (`ownerId`, `managementTokenHash`, private notes, draft states) before serving presentation data.
4. **Secret Hygiene**: GitHub tokens, encryption keys, and session secrets are strictly server-only and never exposed to client bundles or browser storage.

---

## 3. GitHub Persistence Architecture & Repository Layout

All mutations go through the centralized GitHub Persistence Client (`src/lib/github-data/client.ts`), utilizing GitHub's official REST and Git Data APIs.

### The Git Database Workflow:
Multi-file mutations (such as creating or publishing an experience) follow GitHub's documented blob $\rightarrow$ tree $\rightarrow$ commit $\rightarrow$ fast-forward ref flow:
1. Fetch the current HEAD commit SHA of the configured branch (`GET /git/ref/heads/<branch>`).
2. Read the base tree SHA of that commit (`GET /git/commits/<sha>`).
3. Create blobs for modified/new files (`POST /git/blobs`).
4. Construct a new tree linked to the base tree (`POST /git/trees`).
5. Create a new commit with the current HEAD as parent (`POST /git/commits`).
6. Update the branch reference with `force: false` (`PATCH /git/refs/heads/<branch>`).

### Concurrency & Optimistic Locking:
If another write occurs simultaneously, GitHub returns `409 Conflict`. BirthdayVerse catches the conflict, re-reads the new HEAD, reloads affected state, and retries the commit with exponential backoff and jitter (up to 4 attempts).

### Data Repository Layout:
```
birthdayverse-data/
├── .github/
├── _meta/
│   ├── schema.json          # schemaVersion, minAppVersion, description
│   ├── version.json         # Data repository format version
│   ├── health.json          # Heartbeat initialization marker
│   └── counters.json        # Global non-sequential counters
├── experiences/
│   ├── 00/ ... ff/          # Sharded by 2-character hex hash of publicId
│   │   └── <publicId>.json.enc # Encrypted canonical experience record
├── owners/
│   ├── 00/ ... ff/          # Sharded by ownerId hash
│   │   └── <ownerId>/
│   │       └── index.json.enc  # Encrypted index of creator's experiences
├── media/
│   ├── images/<assetId>.<ext>
│   ├── audio/<assetId>.<ext>
│   ├── voice/<assetId>.<ext>
│   └── video/<assetId>.<ext>
├── analytics/
│   └── daily/YYYY/MM/DD/<shard>.json.enc  # Batched analytics summaries
├── schedules/
│   └── <scheduleId>.json.enc             # Scheduled unlock dates
├── reports/
│   └── <reportId>.json                   # Public abuse reports
└── tombstones/
    └── <publicId>.json                   # Soft deletion audit records
```

---

## 4. Encryption at Rest (AES-256-GCM)

All user-generated application state is encrypted server-side before being written to GitHub.

- **Algorithm**: `aes-256-gcm` (Authenticated Encryption with Associated Data).
- **Key**: `DATA_ENCRYPTION_KEY` (32 bytes / 256 bits).
- **IV**: Fresh, cryptographically secure 12-byte (96-bit) IV generated per encryption via `crypto.randomBytes(12)`. IVs are never reused.
- **Payload Format**:
  ```json
  {
    "encryptionVersion": 1,
    "algorithm": "aes-256-gcm",
    "iv": "3f8a... (hex)",
    "authTag": "c2b1... (hex)",
    "ciphertext": "8e9d... (hex)",
    "contentHash": "5a2f... (sha256 hex)"
  }
  ```
- **Integrity**: Decryption verifies the GCM authentication tag and recalculates the SHA-256 `contentHash`. Any tampering causes immediate fail-safe rejection.

---

## 5. Environment Variables & Secret Configuration

Create a `.env` file locally or configure these in the **Render Dashboard Environment Settings**:

| Variable | Required | Description | Example |
| :--- | :---: | :--- | :--- |
| `GITHUB_DATA_REPO` | **Yes** | Dedicated GitHub data repository (`owner/repo`) | `anurag008w/birthdayverse-data` |
| `GITHUB_DATA_BRANCH` | **Yes** | Git branch for persistence | `main` |
| `GITHUB_DATA_TOKEN` | **Yes** | Fine-grained token with `Contents: write` permission | `github_pat_...` |
| `DATA_ENCRYPTION_KEY` | **Yes** | 64-char hex key (32 bytes) for AES-256-GCM | `0123456789abcdef...` |
| `SESSION_SECRET` | **Yes** | Secret for signing HTTP-only creator cookies | `min_32_chars_random_string...` |
| `MANAGEMENT_TOKEN_SECRET` | **Yes** | Secret for deriving management credentials | `min_32_chars_random_string...` |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Canonical public URL of the application | `https://birthdayverse.onrender.com` |
| `GITHUB_API_URL` | No | GitHub API base URL (default: `https://api.github.com`) | `https://api.github.com` |
| `GITHUB_API_VERSION` | No | GitHub API version header (default: `2022-11-28`) | `2022-11-28` |
| `GITHUB_COMMITTER_NAME` | No | Git committer name (default: `BirthdayVerse`) | `BirthdayVerse` |
| `GITHUB_COMMITTER_EMAIL` | No | Git committer email | `bot@birthdayverse.internal` |
| `AI_API_KEY` | No | Optional OpenAI / LLM API key for writing assist | `sk-...` |
| `AI_BASE_URL` | No | Optional LLM base endpoint | `https://api.openai.com/v1` |
| `AI_MODEL` | No | Optional LLM model identifier | `gpt-4o-mini` |
| `MOCK_GITHUB` | No | Set `true` for local isolated test suites | `false` |

> [!CAUTION]
> NEVER prefix `GITHUB_DATA_TOKEN`, `DATA_ENCRYPTION_KEY`, `SESSION_SECRET`, or `MANAGEMENT_TOKEN_SECRET` with `NEXT_PUBLIC_`. Build-time secret scanners will fail the build if any secret is exposed.

---

## 6. GitHub Setup & Token Configuration Guide

### Step 1: Create the Dedicated Private Data Repository
1. Log in to GitHub and navigate to [New Repository](https://github.com/new).
2. Set the repository name (e.g. `birthdayverse-data`).
3. Set visibility to **Private**.
4. Check **Add a README file** so the default branch (`main`) is initialized.
5. Click **Create repository**.

### Step 2: Generate a Fine-Grained Personal Access Token (PAT)
1. Go to **GitHub Settings** $\rightarrow$ **Developer settings** $\rightarrow$ **Personal access tokens** $\rightarrow$ **Fine-grained tokens**.
2. Click **Generate new token**.
3. **Token name**: `BirthdayVerse Persistence Token`.
4. **Repository access**: Select **Only select repositories** $\rightarrow$ choose your data repository (`birthdayverse-data`).
5. **Permissions**:
   - Under **Repository permissions**, find **Contents**.
   - Set access to: **Read and write**.
6. Click **Generate token** and copy the token value securely.

---

## 7. Render Deployment Setup

BirthdayVerse includes a complete `render.yaml` specification configured for zero-downtime, fail-closed deployments.

### Render Blueprint Configuration:
1. In the **Render Dashboard**, click **New +** $\rightarrow$ **Blueprint**.
2. Connect your BirthdayVerse code repository.
3. Render detects `render.yaml` and provisions the Web Service:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run preflight && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/health`
4. In the service **Environment** tab, populate the required secret variables:
   - `GITHUB_DATA_REPO`
   - `GITHUB_DATA_TOKEN`
   - `DATA_ENCRYPTION_KEY`
   - `SESSION_SECRET`
   - `MANAGEMENT_TOKEN_SECRET`
   - `NEXT_PUBLIC_APP_URL`
5. Click **Deploy**.

> [!IMPORTANT]
> The preflight script (`scripts/preflight.mjs`) executes automatically during the Render build phase. If any persistence variable is missing or the GitHub token cannot authenticate and write to the repository, **the build immediately fails**, preventing broken deployments from going live.

---

## 8. Operational Commands & Maintenance Scripts

```bash
# Initialize data repository schema and metadata
npm run data:init

# Run persistence integrity check (audits schema, orphans, and references)
npm run data:check

# Safe data repair (dry-run by default)
npm run data:repair

# Execute data repair
npm run data:repair -- --execute

# Run versioned schema migrations
npm run data:migrate

# Scan built assets for accidental secret leaks
npm run scan:secrets
```

---

## 9. Local Development & Testing

```bash
# Install dependencies
npm install

# Run unit and persistence test suite (with mock GitHub adapter)
MOCK_GITHUB=true npm test

# Run TypeScript typecheck
npm run typecheck

# Build client and compile CSS
npm run build

# Start local server on http://localhost:3000
npm run start
```

---

## 10. Security & Privacy Model

1. **Fail-Closed by Design**: No silent fallback to local storage or demo JSON when GitHub is unreachable.
2. **Zero Plaintext Secrets**: Management tokens are hashed with SHA-256 before storage; recipients authenticate passwords hashed with PBKDF2; user data is encrypted with AES-256-GCM.
3. **HTTP-Only Cookies**: Creator session identifiers are transmitted exclusively via `SameSite=Strict; HttpOnly; Secure` cookies.
4. **Security Headers**: Strict Content-Security-Policy (CSP), `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and strict Referrer Policies are enforced on every response.
5. **No Personal Data Harvesting**: Analytics events are buffered, aggregated, and stripped of raw IP addresses and browser fingerprints before being committed to GitHub.

---

## 11. Disaster Recovery & Restores

Because all durable application state lives directly in the dedicated GitHub repository:
- **Service Disappearance**: If the Render service is deleted or recreated, simply redeploy the code repository with the same environment variables. The application immediately resumes reading all existing birthday experiences.
- **Repository Backup**: To back up the entire dataset, simply clone the GitHub data repository:
  ```bash
  git clone https://github.com/your-org/birthdayverse-data.git backup-birthdayverse-data
  ```
- **Audit History**: Every mutation creates a descriptive Git commit (`BirthdayVerse: publish experience a7f92k3x`), providing a complete, immutable audit trail.
