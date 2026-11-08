---
name: qa-automation-commit
description: the QA's full hand-off for finished Playwright automation scripts in the team repo SallaApp/Automation-test-Dashboard-web-Playwright, from their own folders under tests/ and pages/ all the way to a Pull Request for the user leader. Checks and tags the script, runs it 3 times, creates-or-reuses the CPD Jira ticket, creates-or-reuses the branch feature/CPD-xxxxx-short-desc, commits only the script's files as their, brings the branch up to date with main, pushes, opens the PR as Draft with the team template filled, and (when the user says) moves it to Ready for review with the user leader as reviewer. Learning mode is on: before every git / GitHub / Jira step it shows their what the step does and what exactly will happen, and waits for the user OK. Use when the user says "اعمل التيكت والبرانش والكوميت", "جهزلي الكوميت", "ابدأ ارفع", "ابتدي ارفعي", "ارفع السكريبت", "اعمل البي ار", "automation commit", or finishes a new automation script.
---

# Automation commit → push → PR

Reply in the user's language. Git and GitHub aren't part of their normal work, so **learning mode is ON**:
before each step marked 🟡 show the user a short card and wait for the user OK ("تمام" / "كمل") before doing it:

```
الخطوة <n>: <اسم الخطوة>
يعني إيه: <جملة واحدة بسيطة>
هيحصل إيه بالظبط: <الأمر / الملفات / العنوان / اللينك>
مين هيشوفه: <محدش غيرك / موجود على GitHub بس محدش اتبعتله / الليدر>
```

When the user says learning mode is no longer needed ("مش محتاجة تسأليني في الخطوات"), run end to end and only STOP where a step says STOP. Update this line then: `Learning mode: ON` → `OFF`.

**The user did the first full run BY HAND (2026-11-03, CPD-34547: ticket → sub-tasks → branch → commit, VS Code icons, no terminal).** Next time the user says «ابدأ ارفع» / «ابتدي ارفعي» / «ارفع» after the script is done and tested, that phrase IS the user's OK: run steps 1–8 end to end without a card per step. Still STOP where a step says STOP (failing/unrun tests, conflicts, a stray file) and print the PR title + body in the report. Step 9 (Ready for review) still waits for the user words. While the user is learning a step by hand, explain it in plain Egyptian Arabic and give click paths in VS Code (Source Control → `...` → Branch / Commit; status-bar branch name), never terminal commands, and let HER press stage / commit / delete-branch.

