# JBIQ Saathi — Developer Handoff

**Audience:** the Jio engineering team rebuilding JBIQ Saathi as a production consumer app.
**Status of this repo:** a **reference prototype**, not the shipping codebase. Use it to
*experience* the product, *reuse* the parts that carry across any stack, and *rebuild*
screen-by-screen from the design source — then work the "make it real" backlog (§10).

> One-line summary: the **voice loop is real and production-shaped** (Sarvam STT → Claude
> chat → Sarvam TTS on an Express backend). Almost everything else — identity, engagement,
> Home/Spaces content, partner cards, onboarding — is **demo scaffolding** that must be
> replaced by real services.

---

## 1. What this is / what it isn't

| It IS | It ISN'T |
|---|---|
| A working, demoable prototype (native iOS + a shareable web build) | A production app or a codebase to ship as-is |
| A real, reusable voice+LLM backend (`server.js`) | A real identity / accounts / personalization system |
| A faithful implementation of the approved Figma designs | Instrumented, content-managed, or partner-integrated |
| A reference for UX, copy, motion, and API shape | Tested, linted, or CI-gated |

The intended path: **rebuild on Jio's production stack** (A2UI/JDS, Next.js, or native).
This document is the bridge.

---

## 2. Run the prototype (runbook)

### 2a. Web build — fastest, for anyone (no Xcode)
- **Hosted:** `https://jbiq-app-v2.onrender.com/app/` (best viewed in a mobile viewport, ~375×812).
- **Local server + web app:** from the repo root:
  ```bash
  npm install
  # create a root .env (gitignored — ask the maintainer for values):
  #   ANTHROPIC_API_KEY=...   SARVAM_API_KEY=...   (optional: SWIGGY_MCP_TOKEN=...)
  npm start          # Express on http://localhost:3000, serves /app and the APIs
  ```
  Open `http://localhost:3000/app/`.
- **Standalone zip:** a self-contained web export can be produced (drop the `experiments.baseUrl`
  in `mobile/app/app.json`, run `expo export --platform web`, serve the folder from its root).
  Voice STT/TTS call the hosted API; the rest runs in the browser.

> Demo behaviour: **every launch runs the full new-user flow** (interests picker → home →
> voice sheet). This is intentional for pitching, not a persistence bug — see §4 / §10.

### 2b. Native iOS app — the real target experience
In `mobile/app/`:
```bash
npm install                     # runs patch-package postinstall (required — see §8)
# create mobile/app/.env:
#   EXPO_PUBLIC_API_BASE_URL=http://<your-LAN-IP>:3000   (points the phone at your server)
#   EXPO_ROUTER_DISABLE_RN_NAVIGATION_CHECK=1
npx expo prebuild               # ios/ and android/ are gitignored — regenerate them
npx expo run:ios                # custom dev client; Expo Go will NOT work
```
Requires a **custom dev client** (native modules: lottie, blur, audio/video, svg, webview,
async-storage, splash). Bundle id `com.sunit.JioBharatIQ`; EAS project `matt_jarvis / e700ae4d-…`.
Build profiles in `mobile/app/eas.json` (`development` / `preview` / `production`).

---

## 3. Architecture & repo map

```
 iOS app (Expo/RN)  ─┐
 Web build (/app)   ─┼─►  server.js (Express, Render)  ─►  Anthropic  (chat: claude-sonnet-4)
                     │                                  ─►  Sarvam     (TTS bulbul:v3 / STT saarika:v2.5)
                     │                                  └►  Swiggy MCP (partner menu, demo only)
```

| Path | What it is |
|---|---|
| `mobile/app/` | The Expo/React Native app source (SDK 56 / RN 0.85 / React 19). The real thing. |
| `app/` (repo root) | **Committed** web build output (Metro single-page export). Served at `/app`. |
| `server.js` + `shared/` | Express API + the brand system prompt. **Reusable.** |
| `tokens/` | JDS design tokens (`jds.tokens.json` → generated `tokens.ts`). Shared by app + web; the RN app imports it via Metro `watchFolders` (cross-project coupling — see §8). |
| `worker/` | A Cloudflare Worker mirror of the API. |
| root `*.html`, `components.css` | The separate HTML "voice playbook" / component pages (a different deliverable). |
| `docs/` | Product & experience specs (see §9). |

Client base URL resolution (`mobile/app/src/config.ts`): web → same-origin (`''`); native →
`EXPO_PUBLIC_API_BASE_URL` → `app.json extra.apiBaseUrl` → `https://jbiq-app-v2.onrender.com`.

