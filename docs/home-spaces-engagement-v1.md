# JBIQ — Engagement-adaptive Home + Spaces (v1 plan)

How the Home page and the six Spaces should change as a user's **engagement** grows over time — the build-out of the open question in [home-spaces-nav-v1.md](home-spaces-nav-v1.md) §6.4 ("personalisation of Space order / contents… needs the Personalization signal"). Synthesised from a four-agent panel (product-strategist, product-designer, researcher, QA), each grounded in the existing docs + current code.

Companion to: [home-spaces-nav-v1.md](home-spaces-nav-v1.md) (the 4 session states + nav), [homepage-concepts-v1.md](homepage-concepts-v1.md) (the "Bolo Aise + gated Kal Khatam" chassis and its §9 QA guardrails). This plan sits **on top of** that chassis — it never replaces it.

---

## 0. The one rule that governs everything

> **Rendered engagement level = min( account's real lifetime stage, this session's device-trust confidence ).**

Every *earned* element below — a streak badge, a "jump back in" line, a saved-Kundali reference, a denser phrase list — is **personal data**, exactly like the name and the Context Line already are. It inherits the same freshness + device-trust gate from nav-doc §2 and concepts-doc §9. A genuine 60-day power user who hands the phone to a cousin on an untrusted session sees the **Cold** rendering — not a downgraded-but-still-personal middle state. Ambiguity always resolves **down** (less density, less claim, more teaching), never up.

This is the single non-negotiable, and all four agents converged on it independently.

---

## 1. Two axes, never one number

A user is not one engagement score. Two independent axes, each feeding a different surface:

| Axis | Answers | Drives | Owner |
|---|---|---|---|
| **App-level stage** | "How experienced is this person with JBIQ overall?" | Home's density + which verticals get cross-surfacing | **Consumed** from the Consumer Lifecycle pod (see §2) |
| **Per-vertical depth** | "How deep is this person into *this one* Space?" | Each Space's hero choice, action order, what unlocks | Home/Spaces-local signal (**does not exist yet** — build ask) |

The two are frequently different and **must not be averaged**: a Day-3 app user can be *Invested in Astrology* (gave their rashi, checked it 3 days running) while still *Activated* app-wide. Home never assumes vertical depth; a Space never assumes app tenure. They cross-reference in exactly one place — the Home "jump back in" slot (§5) and a vertical's re-entry framing (§6).

These two axes are **orthogonal to** the existing 4 session states (`new-cold` / `new-warm` / `return-task` / `return-moment`), which answer "what's fresh *today*." Stage answers "how rich should the rest of the screen be around that fresh thing." A Power user can open in a plain `new-warm` session and still get a denser, more personal phrase list than a Cold user in the same session state.

---

## 2. Do not build a rival ladder — map onto what exists

`JBIQ-Reference-Memory.md` documents a **Consumer Lifecycle pod** (lead: Ayush Prashant) that already owns a **6-state taxonomy for Beta** — New / Activated / Engaged / Retained / At-Risk / Returning — with D1/D3/D7 nudges, a CleverTap sync, and a 10% holdout. Personalization's GA goal is explicitly "better at session 10 vs 1."

**Home consumes that stage; it never computes it.** This is the same posture the concepts doc §10 already takes for device-trust ("the homepage can only *consume* a trust signal, not generate one"). A client-side heuristic on `AsyncStorage` session counts (what the current prototype does) cannot see account-level recency, device↔JioID linkage, or reactivation — and two systems computing "power user" independently will disagree, which is itself a trust break.

**Canonical mapping** (the rendering buckets below map onto CLM states — confirm with the pod before hardcoding):

| CLM state | Rendering bucket used in this doc |
|---|---|
| New | **Cold** (no trust) / **Warm** (JioID name+lang+city) |
| Activated | **Activated** |
| Engaged | **Habitual** |
| Retained | **Power** |
| At-Risk / Returning | **Dormant → Reactivation** |

Per-vertical depth (`New → Casual → Regular → Invested`, + vertical-dormant) is **not** owned by CLM and **is not instrumented anywhere today** — `verticals.ts` is fully static, there is no per-vertical completed-task counter. This is a genuine build ask on Personalization / Data & Analytics, flagged now rather than assumed.

---

## 3. Signal layer — safe vs landmine

