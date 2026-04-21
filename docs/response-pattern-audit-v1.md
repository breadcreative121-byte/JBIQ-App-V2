# Response Pattern Audit — v1

**Audited against:** [Response Pattern Model v1.0](./response-pattern-model.md)
**Scope:** The 3 existing DiscoveryView sub-patterns only — Place, Catalog, Compare. Freeform Claude API responses, missing intent shapes, and code fixes are **out of scope**.
**Date:** 2026-04-21
**Auditor:** Session-generated from source-of-truth evidence in `discovery.js`, `index.html`, `server.js`. File:line refs are authoritative as of this commit.

---

## 1. Architecture summary

How a user utterance becomes a rendered response today:

1. User submits text in the main chat (`index.html` chat input).
2. `matchDiscoveryQuery(text)` at [index.html:3142](../index.html) scans `DISCOVERY_QUERY_PATTERNS` (19 regexes at [index.html:3117-3140](../index.html)) — first match wins. Returns a view ID or `null`.
3. If a DiscoveryView ID matches: the corresponding `MOCK_*` object in `discovery.js` is looked up and passed to `window.renderDiscoveryView(view)` at [index.html:3637-3643](../index.html). The view renders inline in the chat, wrapped in `.jbiq-discovery`.
4. If no DiscoveryView matches and the text isn't a restaurant/shopping intent, the utterance is sent to Claude Sonnet 4 via the `/api/chat` endpoint (`server.js`). The response is a plain-text string rendered with a typewriter effect ([index.html:3610-3622](../index.html)). No structured slots. **(Out of scope for this audit.)**
5. Restaurants and shopping are **hardcoded intercepts** on separate paths, predating DiscoveryView. (Out of scope.)

**System prompt** ([server.js:29-35](../server.js)):
> "You are a helpful AI assistant called JioBharatIQ. Keep responses concise and conversational. Respond in plain text without markdown formatting." [+ optional location context]

No Model-derived rules are present in the prompt — no anatomy, no Hinglish directive, no prohibited-pattern constraints.

**Schema in code** ([discovery.js:59-176](../discovery.js)): `DiscoveryView` is a union discriminated by `sub_pattern` ∈ {`place`, `catalog`, `compare`}. Every view has `kind`, `sub_pattern`, `state: 'PARTIAL_RESULT_SHOWN'`, `subject: {title, subtitle?}`, optional `filters`, optional `sort`, a `collection`, and `meta`. Place adds `location_context` + `map`; Compare adds a row/option matrix.

**Interactivity is inert.** Every primitive stamps a `data-event` attribute. Both delegated listeners at [discovery.js:2920-2931](../discovery.js) only `console.log` the event name. No chip tap mutates state, no sort triggers a re-render, no card tap routes anywhere. The rendered response is a static snapshot.

---

## 2. Compliance table

Evidence is linked to source. **Pass** = current code fully satisfies the rule. **Partial** = structural scaffold exists but enforcement or behaviour is incomplete. **Fail** = rule is structurally absent or directly violated.

### §3 — Response Invariants

| # | Invariant | Verdict | Evidence |
| --- | --- | --- | --- |
| 3.1 | Every response must conform to canonical anatomy (§5) | Partial | DiscoveryViews conform partially: subject ≈ Context Line, collection ≈ Primary Result, filters ≈ Refinement. No Edge Affordance slot. Freeform Claude responses have no slots at all (out of scope). |
| 3.2 | No response may begin with filler | Fail | No guard in system prompt ([server.js:29](../server.js)); Claude may emit "Sure!", "Let me find…", etc. DiscoveryView subject is controlled, so this lands on the Informational path. |
| 3.3 | No follow-up question for info a chip could represent | Fail | Not enforced anywhere. Claude API path is free to ask. DiscoveryView can't even attempt this — no dialogue turn. |
| 3.4 | Inference surfaced in response, never silent | Partial | Some MOCKs surface festival/delivery context in `subject.subtitle` (e.g., "240+ styles · Delivery by Nov 10" at [discovery.js:1482](../discovery.js)), but it's author-written per-mock, not enforced. |
| 3.5 | Response language matches intent language (inc. code-switching) | Fail | No language detection. System prompt is English-first. Hinglish exists only as one hardcoded shopping line at [index.html:3324](../index.html). All MOCK_* subjects and cards are English. |
| 3.6 | No form before a result | Pass | DiscoveryView always renders results; shopping/restaurant paths show results first; Claude path produces text, not a form. |
| 3.7 | No irreversible action without COMMITMENT_REQUIRED | Not applicable at current scope | DiscoveryView state is `PARTIAL_RESULT_SHOWN` only — no commitment flow exists yet. |
| 3.8 | No gratuitous closing prompt | Fail | Not enforced for Claude path. DiscoveryViews have no tail text, so they comply by construction. |

