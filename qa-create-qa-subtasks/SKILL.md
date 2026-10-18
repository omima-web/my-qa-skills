---
name: qa-create-qa-subtasks
description: For the story keys the user gives (sets the story "QA Engineer" field to the user when empty), or else every active-sprint story whose QA Engineer is the user, make sure the two QA sub-tasks exist — "Writing Testcases | [story]" and "Testing | [story]". Existing ones are left as they are; missing ones are created in Todo and assigned to the user. Stories with another or empty QA Engineer are skipped. Never duplicates, never deletes. Run it at sprint start, before qa-create-testcase-auto (which moves "Writing Testcases" to In Progress, then Closed). Use when the user asks to create/add QA sub-tasks, test sub-tasks, or "write test cases + execution" sub-tasks for the sprint stories.
---

# Create QA sub-tasks — autonomous

> Shared by Omima Mohammed (QA, Partners squad, Salla). Defaults are set for Jira project `CPD`; change the Constants (project, board, fields, filters) for your squad before using it.

Runs end-to-end without questions. Report at the end in Egyptian Arabic.

## Constants (salla-dev)
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`. Project `CPD`, board 90 (Community).
- Story field **QA Engineer** = `customfield_16280` (JQL `cf[16280]`). This field decides whose story it is.
- Sub-task issue type: `Sub-task`. Workflow: `Todo` (new) → `In Progress` (transition id 3) → `Closed` (transition id 61).
- The user: `accountId` from `atlassianUserInfo` .

## Sub-task names (team convention — keep exact)
| Purpose | Summary | Counts as existing if a sub-task summary starts with |
|---|---|---|
| Write test cases | `Writing Testcases \| <story summary>` | `Writing Testcases`, `Write Test`, `Test Cases`, `Testcases` |
| Execute testing | `Testing \| <story summary>` | `Testing`, `Test \|`, `QA \|`, `Test Execution`, `Execute Test` |

## Steps
1. **Pick the user's stories — by the QA Engineer field only.**
   - Default: `project = CPD AND sprint in openSprints() AND issuetype = Story AND statusCategory != Done AND cf[16280] = currentUser() ORDER BY key` (page until `isLast`). If the user names another sprint, use `sprint = "<name>"` instead of `openSprints()`.
   - **If the user gave story keys, those are the user's stories:** set QA Engineer = the user on each one (`editJiraIssue` `additional_fields: {"customfield_16280": {"accountId": "<accountId>"}}`) when it is empty, then continue with steps 2–4 for all of them. If a given story already has a different QA Engineer, don't overwrite it — skip that story and name the current QA Engineer in the report.
   - Also run the same sprint query with `cf[16280] is EMPTY` and list those stories in the report (no sub-tasks for them) — the user may need to ask for the field to be filled.
2. **Read existing sub-tasks in one query:** `parent in (<keys>) AND issuetype in subTaskIssueTypes()` with fields `summary,status,assignee,parent`. Match per story with the prefix table above (case-insensitive).
3. **Per story, per row of the table:**
   - Found → leave it exactly as it is (status, assignee, summary).
   - Not found → create it with `createJiraIssue`: `projectKey: CPD`, `issueType: Sub-task`, `parent: <story>`, `summary` as above, `assignee: <accountId>`. It lands in `Todo` and inherits the story's sprint — don't set Sprint.
4. **Read back** with the step-2 query and confirm each of the user's stories has both sub-tasks.

## Rules
- Never create sub-tasks on a story whose QA Engineer is someone else or empty.
- Never delete or rename issues. Never touch dev sub-tasks (BE/FE/Review/Multi-Market…).
- Idempotent: re-running only fills gaps.
- If creation fails for one story, continue with the rest and report the failure.

## Report (Egyptian Arabic, short)
A table: story key | Writing Testcases key | Testing key | created / already existed. Then sprint stories with an empty QA Engineer (skipped), and failures. End with: next step is `qa-create-testcase-auto` on the stories.
