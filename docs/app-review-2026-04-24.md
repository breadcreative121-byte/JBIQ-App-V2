# JBIQ App Review — Consolidated Findings

**Date:** 2026-04-24 · ~5 weeks to May 2026 launch
**Reviewed by:** `product-designer`, `researcher`, `backend-engineer`, `frontend-engineer`, `qa`
**Scope:** Full app review — `index.html`, `discovery.js`, `discovery.css`, `server.js`, `package.json`, `render.yaml`, `docs/response-pattern-*`, `SCHEMA-NOTES.md`

---

## Ship-readiness verdict

**In its current state, JBIQ is a no-ship for the May 2026 1M-user launch.**

The foundations are strong — the Response Pattern Model and schema work in `docs/` are genuinely good, the voice UX surface is thoughtfully laid out, and the Intent → Understanding → Action → Commitment contract is clearly articulated. But the code has not caught up with the spec. The refinement layer (chips) is inert, language-matching and Hinglish handling are unimplemented, the system prompt has no prohibited-pattern guards, live API keys are committed to the repo, there are no automated tests or CI, and no verifiable guard that irreversible Commitment actions can't be bypassed.

Five of the findings below are, by themselves, launch blockers. Fourteen are must-fix before scale. The good news: most of the P0 items are small, focused code changes (<1 week each) and are already named in `docs/response-pattern-audit-v1.md`. This is a sprint of disciplined execution, not a rearchitecture.

---

## The 5 things to fix this week

These are the highest-leverage items — do these first and the next tier of findings becomes tractable.

| # | Fix | Severity | Raised by | Effort |
|---|-----|----------|-----------|--------|
| 1 | **Rotate leaked API keys and purge `.env` from git history.** Anthropic + ElevenLabs keys visible in `.env` committed to the repo. | Critical | backend | hours |
| 2 | **Wire up refinement chips.** `discovery.js:2920–2931` handler is `console.log` only. Violates the Intent→Understanding→Action→Commitment contract's Understanding step. | Critical | product-designer, researcher, qa | 1–2 days |
| 3 | **Add prohibited-pattern guards to the system prompt** (`server.js:29–52`) — filler openers, enthusiasm, closing questions, language-match rule. Audit item P0-3. | Critical | product-designer, qa, backend | <1 day |
| 4 | **Implement language detection + Hinglish path end-to-end.** No runtime detection; system prompt mentions Hinglish parity but no branching. | Critical | researcher, product-designer, qa | 2–3 days |
| 5 | **Fix MOCK_KURTA_DIWALI card count** (6 → 5) and add a runtime validator for `cards.length ≤ 5` across all mocks. Audit item P0-2. | Critical | product-designer, qa | hours |

---

## Findings by severity

Every finding is tagged with the agent(s) that raised it. Where multiple agents converged on the same issue, it's consolidated into a single entry.

### Critical — ship blockers

#### C1. Live API keys committed to the repo
*Area:* security / secrets · *Raised by:* backend
`.env` is tracked in git and contains `ANTHROPIC_API_KEY=sk-ant-...` and `ELEVENLABS_API_KEY=sk_c31bcd...`. `.gitignore` lists `.env` but the file is already committed.
**Fix:** Rotate both keys immediately. Use `git filter-repo` to purge from history. Rely on Render's env var UI (already referenced correctly in `render.yaml:8–11`). Add a pre-commit hook to block `.env` commits.

#### C2. Refinement chips are inert — Intent→Understanding→Action→Commitment contract violated
*Area:* UX contract / state coverage · *Raised by:* product-designer, researcher, qa
`discovery.js:2920–2931` — chip tap handler is `console.log(eventName)` only. No state mutation, no filter, no re-render. Sort dropdown has the same stub. Response Pattern Model §8 core rule violated. For voice users especially, chips are the only non-typing refinement path.
**Fix:** Mutate `view.filters.chips[i].selected`, run a pure filter predicate over `collection.cards` using the existing `filter_ids` field, re-render the discovery subtree. Audit P0-1.