### §5 — Canonical Response Anatomy (4 slots, fixed order)

| Slot | Model requirement | Current implementation | Verdict |
| --- | --- | --- | --- |
| 1. Context Line | 0–1 sentences, inferred signal | `subject.title` + `subject.subtitle` — two fields, separated bullet (e.g., "Restaurants near you · 15 within 2 km" at [discovery.js:868](../discovery.js)). Rendered by `.subject-header` | Partial |
| 2. Primary Result | Required | Always rendered via `collection`. Place: carousel; Catalog: grid/list/carousel; Compare: table | Pass |
| 3. Refinement Layer | Chips when Primary Result has >1 option | `filters.chips[]` renders ([discovery.js:353-372](../discovery.js)) but **chips are dead — click handler is `console.log` only** at [discovery.js:2920-2925](../discovery.js). Also `sort` is a dropdown, not chips | Fail |
| 4. Edge Affordance | Optional fourth slot ("See more", "Compare", "Remind later") | **No slot exists in the schema.** Primary_event on cards ≠ an edge affordance | Fail |

### §6 — The Context Line

| Rule | Verdict | Notes |
| --- | --- | --- |
| One sentence, maximum | Fail | Currently two fields (`title` + `subtitle`) joined by a bullet. Not one sentence. |
| Must contain inferred signal | Partial | Some subtitles carry signal ("Delivery by Nov 10" at [discovery.js:1482](../discovery.js), "Fri 8pm · 3 shows" in movies). Others are pure count/filler: "240+ styles · Delivery by Nov 10" (count) or "5 results" generic. No enforcement. |
| May surface festival timing, delivery window, price range, autonomy hint | Partial | Festival is implicit in "Kurtas for Diwali". Delivery cutoff is a subtitle fragment, not a first-class field. |
| Must never: apologise, narrate, ask a question, greet, echo intent | Pass (by construction) | MOCK authors did not write filler. No runtime guard for future mocks or AI-generated content. |

**Structural gap:** the schema should make Context Line a single `context_line: string` field with an optional `signal_kind: 'festival'|'delivery'|'budget'|'price'|'autonomy'|'memory'` enum — then the prohibited-pattern suite can key off kind.

### §7 — The Primary Result

| Rule | Verdict | Notes |
| --- | --- | --- |
| Multi-option: 3–5 cards maximum. Never more | **Fail** | Several MOCKs exceed the cap. Audited examples: **MOCK_KURTA_DIWALI has 6 cards** ([discovery.js:1503-1572](../discovery.js)); **MOCK_TRAINS_TATKAL** and **MOCK_PHONES_20K** should be spot-checked (scope note below). |
| Single-path: one prepared, commitment-ready card | N/A | No Single-Path sub-pattern implemented. |
| Informational: inline prose, no card | N/A (out of scope) | Freeform Claude responses are out of scope. |
| Stateful query: live state foregrounded | N/A | Sub-pattern not implemented. |
| Every card surfaces key inferred attributes on its face | Pass (mostly) | Place and Catalog cards surface rating, price, distance, status on face. Compare surfaces per-row values. |
| Inferred editable values visibly editable (chip or tap) | Fail | Chips exist for filters but don't actually edit anything (see §8). |
| Price in Indian format (₹1,499) | Pass | All MOCKs use ₹ and Indian separators. |
| Time-sensitive attributes surfaced (delivery, validity, due date) | Partial | Some MOCKs have `temporal_label` ([discovery.js:108](../discovery.js)) but many omit it (e.g., doctors, schools). |

### §8 — The Refinement Layer (core rule: chip, not question)

| Rule | Verdict | Notes |
| --- | --- | --- |
| If refinement can be a chip, it MUST be a chip | Fail | Chips render but are inert ([discovery.js:2920-2925](../discovery.js)). No "follow-up question" refinement exists either, but the Model demands working chip refinement, not the absence of both. |
| Single-tap, single-outcome | Fail | Chip tap = `console.log`. No outcome. |
| Reversible in a single tap | Fail | No state to toggle. |
| Ordered by predicted impact, highest first | Unknown | No "impact" field in chip schema ([discovery.js:62-68](../discovery.js)). Order is author-chosen per-mock. Cannot be audited. |
| Max 4–7 visible; "More" chip may expand | Partial | Most mocks have 5 chips (e.g., [discovery.js:872-878](../discovery.js), [discovery.js:1485-1491](../discovery.js)). **No "More" chip pattern exists anywhere** — no affordance for overflow. |
| Labels concrete + scannable ("Under ₹1,500", not "Budget") | Pass (mostly) | "Under ₹500", "4★ and up", "Open now" are concrete. One chip ("Family" at [discovery.js:877](../discovery.js)) is borderline abstract. |
| No text-input chip | Pass | All chips are toggle buttons. |
| No new screen before refined result | Pass (by inertness) | They can't open a screen — they don't do anything. |

