# JBIQ MVP Build Brief — 5-week sprint to May 2026 launch

**Created:** 2026-04-24 · **Last updated:** 2026-04-24
**Author:** product team consolidated review (see `docs/app-review-2026-04-24.md`)
**Owner:** Matt Jarvis
**Target:** Ship MVP for 1M users, 3–4 domains, end of May 2026

This document is the **single source of truth** for what's being built in the final sprint before launch. It's structured so Claude Code can read it top-to-bottom, treat each fix as a ticket, and pick work up week by week.

---

## 1. Context

**Product:** JioBharatIQ (JBIQ) — India's Daily AI Saathi. Voice-led, 12+ Indian languages, 500M+ target user base. Intent-led intelligent assistant covering work, learning, staying informed, entertainment.

**Non-negotiables:**
- **The UX contract:** every interaction follows Intent → Understanding → Action → Commitment. No interaction skips Intent. No irreversible action without explicit Commitment.
- **Compliance:** DPDP Act 2023 + DPDP Rules 2025; RBI/NPCI for financial flows; sensitive-trait inference prohibited (religion, caste, politics, sexual orientation).
- **Accessibility:** WCAG 2.1 AA as the floor, not the ceiling.
- **Response Pattern Model:** `docs/response-pattern-model.md` is the canonical spec. Audit of current compliance is in `docs/response-pattern-audit-v1.md`.

**Where we are:** strong foundations (Response Pattern Model, schema, voice UX surface) but the code hasn't caught up with the spec. Consolidated review at `docs/app-review-2026-04-24.md` found 5 critical ship blockers and 14 must-fix-before-scale items.

**Where we're going:** end of May 2026, a product that ships the critical tier cleanly, has the resilience and compliance scaffolding for 1M users on Indian 4G, and has been pressure-tested against real T2/T3 voice use — not just lab-tested against urban English.

---

## 2. Ways of working

### 2.1 The team

Five Claude Code subagents live in `.claude/agents/`:

- `product-designer` — UX, design system, copy, a11y
- `researcher` — India T1/T2/T3, voice-led products
- `backend-engineer` — APIs, data, infra
- `frontend-engineer` — UI, state, a11y, performance
- `qa` — test strategy, release readiness

Each agent has durable memory at `.claude/agents/knowledge/<slug>.md`. **Before the first non-trivial task, each agent should seed its knowledge file** with project context pulled from this document, from `CLAUDE.md`, and from `docs/response-pattern-model.md`. See §7 for the seed template.

### 2.2 Routing

In Claude Code, tasks auto-route by `description` match, but be explicit when in doubt:

```
"use the backend-engineer agent to implement H1 (input validation) per the build brief"
"as the qa agent, scaffold the minimal test pyramid in C6"
```

### 2.3 Knowledge-file discipline

At the **start** of every non-trivial ticket, the owning agent reads:

1. This build brief (the relevant fix + any cross-references)
2. Its own knowledge file (`.claude/agents/knowledge/<slug>.md`)
3. Any referenced audit / model / schema doc (`docs/response-pattern-*`)

At the **end** of every non-trivial ticket, the agent proposes 1–3 dated learnings; on confirmation, they're appended to the knowledge file under a new dated heading. Append, never silently rewrite.

### 2.4 Commit conventions

- One ticket per PR. Title: `[C2] Wire up refinement chips end-to-end`.
- PR description links to this doc + the relevant audit item.
- Commit message includes the ticket ID: `[C2] Mutate chips.selected on tap and re-render collection`.

### 2.5 Fix ticket shape

Each fix in this document has the same fields so Claude Code can treat them as interchangeable tickets:

- **ID** — matches the consolidated review (`C1`…`H14`…`M1`…`L1`)
- **Owner** — primary agent (may collaborate with others)
- **Files** — specific file + line ranges where known
- **Scope** — what to build, as a short spec
- **Acceptance criteria** — checks that must pass before merge
- **Effort** — S (<1 day), M (1–3 days), L (3–5 days), XL (>1 week)
- **Dependencies** — other IDs that must land first (if any)

### 2.6 Re-review checkpoint

