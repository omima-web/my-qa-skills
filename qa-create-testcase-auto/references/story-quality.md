# Story Quality check (authenticity & coherence)

A separate lens from the AC review. The AC review asks *"are the criteria testable and complete."* This asks *"is the story coherently authored, or does it show signs of unreviewed AI-generated content that a PM pasted without checking?"* A story can read fluently and still be hollow — plausible ACs that don't match how the feature works, contradictions the author never noticed, generic filler.

**Framing is mandatory: diplomatic.** Never declare "this was written by AI" — we can't know, and false accusations are corrosive. Flag **signals worth a PM re-read**. The useful output is the same either way: "these specific things need a human's eyes before dev."

## What to check
- **Internal contradictions** — ACs that conflict with each other or with the user story.
- **Vague-authority language** — confident phrasing with no concrete behavior: "should handle appropriately," "as needed," "similar to," "etc." Flag each instance.
- **Terminology drift** — the same concept named two different ways (a classic tell that the author didn't reconcile terms). E.g. using "Pickup & Delivery" and "Logistics Cycle" interchangeably without saying they're the same.
- **Specificity test** — could this AC belong to *any* product, or is it genuinely specific to this squad/feature? Generic = suspect.
- **Coherence with reality** — do the ACs match how the epic and sibling stories say the system actually works? Contradicting the epic is a strong signal.
- **Structural tells** — suspiciously uniform AC phrasing, or ACs that restate the title without adding behavior.

## Output — a verdict line at the TOP of the review
Put a one-line verdict near the top so the reader knows at a glance whether to dig in:
- ✅ **Story quality: reads authored and coherent.**
- ⚠ **Story quality: shows signals worth a PM re-read** — then list the specific signals lower down (which ACs, which phrases).

Keep the signals specific and cite the AC/phrase. The goal is a PM re-reading the flagged spots, not a debate about how the story was written.

## Round-2 (engineer) addition
In the engineer round-2 skill, after running this check fresh, also verify whether the **round-1 quality signals were addressed** — did the PM tighten the vague ACs / reconcile the terminology the lead flagged? Mark each prior quality signal Resolved / Still open, same as the concern audit.
