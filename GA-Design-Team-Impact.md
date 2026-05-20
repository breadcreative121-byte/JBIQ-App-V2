# GA — What Will Impact the Design Team
*An experience-design read of the four GA documents. May 2026.*

This is the design-lens companion to GA-Reference-Summary.md. It focuses on the load these commitments place on design, the new surfaces and patterns being asked for, where design owns the gate, and the structural tensions worth flagging early.

---

## 1. The shape of the design ask
Design at GA is being asked to deliver **three things simultaneously** that have historically been hard to do at the same time:

1. **A foundational core experience** that 100M+ users in 12+ languages can navigate without English literacy in under 3 minutes.
2. **Fifteen signature vertical experiences** — each structurally unreplicable, each measured on its own D7 organic return — across Astrology, Devotion, Entertainment, News, Jobs/Careers.
3. **A scalable production model** — Vertical Lift's 7-day cycle from validated use case to live, plus the Partner Portal moving from advisory to hard-gate. Design must produce reusable primitives, not bespoke flows.

The headline tension: **breadth vs. quality** is no longer optional — both must be delivered together. The design operating model has to change to enable that.

---

## 2. New surfaces and patterns design owns or co-owns

### Voice-first system patterns (with Voice & Multimodal + Core Experience)
- TTS prosody tuning **per content type** — devotional, news, coaching, transactional — across 12+ languages.
- Barge-in, turn-taking, listening-state visualisation (the "is it listening to me?" problem).
- Latency-as-design — every loading state, hold pattern, and partial-result behaviour matters because the orchestration latency ceiling is voice p50 ≤2.5s simple → ≤15s multi-skill.
- Rich UX card support paired with voice — when the visual layer arrives, how does it relate to what's being said.

### Multimodal capture
- Bills, medicine labels, invoices, IDs — capture flows, framing guides, low-light/blur handling, confirmation UX for "we read it as X — is that right?" especially in a low-literacy context.

### Onboarding & cold start
- Context-aware onboarding with **zero unnecessary screens** (JioID infers language, time, location at launch). Design has to defend every screen against the 3-minute, 80%+ completion bar.
- Day-0 warm start — what does the home screen look like for a user the product already knows ~10 attributes about?
- Full zero-English audit across navigation, prompts, errors in every production language. This is a deliverable, not a polish pass.

### The home screen as a discovery engine
- 50%+ of users must engage with 2+ signature experiences in week one **organically**. The home has to do this work — vertical PMs cannot push their way into discovery.
- Dynamic ranking surfaced visually — design owns how personalised re-ranking is communicated without feeling manipulative.

### Lifecycle-aware home
- The Core Experience home maps to **6 lifecycle states** (New, Activated, Engaged, Retained, At-Risk, Returning). Each state has defined content behaviour. Design owns the state-by-state composition, not just one home design.

### Memory UI
- Users can view, edit, and delete any memory. Deletes propagate across surfaces in 24h, zero resurfacing. This is a trust surface — its design is part of the DPDP story, not an afterthought.

### Cross-surface coherence
- Preferences set on one surface (chat, push, WhatsApp) propagate everywhere in 24h for 99%+ of users. Design has to define what "the same product" looks like across in-app, push, WhatsApp share-cards, fact-check verdicts, etc.

### Signature experiences (15 of them) — non-trivial design briefs each
- **Grand Kundali Reveal** — explicitly described as a "cinematic voice-first walkthrough". That's a new pattern, not a chat thread.
- **Live Darshan + Devotional Feed + Sacred Calendar** — daily-rhythm content surfaces with shareable WA cards.
- **Cricket Match Companion** — second-screen experience overlaid on live JioHotstar matches, multilingual voice commentary, friend-group leaderboards, WA shares.
- **AI Jockey + AI Anchor Daily Brief** — persona-driven audio experiences with memory-aware behaviour.
- **Multimodal Fact Checker** — text + image OCR + voice note, four-tier verdict, sourced, sharable in 8s. Design challenge: how a verdict card communicates confidence and sourcing in a single shareable artefact.
- **Diagnostic-first coaching** in Jobs/Careers — a shared session-opening primitive across microlearning, English, interview, exam prep.
- **English Learning AI avatar** — real-time pronunciation/tone feedback with cross-session memory. Avatar UX, feedback visualisation, error recovery.
- **Interview Prep mock studios + morning-of kit** — company-specific, pressure-drill mode.

### Partner Portal
- Sandbox, playground with execution-detail panel, multi-state portal home, governance enforcement UI, automated skill-degradation alerts. A separate audience (partners, not consumers) with its own design system needs.

### Notification + WA orchestration
- Automated notification orchestration replaces manual config at GA. Design owns the message inventory across push / WhatsApp / in-app, the consolidated intervention calendar logic (to prevent over-messaging), and the share-back artefacts (cricket cards, fact-check verdicts).

---

## 3. Where design owns the gate

Pre-launch validation is hardening into an explicit gate, and design is on both sides of it:

