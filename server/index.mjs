import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { GitHubDataClient, GitHubPersistenceError } from '../src/lib/github-data/client.ts';
import { assistMessage } from '../src/lib/ai/assist.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

// ==========================================
// 1. Startup Verification (Fail-Closed)
// ==========================================
function verifyStartupPersistence() {
  const isMock = process.env.MOCK_GITHUB === 'true';
  if (isMock) {
    console.log('[BirthdayVerse] Running in MOCK_GITHUB persistence mode (test/dev).');
    return;
  }

  const missing = [];
  if (!process.env.GITHUB_DATA_REPO) missing.push('GITHUB_DATA_REPO');
  if (!process.env.GITHUB_DATA_TOKEN) missing.push('GITHUB_DATA_TOKEN');
  if (!process.env.DATA_ENCRYPTION_KEY) missing.push('DATA_ENCRYPTION_KEY');

  if (missing.length > 0) {
    console.error('\n======================================================');
    console.error('FATAL PERSISTENCE STARTUP ERROR');
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('BirthdayVerse requires GitHub-backed encrypted persistence.');
    console.error('Application cannot start without valid persistence configuration.');
    console.error('======================================================\n');
    process.exit(1);
  }
}

verifyStartupPersistence();

const githubClient = new GitHubDataClient();

// In-memory rate limiting map
const rateLimitMap = new Map();
function isRateLimited(key, maxRequests = 60, windowSeconds = 60) {
  const now = Math.floor(Date.now() / 1000);
  const record = rateLimitMap.get(key) || { count: 0, reset: now + windowSeconds };
  if (now > record.reset) {
    record.count = 1;
    record.reset = now + windowSeconds;
    rateLimitMap.set(key, record);
    return false;
  }
  record.count++;
  rateLimitMap.set(key, record);
  return record.count > maxRequests;
}

// Helper to parse JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 10 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

// Session cookie helper
function parseCookies(req) {
  const list = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
}

