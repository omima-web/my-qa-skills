---
name: qa-retest-defects
description: Retest Salla CPD defects that developers moved back to Ready for Testing / Re-test. Given one or more story keys (or none = all of the QA's open-sprint stories plus defects the user reported), list the ready defects and go on without stopping, retest each one in their Chrome (Claude in Chrome) on the story's own environment with GIF + screenshot evidence, show the results and the drafted comments for the user OK, then Close the fixed ones, Reopen the rest (also partly fixed), comment inside each defect, and set the linked Xray tests to PASSED. Use when the user says "ريتست", "retest", "اعمل retest", "رنلي الديفكتات", "شيك على الباجات", or gives story keys to retest. First-time runs of a story's test cases and new defects belong to qa-run-story-chrome.
---

# Retest defects

Reply in the user's language.

The user checks for ready defects themselves and runs this skill when the user wants. There is no scheduled detection task. Never create a notify or check routine for this.

## Constants (salla-dev)
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD`. The user's accountId comes from `atlassianUserInfo`. QA Engineer field `cf[16280]`.
- Xray writes: `xray-graphql` MCP, fallback `node ~/.claude/xray-gql.js` (via the Salla gateway proxy on :8787). Statuses that work: `PASSED`, `FAILED`, `BLOCKED`, `TO DO`. Batch them with aliased `updateTestRunStatus` / `updateTestRunComment` / `addDefectsToTestRun` mutations.
- Ready for retest = Defect status `Ready for Testing` or `Re-test`.
- Story reopen transition: `Reopen` (id 131 → Re-opened). Defect transitions: always read them with `listJiraIssueTransitions` and pick by name (Re-test id 41, then Close / Done / Verified, or Reopen / Re-opened). Never guess an id.

## Inputs
- **Story keys** (one or several) → only those stories' defects.
- **No keys** ("ريتست" / "رنلي الديفكتات") → every ready defect under their open-sprint stories plus defects the user reported in open sprints:
  - Stories: `project = CPD AND sprint in openSprints() AND issuetype = Story AND cf[16280] = currentUser()`
  - Defects: `project = CPD AND issuetype = Defect AND status in ("Ready for Testing", "Re-test") AND (parent in (<story keys>) OR (reporter = currentUser() AND sprint in openSprints()))`
- A ready defect is retested whoever reported it (hers or someone else's), as long as it is under the given stories.
- **Environment = the story's own environment, always.** If the story was tested on Live → retest on Live. If it was tested on Dev → use the Dev/PR link written in the story or its tasks. Take it from the defect's `Testing Environment` and the URLs in its description, and the story's last execution. Ask their only if it's still unclear.
- **The user logs in themselves** in Chrome (merchant, partner, admin) and enters OTPs. Claude never types real passwords.

## Steps

### 1. Collect ready defects
- For each story: `parent = <story> AND issuetype = Defect` with `summary,status,assignee,description,comment,attachment,customfield_10786,issuelinks`.
- Split into **ready** (Ready for Testing / Re-test) and **not ready** (Todo / In Progress / Dev Review / Pending…: list them only, never touch them).
- **Dev Rejected** defects are the team leader's decision, not hers: list them in one line, never retest, comment on or suggest anything about them.
- Read the latest developer comment on each ready defect ("fixed in PR…", "deployed on…", "not a bug", "needs PM").
- Find the Xray tests linked to each defect (the failed test run it was added to, or its issue links).

### 2. Show the list and carry on (no stop)
One short table: story | defect | summary | developer | last dev comment | environment | linked tests. Below it: the not-ready ones and anything marked "not a bug" / "needs PM" (those are not retested, the user decides).
**Don't wait for the user OK here**: every Ready for Testing / Re-test defect gets retested. Go straight to Chrome.

### 3. Prepare Chrome
- Load Claude in Chrome tools in one ToolSearch call; `tabs_context_mcp`, open a new tab.
- Ask their to snap Chrome and Claude side by side (Win + arrows). The run tab must stay visible.
- If the story has a **Feature Flag** (`customfield_19272`), check it's on and do the DevTools override exactly as in `qa-run-story-chrome` . Flag off → defect is BLOCKED, not failed.
- Viewport: if `innerWidth` is under ~1000 while the window is wide, ask the user to dock DevTools at the bottom / close the side panel.
- If the dev mentions a build or PR, check that build is the one deployed before testing.

### 4. Retest each defect
- **GIF per defect:** `gif_creator start_recording` → screenshot (first frame) → do the reproduction steps from the defect description → screenshot (last frame) → `stop_recording`. Name it `<DEFECT-KEY>_retest_<FIXED|FAIL>.gif`. Export options: action labels + click indicators on, watermark off, quality 10, < 10 MB.
- Screenshot (`save_to_disk`) at the verdict point. Note console errors / failing network calls.
- **Evidence must show the thing the defect is about.** Browser-chrome bugs (tab title, favicon, URL) are outside the page viewport, so a Chrome-extension screenshot can't show them. Run `your own `capture-window` script (optional) -Match "<window title text>" -Out <png>`. It captures just that Chrome window, tab strip included. Chrome cuts long tab titles short, so add a red banner on top with the full `document.title` and the expected title. Also record `document.title` / `lang` from JS.
- Take a quick look around the same area for side effects.
- **Affiliate defect → impact check.** If the defect or its story touches affiliate, read `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (sync it with Jira after its «آخر مزامنة مع جيرا» date first). From its impact map (part 5), find the areas the fix could break and check them quickly after a Fixed verdict. Report them as "مناطق اتأثرت واتشيّكت" in step 5. Also look in its bug history (part 7) so you don't call a known open live bug a new problem, and in part 6 (decisions + "not bugs") before you reopen anything: a behaviour listed there is not a failure.
- Verdict per defect:
  - **Fixed** → everything in the defect works now.
  - **Not fixed** → still reproducible.
  - **Partly fixed** → some parts work and some don't. Say exactly which part works and which doesn't.
  - **Blocked** → env down, missing data, flag off, or needs an account switch the user hasn't done.
- Never pay real money / transfer on Live; ask before anything that messages real people.

### 5. CHECKPOINT — show results and drafts, then stop
The only stop in the run. Fixed → evidence + Close, not fixed / partly fixed → evidence + Reopen; the user just reviews the final result first (kept for now while the user trusts the flow, 2026-10-08). One message:
- Table: defect | verdict (Fixed / Not fixed / Partly fixed / Blocked) | action (Close / Reopen / none) | evidence.
- The exact comment that will go **inside each defect**:
  - Fixed: `Verified on <env> <date> — fixed.` + what was checked + evidence.
  - Not fixed: `Still reproducible on <env> <date>.` + what still happens (actual vs expected) + evidence.
  - Partly fixed: `Partly fixed on <env> <date>.` + ✅ what works now + ❌ what still fails + evidence.
- The Xray updates (tests → PASSED / FAILED) and the planned story move.
**Wait for the user OK.** The user may edit comments or change a verdict.

### 6. Apply (only after the user's OK)
For each defect:
- **Fixed** → transition to `Re-test` (if not already) → the Close / Done / Verified transition. Add the comment.
- **Not fixed / Partly fixed** → transition to `Re-test` (if not already) → the Reopen / Re-opened transition, assigned back to the same developer. Add the comment.
- **Blocked** → no change. Tell their what's needed.
- **Attach evidence (Claude does it itself):**
  1. Put evidence in `evidence\<STORY-KEY>\`, named `<DEFECT-KEY>_retest_<n>_<what-it-shows>.jpg` and `<DEFECT-KEY>_retest_video.gif` (export with `gif_creator export download:true`, copy from Downloads).
  2. Read the defect's `attachment` field first and skip files already there.
  3. In their Chrome open `https://salla-dev.atlassian.net/browse/<KEY>`, run JS that waits for `input[type=file][data-testid=media-picker-file-input]`, makes it visible and sets `aria-label='qa-attach-input-0'`; then `find "qa-attach-input-0"` → `file_upload` (ref, paths). Max 10 MB per call.
  4. Wait about 10–20 s, then confirm with `getJiraIssue fields:["attachment"]`. Never say a file is attached before it shows up there. Don't use the Jira media API with curl + token.

**Xray:**
- Create a NEW Test Execution `retest execution for <story summary>` (sprint set, added to the sprint Test Plan) with the tests linked to the retested defects plus the tests that were FAILED / BLOCKED last time. Leave the old execution untouched.
- Every test linked to a **closed** defect → **PASSED** (so it no longer blocks coverage). Tests linked to a reopened defect → FAILED, with the defect linked to the run.

**Story:**
- All defects closed and every test passed (only PM-pending ones may remain) → move the story to its next QA-done status (read the transitions), mark their QA sub-task Closed, add a summary comment.
- Anything reopened → story goes to / stays `Re-opened` (id 131), assigned to the developer who owns the reopened defects. Add a summary comment.

Read back each changed defect (status, assignee, comment, attachments).

### 7. Report
Table: story | defect | was | now (Closed / Reopened / Blocked / waiting) | evidence. Then the retest execution link(s), the Xray tests set to PASSED, and what is still waiting on the dev or the PM.

## Rules
- One stop every run: before any Jira or Xray change (step 5). No stop after the list. Nothing changes in Jira or Xray without the user's OK.
- Never create new Defects here. A new, different bug found during retest → describe it in the report and suggest running `qa-run-story-chrome` for it.
- Never touch dev sub-tasks or defects that are not ready.
- Never type passwords, OTPs or payment data.
- If Chrome isn't reachable, say so and stop. Don't switch to another browser without asking.
