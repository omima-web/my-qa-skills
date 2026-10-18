// Usage: node scripts/xray-gql.js <file-with-graphql-query> [variables-json-file]
// Auth uses the xray-graphql MCP credentials stored in ~/.claude.json (never printed).
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https');
const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8'));
const env = cfg.mcpServers['xray-graphql'].env;

function post(p, body, headers = {}) {
  const data = JSON.stringify(body);
  return new Promise((res, rej) => {
    const r = https.request({ hostname: 'xray.cloud.getxray.app', path: p, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } },
      (resp) => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => res({ status: resp.statusCode, body: d })); });
    r.on('error', rej); r.write(data); r.end();
  });
}

(async () => {
  const tokenCache = path.join(os.tmpdir(), 'xray-token.json');
  let token;
  try { const t = JSON.parse(fs.readFileSync(tokenCache, 'utf8')); if (Date.now() - t.at < 20 * 3600e3) token = t.token; } catch {}
  if (!token) {
    const a = await post('/api/v2/authenticate', { client_id: env.XRAY_CLIENT_ID, client_secret: env.XRAY_CLIENT_SECRET });
    if (a.status !== 200) { console.error('auth failed', a.status); process.exit(1); }
    token = JSON.parse(a.body);
    fs.writeFileSync(tokenCache, JSON.stringify({ token, at: Date.now() }));
  }
  const query = fs.readFileSync(process.argv[2], 'utf8');
  const variables = process.argv[3] ? JSON.parse(fs.readFileSync(process.argv[3], 'utf8')) : {};
  const r = await post('/api/v2/graphql', { query, variables }, { Authorization: 'Bearer ' + token });
  console.log(r.status, r.body);
})();