## Lessons from the first run (2026-11-03) — apply every time
- **Ticket first, with sub-tasks.** New scenario = new CPD Task (title `Affiliate Dashboard Automation – S01 <scope> (UI + API)`, one-line Arabic description, assignee their, no sprint unless the user asks) + 7 sub-tasks named `<step> | S01 <scope>`: write cases+scripts; update branch with main + register store; branch + commit (local); open the login for automation; first run + fix (3 rounds); push + Draft PR; review + ready + merge. Create with `createJiraIssue` issueType `Sub-task`, parent = the Task. Move with `transitionJiraIssue` transitionName `In Progress` / `Closed`: finished = Closed, the current one = In Progress, rest Todo. Update them as each step ends.
- **Branch tied to an OLD ticket that already holds their commits:** do NOT branch from origin/main (the login setup + earlier commits would be lost). Create the new `feature/<NEWKEY>-…` FROM THE CURRENT HEAD, check `git log <new>..<old>` is empty, then delete the old branch. Never delete before the new one exists. Never touch `main` (local main is stale by design; the PR compares against GitHub's main, and I compare against `origin/main` after `git fetch`).
- **Registry:** merchant stores are no longer in `setup-accounts.ts` (it is an adapter). A new store = one entry in `src/store/stores.ts` (id, name, credentials `{env: "<PREFIX>"}` → `<PREFIX>_EMAIL/_PASSWORD` in `env/.env.<ENV>`, login `api`, locale, session file, exclusive, lockKey, squads, has.features). When merging main conflicts in `playwright.config.ts`, `project.md`, `setup-accounts.ts`: take THEIR version, then re-add only their lines (project + login project + project.md rows + the store entry). Then `npx tsc --noEmit`, `check_tags`, `--list`.
- **Hygiene before commit (grep every staged file):** no `C:\Users` / `D:\` / personal paths in comments, no `.zip` or other artifacts in `tests/` or `pages/`, no credentials. Portal files belong to the SEPARATE repo `SallaApp/Automation-test-partnersPortal-web-Playwright` (since 2026-11-03), never in this one.
- **Unrun tests:** if the login is blocked (401) the 3 rounds cannot run → commit LOCAL ONLY with no `@TC_Stable`, do NOT push / open a PR until the tests ran 3/3. Tell their this in one line.
- **What the commit/push contains (the user asked twice):** commit = only the staged files; push = their branch's commits; PR = the diff vs GitHub's main (their files + the few shared lines). Run results (`test-results`, screenshots, traces), `env/`, `playwright/.auth` are gitignored and never pushed; the result goes in the PR description (3/3 + report link).
- **VS Code quirks:** empty commit-message box → a `COMMIT_EDITMSG` tab opens: type on line 1, Ctrl+S, close the tab (or press its Commit button). The Graph pane can swallow the Changes list: collapse it / `...` menu. `99↓` on local main is normal.
- **Login 401 on live/beta:** from their machine `api.salla.dev/admin/v2/auth/login` gives 401 before credentials are checked; Ahmed Ammar got 200 from his Postman with the same credentials. Next diagnostic = their own Postman. Never fake headers/User-Agent to get around it. Affiliate business + our rules: `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (private, never commit it).

## Scope: only their script files
Only files under their module folders: `tests/ui-merchant-<module>/` and `pages/ui-merchant-<module>/` (affiliate = `ui-merchant-affiliate`). A file outside them (`playwright.config.ts`, `project.md`, `setup-accounts.ts`, a setup file) goes in **only** when the script can't run without it (e.g. a new Playwright project), and the card for step 6 names it and says why.
Never: `env/`, `playwright/.auth/`, `test-results/`, `playwright-report/`, portal files, anything with credentials, other people's changes.

## Constants
- Repo: `D:\SallaApp\Automation-test-Dashboard-web-Playwright` (GitHub `SallaApp/Automation-test-Dashboard-web-Playwright`). Run with `ENV=live`.
- `gh` is logged in as their (your GitHub user). Git identity: `<your name> <your-email>` (global; set again if missing).
- Jira: cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project **CPD**, type **Task**, assignee their.
- Tags (`docs/TAGS.md`, `project.md` §5, `.claude/quality-checklist.md`): `@Dashboard`, `@squad-community-products`, `@module-partners`, `@submodule-affiliate`, `@M-<Module>`, `@SM-<SubModule>`, one priority `@<Area>_Priority:P<n>`, `@TC_Stable` only after 3 clean rounds.

## Steps

### 1. Find the script (no card)
`git status --short`. The script = new/changed files in their module folders. Unrelated changes stay unstaged; tell the user. Nothing new → say so and stop.

### 2. Checks (no card; STOP on failure)
```
npx prettier@3.8.4 --write <files>
npm run check_tags
npx eslint <spec + page files>
ENV=live npx playwright test --project=<project> --repeat-each=3 --retries=0 --reporter=line
```
All 3 rounds pass → add `@TC_Stable`. Any failure → STOP: show the failure (screenshot from `test-results/`), fix it with the user, rerun. Never commit a failing test.

**Affiliate impact check:** for an affiliate script, read Part 5 of `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (agreement 1.4 in Part 8.1). List the impact areas the scenario touches and whether each has a `[Regression]` test in the script. Missing ones don't block the commit: show them to the user in the step-6 card as «إمباكت مش متغطي» and offer to add the tests first.

### 3. 🟡 Ticket (Jira)
- Current branch is `feature/<KEY>-...` for the same module, or the user names a key → reuse it (card says "هنستخدم التيكت الموجود").
- Else create a CPD Task: summary `<Module> Dashboard Automation – <scope>`, description ONE plain line, assignee their. No epic, sprint, watchers or extra fields.

### 4. 🟡 Branch
- Already on the ticket's branch → stay.
- Else `git fetch origin` + `git checkout -b feature/<KEY>-<short-kebab-desc> origin/main` (uncommitted script files move with the user).
- Conflict → STOP and show the user; never stash-drop, reset or delete anything.

### 5. 🟡 Commit
- `git add <explicit paths>` only (never `.` / `-A`); `git diff --cached --stat` must list only the script files (show this list on the card).
- `git commit -m "test(<KEY>): <what the script covers>"`; check `git log -1 --stat` (author = you).

### 6. 🟡 Bring the branch up to date with main
`git fetch origin` + `git merge origin/main` (no rebase, no force). Conflicts → STOP, show the user the files, resolve together, commit the merge.

### 7. 🟡 Push
`git push -u origin <branch>`. Card: "الشغل هيبقى على GitHub في البرانش بتاعك. محدش بيتبعتله حاجة."

### 8. 🟡 Pull Request as Draft
`gh pr create --draft --base main --head <branch> --title "test(<KEY>): <summary>" --body-file <scratch file>` with the repo template `.github/pull_request_template.md` filled (the QA PR Gate rejects untouched template lines):
- **Summary:** one sentence.
- **What's included:** `- <KEY>: <test case>` per test.
- **Change type:** tick 🆕 New test (or the fitting one).
- **Tags:** the grep tags used.
- **Jira ticket:** the link.
- **Run commands:** `$env:ENV="live"; npx playwright test --grep "@submodule-affiliate"` (and the Mac line).
- **Notes for reviewer:** test data (prefix, cleanup), fixtures it relies on.
- **Test evidence:** "3/3 rounds passed on live" + screenshot / report link; TestDino link when it exists.
Show their the full title + body on the card before creating. After: give the PR link.

### 9. 🟡 Ready for review (only when the user says the PR is ready)
- The PR gate checks the Jira ticket status: move the ticket to "Preparing to Deploy" / "Ready for Release" first (card says which transition).
- `gh pr ready <n>` + `gh pr edit <n> --add-reviewer <their leader's GitHub user>` (ask the user the leader's GitHub username the first time, then save it in this skill's Constants).
- Card: "من هنا الليدر هيوصله إشعار إنه يراجع."

## Report
Short Arabic report: ticket link, branch, commit hash + message, files, test result (3/3), PR link and state (Draft / Ready).
Progress line: ✅ ticket ✅ branch ✅ commit ✅ main ✅ push ✅ PR (Draft) ⏸️ review.
Append one status-log line to `AUTOMATION-CONTEXT.md` (date, ticket, branch, commit, PR link + state).