#### C3. System prompt has no prohibited-pattern guards
*Area:* UX / AI guardrails · *Raised by:* product-designer, qa, backend
`server.js:29–52` — the system prompt includes tone/language rules but no block list for filler openers ("Sure!", "Let me find…"), enthusiasm inflation ("Amazing!", "Perfect!"), narration openers, intent echo, or closing questions ("Anything else?"). Every unguarded Informational response will structurally violate Response Pattern Model §16.
**Fix:** Replace the system prompt with a Model-derived directive including the prohibited-pattern block list, the anatomy summary, and the language-match rule. Add a post-processing regex sweep on Claude's output to detect and strip common openers. Audit P0-3.

#### C4. No language detection or Hinglish handling
*Area:* language / code-mixing · *Raised by:* researcher, product-designer, qa
`server.js:40–42` tells Claude "Hinglish in, Hinglish out" but the request carries no `language` signal — there's no runtime detection. `index.html:4040` hardcodes one Hinglish line; all MOCK subjects are English-only. The matcher at `index.html:3117–3140` is 19 English regexes. For a voice-led product targeting 500M Indian users, this is a structural gap.
**Fix (MVP):** (a) Keyword-based language probe on user intent; (b) inject detected language into both the system prompt and the DiscoveryView subject selection; (c) seed existing MOCKs with Hinglish variants; (d) collect ~30 natural Hinglish utterances via a short WhatsApp voice-diary with T2 users and retrain the matcher. Audit P0-4.

#### C5. Card cap violated — no runtime validator
*Area:* Response Model compliance · *Raised by:* product-designer, qa
`discovery.js:1503–1572` MOCK_KURTA_DIWALI has 6 cards; Response Pattern Model §7 caps multi-option responses at 5. Validator at `discovery.js:272–273` doesn't enforce this for Catalog views.
**Fix:** Drop `anita_groom_sherwani` (outlier, marked "Limited"). Audit all 20 MOCKs in one pass. Add `cards.length <= 5` to `validateCatalog()`. Audit P0-2.

#### C6. No automated tests or CI
*Area:* automation / launch risk · *Raised by:* qa
No test dependencies in `package.json`, no `.github/workflows`, no `.test.js` or `.spec.js` files. A 1M-user voice-led launch without regression coverage is a release-risk cliff.
**Fix:** Establish a minimal test pyramid before ship. (a) Unit: `validateDiscoveryView()`, language probe, chip filter logic. (b) Integration: intent → DiscoveryView render → event. (c) E2E smoke: text chat, voice activation, API failure recovery. Playwright for E2E, gate p95 <5s on throttled 4G.

#### C7. Commitment flow is unverifiable — no preview / confirm step for irreversible actions
*Area:* Interaction contract · *Raised by:* qa
`discovery.js:96–98` — card `primary_event` only fires a `console.log` (line 2920). There's no preview screen, no confirmation dialog, no COMMITMENT_REQUIRED state transition before payment/order/bill-pay actions. The contract says "no irreversible action without explicit Commitment"; currently there is no code path that enforces this.
**Fix:** Add an explicit COMMITMENT_REQUIRED state to the client interaction model. Every transactional intent must render a confirm screen before any `/api/pay`-equivalent call. Test case: can a user tap "Pay ₹1,243" and have it execute silently? If yes, this is a critical bug. QA must be able to verify this from the outside.

#### C8. Monolithic bundle — architecture mismatch with the target market
*Area:* architecture / performance · *Raised by:* frontend-engineer
`index.html` is ~179KB, `discovery.js` ~120KB, `discovery.css` ~22KB — all unminified, no bundler, no tree-shaking, no code-splitting. Shipping ~321KB to budget Androids on flaky 4G (T2/T3 baseline) is a first-order UX problem, not a polish issue. Also: the stated stack is TS + React + Node; what's shipping is plain HTML/JS. That drift should be named.
**Fix:** Introduce a build pipeline (Vite or esbuild). Split index.html into a minimal HTML shell + JS modules. Minify + gzip (expect ~60% size cut). Lazy-load discovery.js and all MOCK datasets — they're only needed when the prototypes panel opens. Measure on a Nexus 5 / 2GB-RAM Android over throttled 4G.