**Friday of Week 4** (15 May 2026), re-run the five-agent app review against the main branch (same prompts as `docs/app-review-2026-04-24.md`). Any new Critical findings are ship blockers; High findings inform the launch risk register. Run a final read-through on Wednesday of Week 5 before the go/no-go call.

---

## 3. Human-only tasks (run these in parallel)

Claude Code **cannot** do these. Kick them off this week — they have the longest lead times.

### 3.1 Rotate leaked API keys — today
`.env` is committed to the repo with live Anthropic + ElevenLabs keys. Rotate both at the provider. Then purge `.env` from git history:

```bash
git filter-repo --path .env --invert-paths
git push origin --force-with-lease --all
```

Move both keys into Render's env-var UI (already referenced in `render.yaml:8–11`). Add a pre-commit hook to block future `.env` commits (see `backend-engineer` for the hook script).

### 3.2 Engage DPDP counsel — this week
DPDP Rules 2025 review cannot be back-ended. Book a call with external counsel this week, give them `docs/app-review-2026-04-24.md` §H4 as the starting scope. Target: written sign-off or remediation list by end of Week 3 at the latest.

### 3.3 Decide on financial flows in MVP — this week
Either commit to RBI/NPCI approval (3–6 month process — so MVP = no financial flows) or explicitly scope them out of MVP. Document the decision in `docs/scope.md` so nothing slips in. See H5.

### 3.4 Commission T2/T3 fieldwork — this week
Book recruiters for: 6-session T2 voice usability (Lucknow or Jaipur), 3-week T3 in-situ diary (Indore or Durg, 5–7 participants), 30-utterance Hinglish code-mixing collection, and ASR accent stress-test on 3–4 speakers. The `researcher` agent can draft scopes and discussion guides (see H14 for brief). Kick-off this week; findings must land by mid-Week 5.

### 3.5 Device-cloud access — this week
Book BrowserStack or LambdaTest tier with Indian region devices. Needed from Week 4 for real-device smoke tests on budget Androids.

---

## 4. Sprint plan

### Week 1 — Stop the bleeding
**Theme:** close the P0 contract-compliance gaps. Every fix has a named file + line range; none require new architecture.

#### C1 — Rotate leaked API keys *(human task — see §3.1)*

#### C2 — Wire up refinement chips end-to-end
- **Owner:** `frontend-engineer` (primary) + `product-designer` (chip-state behaviour review)
- **Files:** `discovery.js:2920–2931` (handler stub); `discovery.js:95, 114` (`filter_ids` schema); `discovery.js` render entry point
- **Scope:**
  1. On chip tap, mutate `view.filters.chips[i].selected` (toggle).
  2. Run a pure filter predicate over `collection.cards` using the existing `filter_ids` field on each card.
  3. Re-render the `.jbiq-discovery` subtree — cards + empty-state where applicable.
  4. Wire the sort dropdown (same `console.log` stub) to re-order cards.
  5. Keyboard + screen-reader affordances: chips are `<button>` with `aria-pressed`; focus is preserved across re-renders.
- **Acceptance criteria:**
  - Tapping a chip reduces the rendered card set to those matching the selected `filter_ids`.
  - Tapping twice toggles back to default.
  - Multiple chips combine as AND (unless spec says otherwise — confirm with product-designer).
  - Empty-state renders if filters match zero cards.
  - Keyboard-only user can toggle chips with Space / Enter; screen reader announces `aria-pressed` state changes.
  - Sort dropdown re-orders without re-fetching.
- **Effort:** M (1–2 days)
- **Dependencies:** none
- **Reference:** audit P0-1

#### C3 — Add prohibited-pattern guards to system prompt
- **Owner:** `backend-engineer` + `product-designer` (review prompt wording)
- **Files:** `server.js:29–52` (system prompt); `server.js:59–72` (post-processing hook point)
- **Scope:**
  1. Replace the current minimal system prompt with a Response-Pattern-Model-derived directive covering: canonical anatomy (Context Line → Primary Result → Refinement Layer → Edge Affordance), prohibited openers, prohibited enthusiasm, language-match rule (including code-mixing), closing-question prohibition.
  2. Add a post-processing regex sweep on Claude's output: detect top-5 filler openers ("Sure!", "Let me", "I'd love", "Great question", "Amazing!"), detect closing questions ("Anything else?"). Strip or re-prompt per policy.
  3. Log a metric every time a violation is detected pre-strip (feed into observability per H13).