- **UXR validation ≥2 weeks before ship for 90%+ of signature experiences and core changes.** Design teams cannot finalise close to ship without leaving time for this. Calendars have to change.
- **100% of signature experiences validated against the quality bar before GA go-live.** Design partners with Quality on what "good" means per vertical, and signs off go/no-go.
- **Beta-exit obligation:** personas, archetypes, and day-in-life adopted across product and design. Design needs to formally absorb these into the design system (component variants for cohort/state, persona-driven scenarios in the design language).

---

## 4. Cross-functional dependencies that hit design hardest

| Dependency | What it means for design |
|---|---|
| **GrowthBook live** + 10% global holdout | Design briefs should include hypothesis + variant strategy. Components need experiment-friendly composition. |
| **Vertical Lift agentic build pipeline** | Design must produce reusable primitives (intent sets, evaluation harnesses, build scaffolding) — not bespoke screens. If primitives don't exist, agents can't run, and the 7-day cycle collapses. |
| **i18n across Tamil/Telugu/Gujarati/Kannada + the rest of 12** | Design system needs language-aware typography, density, line-height; pseudo-language coverage in components; RTL is not relevant but script-mix is. |
| **JioID native SDK integration** | Identity-driven personalisation surfaces at first paint — design has to handle pre-/post-identity states and the gradient between them. |
| **Memory + Personalization signals at <50ms P95** | Design can rely on personalised content being there on first paint — but must also design the "thin profile" fallback for users with <3 sessions. |
| **Guardrails fail-closed on hard blocks** | Error and refusal patterns are first-class — they're going to fire, and they have to land softly across languages without leaking policy detail. |
| **6 lifecycle states from CLM** | Home composition rules per state — design owns the visual + content mapping. |

---

## 5. Structural tensions to surface early

1. **Velocity vs validation.** A 7-day use-case-to-live cycle in Vertical Experiences clashes with UXR validation ≥2 weeks before ship for 90% of signature experiences. The reconciliation is likely that the *first* version of a signature experience gets full UXR pre-ship, and subsequent iterations run through the lifecycle/experimentation loop with lighter validation. This needs to be explicit, not implicit.

2. **Breadth vs consistency.** 15 signature experiences across 5 verticals, each "structurally unreplicable", means each will want bespoke craft. Without strong shared primitives, design fragments and the brand erodes. Vertical Lift is the lever — design must invest in primitives early.

3. **Voice-first vs visual-rich.** TTS prosody, barge-in, latency-driven holds are voice problems. Rich cards, Grand Kundali Reveal cinematic walkthroughs, dynamic home re-ranking are visual problems. The same product must do both natively; the interaction model between them isn't yet a defined pattern.

4. **Bharat accessibility vs feature richness.** 90%+ tier-2/3 usability pass with zero English dependency is a serious floor. Every signature experience has to meet it — including the ones (interview prep, English learning, fact-check sourcing) where English content is inherent.

5. **Trust UI vs frictionless UX.** Memory view/edit/delete, DPDP consent, irreversible-action consent, sourced verdicts — all visible by requirement. Design has to make these feel like a feature, not a tax.

6. **Pre-loaded personalisation vs perceived creepiness.** Day-0 warm start with 70%+ of new users having a populated profile (name, language, 3+ ecosystem attributes) is a structural advantage — and a trust risk if surfaced clumsily. The first session has to feel known without feeling watched.

7. **Partner-built experiences in the same surface.** Once 2+ net new signature experiences/month are shipping autonomously or by partners, design's role shifts from author of each surface to guardian of the system that lets others build inside it. That's a different team posture.

---

## 6. What the design team likely needs to staff against

Reading across the docs, the design org will need depth in:

- **Voice + multimodal interaction design** (system patterns, not per-experience).
- **Design system + i18n at scale** — components that hold across 12+ languages and 6 lifecycle states.
- **Vertical experience design** — at least one design lead per active vertical, with shared primitives discipline.
- **Partner Portal / B2B product design** — distinct surface, distinct user.
- **Content design + UX writing** in all production languages, including the WA share-card system.
- **Design ops for the Vertical Lift pipeline** — primitive curation, agentic-build evaluation, golden-pattern maintenance.
- **Research partnership** — embedded with UXR for the pre-ship validation rhythm, not consuming it downstream.

---

## 7. Open questions to take to leadership

- Who owns the **voice interaction model** at the system level — is that Core Experience, or a horizontal craft lead?
- How does design fit into Vertical Lift? Are designers authoring the primitives that agents instantiate, reviewing agent output, or both?
- What's the design SLA against the 7-day cycle? When does design enter, exit, and re-enter the loop?
- For the 6 lifecycle home states, who composes the per-state content — Core Experience designers, CLM, or vertical PMs surfacing into a state grammar?
- Where does the Partner Portal sit in the design org — under platform craft or experiences craft?
- What does the design system need to ship at Beta exit to make GA achievable?

---
*End of impact note.*
