// Sprint Test Plan helper (Xray side + description rewrite + PNG rendering).
// Auth uses the xray-graphql MCP credentials stored in ~/.claude.json (never printed).
//
// Commands (all print JSON to stdout):
//   node testplan.js stats <planKey> <sprintId> <sprintStartISO>
//        -> plan test counts by latest status, story coverage, Test Executions (in plan / candidates to add)
//   node testplan.js add-execs <planKey> <execKey,execKey,...>
//        -> addTestExecutionsToTestPlan, then read back the plan's execution count
//   node testplan.js rewrite-desc <in.html> <out.html> <sprint.json>
//        -> point an existing Test Plan description at a new sprint (ids, dates, goal, title)
//        sprint.json = {"id":9360,"name":"Community | Sprint 26.4.1","startDate":"...","endDate":"...","goal":"- a\n- b"}
//   node testplan.js render <stats.json> <outDir> [defects.json]
//        -> <outDir>/coverage.png and <outDir>/qa-report.png (headless Edge/Chrome)
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https');
const { execFileSync } = require('child_process');

function post(p, body, headers = {}) {
  const data = JSON.stringify(body);
  return new Promise((res, rej) => {
    const r = https.request({ hostname: 'xray.cloud.getxray.app', path: p, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers } },
      (resp) => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => res({ status: resp.statusCode, body: d })); });
    r.on('error', rej); r.write(data); r.end();
  });
}

let token;
async function gql(query, variables = {}) {
  if (!token) {
    const cache = path.join(os.tmpdir(), 'xray-token.json');
    try { const t = JSON.parse(fs.readFileSync(cache, 'utf8')); if (Date.now() - t.at < 20 * 3600e3) token = t.token; } catch {}
    if (!token) {
      const env = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8')).mcpServers['xray-graphql'].env;
      const a = await post('/api/v2/authenticate', { client_id: env.XRAY_CLIENT_ID, client_secret: env.XRAY_CLIENT_SECRET });
      if (a.status !== 200) throw new Error('xray auth failed ' + a.status);
      token = JSON.parse(a.body);
      fs.writeFileSync(cache, JSON.stringify({ token, at: Date.now() }));
    }
  }
  const r = await post('/api/v2/graphql', { query, variables }, { Authorization: 'Bearer ' + token });
  const j = JSON.parse(r.body);
  if (j.errors) throw new Error(JSON.stringify(j.errors));
  return j.data;
}

async function planId(key) {
  const d = await gql(`query($j:String){ getTestPlans(jql:$j, limit:1){ results{ issueId } } }`, { j: `key = ${key}` });
  const id = d.getTestPlans.results[0]?.issueId;
  if (!id) throw new Error('Test Plan not found in Xray: ' + key);
  return id;
}

async function pageAll(fetchPage) {
  const out = []; let start = 0;
  for (;;) { const p = await fetchPage(start); out.push(...p.results); start += p.results.length; if (!p.results.length || start >= p.total) return out; }
}

async function stats(planKey, sprintId, sprintStart) {
  const pid = await planId(planKey);
  const tests = await pageAll(async (start) => (await gql(
    `query($id:String,$s:Int){ getTestPlan(issueId:$id){ tests(limit:100, start:$s){ total results{ issueId jira(fields:["key"]) status(testPlan:$id){ name } } } } }`,
    { id: pid, s: start })).getTestPlan.tests);
  const byStatus = {};
  for (const t of tests) { const s = (t.status?.name || 'TODO').replace(/\s+/g, '').toUpperCase(); byStatus[s] = (byStatus[s] || 0) + 1; }
  const pending = (byStatus.TODO || 0) + (byStatus.EXECUTING || 0) + (byStatus.BLOCKED || 0);

  const sprintTests = (await gql(`query($j:String){ getTests(jql:$j, limit:1){ total } }`,
    { j: `project = CPD AND type = Test AND sprint = ${sprintId}` })).getTests.total;

  const coverage = (await pageAll(async (start) => (await gql(
    `query($j:String,$s:Int){ getCoverableIssues(jql:$j, limit:100, start:$s){ total results{ issueId jira(fields:["key","summary","status"]) status{ name } } } }`,
    { j: `project = CPD AND sprint = ${sprintId} ORDER BY key`, s: start })).getCoverableIssues))
    .map(c => ({ key: c.jira.key, summary: c.jira.summary, jiraStatus: c.jira.status?.name, coverage: c.status?.name || 'UNCOVERED' }));
  const covCount = {};
  for (const c of coverage) covCount[c.coverage] = (covCount[c.coverage] || 0) + 1;

  const inPlan = await pageAll(async (start) => (await gql(
    `query($id:String,$s:Int){ getTestPlan(issueId:$id){ testExecutions(limit:100, start:$s){ total results{ issueId jira(fields:["key","summary"]) } } } }`,
    { id: pid, s: start })).getTestPlan.testExecutions);
  const inPlanKeys = new Set(inPlan.map(e => e.jira.key));
  const planTestIds = new Set(tests.map(t => t.issueId));
  // Candidates: every execution on the sprint, plus executions created since sprint start
  // (any sprint or none) that run at least one test of this plan.
  const execs = (jql) => pageAll(async (start) => (await gql(
    `query($j:String,$s:Int){ getTestExecutions(jql:$j, limit:100, start:$s){ total results{ issueId jira(fields:["key","summary"]) tests(limit:100){ results{ issueId } } } } }`,
    { j: jql, s: start })).getTestExecutions);
  const shape = (e, why) => ({ key: e.jira.key, summary: e.jira.summary, why, planTests: e.tests.results.filter(t => planTestIds.has(t.issueId)).length });
  const onSprint = (await execs(`project = CPD AND issuetype = "Test Execution" AND sprint = ${sprintId}`)).map(e => shape(e, 'sprint'));
  const sprintKeys = new Set(onSprint.map(e => e.key));
  const t0 = new Date(sprintStart || 0); const day = isNaN(t0) ? '' : t0.toISOString().slice(0, 10);
  const recent = day ? (await execs(`project = CPD AND issuetype = "Test Execution" AND created >= "${day}"`))
    .map(e => shape(e, 'runs plan tests')).filter(e => !sprintKeys.has(e.key) && e.planTests > 0) : [];
  const toAdd = [...onSprint, ...recent].filter(e => !inPlanKeys.has(e.key));

  return {
    planKey, planIssueId: pid, sprintId,
    planTests: tests.length, byStatus,
    executed: tests.length - (byStatus.TODO || 0), pending,
    sprintTests, coverage, covCount,
    executionsInPlan: [...inPlanKeys],
    executionCandidates: toAdd,
  };
}