---

## 4. What's REAL vs DEMO (read this before trusting any screen)

| Capability | Verdict | Evidence |
|---|---|---|
| Voice STT | **REAL** | `server.js:105` (`/api/stt`, Sarvam `saarika:v2.5`); client `mobile/app/src/api/client.ts:88` |
| LLM chat / reasoning | **REAL** | `server.js:21` (`/api/chat`, `claude-sonnet-4-20250514`); `mobile/app/src/screens/saathi/useConversation.ts:55` |
| Voice TTS | **REAL** | `server.js:56` (`/api/tts`, Sarvam `bulbul:v3`, speaker `priya`); `useConversation.ts:60` |
| Brand system prompt | **REAL** | `shared/system-prompt.js` (`buildSystemPrompt`) — a genuine asset |
| First-run onboarding | **SCRIPTED** | `mobile/app/src/screens/saathi/useFirstRunScene.ts` — fixed line + two pre-recorded MP3s + a canned darshan card |
| Home tapped-prompt replies | **DEAD-END** | `useConversation.ts:155` `sendPrototype` — pushes the message then sits in "thinking" forever; **never calls the backend** |
| User identity | **HARDCODED** | `HomeScreen.tsx:64` `USER_NAME = 'Arjun'` |
| Device trust | **STUBBED ON** | `HomeScreen.tsx:82` `TRUST_SIMULATED = true` |
| Engagement lifecycle | **SIMULATED** | `HomeScreen.tsx:69,73` `Stage` / `DEMO_STAGES`; cycled by long-press (`cycleDemo`, `HomeScreen.tsx:457`) and the `DemoSheet` (`HomeScreen.tsx:922`) |
| "Earned" context cards | **HARDCODED** | `HomeScreen.tsx:86-87` `TASK_LINE` / `JUMPBACK_LINE` (money-adjacent — must be server-computed) |
| Home suggestions | **STATIC** | `HomeScreen.tsx:104` `PHRASE_SETS`, `:127` `USUALS` |
| All Spaces content | **STATIC** | `mobile/app/src/screens/spaces/verticals.ts` (534 lines: scores, viewer counts, streaks) — no instrumentation |
| Interests personalization | **CLIENT-ONLY** | `mobile/app/src/lib/interests.ts` — reorders static pools from a device-local pick |
| Personalization into the LLM | **UNWIRED** | `/api/chat` accepts `userProfile` but `useConversation.ts:55` never sends it |
| Swiggy partner card | **SERVER STUB** | `server.js:226` real MCP call; client `client.ts:102` stubbed ("V2") |
| Persistence / accounts | **DEVICE-LOCAL ONLY** | AsyncStorage flags in `mobile/app/src/lib/{onboarding,preferences}.ts`; **no user DB, no auth** |
| Forced new-user replay | **DEMO** | `HomeScreen.tsx` mount effect resets all flags every launch (`setShowPrefs(true)` at `:334`); defeats the persistence that already exists |

**Demo-only surfaces to delete in a real build:** the `DemoSheet` (Menu gear), long-press
stage cycling on the greeting, tap-the-Jio-logo `replayOnboarding` (`HomeScreen.tsx:363`),
and the forced-replay mount effect.

---

## 5. Reusable assets (carry across any stack)

These are stack-independent and worth keeping.

### 5a. Backend API contracts (`server.js`, verified vs `mobile/app/src/api/client.ts` + `types.ts`)

All POST, `Content-Type: application/json`, keys live server-side only.

**`POST /api/chat`** — `model: claude-sonnet-4-20250514`, `max_tokens: 1024`, `system: buildSystemPrompt(userProfile)`
```jsonc
// request
{ "messages": [{ "role": "user"|"assistant", "content": "..." }], "userProfile": { } /* optional, freeform */ }
// response
{ "text": "assistant reply" }
```

**`POST /api/tts`** — Sarvam `bulbul:v3`; Devanagari→`hi-IN` else `en-IN`; default speaker `priya`
```jsonc
// request
{ "text": "...", "speaker": "priya"?, "language_code": "hi-IN"|"en-IN"? }
// response: binary audio/mpeg (mp3 bytes)
```

**`POST /api/stt`** — Sarvam `saarika:v2.5`; base64 WAV in (server 2 MB JSON limit → short clips)
```jsonc
// request
{ "audio": "<base64 wav>", "language_code": "unknown"? }
// response
{ "transcript": "...", "language_code": "hi-IN" }
```