**Safe / local** (client may consume or compute; cosmetic use ok): windowed session count (last 30d, **never lifetime**), active-day spread (habit strength — better than raw count), per-vertical visit recency + count, completed-task events per vertical, voice-vs-tap ratio (a literacy/T3 proxy without asking), session language, time-of-day *only to pick content type*, phrase-chip engagement, device tier (perf only), and — strongest of all — an explicit "not me" / switch-profile action.

**Landmine** (never use to place a *specific person* on the ladder): passive voice-print / speaker-ID (violates "mic always user-initiated"), any name/personal fact keyed to **device** rather than an authenticated session (← the current prototype's live bug, see §9), cross-surface history surfaced without an explicit connect-consent, life-stage/gender/age inferred from vertical mix, un-decayed lifetime counts, and **anything targeting a likely-minor holder** — DPDP Rules 2025 (notified 13 Nov 2025, full enforcement 14 May 2027) explicitly prohibit behavioural monitoring / targeted content on children's data, and Jio devices are frequently family-shared. *(No explicit shared-device provision was found in the Rules text — a gap for platform/legal to confirm, not assume clean.)*

**Ownership rule:** anything gating a money-adjacent claim (a Context Line) must be **server-computed**; purely cosmetic bits (which phrase set leads) may be client-side.

---

## 4. Guardrails — the non-negotiables (extend concepts-doc §9)

§9 governs *content correctness*; these govern *the fact that the layout itself changes*. Ranked, all must hold before any engagement-based layout ships:

1. **Session-pinned resolution.** Stage/depth resolved **once per app-foreground, before mount**, pinned for the life of the visible screen. A fresher value is staged and applied only on the next cold mount — never live-swapped under a mounted screen. (Prevents a reflow turning a "Baad mein" tap into a "confirm" tap.)
2. **Identity-gated, not device-gated.** The trust gate governs **layout density and interest signals**, not just names/amounts — a Power-tier layout without a fresh trust signal is itself a disclosure. Fixes the current device-boolean leak.
3. **Monotonic-down-on-uncertainty + asymmetric hysteresis.** Demotion needs a materially stronger/longer signal than promotion did (no flapping at boundaries). A dormancy threshold forces a reduced tier on reactivation regardless of cached history.
4. **Invariant interaction grammar.** Tap-equals-speak, mic-bar position, and control *types* never change across stages — only content density/selection does. (A first-timer who just learned "tap a phrase = say it" must never lose that mechanic on graduation.)
5. **Invariant layout skeleton per surface.** Home = greeting → ≤1 earned card → capped phrase list. Space = context line → one hero → a few actions → disclaimer. The skeleton's dimensions are fixed across stages; depth changes *what fills the slots*, never the structure — this is what stops a Power Home drifting back into the newsfeed the redesign exists to kill. **Density grows by *swap*, never by *append*.**
6. **Zero-network first paint across all 7 pager pages.** Stage/depth resolved from cache before *any* page mounts; a fresher server value hot-swaps content in place afterward but never delays first paint. (`verticals.ts` renders synchronously today — must not regress.)
7. **Accessibility transition contract.** Any structural change announces itself (WCAG 4.1.3), keeps shared elements (mic bar, greeting) at a stable reading-order position, and renders as an **instant cut** — never an animated reflow — under a screen reader or Reduce Motion.

---

## 5. Rendering — Home across the ladder

Chassis discipline at every stage: no scroll, phrase list capped, **at most one earned card** above the list (never two stacked). Slot-1 priority when several compete: **transactional Context Line > habit "jump back in" > moment banner > generic phrase.** Only one wins; the rest silently don't render this session.

| Stage | Greeting | Slot-1 card | Phrase list | Earned element |
|---|---|---|---|---|
| **Cold** (no trust / shared) | "Namaste" — no name | never | fixed, pillar-diverse teaching set (today's `PHRASE_SETS`) | none |
| **Warm** (JioID name) | "Namaste, Arjun" | never (no history yet) | same fixed diverse set | none |
| **Activated** | name | **first-ever** Context Line fires here if a real signal exists — one-time explanatory eyebrow *"Because you're on Jio"* instead of *"For you"* | last-used pillar bumps toward slot 1; rest stays diverse | — (graduation #1) |
| **Habitual** | name | Context Line if fresh; else the **jump-back-in** card wins (habit-derived, reuses `ContextLineCard` verbatim: *"🔥 Aaj ka rashifal — 5 din se. Aaj bhi sunoge?"* / *Haan* · *Baad mein*) | Set 1 = "your usuals" (top asks reworded as sentences); Set 2 stays a **discovery** set (keeps teaching even habitual users); Set 3 moment-led | jump-back-in card (graduation #2) |
| **Power** | name | same slot, richer: pattern-aware ("your usual" *sequence* — rashifal then upay) | Set 1 = usuals across *multiple* verticals; Sets 2–3 unchanged in structure | same slot, cross-vertical aware — **no new chassis element** (Power is a content ceiling, not more chrome) |
| **Dormant → Reactivation** | name, **warm not cold** (identity isn't in question, freshness is) | never resume the old task silently — **full re-verify**; else a soft re-orientation line (*"Kaafi din baad! …"*) | render at **Activated density for one session**, re-escalate next open if engagement resumes | suppress any stale streak claim |

---

## 6. Rendering — worked vertical: Astrology (per-vertical depth)

Astrology is the cleanest worked example: a streakable daily habit (rashifal), a saved item (Meri Kundali), and a *causally* gated unlock (Grand Kundali Reveal literally needs birth data the user hasn't given at New depth). `verticals.ts` changes from a static `blocks` array to `blocks(depth) => SpaceBlock[]`.

- **New** (0 sessions): context line teaches, no personal claim — *"Yahan apni rashi ka haal jaano"* (cannot say "Mesh" before the user has told JBIQ their rashi). Hero = a "pick your rashi" teaching CTA. Grand Kundali Reveal = `ActionCard` in a **`locked`** state with a *stated reason* ("Rashi batane ke baad unlock hoga"), never a dead teaser. Disclaimer prominent.
- **Casual** (rashi declared, no Kundali, no streak): context line becomes today's shipped *"Aaj ka rashifal ready — Mesh."* Meri Kundali reframed as a **setup CTA** ("Banao apni Kundali · 2 min · unlocks deeper readings"). Reveal still `locked` but softly promoted.
- **Regular** (streak ≥3d or Kundali exists): hero eyebrow gains the earned streak — *"Aaj ka Rashifal · 🔥 5 din se"* (pure string into `HeroCard`'s existing `eyebrow` prop). Meri Kundali moves under the hero and flips to a **reference** ("your saved chart"). Grand Kundali Reveal **unlocks fully** — gated causally on the Kundali existing, not a timer.
- **Invested** (streak ≥14d, Reveal done, multi-feature): the label itself personalises — *"Your daily ritual"* replaces the generic hero title; a capped Moon-sign/Nakshatra mini-row appears **while low-value teaching copy retires to make room** (swap, not append). Disclaimer drops to footer weight.
- **Vertical-dormant** (≥7d gap in Astrology specifically — shorter than the app-level window; a narrow habit decays faster): *"Streak thoda ruk gaya — aaj se phir shuru karein?"* — non-punitive, no broken-flame/red/loss framing. Renders at Regular density for one session (the saved Kundali is a stored fact, not a decaying habit), re-escalates if they return.

Component reuse (Lens C answered): **no new top-level component.** `PhraseRow` gains an optional `badge?` (streak/"continue" pill); `ActionCard`'s `soon?` generalises to `state?: 'soon' | 'locked'` (same dimmed visual); `HeroCard` and `ContextLineCard` unchanged (richer strings only); `verticals.ts` `blocks` becomes depth-parameterised. New local persistence (`getEngagementStage`, `getVerticalDepth(id)`, streak counters) extends the existing `onboarding.ts` pattern.

---

## 7. Graduation & de-escalation — shared spec

**Graduation (crossing up):** detected at **session start only** (never mid-session). The changed element gets a one-time soft accent-tint that fades ~600ms on first paint (instant end-state under Reduce Motion), plus an optional one-line **dismiss-anywhere toast** *below* it on first appearance — never a modal, badge, confetti, or milestone shelf. Persisted "seen" flag like `getSpacesIntroSeen`. The element is already resolved on paint — never shown "unlocking."

**De-escalation (dormancy):** quiet — no animation, no toast. Step down **exactly one notch, never to Cold**. Copy neutral-to-warm, never guilt-driven. Any transactional claim fully re-verifies.

**Streaks are informational, not punitive** — no loss-aversion, no broken-streak shaming. This is a *deliberate* divergence from the Duolingo norm, on JBIQ-DNA grounds (not a gamified habit app; on a shared device a "broken streak" may just be someone else's session). Log it as a considered call, not a gap.

---

## 8. Resolved decisions (where the panel disagreed)

- **Tab order stays FIXED across all stages.** The strategist argued for usage-ranked tab order at Habitual/Power (dominant vertical → position 1). The designer + QA argued against: on the single continuous scroll-snap pager, reordering the compass breaks muscle memory, disorients returning users, and (QA) a per-vertical density mismatch already risks a visible "un-collapse" mid-swipe. **Resolution:** keep the compass fixed; achieve the strategist's actual goal — surfacing the dominant vertical and cross-sell — through **Home content** (the jump-back-in card + cross-vertical "usuals" in the phrase list) and **within-Space depth**, not nav reordering. Revisit only if an A/B shows a strong need. This also answers nav-doc §6.4.
- **Rich-get-richer / filter bubble:** even where usage informs Home content, reserve one "something new" slot so the Power cohort still samples net-new signature experiences (protects the GA "2+ new experiences/month" goal).
- **Two-axis kill criterion (strategist):** the per-vertical axis is real engineering cost. If an A/B shows per-vertical-depth rendering doesn't beat simple recency-ranked content + app-level-only personalisation (on D7 vertical retention / "2+ domains in 30 days"), collapse to single-axis. Don't build the expensive model on faith.

---

## 9. Build sequence

**Immediate (not blocked, do regardless of the ladder):** the current `onboarded` flag is a **device-scoped boolean** — any household member inheriting a phone gets the prior user's `new-warm` / `return-task` rendering ("Namaste, Arjun" + recharge nudge) with zero identity check. This is the exact shared-device leak QA'd out in concepts-doc §9, live today. Gate the personal rendering behind a (for now simulated) trust flag and treat "trusted" as the ceiling.

**Prototype now (demo-signal-driven, production-honest):** extend the existing long-press demo-cycle (which already toggles the 4 session states) to also cycle **engagement stage** and, on a Space, **per-vertical depth** — rendering §5 and §6 from simulated signals. This makes the whole model pitchable and testable without the backend, exactly as the current 4-state demo does. Ship behind the same local-only demo affordance.

**Backend-blocked (escalate, then build):** real CLM stage exposure to the client (latency? device- or JioID-scoped?); per-vertical depth instrumentation (new signal store + counters); the device-trust/identity-continuity signal (still the top open question from concepts-doc §10). Server-compute anything gating a money-adjacent claim.

**Validation (researcher's plan):** scenario-based usability test, T2 (Lucknow/Indore) + T3, Hindi + one regional language, on test devices with **planted histories** so ground truth is controlled: (1) true power user on own device, (2) **first-timer on a borrowed "power" device** — the core misclassification test, watch for unprompted *"yeh mera nahi hai"*, (3) reactivation after a seeded 60–90d gap. Metrics tie to GA goals (session-1 completion, organic daily return proxy, zero-English pass across *all* stages not just the cold one) plus a new **misclassification rate** target (e.g. <5% in scenario 2) set jointly with CLM + QA. If adaptive *reduces* first-timer completion vs the static chassis, that's stop-ship, not a tuning note.

---

## 10. Open questions to escalate (not answerable from the codebase)

1. Does the CLM 6-state signal reach the client today — at what latency, device- or JioID-scoped? (Ask alongside the device-trust question from concepts-doc §10 — same shape.)
2. What reactivation/decay window does CLM already use for At-Risk → Returning? Don't let Home/Spaces invent a number.
3. Does DPDP counsel have a position on shared-device behavioural inference specifically (children's data is explicit; shared-device isn't)?
4. Is a "not me" / switch-profile affordance on the roadmap? It's the cheapest, highest-confidence de-risking mechanism — prioritise it ahead of more inference.

---

*Method: product-strategist (stage model + two-axis framing) → product-designer (per-stage Home + Astrology layouts, component reuse) → researcher (Bharat signal taxonomy, DPDP, validation plan) → qa (adaptive-layout edge-case hardening). Disagreements resolved in §8, not averaged. External references the agents drew on are cited in their briefs (Co-Star/Nebula saved-chart pattern, Headspace Today-view, Duolingo streak — diverged from; CleverTap RFM/CLM; DPDP Rules 2025).*