- **Acceptance criteria:**
  - New prompt is in `server.js` and includes the prohibited-pattern block list (cross-reference `docs/response-pattern-model.md` §16).
  - Unit test: mock Claude response of "Sure! Here are your kurtas…" returns a response with the opener stripped.
  - Unit test: mock Claude response ending "Anything else?" returns a response with the closing question stripped.
  - Metric emitted on every strip (counter name: `response_pattern_violations_total{pattern="filler_opener"}`).
- **Effort:** S (<1 day, tight)
- **Dependencies:** none
- **Reference:** audit P0-3

#### C4 — Language detection + Hinglish path MVP
- **Owner:** `researcher` (scope the detection rules) + `backend-engineer` (wire into prompt) + `frontend-engineer` (wire into render)
- **Files:** `server.js:29–52`, `server.js:19–25` (request handling); `index.html:3117–3140` (matcher regexes); any MOCK subject/title strings in `discovery.js`
- **Scope:**
  1. **Detection (MVP):** keyword-based probe on the latest user intent. Detect: English, Hindi (Devanagari), Hinglish (Latin script + Hindi tokens like `kal`, `subah`, `dhundo`, `kaunsa`, `paisa`, `milega`, numbers-in-Latin), Tanglish (Latin + Tamil tokens). Returns `{ language, confidence }`.
  2. **Server-side:** inject detected language into the system prompt dynamically. Pass the user's last intent language verbatim to Claude.
  3. **Client-side:** route Hinglish / Hindi responses into DiscoveryView subjects translated to match. Seed at least three existing MOCKs with Hinglish variants (shopping, recharge, trains) so the render path is exercised.
  4. **Matcher regexes:** extend `index.html:3117–3140` to match Hinglish utterances for the same intent shapes (e.g. "Diwali ke liye kurta dhundo" → same route as "Shop for a kurta for Diwali").
- **Acceptance criteria:**
  - English intent → English response (as today).
  - Hinglish intent "Mere liye best recharge plan kaunsa hai?" → Hinglish response, matches same intent shape as "Which plan is best for me?".
  - Hindi Devanagari intent → Hindi response.
  - At least three MOCKs render in Hinglish with correct Context Line signals (delivery, festival, etc).
  - Language detection runs in <20ms (log p99).
- **Effort:** M (2–3 days)
- **Dependencies:** C3 (prompt is replaced)
- **Reference:** audit P0-4

#### C5 — Card-cap fix + runtime validator
- **Owner:** `product-designer` (audit mocks) + `frontend-engineer` (implement validator)
- **Files:** `discovery.js:1503–1572` (MOCK_KURTA_DIWALI); `discovery.js:271–273` (`validateCatalog`); all other `MOCK_*` constants
- **Scope:**
  1. Drop `anita_groom_sherwani` from MOCK_KURTA_DIWALI so the card count is ≤5.
  2. Audit all ~20 `MOCK_*` constants for the same violation; cap where needed.
  3. Add `cards.length <= 5` to `validateCatalog()`. Fail loudly in dev, log metric in prod (see H13).
- **Acceptance criteria:**
  - `validateDiscoveryView(MOCK_KURTA_DIWALI)` passes.
  - Unit test: a 6-card catalog fails validation.
  - Running the app through the existing MOCK list (from `DISCOVERY_QUERY_PATTERNS`) produces zero validation errors.
- **Effort:** S (hours)
- **Dependencies:** none
- **Reference:** audit P0-2

#### M4 — Remove truncated-key log from server startup
- **Owner:** `backend-engineer`
- **Files:** `server.js:77`
- **Scope:** remove the `console.log` that prints the first 10 chars of the ElevenLabs key. If a startup sanity check is desired, verify `!!process.env.ELEVENLABS_API_KEY` and log nothing beyond `"ElevenLabs configured: true/false"`.
- **Acceptance criteria:** no fragment of any secret appears in any log output.
- **Effort:** S (minutes)
- **Dependencies:** C1 (after rotation)

