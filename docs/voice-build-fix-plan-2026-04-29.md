# JBIQ — Voice-build Round-2-readiness fix plan

**Created:** 2026-04-29
**Author:** voice-build assessment (see `docs/voice-build-assessment-2026-04-29.md`)
**Owner:** Matt Jarvis
**Target:** close the voice-build gaps surfaced by the cross-agent assessment so the eleven discovery use cases are demoable for Round 2 fieldwork without contaminating the research data.

This document is a **focused supplement** to `docs/build-plan-2026-04-24.md`. The 5-week sprint plan there remains the single source of truth for the MVP launch tickets (C1–C7, H1–H14, M1–M14). This plan addresses voice-build-specific items that emerged from the 29 April assessment and are not already spec'd there. Where they overlap, this plan points back to the existing ticket ID and adds nothing.

Hand this file to Claude Code with read access to the repo. It can read top-to-bottom, treat each `V*` ticket as a self-contained PR, and pick work up in priority order.

---

## 1. Read this first

Before opening any code, the implementing agent reads, in order:

1. `docs/voice-build-assessment-2026-04-29.md` — the assessment that produced this plan; explains *why* each ticket exists.
2. `docs/voice-first-use-cases.md` — the implementation spec for the eleven discovery use cases. The voice build now satisfies it; this plan does not modify it.
3. `docs/response-pattern-model.md` — canonical spec for Discovery / Informational / Commitment patterns.
4. `docs/build-plan-2026-04-24.md` — the broader sprint plan. Tickets `C2`, `C3`, `C4`, `C5`, `C7`, `H2`, `H3`, `H13` are referenced below; do not re-implement them, verify their state and fold work into them where appropriate.
5. The agent's own `.claude/agents/knowledge/<slug>.md` if it exists — durable memory.

---

## 2. Verification pass before any code (V0)

The 21 April audit (`docs/response-pattern-audit-v1.md`) flagged some items that may already have been resolved by subsequent work. **Do not trust the audit's "P0-1" (chip stub) and "P0-2" (card cap) claims as current.** Run a verification pass first; let the result drive what tickets actually need work.

### V0.1 — Verify chip refinement is wired through
- Open `discovery.js:1040` (`deriveDisplayView`). Confirm cards are filtered by `selectedIds.every(id => card.filter_ids.includes(id))` and the result is sorted via `sortCards`.
- Open `discovery.js:4247–4271` (delegated click handler). Confirm chip taps mutate `chip.selected` and call `rerenderDiscoveryView(wrapper)`.
- Manual smoke: load any catalog or place mock with chips; tap a chip; observe whether the card set actually narrows.
- **If working:** mark `C2` complete in `docs/build-plan-2026-04-24.md` and skip C2.
- **If not working:** the existing `C2` ticket spec applies; implement against that.

