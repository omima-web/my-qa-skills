---
name: qa-recorder-defect
description: The ONE way to create a CPD Bug or Defect — through the Salla QA Bug Recorder's own "Create in Jira" form (qa-recorder.dev.salla.group), never straight in Jira. For a bug the QA recorded themselves (transcribes their voice, creates right away) and for bugs Claude finds in a run / regression / live test (the user captures while Claude repeats the bug's steps; created after the user approves). Bug (live / outside a story) → Todo + NEXT sprint; Defect → Related ticket = story. Fills the recorder fields (Assignee = story's BE/FE dev, Priority, Sprint, Found by QA, Issue appears in) and their formal Arabic template, creates it with video + logs, then sets Severity, Testing Environment, QA Engineer, status and key frames. Use for "خلصت تسجيل", "سجلت باج", "اكتب الباج من الريكوردر", "سجل بج على …", or a qa-recorder link.
---

# Recorder → Jira Bug / Defect

Reply in the user's language.

**The recorder form is the team's standard: every Bug or Defect — whether the user creates it or Claude does — goes through the recorder's Jira tab ("Create in Jira"), with its fields. Never `createJiraIssue` for a bug, never a format of our own.** If the recorder is down, tell the user and stop; don't fall back to Jira without the user's OK.

## Constants
- Dashboard: `https://qa-recorder.dev.salla.group/dashboard`. Report page: `/bugs/<id>?tab=jira`. The user is logged in there in their Chrome (Claude in Chrome).
- The dashboard's own API works from a tab on that site (same origin, no token): `fetch('/api/reports?limit=15')`, `/api/reports/<id>`, `/actions`, `/console`, `/network`. No MCP and no API docs yet (Maher, 2026-10-15). URLs with query strings get blocked in tool output, so print only host + path.
- The dashboard has **no "new report" button**: a report only exists after the user captures with the extension. Claude never presses Start Capture.
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD`, board 90. The user's accountId comes from `atlassianUserInfo`. Story test link field `customfield_11949`, QA Engineer `customfield_16280`.
- Fields the recorder does NOT fill (set them after create): Severity `customfield_10710` (Blocker / Critical / Major / Minor), Testing Environment `customfield_10786` (`Development Server` / `Beta` / `Stage` / `Production`), QA Engineer `customfield_16280` (= their).
- Bug status: new Bugs land in Backlog → transition **"Ready to Sprint" (371) → Todo**.

## Bug or Defect?
- **Defect** = found while testing a story in the sprint → Related ticket = the story (mandatory), Sprint = the story's sprint, Assignee = the story's BE or FE dev.
- **Bug** = outside the story's scope, usually on Live → Related ticket optional, **Sprint = the NEXT sprint** (first `future` sprint on board 90, `listJiraBoardSprints state=future`), status **Todo** . It moves into the current sprint only after it's fixed during it, so story points never count against the team before the fix.
- The user says which one; if the user doesn't: a story the user's testing in the sprint → Defect; Live / no story → Bug.

## Two ways in
- **A. Their own recording** ("سجلت باج", a recorder link): steps 1–7. Their recording is their approval: no review stop.
- **B. From Claude's own testing** (`qa-run-story-chrome`, `qa-signoff-auto` regression, `qa-live-test`): when a test fails, Claude asks their to start Capture, repeats only the bug's steps under it, and the user stops it — so each defect has a short recording of its reproduction (the calling skill gives the report id). The drafts wait for the user OK; then skip step 4's writing (use the approved draft) and do steps 5–7 per defect.

## Steps

### 1. Find the recording
- Open the dashboard in a new tab, then `fetch('/api/reports?limit=15')`. Take their newest report (`reporterName` = <your name>, status DRAFT, not in Jira), or the id the user / the run gave.
- `pageUrl` is only where the capture started. A report with no actions that started on a Jira / recorder tab can still be a real recording (2026-10-25: the user started on Jira and switched to the store). Check the video: if it shows the product, it's real. Only a capture with nothing but the recorder, Jira or Google Meet on screen is a test recording: tell the user and ask which one the user meant.

### 2. Find the story (Defect) — or confirm it's a Bug
- If the user gave the key, use it.
- Else match the report's `pageUrl` host to `customfield_11949` (Test Link) of their open-sprint stories: `project = CPD AND sprint in openSprints() AND cf[16280] = currentUser() AND issuetype = Story`. One match → Defect on it. None / several → ask the user "الباج ده على أنهي ستوري ولا Bug لايف؟" and stop.
- Read the story (summary, ACs, linked tests). If it touches affiliate, read `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (sync it with Jira first) and check its bug history so you don't raise a known open bug again.

### 3. Read the evidence
- Their recordings have **voice**. Claude can't hear audio, so never write from frames alone: download the video with `curl -L <dashboard>/files/reports/<id>/recordings/<file>.webm` (302 → S3; get the path from `/api/reports/<id>` → `recordings[0].fileUrl`) into `D:\omima-qa\recorder\`, transcribe with faster-whisper `D:\ai-models\whisper-medium` (language ar; decode the audio with PyAV yourself, `-I` python with `sys.stdout.reconfigure(encoding="utf-8")`), and read frames at the spoken timestamps.
- `/actions` → the real steps. `/network` → failed requests (method, host + path, status, error). `/console` → errors, grouped; drop noise (Vue `icon` prop warnings, Meta pixel, Sentry, Chatwoot).
- Decide the layer: **Backend** (4xx/5xx, wrong or missing data, server-side validation) or **Frontend** (good response but wrong UI, client-only validation, JS error, timezone/format shown wrong). Unclear → say so and pick the most likely.
- Developer = the story's BE or FE dev sub-task assignee (`parent = <story> AND issuetype in subTaskIssueTypes()`, same rules as qa-run-story-chrome step 5). Bug with no story → the dev the user names, else the FE/BE dev of the area's latest story, and flag it.

### 4. Write the text — the recorder form IS the template
Fill only the form's own fields; don't add a structure of our own.
- **Summary**: `[المكان][الموديول] <الخطأ> + <الشرط>`, one sentence, no «انظر الصورة/الفيديو».
- **Description**: short facts only — الوصف (سطر واحد) · الشروط المسبقة · التكرار · الحساب · الطلب الفاشل (method + endpoint + status + error) · التست المرتبط إن وُجد · توقيت الجهاز لو له أثر. The recorder adds its own Environment section and evidence list.
- **Steps** (the recorder's own field, one step per line): أقل عدد، بالبيانات الفعلية.
- **Expected**: القاعدة الصحيحة ومصدرها (AC، الديزاين، البورتال، قرار الفريق). **Actual**: ما يحدث فعلًا بالقيم.
- **Technical Analysis**: الطلب أو الخطأ الأساسي فقط. **Possible Root Cause**: سطر واحد، ويُكتب أنه احتمال.
- **Language:** clean formal Arabic (light MSA), present/passive verbs, one idea per sentence. Forbidden: first person and chat words («لقيت»، «شفت»، «جربت»، «عندي»)، their spoken words copied as they are, guesses outside Root Cause. Severity (impact) and Priority (urgency) are chosen separately.

### 5. Create from the recorder (Jira tab)
On `/bugs/<id>?tab=jira`:
1. Project = **Community Products Delivery [Partner] (CPD)**. Click **Bug** or **Defect**. Defect: type the story key in **Related ticket** → **Validate ticket** (may need a second click; wait for the green "✓ CPD-…" box). Bug: Related ticket optional (leave empty or put the related story).
2. **Jira fields**: Assignee (type the name → pick from the list), Priority, **Sprint** (type the sprint name, e.g. `26.4.3` → pick; Bug = next sprint, Defect = the story's sprint), Found by = **QA**, Issue appears in (Dashboard / Partner Portal / …). Checkbox positions move when the layout changes: re-read them (screenshot / `find`) before each click.
3. Type a one-line "What happened" → **Generate AI report** (rule-based). It resets Priority to **Low**: set it back (`find` the Priority select → `form_input`).
4. **Edit** → replace Summary, Description, Expected, Actual, Technical Analysis, Possible Root Cause (`form_input` works for these), set Severity and Environment (`PROD` for Live, `DEV` for Dev). **Steps must be typed with the keyboard** (click → Ctrl+A, Delete → type one step → Enter → next); `form_input` doesn't stick there. **Done editing** → read the whole draft back (`get_page_text`) and fix anything that didn't stick.
5. **Create Jira Issue** → **Confirm & create**. Wait, then find the new key (`project = CPD AND reporter = currentUser() AND created >= -15m`). If the click is blocked by auto mode, tell the user the one-time `autoMode.allow` rule is missing from `~/.claude/settings.json` (Claude can't add it itself).

### 6. Finish the fields, then verify
- `editJiraIssue`: `customfield_10710` Severity, `customfield_10786` Testing Environment, `customfield_16280` QA Engineer = their.
- **Bug** → transition `Ready to Sprint` (371) → Todo, and check the sprint is the next one. **Defect** → stays with the story's flow.
- `getJiraIssue` with `customfield_10020` (sprint), `customfield_10710`, `customfield_10786`, `customfield_11964`, `customfield_10787`, `customfield_16280`, priority, assignee, parent, status, attachment. The recorder attaches `recording.webm` + console / network / HAR / user-actions / environment JSON; add 2–3 key frames (`<KEY>_<n>_<what>.jpg`, in `evidence/<STORY>/` or `evidence/live-bugs/<KEY>/`) with `uploadAttachmentToJiraIssue` (phase 1 → run its curl → phase 2). Link the Defect to the failed Xray test run when a run is open. Fix anything missing.
- Add the new key to the area context file's known-bugs part (who found it, status, sprint).

### 7. Report
One short table: key + link | Bug/Defect | story | BE/FE | assignee | sprint | status | severity | environment. Note anything the user should know (assignee guessed, known bug linked).

## Rules
- Recorder form only; no `createJiraIssue` for bugs (2026-10-25).
- Their own recording = their approval (no review stop, 2026-10-21). Bugs Claude found in a run are created only after the user approves the drafts (qa-run-story-chrome step 4).
- Bug → Todo + next sprint; Defect → the story's sprint.
- Never click Delete / Discard draft on a recording; deleting is hers to do.
- Never press Start Capture or touch the extension popup; recording is always hers.
- If the dashboard shows "no healthy upstream" or won't load, tell the user and stop (the server is down; it's not their fault).
- Write anything newly learned about the recorder into.
