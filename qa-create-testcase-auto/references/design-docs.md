# Reading linked Confluence design docs (dev Plan-of-Action / API contracts)

Dev teams (BE/FE) often attach a Confluence page to a story during tech grooming or after planning — an API-contract / Plan-of-Action doc. It usually holds the **concrete testable detail the ACs lack**: exact endpoints, precise validation limits, an edge-case table, and open technical questions. Always look for it and read it — it materially improves the tests.

## How to find it (proven chain)
The page is a **remote link**, NOT a Jira issue link — it will NOT appear in `issuelinks`. Steps:
1. `getJiraIssueRemoteIssueLinks(issueKey)` → returns remote links.
2. Keep the ones where `application.type == "com.atlassian.confluence"`.
3. Extract the **pageId** from `object.url` (e.g. `...pageId=1423179856`) or the `globalId` (`...&pageId=1423179856`).
4. `getConfluencePage(pageId, contentFormat: "markdown")` → full body.

Cases:
- **Zero Confluence links** → proceed on the ACs alone. The doc is a bonus, never required.
- **Multiple links** → the relationship is usually "mentioned in", so any page that references the ticket appears. Read the ones that look like design docs (sections like Task Understanding / API Endpoints / Validation / Proposed Solution / Edge Cases). If it's ambiguous which page is the design doc, list them and ask.
- **Can't read (permissions / deleted)** → note it in the report and continue on the ACs.

## What to mine (docs are free-form — extract signal, don't expect a fixed schema)
| Doc section (typical) | Use for |
|---|---|
| API Endpoints table | concrete **Backend** TCs (real method + path) |
| Validation Rules / limits | exact **Boundary** TCs (the real numbers) |
| Edge Cases table | **edge-case** TCs — often already AC-tagged in the doc |
| Pending Decisions / open questions | see conflict rule below |
| "affects checkout / other module" notes | the **cross-seam E2E** hint |
| The devs' own Testing Plan | a **coverage cross-check** — did we cover what they expect? |

## Conflict rule (important)
The doc is the **dev's implementation plan**; the **ACs are the product contract**. When the doc **contradicts an AC** (e.g. doc says 45 km, AC5 says 50 km):
- **Write the test case to match the AC** — the AC wins for the expected result.
- **Do NOT silently trust the doc, and do NOT make it an `unresolved-testcase` placeholder** for the conflict itself.
- **Raise the discrepancy as ONE PM comment** (fold it into the same PM comment the skill already offers for undefined edge cases): "Design doc `<page>` and AC# disagree on `<value>` (doc: X, AC: Y) — tests were written to the AC; please confirm the correct value." — so the test is executable now and the conflict gets resolved by the PM.

The doc **enriches** (adds endpoints, edge cases, concrete data); the **AC governs** the expected result. Enrich freely; on conflict, AC wins + flag.
