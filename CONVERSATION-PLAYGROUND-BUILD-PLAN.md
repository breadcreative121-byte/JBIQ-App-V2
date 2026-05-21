# Conversation Playground — full 14-chapter build-out plan

**Target surface:** `http://localhost:3000/conversation-playground.html#<id>`
**Goal:** every chapter of the JBIQ Voice Playbook represented by at least one working specimen, paired with the correct component primitive(s) and annotated against the chapter rules.

The current playground has 13 specimens covering Ch. 1–3 plus a thin slice of 6, 9, 12. Specimens render only one attachment type (`receipt`). To carry all 14 chapters we extend the data model and add specimens across the verticals JBIQ ships — Care, Pay, Mart, Cinema, Fiber, Cricket, Health, Devotion, Jobs, Govt, Fact Checker, AI Anchor, Kundali.

---

## 1. What the playground needs structurally before we add content

The existing `SPECIMENS` array holds five fields that map to the right rail (`eyebrow`, `title`, `principles[]`, `avoid`) and a `transcript[]` whose only attachment shape is `receipt`. To carry the 14 chapters we extend the data model — additive only, no breaking changes to existing specimens.

### New specimen fields

| Field | Purpose | Source chapter |
|---|---|---|
| `chapter` | Numeric chapter tag (1–14). Drives a new "by chapter" picker view. | All |
| `intentShape` | Informational · Single-Path · Multi-Option · Stateful · Proactive. Badge on the right rail. | Ch. 4 §3 |
| `commitmentLevel` | None · Soft · Hard-functional · Hard-financial. Badge. | Ch. 8 §3 |
| `autonomyLevel` | 0–4. Badge. | Ch. 7 §8 |
| `surface` | `chat` (default) · `voice` · `voice+ui` · `cinematic` · `speaker` · `ivr`. | Ch. 5, Ch. 10 |
| `language` | `en` · `hinglish` · `hi` · `ta` · `te` · `bn` · `mr` · `bho` etc. | Ch. 6 |
| `senseMode` | `routine` · `sensitive`. Drives the inversion in styling. | Ch. 12 |
| `vertical` | Care · Pay · Mart · Cinema · Fiber · Cricket · Health · Devotion · Jobs · Govt · Fact-Checker · AI-Anchor · Kundali. | Ch. 11 |
| `dna` | Five-point object: `humanFirst`, `simplest`, `acted`, `respected`, `soundsLikeJio` — each a one-line note. | DNA check |
| `voiceBeats` | `{ outcome, anchor, shape, pivot }` — present when `surface` includes voice. Rendered in a "voice four-beat" right-rail panel. | Ch. 5 §2 |
| `density` | `{ words, attributes, items }` — for voice surfaces. Renders against the ≤40 / ≤3 / 1 ceilings. | Ch. 5 §3 |
| `cinematicArc` | `{ persona, pace, recapAt, microPivotAt, length }` — for cinematic specimens. | Ch. 5 §12 |
| `partner` | `{ name, badge, attributionLine, whyThis }` — for partner-fulfilled. | Ch. 11 §3, §10 |
| `manifestPrimitive` | One of the 8 canonical primitives. Badge + link to the primitive component below. | Ch. 11 §5 |
| `resolutionStrategy` | Single-Best · Merged · Stratified · Choice-Gated · Sequential-Fallback. Badge. | Ch. 11 §7 |
| `memoryUsed` | List of surfaced inferences with confidence tier. Drives a "what JBIQ inferred" panel. | Ch. 7 §3 |
| `consent` | DPDP / mandate / domain-consent flag + which surface. | Ch. 8 §11 |
| `auth` | `low` · `medium` · `high` · `critical`. Badge. | Ch. 8 §5 |
| `reversibilityWindow` | seconds; renders the undo affordance. | Ch. 8 §6 |
| `failClass` | `ASR-uncertainty` · `partner-timeout` · `payment-decline` · `connection-loss` · `dont-know` · `soft-no` · `guardrail` · `compliance-fail`. | Ch. 9 §4–12 |
| `metric` | One line: which Ch. 14 acceptance criterion this specimen demonstrates. | Ch. 14 |
| `crossModal` | `{ voiceAnchor, screenAnchor, handoffLine }`. Drives a "anchors match" check. | Ch. 10 §5 |