**End-of-week-1 gate:** the five critical-tier items are merged. Audit doc P0-1 through P0-4 closed. Re-run the relevant portion of the five-agent review against the branch.

---

### Week 2 — Resilience, tests, the Commitment contract

#### C6 — Minimal test scaffolding + CI
- **Owner:** `qa` (strategy + test charters) + `backend-engineer` (CI wiring) + `frontend-engineer` (E2E scaffolding)
- **Files:** `package.json`; new `tests/` folder; new `.github/workflows/ci.yml`
- **Scope:**
  1. Add devDependencies: `vitest` (unit), `@playwright/test` (E2E). Scripts: `npm test`, `npm run test:e2e`.
  2. Unit tests: `validateDiscoveryView`, the language-detection probe from C4, the chip-filter predicate from C2, the post-processing strip from C3.
  3. E2E smoke tests (Playwright): (a) text chat happy path, (b) voice activation (mock mic), (c) API 500 response renders a user-visible error, (d) chip refinement reduces card count.
  4. GitHub Actions workflow: on push/PR, run unit tests + E2E against a local server. Gate merge on green.
  5. Add a Lighthouse CI job against the built app (throttled 4G profile) — **warn** for now; we'll gate in Week 4.
- **Acceptance criteria:** `npm test` and `npm run test:e2e` pass locally and in CI. PRs can't merge red.
- **Effort:** L (3–5 days)
- **Dependencies:** C2, C3 (things to test)

#### C7 — Commitment confirm flow for irreversible actions
- **Owner:** `product-designer` (design + copy) + `frontend-engineer` (implement) + `qa` (test charter)
- **Files:** `discovery.js` card event handlers (currently `console.log` at `discovery.js:2920`); new `commitment-sheet.js`/CSS; update relevant MOCKs
- **Scope:**
  1. Define `COMMITMENT_REQUIRED` state in the client interaction model (explicit state machine).
  2. Any card with `primary_event` of a known irreversible shape (`order_place`, `bill_pay`, `recharge`, `book_confirm` — enumerate) triggers a confirmation sheet before any `/api/…` call.
  3. Confirm sheet shows: action summary, amount / recipient / timing, two buttons (`Confirm` primary, `Cancel` secondary), keyboard-accessible, focus-trapped, `aria-modal="true"`.
  4. Cancel returns to the previous state with no side-effects. Confirm fires the event and transitions to a success or error state.
- **Acceptance criteria:**
  - E2E test: a user cannot execute any listed irreversible event without first tapping Confirm.
  - Keyboard-only test: focus is trapped in the sheet until Confirm or Cancel.
  - Screen reader announces the modal title and action summary on open.
  - Spec documented in `docs/response-pattern-model.md` §14 extension ("Commitment sheet anatomy").
- **Effort:** L (3–4 days)
- **Dependencies:** C6 (tests rely on E2E scaffolding)

#### H1 — Input validation on API endpoints
- **Owner:** `backend-engineer`
- **Files:** `server.js:19–25` (chat), `server.js:75–85` (tts)
- **Scope:** add `zod` schemas for `/api/v1/chat` and `/api/v1/tts` request bodies. Validate message shape, length (max 50 messages, max 4k chars per message), `userProfile` fields (allow-listed keys, strings with regex). Escape any `userProfile` fields before concatenation into the system prompt.
- **Acceptance criteria:** invalid bodies return `400` with a machine-readable error code. Unit tests for malformed/oversize bodies. No prompt-injection regression via the `userProfile` field.
- **Effort:** M (1 day)
- **Dependencies:** M12 (versioned routes) can land together

#### H2 — Rate limiting + quotas
- **Owner:** `backend-engineer`
- **Files:** `server.js` (middleware); new lightweight store for quotas (in-memory MVP, Redis when user accounts land)
- **Scope:** `express-rate-limit` keyed by IP (pre-auth). Per-route caps: chat 100/min, tts 20/min. Response 429 with `Retry-After`. Log each rate-limit event.
- **Acceptance criteria:** burst tests exceeding caps return 429; under-cap traffic is unaffected. Rate-limit metric is emitted.
- **Effort:** S (hours)
- **Dependencies:** none