### §9 — The Edge Affordance

| Rule | Verdict | Notes |
| --- | --- | --- |
| Max one edge affordance per response | Fail (slot missing) | No slot in schema. No render path for it. |
| Must not compete visually with primary commitment | N/A | |
| "See more" / "Compare" / "Save for later" / "Remind me later" | Fail | None of these exist as first-class affordances in the rendered output. Card-level `primary_event` is a commitment trigger, not an edge affordance. |

### §10.3 — Multi-Option pattern (the only pattern this audit covers)

| Slot | §10.3 behaviour | Current implementation | Verdict |
| --- | --- | --- | --- |
| Context Line | Required when contextual signal present, else optional | Always present (title + subtitle). Signal quality inconsistent | Partial |
| Primary Result | 3–5 cards using inferred defaults | 3-8 cards in practice (see §7 finding) | Partial/Fail depending on mock |
| Refinement Layer | Required. Chips for highest-impact filters | Chips render, don't refine | Fail |
| Edge Affordance | Optional. "See more" or context-shift | Missing slot | Fail |
| Commitment | Triggered on card selection; full preview before confirm | Card `primary_event` logs only; no preview, no confirm | Fail (but out of scope — no commitment flow exists) |

### §12 — Language, Tone & Code-Switching

| Rule | Verdict | Notes |
| --- | --- | --- |
| Response language matches intent language | Fail | No detection. System prompt doesn't instruct Claude on code-switching. |
| Indian numeric format (lakhs, crores, two-comma) | Pass for currency in DiscoveryView | Verified in MOCKs. |
| Festival/regional context surfaces without religion/caste/politics inference | Pass | "Diwali" used as season signal without further inference. |
| Language preference persists across modalities | Fail | No preference storage at all. |
| Neutral-helpful tone, not enthusiastic-salesy | Partial | MOCK content is neutral by author choice. Claude path unguarded — no system-prompt guardrail against "Amazing!", "Perfect!", sales language. |
| No emoji unless surface requires | Pass (by construction in MOCKs) | Not enforced. |

### §16 — Prohibited Patterns

| Prohibited pattern | Current protection | Verdict |
| --- | --- | --- |
| Form-first response | DiscoveryView always shows results first | Pass |
| Filler opener ("Sure!", "I'd love to help…") | No guard in system prompt ([server.js:29](../server.js)) | Fail (Claude path) |
| Narration opener ("Let me find some kurtas for you") | No guard | Fail (Claude path) |
| Intent echo ("You want to shop for a kurta for Diwali") | No guard | Fail (Claude path) |
| Question before result | No guard | Fail (Claude path) |
| Multi-field question | No guard | Fail (Claude path) |
| Follow-up question as refinement | No guard; no chip-refinement to fall back to | Fail |
| Silent commitment | No commitment flow exists yet | N/A |
| Language mismatch | No detection | Fail |
| Enthusiasm inflation | No guard | Fail (Claude path) |
| Closing question ("Anything else?") | No guard | Fail (Claude path) |
| More than 5 primary cards | Not enforced in schema or validator | Fail (MOCK_KURTA_DIWALI = 6 cards) |
| Irreversible chip | Chips are inert — vacuously Pass | Pass (technicality) |
| Multi-step refinement | No refinement at all | Pass (by absence) |
| Context line without signal | Not enforced | Partial |
| Multiple context lines | Schema enforces single `subject` with one subtitle | Pass |
| Hidden assumption (material inferred attribute not surfaced) | Not enforced | Partial |
| Performative memory | No memory layer | N/A |

---

## 3. Per-sub-pattern spot checks

### 3.1 Place — MOCK_RESTAURANTS ([discovery.js:864](../discovery.js))

Note: this MOCK is defined but **not routed to by the production chat** — restaurants are handled by a separate hardcoded carousel intercept ([index.html:3126](../index.html) comment). It lives in the playground only. Other Place queries (biryani, doctors, plumbers, schools, apartments) route here.

