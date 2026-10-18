# Xray integration (via the Atlassian/Rovo connector)

Xray Tests, Test Sets, and Test Plans are Jira issues, created through the standard Atlassian (Rovo) connector. Manual **step** storage is Xray-internal and not writable through this connector — so steps go in the Test's **description** as Preconditions → Steps → Expected results (see `tc-template.md`).

**Golden rule: discover before you create.** Never create a Test Plan or Test Set without first checking one doesn't already exist — duplicates are worse than gaps.

## What the connector CAN and CANNOT do (validated live on SHPD)
**CAN:**
- Create a **Test** (issuetype id 10186) with **all custom fields + Sprint** in one `createJiraIssue` call. Every field persists.
- Create a **Test Set** (10187) and **Test Plan** issue.
- Create **issue links** via `createIssueLink` (Relates / Test / Blocks all work).
- Create the **Test → Story** coverage link using link type **"Test"** — this one is Xray-native requirement coverage (rolls up on the story). Use it.

**CANNOT (Xray-internal, no Jira field on either side):**
- Set **native Test Set membership** (the Set's "Tests" tab that rolls up to Test Plans/Executions). There is no field for it on the Test or the Test Set.
- Set **native Test Set → Test Plan** membership.
- **Set the Sprint by EDIT** — `editJiraIssue` on the Sprint field hits an approval gate. Sprint must be set **at creation** (see below).

**Consequence — two modes:**
- **Jira connector only:** Test↔Test Set and Set↔Test Plan membership and the Test Repository folder are Xray-internal and NOT settable (no field, no link type — proven live). Flag them as manual **Add Tests** / move-to-folder steps. Never fake membership with `Relates` links.
- **`xray-graphql` MCP present (mutations enabled):** all of it IS settable via Xray GraphQL — proven live: `addTestsToTestSet` added SHPD-9176 to Set SHPD-9178 and read-back showed 2 members. Use the MCP to create-or-reuse the Set/Plan, assign tests, and set the folder. The token inherits the user's Jira permissions (no separate scope).

## Proven field IDs & option IDs (SHPD "Test" type 10186)
Set these in `createJiraIssue` `additional_fields`. **Sprint must be at creation, not edit.**
| Field | Field ID | Format | Options (value → id) |
|---|---|---|---|
| Testing Environment | `customfield_10786` | `{"id":"…"}` | Development 11095 · Production 11096 · **Stage 11097** · Beta 13406 |
| Test Behavior | `customfield_10828` | `{"id":"…"}` | Positive 11128 · Negative 11129 · Functional 12651 · Regression 12652 · Adhoc 12653 · Integration 12654 · System 12655 · Smoke 12656 · Sanity 12657 · Load 12658 · Stress 12659 · Security 21681 |
| Testcase Type | `customfield_11951` | `[{"id":"…"}]` (multi) | APITesting 13381 · UITesting 13382 · Automatable 13383 · *(Mobile not yet added by team)* |
| Types of Functional Testing | `customfield_11959` | `{"id":"…"}` | Component 13401 · Integration 13402 · Regression 13403 |
| Test Category | `customfield_11960` | `{"id":"…"}` | Automatable 13404 · Non Automatable 13405 |
| Platform | `customfield_14079` | `[{"id":"…"},…]` (multi) | Mahally 15914 · Dashboard 15915 · Store 15916 · Salla Ads 23048 |
| Sprint | `customfield_10020` | integer sprint id, e.g. `8764` | the story's active sprint |
| Labels | `labels` | `["Shipping","Delivery-Promise"]` | **no spaces** — hyphenate the sub-module |

Notes: the **Sub-Module custom field (`customfield_19132`) only has Offers values — do NOT use it for Shipping**; the sub-module goes in **Labels** (hyphenated). Tests are created in Jira status **Closed** by this workflow (the meaningful Xray state is **Test Status = Open**, which is correct for a new test) — leave it unless the team wants a transition. Automation Status defaults to "To Do" — harmless.

## The workflow — one pause up front, then run the whole sequence
Pause and show the full plan for approval FIRST. On approval, create the tests, then take the path matching the environment.

1. **Create ALL test cases** via the Jira connector (`createJiraIssue`, issuetype "Test") — full field set + Sprint at creation. This is the best way to set the custom fields; keep it in both modes.
2. **Link each Test → Story** via `createIssueLink` type **"Test"** (Xray-native coverage). Both modes.
3. **Set/Plan/folder — branch on the `xray-graphql` MCP:**

### MCP present (Xray GraphQL, mutations enabled) — auto-manage, search-first
Xray GraphQL keys on the **numeric issueId**, not the SHPD key. Resolve first: `getTests(jql:"key in (SHPD-…, …)", limit:100){ results{ issueId jira(fields:["key"]) } }`.
- **Test Plan (sprint-level, reuse-or-create with a template):**
  `getTestPlans(jql:"project=<KEY> AND issuetype='Test Plan' AND summary ~ '<sprint>'")` (or `searchJiraIssuesUsingJql`) → if empty, **create it via the Jira connector** (`createJiraIssue`, issuetype "Test Plan", Sprint at creation) using the **sprint Test Plan template** in `references/test-plan-template.md` — In-Scope populated from the sprint's stories (`searchJiraIssuesUsingJql("sprint=<sprintId> AND issuetype=Story")`). If it already exists, reuse it and **do NOT overwrite its description**. (Creating the issue via the connector — not `createTestPlan` — lets the templated markdown description render cleanly; the MCP is still used for assignment below.)
- **Test Set (reuse-or-create):**
  `getTestSets(jql:"project=<KEY> AND issuetype='Test Set' AND summary ~ '<STORY-KEY>'")` → if empty, create via `createJiraIssue` (issuetype "Test Set", summary `Test Set | <sub-module> | <STORY-KEY>`); else reuse.
- **Assign:** `addTestsToTestSet(issueId:<setId>, testIssueIds:[...]) { addedTests warning }` then `addTestsToTestPlan(issueId:<planId>, testIssueIds:[...]) { addedTests warning }`.
- **Folder:** ensure it exists `createFolder(projectId:"<projId>", path:"/<sprint>")` (ignore "already exists"), then per test `updateTestFolder(issueId:<id>, folderPath:"/<sprint>")`.
- **Verify + report** via `getTestSet`/`getTestPlan` read-back (member count).
- **NEVER** call delete/remove mutations. Create + assign only.

### MCP absent (Jira connector only) — honest manual flags
Do not create the Set/Plan, do not fake membership. Carry the Test keys into the report's **Add Tests** + move-to-folder steps.

## Idempotency & re-runs
Search before every create (`getTestSets`/`getTestPlans` by JQL; Tests by title). Re-assigning an already-member test is a harmless no-op (`addedTests` returns empty). Report created / reused / assigned / skipped.

## API-automatable backend TCs (optional route)
When a backend/API TC is `Test Category: Automatable` and the endpoint is known, it can additionally be seeded as an APIDOG API test case (`create_test_case` needs the endpoint's `apiDetailId` + `responseId` from `list_api_endpoints`). Only if the user asks.

## What to report back
- **MCP path:** Test Plan `<key>` (created/reused) · Test Set `<key>` (created/reused) · tests assigned ✓ (verified N members) · folder `/<sprint>` ✓
- **No-MCP path:** Test Plan/Set **not created** (flag) + the two manual steps with paste-ready keys:
  1. **Add these N tests to the Test Set** via **Add Tests** in Xray: SHPD-####, …
  2. **Move these N tests into the `<sprint>` folder** (created in root; folder is Xray-internal)
- Both: Tests created/updated/skipped (title, layer, behavior, platform, testcase type, category); Test→Story coverage links; coverage vs SP band; any AC with **zero** TCs (hard flag); `unresolved-testcase` placeholders.
