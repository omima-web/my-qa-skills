# Dashboard baseline — UI stories only (QA hygiene, not PM-gated)

> **Rule: use these cases only when the story adds or changes UI** (new screen, redesign, new labels/components, a design/Figma link). A functional/backend story with no design change (e.g. CPD-32693 bank-transfer affiliate credit) gets **no** Localization / Dark mode / Responsive / Multi-language cases. Security / API / Performance only when the story touches them. Focus on the ACs + edge/corner/impact cases. This note overrides "always" below.

Any **Dashboard** (merchant) story earns these baseline cases **by default**, the same way a Dashboard story earns a mobile sanity check. They are standard QA hygiene — they are **not** gated on a PM answer; they always apply to Dashboard surfaces. They exist to stop the recurring "missed case" gaps (localization, multi-language data, dark mode). Give each a proper `[Layer][Behavior]` title and tag the sub-module.

## The baseline set
1. **Localization (AR/EN)** — *always for Dashboard.*
   Validate every label, message, and piece of content on the story's screens renders correctly in **both Arabic and English** — including layout direction (RTL/LTR), truncation, and that nothing stays hard-coded/untranslated.
   Title example: `[UI][Localization] labels & content correct in AR and EN`.

2. **Dark mode** — *always for Dashboard.*
   Validate the story's screens render correctly in **dark mode** — contrast, readable text, no invisible/blown-out elements, icons/badges/empty-states themed correctly.
   Title example: `[UI][Dark Mode] screens render correctly in dark mode`.

3. **Multi-language input** — *when the story has a create/edit surface.*
   This is a **data-integrity** check, not just display: create/edit the entity with content in **Arabic and English** (e.g. product name AR + product name EN), save, and verify **each language is stored and reflected correctly** in its own context (dashboard view, store front, edit re-open) without cross-contamination or fallback errors.
   Title example: `[UI][Multi-language Input] entity saved & reflected correctly in AR and EN`.

4. **Responsive** — *always for Dashboard / Partners Portal UI.*
   Check the story's screens at **desktop 1440**, **tablet 768** and **mobile 375** widths: no horizontal scroll, nothing cut off or overlapping, menus/tabs/tables/dialogs usable, and the RTL layout holds at every width. This replaces the old single `[Mobile][Sanity]` case (it still covers the mobile view).
   Title example: `[UI][Responsive] screens render correctly on desktop, tablet and mobile`.

5. **Security** — *always, UI and backend stories.*
   In DevTools / network log on the story's screens: no token, password or PII in URLs, query strings or console logs; nothing sensitive in localStorage/sessionStorage; no mixed content (all calls HTTPS); calling the story's endpoint **without a token → 401** and **as another partner/merchant → 403/404** (no data from another account); inputs reject script/HTML (`<script>alert(1)</script>` is shown as text or rejected, never run).
   Title example: `[Backend][Security] no data leaks and endpoints reject unauthorized access`.

6. **API** — *always when the screen calls an API (list, search, save, etc.).*
   From the network log: the story's requests go to the right endpoint with the right method and params (e.g. tab → type filter, search → keyword, page → page number), return **200** with the expected body fields and paging, and show a proper error state in the UI when the call fails (4xx/5xx). Add one negative call (bad param / missing field → 4xx with a message, not 500).
   Title example: `[Backend][Integration] API calls, params and responses are correct`.

7. **Performance** — *always for Dashboard / Partners Portal UI; for backend-only stories, API response time only.*
   On a fresh load of the story's page (cache on, normal network), measured in Chrome with the Performance API:
   - Page: **LCP < 2.5 s**, **load event < 3 s**, **CLS < 0.1**. No long freeze when switching tabs, paging or typing in search.
   - API: each story's request **< 1 s** (from `performance.getEntriesByType('resource')`). The same request isn't fired twice for one action, and search is debounced (typing a word = 1–2 calls, not one per letter). No response bigger than ~1 MB for a single list page.
   Write the measured numbers in the test result.
   Title example: `[UI][Performance] page and API load within limits`.

## Every test must be runnable by Claude in Chrome
Claude runs these tests later with `qa-run-story-chrome` in your Chrome, so write each one so it can be run without guessing:
- Give the exact **URL / page path**, the account type, and the exact data to enter or search for.
- Steps are concrete actions (click tab X, type Y, resize to 375, toggle dark mode from the header moon icon, switch language from the header).
- Expected results are things that can be seen on screen or checked in **console / network** (status code, endpoint, param, body field, error text). No "works fine" or "looks good".
- Responsive steps give the widths (1440 / 768 / 375); Security and API steps say which request to inspect and what to look for.
- If a step needs something Claude can't do alone (a second account, a DevTools override, an email inbox), say so in the step so the run skill can ask for it up front.

## When multi-language input applies
- **Applies** when the story creates or edits an entity that carries user-entered, translatable content — create product, edit product, create/edit category, shipping company name, custom fields, any "add/edit" form with localizable text.
- **Does not apply** to read-only screens, pure config toggles, dashboards/reports, or actions with no localizable text input.
- **If it's ambiguous** whether the story has a localizable create/edit surface, **ask the user to confirm** before deciding — don't silently include or drop it. (Localization + dark mode still apply regardless.)

## Scope discipline
- These are for **Dashboard / Partners Portal / store-facing** stories. A purely backend/internal story with no UI doesn't earn the UI baseline (localization / dark mode / responsive), but it **still gets Security, API and Performance (API response time)**; note why if skipping anything.
- Keep them to **one case each** — don't fan localization into one-per-label. The single case covers the story's screens.