---

### High — must-fix before scale

#### H1. No input validation on API endpoints
*Area:* API / security · *Raised by:* backend
`server.js:19–25` checks only that `messages` is an array. No per-message shape, length, or token limits. `userProfile` is interpolated directly into the system prompt without sanitisation — prompt-injection surface.
**Fix:** Validate message shape with `zod` or `ajv`. Cap array length (e.g. 50). Escape `userProfile.city` / `.country` before concatenation.

#### H2. No rate limiting or quota enforcement
*Area:* API / scale & cost · *Raised by:* backend
No middleware, no per-user or per-IP caps. At 1M users × ~5 calls/day = 5M daily requests with linear API-cost exposure. A compromised client or a loop burns through quota instantly.
**Fix:** `express-rate-limit` keyed by user ID / IP. Per-user ceilings (e.g. 100 req/min chat, 20/min TTS). Monthly quota budgets in a DB. Return 429 with Retry-After.

#### H3. No timeout / retry / circuit breaker for external APIs
*Area:* resilience · *Raised by:* backend, frontend-engineer, qa
`server.js:59–64` (Anthropic) and `87–102` (ElevenLabs) are bare `await`s with no `AbortController`, no backoff, no circuit breaker. Client side `index.html:4329–4340` has no fetch timeout, no retry, no offline detection. Indian 4G is intermittent — day-1 will expose every edge.
**Fix:** Server: 30s timeout for Claude, 20s for TTS; exponential backoff (1s/2s/4s/8s) on network errors; circuit breaker (5 consecutive failures → fail-fast 60s). Client: `AbortController` with 15s ceiling, retry up to 3×, `navigator.onLine` check + offline queue + localStorage persistence of `conversationHistory`.

#### H4. DPDP compliance — no consent model, no sensitive-trait guard
*Area:* compliance · *Raised by:* backend, researcher, qa
CLAUDE.md mandates "sensitive-trait inference (religion, caste, politics, sexual orientation) prohibited" but there's no runtime guard. `server.js:34` mentions festival/regional context without inferring religion, but nothing enforces it. No consent banner before first API call. No purpose declaration, retention policy, or `/api/user/:id/delete` endpoint. `userProfile` (city, country) is written to localStorage without explicit opt-in. DPDP Rules 2025 implementation requires consent as a foundation.
**Fix:** (a) Consent banner before first call — covers message + location processing, opt-out, deletion rights. (b) Store consent + timestamp against a stable user ID. (c) Implement async deletion endpoint. (d) Post-process Claude output with regex + classifier for sensitive-trait keywords (Hindu, Brahmin, Communist, etc.); if detected, re-prompt. (e) External DPDP counsel review before ship.

#### H5. RBI/NPCI readiness for financial flows is undefined
*Area:* compliance · *Raised by:* backend
Response Pattern Model §14 references "Level 4 — Full Auto" autonomy with legal consent for mandate flows. If MVP handles UPI, bill pay, recharge, or money transfer, RBI/NPCI approval is a 3–6 month process and is not visible in the codebase. Render hosting is US-based — DPDP Rules 2025 §6 data-residency implications.
**Fix:** Clarify whether financial flows are in MVP. If yes: separate, heavily-audited backend path isolated from chat; transaction logging; device fingerprinting + MFA confirmation; file RBI/NPCI approval. If no: document explicitly so nothing slips in.

#### H6. ASR failure modes not designed for — no repair flow
*Area:* voice / error recovery · *Raised by:* researcher, frontend-engineer, qa
`index.html:4768–4799` has `onspeechend` / `onerror` but silently retries / logs. No user-facing repair state — no "I didn't catch that", no alternate hypotheses, no confidence-triggered clarification. Response Pattern Model §15.9 mentions degraded mode but there's no confidence signal wired through. No ASR timeout either; `startListening()` at 4614 has no maximum duration.
**Fix:** (a) Surface ASR confidence + alternate hypotheses. (b) Define a repair flow: low-confidence (<0.65) → PARTIAL_RESULT_SHOWN with inferred intent + "Did you mean…?" chips, not a silent retry. (c) 15–20s timeout with "Mic seems stuck" fallback. (d) Research: 5-session T3 in-situ diary study (Durg or Nagpur) on voice usage in real household noise.