- **§6 Context Line:** `subject.title="Restaurants near you"`, `subject.subtitle="15 within 2 km"` — two fields, no festival/autonomy/budget signal. §6 wants one sentence with inferred signal.
- **§7 Primary Result:** location_context + map + place-card carousel. Count cards against ≤5 cap → spot-check needed per MOCK.
- **§8 Refinement:** 5 filter chips ([discovery.js:872-878](../discovery.js)), all dead. No "More" chip.
- **§9 Edge Affordance:** Missing.
- **§10.3 commitment:** `primary_event` fires `console.log`. No preview.

### 3.2 Catalog — MOCK_KURTA_DIWALI ([discovery.js:1478](../discovery.js))

This MOCK is the direct analog of Model §15 Example 1 ("Shop for a kurta for Diwali"). Side-by-side:

| Aspect | Model §15 Example 1 | MOCK_KURTA_DIWALI | Gap |
| --- | --- | --- | --- |
| Context Line | "Kurtas for Diwali — delivery before Nov 5" (one sentence, festival+cutoff signal) | "Kurtas for Diwali" · "240+ styles · Delivery by Nov 10" (two fields, count + date) | Structural: two fields vs. one sentence; count leaks in instead of pure signal |
| Cards | 4 cards | **6 cards** ([discovery.js:1503-1572](../discovery.js)) | **Exceeds §7 3–5 cap by 1** |
| Chips | [Under ₹1,500] [Men] [Women] [Silk] [Cotton] [More] | [Men] [Women] [Under ₹2k] [Silk] [Cotton] | Missing "More" chip; budget threshold differs (stylistic); chip order differs (no impact-ranking) |
| Edge Affordance | "See more" | None | Missing |
| Language | English (also has Hinglish variant in Example 2) | English only | No Hinglish route |

### 3.3 Compare — MOCK_HOME_LOANS ([discovery.js:2131](../discovery.js))

- **§6 Context Line:** `subject` present. Signal quality needs per-mock review (spot-check only).
- **§7 Primary Result:** compare table with label column + option columns. Multi-option cap of 5 applies; agent report noted Compare can hold ~6 options before UX degrades ([SCHEMA-NOTES.md:72-90](../SCHEMA-NOTES.md)). **Schema permits >5**; enforcement is author discipline.
- **§8 Refinement:** filter chips render; inert.
- **§10.3 commitment:** `primary_event` on option column = `console.log` only.

---

## 4. Prioritized fix list

Severity: **STR** = structural (violates a §3 invariant or §5 anatomy), **CAP** = missing capability the Model requires, **STY** = stylistic/enforcement polish.
Effort: **S** = <1 day, **M** = 1–3 days, **L** = >3 days.

### P0 — Structural invariant violations

| # | Gap | §Ref | Severity | Effort | Files | Fix sketch |
| --- | --- | --- | --- | --- | --- | --- |
| P0-1 | Chips render but don't refine — violates §8 core rule | §8 | STR | M | [discovery.js:2920-2925](../discovery.js); renderers at [353-372](../discovery.js) | Replace `console.log` chip handler with a dispatcher that mutates a view-level `filters.chips[i].selected`, re-runs a pure filter function over `collection.cards`, and re-renders the `.jbiq-discovery` subtree. Sort dropdown (also inert at [2926-2931](../discovery.js)) gets the same treatment. |
| P0-2 | Card cap violated — MOCK_KURTA_DIWALI has 6 cards | §7, §16 | STR | S | [discovery.js:1503-1572](../discovery.js); validator [184-292](../discovery.js) | Add `cards.length <= 5` to validator for Multi-Option. Drop one card from MOCK_KURTA_DIWALI (likely `anita_groom_sherwani` at [1561-1571](../discovery.js) — "Limited" badge suggests outlier). Audit every `MOCK_*` for the same violation in one pass. |
| P0-3 | No prohibited-pattern guards in system prompt | §3.2, §3.8, §16 | STR | S | [server.js:29-35](../server.js) | Replace system prompt with a Model-derived brief: anatomy summary, prohibited openers list (filler/narration/intent-echo), language-match rule, no-closing-question rule. One commit. (This is the entry point for option (b) in the next session.) |
| P0-4 | No language match / Hinglish code-switching | §3.5, §12 | STR | M | [server.js:29-35](../server.js); eventually [index.html](../index.html) voice path | System-prompt directive: "Match the user's language. If the user code-switches mid-sentence, mirror the mix. Numerals in Indian format." Also add a language-probe pass for the intent (Hindi/Hinglish keywords) so MOCKs can branch subject text. |

### P1 — Missing capability