#### H3 — Timeouts, retries, circuit breaker
- **Owner:** `backend-engineer` (server-side) + `frontend-engineer` (client-side)
- **Files:** `server.js:59–72` (Anthropic call), `server.js:87–116` (ElevenLabs call); `index.html:4329–4340` (client fetch)
- **Scope (server):** `AbortController` with 30s timeout (chat) / 20s (tts); exponential backoff (1s, 2s, 4s) up to 3 retries on network error; circuit breaker (5 consecutive failures → fail-fast for 60s per upstream).
- **Scope (client):** `AbortController` with 15s timeout; retry once on transient failure; `navigator.onLine` pre-flight; `conversationHistory` persisted to `localStorage` after each turn.
- **Acceptance criteria:** simulated upstream 30s hang returns a user-visible error in ≤15s client-side. Flaky-network test (chaos mode) still drives conversations to completion on reconnect.
- **Effort:** M (1–2 days)
- **Dependencies:** none

#### H13 — Observability — structured logs + trace IDs
- **Owner:** `backend-engineer`
- **Files:** `server.js` (top-level + each route); new `logger.js`
- **Scope:** `pino` structured JSON logging. Per-request `crypto.randomUUID()` stored on `req.id` and passed through in headers to Anthropic/ElevenLabs calls. Log levels: info (request start/end), warn (rate-limit, validation failure), error (upstream failure, unhandled exception). Never log `userProfile` or message content in full — log lengths / shapes only. Client errors return a generic message; full detail server-side only.
- **Acceptance criteria:** every request log line has a `requestId`, a `route`, a `status`, and a `durationMs`. No PII in logs. No stack traces returned to clients.
- **Effort:** M (1 day)
- **Dependencies:** none

**End-of-week-2 gate:** CI is green, Commitment flow is verifiable end-to-end, resilience under timeouts / rate limits / chaos is demonstrable. `qa` agent produces a release-risk register based on what's landed vs still outstanding.

---

### Week 3 — Compliance + accessibility

#### H4 — DPDP consent model + sensitive-trait guard
- **Owner:** `backend-engineer` + `product-designer` (consent UX) + `researcher` (review for tier-specific language)
- **Files:** new `consent-banner.js` + CSS; `server.js` (new `/api/v1/user/consent` + `/api/v1/user/:id/delete`); `index.html` (gating first API call)
- **Scope:**
  1. **Consent banner:** presented before first `/api/v1/chat` call. Covers message + location processing, opt-out, right to erasure. Plain Hindi + English variants (ideally more languages on roadmap).
  2. **Server:** store consent + timestamp + version against a stable anonymous user ID (device-scoped UUID is MVP). Block chat/tts without consent.
  3. **Deletion:** async endpoint that purges conversation history and associated data; returns a confirmation ID.
  4. **Sensitive-trait guard:** after Claude response, scan for sensitive-trait keywords (religion/caste/politics/sexual-orientation). If detected, either strip or re-prompt. Emit metric.
  5. **Retention:** document the policy (`docs/data-handling.md`). MVP: purge conversation history after 30 days unless user opts in to memory.
- **Acceptance criteria:** no API call can proceed without consent. Deletion endpoint verified by a manual QA pass. Prompt-level test: "Are you Hindu?" → response refuses to infer identity. DPDP counsel sign-off (see §3.2).
- **Effort:** XL (5+ days)
- **Dependencies:** counsel engagement (§3.2) — start the work this week; don't block on sign-off

#### H5 — RBI/NPCI scoping (depends on §3.3 decision)
- **Owner:** `backend-engineer` (if in scope); `product-designer` (out-of-scope scope documentation)
- **Scope:** per §3.3 decision. If financial flows in scope: isolated backend path, transaction logging, MFA, RBI/NPCI filing. If out of scope: explicit documentation + UI flag to prevent accidental surfacing of payment intents.
- **Effort:** variable — XL if in-scope, S if out-of-scope
- **Dependencies:** §3.3

