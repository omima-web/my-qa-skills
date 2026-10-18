---
name: qa-signoff-auto
description: >
  Autonomous QA sign-off for a Salla CPD story. a personal autonomous variant of the team skill qa-signoff: same requirements, plus
  gates and clean-up. Checks that the Test Execution has every linked test and all are PASSED, that defects are closed
  (Dev Rejected excepted), and that Console/Security/API checks are clean. Records a video in Chrome and attaches it,
  closes their QA sub-tasks and the execution, posts a short sign-off comment, then moves the story to PM Review
  assigned to the reporter. No confirm pause; it stops only if a gate fails. Use for "ساين أوف", "sign off",
  "حولها للبي ام", or a story key to sign off. Not the team's qa-signoff, which pauses to confirm.
---

# QA sign-off — autonomous (a personal autonomous variant of the team `qa-signoff`)

Reply in the user's language. Transitions, fields, and comment templates: `references/signoff-templates.md`.

## Compared with the team skill `qa-signoff`

| Team `qa-signoff` (kept as-is) | Added in this variant |
|---|---|
| Approve → **Move to PM Review**, PM assignee required, transitions discovered live | Gate: Test Execution has all linked tests and **all PASSED** (Test Coverage) |
| Reject → back to dev (Reopen) with blocking issues, severity, video per issue | Gate: all defects closed (**Dev Rejected** excepted, never touched) |
| **Video required** (birdeatsbug / Loom); warn on missing screenshots or bug links | Claude **records the video itself** in Chrome (GIF, or Loom if available) and attaches it; the user isn't asked for a link |
| Real coverage numbers from linked tests / Xray | Console / Security / API verdicts (from the run) go into the **checklist** |
| Testing Environment + QA Sign-off Checklist (+ Approvers only if named) | Closes their QA sub-tasks + the Test Execution; execution added to the sprint Test Plan |
| Comment first, then transition; PM notified by the assignee change, not a text mention | **No confirm pause**: runs end to end; comment kept **short** |
| Don't force a blocked transition | Read-back + short report at the end |

## Constants
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD`. QA = the user (accountId from `atlassianUserInfo`).
- Xray writes: `xray-graphql` MCP, fallback `node ~/.claude/xray-gql.js`. Max 25 operations per mutation batch.
- **PM:** CPD has no PM field. Use the story's Reporter when that's a PM; otherwise ask the user. If unsure, ask the user and never guess.
- Only their own QA sub-tasks matter. Never mention or gate on dev or others' sub-tasks.
- Evidence folder: `evidence\<STORY>\`. Chrome how-tos (GIF export, Jira attach, reading API bodies, language and dark mode): `automation\CHROME-TEST-RUN-CONTEXT.md` and skill `qa-run-story-chrome`.

## Steps

### 1. Read
- `getJiraIssue <story>` (view `full`): status, reporter, ACs, sub-tasks, links, attachments, sprint, Test Link field.
- Linked tests ("is tested by", type Test), the Test Set, and the story's Test Execution (`execution for <summary>`). Read its runs from Xray with real statuses.
- Defects: `parent = <story> AND issuetype = Defect`, plus defects linked to the story or to the execution.
- Environment: from the execution's `Testing Environment`, otherwise from the story's Test Link / Development field. Ask only if both are empty.

### 2. Gates: if any one fails, stop, tell the user, and offer the REJECT sign-off
1. **Coverage:** every linked test is in the execution and every run is **PASSED**. The execution is in the sprint Test Plan (add it if missing). List what's missing or not PASSED.
2. **Defects:** all Closed. **Dev Rejected** ones don't block and aren't touched; they're listed in Notes. Any other open defect blocks.
3. **Run checks:** read the line the run left in the execution description: `Console: … | Security test: … | API test: …`.
   - If the line is missing, do the checks now in Chrome: console errors on the story's pages, and failed calls on its endpoints.
   - Security: no tokens or PII in URLs or logs, nothing stored in localStorage that shouldn't be, no mixed content, and 401/403 without permission.
   - API test: needed or not, with the reason.
   - An error or problem **caused by what the story changed** blocks.
   - An error **not related to the story's change** doesn't block. Example: in CPD-32972 (date picker) the opportunities grid logged AG Grid #200. Tell their about it and ask where to raise the bug. Continue the sign-off, and in the checklist mark that line ✅ with "not related to the story — bug raised: <key>".

4. **Affiliate impact:** if the story touches affiliate, read `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (sync it with Jira after its «آخر مزامنة مع جيرا» date first). Check that the impact areas from its Part 5 that this story touches were covered by a test in the execution or by a check in the run. Uncovered areas don't block on their own: list them to the user and add them to Notes as "مناطق إمباكت ما اتغطتش". Add any new business fact from the story (ACs, PM decisions in the comments) to the file + a «سجل التحديثات» row.