| # | Gap | §Ref | Severity | Effort | Files | Fix sketch |
| --- | --- | --- | --- | --- | --- | --- |
| P1-1 | No Edge Affordance slot | §5, §9 | CAP | M | [discovery.js:59-176](../discovery.js) schema + renderers | Add optional `edge_affordance: { label, event, kind: 'see_more'|'compare'|'save_later'|'remind_later'|'context_shift' }` to all three DiscoveryView types. Render below collection, visually subordinate to card primary actions. |
| P1-2 | Context Line is two fields, not one sentence with signal | §6 | CAP | M | [discovery.js](../discovery.js) schema + all 20 MOCKs | Replace `subject: {title, subtitle}` with `context_line: string` + optional `context_signal: 'festival'|'delivery'|'budget'|'autonomy'|'memory'|'price'`. Migrate 20 MOCKs to compose a single sentence. Example: `"Kurtas for Diwali — delivery before Nov 5"` with `context_signal: 'delivery'`. |
| P1-3 | No "More" chip / overflow affordance | §8 | CAP | S | [discovery.js:353-372](../discovery.js) | When chip count > 7 or when a mock declares `filters.more_chip_event`, append a `[More]` chip that expands a chip tray. |
| P1-4 | Chip impact ordering unverifiable | §8 | CAP | S | [discovery.js:62-68](../discovery.js) | Add optional `predicted_impact: number` to `FilterChip` schema. Document the ordering rule in SCHEMA-NOTES. |

### P2 — Enforcement / testing

| # | Gap | §Ref | Severity | Effort | Files | Fix sketch |
| --- | --- | --- | --- | --- | --- | --- |
| P2-1 | No prohibited-pattern regex/classifier on Claude output | §16, §18 | STY | M | `server.js` post-processing | After the Claude call at [server.js:38-43](../server.js), run a regex sweep for filler openers ("Sure!", "I'd love", "Let me", "Great question"), enthusiasm inflation ("Amazing!", "Perfect!"), closing questions ("Anything else?"). On hit: re-prompt or strip. |
| P2-2 | No validator for §7 3–5 card cap | §7, §18 | STY | S | [discovery.js:184-292](../discovery.js) validator | Add `cards.length between 3 and 5` rule for Multi-Option. Hook into existing `validateDiscoveryView` at playground startup. |
| P2-3 | No context-line signal-rate metric | §17 | STY | M | new file / instrumentation | Score each rendered `subject` against a signal classifier (keyword-based MVP: festival names, date strings, ₹ ranges, "usual"/"your"). Emit to console for playground; wire to metrics later. |

### Deferred (scope-adjacent, noted for future sessions)

- **Missing intent shapes:** Informational (currently the unguarded Claude path), Single-Path Transactional, Stateful Query, Proactive-Triggered. Each is a larger build; the Model specifies patterns in §10.1, §10.2, §10.4, §10.5.
- **Commitment flow for Multi-Option:** §10.3 ends "full preview before confirm." No preview step exists in code. Depends on extending state machine beyond `PARTIAL_RESULT_SHOWN`.
- **Confidence × Intent matrix (§13) / Autonomy × Response mapping (§14):** no confidence or autonomy signal exists. Cross-cuts Conversation History Model.
- **Clarification rules (§11):** no clarification path exists.
- **status_label overload in Catalog cards:** flagged in [SCHEMA-NOTES.md](../SCHEMA-NOTES.md) already; rename to `status: {kind, label}` mirroring Place. Stylistic, not a Model violation.

---

## 5. What this audit does not cover

- Claude API freeform response quality beyond system-prompt guardrails.
- The 4 intent shapes not yet implemented (Informational enforced, Single-Path, Stateful, Proactive).
- The restaurant and shopping hardcoded intercepts ([index.html](../index.html) restaurant carousel path + shopping order flow).
- Visual design, accessibility, motion — the Model explicitly disclaims these at §1.
- Non-DiscoveryView text formatting (markdown stripping, typewriter timing, etc.).

---

## 6. Suggested next session

The highest-leverage follow-up is **P0-3 (system prompt)** + **P0-1 (wire up chips)**. Prompt work is a single-file change and delivers §16 protection on the Informational path that's currently unguarded. Chip wiring is the single biggest structural gap in DiscoveryView and unblocks §8 / §10.3 compliance in one shot. Both can land in the same PR.

After that: **P1-2 (Context Line single-sentence)** because it touches the schema and is easier to migrate 20 MOCKs in one pass than incrementally.

**P0-2** (card cap + validator) is S-effort cleanup, good to bundle with P0-3 for a coherent "Model-aligned v1.1" release.
