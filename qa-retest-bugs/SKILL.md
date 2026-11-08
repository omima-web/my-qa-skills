---
name: qa-retest-bugs
description: Retest the QA's live Bugs on Salla CPD — Jira issues of type Bug (not Defect) that sit outside any story's scope, almost always found on Live (Production), and that a developer moved to Ready for Testing / Re-test or Deployed. Given bug keys (or none = every ready Bug the user reported), list them and go on without stopping, retest each one in their Chrome (Claude in Chrome) on Live with GIF + screenshot evidence, then act: Ready for Testing → Close the fixed ones, Reopen the rest (also partly fixed); Deployed → Approve the fixed ones, Decline the rest (never move a Deployed bug to Ready for Testing). Bugs Claude raised are acted on without the user's OK; bugs the user recorded themselves wait for the user's OK on the results first. Comment inside each bug and attach the evidence. No Xray execution and no story moves. Use when the user says "شيك على الباجات", "ريتست الباجات", "رنلي الباجات", "الباجات الجاهزة", or gives Bug keys to retest. Defects under a story ("رنلي الديفكتات", "شيك على الديفكتات") belong to qa-retest-defects.
---

# Retest live bugs

Reply in the user's language. Read `automation\CHROME-TEST-RUN-CONTEXT.md` first (Chrome tricks, evidence upload, window capture); append anything newly agreed.

## Bug vs Defect
- **Defect** = issue type `Defect`, a child of a story in the sprint, found while testing that story. Retested with `qa-retest-defects`, which also updates the story's Xray execution and the story status.
- **Bug** = issue type `Bug`, outside the scope of the task in hand, almost always on **Live**. No parent; at most a `Relates` link to an old story. When the user says "حوّل الديفكت ده باج", it becomes a live Bug and from then on belongs here.
- "شيك على الباجات" → this skill. "رنلي الديفكتات" / "شيك على الديفكتات" → `qa-retest-defects`. Never mix the two in one run; if a Defect is also ready, mention it in one line at the end.

## Constants (salla-dev)
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD`. The user's accountId comes from `atlassianUserInfo`.
- Ready for retest = Bug status `Ready for Testing` or `Re-test`, **or `Deployed`** (already on Live, waits on their «Deployed» approval in `customfield_10039`).
- **Never move a `Deployed` bug to Ready for Testing / Re-test**: it breaks the ticket's SLA time cycle. A Deployed bug is answered on its approval: fixed → Approve, not fixed → Decline (Decline sends it to `Preparing to Deploy`, assignee stays the dev).
- Approval API (no MCP op): in their Jira tab, `fetch('/rest/servicedeskapi/request/<KEY>/approval/<approvalId>', {method:'POST', headers:{'Content-Type':'application/json','X-ExperimentalApi':'opt-in','X-Atlassian-Token':'no-check'}, body: JSON.stringify({decision:'approve'|'decline'})})` → 200 with `finalDecision`. `approvalId` = `customfield_10039[].id` from `getJiraIssue`. The UI button can fail when the tab is hidden.
- Transitions: always read them with `listJiraIssueTransitions` and pick by name (Re-test, then Close / Done / Verified, or Reopen / Re-opened). Never guess an id.
- `customfield_10786` = Testing Environment (`Production` = Live, `Development Server` = Dev).

## Inputs
- **Bug keys** → only those.
- **No keys** → `project = CPD AND issuetype = Bug AND status in ("Ready for Testing", "Re-test", "Deployed") AND reporter = currentUser() ORDER BY priority DESC, updated ASC` with `summary,status,assignee,priority,description,comment,attachment,customfield_10786,issuelinks`. Page until isLast.
- **Environment = Live** unless the bug's Testing Environment says `Development Server` or the dev's last comment names another build/PR link. Take URLs and accounts from the bug's description.
- **The user logs in themselves** in Chrome (merchant, partner, admin) and enters OTPs. Claude never types real passwords. On Live use their test stores / marketers only (nasa login-as-store when it's up).

## Steps

### 1. Collect
- Run the query (or read the given keys). Also list in one line their Bugs that are **not ready** (Todo / In Progress / Code Review / EM Review / Re-opened…) — count only, never touch them.
- **Dev Rejected** bugs are the team leader's decision: one line, never retest or comment.
- `Preparing to Deploy` = not on Live yet → one line, not retested (Blocked) until it reaches Deployed / Ready for Testing.
- **Who raised it:** mark each ready bug **Claude-raised** (found and written by Claude: in a Chrome run / live test / regression, or a recorder report where Claude repeated the steps) or **the user's** (the user recorded it themselves). Check the area context file's bug history (who found each) and the bug's comments; unsure → treat it as the user's.
- Read the latest developer comment on each ready bug ("fixed in PR…", "deployed on…", "not a bug", "needs PM"). "Not a bug" / "needs PM" → listed for the user, not retested.
- If the dev mentions a PR, check it is merged and deployed to Live before testing (deploy date, or the change is visible). Not deployed yet → Blocked.

### 2. Show the list and carry on (no stop)
Table: bug | summary | priority | developer | last dev comment | environment | related story. Go straight to Chrome.

### 3. Prepare Chrome
- Load Claude in Chrome tools in one ToolSearch call; `tabs_context_mcp`, open a new tab.
- Ask the user to snap Chrome and Claude side by side (Win + arrows). The run tab must stay visible.
- Viewport: if `innerWidth` is under ~1000 while the window is wide, ask the user to dock DevTools at the bottom / close the side panel.

### 4. Retest each bug
- Same evidence routine as `qa-retest-defects` step 4: GIF per bug (`<BUG-KEY>_retest_<FIXED|FAIL>.gif`, labels + clicks on, no watermark, quality 10, < 10 MB), a `save_to_disk` screenshot at the verdict point, console / network errors noted. Browser-chrome bugs (tab title, favicon) → `capture-window.ps1` with the red banner.
- UI bugs: check the fix in AR + EN × Light + Dark when the bug is about colour/text/design , and compare with the reference module (`D:\omima-qa\context\ui-baseline.md`).
- **Area context:** if the bug touches affiliate, read `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (sync with Jira after its «آخر مزامنة مع جيرا» date first): part 6 before reopening (decisions / "not bugs"), part 7 (bug history), part 5 (impact map) → quick check of the areas the fix could break after a Fixed verdict. Other areas: their own context file if it exists.
- Verdict: **Fixed** / **Not fixed** / **Partly fixed** (say exactly what works and what doesn't) / **Blocked** (not deployed, data missing, needs an account the user hasn't opened).
- Live safety: never pay real money, transfer, or message real merchants / marketers; never change real merchant settings beyond what the bug needs, and undo test changes after.

