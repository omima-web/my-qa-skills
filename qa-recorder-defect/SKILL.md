---
name: qa-recorder-defect
description: Turn a bug the QA recorded themselves with the Salla QA Bug Recorder (Maher's Chrome extension + dashboard qa-recorder.dev.salla.group) into a clean Jira Defect under the right CPD story. Finds their newest recording by itself, finds the story from the recorded page URL (or asks), reads the captured steps / console / network, writes the summary, steps, expected and actual in their clean Arabic style, fills every Jira field (Defect, Related ticket, Found by QA, Issue appears in, Priority, Assignee = story's BE or FE dev, Severity, Testing Environment), shows their the draft, and only after the user's OK creates it from the recorder so the video, HAR and logs are attached. Use when the user says "خلصت تسجيل", "سجلت باج", "اكتب الباج من الريكوردر", "اعمل الباج من التسجيل", or sends a qa-recorder link. Bugs Claude finds itself during a Chrome run belong to qa-run-story-chrome.
---

# Recorder bug → Jira Defect

> Shared by Omima Mohammed (QA, Partners squad, Salla). Defaults are set for Jira project `CPD`; change the Constants (project, board, fields, filters) for your squad before using it.

Reply in the user's language.

## Constants
- Dashboard: `https://qa-recorder.dev.salla.group/dashboard`. Report page: `/bugs/<id>?tab=jira`. The user is logged in there in their Chrome (Claude in Chrome).
- The dashboard's own API works from a tab on that site (same origin, no token): `fetch('/api/reports?limit=15')`, `/api/reports/<id>/actions`, `/console`, `/network`. No MCP and no API docs exist yet (Maher, 2026-10-15). URLs with query strings get blocked in tool output, so print only host + path.
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD`. The user's accountId comes from `atlassianUserInfo`. Story test link field `customfield_11949`, QA Engineer `customfield_16280`.
- Fields the recorder does NOT fill (set them after create): Severity `customfield_10710` (Blocker / Critical / Major / Minor), Testing Environment `customfield_10786` (`Development Server` / `Beta` / `Stage` / `Production`).

## Inputs
The user says the user finished recording. Optional: the story key, one sentence about the bug, the page area. Ask only for what you can't find.

## Steps

### 1. Find the recording
- Open the dashboard in a new tab, then `fetch('/api/reports?limit=15')`. Take their newest report (`reporterName` = <your name>, status DRAFT, not in Jira).
- If its `pageUrl` is the recorder itself, a Jira page, or Google Meet, it's a test recording: tell the user and ask which one the user meant. Never create a Jira issue from it.

### 2. Find the story
- If the user gave the key, use it.
- Else match the report's `pageUrl` host to `customfield_11949` (Test Link) of their open-sprint stories: `project = CPD AND sprint in openSprints() AND cf[16280] = currentUser() AND issuetype = Story`. One match → use it. None or several → ask the user "الباج ده على أنهي ستوري؟" and stop.
- Read the story (summary, ACs, linked tests). If it touches affiliate, read `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (sync it with Jira first) and check its bug history so you don't raise a known open bug again.

### 3. Read the evidence
- `/actions` → the real steps the user did (page, clicks, typed fields).
- `/network` → failed requests (method, host + path, status, error code/message). `/console` → errors, grouped; drop noise that has nothing to do with the bug (e.g. repeated Vue `icon` prop warnings, Meta pixel, Sentry, Chatwoot).
- Decide the layer: **Backend** (4xx/5xx, wrong or missing data, server-side validation) or **Frontend** (good response but wrong UI, client-only validation, JS error). Unclear → say so and pick the most likely.
- Developer = the story's BE or FE dev sub-task assignee (`parent = <story> AND issuetype in subTaskIssueTypes()`, same rules as qa-run-story-chrome step 5). No match → story assignee, and flag it.

### 4. Write the draft (their style)
- **Summary**: `[Partners][<area>] <the wrong behaviour>` in clean simple Arabic.
- **Description** (put the steps here too, the recorder's Steps field can't be edited): one line of what's wrong + why, then `الخطوات:` numbered.
- **Expected** / **Actual**: one clear line each. Actual includes the failing request and status.
- **Technical Analysis**: the key request(s) and error, nothing else. **Possible Root Cause**: one line, marked as a guess.
- **Fields**: Defect, Related ticket = story, Found by = QA, Issue appears in (Partner Portal / Dashboard / …), Priority (Medium unless impact says otherwise), Severity, Testing Environment, Assignee.
- Show the user the full draft in one message (table of fields + the text) and **stop**. The user may change anything.

### 5. Create from the recorder (only after the user's OK)
On `/bugs/<id>?tab=jira`:
1. Project = CPD. Click **Defect**. Type the story key in **Related ticket** and click **Validate ticket** (it sometimes needs a second click; wait for the green "✓ CPD-…" box).
2. **Jira fields**: Assignee (type the name, pick from the list), Priority, Found by = QA, Issue appears in. The checkboxes move when the layout changes, so read positions again (screenshot or `find`) before each click.
3. Type their "What happened" text, click **Generate AI report** (it builds the draft; it is rule-based, not real AI).
4. Click **Edit**, then replace Summary, Description, Expected, Actual, Technical Analysis and Possible Root Cause with the approved text, and set Severity + Environment. Type with the keyboard (click the box, Ctrl+A, Delete, type); setting values by JS doesn't always stick. Click **Done editing** and read the draft back.
5. Click **Create Jira Issue**, then **Confirm & create**. Wait for the new `CPD-xxxxx` key.

### 6. Fix the fields the recorder skips, then verify
- `editJiraIssue` on the new key: `Severity`, `Testing Environment` (by name).
- `getJiraIssue` with `customfield_10710`, `customfield_10786`, `customfield_11964`, `customfield_10787`, priority, assignee, parent, attachment. Every field must be there and the attachments must include the video. Fix anything missing.

### 7. Report
One short table: defect key + link | story | BE/FE | assignee | severity | environment. Note anything the user should know (e.g. assignee guessed, known bug linked).

## Rules
- Never create the Jira issue before the user approves the draft.
- Never create from a test recording (recorder page, Jira, Meet).
- Never click Delete / Discard draft on a recording; deleting is the user's to do.
- Never press Start Capture or touch the extension popup; recording is always the user's.
- If the dashboard shows "no healthy upstream" or won't load, tell the user and stop (the server is down; it's not their fault).
- Write anything newly learned about the recorder into.
