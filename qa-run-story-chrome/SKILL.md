---
name: qa-run-story-chrome
description: Run a Jira story's written Xray test cases in your own Chrome (Claude in Chrome) on the Salla Dashboard / Partners Portal, record PASSED/FAILED in an Xray Test Execution, then turn every failure into a draft bug report. When a test fails the user starts their QA Bug Recorder capture and Claude repeats the bug's steps under it. The user reviews the drafts; only after their approval each Defect is created under the story through the recorder's own "Create in Jira" form (via qa-recorder-defect), classified Backend or Frontend, and assigned to the story's BE or FE developer (found from the story's dev sub-tasks). Use when the user says "رن الستوري", "run the story on Chrome", "شغّل التست كيسز على كروم", or gives a story key + environment to execute. Retesting defects the developer sent back belongs to qa-retest-defects.
---

# Run a story's test cases on Chrome

Reply in the user's language.

## Constants (salla-dev)
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD`, board 90 (Community). The user's accountId comes from `atlassianUserInfo`.
- Xray writes: `xray-graphql` MCP, fallback `node ~/.claude/xray-gql.js` (via the Salla gateway proxy on :8787).
- **Bugs and defects are created ONLY through the QA Bug Recorder form** (`qa-recorder-defect`, the QA 2026-10-25): the team's standard form, whoever creates it. Never `createJiraIssue` for a defect.
- Defect issue type `Defect` (id 10436), Related ticket = the story, in the story's sprint. A problem outside the story's scope (usually Live) is a **Bug**: Todo + next sprint .
- Defect fields (as on their existing defects, e.g. CPD-32980):
  | Field | Id | Value |
  |---|---|---|
  | Severity | `customfield_10710` | Blocker / Critical / Major / Minor (pick by impact) |
  | Testing Environment | `customfield_10786` | the run's env (`Production` for Live; read allowed values with `includeEditableFields` for Dev) |
  | Issue appears in | `customfield_10787` | `Partner Portal` / Merchant Dashboard / … (allowed values from the edit meta) |
  | Found by | `customfield_11964` | `QA` |
  | Priority | `priority` | Medium unless severity says otherwise |
  - Testing Environment allowed values: `Development Server`, `Beta`, `Stage`, `Production`. `YT Ticket Type` is NOT on the Defect create screen, so don't send it. Pass fields by name in `additional_fields` (`Severity`, `Testing Environment`, `Issue appears in: ["Partner Portal"]`, `Found by: ["QA"]`).
- Xray statuses that work: `PASSED`, `FAILED`, `BLOCKED`, `TO DO`. Batch them with aliased `updateTestRunStatus` / `updateTestRunComment` / `addDefectsToTestRun` mutations.
- **Close the cycle (after the user approves):** add a QA summary comment on the story (execution key, counts, defects table), then move the story with transition `Reopen` (id 131 → Re-opened) and assign it to the FE developer (or BE if all defects are BE).
- **Attachments: Claude attaches them itself** (the user doesn't want to do it by hand; verified 2026-10-07):
  1. Collect evidence into `evidence\<STORY-KEY>\`, named `<DEFECT-KEY>_<n>_<what-it-shows>.jpg`. Export each failure GIF with `gif_creator export download:true`, name it `<DEFECT-KEY>_video.gif`, and copy it there from Downloads.
  2. Before uploading, read the defect's `attachment` field and skip files already there, so nothing is duplicated.
  3. In their Chrome, open `https://salla-dev.atlassian.net/browse/<KEY>`. Run JS that waits for `input[type=file][data-testid=media-picker-file-input]`, makes it visible, and sets `aria-label='qa-attach-input-0'`. Then `find "qa-attach-input-0"` → `file_upload` (ref, paths). Up to 10 MB per call; several files are fine.
  4. Wait about 10–20 s (a GIF takes longer), then confirm with `getJiraIssue fields:["attachment"]`. Never say a file is attached before it shows up there.
  - Don't use the Jira media API with curl + token: the auto-mode classifier blocks it.
- Defect text = the QA Bug Recorder form's fields (step 4), formal Arabic. Same in `qa-recorder-defect`.

## Inputs the user gives per run
Story key(s) · environment (Dev / Live) + Dashboard and Portal URLs · test data the cases need. **The user logs in themselves** in Chrome (merchant, partner, admin) and enters OTPs; Claude never types real passwords. Ask only for what's missing.

## Steps

### 0. Story type — tell the user in the FIRST message of the run
Read the story, its PRs and the tests' `API-only` label, then open the run with one line:
- **API-only** (a public / partner API used with a token, no screen — e.g. Partner API): «⚠️ الستوري دي API بس، مفيش شاشة نرن عليها في كروم. هنرن الحالات في Apidog، وبعد أول رن نعمل لها سويت (`qa-api-suite`) للريتست والساين أوف واللايف. جهّزي: توكن read_write وتوكن read وأرقام اللينكات/الداتا اللي التستات محتاجاها.» Then run the cases with the user: the user sends each request in Apidog (Claude never uses their `prtapi_` token), pastes status + body, Claude judges against the test and records it. If the story already has a suite in `D:\omima-qa\apidog\`, run it through `qa-api-suite` instead of case by case.
- **UI + backend** (screens that call our backend): «خدي بالك: الستوري فيها باك اند، فهنعمل API test كمان (الطلبات اللي الشاشة بتبعتها)». Then the normal run below, and the API test in "Run-level checks" is **required**, not optional.
- **UI only**: normal run; API test = "not needed – FE-only, API unchanged".

### 1. Collect tests
- `getJiraIssue <story>` (view evidence) → summary, ACs, sprint.
- Tests linked to the story (Xray "Test" links / the story's Test Set / sprint Test Plan). Read each Test's steps (Preconditions → Steps → Expected).
- Order: happy paths / smoke first, then negative / boundary.
- **Impact cases on EVERY story, every run.** the QA doesn't know the code; Claude finds the impact. Before running:
  1. Find the story's PRs: `gh search prs "<STORY-KEY>" --owner SallaApp`, then for each open PR read the body and `gh pr diff <n> -R <repo> --name-only`. Also read the matching area context file (`D:\omima-qa\context\<area>-context.md`).
  2. List what the change touches **outside the new feature**: shared components / packages (e.g. a table used by other apps), moved pages (Vue → React), changed queries or ordering, shared traits / actions / middleware / auth config, feature flags, other modules that use the same code (`gh search code "<Component>" --owner SallaApp`).
  3. Show their one short table first, in Arabic: «⚠️ خدي بالك، الإمباكت هنا وهنا» — # · what changed · what can break · proposed case. Mark the top 2–3. Review the cases **together** (the user looks too); the user can drop or add.
  4. Write the agreed cases as Xray Tests linked to the story (title `[Impact][<area>]: …`), add them to the Test Set, the sprint Test Plan and this Test Execution, and run them with the same evidence rules. A failure is drafted as a defect like any other.
  5. Save the impact table in the area context file (impact map) and the run context, so the next story in that area starts from it. If the tech lead should confirm, draft a Slack DM (starts with «السلام عليكم») for the user OK.
- **Affiliate story → affiliate context + impact.** If the story touches affiliate (merchant `/marketing/affiliates`, partner-portal affiliate pages, Salla Plans affiliate codes), read `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` first (sync it with Jira after its «آخر مزامنة مع جيرا» date, same as qa-create-testcase-auto step 1a). Then, before running:
  - From Part 5 (خريطة الإمباكت), list the older areas this change can break that the linked tests don't cover, and show them to the user in one short «الإمباكت» list with the story each one protects. Run the quick checks yourself (same run, same evidence rules) unless the user says skip; a failure there is drafted as a defect like any other.
  - Use Part 6.1 (not bugs) before drafting any defect, and Part 7.1 to link a known open bug instead of writing it again.
  - Use the emails/notifications map (Part 4) to check what each action should send (to `<your-email>+<n>@salla.sa`), and mark the row "اتأكدنا" with the date after a real run.
  - New facts found in the run → add them to the file + a «سجل التحديثات» row.

### 2. Execute in Chrome
- **Recorder only when a bug shows up.** Run the tests without the recorder. When a test FAILS: finish Claude's own evidence (screenshot, GIF, logs), then stop and tell the user: «التست <KEY> فشل — افتحي QA Bug Recorder وابدئي Capture على التاب ده، وقوليلي.» After the user's OK, redo **only the bug's steps** on that tab (this is also the reproduction check), then: «اعملي Stop & review.» Take the new report id (`fetch('/api/reports?limit=5')` on the dashboard tab) and write it next to the failure (test key → report id). Claude can't press Start Capture / Stop (extension popup) and the dashboard has no "new report" button, so this is the only way a defect gets its recording. Passing tests never touch the recorder.
- Load Claude in Chrome tools in one ToolSearch call; `tabs_context_mcp`, open a new tab.
- **Feature flag first (do it yourself, don't ask the user for the name):** if the story's **Feature Flag** field (`customfield_19272`) is set, check that it's on: `document.querySelector('.vertical-layout').__vue__.$store.state.auth.settings.features.includes('<flag>')`. If it's off, enable it with DevTools **Override content**: Network → `GET api.salla.dev/partners/v1/api/private-settings` → right-click → Override content → add `"<flag>"` to the `features` array → Ctrl+S → reload with DevTools still open → check again. Full steps are in. Claude in Chrome can't click inside DevTools, so if you can't drive it, ask the user to do the override step and continue after. Never fake it by editing the store after load. If the flag still isn't on, every test is BLOCKED, not FAILED.
- Check the viewport: if `innerWidth` is under ~1000 while the window is wide, ask the user to close or narrow DevTools / the side panel before desktop tests. (DevTools must stay open for the override, so dock it at the bottom.)
- **Video (GIF) per test:** `gif_creator start_recording` → screenshot (first frame) → do the steps → screenshot (last frame) → `stop_recording`. Name it `<TEST-KEY>_<PASS|FAIL>.gif`. Keep the frames of FAILED tests for the defect (don't `clear` them until the defect is created); `clear` after PASSED tests. Export options: action labels + click indicators on, watermark off, quality 10. Keep each recording to one test so the GIF stays small (< 10 MB).
- Per test: do the steps on the given env, compare with Expected, take a screenshot (`save_to_disk`) at the verdict point. Note console errors / failing network calls (`read_console_messages`, `read_network_requests`) — they are the main BE/FE evidence.
- **On a FAILED test, decide right away (before leaving the page, the network log clears on navigation) whether the cause is clear:**
  - **Clear → short evidence only (the default):** one failing request whose error explains it (e.g. `404 page_not_found`, `422` + validation message); the API returned correct data but the UI shows it wrong; design / text / translation issues.
  - **Not clear → short evidence + full logs:** a `500` or server error with no clear message; the UI is wrong but no request failed and the console has no clear error; several requests failed and it isn't clear which one is the cause; the bug doesn't happen every time; can't tell BE from FE.
  - For "not clear", save the full logs now to `evidence/<STORY>/<TEST-KEY>_console.json` (`read_console_messages`, all levels) and `<TEST-KEY>_network.json` (`read_network_requests`, plus `read_network_requests requestId` bodies of the failed ones). Strip tokens, cookies and `Authorization` values before saving. Rename them to `<DEFECT-KEY>_…` when the defect is created.
- **Baseline tests** (written by qa-create-testcase-auto for every UI story):
  - `[Responsive]`: `resize_window` to 1440×900, 768×1024 and 375×812 in turn. At each width, screenshot and check `document.documentElement.scrollWidth <= innerWidth` (no horizontal scroll), plus nothing cut off and tabs/menus still usable. Resize back to the original size at the end.
  - `[Dark Mode]`: switch with the header moon icon, screenshot every screen of the story, then switch back to light.
- **Design + 4-mode UI check:**
  - Open the story's Figma first (link in the story / its comments). Use Figma MCP `get_metadata` to find the frames for each state (e.g. empty / created / used, new user / old user), `get_screenshot` for each, and `get_design_context` on the story's component to get the exact texts, font weights, sizes and colours.
  - Repeat the comparison in all **4 modes: Arabic-Light, Arabic-Dark, English-Light, English-Dark**. In each mode, read computed styles (`javascript_tool`: color, font-size, font-weight, border colour, background) for every element of the story. Compare each one with the design, and with the matching element in the neighbouring card on the same row (hint vs hint, title vs title, button vs button). "Readable" is not a pass: a hard-coded colour that differs from the neighbour (e.g. `dark:text-[#BFEFFF]` next to the portal's #E6E6E6) is a defect.
  - Texts: compare word for word with the design (missing words, bold/Medium parts) and check that English has no Arabic left in it and is LTR.
  - Put one screenshot per mode in `evidence/<STORY>/`, and write the mismatches (design value vs portal value) in the run comment and the defect draft.
- **Compare with the UI baseline:** every confirm dialog, toast, error banner, empty state, table and breadcrumb in the story is compared with the same element in the reference module listed in `D:\omima-qa\context\ui-baseline.md` (portal = Services for now; merchant dashboard: ask the user). Compare icon, colors, button order and names, wording, toast color/position, table pagination (cursor, not page numbers) and order (newest first, a new item appears at the top), in AR + EN × light + dark. Different from the reference = defect, even if it looks fine.
- **API evidence for Claude's own API checks:** log every in-page request (tokens and JWT masked) and, per test, render the log as a readable table overlay, screenshot it, save it as `evidence/<STORY>/<TEST>_claude_api-log.jpg` and attach it to the Xray run (`addEvidenceToTestRun`). Their Apidog screenshots go next to it as `<TEST>_omima_apidog_<what>.png`, with any token value masked before upload.
- **Mark every defect screenshot before attaching:** draw a red box and a short Arabic label on each problem (e.g. "زرار رمادي" next to "المفروض زي ده", "مفيش عداد هنا"). Use `your own `annotate-evidence` script (optional) -Spec <json>`, check the `_marked.png` with Read, then upload the marked files. The Jira tab must be the visible front tab during upload, or the files are silently dropped.
  - `[Security]` / `[Integration]` API tests: use `read_network_requests` and `javascript_tool` (`fetch` without credentials → 401; check the URL/body for tokens/PII; check `localStorage`). Never send their real token to another site.
  - `[Performance]`: reload the page, wait until it settles, then read with `javascript_tool`: `performance.getEntriesByType('navigation')[0]` (loadEventEnd, domContentLoadedEventEnd), LCP via `new PerformanceObserver(...).observe({type:'largest-contentful-paint', buffered:true})`, CLS via `layout-shift` entries, and the story's API calls from `performance.getEntriesByType('resource')` (duration, transferSize). Do the action (tab / search / page) and count the calls fired. Compare with the limits in the test (LCP < 2.5 s, load < 3 s, CLS < 0.1, API < 1 s, no duplicate calls, search debounced) and write the numbers in the run comment.
- **Edge / corner / impact tests are the most important ones for the QA.** Never skip them or mark them BLOCKED just because they take longer. Use real tricky input, do the corner actions for real (refresh, back, fast clicks, two filters together), and open each linked area named in the test to check it still works. If something extra looks risky while running, test it too and add it to the report.
- Result per test: PASSED / FAILED / BLOCKED (blocked = missing data, env down, needs an account switch the user hasn't done).
- **Run-level checks, done once per story run (qa-signoff-auto reads them later):**
  - **Console:** `read_console_messages onlyErrors` on every page of the story. There must be no JS errors from the story's micro-frontend. Report anything found as a defect draft.
  - **API test:** needed if the story adds or changes an endpoint, params, response, validation, or permissions. If so, check requests and responses from the network log (params, status, body fields, one negative case). If not, note the reason, e.g. "FE-only, API unchanged".
  - **Security test:** needed if the story touches auth, permissions, payments, PII, uploads, or new inputs. If so, check that no tokens or PII are in URLs or logs, nothing is stored in localStorage that shouldn't be, there's no mixed content, and endpoints that need permission return 401/403. If not, note the reason.
  - Write the three verdicts in the Test Execution **description**, in this format:
    `Console: clean | Security test: done – OK / not needed – <reason> | API test: done – OK / not needed – <reason>`
- Never pay real money / transfer on Live; ask before anything that messages real people.

### 3. Record in Xray (live, while running — the QA 2026-10-12)
- **Before the first test**, create-or-reuse Test Execution `execution for <story summary>`, sprint set, assignee = the QA, added to the sprint Test Plan; add the tests; move it to **In Progress** (transition 2; needs an assignee — new executions are born Closed).
- Set each run to **EXECUTING** when you start it, then PASSED / FAILED / BLOCKED + comment as soon as it finishes. Don't batch results at the end.
- Set each run status; on FAILED attach the screenshot + a comment (actual vs expected).

### 4. Draft bug reports — DO NOT create yet
For every FAILED test (merge duplicates that share one root cause) write a draft **in the QA Bug Recorder form's own fields — that form is the official template**, written in formal Arabic (ISTQB style, "الكلام رسمي، والصيغة ستاندرد"):

- **Summary:** `[المكان][الموديول] <الخطأ> + <الشرط>`, one sentence, e.g. `[Partners][Partner API] لا يُنشأ كود للمسوق الفرعي في فرص الخدمات عند إرسال parent_link_id`. No «انظر الصورة/الفيديو».
- **Description:** short facts only — الوصف (سطر واحد)، الشروط المسبقة، التكرار (3/3 أو x/3)، الحساب (بدون كلمات مرور)، الطلب الفاشل (method + endpoint + status + error body أو خطأ الكونسول — always present)، التست المرتبط (Xray Test + execution). The recorder adds its own Environment section and the evidence list, so don't repeat them.
- **Steps:** أقل عدد خطوات، بالبيانات الفعلية (القيم، الروابط، الـ endpoint والـ body)، one per line.
- **Expected:** القاعدة الصحيحة ومصدرها (AC، الديزاين، البورتال، قرار الفريق).
- **Actual:** ما يحدث فعلًا، بالقيم.
- **Technical Analysis:** الطلب أو الخطأ الأساسي فقط.
- **Possible Root Cause:** سطر واحد، ويُكتب أنه احتمال.

**Fields:** Severity = impact on the user (Blocker / Critical / Major / Minor); Priority = business urgency (separate decision) · Issue appears in · Testing Environment.

**Language rules (title + body):** clean, formal Arabic (light MSA), present or passive verbs (يُطبَّق، لا يظهر، يُرجِع), one idea per sentence. **Forbidden:** first person and chat words («لقيت»، «شفت»، «ما عنديش»، «جربت»، «عندي»، «مش بيقرأ»), guesses in the body («غالبًا»، «يمكن»), and extra numbers that don't prove the bug. State the rule that is broken. Technical names (endpoint, field, code) stay in English inside `code`.
- **Full logs** (only when the cause is not clear, see step 2): add the line `السبب غير واضح من الواجهة، والكونسول والنتوورك كاملين مرفقين.` and list the two JSON files with the GIF. Say in the draft which case it is (short / full) so the user can change it.
- **Layer: Backend or Frontend**, with the reason:
  - **Backend** → API returns 4xx/5xx, wrong/missing data in the response, wrong calculation, email/notification/webhook not sent, permission/validation wrong server-side.
  - **Frontend** → API response is correct but the UI shows it wrong; layout/RTL/translation/text issues; button/state/validation only in the client; console JS error with a good response.
  - Unclear → say so and propose the most likely one; the user decides.
- **Assignee** (see step 5) — shown in the draft.

Show all drafts to the user in one message (table + full text) and **stop**. Wait for the user review: the user may edit, drop, merge, or change BE/FE.

### 5. Find the developers (from the story's sub-tasks)
`parent = <story> AND issuetype in subTaskIssueTypes()` with `summary,assignee,status`:
| Layer | Sub-task summary starts with (case-insensitive) |
|---|---|
| Backend | `Backend \|`, `BE \|`, `BE Implementation`, `Backend Implementation`, `API` |
| Frontend | `Frontend \|`, `FE \|`, `FE Implementation`, `Frontend Implementation` |
Ignore QA sub-tasks (`Writing Testcases`, `Testing`), `Multi-Market Support`, `Review`. Developer = that sub-task's assignee. If several, prefer the non-Done one; if the matching sub-task has no assignee or doesn't exist, leave the Defect unassigned and flag it to the user.

### 6. Create approved defects (only after their explicit OK)
- **Through the recorder, never `createJiraIssue`:** for each approved draft run `qa-recorder-defect` way B on that failure's report id: Defect + Related ticket = story (or Bug + next sprint for an out-of-scope Live problem), Assignee = BE or FE developer, Priority, Sprint, Found by QA, Issue appears in, then the approved Summary / Description / Steps / Expected / Actual / Technical / Root cause, Create in Jira. Then Severity, Testing Environment, QA Engineer as in that skill. The recorder attaches its own video + logs.
- If a failure has no recording (the user couldn't capture), tell the user and ask before anything else; don't create it outside the recorder.
- **Attach Claude's own evidence** (marked screenshots, the test GIF, full logs) on the new Defect page (`https://salla-dev.atlassian.net/browse/<KEY>`), or with `uploadAttachmentToJiraIssue` (phase 1 → curl → phase 2):
  - GIF: `gif_creator export` with `coordinate` = the issue's attachment / description drop zone (drag-drop upload — no download to the user PC). If the drop doesn't land, ask the user before `download: true` (downloads need the user's OK), then upload the file with `file_upload`.
  - Screenshot: `find` the attachments file input → `file_upload` with the saved screenshot path.
  - Full logs (only for "not clear" defects): upload `<DEFECT-KEY>_console.json` and `<DEFECT-KEY>_network.json` the same way, then confirm they show in `attachment`.
  - The title never carries «انظر الفيديو/الصورة»; the evidence is listed under «الأدلة».
  - Also attach the GIF to the failed Xray test run (evidence) when possible.
  - If upload fails, say so and leave the file paths in the description — never claim a video is attached without seeing it on the page.
- Link the Defect to the failed Xray test run (Xray "defects" on the run) when the API allows.
- Read back each created Defect (parent, assignee, fields).

### 7. Report
Table: test key | result | defect (key, BE/FE, assignee). Then counts passed/failed/blocked, the Test Execution link, and anything the user must do (blocked tests, unassigned defects).
- **API-only story:** end with «الخطوة الجاية: نعمل السويت» and run `qa-api-suite` (build) right after the user's OK, so the retest, sign-off and live run use it.

### 8. Close the "Testing | <story>" sub-task (the user tests too, so ask first)
- Ask their one question and **stop**: "خلّصتي التست بتاعك على <story>؟"
  - If the user says no or isn't done yet: do nothing more. Wait until the user says the user's done (e.g. "خلصت").
  - If the user says yes: go on.
- Find the sub-task `Testing | <story>` (QA sub-task, In Progress). Add a comment and move it to Closed:
  - Bugs were raised: `تم الانتهاء من الاختبار، وفي انتظار حل الملاحظات` and list the Defect keys.
  - No bugs: `تم الانتهاء من الاختبار`.
- If there were **no bugs**, continue straight into the sign-off (`qa-signoff-auto` for the story) without asking again. If there were bugs, stop here; sign-off waits for the fixes (`qa-retest-defects`).

## Retest
Retesting defects that the developer moved back to Ready for Testing / Re-test is handled by the separate skill `qa-retest-defects` ("ريتست" / "رنلي الديفكتات"). Don't do it here.

## Rules
- Never create a Defect, comment, or message without their approval of that specific draft.
- Defects / Bugs only through the QA Bug Recorder form (`qa-recorder-defect`); the user captures each bug's reproduction when it shows up.
- Never type passwords, OTPs, or payment data. Never touch dev sub-tasks. The only QA sub-task you close is `Testing | <story>`, and only after the user says the user finished their own testing (step 8).
- One story at a time unless the user asks for the whole plan.
- If Chrome isn't reachable, say so and stop — don't switch to another browser without asking.
