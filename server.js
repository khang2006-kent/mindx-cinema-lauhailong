const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');

const rootDir = __dirname;
const port = process.env.PORT || 3000;

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const contents = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const envFile = parseEnvFile(path.join(rootDir, '.env'));
const CHATBASE_API_KEY = process.env.CHATBASE_API_KEY || envFile.CHATBASE_API_KEY || '';
const CHATBASE_CHATBOT_ID = process.env.CHATBASE_CHATBOT_ID || envFile.CHATBASE_CHATBOT_ID || '';

function isConfigured(value) {
  return Boolean(value && typeof value === 'string' && value.trim() && !value.includes('your_') && !value.includes('your-'));
}

function sendJson(res, statusCode, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return map[ext] || 'application/octet-stream';
}

function serveStaticFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      sendJson(res, 404, { success: false, error: 'File not found' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': getContentType(filePath),
      'Content-Length': data.length,
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function forwardToChatbase(messages, model) {
  return new Promise((resolve, reject) => {
    if (!isConfigured(CHATBASE_API_KEY) || !isConfigured(CHATBASE_CHATBOT_ID)) {
      reject(new Error('Missing CHATBASE_API_KEY or CHATBASE_CHATBOT_ID. Please fill .env.'));
      return;
    }

    const payload = JSON.stringify({
      chatbotId: CHATBASE_CHATBOT_ID,
      messages,
      model: model || 'gpt-4o-mini'
    });

    const req = https.request({
      hostname: 'www.chatbase.co',
      path: '/api/v1/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${CHATBASE_API_KEY}`
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => {
        body += chunk.toString();
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ statusCode: res.statusCode || 200, data: parsed });
        } catch (error) {
          resolve({ statusCode: res.statusCode || 200, data: { text: body } });
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok', chatbaseConfigured: isConfigured(CHATBASE_API_KEY) && isConfigured(CHATBASE_CHATBOT_ID) });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/chat') {
    try {
      const body = await readBody(req);
      const payload = body ? JSON.parse(body) : {};
      const messages = Array.isArray(payload.messages) ? payload.messages : [];
      const model = payload.model || 'gpt-4o-mini';

      if (!messages.length) {
        sendJson(res, 400, { success: false, error: 'messages is required' });
        return;
      }

      const result = await forwardToChatbase(messages, model);
      if (result.statusCode >= 400) {
        sendJson(res, result.statusCode, { success: false, error: result.data });
        return;
      }

      sendJson(res, 200, { success: true, data: result.data });
    } catch (error) {
      sendJson(res, 500, { success: false, error: error.message || 'Unknown error' });
    }
    return;
  }

  if (req.method === 'GET') {
    let requestedPath = url.pathname;
    if (requestedPath === '/') {
      requestedPath = '/home.html';
    }

    const safePath = path.normalize(requestedPath).replace(/^\.(?:\/|$)/, '');
    const filePath = path.join(rootDir, safePath);

    if (!filePath.startsWith(rootDir)) {
      sendJson(res, 403, { success: false, error: 'Forbidden' });
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      if (fs.existsSync(indexPath)) {
        serveStaticFile(res, indexPath);
      } else {
        sendJson(res, 404, { success: false, error: 'Directory not found' });
      }
      return;
    }

    if (fs.existsSync(filePath)) {
      serveStaticFile(res, filePath);
    } else {
      sendJson(res, 404, { success: false, error: 'File not found' });
    }
    return;
  }

  sendJson(res, 405, { success: false, error: 'Method not allowed' });
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
  console.log('Open http://localhost:3000/ to use the chat widget.');
  console.log('Fill .env with CHATBASE_API_KEY and CHATBASE_CHATBOT_ID to enable Chatbase.');
});