#### H7. Microphone permission denied leaves UI in a broken state
*Area:* voice / resilience · *Raised by:* frontend-engineer
`acquireMic()` (line 4599) catches permission errors, sets a status string, but doesn't disable the voice button or offer a recovery path. Re-entering voice mode fails silently.
**Fix:** Gate voice mode entry on `micGranted`. If denied, show a dismissible request + deep-link to browser settings. Fall back to keyboard mode with a clear CTA.

#### H8. No keyboard navigation / focus management — a11y blocker
*Area:* accessibility · *Raised by:* product-designer, frontend-engineer, qa
Interactive elements use inline `onclick=""`. No `:focus-visible` outlines defined. Voice overlay has no focus trap, no `aria-modal`, no return-focus-on-close. Text pill textarea (`index.html:1778–1784`) has `outline: none` with no replacement focus indicator. WCAG 2.1 AA is the stated floor but is currently not met.
**Fix:** Replace `onclick` with event listeners. Add `:focus-visible` rings to all interactives. Add `aria-modal="true"` + focus trap to `.voice-overlay.active`, restore focus on close. Add `aria-label` to every icon-only button. Test keyboard-only top to bottom.

#### H9. Screen reader coverage — semantics and live regions
*Area:* accessibility · *Raised by:* frontend-engineer, qa
Chat bubbles are plain `<div>`s, no `role="article"` or `<article>`. Discovery cards have no semantic roles, no `aria-label`. Filter chips use `data-event` but no `aria-pressed` / `aria-selected`. Thinking spinner (line 1015) has no `role="status"` + `aria-live="polite"`, so state changes go unannounced.
**Fix:** Wrap chat turns in `<article role="region" aria-label="…">`. Add `role="status"` + `aria-live="polite"` to the thinking row. Give each discovery card a `<figure>` / `<figcaption>` or a meaningful `aria-label`. Test with NVDA + VoiceOver.

#### H10. Touch targets below 44px WCAG minimum
*Area:* accessibility · *Raised by:* product-designer, frontend-engineer
Voice action buttons are 42×42px (line 925). Back button is 32px (line 80). Chip buttons have no explicit `min-height`.
**Fix:** Floor all interactives at 44×44px via `min-height` / `min-width`, adding invisible padding where visual size must stay smaller.

#### H11. Voice disclosure (§15 four-beat) not wired to live responses
*Area:* voice-first / utterance design · *Raised by:* researcher, qa
MOCKs have a `voice_disclosure` field but `renderDiscoveryView()` and the TTS endpoint don't consume it. `server.js:80–116` sends text straight to ElevenLabs without enforcing §15.4 density ceilings (≤40 words, 1 anchor, no preamble, pivot required). ElevenLabs voice is Eric (US English) — no Hindi/Hinglish voice selected.
**Fix:** Route voice responses through `voice_disclosure` when in voice mode. Validate against density ceilings. Evaluate ElevenLabs Indic voices vs Google Wavenet / Azure / Bhashini; select by detected language. A/B test with T2 users on Hinglish output.

#### H12. Monolithic bundle blocks render; mock data bloats initial parse
*Area:* performance · *Raised by:* frontend-engineer
CSS is inlined in a single `<style>` block (index.html:10–2319) so DOM waits for full parse. Large `MOCK_*` objects (discovery.js + index.html:3800–4100+) are loaded eagerly even though they're only used by the opt-in Prototypes panel.
**Fix:** Extract CSS to a separate `<link rel="stylesheet">` (parallel load). Move MOCKs to `mocks.js` and dynamic-import on panel open. Measure with `performance.measure()` before/after; target LCP <2.5s on throttled 4G.