### 5. Results and comments (stop only for the user's own bugs)
**Claude-raised bugs → no stop:** go straight to step 6 with the comments below, then report. **Their own bugs → stop** and show this message for the user's OK, until the user says the user trusts the checking (then drop the stop for them too and update this line).
The message (or, for Claude-raised bugs, the report in step 7):
- Table: bug | status | verdict | action (Close / Reopen / Approve / Decline / none) | evidence.
- The exact comment for each bug, in clean simple Arabic , no greeting, mention the developer:
  - Fixed: `تم التحقق على <env> بتاريخ <date> — تم الإصلاح.` + what was checked.
  - Not fixed: `ما زالت المشكلة موجودة على <env> بتاريخ <date>.` + actual vs expected.
  - Partly fixed: `تم إصلاح جزء من المشكلة على <env> بتاريخ <date>.` + ✅ what works + ❌ what still fails.
  - Deployed + Decline: end with `لذلك تم رفض الـ Deployed approval (Decline).`
Their own bugs: **wait for the user's OK.** The user may edit comments or change a verdict.

### 6. Apply (Claude-raised bugs right away; their own bugs after the user's OK)
**Status `Deployed`** (never move it to Ready for Testing / Re-test):
- **Fixed** → Approve the «Deployed» approval (API in Constants). Add the comment. Move to the active sprint as below.
- **Not fixed / Partly fixed** → Decline the approval. Add the comment. It goes to Preparing to Deploy with the same dev.

**Status `Ready for Testing` / `Re-test`:**
- **Fixed** → `Re-test` (if not already) → Close / Done / Verified. Add the comment.
  - **Move it into the running sprint:** a new Bug is born in the NEXT sprint so its points don't count before the fix; once it's fixed, move it to the active sprint: `listJiraBoardSprints` board 90 state `active` → `transitionJiraIssue` with only `sprintId` (or `editJiraIssue` Sprint field). Skip if it's already in the active sprint. Say it in the report («اتنقلت لسبرنت <name>»).
- **Not fixed / Partly fixed** → `Re-test` (if not already) → Reopen / Re-opened, assigned back to the same developer. Add the comment.
- **Blocked** → no change; tell the user what's needed.
- **Evidence:** save to `evidence\live-bugs\<BUG-KEY>\` (`<BUG-KEY>_retest_<n>_<what>.jpg`, `<BUG-KEY>_retest_video.gif`), then attach exactly as `qa-retest-defects` step 6 (skip files already attached; confirm with `getJiraIssue fields:["attachment"]` before saying it's attached).
- **Context file:** update the bug's line in the area's known-bugs part (e.g. affiliate part 7) with the new status and date.
- Jira MCP write timed out → treat as not posted; use Jira REST via fetch in their Chrome .
Read back each changed bug (status, assignee, comment, attachments).

### 7. Report
Table: bug | was | now (Closed / Reopened / Approved / Declined / Blocked / waiting) | evidence. Then what is still waiting on the dev or the PM, and one line if Defects are also ready ("فيه ديفكتات جاهزة كمان — قوليلي رنلي الديفكتات").

## Rules
- Claude-raised bugs: no stop, act and report. Their own bugs: one stop before any Jira change (step 5), until the user says otherwise.
- A Deployed bug is never moved to Ready for Testing / Re-test: Approve or Decline only.
- No Xray executions, no story transitions, no QA sub-task changes — Bugs live outside the sprint stories.
- Never create new Bugs here. A new, different problem found during retest → describe it in the report; the user records it (`qa-recorder-defect`) or asks for it.
- Never type passwords, OTPs or payment data.
- If Chrome isn't reachable, say so and stop. Don't switch to another browser without asking.
