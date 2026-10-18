# qa-signoff-auto — transitions, fields, templates (CPD)

Taken from the team skill `qa-signoff` (`references/signoff-templates.md`, proven on SHPD). The ids below are the team's SHPD values. **Verify them on CPD live** (`getTransitionsForJiraIssue`, transition screen) on the first run and correct this file.

## Transitions (from In-Testing)
- **Approve → "Move to PM Review"**: id **361** (verified on CPD; from Ready for Testing run "start test" id 41 first; validator requires TestDino Link customfield_19497 + Demo Link customfield_19498) → status **PM Review**. It is conditional, so the transition is rejected without a PM assignee.
- **Reject → "Reopen"**: id **131** → Re-opened, back to the developer. ("Ready for Testing", id 4, also exists; Reopen is the usual reject path.)
- QA sub-tasks and the Test Execution are closed through their own live-discovered "Close" / "Done" transition.

## Fields on Move to PM Review
- `assignee`: the PM, which on CPD means the story's **Reporter**.
- **Testing Environment** `customfield_10786`: Development Server 11095 · Production 11096 · Stage 11097 · Beta 13406. On CPD, Live = `Production`.
- **QA Sign-off Checklist** `customfield_18171` (**not on the CPD transition screen**, verified 2026-10-08; keep the checklist in the comment only) (multicheckbox, pass `[{"id":"…"}]`): Functional 21908 · Merchant App 23378 · Edge Case 21909 · Mabl Automation 21910 · Mabl Run 21911 · Integration 21912 · Store Apps 23640 · Security 21913 · Design 21914 · Browser 21915 · Localization 21916 · Responsive 21917 · Demo 21918 · Log/Network 21919 · Rovo AI 23761 · Light/Dark 23858 · Multi-market 24596.
- **Approvers** `customfield_12201`: only if the user names them.

## Checklist mapping (tick only what the run really covered)
| Covered in the run | Tick |
|---|---|
| Functional ACs PASSED | Functional |
| Negative / boundary tests PASSED | Edge Case |
| Chrome desktop run | Browser |
| AR + EN checked | Localization |
| Dark mode checked | Light/Dark |
| Mobile view checked | Responsive |
| UI matches design / reference | Design |
| Markets checked | Multi-market |
| Console clean + no failed calls | Log/Network |
| Security test done – OK | Security |
| API test done – OK | Integration |

If a security or API test was **not needed**, leave its box unticked. The comment's checklist says "not needed" with the reason.

## Comment checklist (the team's 17 items + personal additions), every line one of:
- ✅ done (+ short result if useful)
- ❌ not needed — <reason>
- ⚠️ not done — <why> (only when it should have been done, e.g. Firefox not run; say it honestly, never mark ✅)

**20 lines, always all of them, one item per line, never grouped:** the team's 17 items (exact names) followed by the QA's 3.

Team QA Sign-off Checklist (17):
1. Functional
2. Merchant App
3. Edge Case
4. Playwright Automation (the Jira list still calls it "Mabl Automation"; the team now automates with Playwright, so the line uses the Playwright name)
5. Playwright Run (Jira: "Mabl Run")

   Until the QA starts automation for the story, write them exactly as:
   `❌ Playwright Automation — not started yet` / `❌ Playwright Run — not started yet`.
   Once a story has Playwright tests: `✅ Playwright Automation — <spec / PR>` / `✅ Playwright Run — <N>/<N> passed`.
6. Integration
7. Store Apps
8. Security
9. Design
10. Browser (name each browser: Chrome ✅ · Firefox ⚠️/✅ · Safari ⚠️/✅)
11. Localization
12. Responsive
13. Demo
14. Log/Network
15. Rovo AI
16. Light/Dark
17. Multi-market

personal additions (3):
18. Test cases executed (Xray): <N>/<N> passed · Test Execution <KEY>
19. API test: done + result, or not needed + reason
20. Console: clean / errors found

## Environment line (always explicit)
- Tested on Live → `Environment: Live (Production) — <live URL, e.g. https://s.salla.sa/...>`, Testing Environment = Production.
- Tested on the dev / PR link → `Environment: Development — <dev link from the story's Test Link field>`, Testing Environment = Development Server.
- Tested on both → write both lines.

## Template — APPROVED
```
✅ QA Sign-off — Passed — moving to PM Review
Tested by: <your name> · Environment: <Live / Dev + URL> · <date>
Coverage: <N>/<N> passed — Test Execution <KEY>

🎥 Video: <embedded inline media — REQUIRED>


QA checklist:
✅ Test cases executed — <N>/<N> passed
✅ Functional — AC1–AC<n>
… (all lines above, one per line)

Notes: <only if needed: accepted PM decisions · Dev Rejected defects �>
```

## Template — REJECTED (team, red)
```
❌ QA Sign-off — Rejected — returning to development
Tested by: <your name> · Environment: <env> · <date>
Blocking issues:
1. AC# — <surface> <what's wrong>. Expected: <x>. Actual: <y>. Sev <n>. 🎥 <video>
What passed: <ACs>
Coverage: <N> executed — <P> passed, <F> failed (<which>) — Test Execution <KEY>
Notes: <defect links; re-test guidance>
```