// ==========================================
// 2. HTTP Server Engine
// ==========================================
const server = http.createServer(async (req, res) => {
  const requestId = crypto.randomBytes(8).toString('hex');
  const startTime = Date.now();
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Apply Security Headers
  res.setHeader('X-Request-Id', requestId);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self)');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; media-src 'self' data: https: blob:; connect-src 'self' https:;"
  );

  // Rate Limiting
  if (pathname.startsWith('/api/') && isRateLimited(clientIp, 120, 60)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Too many requests. Please slow down.' }));
    return;
  }

  // Structured request logger
  const logResponse = (statusCode, errorCode = null) => {
    const duration = Date.now() - startTime;
    console.log(JSON.stringify({
      requestId,
      method: req.method,
      path: pathname,
      status: statusCode,
      durationMs: duration,
      errorCode
    }));
  };

  try {
    // ------------------------------------------
    // API: Health Check (/health)
    // ------------------------------------------
    if (pathname === '/health' && req.method === 'GET') {
      const health = await githubClient.getHealth();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(health));
      logResponse(200);
      return;
    }

    // ------------------------------------------
    // API: Public Experience (/api/b/:id)
    // ------------------------------------------
    if (pathname.startsWith('/api/b/') && req.method === 'GET') {
      const publicId = pathname.replace('/api/b/', '').trim();
      if (!publicId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Invalid public ID.' }));
        logResponse(400);
        return;
      }

      const experience = await githubClient.getPublicExperience(publicId);
      if (!experience) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Birthday experience not found or has been removed.' }));
        logResponse(404);
        return;
      }

      // Safe cache header for public presentation data
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      });
      res.end(JSON.stringify({ success: true, experience }));
      logResponse(200);
      return;
    }

    // ------------------------------------------
    // API: Creator Experiences (/api/experiences)
    // ------------------------------------------
    const cookies = parseCookies(req);
    let ownerId = cookies['bv_owner_id'];
    let managementToken = cookies['bv_mgmt_token'];

    if (pathname === '/api/experiences' && req.method === 'GET') {
      if (!ownerId) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, experiences: [] }));
        logResponse(200);
        return;
      }

      const ownerIndex = await githubClient.getOwnerIndex(ownerId);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, experiences: ownerIndex?.experiences || [] }));
      logResponse(200);
      return;
    }

    if (pathname === '/api/experiences' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      if (!body.birthdayName) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Recipient birthdayName is required.' }));
        logResponse(400);
        return;
      }

      if (!ownerId) {
        ownerId = 'own_' + crypto.randomBytes(12).toString('hex');
      }

      const created = await githubClient.createExperience({
        ...body,
        ownerId
      });

      // Set secure HTTP-only cookies
      res.setHeader('Set-Cookie', [
        `bv_owner_id=${ownerId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`,
        `bv_mgmt_token=${created.managementToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=31536000`
      ]);

      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        experience: created.experience,
        managementToken: created.managementToken
      }));
      logResponse(201);
      return;
    }

    // Experience Operations (/api/experiences/:id/*)
    if (pathname.startsWith('/api/experiences/')) {
      const parts = pathname.replace('/api/experiences/', '').split('/');
      const expId = parts[0];
      const action = parts[1];

      // Update experience
      if (req.method === 'PUT' && !action) {
        const body = await parseJsonBody(req);
        const token = req.headers['x-management-token'] || managementToken;
        if (!token) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing management credential.' }));
          logResponse(401);
          return;
        }

        const updated = await githubClient.updateExperience(expId, body, token);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, experience: updated }));
        logResponse(200);
        return;
      }

      // Publish experience
      if (req.method === 'POST' && action === 'publish') {
        const token = req.headers['x-management-token'] || managementToken;
        if (!token) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing management credential.' }));
          logResponse(401);
          return;
        }

        const published = await githubClient.publishExperience(expId, token);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, experience: published }));
        logResponse(200);
        return;
      }

      // Duplicate experience
      if (req.method === 'POST' && action === 'duplicate') {
        const token = req.headers['x-management-token'] || managementToken;
        if (!token) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing management credential.' }));
          logResponse(401);
          return;
        }

        const duplicated = await githubClient.duplicateExperience(expId, token, ownerId);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, experience: duplicated.experience }));
        logResponse(201);
        return;
      }

      // Delete experience
      if (req.method === 'DELETE' && !action) {
        const token = req.headers['x-management-token'] || managementToken;
        if (!token) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing management credential.' }));
          logResponse(401);
          return;
        }

        const deleted = await githubClient.deleteExperience(expId, token);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: deleted }));
        logResponse(200);
        return;
      }
    }

    // ------------------------------------------
    // API: AI Assistant (/api/ai)
    // ------------------------------------------
    if (pathname === '/api/ai' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      const result = await assistMessage(body);
      res.writeHead(result.success ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
      logResponse(result.success ? 200 : 503);
      return;
    }

    // ------------------------------------------
    // API: Media Streaming Proxy (/media/*)
    // ------------------------------------------
    if (pathname.startsWith('/media/')) {
      const assetPath = pathname.replace(/^\//, '');
      const buffer = await githubClient.readBinaryFile(assetPath);
      if (!buffer) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Media asset not found');
        logResponse(404);
        return;
      }

      const ext = path.extname(assetPath).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.webp': 'image/webp',
        '.mp3': 'audio/mpeg',
        '.m4a': 'audio/mp4',
        '.mp4': 'video/mp4'
      };

      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000, immutable'
      });
      res.end(buffer);
      logResponse(200);
      return;
    }

    // ------------------------------------------
    // Static Assets & Single Page Application Serving
    // ------------------------------------------
    if (pathname.startsWith('/assets/')) {
      const filePath = path.join(DIST_DIR, pathname);
      if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const mimeTypes = {
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.png': 'image/png',
          '.ico': 'image/x-icon'
        };
        res.writeHead(200, {
          'Content-Type': mimeTypes[ext] || 'application/octet-stream',
          'Cache-Control': 'public, max-age=31536000, immutable'
        });
        fs.createReadStream(filePath).pipe(res);
        logResponse(200);
        return;
      }
    }

    // HTML Serving with Dynamic Open Graph Injection for /b/:id
    const indexPath = path.join(DIST_DIR, 'index.html');
    if (!fs.existsSync(indexPath)) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('Application built assets are initializing. Please run npm run build.');
      logResponse(503);
      return;
    }

    let html = fs.readFileSync(indexPath, 'utf8');

    // Dynamic Social Share Previews for /b/:id
    if (pathname.startsWith('/b/') || pathname.startsWith('/birthday/')) {
      const id = pathname.split('/')[2];
      if (id) {
        try {
          const exp = await githubClient.getPublicExperience(id);
          if (exp) {
            html = html
              .replace(/<title>.*?<\/title>/, `<title>Happy Birthday, ${exp.birthdayName}! ✨ BirthdayVerse</title>`)
              .replace(/content="BirthdayVerse — Make Their Birthday Unforgettable"/g, `content="A special interactive birthday universe made for ${exp.birthdayName}!"`);
          }
        } catch {
          // Fallback to default metadata
        }
      }
    }

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache'
    });
    res.end(html);
    logResponse(200);

  } catch (err) {
    console.error(`[Error] Request ${requestId} failed:`, err);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'An internal error occurred. Your request has been logged safely.',
      requestId
    }));
    logResponse(500, err.code || 'INTERNAL_SERVER_ERROR');
  }
});

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`[BirthdayVerse] Server bound to http://${HOST}:${PORT}`);
  console.log(`[BirthdayVerse] Persistent Data Store: ${process.env.MOCK_GITHUB === 'true' ? 'MOCK_PERSISTENCE' : process.env.GITHUB_DATA_REPO}`);
});
