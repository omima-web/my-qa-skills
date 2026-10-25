---
name: qa-api-suite
description: the QA's Apidog suite for an API-only Salla CPD story (a public / partner API used with a token and no screen, e.g. Partner API). BUILD makes one Postman v2.1 collection named by the story's name (not its key) with every test case as a request plus pm.test assertions, and walks their through Import → variables → scenario in Apidog. RUN reads the HTML report the user exports, separates real failures from noise (empty variables, 429 from speed, Apidog Response Validation, known open bugs), writes the analysis file, and records the results in the story's Xray Test Execution with the user rules. Used after the first run of an API-only story, before sign-off (qa-signoff-auto calls it), and for the live run by switching the Apidog environment. Use when the user says "اعمل السويت", "رن السويت", "خلص الرن", "حطيت التقرير", "سويت اللايف", or a sign-off of an API-only story. Stories with screens use qa-run-story-chrome instead.
---

# Apidog suite for an API-only story

> Shared by Omima Mohammed (QA, Partners squad, Salla). Defaults are set for Jira project `CPD`; change the Constants (project, board, fields, filters) for your squad before using it.

Reply in the user's language, one step at a time when the user is doing something in Apidog (the user asks to be guided step by step and sends screenshots). Their full guide: `<qa-workspace>\apidog\خطوات إنشاء سويت.md` (keep it current).

## When (and when not)
- **Only API-only stories:** a public / partner API used with a token and no screen. A story with screens — even if it has a backend — is run in Chrome (`qa-run-story-chrome`), whose API test checks the requests the page sends. Never build a suite for it.
- **Timeline:** first run on Dev (their + Claude, with thinking) → **BUILD** → dev fixes → **RUN on Dev before sign-off** (`qa-signoff-auto` step 1b) → story goes live → **RUN on Prod**. Also re-run when another story touches the same API.
- Never build the suite before the first run: that run fixes wrong paths and expectations (CPD-32566 was written on the proposal).

## Files
- Generator (Claude writes): `<qa-workspace>\apidog\_gen\<story-slug>.py`, using `scripts/suite_lib.py` (this skill).
- Suite (the user imports): `<qa-workspace>\apidog\<اسم الستوري> - سويت.postman_collection.json` — the story's **name**, never the key.
- Reports (the user exports): `<qa-workspace>\apidog\reports\<اسم الستوري> - <Dev|Prod> - <YYYY-MM-DD>.html`.
- Analysis (Claude writes): `<qa-workspace>\apidog\reports\<اسم الستوري> - <Dev|Prod> - <YYYY-MM-DD> - التحليل.md`.
- Existing suites: «إنشاء مسوق فرعي من الـ API» (CPD-32566), «قايمة الفرص من الـ API» (CPD-32564).

## BUILD
1. **Read** the story, its Xray tests (all linked + the live-suite Test Set if any), the PR (real paths, params, validation, error codes, design doc under `docs/changes/`) and the area context file (decisions, known bugs, not-bugs).
2. **Write the generator** with `suite_lib`: one folder per area (token & scopes, response shape, each param / filter / limit, the story's main action, impact on related endpoints). Each request = one test case, named `<n.m> <what> → <expected>`. Assertions: status, error `code` / `fields`, data rules (`every`, `count_max`), time limit from the test. Rules learned:
   - Query params go in `url.query` (the library does it). A raw `?a=b` alone is dropped by the import.
   - Requests that create data use names starting «أوتوميشن» and `{{$timestamp}}` where a new item is needed.
   - Same variable names across suites (`token`, `read_token`, `main_link_id`, …) so the user fills them once per environment.
   - Behaviour that is the same in the portal (decided not a bug) is not asserted as a failure; note it in the request name.
   - Known open bugs stay asserted (they fail until fixed) and are listed in the collection description.
3. Run the generator, check the request count, and give the user the file link.
4. **Guide their** (one step per message, wait for the user screenshot): Import (Settings ⚙️ → Import Data → Postman → Create a new module; keep «Remove {{base}}» on; turn on «Synchronously update the Base URL»; Confirm once) → variables in the environment (**tokens in Local Value only**, Shared stays empty) → scenario (Tests → New Test Scenario named as the story → Add Step → Import from Endpoint Debug Case → whole module → Advanced Settings: **On Error = Ignore** (Continue stops after the first failure), **Delay = 300 ms** (the API allows 4 requests/second) → Save).
   - After Import, check one request with a query param (Params tab) before running. Empty → the import dropped it: delete the module and its scenario and import again (Overwrite on an existing module did not work).
   - Re-import of a changed suite = delete the module + its scenario, import again, rebuild the scenario. Variables stay (they belong to the environment).

## RUN
1. The user picks the environment (Testing Env = Dev, Prod Env = live), clicks **Run** in the scenario (not «Run Again» on a result tab) and **Export Report → HTML** into `reports\`.
2. Claude: `python -I scripts/parse_report.py "<report>"` (newest report when no path).
3. **Sort every failed request** into one of:
   - **Real failure** — new behaviour that breaks a rule → defect draft (formal template, `qa-run-story-chrome` step 4); the user approves before it is created.
   - **Known open bug** — fails as expected; name the defect key.
   - **Not a result** — empty variable, 429 from speed, wrong test data.
   - **Suite mistake** — fix the generator (say so plainly, it was Claude's mistake).
   - When the assertion text is not enough, ask the user for that request's Body (Raw → Ctrl+A → paste). Compare with the portal before calling it a bug.
   - Ignore the Apidog «Failed» badge caused only by **Response Validation** (it expects 200 everywhere); read the Assertions.
4. **Write the analysis file** (`… - التحليل.md`): header (story, environment, date, counts), one table per category above (request · result · reason · defect key), what changed since the last run, and the next step. Keep it formal and short. Tell their where it is.
5. **Xray** — the story's Test Execution (Dev) or a new `execution for <summary> | Live` (Prod), their rules:
   - FAILED only for a test with a raised Defect (one per bug).
   - TO DO only for tests waiting on a question in the dev / PM comment (count = the comment's questions).
   - Everything run and clean → PASSED, with a run comment «Apidog suite <env> <date>: …».
   - Tests not run (missing data) stay out of the execution and unlinked from the story; keep them in the live-suite Test Set.
6. Report in Egyptian Arabic: counts, real failures (if any), the analysis file link, and what is next.

## Rules
- Never use, type or store their `prtapi_` tokens; the user puts them in Apidog themselves. Remind their to delete the tokens from the portal after a run when they appeared in a screenshot.
- Never delete their Apidog data yourself; tell the user what to delete.
- New facts about the API (limits, behaviour, not-bugs) → the area context file right away.
