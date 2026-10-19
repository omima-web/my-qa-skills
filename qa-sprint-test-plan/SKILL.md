---
name: qa-sprint-test-plan
description: Runs the QA's sprint Xray Test Plan (Jira project CPD, modelled on CPD-32078) through its whole life. Given a sprint number (e.g. 26.4.2) or a Test Plan key, it finds the sprint's Test Plan assigned to the user and runs the phase that fits today. START moves the plan to In Progress, points the description at the new sprint (dates, sprint goal, scope / out-of-scope tables), moves their four saved filters (10732, 10669, 10142, 21714) to the new sprint, adds the "Partners Sprints QA Report for Testers" and "QA Sign Off List" comments with empty values, and schedules the next phases. REVIEW moves it to In Review a few days in. CLOSE adds every sprint Test Execution to the plan, fills the sign-off numbers, takes real screenshots of the QA report dashboard and the Xray Test Coverage report, warns their loudly if coverage isn't 100%, and closes the plan. Use when the user asks to create, start, update, review, or close the sprint test plan / تيست بلان السبرنت.
---

# Sprint Test Plan — autonomous

Runs end-to-end without questions. Report in Egyptian Arabic. Never echo the Test Data credentials that sit in the plan description.

## Constants (salla-dev)
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD` (Xray projectId 10146), board 90 (Community). the QA = the user's accountId (from `atlassianUserInfo`).
- Reference plan: **CPD-32078** (shape) and **CPD-32982** (26.4.1, the first plan run by this skill — copy its description shape: red `#ff5630` headings, dark-red `#bf2600` sub-headings, Sprint Scope / Out of Scope as Jira table block-cards). Summary: `Community | Sprint <x.y.z> Test Plan`.
- Test Plan transitions: In Progress `2` (fallback `41` "Start"), In Review `71`, Closed `3`, Todo `4`.
- Sprint field `customfield_10020` (id, name, startDate, endDate, goal). Defect "Reject Reason" = `cf[10783]`.
- QA report dashboard: `https://salla-dev.atlassian.net/jira/dashboards/10208` (gadgets read filter 10142).
- Xray Test Coverage link — fixed, made by their 2026-10-06:
  `https://salla-dev.atlassian.net/plugins/servlet/ac/com.xpandit.plugins.xray/test-coverage-report-page?project.key=CPD&project.id=10146&ac.reportId=6ac55c1d29dea6e107d2e65e`
  The link opens with its own saved filters **Project = CPD + Sprint = 26.4.1** (Saved Filter empty), so it does NOT follow filter 21714 by itself. Each CLOSE, set the view yourself before the screenshot (view only, nothing is saved): Filters → Basic → **Saved Filter** = `Test Coverage - Current Sprint` (type "Test Coverage" and pick it), clear the **Sprint** ⓧ, keep Project, **Apply**, wait ~15s. Never press **Share** (it re-saves the shared link; auto mode blocks it as a shared-resource edit).