#### H13. No observability — structured logs, trace IDs, error handling
*Area:* observability · *Raised by:* backend
`server.js:69, 115` log only `.message`. No request context, no trace IDs, no structured logging. Both endpoints return raw `error.message` to the client — leaks internals.
**Fix:** `pino` or `winston` for JSON logging. `crypto.randomUUID()` per request, passed through to Claude/ElevenLabs calls. Return generic client errors (`{ error: "server_error", message: "Something went wrong." }`) + full details server-side only.

#### H14. No T1/T2/T3 research evidence in the codebase
*Area:* research gap · *Raised by:* researcher
CLAUDE.md asserts JBIQ serves 500M+ across tiers; no research evidence (interviews, diary studies, usability sessions) is cited in the repo or knowledge files. All MOCK scenarios assume English-proficient T1 urban contexts (Fabindia, Diwali kurtas, home loans, morning flights). No T2/T3 scenarios (scheme check, local recharge, community advice).
**Fix:** Commit to one T2 and one T3 cohort (8–10 each, minimum) before code freeze. Publish a research roadmap and log learnings to `.claude/agents/knowledge/researcher.md`. Design 2–3 new MOCKs from findings before launch.

---

### Medium — post-launch but before 1M

#### M1. Stack drift — stated TS + React + Node, shipping plain HTML/JS
*Area:* architecture · *Raised by:* frontend-engineer
Name the gap. Either catch up the code to match the stated stack, or update the stack declaration in CLAUDE.md. Pretending both are true invites ongoing friction.

#### M2. Design-token triple source of truth
*Area:* design system · *Raised by:* product-designer, frontend-engineer
Tokens live in (1) inline `index.html` styles, (2) `discovery.css`, (3) a hardcoded `tokens` object in `discovery.js`. No build-time sync check.
**Fix:** Document which owns what. Generate the `discovery.js` copy from the same JSON source at build time. Add a CI check that the three remain aligned.

#### M3. No CORS / CSRF protection
*Area:* security · *Raised by:* backend
No `cors()` middleware; no CSRF tokens. A malicious page can POST to `/api/chat` directly.
**Fix:** `cors()` with restrictive origin list. Strict `Content-Type: application/json` check. SameSite cookies if/when auth is added.

#### M4. ElevenLabs API key logged in plaintext on startup
*Area:* security · *Raised by:* backend
`server.js:77` logs a substring of the key. Even truncated, it's a fingerprint and ends up in platform logs.
**Fix:** Remove the log. If you need a startup health check, verify `!!process.env.KEY` and nothing more.

#### M5. Schema anatomy incomplete — no `edge_affordance` slot
*Area:* Response Model completeness · *Raised by:* product-designer
Audit P1-1. The canonical four-slot anatomy (Context Line / Primary Result / Refinement Layer / Edge Affordance) is missing the Edge Affordance slot in the schema.
**Fix:** Add `edge_affordance?: { label, event, kind }` to all three DiscoveryView types (`discovery.js:59–176`). Migrate the Context Line from two fields (`title` + `subtitle`) to a single sentence + optional signal enum (P1-2).

#### M6. Missing state variants — empty, error, loading
*Area:* state coverage · *Raised by:* product-designer, qa
No `empty_state` render path even though the schema allows it (`discovery.js:163`). Error state not rendered on API failure. Text-mode thinking indicator (CSS exists at `.text-thinking-dots`) isn't wired to a state trigger.
**Fix:** Render paths for each. Add §10.6 "Empty, Timeout, Error" to the Response Pattern Model with prohibited patterns (don't apologise, don't blame the user).

#### M7. No earcons / audio confirmation for voice state transitions
*Area:* voice UX · *Raised by:* product-designer
Visual feedback on listening / speaking / mute is strong; no audio cues. Indian mobile UX conventions expect a brief tone on mute toggle and turn switch.
**Fix:** 100–200ms tones for: listening started, speech detected, mute toggled, agent speech ended. Toggle in accessibility settings.

#### M8. Responsive breakpoints don't cover <360px devices or landscape
*Area:* responsive · *Raised by:* frontend-engineer
Phone frame is fixed 360×780. Older T3 devices ~320px will clip. No landscape handling.
**Fix:** `width: min(360px, 100%)`. Add `@media (orientation: landscape)` handling. Test at 320 / 360 / 375px.