**`POST /api/partner/swiggy-menu`** — Anthropic (`claude-opus-4-7`) + Swiggy Food MCP connector
(beta header `mcp-client-2025-11-20`). Returns a `CatalogDiscoveryView`-shaped JSON (schema in
`server.js:145`). 503 fixture-fallback if `SWIGGY_MCP_TOKEN` unset. **Demo only.**

Client timeout: 20 s (`mobile/app/src/config.ts:22`). TTS is best-effort — the app shows text
if audio fails (`useConversation.ts:62`).

### 5b. Other assets
- **Brand system prompt** — `shared/system-prompt.js` (`buildSystemPrompt`). The behavioural
  contract for the assistant; pair with the `jbiq-voice` skill / playbook.
- **Design tokens** — `tokens/jds.tokens.json` (source) → `tokens/tokens.ts` (generated via
  `node tokens/build-tokens.mjs`).
- **Two palettes exist** — the Figma-screen `fig` palette (`mobile/app/src/theme/figma.ts`,
  brand indigo `#3900ad`) vs the generated JDS tokens. Reconcile to JDS in the rebuild.

---

## 6. Design source of truth

- **Figma file "Updates":** `https://www.figma.com/design/9ga4YwXtMytEt3msABrE21/Updates`
- **Screen → node map** (open in Figma Dev Mode):

  | Screen / element | Node |
  |---|---|
  | Home | `129:1989` |
  | Saathi (voice) | `152:6323` |
  | Contextual banner (with AgentPulse avatar) | `137:6398` |
  | AgentPulse mark (4 dots) | `172:2256` |
  | Composer — typing variation | `172:2515` |
  | Tab strip (Spaces) | `169:4507` |
  | Interests picker | built to match the intro style (no dedicated node) |

- **Tokens:** `tokens/jds.tokens.json`. Fonts: JioType. Icons: JDS glyphs
  (`mobile/app/src/theme/jdsIcons.ts`) + MaterialCommunityIcons where JDS lacked one.

---

## 7. Screen inventory

| Screen | Purpose | Real/Demo | Key files |
|---|---|---|---|
| **Home** | Greeting, suggestion chips (swipe-cycled), context banner, composer; pager to Menu + Spaces | Shell real; content + identity + engagement all demo | `mobile/app/src/screens/home/HomeScreen.tsx` |
| **Interests picker** | First-run topic selection → reorders Home suggestions | Real UI; client-only personalization | `mobile/app/src/components/InterestsIntro.tsx`, `mobile/app/src/lib/interests.ts` |
| **Saathi (voice)** | The conversation: mic → STT → chat → TTS, transcript, thinking states | **Real from turn 2**; turn 1 is the scripted scene | `mobile/app/src/screens/saathi/{SaathiScreen,useConversation,useFirstRunScene}.tsx` |
| **Spaces** (Astrology, Devotion, Health, Career, Friend, News) | Per-vertical widgets/cards; tapping a card hands a prompt to Saathi | Static content; the handoff-to-Saathi is real | `mobile/app/src/screens/spaces/verticals.ts` + `HomeScreen` `VerticalBoard` |
| **Menu** | Nav + recents + the demo settings gear | Static; `DemoSheet` is demo-only | `HomeScreen.tsx` (`DemoSheet`, `NAV`, `RECENTS`) |
| **Composer** | Bottom "Ask anything" bar; mic ↔ send crossfade on typing | Real | `mobile/app/src/components/Composer.tsx` |

---

## 8. Known infra debt (fix in the rebuild)

- **Secrets drift:** `render.yaml` declares a dead `ELEVENLABS_API_KEY` and **omits the
  required `SARVAM_API_KEY`** (and optional `SWIGGY_MCP_TOKEN`) — voice fails on Render unless
  set manually in the dashboard. Reconcile it.
- **Stale duplicate config:** untracked root `app.json` / `eas.json` (`com.anonymous.jbiq-app-v2`)
  shadow the real `mobile/app` config — delete to avoid confusion.
- **No quality gates:** no tests, no lint, no CI, no `tsc` script. `tsconfig.json` is `strict`
  but nothing runs it. Add `tsc --noEmit` + ESLint + a test runner + a CI job.
- **Manual web pipeline:** the web build is produced by hand (`expo export` → copy `dist/*` to
  root `app/` → commit). Script it or host it properly instead of committing build output.
- **Fragile native deps:** `patch-package` applies `mobile/app/patches/expo-modules-jsi+56.0.7.patch`
  on `postinstall`; a bump of Expo 56 / RN 0.85 / React 19 will likely break it.
