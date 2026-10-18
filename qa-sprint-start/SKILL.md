---
name: qa-sprint-start
description: the QA's one-command sprint kickoff for Salla CPD. Given a sprint number (e.g. 26.4.2) and optionally story keys, it runs their three sprint-start skills in the right order without stopping — (1) qa-sprint-test-plan START for the sprint, (2) qa-create-qa-subtasks for the stories, (3) qa-create-testcase-auto for the same stories — then gives one combined report. Any part can be left out ("بدون تست بلان", "سب تاسكس + تست كيسز بس"). Use when the user says "ابدأ السبرنت", "sprint start", "بداية السبرنت", or names two or more of تست بلان / سب تاسكس / تست كيسز in one message.
---

# Sprint start — autonomous combo

One message from their → three skills in a fixed order → one report. Runs end-to-end without questions, like each skill on its own. Report in Egyptian Arabic.

## Input
- **Sprint number** (`26.4.2`). If missing, use the active sprint on board 90 (`Community | Sprint <x.y.z>`).
- **Story keys** (optional). If the user gives none, the stories are the sprint stories whose **QA Engineer** (`customfield_16280`) is their — exactly the default of `qa-create-qa-subtasks`.
- **Parts.** All three by default. If the user names only some (e.g. "سب تاسكس + تست كيسز CPD-1, CPD-2"), run only those, but always in the order below.

## Order (don't change it)
1. **Test Plan** — load and follow `~/.claude/skills/qa-sprint-test-plan/SKILL.md` for the sprint. At sprint start the phase is START. If the plan is already started (In Progress or later), don't redo START; say so and move on.
   *Why first:* step 3 adds the new tests to the sprint Test Plan, so the plan must already point at the new sprint.
2. **QA sub-tasks** — load and follow `~/.claude/skills/qa-create-qa-subtasks/SKILL.md` with the story keys (or its default sprint query when none were given).
   *Why before 3:* the test-case skill moves each story's "Writing Testcases | …" sub-task Todo → In Progress → Closed, so the sub-task must exist first.
3. **Test cases** — load and follow `~/.claude/skills/qa-create-testcase-auto/SKILL.md`. Feed it the story list from step 2's read-back: their stories that now have both sub-tasks. Leave out stories that step 2 skipped because another QA Engineer owns them. If the user gave keys and step 2 didn't run, use their keys.

Read each skill's SKILL.md (and the references it names) at the moment you reach its step. Its rules, constants and permissions apply unchanged.

4. **Affiliate business update** (always runs, even when the user left out other parts). Search the new sprint for affiliate work: `project = CPD AND sprint = "<sprint name>" AND issuetype in (Story, Task, Epic) AND (summary ~ "affiliate" OR summary ~ "opportunity" OR summary ~ "مسوق" OR summary ~ "فرصة" OR summary ~ "التسويق بالعمولة")` (any QA Engineer, not only hers). Read each match. If it adds or changes affiliate business on the **merchant side** (new field, rule, status, tab, email / notification, change to an existing behaviour), update `your private affiliate context file (e.g. `context\affiliate-context.md`, if you keep one)` in Arabic (and set its "آخر مزامنة مع جيرا" date to today): put the fact in the right part (merchant = Part 1, portal / Salla plans = Part 2, money = Part 3, emails / notifications = Part 4 with "اتأكدنا؟" = لسه, and a new row or "also test" item in the Part 5 impact map when the story links to older areas), and add one row to "سجل التحديثات" with the sprint, what changed and the story keys. Portal stories go in Part 2 the same way; backend-only stories: one line in the log. Nothing affiliate in the sprint → a log row "لا جديد". Never put this file in the team repo; it is private.

## Rules
- A failure in one step doesn't stop the next unless it breaks the next step's input. If the Test Plan fails, steps 2–3 still run; step 3 then reports which tests aren't in a plan yet. If sub-tasks fail for a story, step 3 still writes that story's tests; its own step 0 creates the missing Writing Testcases sub-task.
- Keep the stories' work files in the scratchpad. Don't write per-step reports to the user. Give one report at the end.
- Never delete anything. The same "never" rules as the three skills apply.

## Report (Egyptian Arabic, short, one message)
1. **Test Plan:** the key, its status, filters moved, comments added, scheduled REVIEW/CLOSE dates (or "already started").
2. **Sub-tasks:** a table with story | Writing Testcases | Testing | created / already there. Then the skipped stories and their QA Engineer.
3. **Test cases:** per story, the tests count, the Test Set, and the Writing Testcases final status. Then the placeholders waiting for the PM and the PM comments posted.
4. **Affiliate:** the affiliate stories found and what was added to `affiliate-context.md` (or "لا جديد").
5. Assumptions, failures, and what's left (PM answers, then `رن الستوري` for execution).