#### M9. Voice mute state machine — race conditions possible
*Area:* voice state · *Raised by:* frontend-engineer
`isMuted` is a global boolean; mode switches don't check/sync it. Class-toggle-per-action pattern enables impossible states.
**Fix:** Introduce a state machine `{ mode, muted, listening, thinking }`. Sync UI from the machine, not ad-hoc handlers.

#### M10. Clarification-in-voice pattern undefined
*Area:* voice UX · *Raised by:* researcher
Response Pattern Model §11 requires chip-style clarification, but voice can't render chips. No guidance on read-aloud phrasing, option count, or handoff to screen.
**Fix:** Add §15.12 "Clarifications in Voice" to the Model. Wizard-of-Oz 6–8 session study with T2 users comparing phrasings ("Men or women?" vs "Is this for you or someone else?").

#### M11. Shared-phone privacy not surfaced
*Area:* trust · *Raised by:* researcher
No "who is this for?" or privacy disclosure on responses. Joint-family and shared-phone contexts are real in T2/T3 but invisible in the current response design.
**Fix:** Research: WhatsApp interviews with 5–7 T3 users in joint-family contexts on current voice-payment privacy behaviours. Design: optional privacy-mode flag + "confirm who this is for" chip on transactional responses when shared-device heuristics trigger.

#### M12. No API versioning or error categorisation
*Area:* API contract · *Raised by:* backend
Routes are `/api/chat` and `/api/tts` without `/v1/` prefix. All errors return 500 — lost retry semantics.
**Fix:** Rename to `/api/v1/*`. Return 400 / 401 / 429 / 500 appropriately. Include an error-code field (`{ error: "invalid_request", code: "MISSING_TEXT", message: "…" }`).

#### M13. No `/health` endpoint
*Area:* observability · *Raised by:* backend
No load-balancer heartbeat; Render can route traffic to a broken instance.
**Fix:** GET `/health` returning 200 with `{ status: "ok" }`. Production: deep check that validates env vars + makes a tiny Anthropic call with timeout.

#### M14. No offline detection / conversation persistence
*Area:* resilience · *Raised by:* frontend-engineer
`conversationHistory` lives in memory; a reload or tab crash loses it. No `navigator.onLine` checks.
**Fix:** Persist `conversationHistory` to localStorage after each turn. Pre-flight `navigator.onLine` before fetch. Offline banner + queued retry.

#### M15. Device/browser matrix not scoped
*Area:* launch risk · *Raised by:* qa
No documented supported matrix — no iOS / Android floor, no Chrome / Safari minimums, no real-device smoke tests on target Indian budget Androids (Samsung M-series, Redmi Note, Realme).
**Fix:** Write it down. Book BrowserStack / LambdaTest tier for India region. Run smoke tests on 2–3 real devices per target tier before ship. Cover low-RAM (2GB) cases — voice mode has many event listeners (memory-leak risk).

#### M16. Color contrast and opacity-based secondary text
*Area:* accessibility · *Raised by:* product-designer
`rgba(12,13,16,0.65)` secondary text overlaid on certain backgrounds may fall below 4.5:1. Muted mic-off icon is purple-on-purple.
**Fix:** Full contrast audit across light/dark contexts. Either raise opacity or add a dedicated secondary-text token.

---

### Low — polish / post-launch

#### L1. Dependency version ranges are permissive
Permissive carets in `package.json` (`^0.39.0`, `^4.21.2`). Pin versions; enforce `npm ci`; `npm audit` on every build.

#### L2. Duplicate helpers and animation keyframes
`el()` DOM factory, color tokens, animation keyframes duplicated across inline scripts and `discovery.js`. Consolidate into shared modules.

#### L3. No virtualization for long chat histories
Acceptable for MVP; becomes a paint-time issue past ~30 messages. Implement position-based render window when needed.

#### L4. Context-line signal rate not instrumented
Response Pattern Model §18 target is ≥95% signal (festival / delivery / memory) vs filler ("240+ styles"). Build a keyword-based signal classifier, emit to metrics once available. Audit P2-3.

