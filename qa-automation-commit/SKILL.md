---
name: qa-automation-commit
description: the QA's full hand-off for finished Playwright automation scripts in the team repo SallaApp/Automation-test-Dashboard-web-Playwright, from their own folders under tests/ and pages/ all the way to a Pull Request for the user leader. Checks and tags the script, runs it 3 times, creates-or-reuses the CPD Jira ticket, creates-or-reuses the branch feature/CPD-xxxxx-short-desc, commits only the script's files as their, brings the branch up to date with main, pushes, opens the PR as Draft with the team template filled, and (when the user says) moves it to Ready for review with the user leader as reviewer. Learning mode is on: before every git / GitHub / Jira step it shows their what the step does and what exactly will happen, and waits for the user OK. Use when the user says "اعمل التيكت والبرانش والكوميت", "جهزلي الكوميت", "ارفع السكريبت", "اعمل البي ار", "automation commit", or finishes a new automation script.
---

# Automation commit → push → PR

> Shared by Omima Mohammed (QA, Partners squad, Salla). Defaults are set for Jira project `CPD`; change the Constants (project, board, fields, filters) for your squad before using it.

Reply in the user's language. Git and GitHub aren't part of their normal work, so **learning mode is ON**:
before each step marked 🟡 show the user a short card and wait for the user OK ("تمام" / "كمل") before doing it:

```
الخطوة <n>: <اسم الخطوة>
يعني إيه: <جملة واحدة بسيطة>
هيحصل إيه بالظبط: <الأمر / الملفات / العنوان / اللينك>
مين هيشوفه: <محدش غيرك / موجود على GitHub بس محدش اتبعتله / الليدر>
```

When the user says learning mode is no longer needed ("مش محتاجة تسأليني في الخطوات"), run end to end and only STOP where a step says STOP. Update this line then: `Learning mode: ON` → `OFF`. Affiliate business + our rules: `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` (private, never commit it).

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

### 3. 🟡 Ticket (Jira)
- Current branch is `feature/<KEY>-...` for the same module, or the user names a key → reuse it (card says "هنستخدم التيكت الموجود").
- Else create a CPD Task: summary `<Module> Dashboard Automation – <scope>`, description ONE plain line, assignee their. No epic, sprint, watcthe user's or extra fields.

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
Show the user the full title + body on the card before creating. After: give the PR link.

### 9. 🟡 Ready for review (only when the user says the PR is ready)
- The PR gate checks the Jira ticket status: move the ticket to "Preparing to Deploy" / "Ready for Release" first (card says which transition).
- `gh pr ready <n>` + `gh pr edit <n> --add-reviewer <their leader's GitHub user>` (ask the user the leader's GitHub username the first time, then save it in this skill's Constants).
- Card: "من هنا الليدر هيوصله إشعار إنه يراجع."

## Report
Short Arabic report: ticket link, branch, commit hash + message, files, test result (3/3), PR link and state (Draft / Ready).
Progress line: ✅ ticket ✅ branch ✅ commit ✅ main ✅ push ✅ PR (Draft) ⏸️ review.
Append one status-log line to `AUTOMATION-CONTEXT.md` (date, ticket, branch, commit, PR link + state).