- **Cross-project coupling:** `mobile/app` imports repo-root `tokens/` via Metro `watchFolders` —
  the Expo project isn't independently movable.
- **Ephemeral writes:** `/api/playbook-content` writes JSON to Render's ephemeral disk (playbook
  copy edits are lost on redeploy) — not app-critical, but note it.

---

## 9. Existing docs — read these, don't re-derive

| Doc | Read it for |
|---|---|
| `IOS-APP-BUILD-PLAN.md` | The original app build spec: decisions, 8-phase plan, explicit "out of scope for V1" (Android, auth, push, analytics…) |
| `docs/home-spaces-engagement-v1.md` | **The engagement/trust model** — `rendered = min(CLM stage, device trust)`, DPDP shared-device rules; the backlog behind §4/§10 |
| `docs/home-spaces-nav-v1.md` | The four Home states + one-track nav model `HomeScreen` implements |
| `INTERESTS-ONBOARDING-BUILD-PLAN.md` | The interests-picker feature spec (confirms the every-launch replay is intentional) |
| `docs/response-pattern-model.md`, `response-pattern-audit-v1.md` | Assistant response anatomy |
| `jbiq-voice` skill / voice-playbook pages | **Canonical voice & copy authority** — 10 conversation principles, response four-beat, 12+ Indian languages at parity, sensitive-moment handling |

---

## 10. "Make it real" backlog (prioritized)

Each epic: **Prototype state → What production needs → Dependencies/risks.**

1. **Identity & accounts (foundational)**
   - *Now:* `USER_NAME='Arjun'` (`HomeScreen.tsx:64`); only device-local AsyncStorage flags; no auth.
   - *Need:* JioID/auth; a server-side user profile; API auth on `server.js`. Wire `userProfile`
     into `/api/chat` (accepted but never sent — `useConversation.ts:55`).
   - *Risk:* everything personal (name, streaks, "usuals", recents) is blocked on this.

2. **Consumer Lifecycle (CLM) engagement signal**
   - *Now:* `Stage`/`DEMO_STAGES` simulated client-side (`HomeScreen.tsx:69,73`).
   - *Need:* Home must **consume** the CLM stage from the Consumer Lifecycle pod, never compute it;
     enforce `min(stage, trust)` (`docs/home-spaces-engagement-v1.md`).

3. **Device trust & DPDP 2025**
   - *Now:* `TRUST_SIMULATED=true` (`HomeScreen.tsx:82`) — always trusted.
   - *Need:* real device/identity-continuity signal that **defaults DOWN**; shared-device family
     handling; "not me" / switch-profile affordance; DPDP-compliant data handling.

4. **Content & personalization service**
   - *Now:* `PHRASE_SETS`/`USUALS` (`HomeScreen.tsx:104,127`), `verticals.ts` (534 static lines),
     client-only `interests.ts`.
   - *Need:* CMS/API-driven Home + Spaces content; per-vertical instrumentation (completed-task
     counters) to drive real depth/streaks.

5. **Kill the dead-ends / real onboarding**
   - *Now:* Home tapped prompts hit `sendPrototype` (spins forever — `useConversation.ts:155`);
     first-run is a scripted scene with pre-recorded MP3s (`useFirstRunScene.ts`).
   - *Need:* every entry point reaches the real assistant; a real (not canned) onboarding.

6. **Voice hardening**
   - *Now:* single-shot STT→chat→TTS; English/Hindi auto-detect; best-effort TTS.
   - *Need:* latency budget, barge-in/interruption, 12+ Indian languages at parity, robust
     failure UX; **server-computed** transactional lines (`TASK_LINE`/`JUMPBACK_LINE` are
     money-adjacent — never hardcode).

7. **Partner ecosystem**
   - *Now:* Swiggy is a server-side MCP demo (`server.js:226`), no client UI.
   - *Need:* real partner client rendering the `CatalogDiscoveryView` schema; a partner framework
     for more integrations.

8. **Backend for production**
   - *Need:* auth on the API, secrets management, rate limiting, observability/tracing; reconcile
     `render.yaml`; stop committing the web build; decide Express-vs-Worker as the canonical backend.

9. **Quality & compliance**
   - *Need:* `tsc`/ESLint/tests in CI; analytics & success metrics; DPDP data-handling review;
     sensitive-moment handling per the `jbiq-voice` playbook.

---

*Questions on the prototype → the current maintainer (Matt). Questions on voice/copy → the
`jbiq-voice` playbook. Questions on the engagement model → `docs/home-spaces-engagement-v1.md`.*
