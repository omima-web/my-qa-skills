# Test-case template, sizing & Xray field mapping (Salla)

## Title format (tag by what the test actually exercises)
```
[AC#(s)][Layer][Behavior]: <clear, specific title>
```
**The `[AC#]` tag is decided by the test's real scope — judgment, not a blanket rule:**
- **AC-derived test** (walks / verifies specific ACs) → tag those ACs. Multi-AC tests list all they walk, e.g. `[AC1,AC2,AC5]`.
- **Whole-story test** (validates the story, not any single AC) → **no AC tag.** Mobile sanity is always story-level → `[Mobile][Sanity]: ...`. A broad end-to-end that isn't about specific ACs → `[E2E]: ...`.
- **E2E varies by scenario:** a focused E2E that steps through specific ACs → `[AC1,AC2,AC5][E2E]`; a broad happy-path-through-the-whole-feature E2E → `[E2E]`. Decide per test — tag an AC only when the test genuinely exercises it, never just to satisfy a coverage scan.

- **Layer** — `Backend` | `UI` | `Mobile` (omit for a pure cross-seam E2E).
- **Behavior** — `Happy` | `Negative` | `Boundary` | `Integration` | `E2E` | `Security` | `Sanity`. Mirror the Xray **Test Behavior** field so title and field never disagree.

**Coverage guarantee rests on AC-derived tests only:** every AC must appear in ≥1 AC-tagged test (its happy path at minimum). Story-level tests (mobile, broad E2E) are *additional* coverage and are never how an AC's coverage is verified — so leaving the AC tag off them creates no false gap.

Examples:
- `[AC1][UI][Happy]: Verify coverage-scope option is disabled when Login Cycle is off`
- `[AC5][Backend][Negative]: Verify save is blocked at the API when Login Cycle is off`
- `[AC1,AC2,AC5][E2E]: Merchant enables promise in Dashboard -> customer sees it at Store checkout` *(focused E2E — walks these ACs)*
- `[E2E]: Full happy-path through coverage-scope delivery promise` *(broad E2E — story-level, no AC)*
- `[Mobile][Sanity]: Coverage-scope option renders on the dashboard mobile view` *(story-level, no AC)*

