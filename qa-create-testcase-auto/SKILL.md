---
name: qa-create-testcase-auto
description: Autonomous Salla QA test-case creation. Given one or more Jira story keys, read each story, size the coverage, create every Xray Test with full fields, link each Test to its story, create-or-reuse the Test Set, add everything to the sprint Test Plan, file tests in the team's feature folders, post one PM comment per story for open questions, and schedule a follow-up that applies PM answers. Runs end-to-end without pausing. Use when the user gives story keys and asks for test cases / Xray tests / test coverage. Personal autonomous variant of qa-create-testcase.
---

# Create Test Cases — autonomous

The user gives story keys (often a whole sprint list). Do the entire job **without asking questions or pausing for plan approval**. Only stop to ask a yes/no when an action needs a permission you don't have. Report at the end.

References (same folder): `references/ticket-reading.md`, `references/tc-template.md`, `references/design-docs.md`, `references/dashboard-baseline.md`, `references/expansion-multimarket.md`, `references/xray-integration.md`, `references/test-plan-template.md`, `references/sub-modules.md`. Read them at the start of every run; the rules there apply except where this file overrides them.

## Constants (salla-dev)
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab` (https://salla-dev.atlassian.net). Story Points = `customfield_10030`. Sprint = `customfield_10020`.
- Xray GraphQL helper: `node scripts/xray-gql.js <query.graphql> [vars.json]` — authenticates with the xray-graphql MCP credentials in `~/.claude.json`, never prints secrets.
- Bulk creator: `node scripts/xray-create.js <plan.js> [STORY|all] [max]` — creates tests (all fields + Sprint + folder + Test→Story link in one call), creates-or-reuses each story's Test Set (search-first), adds tests to the Set and the Test Plan. Idempotent via `<plan>.results.json`. Row format and plan-file shape are documented at the top of the script.
- Field option ids are in the script (`ID`): Testing Environment = **Stage** (11097). There is **no "Mobile" Testcase Type** option → mobile sanity uses UI Testing (13382) with `[Mobile][Sanity]` in the title.

## Steps
0. **Start the "Writing Testcases" sub-task** of every story before writing its tests: query `parent in (<keys>) AND issuetype in subTaskIssueTypes()` and pick the sub-task whose summary starts with `Writing Testcases` (or `Write Test`/`Testcases`). If the story's **QA Engineer** field (`customfield_16280`) is empty, set it to the current user first. If the story has no Writing Testcases sub-task and its QA Engineer is the current user, create it (`Sub-task`, `Writing Testcases | <story summary>`, assignee = current user) — the `qa-create-qa-subtasks` skill normally made it already. Move it to **In Progress** (`transitionJiraIssue` transition id `3`; if the screen rejects it, retry with `transitionName: "In Progress"`). If the QA Engineer is someone else, don't create or move any sub-task on that story. Leave the `Testing | …` sub-task untouched.
1. **Read every story** per `ticket-reading.md`: description/ACs, labels, components, SP, sprint, epic, issue links, subtasks (incl. bugs logged as subtasks), all comments (`executeRead listJiraIssueComments`), and remote Confluence links per `design-docs.md`. The dev/PM comments often settle or reopen AC questions — use them.
1a. **Affiliate stories → read the affiliate context first.** If the story or its epic touches affiliate (التسويق بالعمولة، مسوق، فرصة، opportunity, marketer, commission, Salla Plans affiliate, partner-portal affiliate pages, merchant `/marketing/affiliates`), read `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` before sizing:
   - **Sync first:** take its «آخر مزامنة مع جيرا» date and search `project = CPD AND (summary ~ "affiliate*" OR summary ~ "مسوق" OR summary ~ "فرصة" OR summary ~ "opportunity" OR summary ~ "التسويق بالعمولة") AND updated >= "<date>"`; add any new business / decision / bug to the right part, add a «سجل التحديثات» row, set the date to today.
   - **Impact:** walk the 13 questions in Part 5.1 and the rows of the Part 5.2 table that the story touches. Every "اتست كمان" item that the change could break gets at least one `[Regression]` / `[Integration]` test (step 4b), naming the old story it protects (e.g. "protects CPD-25793 usage limit").
   - **Don't contradict the file:** Part 6.1 (not bugs) and the decisions in Part 6 win over a guess; a known open bug in Part 7.1 is linked, not re-written.
   - **Report:** add an «الإمباكت» line per story: the areas from Part 5 you covered and any you left out on purpose.
   - Any new fact the user tells you about affiliate → add it to the file the same run.
1b. **Read the story's code before sizing.** Find the story's PRs: Jira dev-status (`/rest/dev-status/latest/issue/detail?issueId=<id>&applicationType=GitHub&dataType=pullrequest`) or `gh search prs "<KEY>" --owner SallaApp`; the code of a story is often inside another story's PR, so also search the epic's other keys. From the PR take:
   - the **real** endpoint paths, params, body fields, validation limits (min/max, trimmed, required_without), error codes and statuses, and any design doc under `docs/changes/` (its decision table and error table are the best source for negative tests);
   - the **changed files** → every other screen/flow that uses them is an impact area (step 4b).
   Write the tests to the real behaviour in the PR. If the PR disagrees with the story, keep the AC, write what the code does in the test and put the difference in the PM comment. If there is no PR yet, write to the story and add `⚠ path/fields to confirm against the PR at run start` to the API tests' preconditions.
1c. **Story type.** Decide and report one of: **UI** (screens only), **UI + backend** (screens that call our own backend), **API-only** (a public/partner API used with a token and no screen, e.g. Partner API). API-only stories get the label `API-only`; the run skill uses it to plan an Apidog suite (`qa-api-suite`) after the first run.
2. **Skip what's already covered:** search Xray/Jira for existing Tests/Test Sets linked to the story (`issue in linkedIssues(<KEY>)`, `getCoverableIssues`). If the story already has a Test Set with tests, do not create duplicates — just make sure those tests are in the sprint Test Plan and report it. Its "Writing Testcases" sub-task still goes Todo → In Progress → Closed (step 0 + step 13) — only the sub-task moves, no new tests.
3. **Resolve the axes without stopping:**
   - Impacted Surface: use the `Dashboard`/`Store` labels when present. **If empty, don't stop:** Partner Portal / affiliate portal / merchant dashboard screens → `Dashboard`; storefront / checkout → `Store`; both → Both. Note the assumption in the report and the PM comment.
   - Sub-module → labels (hyphenated, no spaces), e.g. `["Affiliate","Renewal-Coupons"]`.
   - Functional/backend stories with no UI or design change: no localization / dark mode / responsive tests at all; add Security / API / Performance only if the story really touches them.
4. **Size the coverage** per `tc-template.md` (one Happy per AC, earned Negatives/Boundaries, high-risk edge cases, one E2E) **plus the baseline in `dashboard-baseline.md` only where the story earns it**: Localization (AR/EN) + Dark mode + **Responsive** (1440/768/375) **only when the story adds or changes UI/design**; a functional/backend story with no design change gets none of them. **Security** / **API** / **Performance** only when the story touches auth/permissions/PII/payments, an endpoint, or page speed. Stay on the ACs; Multi-language input only when there is a create/edit form with localizable text. Write every test so Claude can run it in Chrome (exact URL, data, widths, which request to inspect, visible/console/network expected results) — see "Every test must be runnable by Claude in Chrome" in that file. Turn logged bugs (subtasks/links) into `[ACx][UI][Regression]` tests. Write tests to the **AC**; if the design/dev comments contradict an AC, keep the AC and flag it in the PM comment.
4a. **Business-rules matrix first.** Before writing tests, write down the rules as a matrix and cover every cell with a positive, negative or boundary test:
   - **Who** can use it (any merchant / only the affiliate's / only certain plans: Basic, Plus, Pro).
   - **How many times** (per merchant, total, per month) and what happens at the limit +1 (the exact message, e.g. «انتهت عدد مرات استخدام الكوبون»).
   - **On which actions:** renewal, upgrade (another plan / monthly → yearly), new purchase, and other purchases (apps, themes, add-ons, services, storefront checkout).
   - **Where the values come from** (admin global vs custom vs hard-coded defaults).
   - **Time:** expiry, month change, reset, a plan that expired and dropped to Basic.
   If a cell isn't clear from the ACs or comments, put it in the ONE PM comment. Never write a test that contradicts a rule the team already stated.
4b. **Edge cases, corner cases and impact on other areas — the most important part for the QA; never thin this out.** For every story, on top of the ACs:
   - **Edge cases:** empty state, one item, exactly at the limit / page size, very long text, Arabic + English + numbers + emojis + special characters (`% _ ' " < >`), spaces only, no results, many results (paging), old data from before the change, deleted/disabled items.
   - **Corner cases:** two things at once (search + tab + page together, fast clicking, double submit), refresh / back button / direct URL, slow or failed network, session expired, a user with no permission, the feature flag off.
   - **Impact on other areas (الارتباطات):** list every other screen or flow that uses the same data, API, component or setting (navbar dropdowns, counters/badges, notifications, emails, admin side, store side, mobile app, other portal pages, old links/redirects). Write at least one `[Regression]` or `[Integration]` test for each one that could break, and say in the test which story change could affect it.
   Note in the report how many edge / corner / impact tests each story got.