- Helper `node ~/.claude/skills/qa-sprint-test-plan/scripts/testplan.js` (Xray via the MCP creds in `~/.claude.json`):
  - `stats <plan> <sprintId> <sprintStartISO>` → plan tests by latest status, `executed`, `pending`, `sprintTests`, `coverage` + `covCount` (same set as the Xray coverage report), executions in plan + `executionCandidates`.
  - `add-execs <plan> <KEY,KEY>` → `addTestExecutionsToTestPlan`, returns the new count.
  - `rewrite-desc <in.html> <out.html> <sprint.json>` → sprint ids (links and block-card JQL), dates, sprint goal, sprint number.
  - `render <stats.json> <outDir> <defects.json>` → fallback `coverage.png` + `qa-report.png` (only when Chrome isn't available).
- Comment templates: `references/comments.md`. Work files go in the scratchpad.
- Permissions the user granted in `~/.claude/settings.json` (2026-10-06): Jira edit/transition/comment/create/executeWrite, Xray query, scheduled tasks, this script, the media upload curl, Claude in Chrome navigate/computer/javascript/tabs.

## Their saved filters — moved to the new sprint every START
| Filter | Used by | JQL |
|---|---|---|
| **10732** Total Test Cases | Sign Off "Total Test Cases link" | `project = CPD AND type = Test AND sprint = <id> ORDER BY created DESC` |
| **10669** Defects Found & Solved | Sign Off "Defects Found & Solved link" | `project = "CPD" AND type = Defect AND sprint = <id> ORDER BY cf[10783] DESC, status ASC, created DESC` |
| **10142** list of bugs for sprint | the 3 gadgets of dashboard 10208 (Comment 1) | `project = "Community Products Delivery [Partner]" AND type = Defect AND sprint = <id>` |
| **21714** Test Coverage - Current Sprint | Saved Filter picked in the Xray Test Coverage view at CLOSE | `project = CPD AND sprint = <id> AND type != "Test Set"` (Test Sets are never counted in coverage) |

Description scope tables (inside the description, rewritten by `rewrite-desc`):
- Sprint Scope: `project = CPD AND type = Story AND Sprint = <id> ORDER BY cf[10019] ASC`
- Out of Scope: `project = CPD AND Sprint = <id> AND type = "Non Testable Task" ORDER BY cf[10019] ASC`

## Step 0 — sprint, plan, phase
1. Sprint: from the number the user gives (`listJiraBoardSprints` board 90, name `Community | Sprint <x.y.z>`), else the active sprint on board 90.
2. Plan: `project = CPD AND issuetype = "Test Plan" AND (sprint = <id> OR summary ~ "<x.y.z>") ORDER BY created DESC`, prefer the one assigned to the user. Read it (`getJiraIssue`, `view: full`, `responseContentFormat: html`) and its comments (`listJiraIssueComments`, html). Comment 1 = body contains `Partners Sprints QA Report for Testers`; Comment 2 = body contains `QA Sign Off List`.
   - None exists → create it (`createJiraIssue`, type `Test Plan`, summary as above, assignee their, Sprint `<id>`) with the description of the most recent `Community | Sprint … Test Plan`, then START.
   - Assigned to someone else → leave it alone and report.
3. Phase: what the user names, else by status/date — Todo/Backlog → START; In Progress and ≥ 3 days after sprint start → REVIEW; on/after the sprint end date (or the user says close/اقفل) → CLOSE. Every phase is idempotent.

## START (sprint day 1)
1. Transition to **In Progress** (`2`; `41` if `2` asks for screen fields).
2. **Description:** save the html to `desc.html`, write `sprint.json` (`id,name,startDate,endDate,goal` from the Sprint field), run `rewrite-desc`, then `editJiraIssue` (`contentFormat: html`) with the output. Keep every other node as it is (Test Data, strategy, colors, criteria, risks). No sprint goal → keep the existing goal. Check: no old sprint id left (links and block-card JQL), dates = sprint dates (Riyadh), number = new sprint. If the old description is plain (no colors / plain links), rebuild it in the CPD-32982 shape.
   - Known limit: the Jira HTML converter drops `mailto:` links, so the Test Data emails stay plain text. Don't fight it; mention it only if the user asks.
3. **Filters → new sprint** (all four in the table), via Claude in Chrome, in the Jira UI — not with REST fetch calls (auto mode blocks those as shared-resource edits):
   1. `navigate` to `https://salla-dev.atlassian.net/issues/?filter=<filterId>`, wait ~6s, click **JQL** if Basic is active.
   2. Click the JQL box, `ctrl+a`, type the JQL with `<id>`, Enter, wait ~10s (slow page; retry a timed-out screenshot after a few seconds).
   3. **Save filter → Save changes.** If auto mode blocks the Save click (shared-resource edit), leave the new JQL typed in the tab and ask the user to press **Save filter → Save changes** themselves, then continue.
   Verify all four with `listJiraFilters` (`id: [<filterId>]`, `expand: jql`, one call per id). Skip a filter already on `<id>`. If Chrome isn't connected, report it and list the JQLs. Never create or share filters/dashboards.
4. **Comments** (skip one that already exists): Comment 1 (heading + dashboard 10208 embed, no image) and Comment 2 (Sign Off, empty values, links to filters 10732 / 10669 and the coverage link, Test Plan link = this plan) from `references/comments.md`.
5. Run `stats`, then `add-execs` for any `executionCandidates`.
6. Schedule with `create_scheduled_task` (one-time `fireAt`, `+03:00`; skip an id that already exists):
   - `test-plan-review-<x-y-z>` at sprint start + 3 days, 10:00 → "Invoke the Skill tool with skill `qa-sprint-test-plan` (do not Read the SKILL.md path): phase REVIEW for Test Plan <KEY> (sprint <x.y.z>, id <id>, start <startISO>). Run autonomously, report in Egyptian Arabic."
   - `test-plan-close-<x-y-z>` on the sprint end date, 12:00 → same, phase CLOSE (add end date and the two comment ids).
   Tell their these run only while the Claude app is open (else on next launch), and CLOSE needs Chrome open with the extension connected.
   Routine permissions: if `~/.claude/skills` is a junction/symlink to a folder outside the work folder, any Read there asks for approval and an unattended run waits forever. Add a `Read(<that folder>/**)` rule to `permissions.allow` in `~/.claude/settings.json` (auto mode won't let Claude edit settings.json; the user adds it). If it's missing, warn in the START report.
   Cleanup: `list_scheduled_tasks`, then `delete_scheduled_task` for every `test-plan-review-*` / `test-plan-close-*` of an older sprint that has already run (never the new sprint's, never one that hasn't fired yet). One-time tasks only auto-disable after firing; this keeps their Routines list clean.

## REVIEW (≈ 3 days in)
Transition to **In Review** (`71`). `stats` + `add-execs` for new candidates. Check the four filters are on `<id>` (fix as in START step 3). Report the counts.

## CLOSE (sprint end)
1. **Test Executions:** `stats`, `add-execs` with every candidate, re-run `stats`, confirm `executionCandidates` is empty.
2. **Defects** (JQL on `project = CPD AND type = Defect AND sprint = <id>`): total; rejected = `AND cf[10783] is not EMPTY`; solved = `AND statusCategory = Done AND cf[10783] is EMPTY`; open = `AND statusCategory != Done`. If a rejected defect is Re-opened, say so in the report.
3. **QA report screenshot** (Claude in Chrome, fresh tab): open dashboard 10208, wait ~15s for the 3 gadgets, `computer` `zoom` of the dashboard area with `save_to_disk: true`, check it shows this sprint's defects (Total Issues = defects total).
4. **Coverage screenshot** (fresh tab): open the coverage link, wait ~20s (Xray is slow; open a new tab if one freezes). Set the view to Saved Filter 21714 as in Constants (Saved Filter → clear Sprint → Apply; never Share). `zoom` of the report area with `save_to_disk: true` (scale 1); the bar must match `covCount` without the Test Sets.
5. **Upload** each screenshot (copy the saved file to the scratchpad with a clear name first): `uploadAttachmentToJiraIssue` phase 1 → run the `uploadCommand` → keep the returned `id` + `collection` (no phase 2). Fallback without Chrome: `render` and upload those PNGs, and say so.
6. **Comment 2 (Sign Off):** Total Test Cases = `sprintTests`, Executed = `executed` (plan tests with a run ≠ TO DO), Pending OR Blocked = `pending`, Defects = Total / solved / rejected; coverage cell = note + coverage screenshot (template).
7. **Coverage must be 100% green:** drop every `Test Set` item from `stats.coverage` (summary starts with `Test Set |`), then every remaining item must be `OK`. If not: check each not-OK story's status — when it isn't done on the dev side it spills over to the next sprint. Red note in the coverage cell (template): the not-OK stories are not finished on the development side and spilled over to Sprint <next>, the gap is not on the QA side, then the keys with their status, then "Test Sets are not counted in the coverage." Still close, and open the report with **⚠️ Test coverage مش 100%** + the keys and statuses.
8. **Comment 1:** keep heading + embed, append the dashboard screenshot.
9. Transition to **Closed** (`3`). Read back status and both comments, then report.

## Rules
- Only touch the sprint's Test Plan, its two comments and the four filters. Never delete issues, comments, executions, tests or attachments; in Xray only `addTestExecutionsToTestPlan`.
- Never echo the Test Data credentials in chat.
- One failing step doesn't stop the rest — report it.

## Report (Egyptian Arabic, short)
Coverage warning first if any. Then plan key + link, phase, status before → after, description changes, filters moved, comments added/updated, executions added, sign-off numbers, scheduled tasks, failures.