### V0.2 — Verify card-cap compliance across all 22 mocks
- Open `discovery.js`. For every `MOCK_*` constant with a `collection.cards` array, count cards.
- Verified today: `MOCK_KURTA_DIWALI` has 5 cards (audit's P0-2 finding is stale). Re-confirm.
- Run the existing validator (`validateDiscoveryView` / `validateCatalog` at `discovery.js:249–273`) over every mock at startup in dev mode. Add `console.warn` on any mock that exceeds 5 cards or fails a §10.3 floor.
- **If all mocks pass:** mark `C5` complete and skip C5.
- **If any mock fails:** trim per `C5` spec.

### V0.3 — Verify §14 commitment gate is enforced on every irreversible flow
- Open `index.html:4660–4662` (`matchesVoiceConfirmPhrase`). Confirm bare "yes" / "haan" do not match.
- Open `index.html:4803–4828` (text-mode confirm intercept) and `index.html:5468–5475` (voice-mode confirm intercept). Confirm both paths call `showTapToConfirmWarning` and never fall through to `handleConfirmAndPay`.
- For every mock with a `confirm_pay` `primary_event` (`MOCK_RECHARGE_299_SINGLE`, `MOCK_GAS_REFILL`, `MOCK_KIRANA_REORDER`, `MOCK_MILK_SUBSCRIPTION_EDIT`), trace the click handler in `index.html` and confirm it routes through `handleConfirmAndPay` only after `activeOrder.tapped === true`.
- **If all paths enforce:** mark `C7` substantially complete (the modal/sheet polish in `C7` may still apply; defer to design).
- **If any path bypasses:** raise as a P0 against `C7`.

**Output of V0:** a short `verification-2026-04-29.md` in `docs/` listing the state of each verified item with line numbers and `pass / fail / partial` against each. The remaining tickets in this plan assume V0 has run.

---

## 3. Constraints — what to extend, not invent

The voice build is mid-stride. Treat it as such.

- **Reuse existing primitives.** `renderDiscoveryView`, `rerenderDiscoveryView`, `deriveDisplayView`, `renderInformationalResponse`, `stripVoicePivot`, `matchesVoiceConfirmPhrase`, `showTapToConfirmWarning`, `BOOKING_INTENTS`, `INFORMATIONAL_RESPONSES`, `DATASET_GROUPS`, `DISCOVERY_QUERY_PATTERNS`, `INFORMATIONAL_QUERY_PATTERNS` are all in place. Do not introduce parallel mechanisms.
- **No new card variants, no new sub-patterns.** If something cannot be expressed in the existing `place / catalog / compare / informational_response` shapes, raise it as a question; do not invent silently.
- **Hinglish strings stay in mocks for now.** Live language detection is `C4` in the existing plan and is out of scope here unless `C4` lands first.
- **No backend integrations.** All mocks remain mocks. This plan does not change that.
- **One ticket per PR.** Title format: `[V3] Tier off-pillar mocks in prototype panel`. Commit message includes ticket ID.

---

## 4. Acceptance criteria that apply to every ticket

For each `V*` ticket below:

1. The change does not regress any of the eleven discovery use cases (verified by walking each entry in `DATASET_GROUPS` plus `INFORMATIONAL_RESPONSES` from the burger Prototypes panel).
2. The change does not violate the §14 commitment-gate contract (voice "haan" / "yes" still does not commit any irreversible action).
3. The change preserves §15 voice-disclosure behaviour: pivot beat spoken in voice mode, stripped via `stripVoicePivot` in text mode.
4. The change does not introduce console errors in the browser dev console under normal use.
5. The PR description references this plan + the relevant audit/assessment line.

---

## 5. Tickets

### V1 — Hide or replace booking-tracker and receipt-download stubs *(P0, S, frontend-engineer + product-designer)*

Demo participants will tap surfaces that look like real affordances. Two are stubs that `console.log` and return.

**Files**
- `index.html:4501–4507` (`openBookingTracker` stub)
- `index.html:4540–4615` (booking primary CTA + View receipt + Add to calendar)
- `index.html:4604–4615` (commerce receipt branch — explicitly marked stub)

**Scope**

Pick the lowest-friction option per stub:

1. **Booking tracker** (`openBookingTracker`):
   - **Option A (preferred for Round 2):** replace the body with a small toast or in-chat informational card ("Tracker coming after Round 2 — booking ID `<id>` saved.") that does not look like a navigation. Keep the button label honest ("Booking saved" instead of "Track booking").
   - **Option B:** hide the button when no real tracker exists (`display: none` behind a `FEATURE_FLAGS.bookingTracker` flag, default false).
2. **Receipt download** (commerce branch, `data-action="view-receipt"`):
   - Same treatment. Either show a toast ("Receipt will be available after Round 2") or hide the link until wired.
3. Add a `FEATURE_FLAGS` object near the top of `index.html` so future stubs can be toggled in one place. Keep it tiny — `bookingTracker: false`, `receiptDownload: false`.

**Acceptance criteria**

- No demo path leads to a `console.log`-only handler.
- Visual surfaces that exist either work or don't render.
- Toast / hidden behaviour is consistent across the booking and commerce branches.
- A QA pass through every Confirm & Pay flow and every booking flow surfaces zero "what does this button do?" gaps.

**Reference:** assessment §QA P0 #2; designer P0 #4.

---

### V2 — Resolve `voice_disclosure_tamil_future` dead-code cleanup *(P1, S, frontend-engineer)*

`MOCK_GAS_REFILL` (`discovery.js:3562`) and the playground twin (`place-playground.html:3967`) carry a `voice_disclosure_tamil_future` field that no code reads. Either implement or delete; do not leave Schrödinger's localisation in the schema.

**Files**
- `discovery.js:3559–3562`
- `place-playground.html:3964–3967`

**Scope — pick one:**

**Option A: implement the helper (preferred if `C4` is starting soon).**
1. Add `pickVoiceDisclosure(view, lang)` that returns `view['voice_disclosure_' + lang]` if present, else `view.voice_disclosure`.
2. Replace every direct `view.voice_disclosure` read with `pickVoiceDisclosure(view, currentLanguage)`. Currently three sites in `index.html` (lines 4954–4967 — DiscoveryView, Informational, Booking).
3. `currentLanguage` defaults to `'en'`; until `C4` lands, every call resolves to the existing string. Behaviour unchanged.
4. Document the field-naming contract in `docs/response-pattern-model.md` §15: `voice_disclosure_<bcp47-lang>` lookup, `voice_disclosure` fallback, no behaviour change in the absence of detection.

**Option B: delete the field.**
1. Remove `voice_disclosure_tamil_future` from both files.
2. Remove the TODO comments above it.
3. Note in `docs/voice-first-use-cases.md` §4.5 that the Tamil variant is deferred to `C4` and does not live in the schema until then.

**Acceptance criteria**
- No file in the repo declares a `voice_disclosure_*_future` field that no code reads.
- If Option A: a unit test confirms `pickVoiceDisclosure({voice_disclosure: 'A', voice_disclosure_ta: 'B'}, 'ta')` returns `'B'`, `pickVoiceDisclosure({voice_disclosure: 'A'}, 'ta')` returns `'A'`.
- The eleven use cases still play their existing voice disclosures end-to-end (no regression).

**Reference:** assessment §Frontend #5; researcher §1.

---

### V3 — Tier off-pillar mocks in the prototype panel *(P0, M, product-designer + frontend-engineer)*

The prototype panel currently mixes pillar use cases (PM-Kisan, plumber, recharge, pediatrician, gas refill, ration, scholarship, tutor, tailor, kirana, milk) with off-pillar mocks (flights, trains, IPL, biryani, kurta, gifts, movies, devotional, courses, EMI, home loans, health insurance, phones-under-20k, apartments, schools, restaurants, doctors). For Round 2, off-pillar mocks dilute the strategic message and pull testers off-script.

**Files**
- `discovery.js:4074+` (`DATASET_GROUPS`)
- `index.html` burger Prototypes panel render

**Scope**

1. Re-group `DATASET_GROUPS` into two top-level sections:
   - **Pillar use cases (Round 2 spine)** — four sub-groups: Government & civic, Local services, Recharge & bills, Order & buy. Each contains exactly the use cases from `voice-first-use-cases.md` §4 + §5 plus any directly-mapped existing mocks (e.g. `schemes_farmers` belongs in Government & civic).
   - **Research probes (Track B)** — everything else, collapsed by default.
2. Add a `<details>` toggle (or equivalent) on the Track B section so the panel opens with only the eleven on-pillar entries visible. Title the section "Track B — research probes" with a one-line description.
3. The four pillar sub-groups should be visible at full height by default. Order them as the plan does: Government & civic → Local services → Recharge & bills → Order & buy.
4. Confirm the burger panel renders both the existing `DATASETS` entries and the `INFORMATIONAL_RESPONSES` entries (PM-Kisan, ration). If the panel currently misses informational entries, add them under Government & civic.
5. Match the panel labels to the use-case headers in `voice-first-use-cases.md` so a moderator can read across the doc and the screen without translating.

**Acceptance criteria**
- Opening the prototype panel shows the eleven on-pillar entries grouped by pillar, with the four pillar headings visible.
- Off-pillar entries are present but collapsed (or visually subordinate) under "Track B — research probes".
- Both informational responses appear under Government & civic.
- Tapping any entry still launches the corresponding view exactly as it does today (no router changes).
- A moderator's read-aloud pass through Track A's eleven utterances (one per use case) routes to the right view in every case.

**Reference:** assessment §Strategist #2; QA P0 #3.

---

### V4 — Minimal voice repair dialog *(P0, M, product-designer + frontend-engineer)*

The build has no designed surface for "I didn't catch that". For a voice product going into Round 2, this is the riskiest single gap — every off-script utterance and every ASR misfire currently falls into a no-state.

**Files**
- New `repair-dialog.js` or section inside `index.html`
- `index.html` chat handler (around line 4234, where `discoveryKey` is computed) — wire the no-match branch
- Speech-recognition error path (around `index.html:5468+`) — wire ASR error handling

**Scope**

1. Define a single `renderRepairDialog({ reason, suggestions })` helper that produces a small in-chat card with:
   - A short header — *"Sorry, I didn't catch that"* (English) or the user's language if `C4` has landed.
   - Up to three `suggestions` chips. Default suggestions for Round 2: *"Check PM Kisan status"*, *"Recharge ₹299"*, *"Book a plumber"*. Tapping a suggestion seeds the next utterance via the existing `data-query` mechanism.
   - A "Try again" button that re-opens the mic in voice mode or focuses the input in text mode.
2. Trigger conditions:
   - **No-match:** `discoveryKey`, `informationalKey`, `bookingIntent`, and other matchers all return null. Currently this falls through to the model — keep the model fallback as a parallel option, but render the repair dialog *before* the model output as a "did you mean?" affordance for Round 2 testing.
   - **ASR confidence low:** Web Speech API confidence threshold (start at 0.6) fails — render the dialog with `reason: 'asr_low_confidence'`.
   - **ASR error:** `recognition.onerror` fires — render the dialog with `reason: 'asr_error'`.
   - **Silence timeout:** existing silence-timeout path → render dialog instead of the current behaviour (verify what current behaviour is during V0).
3. Do not block the model fallback. The dialog is additive: it gives the user a fast tap-out and a clearer recovery path; the model still gets to attempt an answer in parallel.
4. Telemetry: emit a `voice.repair.shown` event each time the dialog renders, tagged with `reason`. Round 2 will use this to estimate ASR / off-pillar rates.

**Acceptance criteria**
- A test utterance the matcher cannot handle ("Mujhe hawa mein urna hai") renders the repair dialog with three suggestion chips.
- Tapping a suggestion fires the next utterance and routes to the correct view.
- Tapping "Try again" re-opens the mic (voice mode) or focuses input (text mode).
- The dialog never appears for utterances that match a matcher (no false positives).
- Keyboard-accessible: chips are `<button>` elements, `aria-pressed` set, focusable in tab order, Enter / Space activate.
- Screen reader: dialog has `role="status"` or `aria-live="polite"`; opening announces the header and the chips.
- The §14 commitment-gate contract is unaffected: a repair-dialog suggestion never includes an irreversible action.

**Reference:** assessment §Researcher #2; designer §3; QA P1 #5.

---

### V5 — Hinglish microcopy register pass *(P1, S, product-designer + researcher)*

Hinglish voice disclosures across the eleven mocks vary in formal register without a clear rule. PM-Kisan reads as formal-respectful; kirana cart reads as casual-informal. For T2 testing it's fine; for T3 it can read as the assistant being inconsistent about who it's talking to.

**Files**
- `discovery.js` — every mock with `voice_disclosure` (Hinglish or English)
- `docs/response-pattern-model.md` §15 — add a register-rule subsection

**Scope**

1. Define one explicit register rule per pillar:
   - **Government & civic:** formal-respectful (*aap*, *kripya*-equivalents). Reflects the user's relationship with state-mediated outcomes.
   - **Local services:** neutral-helpful (*aapko*, no flourish). The plumber is a service, not a sovereign.
   - **Recharge & bills:** neutral-direct (*ho jayega*, *confirm karein*). Transactional voice; brevity over warmth.
   - **Order & buy:** casual-informal (*aapki cart*, *kal se*). Daily-use voice.
2. Walk every Hinglish disclosure and bring it into its pillar's register. Note in the mock comment: `// register: gov_formal | services_neutral | bills_direct | buy_casual`.
3. Document the rule and the mapping in `docs/response-pattern-model.md` §15.
4. Do not change any English disclosure. Out of scope: actual translation work; that lives with `C4`.

**Acceptance criteria**
- Each of the eleven on-pillar mocks has a register comment matching its pillar.
- A read-aloud pass by a Hindi-fluent reviewer confirms register consistency within pillar (informal pillar-internal review is enough; no need for a formal lab session).
- The §15 four-beat structure is preserved (outcome → anchor → shape → pivot); only word choice / register changes.
- `stripVoicePivot` still produces a clean text-mode line.

**Reference:** assessment §Designer #6; researcher §2.

---

### V6 — Round-2 research event log *(P1, M, frontend-engineer + researcher)*

Round 2 sessions need a session timeline the moderator can review with the participant. The build currently has no persistence and no session log. The Gap Analysis flagged this as out-of-scope for the prototype, but Round 2 itself raises the requirement.

**Files**
- New `research-log.js` (or an inline module inside `index.html`)
- `index.html` chat handler — emit log events
- `index.html` voice path — emit ASR events

**Scope**

1. Behind a `FEATURE_FLAGS.researchMode` flag (default false; enabled via URL param `?research=1` for fieldwork sessions), persist a structured event log to `localStorage` under a single keyed array. Each event:
   ```js
   { ts, type, payload }
   ```
   `type` ∈ `'utterance' | 'matcher_hit' | 'matcher_miss' | 'view_rendered' | 'chip_toggle' | 'sort_change' | 'edge_affordance_tap' | 'confirm_pay_attempt' | 'confirm_pay_blocked' | 'confirm_pay_committed' | 'asr_error' | 'asr_low_confidence' | 'voice_repair_shown'`.
2. `payload` carries the minimum useful context: `utterance` (string), `view_key` (string), `chip_id` (string), `confirm_phrase` (string for blocked attempts), `language_detected` (if `C4` has landed). Never persist user-supplied PII beyond the utterance text itself.
3. Add a "Research mode" badge in the top-left when the flag is on, plus an "Export session log" link that downloads the array as JSON.
4. Add a "Clear session log" link — moderators may need to wipe between participants.
5. Document the event taxonomy and consent script in `docs/research-mode.md` (new). Include a one-paragraph participant-consent line the moderator reads before enabling the flag.

**Acceptance criteria**
- With `?research=1`, every observable interaction during a session produces exactly one event.
- The exported JSON is well-formed and can be opened with `jq`.
- With the flag off, no events are written and `localStorage` is untouched.
- The badge and links are visible in research mode and absent otherwise.
- A 5-minute simulated session produces a log with at least one event of every common type (utterance, matcher_hit, view_rendered, edge_affordance_tap, confirm_pay_attempt, confirm_pay_blocked).

**Reference:** assessment §Backend #1; researcher §1.

---

## 6. Existing tickets that close adjacent gaps — do not re-spec, just confirm state

The voice-build assessment surfaced gaps that already have tickets in `docs/build-plan-2026-04-24.md`. For each, run a check; if work is still required, follow the spec there.

| Build-plan ticket | Voice-build gap it closes | Verification |
|---|---|---|
| `C2` (chip refinement) | Chips look interactive but do nothing | V0.1 above. **Likely already shipped.** |
| `C3` (post-processing prompt guards) | Filler openers / closing questions leak from Claude responses | Open `server.js:60–72`. If no regex sweep on `response.content[0].text` before returning, ticket is open. |
| `C4` (language detection + Hinglish) | Hinglish disclosure on a Tamil utterance | Open `server.js`. If no `detectLanguage(text)` is called before prompt assembly, ticket is open. |
| `C5` (card-cap + validator) | A mock exceeds 5 cards | V0.2 above. **Likely already passing.** |
| `C7` (Commitment confirm sheet) | The on-screen-tap rule for irreversible actions | V0.3 above. **Substantially shipped** as `showTapToConfirmWarning`. The §14 commitment-sheet polish in `C7` may still apply. |
| `H1` (input validation) | API endpoints accept arbitrary message shapes | Open `server.js:21–25`. If no `zod` schema, ticket is open. |
| `H2` (rate limiting) | `/api/tts` is unmetered, ElevenLabs cost runaway risk | Open `server.js`. If no `express-rate-limit` middleware, ticket is open. |
| `H3` (timeouts, retries, circuit breaker) | A hung Anthropic call freezes the UI | Open `server.js:63–68`. If no `AbortController` on the SDK call, ticket is open. |
| `H4` (DPDP consent + sensitive-trait guard) | No consent UX, no deletion endpoint | Open `index.html` first-call path. If no consent banner before first `/api/chat`, ticket is open. |
| `H13` (structured logs + trace IDs) | No observability on Claude / ElevenLabs failures | Open `server.js`. If no `requestId` on logs, ticket is open. |

If a ticket is verified shipped, mark it complete in `docs/build-plan-2026-04-24.md` with a one-line note ("Verified shipped 2026-04-29 — see assessment").

---

## 7. Out of scope for this plan

Do not implement under this plan; raise as separate tickets if needed:

- Real backend integrations (PM-Kisan API, NPCI/UPI rails, JioPay, Indane, scholarship feeds). Mocks remain mocks.
- Real ASR for Tamil / Telugu / Kannada / Bengali — `C4` is the home for vernacular work.
- Server-side session persistence / user accounts — `H4` covers DPDP-grade scaffolding; this plan only adds research-mode `localStorage` events.
- Bundle splitting, minification, performance budgets — separate ticket family.
- A11y audit and remediation — `M*` tickets in the build plan; this plan does not duplicate.
- Multi-user / family / shared-device profile model — Gap Analysis HIGH item, not Round-2 blocking.
- Memory transparency UX — Gap Analysis HIGH item, not Round-2 blocking.
- Offline / low-bandwidth UX — Gap Analysis HIGH item, not Round-2 blocking.

---

## 8. Order of operations

Pick up tickets in this order. Earlier tickets unblock later ones; later tickets do not depend on each other.

1. **V0** — verification pass. Drives every other ticket's scope.
2. **V1** — hide stubs. Cheap, eliminates a class of demo confusion. Half-day.
3. **V3** — tier the prototype panel. Protects the strategic message of Round 2. 1–2 days.
4. **V4** — voice repair dialog. Highest single risk to Round 2 fieldwork. 2–3 days.
5. **V2** — Tamil dead-code cleanup. Half-day. Good follow-up for `C4` if that's next.
6. **V5** — Hinglish register pass. 1 day. Designer-led; pairs well with `C4` planning.
7. **V6** — research event log. 2 days. Enables Round 2 analysis even on the existing build.

If only one ticket can ship before Round 2 fieldwork starts, ship **V4** (the repair dialog). The build cannot face real T2/T3 voice users without a designed recovery surface.

---

## 9. Self-check before handing back

For every ticket the agent claims is done:

- [ ] Walks the eleven on-pillar use cases from the prototype panel — every one renders, voice disclosure plays in voice mode, pivot-stripped text shows in text mode, edge affordance is present.
- [ ] Walks every Confirm & Pay mock — voice "haan" / "yes" → warning shown, no payment. On-screen tap → `handleConfirmAndPay` fires.
- [ ] Walks one off-pillar utterance — confirms the routing still works (the prototype panel may have demoted it; the matcher should not have).
- [ ] Walks one no-match utterance — confirms the repair dialog renders (after V4).
- [ ] Confirms no `console.error` appears in normal use.
- [ ] Confirms no console-only stub handler is reachable from the demo path.
- [ ] Updates `docs/build-plan-2026-04-24.md` with any tickets verified shipped.
- [ ] Proposes 1–3 dated learnings to the implementing agent's knowledge file in `.claude/agents/knowledge/<slug>.md`.

Report back: what shipped, what didn't (and why), what was discovered during V0 that changed the plan, and any spec ambiguity that was resolved by judgement during implementation.