### New attachment types (Slot 2 — Primary Result renderers)

The playbook says output is always one of eight canonical primitives (Ch. 11 §5). We map each to a renderer using components.css primitives already in the repo. The current `receipt` covers two of these. Seven new ones:

| Manifest primitive | Renderer (component) | Used by |
|---|---|---|
| **DiscoveryView** | `.collection.collection--carousel` of `.catalog-card` or `.place-card` | Mart, Cinema, Restaurants, Doctors |
| **ComparisonView** | `.compare-table` (already styled — never used in playground) | Pricing across partners |
| **SlotPickerView** | new — date/time tile grid using `.filter-chip` shape | Apollo consult slots, JioCare callback |
| **CommitmentSummaryView** | `.confirm` block (already styled) | Bill pay, plan switch, cart commit |
| **TrackingView** | `.tracker` + `.timeline` | Order live status, recharge status |
| **DetailView** | `.detail-sheet` (or inline variant) | Doctor profile, flight detail |
| **ListView** | `.collection.collection--list` of `.catalog-card` | Government schemes, plan catalogue |
| **StatusView** | `.validator-banner` | "OTP sent", "Mandate live" |
| **Receipt** *(JBIQ-specific extension)* | `.receipt` *(already supported)* | Post-confirm receipt — the "home" line |

### New right-rail panels

- **Intent + anatomy** — shape · slot map · what fills Slot 1–4.
- **Voice four-beat** — Outcome / Anchor / Shape / Pivot in four numbered cells. Hidden when surface is chat-only.
- **Density gauge** — words / attributes / items, each against its ceiling. Green if under; red if over.
- **DNA check** — five rows, each ✓ or revise.
- **Commitment + auth** — level · auth floor · reversibility window · Compliance Ledger.
- **Memory used** — surfaced inferences with confidence, plus "what stayed silent".
- **Partner & ranking** — partner badge, attribution line, "Why this result?" plain-language line, resolution strategy.
- **Sensitive inversion** — dropped (emoji, exclamation, cross-product, "We dream big") and elevated (emotion beat, restraint, escalation).
- **Forbidden hits** — runs the chapter-13 regex set on the reply and shows any hits (always 0 for a passing specimen).
- **Metric** — the Ch. 14 acceptance criterion the specimen is evidence for.

### Picker — second axis

Add a toggle above the picker: **By moment** (current grouping) ↔ **By chapter** (1–14). Same specimens, two ways in. URL hash carries the active axis: `#ch04-kurta-multi-option` versus `#kurta-multi-option`.

---

## 2. Chapter-by-chapter specimen set