#### L5. Avatar state machine doesn't reflect intent shape
Listening / speaking / thinking avatars don't differ by intent type (informational vs transactional vs clarification). Map to Response Model shapes for v1.1.

#### L6. Text auto-expand edge cases
`.text-pill textarea` uses `resize: none` with `max-height: 120px`. Verify delete-all-text restores the voice button; test on low-end Android for scroll jank.

#### L7. Audit-doc items not tracked as work
The audit (`docs/response-pattern-audit-v1.md`) lists P0–P2 items but no linked milestone, PR, or tickets. Create a "Response Pattern Model v1.1" epic and map each audit item to an issue.

#### L8. Knowledge files not populated
`.claude/agents/knowledge/<agent>.md` files don't exist. All five agents expect durable memory there. Seed each one with project context on first non-trivial task (each persona is already primed to propose this).

---

## What we couldn't assess (and how to close the gap)

Static code review only — the following need live / runtime work before launch:

| Gap | How to close it |
|-----|-----------------|
| Live runtime — do chips actually fire, does voice mode handle mixed-language input, do API timeouts work | Local instance + Playwright E2E test charters per critical path |
| p90 latency on real 4G | BrowserStack / LambdaTest India region, or direct Jio-4G device |
| TTS quality for Hinglish | Record 5–10 `voice_disclosure` mocks via ElevenLabs; native-speaker rating for clarity, naturalness, pace |
| Screen-reader behaviour | axe-core + manual NVDA + VoiceOver + TalkBack passes |
| DPDP compliance depth | External DPDP Rules 2025 counsel review |
| ASR accuracy on non-urban accents | 3–4 speakers × 20–30 utterances (T1 urban / T2 small-city / T3 regional); measure WER + intent accuracy |

---

## Research must-haves before May launch

From the researcher's review — these de-risk the launch at the cohort level, not just the code level:

- **T2 voice-first usability** — 4–6 sessions (Lucknow or Jaipur, 30 min each): chip refinement, clarification phrasing, ASR retry loops, privacy affordances
- **T3 in-situ diary study** — 3–4 weeks (Indore or Durg, 5–7 participants): audio + screen recordings of real voice use in household contexts, noisy environments, shared phones
- **Hinglish code-mixing validation** — 30–40 natural utterances collected, ASR + intent-match tested, response quality rated
- **ASR accent stress-test** — T1 urban / T2 small-city / T3 regional accents on 20–30 utterances; WER and intent accuracy measured
- **Shared-phone privacy research** — WhatsApp interviews with 5–7 T3 joint-family users on current voice-payment privacy behaviours

Log outcomes to `.claude/agents/knowledge/researcher.md` with dates and participant counts. Don't roll up to vague "users preferred…" claims.

---

## Recommended sprint plan

**Week 1 — stop the bleeding (critical items)**
C1 key rotation → C3 system prompt guards → C5 card-cap fix → C2 chip wiring → C4 language path MVP → M4 remove key log

**Week 2 — resilience + scale + contract**
C6 minimal test scaffolding → C7 commitment confirm flow → H1 validation → H2 rate limits → H3 timeouts/retries → H13 observability

**Week 3 — compliance + a11y**
H4 DPDP consent + sensitive-trait guard → H5 RBI/NPCI decision + isolation → H8/H9/H10 keyboard, screen reader, touch targets

**Week 4 — voice + bundle + devices**
C8 build pipeline → H6 ASR repair flow → H11 voice disclosure wiring → H12 bundle cleanup → M15 device matrix + smoke tests

**Week 5 — research + bake + launch gate**
H14 T2/T3 cohort interviews → TTS native-speaker validation → full release-readiness re-review against this document → go / no-go

---

## Sign-off

Five weeks is tight but not impossible for the critical-tier items. The P0 items are small, well-scoped, and already named in `docs/response-pattern-audit-v1.md`. The biggest schedule risks are DPDP legal review (week 3) and the T2/T3 research (week 5 is late — ideally kicks off week 1 in parallel).

Recommend re-running this review against the codebase the week before launch and holding a firm go/no-go on the critical tier only. Don't let medium items accumulate into surprise blockers.