#### H8 — Keyboard navigation + focus management
- **Owner:** `frontend-engineer` + `product-designer` (focus-state styling)
- **Files:** all `onclick=""` in `index.html`; `.voice-overlay` (index.html:499+); `.text-pill textarea` (index.html:1778–1784); CSS for `:focus-visible`
- **Scope:**
  1. Replace inline `onclick=""` with `addEventListener` so keyboard events can be intercepted.
  2. `:focus-visible` ring (2px, primary color, 2px offset) on all interactives.
  3. Voice overlay: `aria-modal="true"`, focus trap, return-focus-on-close, Escape dismiss.
  4. Document the tab order through voice mode and text mode.
- **Acceptance criteria:** keyboard-only pass top-to-bottom through both modes without the cursor getting lost or trapped. Escape always returns to the previous state.
- **Effort:** M (2–3 days)
- **Dependencies:** C2 (chips are keyboard-operable)

#### H9 — Semantic HTML + screen-reader announcements
- **Owner:** `frontend-engineer` + `product-designer`
- **Files:** chat bubbles (index.html:986+, 1078+); discovery card renderer in `discovery.js`; thinking spinner (index.html:1015)
- **Scope:**
  1. Wrap chat turns in `<article role="region" aria-label="…">`.
  2. Discovery cards: `<figure>` with `<figcaption>` or meaningful `aria-label`.
  3. Thinking row: `role="status"` + `aria-live="polite"`.
  4. Chips: `<button>` with `aria-pressed`; filter controls have `aria-label`.
- **Acceptance criteria:** full NVDA pass (Windows) and VoiceOver pass (iOS) on the happy path — every new message is announced; chip state changes are announced; loading states are announced. Record audio of a pass and attach to the PR.
- **Effort:** M (2 days)
- **Dependencies:** C2

#### H10 — Touch targets ≥ 44px
- **Owner:** `frontend-engineer`
- **Files:** voice action buttons (index.html:925); back button (index.html:80); chips (discovery.css:266)
- **Scope:** floor all interactives at 44×44px via `min-height` / `min-width`. Use invisible padding to keep visual size where design requires a smaller icon.
- **Acceptance criteria:** axe-core audit reports zero touch-target violations.
- **Effort:** S

**End-of-week-3 gate:** DPDP consent is live (or scope-documented with counsel sign-off pending). Sensitive-trait guard runs on every Claude response. WCAG 2.1 AA pass on keyboard + screen-reader happy paths.

---

### Week 4 — Voice, bundle, devices

#### C8 — Build pipeline + bundle slim-down
- **Owner:** `frontend-engineer`
- **Files:** new `vite.config.js`; restructure of `index.html` → minimal shell + JS module entry; split of CSS from inline `<style>` block (index.html:10–2319)
- **Scope:**
  1. Introduce Vite. Keep dev-mode ergonomics (no build step for quick iteration); production build: minified, gzip-ready.
  2. Split `index.html` into a minimal shell with separate CSS file and JS module entry.
  3. Move all `MOCK_*` data to `mocks.js` and dynamic-import when the Prototypes panel opens. Same for the prototypes panel itself.
  4. Lighthouse CI gate: LCP < 2.5s on Moto G4 throttled 4G profile. Fail the build if regressed.
- **Acceptance criteria:** total initial transferred size <80KB gzipped for the happy path. LCP target met. No regression in existing test suite.
- **Effort:** L (3–5 days)
- **Dependencies:** C6 (tests exist to prevent regressions)

#### H6 — ASR repair flow
- **Owner:** `product-designer` (design) + `frontend-engineer` (implement) + `researcher` (session-based validation)
- **Files:** `index.html:4614` (startListening), `index.html:4768–4799` (onspeechend/onerror)
- **Scope:**
  1. Surface ASR confidence + alternate hypotheses (use `SpeechRecognitionResult.confidence`).
  2. Below a configurable threshold (start at 0.65): render inferred intent + "Did you mean…?" chips (using the Refinement Layer), not a silent retry.
  3. 15–20s soft timeout: "Mic seems stuck — tap to try again".
  4. Permission-denied path: deep-link to browser settings; fall back to keyboard mode with a clear CTA.
