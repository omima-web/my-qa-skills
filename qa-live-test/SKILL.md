---
name: qa-live-test
description: Live (Production) test of a Salla CPD story after it is deployed and waits for Approve / Decline. Creates the "Live Test | [story]" sub-task, runs the story's regression set (Xray tests labelled `regression`) on Live in your Chrome with evidence, and rechecks every closed defect of the story on Live. A failure tied to the story → Defect under the story through the QA Bug Recorder form, NO Approve: choose Decline / Reject and send the story back to that defect's developer. A problem unrelated to the story → Bug (Todo + next sprint), which doesn't block. All clean → close the sub-task with a comment and Approve. Use when the user says "تست اللايف", "اللايف جاهز", "الستوري نزلت لايف", "live test", or gives a deployed story key.
---

# Live test of a deployed story

Reply in the user's language. Chrome how-tos: `automation\CHROME-TEST-RUN-CONTEXT.md` (read first; append anything newly agreed). Area context: `D:\omima-qa\context\<area>-context.md` (sync it with Jira after its «آخر مزامنة مع جيرا» date first).

## Constants
- Jira cloudId `55c7c758-a0af-4f65-a8cb-c162bb760aab`, project `CPD`, board 90. The user's accountId comes from `atlassianUserInfo`.
- Story workflow: … PM Review → Preparing to Deploy → **Deploy** → Deployed → Closed. Read transitions live (`listJiraIssueTransitions`), never guess ids.
- Xray writes: `xray-graphql` MCP, fallback `node ~/.claude/xray-gql.js`. Max 25 operations per mutation batch.
- Evidence folder: `evidence\<STORY>\live\`.
- Bugs / Defects only through the QA Bug Recorder form (`qa-recorder-defect`).

## Inputs
Story key(s). The Live URLs come from the story (Test Link / description) and the area context file. The user logs in themselves (merchant, partner, admin) and enters OTPs; on Live use only their test stores / marketers (; nasa login-as-store when it's up).

## Steps

### 1. Read and check it's ready
- `getJiraIssue <story>` (view `full`): status, ACs, sprint, sub-tasks, Test Link, Development (deployments).
- It must be deployed to Production and waiting for the decision (status Preparing to Deploy / Deployed with the Approve / Decline choice on the story). Not deployed yet → tell the user and stop.
- **Find the decision control once and write it here + in the run context** (2026-10-25: not yet seen): on the story page in their Chrome, look for the deployment approval (Approve / Decline, Reject or Discard) in the Releases / Deployments panel or the status menu. Never click it before step 6.

### 2. Sub-task + execution
- Create-or-reuse the sub-task **`Live Test | <story summary>`** under the story, assigned to the user, In Progress (same pattern as `Testing | …`; transitions read live).
- Create-or-reuse Test Execution **`live test for <story summary>`**: sprint set, assignee = their, Testing Environment = Production, added to the sprint Test Plan, moved to In Progress.
- Add the story's tests with label **`regression`**. None (older story)? Pick them by the standard in `qa-create-testcase-auto` step 4b, add the label, don't ask the user.

### 3. Run the regression set on Live
- Same rules as `qa-run-story-chrome` step 2 (GIF per test, screenshot at the verdict, console + network, AR/EN × light/dark only when the test is about UI). Each run → EXECUTING → PASSED / FAILED / BLOCKED as soon as it ends.
- **Live safety:** never pay real money, transfer, or message real merchants / marketers; never change real merchant settings beyond what the test needs, and undo test changes after. A test that needs one of these → mark it BLOCKED with the reason and hand it to the user.
- API-only story: run its Apidog suite on the Live environment (`qa-api-suite`, switch the Apidog Environment) instead of Chrome.

### 4. Recheck the story's closed defects on Live
- `parent = <story> AND issuetype = Defect AND status = Closed` (plus defects linked to the story's executions). Dev Rejected ones are skipped.
- Repeat each defect's steps on Live with a GIF + screenshot. Fixed → note it. Back again → it's a failure tied to the story (step 5).

### 5. A failure
- Finish Claude's own evidence, then: «التست/الديفكت <KEY> فشل على اللايف — افتحي QA Bug Recorder وابدئي Capture.» Repeat only the bug's steps under it, then «اعملي Stop & review», note the report id.
- Classify : **tied to the story** (an AC, a regression test, a closed defect that came back) → **Defect under the story** (Related ticket = story, the story's BE or FE dev). **Unrelated to the story** → **Bug**, Todo + next sprint.
- Draft in the recorder form's fields (formal Arabic), show all drafts together and **wait for the user OK**; then create each through `qa-recorder-defect` (way B).

### 6. Decision on the story
- **Any story Defect** → **no Approve.** Choose the other option (Decline / Reject / Discard), then move / assign the story back to that Defect's developer (BE or FE; several → the FE dev unless all are BE). Comment on the story: `@<dev>` + the defect keys + one line each. Keep the sub-task and the execution In Progress.
- **Only unrelated Bugs, or nothing failed** → close the execution, close the `Live Test |` sub-task with the comment `تم الاختبار على Live — <N>/<N> PASSED` (+ the Bug keys if any), attach the evidence, then **Approve** the deployment (do it only if the user said to in this run; otherwise tell the user «جاهزة للـ Approve» and stop).
- Read back: story status + assignee, sub-task, execution, created defects / bugs.

### 7. Report
Table: test / defect | result on Live | new Defect / Bug (key, BE/FE, assignee). Then the decision (Approved / Declined → dev) and the execution link. Update the area context file (story live status, new bugs, who found them).

## Rules
- Stop points: before creating any Defect / Bug (the user's OK on the drafts), and before Approve unless the user already said to.
- Never Approve with an open story Defect from this run.
- Live safety rules in step 3 always apply.
- No new test cases here: Live uses the `regression` set + the closed defects only.
- If Chrome isn't reachable, say so and stop; don't switch to another browser without asking.