Every chapter gets at least one canonical specimen and, where the chapter splits into modes (Ch. 4's five intent shapes, Ch. 8's four commitment levels, Ch. 12's five sensitive sub-types), one specimen per mode. Each is paired with the component(s) it should render in.

### Ch. 1 — Identity & voice DNA

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **Locked terminology vs the old script** | Care | `.tension` (good / bad side-by-side) | "JioCare → My activity" vs "ticket log"; "JioID" vs "account number"; "confirm" vs "submit". Right rail: locked-terminology table. |
| **Voice DNA blind test** | Mart | `.tension` | Same reply written by JBIQ vs a generic AI; ≥85% blind-attribution criterion (Ch. 14). |
| **Emoji policy in action** | Cricket | `.catalog-card` w/ 🏏 vs sensitive version below it | Allowed-emoji vocabulary surfaced; second card shows the inversion (no emoji) under a "moves into sensitive mode" badge. |

### Ch. 2 — The ten principles

Keep the existing `greeting`, `routine-recharge`, `plan-switch`, `cross-product`, `payment-failed`, `dont-know`, `angry-user`, `saying-no` — re-tag with `chapter: 2` and add the new `principle` tag per turn. Add:

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **The DNA check on a routine reply** | Pay | Inline transcript + `dna` panel | Five-row pre-send check, ✓ on each. |

### Ch. 3 — Reply rhythm

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **Four-beat call-out** | Fiber | transcript with beat markers | Emotion · Action · Next step · Home — each beat annotated in the right rail. |
| **Opening / closing repair** | Pay | `.tension` | Replaces "Sure! Great question!" and "Anything else?" with on-brand alternatives. |
| **Lists vs prose decision** | Health | two side-by-side specimens | Same reply as prose (2 items) vs list (3+ items); chip rule when chips would do better. |

### Ch. 4 — Response anatomy — one specimen per intent shape

The single most important chapter to render fully — five intent shapes, four anatomy slots, the chip rule.

| Specimen | Intent shape | Vertical | Component(s) | Notes |
|---|---|---|---|---|
| **"Kal Mumbai mein kitna garam?"** | Informational | Care | inline prose + edge affordance | Slot 1 optional; no card. |
| **"Pay my Adani bill"** | Single-Path | Pay | `.confirm` (CommitmentSummaryView) + `.cta-row` | Slot 1 required: amount, due date. Slot 4: Set reminder. |
| **"Kurtas for Diwali under ₹2,000"** | Multi-Option | Mart | `.subject-header` + `.collection--carousel` of `.catalog-card` + `.filter-chip-bar` + `.edge-affordance` (See more) | Three cards (English) plus a Hinglish render (Ch. 6) — both anchored to the same Fabindia card. |
| **"What's in my HDFC?"** | Stateful Query | Pay | `.info-list` styled live state + edge: Pay now | Live-state foregrounded; updated-just-now marker. |
| **"Your Adani bill is due tomorrow"** | Proactive-Triggered | Pay | `.confirm-prompt` + `.cta-row` ("Pay ₹1,243 · Remind me · Don't suggest again") | Edge: Remind / Don't suggest again. |
| **"Cold start — Diwali kurtas, no profile"** | Multi-Option (low conf) | Mart | `.collection` + `.chips-prompt` (clarification chip) | One clarification chip permitted because gender is high-impact and not inferable; results still render. |
| **Refinement: chips not questions** | Multi-Option | Mart | `.filter-chip-bar` | Side-by-side tension: "What size?" (bad) vs `[Under ₹1,500] [Silk] [Cotton] [More]` (good). |

### Ch. 5 — Voice disclosure & cinematic

| Specimen | Surface | Vertical | Component(s) | Notes |
|---|---|---|---|---|
| **Flight voice + UI handoff** | voice+ui | Pay/Travel | voice four-beat panel + `.collection` w/ anchor highlight | "Found 3 morning flights. Cheapest is 6:15 AM at ₹2,850. I've put them on screen…" Density gauge: 30 words / 3 attrs / 1 item — all green. |
| **Pure voice on speaker** | speaker | Care | voice four-beat panel only | No screen; outcome + anchor + pivot. |
| **Voice anti-patterns** | voice | Mart | `.tension` | "Option 1… Option 2…" / "You asked about flights…" / "and that's ₹2,850" — each repaired. |
| **Cinematic — Grand Kundali Reveal (90s opener)** | cinematic | Kundali | `.player` w/ scrubber + voice four-beat replaced by cinematic arc panel (persona / pace 130–150 wpm / recap at 60–90s / micro-pivot at 90–120s) | Hindi script per Ch. 5 §12. |
| **AI Anchor Daily Brief (60s)** | cinematic | AI-Anchor | `.player` + auto-scrolling transcript | News register, 150–170 wpm. |
| **Cricket Match Companion live commentary** | voice+ui | Cricket | `.player` + scoreboard `.info-list` | Voice anchors live state, screen carries score/over; cross-modal lag gauge < 1.5s. |

### Ch. 6 — Language & code-switching

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **Hinglish in, Hinglish out** *(kept from current set)* | Pay | inline | Script + register match. |
| **Tamil recharge** | Pay | `.confirm` | Same surface, Tamil copy + Tamil handoff phrase ("Screen-ல காட்டியிருக்கேன்"). |
| **Mid-sentence code-switch** | Mart | inline + `.collection` | User: "Bhai, show me silk wale kurtas, under 2000 rupees" → JBIQ replies in same Hinglish register, anchors silk Manyavar. |
| **Honest language gap** *(kept)* | Care | inline | Bhojpuri not yet supported; three real doors. |
| **Devanagari input → Devanagari reply** | Pay | `.confirm` | Hindi script match. |
| **Zero-English audit** | Mart | `.tension` | English fragment leakage in a Tamil reply, repaired. |

### Ch. 7 — Memory, confidence, autonomy

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **High-confidence Single-Path with inference surfaced** | Pay | `.confirm` + memory-used panel | Defaults silently to ₹299 + PhonePe UPI; both editable; no "I remember" prose. |
| **Memory contradicts state** | Pay | `.collection` | Old ₹299 plan cancelled; cards include "most similar to your previous"; state wins. |
| **Day-0 warm start vs surveillance** | Care | `.tension` | "Hi Rohit! I see you've been searching kurtas…" vs "Mumbai — Tuesday morning. Quick recharge?" |
| **Performative memory caught** | Mart | `.tension` | "I remember you love cotton!" vs default to cotton silently. |
| **Memory delete propagation** | Settings | `.detail-sheet` w/ propagation indicator | 24h cross-surface; deleted never resurfaces. |
| **Autonomy step-up offered, never assumed** | Pay | `.confirm` + edge affordance | After two manual recharges: "Set up auto-recharge? · Not now". |

### Ch. 8 — Commitment & security — one per level

| Specimen | Level | Vertical | Component(s) | Notes |
|---|---|---|---|---|
| **Informational state** | None | Care | inline prose | No commit. |
| **Save for later (Soft)** | Soft | Mart | `.edge-affordance` + undo toast | 60s undo window surfaced; no auth. |
| **Plan switch (Hard-functional)** | Hard-functional | Care | `.confirm` + Compliance Ledger panel | In-app confirm; reversibility 60s; ledger write before dispatch. |
| **Recharge ₹299 — UPI handoff (Hard-financial)** | Hard-financial | Pay | `.confirm` + voice four-beat + simulated UPI app deep-link | UPI PIN never in JBIQ; partner never sees PIN. |
| **OTP volunteered — refused warmly** *(kept)* | — | Pay | inline | No echo, no log; next safe step offered. |
| **Mandate setup (Critical)** | Critical | Pay | dedicated `.detail-sheet` mandate surface | Mandate cannot be entered conversationally; payee / cap / frequency / expiry / revocation. |
| **DPDP consent UI** | — | Health | `.connect-sheet` + `.permission-toggle-list` | Plain language; scope; revocation; "Why we ask"; never pre-checked. |
| **Compliance Ledger fail-closed** | Hard-financial | Pay | `.validator-banner` (error) | "I can't safely complete this right now — our audit log is offline." Nothing charged. |

### Ch. 9 — Failing well

| Specimen | Failure class | Vertical | Component(s) | Notes |
|---|---|---|---|---|
| **Three failed recharges → refund + retry** *(kept, re-tagged)* | payment-decline | Pay | inline + `.receipt` (refund) | Three-beat error language. |
| **ASR uncertainty on critical word** | ASR | Pay | voice four-beat + inline | "Recharge samajh aaya, lekin amount nahi — ₹299, ₹399, ya kuch aur?" |
| **Partner timeout — Sequential-Fallback** | partner-timeout | Mart/Food | `.collection` w/ "via Zomato / via MagicPin" attribution | "Swiggy's slow — pulled options from Zomato and MagicPin." |
| **Connection loss + recovery** | connection-loss | Pay | inline + `.validator-banner` "Back online" | Pending recharge frozen, not auto-executed. |
| **Mid-prompt phone-call interrupt** | long-prompt | Health | inline | "You were saying — 'looking for a paediatrician in Andheri tonight, my son has a temperature of —' Keep going, or start fresh?" |
| **"I don't know" with real ETA** *(kept)* | dont-know | Care | inline | "Within five minutes; you don't have to wait here." |
| **Soft no — security rule** *(kept as `saying-no`)* | soft-no | Care | inline | "That's a security rule we don't bend." |
| **Fail-closed guardrail refusal** | guardrail | Health | inline | Soft, in-language, no policy detail. "Was this wrong? Let JioCare know." |

### Ch. 10 — Multi-modal handoff

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **Voice + UI flight search** | Travel | voice four-beat + `.collection` w/ anchor card | Voice handoff phrase explicit; anchor matches screen. |
| **Voice → text mid-flow** | Mart | transcript w/ surface tag per turn | User pivots from voice to text; language carries; refinement carries. |
| **Voice + UI → voice-only (screen times out)** | Pay | inline + voice four-beat | "Realised the screen's off — three morning flights from earlier…" |
| **Cross-modal desync — detection + correction** | Pay | `.validator-banner` (warn) + re-render | "That came out a bit mixed up — re-rendering." |
| **Cross-device switch (speaker → phone)** | Cinema | `.tracker` continuation | "Continue from speaker" cue. |

### Ch. 11 — Partner ecosystem & Vertical Lift — one specimen per resolution strategy

| Specimen | Strategy | Vertical | Component(s) | Notes |
|---|---|---|---|---|
| **Single-Best translation** | Single-Best | Care | inline + attribution `[via Google Translate]` + "Why this?" | One result, one attribution. |
| **Merged restaurants near me** | Merged | Food | `.collection` w/ per-card "via Swiggy / via Zomato / via MagicPin" | Intermixed; per-item badge. |
| **Stratified iPhone 15 pricing** | Stratified | Mart | `.collection--list` w/ partner sections | Amazon · Flipkart · Croma each in their own labelled section. |
| **Choice-Gated cab booking** | Choice-Gated | Travel | `.collection--list` of `.catalog-card` w/ per-card CTA | Uber · Ola · BluSmart; "Why these?" plain-language line. |
| **Sequential-Fallback OTP gateway** | Sequential-Fallback | Pay | `.validator-banner` (StatusView "OTP sent") | Failed attempts not surfaced unless all fail. |
| **"Why this result?" surface** | — | Mart | `.detail-sheet` → "Manage memory" | Plain-language ranking explanation; per-domain preferences editable. |
| **Vertical Lift — Cricket Companion** | — | Cricket | `.player` + scoreboard + share-card primitive | 7-day cycle annotation: validated → primitives → agent → eval → live. |

### Ch. 12 — Sensitive moments — one per sub-type

| Specimen | Sub-type | Vertical | Component(s) | Notes |
|---|---|---|---|---|
| **Bereavement during a routine flow** *(kept)* | Bereavement | Mart/Fiber | inline | No emoji, no upsell; cart saved; auto-renewal pause offered; helpline as invitation. |
| **Financial stress mid-payment** | Financial stress | Pay | inline + `.validator-banner` (paused) | "Pausing the recharge. Nothing happens unless you say so." |
| **Anger over repeated failure** *(promoted from current `angry-user`)* | Anger | Pay | inline + `.receipt` (refund) | Acknowledge, refund, escalate. |
| **Distress with self-harm signal** | Distress | Care | inline + helpline card | Acknowledge; surface resources (never one option only); no safety-assessment questions; no method info. |
| **False-positive recovery** | FP recovery | Mart | inline | "My plan is dying" → "That sounds frustrating — what's not working?" → user: "No no, just slow" → "Got it — back to normal." |

### Ch. 13 — What JBIQ never does

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **Forbidden phrases — repair gallery** | Care | grid of `.tension` blocks | "Kindly do the needful" · "Greetings of the day" · "Is there anything else?" · "I'm just an AI" — each with the on-brand replacement. |
| **OTP volunteered — never echoed** *(kept as `otp-refusal`)* | Pay | inline | Refuse warmly; no echo. |
| **Caricature avoided** | Mart | `.tension` | "🙏 Namaste!" vs natural greeting. |
| **Forbidden-hit detector running live** | — | right-rail panel only | Regex set runs on every visible reply; specimens score 0. |

### Ch. 14 — Measurement

| Specimen | Vertical | Component(s) | What it demonstrates |
|---|---|---|---|
| **Acceptance criteria badges** | — | per-specimen badge | Each specimen surfaces *which* Ch. 14 metric it's evidence for ("Forbidden-phrase regex hits = 0", "Voice anchor matches UI = 99%", "Sensitive autonomy floor honoured = 100%"). |
| **Sample QA regression run** | — | `.timeline` | Visualises a QA regression sweep across the 14 chapters with pass / fail per gate. |
| **Per-domain CSAT dashboard placeholder** | — | `.info-list` | Stub for Ch. 14 §1's per-domain CSAT ≥ 80%. |

---

## 3. The vertical × chapter grid

A second view of the same specimens, so the demo also reads as "JBIQ across the verticals it ships in". The grid below is the picker's secondary axis (a third button: **By moment** · **By chapter** · **By vertical**).

| Vertical | Ch. 1 | Ch. 2 | Ch. 3 | Ch. 4 | Ch. 5 | Ch. 6 | Ch. 7 | Ch. 8 | Ch. 9 | Ch. 10 | Ch. 11 | Ch. 12 | Ch. 13 | Ch. 14 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **JioCare** | terminology | DNA check | beat call-out | informational | speaker | language gap | day-0 warm | plan switch | dont-know · soft no | screen times out | single-best | distress | forbidden gallery | regression run |
| **JioPay** | — | recharge · plan switch | opening / closing repair | single-path · stateful · proactive | flight voice+ui | Tamil recharge · Devanagari | high-conf · contradiction · autonomy step-up | recharge · OTP refusal · mandate · ledger fail-closed | ASR · connection loss · refund retry | desync detect | sequential fallback | financial stress · anger | OTP never echoed | acceptance badges |
| **JioMart** | — | cross-product | lists vs prose | multi-option · cold start · chip rule | — | code-switch · zero-English audit | performative memory caught | save for later | partner timeout | voice→text | merged · stratified · "Why this?" · vertical lift | bereavement · FP recovery | caricature | — |
| **JioCinema** | — | — | — | — | AI Anchor brief | — | — | — | — | speaker→phone | — | — | — | — |
| **JioFiber** | — | greeting · cross-product | beat call-out | — | — | — | — | — | — | — | — | bereavement | — | — |
| **Cricket** | emoji policy | — | — | — | live commentary | — | — | — | — | — | vertical lift | — | — | — |
| **Health** | — | — | lists vs prose | — | — | — | — | DPDP consent | mid-prompt interrupt · guardrail | — | — | — | — | — |
| **Devotion** | — | — | — | — | Live Darshan opener | — | — | per-domain consent | — | — | — | — | — | — |
| **Kundali** | — | — | — | — | Grand Kundali Reveal | — | — | — | — | cinematic sync | — | — | — | — |
| **Fact Checker** | — | — | — | — | verdict + sources | — | — | sourced verdicts | — | multimodal capture | — | — | unsourced claims caught | — |
| **AI Anchor** | — | — | — | — | daily brief | — | — | — | — | — | — | — | — | — |
| **Govt schemes** | — | — | — | — | — | — | — | — | dont-know | — | listview catalogue | — | — | — |
| **Jobs** | — | — | — | informational (placeholder) | — | — | — | — | — | — | — | — | — | — |

Empty cells are not gaps — they're opportunities for v2 if the demo lands.

---

## 4. Build phases

Five phases, each shippable on its own. Each phase ends with the playground in a demo-ready state.

### Phase 1 — Data model + picker (1 day)

- Extend `SPECIMENS` schema with the fields in §1 above; existing 13 specimens keep working (all new fields optional).
- Add the second picker axis: **By moment · By chapter · By vertical**. URL hash sticks the active view.
- Add chapter / intent-shape / commitment-level / autonomy / surface badges to the right rail under the existing eyebrow.
- DNA-check panel: five rows, ✓ / revise.

**Demo-ready milestone:** every existing specimen plus three new ones (one per chapter we haven't covered: Ch. 4 single-path, Ch. 8 mandate, Ch. 11 merged) — all annotated with new metadata.

### Phase 2 — Anatomy renderers (2–3 days)

Add attachment renderers for the seven primitives we don't yet support, each driven from an `attachment.type` extension. One specimen per renderer to lock the shape:

1. **DiscoveryView** → kurta multi-option (Mart, English + Hinglish).
2. **ComparisonView** → iPhone 15 pricing (Mart, stratified).
3. **SlotPickerView** → Apollo consult booking (Health).
4. **CommitmentSummaryView** → Adani bill pay (Pay, single-path).
5. **TrackingView** → JioMart order tracking (Mart).
6. **DetailView** → Doctor profile from Apollo (Health).
7. **ListView** → Govt-scheme catalogue (Govt).
8. **StatusView** → Mandate live (Pay, critical).

**Demo-ready milestone:** Ch. 4 fully demonstrable end-to-end across all five intent shapes.

### Phase 3 — Voice + cinematic (2 days)

Voice doesn't exist on the playground today. We don't need a TTS engine — we need the rendering pattern.

- New `surface: 'voice'` / `'voice+ui'` modes. Voice surfaces render a four-beat panel instead of a transcript, with each beat (Outcome · Anchor · Shape · Pivot) in its own cell.
- Density gauge — words / attrs / items each against the Ch. 5 §3 ceilings (green / amber / red).
- Voice+UI specimens render the four-beat panel **plus** a screen frame with the anchor card highlighted; cross-modal anchor-match check rendered as a small ✓ between the two.
- Cinematic specimens replace the four-beat with a cinematic arc panel — persona / pace / recap at / micro-pivot at / length. Use `.player` as the on-screen affordance.

**Demo-ready milestone:** Ch. 5 plus Ch. 10 specimens land. Grand Kundali Reveal opener, AI Anchor brief, Cricket Companion, flight voice+ui all sit on the picker.

### Phase 4 — Commit, security, memory, partner, sensitive (3 days)

The chapters with the most rules. These specimens are mostly inline transcript plus an annotated right-rail panel — the structural work in Phases 1–3 is what makes them cheap.

- Commitment + auth panel (Ch. 8): level · auth floor · reversibility · ledger ✓.
- Memory-used panel (Ch. 7): surfaced inferences with confidence tier · what stayed silent.
- Partner + ranking panel (Ch. 11): badge · attribution · "Why this?" · resolution strategy.
- Sensitive-inversion panel (Ch. 12): dropped · elevated · unchanged.
- Live forbidden-hit detector on every reply (Ch. 13) — runs the regex set client-side; specimens score 0; this is a visible promise.

**Demo-ready milestone:** all 14 chapters represented with at least one specimen each.

### Phase 5 — Vertical Lift demo loop (1 day)

A meta-specimen: a 7-day Vertical Lift timeline rendered on `.timeline`, ending in the Cricket Match Companion specimen from Phase 3. Lets the demo close on "this is how new signature experiences get built — and here's one we just built."

**Demo-ready milestone:** opening (Live mode try-it) · 14 chapter walkthroughs · Vertical Lift closing.

---

## 5. Live-mode upgrade

The current Live mode (`#try-live`) sends `messages[]` to `/api/chat` and renders the plain-text reply. To keep it on-brand the server's voice prompt should know about everything above — but the playground can also help:

1. **Pre-send DNA check on live replies.** Run the five-point check client-side on every assistant turn. Show ✓ rows in the right rail. A failure is visible.
2. **Live forbidden-hit detector.** Same regex set as Ch. 13. Every live reply scores 0 — or we see why not.
3. **Specimen seeds.** Each chapter specimen has a "Try this in Live →" button that pre-fills the input with the same user utterance and lets the user compare the canonical reply with what the live system produces.
4. **Intent-shape classifier (lightweight).** Tag every live reply with a guessed intent shape (Ch. 4 §3 classification order) and render the matching anatomy panel.

---

## 6. Annotation source of truth

Every specimen's `principles` / `dna` / `voiceBeats` / `density` / `memoryUsed` / `partner` fields are written by hand against the chapter reference. Two safeguards:

- A `references[]` field on each specimen pointing at the chapter section (e.g. `'ch04-response-anatomy.md#§3'`). The right rail renders this as a "Source: Ch. 4 §3" link. Drift between the specimen and the playbook becomes visible.
- A `lintSpecimen()` function run on page load: checks the reply text against Ch. 13 forbidden phrases; checks voice density against Ch. 5 §3; checks sensitive specimens for emoji / "We dream big" / cross-product nudge. Logs warnings to console — and shows a red badge on any specimen failing its own rules.

---

## 7. Acceptance — when is the demo done

Tie each specimen to the Ch. 14 acceptance criteria it provides evidence for. The picker shows a small "✓ 3/14" counter at the top once the user has clicked through every chapter — so the demo is also self-pacing.

Concretely the demo is done when:

- Every chapter has at least one specimen on the picker.
- Every canonical primitive (DiscoveryView · ComparisonView · SlotPickerView · CommitmentSummaryView · TrackingView · DetailView · ListView · StatusView) renders at least once.
- Every intent shape (5) renders at least once with the matching anatomy panel.
- Every commitment level (4) renders at least once with the auth panel.
- Every sensitive sub-type (5) renders at least once with the inversion panel.
- Every resolution strategy (5) renders at least once with the partner panel.
- Voice four-beat renders at least once with density-gauge green.
- Cinematic arc renders at least once.
- Cross-modal anchor-match ✓ renders at least once.
- Forbidden-hit detector runs on every specimen and reports 0.
- Live-mode replies are also run through DNA check + forbidden detector.

---

## 8. Suggested build order, day by day

| Day | Chapters added | What ships |
|---|---|---|
| 1 | Data model · picker axes · DNA panel | Existing 13 specimens enriched with badges + DNA. |
| 2 | Ch. 4 (all five shapes) | DiscoveryView · CommitmentSummaryView attachment renderers. |
| 3 | Ch. 4 cont. · Ch. 8 | SlotPickerView · TrackingView · StatusView · `.confirm` flows · commit/auth panel. |
| 4 | Ch. 5 · Ch. 10 | Voice four-beat panel · density gauge · voice+ui anchor match · cinematic arc panel. |
| 5 | Ch. 11 | Per-resolution-strategy specimens · partner panel · "Why this?" detail-sheet. |
| 6 | Ch. 6 · Ch. 7 · Ch. 12 | Tamil / Hindi / Hinglish parity · memory-used panel · sensitive inversion panel. |
| 7 | Ch. 13 · Ch. 14 · Vertical Lift closer · Live mode lint | Forbidden-hit detector live · acceptance badges · 7-day Vertical Lift timeline · DNA + lint on `/api/chat` replies. |

Total: 7 working days to a demo-ready surface that walks anyone — exec, partner, new hire — through the entire 14-chapter system on a single URL.

---

## 9. Open questions to lock before Phase 2

A short list of decisions to settle before the attachment renderers land — these affect schema choices and so are cheap now, painful later.

1. **Voice fidelity.** Render the voice four-beat as text-only panels, or wire in a real TTS sample per language? (Voice playbook says TTS MOS ≥ 4.0; the playground can either stop at the four-beat panel or commit to a clip-per-specimen.)
2. **Live partner integrations.** Do we want any specimens to actually call a partner sandbox (Swiggy, Apollo, IRCTC), or is everything fixture-driven for the demo?
3. **Live forbidden-hit detector — server- or client-side?** Client is simpler and visible; server matches production.
4. **Per-language coverage breadth.** Ship English + Hinglish + Hindi + Tamil for Phase 6, or stop at English + Hinglish and label "12+ languages at parity" as a Ch. 6 panel claim?
5. **Vertical Lift specimen — fully agent-built, or scripted?** Either is honest; the scripted version ships in a day, the agent-built version takes a sprint and is the more useful demo.

Once these are answered, Phases 1–7 fall out cleanly.
