const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 4173;
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: {} }, null, 2));

const sessions = new Map();

function readDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch {
    return { users: {} };
  }
}

function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((pair) => {
        const idx = pair.indexOf('=');
        return [pair.slice(0, idx), decodeURIComponent(pair.slice(idx + 1))];
      }),
  );
}

function json(res, code, payload, extraHeaders = {}) {
  res.writeHead(code, { 'Content-Type': 'application/json', ...extraHeaders });
  res.end(JSON.stringify(payload));
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

function getUsernameFromSession(req) {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies.session_token;
  if (!token) return null;
  return sessions.get(token) ?? null;
}

function defaultProgress() {
  return {
    totalSeconds: 0,
    focusSeconds: 0,
    distractionCount: 0,
    points: 0,
    owned: [],
    equipped: { hat: '', outfit: '', accessory: '' },
  };
}

function saveProgressForUser(username, progress) {
  const db = readDb();
  if (!db.users[username]) return false;
  db.users[username].progress = {
    totalSeconds: progress.totalSeconds ?? 0,
    focusSeconds: progress.focusSeconds ?? 0,
    distractionCount: progress.distractionCount ?? 0,
    points: progress.points ?? 0,
    owned: Array.isArray(progress.owned) ? progress.owned : [],
    equipped: progress.equipped ?? { hat: '', outfit: '', accessory: '' },
  };
  writeDb(db);
  return true;
}

const staticFiles = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/styles.css': 'styles.css',
  '/app.js': 'app.js',
};

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'POST' && req.url === '/api/register') {
      const { username, password } = await getBody(req);
      if (!username || !password) return json(res, 400, { error: 'Username and password required.' });

      const db = readDb();
      if (db.users[username]) return json(res, 409, { error: 'Username already exists.' });

      db.users[username] = { passwordHash: hashPassword(password), progress: defaultProgress() };
      writeDb(db);
      return json(res, 201, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/login') {
      const { username, password } = await getBody(req);
      const db = readDb();
      const user = db.users[username];
      if (!user || user.passwordHash !== hashPassword(password)) {
        return json(res, 401, { error: 'Invalid username or password.' });
      }

      const token = createToken();
      sessions.set(token, username);
      const cookie = `session_token=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax`;
      return json(res, 200, { ok: true, username, progress: user.progress ?? defaultProgress() }, { 'Set-Cookie': cookie });
    }

    if (req.method === 'POST' && req.url === '/api/logout') {
      const cookies = parseCookies(req.headers.cookie);
      if (cookies.session_token) sessions.delete(cookies.session_token);
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'session_token=; Max-Age=0; Path=/; SameSite=Lax' });
    }

    if (req.method === 'GET' && req.url === '/api/session') {
      const username = getUsernameFromSession(req);
      if (!username) return json(res, 401, { error: 'Not logged in.' });
      const db = readDb();
      return json(res, 200, { username, progress: db.users[username]?.progress ?? defaultProgress() });
    }

    if (req.method === 'POST' && req.url === '/api/progress') {
      const username = getUsernameFromSession(req);
      if (!username) return json(res, 401, { error: 'Not logged in.' });
      const body = await getBody(req);
      const ok = saveProgressForUser(username, body.progress ?? {});
      if (!ok) return json(res, 404, { error: 'User not found.' });
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && req.url === '/api/progress/beacon') {
      const username = getUsernameFromSession(req);
      if (!username) return json(res, 401, { error: 'Not logged in.' });
      const body = await getBody(req);
      const ok = saveProgressForUser(username, body.progress ?? {});
      if (!ok) return json(res, 404, { error: 'User not found.' });
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && staticFiles[req.url]) {
      const filePath = path.join(__dirname, staticFiles[req.url]);
      const ext = path.extname(filePath);
      const type = ext === '.css' ? 'text/css' : ext === '.js' ? 'application/javascript' : 'text/html';
      res.writeHead(200, { 'Content-Type': type });
      return fs.createReadStream(filePath).pipe(res);
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (error) {
    json(res, 500, { error: error.message || 'Server error' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`FocusForge backend running at http://0.0.0.0:${PORT}`);
});