## Xray fields (set on every Test issue) — from the Salla create-issue form
| Field | Value |
|---|---|
| **Summary** | the title format above |
| **Description** | Preconditions -> numbered Steps -> Expected results (see below) |
| **Labels** | project + sub-module, e.g. `Shipping`, `Delivery Promise` |
| **Testing Environment** | **Stage** (default for all TCs) |
| **Test Behavior** | per scenario: Positive / Negative / Functional / Regression / Integration / System / Smoke Test / Sanity Test / Security / ... (match the title's Behavior) |
| **Testcase Type** | `APITesting` (backend) / `UITesting` (UI) / `Mobile` (mobile sanity, once the team adds it) / None |
| **Types of Functional Testing** | per scenario: Component / Integration / Regression |
| **Test Category** | `Automatable` or `non-automatable` — decide per TC (see automatable rule) |
| **Platform** | **multi-select** — `Dashboard` and/or `Store` by where the scenario runs. Layer-specific TC -> one; **cross-seam E2E -> both**. Mobile sanity -> Dashboard (dashboard's mobile view). |
| **Sprint** | the story's current active sprint (e.g. Shipping \| Sprint 26.3.1) |
| **Links** | the story's Test Set (membership) + the sprint Test Plan |

**Testcase Type and Platform are different axes:** Testcase Type = *how* (API / UI / Mobile); Platform = *where* (Dashboard / Store). A mobile TC is `Testcase Type: Mobile` with `Platform: Dashboard`.

## Automatable rule (for Test Category)
Mark **Automatable** when the scenario is deterministic and API- or UI-stable: backend/API checks (almost always), stable UI flows with clear assertions. Mark **non-automatable** for visual/exploratory/one-off checks or anything needing human judgment. Backend/API automatable TCs can additionally seed the APIDOG suite only if asked.

## Description body
```
Preconditions:
  - <state that must be true before the test>
Steps:
  1. <action> — <data>
  2. ...
Expected results:
  - <the pass/fail assertion(s)>
```

---

## Sizing / realism model — cover everything, fairly, without bloat

Coverage comes from **two sources**, not one: the ACs (the spec) AND real user behaviour the ACs don't predict (where production actually breaks). ACs describe what the system *should* do; they rarely describe what a real user *will do* to it. Test both. Goal: lean but genuinely complete.

### Source 1 — AC-driven (the floor: the spec is covered)
- **Every AC → its own Happy TC. Do NOT merge adjacent ACs.** Two different ACs = two different tests, even if they're about the same screen. "Option is disabled" and "message is shown" are *separate assertions* → separate TCs. Only merge when two ACs assert the **literally identical** behaviour (rare). This is the fix for the classic mistake of collapsing ACs in the name of "lean" and thereby dropping coverage.
- **+ direct Negative / Boundary** per AC where it has a real rejection/failure/limit path (e.g. "must not save" → a Negative; a disabled/empty state → a Boundary). Split by layer where an AC is enforced both in UI and backend (UI Negative + API Negative are two tests).

### Source 2 — risk-driven edge cases (where the real bugs live)
Derive edge cases from the same business-logic interrogation as `qa-grooming` (state transitions, disabled/missing data, fallback-of-fallback, multiplicity, guest users, mid-flow changes) — the ones **no AC mentions but a real user will hit**. Turn each into a TC, tagged to the nearest related AC(s).
- **Balanced aggressiveness:** cover the **high-risk, plausible-user-path** edge cases (e.g. fallback-of-fallback, guest checkout, existing record already in an invalid state, multiple items some disabled). Do **not** exhaustively permute — skip contrived inputs with no real path or risk. The pause lets the engineer add lower-probability ones.

### Undefined-behaviour edge cases (real path, but no defined expected result)
Some edge cases are real but the PM hasn't decided what *should* happen (e.g. a reverse-toggle). **Still create the TC** — a tracked, visible placeholder beats a comment that scrolls away and gets forgotten. Mark it unmistakably so no one runs it as-is:
- Add the label **`unresolved-testcase`** (in addition to the sub-module labels).
- **Test Category = non-automatable** (can't automate an undefined assertion).
- Expected results line: `⚠ PENDING PM DECISION — behaviour not yet defined; do not execute until confirmed.`
- Also (see the skill) offer to post ONE PM comment listing these + asking for the expected results, linking the placeholder TCs. TC = the anchor that won't get lost; comment = the nudge that gets it answered. Once defined, the engineer removes `unresolved-testcase`, sets the real expected result, and re-evaluates automatable.

### Story-level additions (additive — on top of the AC count, not folded in)
- **One cross-seam E2E** when Impacted Surface is **Both** (Dashboard sets it → Store reflects it) — one total.
- **One mobile sanity TC — ONLY if `Dashboard` is in the labels.** Not triggered by a Frontend component alone; specifically when the change touches the Dashboard (which has a mobile app). One TC covers the dashboard-on-mobile for the whole story. (Testcase Type = Mobile, Platform = Dashboard.)

### Discipline that keeps it lean
- **One TC = one behaviour.** Don't split what a single test verifies; don't merge two distinct expected-results.
- **Collapse only true duplicates.** If two ACs exercise the identical path, one TC tagged with both — never merge merely-adjacent ACs.

### Safety net
- Build the **AC → TC map** and show it. An AC with **zero** TCs is a hard error.
- **SP is a sanity band, not the driver:** flag if the count is an outlier for the story's points, but never pad or trim just to hit a number.

For reference, a 5-SP, Both-surface, ~9-AC story lands around **18–22 TCs** with this model — a happy per AC (unmerged), the earned negatives/boundaries, the high-risk edge cases, one cross-seam E2E, and one mobile sanity (Dashboard labelled). Lean means no duplicates and no contrived permutations — NOT fewer than one real test per AC.
