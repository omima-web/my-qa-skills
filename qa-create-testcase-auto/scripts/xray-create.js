// Create Xray tests + Test Sets + Test Plan membership from a plan file.
// Usage: node xray-create.js <plan.js> [STORY-KEY|all] [maxTests]
// plan.js exports: { project, sprintId, planIssueId, stories: { 'CPD-1': { labels, folder, setName, tcs: [row...] } } }
// row: [title, layer(API|UI|MOB|E2E), behavior, functionalType, automatable(bool), pre[], steps[], expected[], placeholder?]
// Idempotent: progress saved to <plan>.results.json; re-runs skip what exists. Never deletes anything.
const fs = require('fs'), os = require('os'), path = require('path'), https = require('https');
const planFile = path.resolve(process.argv[2]);
const plan = require(planFile);
const RES = planFile.replace(/\.js$/, '') + '.results.json';
const results = fs.existsSync(RES) ? JSON.parse(fs.readFileSync(RES, 'utf8')) : {};
const save = () => fs.writeFileSync(RES, JSON.stringify(results, null, 2));

// Salla Jira option ids (shared across projects on salla-dev)
const ID = {
  env: '11097', // Stage
  beh: { Positive: '11128', Negative: '11129', Functional: '12651', Regression: '12652', Adhoc: '12653', Integration: '12654',
         System: '12655', Smoke: '12656', Sanity: '12657', Security: '21681' },
  type: { API: '13381', UI: '13382', MOB: '13382', E2E: '13382' }, // no "Mobile" option yet -> UI Testing
  func: { Component: '13401', Integration: '13402', Regression: '13403' },
  cat: { true: '13404', false: '13405' },
  platform: { Dashboard: '15915', Store: '15916', Mahally: '15914', 'Salla Ads': '23048' },
};

const cfg = JSON.parse(fs.readFileSync(path.join(os.homedir(), '.claude.json'), 'utf8')).mcpServers['xray-graphql'].env;
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
async function gql(query, variables) {
  if (!token) token = JSON.parse((await post('/api/v2/authenticate', { client_id: cfg.XRAY_CLIENT_ID, client_secret: cfg.XRAY_CLIENT_SECRET })).body);
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await post('/api/v2/graphql', { query, variables }, { Authorization: 'Bearer ' + token });
    if (r.status === 429) { await new Promise(s => setTimeout(s, 5000 * (attempt + 1))); continue; }
    const j = JSON.parse(r.body);
    if (j.errors) throw new Error(JSON.stringify(j.errors));
    return j.data;
  }
  throw new Error('rate limited');
}

const desc = (pre, steps, exp) =>
  '*Preconditions:*\n' + pre.map(x => '* ' + x).join('\n') +
  '\n\n*Steps:*\n' + steps.map(x => '# ' + x).join('\n') +
  '\n\n*Expected results:*\n' + exp.map(x => '* ' + x).join('\n');

async function createTest(story, s, tc) {
  // 10th column: true = regression set (picked by the standard in SKILL.md step 4b)
  const [title, layer, beh, func, auto, pre, steps, exp, placeholder, regression] = tc;
  const platforms = s.platforms || ['Dashboard'];
  const fields = {
    project: { key: plan.project }, summary: title, description: desc(pre, steps, exp),
    labels: [...s.labels, ...(placeholder ? ['unresolved-testcase'] : []), ...(regression && !placeholder ? ['regression'] : [])],
    customfield_10786: { id: ID.env },
    customfield_10828: { id: ID.beh[beh] },
    customfield_11951: [{ id: ID.type[layer] }],
    customfield_11959: { id: ID.func[func] },
    customfield_11960: { id: ID.cat[placeholder ? false : auto] },
    customfield_14079: (layer === 'E2E' && s.e2ePlatforms ? s.e2ePlatforms : platforms).map(p => ({ id: ID.platform[p] })),
    customfield_10020: plan.sprintId,
  };
  // "Test" link: new test "tests" the story -> Xray requirement coverage
  const jira = { fields, update: { issuelinks: [{ add: { type: { name: 'Test' }, outwardIssue: { key: story } } }] } };
  const d = await gql(`mutation($jira: JSON!, $folder: String) {
    createTest(testType: {name: "Manual"}, jira: $jira, folderPath: $folder) { test { issueId jira(fields: ["key"]) } warnings } }`,
    { jira, folder: s.folder });
  return { issueId: d.createTest.test.issueId, key: d.createTest.test.jira.key, title, placeholder: !!placeholder };
}

(async () => {
  const which = process.argv[3] || 'all';
  const max = Number(process.argv[4] || 1e9);
  let made = 0;
  for (const [story, s] of Object.entries(plan.stories)) {
    if (which !== 'all' && which !== story) continue;
    const r = results[story] = results[story] || { tests: {} };
    for (const tc of s.tcs) {
      if (r.tests[tc[0]]) continue;
      if (made >= max) { save(); return; }
      r.tests[tc[0]] = await createTest(story, s, tc); made++; save();
      console.log(story, r.tests[tc[0]].key, tc[0]);
    }
    const ids = Object.values(r.tests).map(t => t.issueId);
    if (!r.set) {
      const found = await gql(`{ getTestSets(jql: "project = ${plan.project} AND issuetype = 'Test Set' AND summary ~ '${story}'", limit: 5) { results { issueId jira(fields: ["key"]) } } }`);
      if (found.getTestSets.results.length) r.set = { issueId: found.getTestSets.results[0].issueId, key: found.getTestSets.results[0].jira.key, reused: true };
      else {
        const d = await gql(`mutation($jira: JSON!) { createTestSet(jira: $jira) { testSet { issueId jira(fields: ["key"]) } warnings } }`,
          { jira: { fields: { project: { key: plan.project }, summary: s.setName, labels: s.labels, customfield_10020: plan.sprintId },
                    update: { issuelinks: [{ add: { type: { name: 'Test' }, outwardIssue: { key: story } } }] } } });
        r.set = { issueId: d.createTestSet.testSet.issueId, key: d.createTestSet.testSet.jira.key, reused: false };
      }
      save();
    }
    const a = await gql(`mutation($id: String!, $t: [String]!) { addTestsToTestSet(issueId: $id, testIssueIds: $t) { addedTests warning } }`, { id: r.set.issueId, t: ids });
    const p = await gql(`mutation($id: String!, $t: [String]!) { addTestsToTestPlan(issueId: $id, testIssueIds: $t) { addedTests warning } }`, { id: plan.planIssueId, t: ids });
    r.assigned = { set: a.addTestsToTestSet, plan: p.addTestsToTestPlan }; save();
    console.log(story, 'set', r.set.key, '(' + (r.set.reused ? 'reused' : 'created') + ')', 'set+', a.addTestsToTestSet.addedTests.length, 'plan+', p.addTestsToTestPlan.addedTests.length);
  }
})().catch(e => { save(); console.error('ERROR', e.message); process.exit(1); });
