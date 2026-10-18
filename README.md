# QA skills by Omima Mohammed (Partners squad, Salla)

Claude Code skills for the full QA cycle of a sprint story in Jira + Xray. Defaults are set for Jira project `CPD` (Partners). Before using one in another squad, change its **Constants** section (project key, board, custom fields, saved filters, Test Plan).

| Skill | What it does |
|---|---|
| `qa-sprint-start` | Sprint kickoff in one command: Test Plan START → QA sub-tasks → test cases for the sprint stories. |
| `qa-sprint-test-plan` | Runs the sprint Xray Test Plan through START / REVIEW / CLOSE (dates, scope, filters, sign-off numbers, coverage screenshots). |
| `qa-create-qa-subtasks` | Makes sure every story has the two QA sub-tasks ("Writing Testcases" and "Testing"). Never duplicates. |
| `qa-create-testcase-auto` | Reads a story and creates every Xray Test (happy, negative, boundary, edge cases, impact on other areas), links them, Test Set, Test Plan, folders. |
| `qa-run-story-chrome` | Runs the story's tests in your own Chrome, records PASSED/FAILED live in Xray, and drafts a Defect for every failure (GIF, console, network, BE/FE, right developer). |
| `qa-recorder-defect` | Turns a bug you recorded with the Salla QA Bug Recorder into a clean Jira Defect: finds the recording and the story, writes clear steps / expected / actual, fills every field the recorder skips. |
| `qa-retest-defects` | Retests the defects the developers sent back, with evidence, then closes or reopens them and updates Xray. |
| `qa-signoff-auto` | Sign-off gates (all tests passed, defects closed, console/API/security checks), video, sign-off comment, story to PM Review. |
| `qa-automation-commit` | Playwright script hand-off: run 3 times → Jira ticket → branch → commit → PR, with a learning mode that explains every git step. |

Needs: the Atlassian MCP (Jira), the Xray MCP, and Claude in Chrome for the Chrome skills.