- **Acceptance criteria:** silence >15s triggers the timeout UI. Low-confidence ASR result (simulated) renders clarification chips. Denying mic permission disables voice mode without breaking the app.
- **Effort:** M (2–3 days)
- **Dependencies:** C2 (chips are live)

#### H7 — Mic-permission recovery
*(rolled into H6 above — same file, same PR recommended)*

#### H11 — Voice disclosure (§15 four-beat) wired to live responses
- **Owner:** `product-designer` (validate copy against §15 rules) + `backend-engineer` (TTS path)
- **Files:** `server.js:80–116` (TTS endpoint); `discovery.js` voice rendering path; MOCKs' `voice_disclosure` field
- **Scope:**
  1. When user is in voice mode, route response through `voice_disclosure` field (fall back to `subject.title` only if absent).
  2. Validate against §15.4 density ceilings (≤40 words, ≤1 anchor disclosed, pivot required, no preamble).
  3. Select ElevenLabs voice by detected language. If ElevenLabs doesn't offer a suitable Hindi/Hinglish voice, evaluate Google Wavenet / Azure / Bhashini; document the choice in `docs/voice-stack.md`.
- **Acceptance criteria:** all 20 MOCK `voice_disclosure` fields pass the density-ceiling validator. End-to-end voice-mode test produces TTS output in the detected language for at least three MOCKs. Native-speaker rating of ≥4/5 clarity on the sampled Hinglish outputs (see §3.4 research).
- **Effort:** M (2 days)
- **Dependencies:** C4 (language detection)

#### H12 — Bundle / render performance
*(rolled into C8 — same PR)*

#### M15 — Device matrix + real-device smoke tests
- **Owner:** `qa`
- **Files:** new `docs/device-matrix.md`; BrowserStack/LambdaTest config
- **Scope:**
  1. Documented matrix: iOS 14+ (iPhone XS+), Android 10+ (Samsung M31+, Redmi Note 9+, Realme 6+), Chrome 100+, Safari 14+. Explicit unsupported list.
  2. Cloud smoke tests on 2–3 real devices per tier on Jio 4G profile: text chat, voice mode, chip refinement, commitment flow.
  3. Low-RAM (2GB) memory-leak check for voice mode (100-message stress test).
- **Acceptance criteria:** matrix committed. All smoke tests pass on real devices. Memory check shows no monotonic growth over 100-message sessions.
- **Effort:** M (2 days)
- **Dependencies:** §3.5 (device cloud access)

**End-of-week-4 gate:** bundle and voice + device work all shipped. Re-run the five-agent review on main. Any new Critical findings are ship blockers.

---

### Week 5 — Research, bake, launch gate

#### H14 — T2/T3 cohort findings land
- **Owner:** `researcher`
- **Scope:** synthesize the Week-1-kicked-off fieldwork (§3.4) into a one-pager per cohort (T2, T3) + prioritized product actions. Propose MOCK updates where findings warrant — e.g. new intent shapes, revised Hinglish variants, privacy affordances. Log all findings to `.claude/agents/knowledge/researcher.md` with dates and participant counts.
- **Acceptance criteria:** field notes published to `docs/research/`. Product actions triaged: ship-now / ship-fast-follow / backlog. Any ship-now item spawns a fresh ticket.
- **Effort:** L (week-long)

#### Launch-gate re-review
- **Owner:** Matt + all five agents
- **Scope:** re-run the five-agent app review against main branch using the same prompts as `docs/app-review-2026-04-24.md`. Compare delta. Go / no-go call on the Friday.
- **Success criteria:** zero Critical findings open. All High findings either closed or in a documented, user-communicated workaround. `qa` release-readiness call is green.

#### Other Week-5 work
- Hinglish TTS native-speaker rating (depends on §3.4)
- Final pass on the device-matrix smoke tests (real-device, post-merge)
- Copy polish on all error/empty/loading states
- Final DPDP counsel sign-off landing

---

## 5. Out of scope for the May MVP

Name these explicitly so nothing slips in. These are deferred to v1.1+:

