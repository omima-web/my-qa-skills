# Reading a Salla ticket (shared foundation)

Before analysis or coverage, build a complete picture of the story. Never work from the title alone. Quality is designed in during grooming — so front-load the understanding here.

1. **Fetch the story** (`getJiraIssue`, fields incl. description, acceptance criteria, **components**, labels, story points, sprint, links, comments, attachments).
2. **Layer — read `Components`, NOT `Labels`.** Salla tags the layer as **Components: `Backend` / `Frontend` / both**. This decides which test-case layers are needed (Backend → backend TCs; Frontend → UI TCs + a mobile-journey TC; both → both). Fall back to Labels only if Components is empty.
3. **Impacted Surface — read the `Dashboard` / `Store` Labels.** This is a *different axis* from Components: Components is the layer (BE/FE); Impacted Surface is *where the change shows up and where QA must test*. It's authoritative, set by the PM — **do not infer it.** Rules:
   - `Dashboard` label present → merchant-side (dashboard) surface.
   - `Store` label present → customer-side (storefront / checkout) surface.
   - **both labels present → treat as Both** (there is no "Both" label — it's derived).
   - **neither present → EMPTY** → this is a grooming gap: flag it for the PM to fill before round 2 (see Workflow output). Do not guess the surface.
   This drives coverage later: Dashboard → merchant UI TCs (+ mobile-journey); Store → storefront/checkout TCs + a Store E2E; Both → both, plus a cross-seam E2E (merchant configures in dashboard → customer sees the effect in store).
4. **Story points — read `customfield_10030`** (this Jira instance's Story Points field; the default `customfield_10016` is empty here). If that's empty too, discover the field whose name is "Story Points" / "Story point estimate" and read that. Only flag "story points not set" when it's **genuinely** missing after that lookup.
5. **Acceptance criteria** — extract each AC. Assess: is it clear, testable, and numbered? Note vague, missing, or untestable ACs.
6. **Epic + linked stories** — open the linked **epic** and the **sibling stories** under it. The epic gives feature context and is usually the sub-module; siblings reveal dependencies and shared behavior. Note any story this one depends on or conflicts with.
6b. **Direct issue links + linked bugs** — beyond epic siblings, walk the ticket's own **issue links** (`issuelinks`), which may point *outside* the epic. Read the high-signal ones and note what affects scope, edge cases, or testing — **read for signal, don't transcribe every link** (a ticket may have many; skip low-signal provenance links). Priority:
   - **`is blocked by` / `blocks`** → a dependency — read it; it may define a contract or shared behavior this story relies on.
   - **linked bugs** (via `relates` / `is blocked by` / `is tested by`) → **read them** — a known defect reveals real behavior and edge cases the ACs won't state (e.g. a bug like "delivery promise not applied without login cycle" is exactly what coverage must account for).
   - **`relates` / `duplicates`** → skim for scope overlap (avoid gaps or duplication).
   - **`clones` / provenance links** → usually low signal — skip unless nothing else informs the story.
   Note: the linked-issues panel also shows Xray **Test / Test Set / Test Execution** links — those are coverage artifacts, not requirements; handle them in the test-coverage step, not here.
7. **Edge cases** — derive the edge / boundary / invalid / integration cases the ACs imply. Check each against the ACs: covered, or **missing**? Missing edge cases are the highest-value grooming find.
8. **Design** — if the story has a **Frontend** component (or clearly touches a screen) and **no design/mockup is attached**, ask the user for the design screenshot/link before finalizing UI analysis or UI test cases. Don't invent UI behavior.
9. **Sub-module** — resolve it via `sub-modules.md` (epic-anchored, with a confidence gate). Always surface the pick before tagging.
10. **Story quality** — run the check in `story-quality.md` (is the story coherently authored, or does it show signals of unreviewed AI-generated content). Diplomatic framing.

Keep the assembled picture; the workflow builds on it.