4c. **Self-review before creating anything.** Go through the full list once as a reviewer and fix it before step 9:
   - Every AC has at least one Positive test; every cell of the rules matrix (4a) is covered; every error code/limit from the PR (1b) has a Negative or Boundary test.
   - Edge cases, corner cases and impact (4b) were each considered; the ones left out are left out on purpose (say why in the report).
   - No test is written on a proposal the PR changed; paths, params and fields match the code.
   - No duplicates, no test that tests two unrelated things, no test that contradicts a team decision or a known not-a-bug in the context file.
   - Every test is runnable as written: exact URL/endpoint, data, steps and an expected result that can be checked (status + field/message, or what is visible).
   - **Language:** clear, formal and specific. English for titles/steps/expected results (Arabic UI text quoted exactly). No chat words ("I found", "we saw", "seems", "maybe"), no vague expectations ("works fine", "correct"). State the rule being tested.
   Report: «الريفيو: عدّلت X، ضفت Y، شلت Z».
4b. **Regression set — Claude picks it, the user does NOT review it.** Add the label `regression` to the tests that match this risk-based standard (about ¼–⅓ of the story's tests):
   1. the main happy path of every AC (one test per AC);
   2. anything with money / numbers: commission, amounts, discounts, coupons, totals;
   3. permissions / security: who sees what, 401/403, tokens;
   4. impact cases on older areas (impact table + area context file);
   5. the story's most important edge case.
   Never tagged: responsive / dark / localization (unless the story is about that UI), small single-field negatives, data-variant duplicates, performance, placeholders. `qa-signoff-auto` runs exactly this set before sign-off and `qa-live-test` runs it on Live. Report one info line «الريجريشن: N تستات» (not for review).
5. **Undefined behaviour → placeholder test** (`unresolved-testcase` label, Non Automatable, expected = "⚠ PENDING PM DECISION — … do not execute until confirmed."). Every open question on the story gets one.
   - **Exception — Salla-plan affiliate commission (the QA's rule):** the affiliate code/commission applies only to the merchant's plan subscription; renewals and upgrades never earn commission. Never write a test (or a placeholder / PM question) that expects commission on a renewal or upgrade. At most one Negative test "renewal/upgrade creates no commission".
6. **Expansion & Multimarket:** follow the PM gate in `expansion-multimarket.md`, but when unanswered create **one placeholder per dimension** (`[Expansion][SA/KW/UAE]`, `[Multimarket][SA/KW/UAE/BH]`), not one per country. Split per country only once the PM says yes.
7. **Find the sprint Test Plan** (search-first: `project = <KEY> AND issuetype = 'Test Plan' AND summary ~ '<sprint name>'`). Reuse it; never overwrite its description. Only if none exists create it per `test-plan-template.md`.
8. **Folders = the team's feature folders, not a sprint folder.** Inspect the tree with `getFolder(projectId, path:"/")` and pick the matching feature folder. Known CPD folders:
   - Affiliate / partner-portal affiliate features → `/Portal/Partners Area/[New] - Affiliate/Affiliate Products`
   - Merchant-side affiliate pages → `/Dashboard/Merchants Area/Marketing Tools/Affiliate`
   - Message Center → `/Portal/Partners Area/Message Center`
   - Other partner pages → the matching folder under `/Portal/Partners Area/…`
9. **Write the plan file** (in the scratchpad; each test row = `[title, layer, behavior, func, auto, pre, steps, exp, placeholder, regression]`, `regression` = true for the step 4b set) and run `xray-create.js` with `max=1` first; verify the pilot with `getJiraIssue` (fields) and `getCoverableIssues` (link). Then run it for `all`. Then read back: Test Plan total, each Set total, each story's coverage count.
10. **Xray access:** if the `xray-graphql` MCP is connected you may use it; otherwise use the scripts — never fall back to "manual steps" for Set/Plan/folder.
11. **PM comment — post automatically**, one per story that has placeholders or AC conflicts, via `addOrEditJiraIssueComment` with `contentFormat: "html"` and a real mention: `<span data-type="mention" data-user-id="<accountId>">@Name</span>`. Take the PM accountId from the story reporter / existing comment mentions; never guess. List each placeholder test key + its question, and each AC conflict.
12. **Follow-up:** create (or update) a scheduled task (`mcp__scheduled-tasks__create_scheduled_task`, Sun–Thu 10:00 and 16:00) whose self-contained prompt lists every placeholder key + question + story + Test Set + PM accountId, and applies PM answers: rewrite expected results, drop `unresolved-testcase`, set Test Category, mark Expansion/Multimarket N/A (`na-per-pm`, never delete) or split per country (create + link + add to Set/Plan). If a task `pm-replies-update-xray-tests` already exists, update its prompt to include the new stories instead of creating a second one.
13. **Close the "Writing Testcases" sub-task** of each story once its tests are created, linked, in the Set and in the Test Plan (verified in step 9): transition id `61` (`Closed`). Placeholders waiting for the PM don't block closing — they're tracked by the follow-up task. If a story's creation failed or is incomplete, keep its sub-task In Progress and say so in the report.
14. **Never delete** issues, links, set/plan memberships or folders. When the user corrects a requirement (e.g. "one code for monthly and yearly"), edit the affected tests in place with `editJiraIssue`.

## Report (Egyptian Arabic, short)
Per story: story type (UI / UI + backend / API-only), PRs read (or "no PR yet"), tests created (count), «الريجريشن: N تستات», Test Set key (created/reused), Writing Testcases sub-task key + final status, placeholders waiting for the PM. Then Test Plan key + total, the assumptions you made (surface, platform, folders), AC conflicts, and anything that failed. End with the remaining work (PM answers, test execution).