- **Full-auto (Level 4 autonomy) flows** — Response Model §14 Level 4 is post-MVP.
- **Financial flows** — unless §3.3 says otherwise.
- **12-language rollout** — MVP is English + Hinglish + Hindi. Tamil, Tanglish, Marathi, Bengali, Telugu, Kannada, Gujarati, Malayalam, Punjabi, Odia, Assamese land in v1.1+.
- **Persistent user accounts** — MVP uses device-scoped anonymous IDs. Cross-device sync waits.
- **React/TS migration** — the build pipeline from C8 is the stepping stone; actual React+TS is v1.1.
- **Advanced memory** — conversation is session-scoped + 30-day persistence (see H4). Full memory graph is v1.1+.
- **Push notifications, proactive surfacing, agentic flows** — all post-MVP.

---

## 6. Definition of done (per ticket)

A ticket is done when:

1. Code is merged to `main` via a single PR.
2. All acceptance criteria listed under the ticket are verified — the PR description ticks each one.
3. Unit / E2E tests exist and are green in CI (for anything with new logic).
4. The owning agent has proposed 1–3 dated learnings to its knowledge file and they're appended on sign-off.
5. Any spec change is reflected in the relevant doc (`docs/response-pattern-model.md`, `docs/data-handling.md`, `docs/device-matrix.md`, etc.).
6. `qa` has signed off (or waived with reason) before merge to main.

---

## 7. Knowledge-file seed template

Before each agent takes its first ticket, seed its `.claude/agents/knowledge/<slug>.md` file with the following template (filled in from this document + `CLAUDE.md`). Each agent knows how to do this — just ask.

```markdown
# <Agent role> — Knowledge file

Last updated: YYYY-MM-DD

## Project context

JBIQ (JioBharatIQ) — India's Daily AI Saathi. Voice-led, 12+ Indian
languages, 500M+ target. MVP launch end of May 2026 (1M users, 3–4 domains).

## The contract

Every interaction: Intent → Understanding → Action → Commitment.
No irreversible action without explicit Commitment.

## Canonical docs

- `docs/response-pattern-model.md` — response anatomy, prohibited patterns, voice
  disclosure
- `docs/response-pattern-audit-v1.md` — current compliance gaps
- `docs/app-review-2026-04-24.md` — consolidated five-agent review
- `docs/build-plan-2026-04-24.md` — this sprint plan

## Verified decisions

<fill in as work lands — stack confirmations, voice-stack choice, etc.>

## Dated learnings

(append-only, supersede don't delete)
```

---

## 8. Appendix — Agent invocation examples

Paste these into Claude Code to kick off work:

```
As the frontend-engineer agent, read the build plan at docs/build-plan-2026-04-24.md and start ticket C2 (refinement chips end-to-end). Seed your knowledge file from the §7 template first. Ping the product-designer agent if you need the chip-state behaviour clarified.
```

```
As the backend-engineer agent, start on ticket C3 (system prompt guards). Cross-reference docs/response-pattern-model.md §16 for the prohibited-pattern list. Propose the new system prompt in the PR description before editing server.js so we can review the copy.
```

```
As the qa agent, draft exploratory testing charters for the C7 Commitment confirm flow. Include edge cases: rapid double-tap, keyboard-only, screen reader, network drop mid-confirmation, amount change between preview and confirm.
```

```
As the researcher agent, draft a T2 voice-usability discussion guide for the fieldwork kicking off in §3.4. Target: Lucknow or Jaipur, 6 sessions × 30 min. Focus on chip refinement, ASR repair, privacy affordances in shared-phone contexts.
```

```
As the product-designer agent, review the copy in the new system prompt (ticket C3) for tone, prohibited patterns, and Hinglish code-switching guidance. Suggest edits before merge.
```

---

## 9. Questions / open issues to resolve Week 1

- Is any financial flow in MVP? (§3.3) — decide by EOW 1.
- Which ElevenLabs / Google / Azure / Bhashini voice stack for Hindi + Hinglish? — `backend-engineer` to propose by Week 4, validated by `researcher` native-speaker testing.
- Render vs alternative hosting for DPDP residency (§H4, §M3)? — `backend-engineer` + DPDP counsel.
- User-account persistence model (device UUID vs login)? — post-MVP, but note any hard blockers early.

---

## 10. Changelog

- 2026-04-24 · First version, post five-agent review. 5-week sprint plan, ship end of May 2026.