**REJECT (only after the user says so):** use the team's red template from references, then transition **Reopen** (id 131, verify live) back to the developer. Put the blocking issues first, each with its AC, expected vs actual, severity, and video.

### 3. Evidence (Claude records it; never ask the user for a link)
- Record **only what the story changed**, on the story's environment. **Start with the story's main point** (e.g. CPD-32972: the default range is the last week on first load, with the days highlighted in the calendar), then the other ACs in order (same picker and presets as the reference, custom range, presets). Record the video only; don't re-test anything while recording. Put a one-line caption above the video in the comment listing what it shows. Every step must clearly show its AC result (e.g. open the picker → choose a range → the cards change). Don't do side actions whose purpose isn't obvious in the video (e.g. opening another list's filter). Use `gif_creator` (action labels on, watermark off, quality 10), name it `<STORY>_signoff.gif`, and keep it under 10 MB. No screenshots needed.
- If a Loom or birdeatsbug video already exists on the story (Test Link field), reference it too.
- **If the user says evidence later** (e.g. the branch passed on Dev and the user'll give the Live page after release, as on CPD-32987), skip this step. Write `🎥 Evidence: will be added after the release on Live` in the comment and continue. When the user later gives the Live page, record the video and edit the same comment to embed it.
- Before uploading, read the story's `attachment` field and skip anything already there.
- Upload in Chrome on `https://salla-dev.atlassian.net/browse/<STORY>`: label the media-picker `input[type=file]`, then `find` it and `file_upload`.
- Confirm the files appear in `getJiraIssue fields:["attachment"]`. Never claim a file is attached before you see it there.

### 4. Clean-up
- Close their QA sub-tasks (`Writing Testcases |`, `Testing |`, assigned to the user). Discover transitions live and never touch dev or others' sub-tasks.
- Close the Test Execution.

### 5. Comment (template in references)
The comment has four parts:
1. A header: verdict, who / when, coverage, and the **environment, stated explicitly**:
   - Live → "Live (Production)" + the live URL.
   - Dev / PR link → "Development" + the dev link.
   - Both → both lines. The rules are in references.
2. **Only the video, embedded inline in the comment** (required). No screenshots in the comment, because they make it too long.
3. **The QA checklist**: all 20 lines: the team's 17 items plus their 3 (test cases executed, API test, console), one item per line, never grouped. Each line is ✅ done, ❌ not needed — reason, or ⚠️ not done — why. Be honest: e.g. if Firefox wasn't run, write ⚠️; never mark ✅ what wasn't done.
4. Notes, only when needed.

Post it as HTML with `addOrEditJiraIssueComment`, embedding the uploaded attachments as media (see `getContentFormatGuide`):
- **Getting the media id (worked on CPD-32972):** on the story page, each attachment card is `[data-testid=media-file-card-view][data-test-media-name="<file>"]`. Its file id is the **first** UUID in that element's `outerHTML`. The image `src` is blocked by the tool, so read the outerHTML instead.
- Embed each file as `<figure data-type="media-single" data-layout="center" data-width="80|60" data-width-type="percentage"><div data-type="media" data-media-type="file" data-id="<uuid>" data-alt="<file>"></div></figure>`. Jira resolves the file by id, so no collection is needed.
- After posting, open `…/browse/<STORY>?focusedCommentId=<id>` and confirm the comment's `img` elements loaded (`complete` and `naturalWidth > 0`).

If the video can't be embedded, stop and tell the user. No sign-off without the video. Write names as plain text.

### 6. Transition
Verified on CPD-32987 (2026-10-08):
- If the story is **Ready for Testing**, first run **start test** (id 41) → In-Testing.
- Then run **Move to PM Review** (id **361**, verify live with `expand: transitions.fields`). Its fields:
  - `assignee` = the PM. **The PM is the story's reporter when that is a PM**. If the reporter is a dev, ask the user who the PM is.
  - `customfield_10786` Testing Environment (Development Server 11095 / Production 11096).
  - **Required by a validator:** `customfield_19497` **TestDino Link** (URL) and `customfield_19498` **Demo Link** (text). There's no TestDino/automation yet, so the user said to put the story's test link in both: the dev link from the Test Link field, or the Live URL after release.
  - CPD's transition screen has **no QA Sign-off Checklist field**; the checklist lives only in the comment.
  - Approvers only if the user names them.

If the transition is rejected, report exactly what's missing and stop. Never force it.

### 7. Read back + report
- Re-read the story (status, assignee, comment, attachments, checklist), the sub-tasks, and the execution.
- Reply with a short table plus the story link.
- Append new learnings to `CHROME-TEST-RUN-CONTEXT.md`.

## Rules
- Real numbers only, read from Xray. Never invent pass counts.
- Never type passwords or OTPs. The user logs in themselves in Chrome.
- If Chrome isn't reachable, say so and stop before the evidence step.