async function addExecs(planKey, keys) {
  const pid = await planId(planKey);
  const ids = (await gql(`query($j:String){ getTestExecutions(jql:$j, limit:100){ results{ issueId jira(fields:["key"]) } } }`,
    { j: `key in (${keys.join(',')})` })).getTestExecutions.results.map(e => e.issueId);
  const r = await gql(`mutation($id:String!,$e:[String]!){ addTestExecutionsToTestPlan(issueId:$id, testExecIssueIds:$e){ addedTestExecutions warning } }`, { id: pid, e: ids });
  const total = (await gql(`query($id:String){ getTestPlan(issueId:$id){ testExecutions(limit:1){ total } } }`, { id: pid })).getTestPlan.testExecutions.total;
  return { added: r.addTestExecutionsToTestPlan.addedTestExecutions?.length || 0, warning: r.addTestExecutionsToTestPlan.warning, executionsInPlan: total };
}

const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function riyadhDate(iso) { const d = new Date(new Date(iso).getTime() + 3 * 3600e3); return `${d.getUTCDate()}/${MON[d.getUTCMonth()]}/ ${d.getUTCFullYear()}`; }
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function rewriteDesc(html, sp) {
  let h = html;
  // Sprint id inside JQL links (URL-encoded and plain, incl. block-card datasource JSON).
  h = h.replace(/([Ss]print%20%3D%20)\d+/g, `$1${sp.id}`).replace(/([Ss]print = )\d+/g, `$1${sp.id}`);
  // Title line / sprint name.
  const short = (sp.name.match(/Sprint\s+[\d.]+/) || [])[0];
  if (short) h = h.replace(/Sprint\s+\d+\.\d+\.\d+/g, short);
  // Dates.
  h = h.replace(/(Start Date:\s*)[^<]*/, `$1[ ${riyadhDate(sp.startDate)}]`).replace(/(End Date:\s*)[^<]*/, `$1[ ${riyadhDate(sp.endDate)}]`);
  // Sprint goal: replace the first blockquote after "Sprint Goal".
  const goals = (sp.goal || '').split('\n').map(l => l.replace(/^\s*[-*•]\s*/, '').trim()).filter(Boolean);
  if (goals.length) {
    const i = h.indexOf('Sprint Goal');
    const b = h.indexOf('<blockquote', i), e = h.indexOf('</blockquote>', b);
    if (i >= 0 && b > i && e > b) {
      const list = `<blockquote><ul>${goals.map(g => `<li><p>${esc(g)}</p></li>`).join('')}</ul></blockquote>`;
      h = h.slice(0, b) + list + h.slice(e + '</blockquote>'.length);
    }
  }
  return h;
}

