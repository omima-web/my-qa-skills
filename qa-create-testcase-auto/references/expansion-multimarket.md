# Expansion & Multimarket — coverage dimensions (PM-gated)

Two Salla-specific dimensions that change **how a feature reflects on the store**, and are a frequent source of missed cases. Both are **coverage dimensions** — a feature that passes on a plain Saudi single-market store can still break on a different expansion store or a multimarket store. Grooming and planning **always raise them as questions**; create-testcase **writes the cases based on the answer** (see the PM gate).

## The two dimensions (don't confuse them)
- **Expansion = the store's own home country**, chosen when the store is created (UAE-based, SA-based, KW-based, JO-based store…). The home country can change how a feature behaves/reflects. QA goal: **run the feature across stores of different home countries.**
- **Multimarket = one store selling into multiple markets** (e.g. a store with Jordan, UAE, … market sites and a "shopping from another region" selector). Features can be wired to multimarket config and behave/reflect per market. QA goal: **run the feature against a store operating multiple markets, verifying per-market reflection.**

Both ultimately affect **store reflection** — so most store-facing features could be impacted by one or both.

## What to cover (priority scope)
- **Expansion** → explicit cases running the feature on the **main home-country stores: SA, KW, UAE** (the priority set). Add others (JO, BH, …) only if the story or PM calls them out.
- **Multimarket** → **3–4 cases** covering the **SA, KW, UAE, BH** markets — verifying the feature reflects correctly in each market.

Give each case a clear title, e.g. `[Expansion][SA] <feature> behaves/reflects correctly on a Saudi store`, `[Multimarket][UAE] <feature> reflects correctly in the UAE market`.

## The PM gate (how create-testcase decides — silence never means skip)
For **each** dimension, decide from the PM's answer on the ticket (grooming/planning comment or a PM reply):
- **PM explicitly says NO / not applicable** → **skip** those cases, and record why in the PM comment / test notes ("Expansion: N/A per PM", "Multimarket: N/A per PM"). The documented N/A is the paper trail that protects against missed-case blame.
- **PM says YES** (or the story clearly touches the dimension) → write **real** cases (SA/KW/UAE for expansion; SA/KW/UAE/BH for multimarket).
- **PM has not answered / no definitive answer on the ticket** → write them as **`unresolved-testcase` placeholders** (non-automatable, do-not-execute, expected result marked PENDING PM). They must **exist** and be visible until the PM rules. **Default to placeholder** whenever the answer isn't clearly found.

Only an **explicit PM rejection** removes these cases. Silence, ambiguity, or "no reply yet" → placeholders, never omission.

## Cross-skill flow
- **qa-grooming / qa-planning** → always ask: "Does this feature depend on the store's home country (Expansion)? Does it vary by market (Multimarket)?" Record the answer (or "unanswered") in the posted comment so create-testcase can read it.
- **qa-create-testcase** → read that answer; apply the PM gate above (skip / real / placeholder). If it can't find a definitive answer, default to placeholders and note it.

## Scope discipline
- These matter for **store-facing** features. A purely backend/internal change with no store reflection may legitimately be N/A — but that still goes through the gate (PM confirms N/A), it isn't silently dropped.
- Keep expansion to the **SA/KW/UAE** set and multimarket to **SA/KW/UAE/BH** unless the story/PM widens it — don't fan out to every country.