const COV_COLORS = { OK: '#95C160', NOK: '#D45D52', NOTRUN: '#F1E069', UNCOVERED: '#A2A6AE', UNKNOWN: '#A2A6AE' };
const ST_COLORS = { PASSED: '#95C160', FAILED: '#D45D52', TODO: '#A2A6AE', EXECUTING: '#F1E069', BLOCKED: '#6E6E6E', ABORTED: '#111' };
const page = (title, body) => `<!doctype html><html><head><meta charset="utf-8"><style>
body{font-family:Segoe UI,Arial,sans-serif;margin:24px;color:#172B4D;background:#fff}h2{margin:0 0 4px;font-size:20px}.sub{color:#5E6C84;font-size:13px;margin-bottom:16px}
table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #DFE1E6;padding:6px 8px;text-align:left}th{background:#F4F5F7}
.pill{display:inline-block;padding:2px 10px;border-radius:3px;font-weight:600;font-size:12px;color:#172B4D}
.bar{display:flex;height:22px;border-radius:3px;overflow:hidden;margin:8px 0 16px}.bar div{color:#172B4D;font-size:12px;font-weight:600;display:flex;align-items:center;justify-content:center}
.cards{display:flex;gap:12px;margin-bottom:16px}.card{flex:1;border:1px solid #DFE1E6;border-radius:6px;padding:12px}.card b{display:block;font-size:26px}.card span{color:#5E6C84;font-size:12px}
</style></head><body><h2>${esc(title)}</h2>${body}</body></html>`;
const bar = (counts, colors) => { const tot = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return `<div class="bar">${Object.entries(counts).map(([k, v]) => `<div style="width:${v / tot * 100}%;background:${colors[k] || '#ccc'}">${k} ${v}</div>`).join('')}</div>`; };

function shot(htmlFile, png, height) {
  const cands = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'];
  const exe = cands.find(fs.existsSync);
  if (!exe) throw new Error('no Edge/Chrome for rendering');
  execFileSync(exe, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--window-size=1200,${height}`, `--screenshot=${png}`, 'file:///' + htmlFile.replace(/\\/g, '/')], { stdio: 'ignore' });
}

function render(s, outDir, defects) {
  fs.mkdirSync(outDir, { recursive: true });
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const covRows = s.coverage.map(c => `<tr><td>${c.key}</td><td>${esc(c.summary)}</td><td>${esc(c.jiraStatus || '')}</td><td><span class="pill" style="background:${COV_COLORS[c.coverage] || '#ccc'}">${c.coverage}</span></td></tr>`).join('');
  const cov = page(`Xray Test Coverage — Sprint ${s.sprintId} stories`,
    `<div class="sub">Test Plan ${s.planKey} · ${s.coverage.length} stories · generated ${now} UTC from Xray</div>${bar(s.covCount, COV_COLORS)}
     <table><tr><th>Key</th><th>Story</th><th>Jira status</th><th>Coverage</th></tr>${covRows}</table>`);
  const d = defects || {};
  const rep = page(`Partners Sprint QA Report — ${s.planKey}`,
    `<div class="sub">generated ${now} UTC from Xray + Jira</div>
     <div class="cards"><div class="card"><b>${s.sprintTests}</b><span>Total test cases (sprint)</span></div>
     <div class="card"><b>${s.planTests}</b><span>Tests in Test Plan</span></div>
     <div class="card"><b>${s.executed}</b><span>Executed</span></div>
     <div class="card"><b>${s.pending}</b><span>Pending / Blocked</span></div>
     <div class="card"><b>${d.total ?? '-'}</b><span>Defects (solved ${d.solved ?? '-'} · rejected ${d.rejected ?? '-'} · open ${d.open ?? '-'})</span></div></div>
     <div>Test runs in plan by status</div>${bar(s.byStatus, ST_COLORS)}
     <div>Story coverage</div>${bar(s.covCount, COV_COLORS)}
     <div>Test Executions in plan: ${s.executionsInPlan.length}</div>`);
  const out = {};
  for (const [name, html, h] of [['coverage', cov, 140 + 34 * s.coverage.length], ['qa-report', rep, 420]]) {
    const f = path.join(outDir, name + '.html'); fs.writeFileSync(f, html);
    shot(f, path.join(outDir, name + '.png'), Math.max(300, h)); out[name] = path.join(outDir, name + '.png');
  }
  return out;
}

(async () => {
  const [cmd, a, b, c] = process.argv.slice(2);
  let r;
  if (cmd === 'stats') r = await stats(a, b, c);
  else if (cmd === 'add-execs') r = await addExecs(a, b.split(',').map(x => x.trim()).filter(Boolean));
  else if (cmd === 'rewrite-desc') { fs.writeFileSync(b, rewriteDesc(fs.readFileSync(a, 'utf8'), JSON.parse(fs.readFileSync(c, 'utf8')))); r = { written: b }; }
  else if (cmd === 'render') r = render(JSON.parse(fs.readFileSync(a, 'utf8')), b, c ? JSON.parse(fs.readFileSync(c, 'utf8')) : null);
  else { console.error('usage: stats | add-execs | rewrite-desc | render'); process.exit(2); }
  console.log(JSON.stringify(r, null, 2));
})().catch(e => { console.error(String(e.message || e)); process.exit(1); });
