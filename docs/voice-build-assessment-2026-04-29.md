# JBIQ — Voice-build assessment

**Date:** 29 April 2026
**Scope:** the voice build at /Users/mattjarvis/JBIQ-App-V2 — `discovery.js`, `index.html`, `server.js`, `discovery.css`, `place-playground.html`, `voice-assistant-research.html`, `docs/`
**Compared against:** `JBIQ-Voice-Plan-v2.docx`, `JBIQ_Gap_Analysis.docx`, `docs/voice-first-use-cases.md`, `docs/build-plan-2026-04-24.md`, `docs/response-pattern-model.md`, `docs/response-pattern-audit-v1.md`
**Lens:** the six product-team agents in `.claude/agents/` — researcher, product-strategist, product-designer, frontend-engineer, backend-engineer, qa.

---

## Headline

The voice build is **directionally aligned** with the post-Round-1 voice plan. All eleven discovery use cases are wired up, both informational responses exist, the §14 commitment gate is enforced, and the §15 four-beat voice disclosure is implemented end-to-end. Where the build falls short is **not** in the use-case set — it's in the layer beneath it: refinement is dead, language detection is hard-coded, post-processing of model output is missing, and the broader voice-UX gaps surfaced in the prior Gap Analysis (barge-in, repair dialog, multi-user, offline) are still open.

If "voice build" means "the spine demoable for Round 2", you're in good shape. If "voice build" means "the voice product ready to face 1M users in May", there is a meaningful gap list.

---

## Discovery use cases vs the four-pillar direction

The plan narrows JBIQ to four transactional pillars: **Government & civic, Local Services, Recharge & Bills, Order & Buy.** Eleven use cases are specified (5 primary + 6 supporting). Implementation status:

| # | Use case | Pillar | Pattern | Status |
|---|---|---|---|---|
| 4.1 | PM-Kisan disbursal | Gov & civic | Informational | Implemented (`INFO_PM_KISAN_STATUS`, matcher 4068) |
| 4.2 | Plumber booking (Andheri + Indore) | Local services | Place + booking intent | Implemented (`MOCK_PLUMBERS`, `MOCK_PLUMBERS_INDORE`, booking intents) |
| 4.3a | Mobile recharge — comparison | Recharge & Bills | Compare | Implemented (`MOCK_RECHARGE_299`) |
| 4.3b | Mobile recharge — single-plan | Recharge & Bills | Catalog | Implemented (`MOCK_RECHARGE_299_SINGLE`, price-matched regex above generic) |
| 4.4 | Pediatrician at 2 a.m. | Local services | Place | Implemented (`MOCK_PEDIATRICIANS_OPEN_NOW`, specific regex above generic doctor) |
| 4.5 | Cooking gas refill | Recharge & Bills | Catalog | Implemented (`MOCK_GAS_REFILL`, Tamil future-string parked) |
| 5.1 | Ration card status | Gov & civic | Informational | Implemented (`INFO_RATION_STATUS`) |
| 5.2 | Scholarship lookup | Gov & civic | Compare | Implemented (`MOCK_SCHOLARSHIPS_12TH_SC`) |
| 5.3 | Maths tutor for Class 10 | Local services | Place | Implemented (`MOCK_TUTORS_MATHS_CLASS10`) |
| 5.4 | Diwali blouse tailoring | Local services | Place | Implemented (`MOCK_TAILORS_DIWALI`) |
| 5.5 | Kirana reorder | Order & Buy | Catalog → Confirm & Pay | Implemented (`MOCK_KIRANA_REORDER`) |
| 5.6 | Milk subscription edit | Order & Buy | Catalog → Confirm & Pay | Implemented (`MOCK_MILK_SUBSCRIPTION_EDIT`) |

**Verdict on alignment:** strong. All four pillars are represented in the matcher table and on the prototype panel. Specificity ordering (pediatrician above generic doctor; price-matched recharge above generic recharge; Indore plumber above generic plumber) is correct. The new "Informational" pattern was implemented as the plan asked, not faked as a 1-card DiscoveryView. The system prompt in `server.js` names the four pillars and reinforces the on-screen-tap rule.

**Where alignment is weak:**

- **Pre-pillar mocks still sit in the matcher.** `flights`, `phones_20k`, `home_loans`, `health_insurance`, `emi_fridge`, `train`, `apartments`, `school`, `biryani`, `kurta_diwali`, `gifts_wedding`, `movies_weekend`, `devotional_morning`, `courses_datascience`, `ipl` — all still routable. None of these is a pillar use case under Path A. Some plausibly become **Order & Buy** (kurta, gifts, phones), some become research probes (movies, devotional), and some are pre-Path-A residue (flights, trains, home loans). The plan does not say "delete these" — but it also does not say "keep them as primary surfaces." Decide whether they're demoable B-tier or noise that's diluting the Round 2 message.
- **The pillar-grouping in the burger Prototypes panel.** The use-case spec asked for the four new groups ("Government", "Local Services", "Recharge & Bills", "Order & Buy") to be added if needed. Worth checking that pillars are visible as panel groups, not just regex destinations, so testers actually launch them by category.

---

## The six agents weigh in

### Researcher (Indian market + voice products)

**What works.** The Hinglish voice disclosures across the eleven mocks read as code-mixed user utterances, not translated English. "Aapki agli PM Kisan kisht" + "Bank of Baroda account mein aa jayegi" + "alert lagaayein jab paisa aa jaaye" is the kind of phrasing a Yavatmal farmer would actually understand. Personas (Ramesh, Asha, Sayed, Priya, Kavita) are scoped to specific T2/T3 cities, not a generic "Bharat" caricature, and they map cleanly onto the use cases. The §14 on-screen-tap rule is the right call for trust-building with first-time digital-payments users.

**Gaps that block Round 2.**

1. **No live language detection.** Every mock is hand-authored in one or two languages. The system prompt says "match the user's language exactly" — that places the burden entirely on Claude's response, not on routing. A user who says *"Cylinder book pannanum, indha vaaram delivery venum"* (the Tamil case explicitly out-of-scope per the spec) will hit `MOCK_GAS_REFILL` if the regex catches "cylinder", but the spoken voice disclosure will be Hinglish. The Tamil string is parked in `voice_disclosure_tamil_future` and never read. That's fine if Track B is Hinglish-only. If Track B will probe regional language, the gap needs flagging on the moderator's run-sheet so participants are not asked to use a language the build cannot answer in.
2. **Repair dialog is undesigned.** The build plan and the response-pattern model both invest heavily in the happy-path voice disclosure. Neither covers what happens when ASR misfires, when the user trails off, when there's ambient noise, or when the user says something off-pillar. In a T2/T3 voice product this **is** the product. Round 2 will almost certainly catch this.
3. **Shared-device / family context is invisible.** Asha sharing her husband's phone, Sayed handing the phone to his nephew — the build has no "who is this for?" affordance, no profile picker, no quiet handover state. The Gap Analysis flagged this; the voice build did not pick it up.
4. **In-situ assumptions baked in.** Pediatrician-at-2am presumes a quiet bedroom; gas-refill presumes a kitchen with the phone on the counter. There's no thinking about the noisy shop counter (Sayed) or the open courtyard (Ramesh) — both real Track B contexts.

**Round 2 implication:** the script that actually probes the eleven use cases must include at least one ASR-stress case and one cross-language case per session, and the team must agree in advance whether the moderator intervenes when the build fails the repair dialog or whether the failure is the data point.

---

### Product strategist (India + voice strategy)

**What works.** Path A is alive in the matcher table. The on-screen-tap rule is real, not aspirational — voice "haan" demonstrably does not trigger payment. The four-pillar narrowing reads as a defensible wedge: Government schemes + Local services + Recharge & bills + Daily essentials is a *narrow defensible first move*, not a generalist play. Kill criteria from the plan ("if Round 2 shows no transactional completion, abandon Path A") are testable with the use cases as built.

**Strategic gaps.**

1. **The wedge is in code; the moat is not.** The eleven use cases are demoable, but every backend is mocked. The plan says this is fine for Round 2 — but the *structural* differentiation only emerges when JBIQ has a privileged signal (Aadhaar-linked balance, Bank of Baroda account, JustDial verified plumber, Indane connection on file) that competitors do not. Right now the demo says "imagine if we had this data". A counter-positioning argument requires saying *which data, from which Reliance asset, under what consent flow* — and that thread is not surfaced in the voice build at all. A T1 user will not be able to tell from the prototype whether this is "Google Assistant with a Hindi voice" or "Jio's privileged AI saathi". That is a strategic gap, not just an engineering gap.
2. **Off-pillar mocks dilute the demo.** Eleven on-pillar use cases plus another fifteen off-pillar ones (flights, trains, IPL, biryani, kurta, etc.) make the prototype panel look like a generalist app, not a four-pillar wedge. For Round 2, the panel should default-collapse off-pillar entries or label them clearly as "Track B falsification probes". Otherwise the user testing data will be polluted by users wandering into IPL when the strategic question is whether they would pay a gas bill by voice.
3. **Confirm & Pay is enforced; the L3 auto-execute story is absent.** The plan and the master deck describe an L3 auto-execute level ("Bill paid — undo?"). The build correctly does not implement it. But the Gap Analysis already flagged the contradiction between "never auto-executes" (p8) and "auto-execute — bill paid — undo?" (p44). The voice build is taking the conservative side of that contradiction without anyone resolving the strategic question. That is fine for May 2026, but it means the L3 narrative cannot be demoed, which has commercial consequences if the deck is used for partner conversations.
4. **No competitive frame in the build.** A user asked to compare the JBIQ recharge flow with Google Assistant's recharge flow has no obvious answer. The build needs a one-line strategic differentiator that can be spoken in the voice disclosure when it lands ("Jio plan, Aadhaar-linked, no app switch") — this is a positioning task as much as a product task.

**Kill criterion to commit to before Round 2:** if fewer than 60% of Track A participants complete an irreversible transaction (recharge, gas, kirana, milk) under the on-screen-tap model, the §14 contract has lost the trust battle and either the contract or the surface needs rethinking.

---

### Product designer (UX + design system)

**What works.** Five-state thinking is partially in place — DiscoveryView has loading-equivalent states (`PARTIAL_RESULT_SHOWN`), informational responses have a body-text shape that is not a card-collection hack, edge affordances vary by use case (`see_more`, `compare`, `save_later`, `remind_later`, `context_shift`) which is the right palette. `stripVoicePivot` is exactly the kind of small, principled helper that earns its keep — it makes the four-beat work in both modalities without the designer having to author two strings.

**UX gaps.**

1. **The chip refinement is theatre.** The chips render with `result_count` parens and a selected style, but the delegated handler is `console.log` only. From a designer's POV this is the worst kind of lie — the affordance promises filtering, the user taps, nothing visibly updates, the perceived intelligence collapses. Per the response-pattern model §8, refinement is a core rule, not a polish item. This is the most user-visible defect in the build.
2. **Card cap correction.** The 2026-04-21 audit (`response-pattern-audit-v1.md`) flagged `MOCK_KURTA_DIWALI` as having 6 cards. **Verified today: it has 5 cards** (fabindia_silk_kurta, manyavar_dhoti_set, biba_anarkali, soch_palazzo, jaipur_kurta). The audit finding is stale. Worth re-running the validator (`discovery.js` already has a `cards.length > 5` check at ~249–250) across all 22 mocks to confirm none has drifted, but P0-2 from the audit doc is no longer correct.
3. **Empty / error / no-permission states for voice are absent.** Microphone denied, no network, ASR returns nothing, the user says something off-pillar — none of these have designed surfaces in the prototype. The Gap Analysis flagged "voice UX specifics (wake-word, barge-in, silence timeout, listen/think/speak cues, latency budget)" as a HIGH-severity gap. Six months on it's still open in this build.
4. **Booking tracker and receipt download are stubs.** `openBookingTracker` `console.log`s and routes back to chat. The receipt branch is openly marked stub. Either ship the minimal version or hide the affordances; do not leave them as dead links.
5. **Tone of voice in pivot beat is inconsistent across mocks.** Most pivot beats are imperative-soft ("On screen — tap one"). The recharge-single beat is "On screen — Confirm & Pay tap karein" (imperative-direct, English verb). The gas-refill beat is the same shape. The pediatrician beat is a question ("Apollo ko abhi call karein?"). It is not necessarily wrong to vary, but the inconsistency reads as authorship drift, not designed difference. Worth a tone-of-voice pass with a specific rule: *interrogative when offering, imperative when committing*.
6. **Hinglish microcopy is not on a tone matrix.** "Aapki agli PM Kisan kisht ₹2,000 hai" (formal-respectful) coexists with "Aapki kirana cart" (casual-informal). For T2 testing both register as fine; in T3 the formality variation may be read as the assistant being inconsistent about the user's social register. Worth an explicit register decision per pillar.

---

### Frontend engineer

**What works.** The matcher table is `index.html`-resident, ordered, and inspectable. `stripVoicePivot` is a pure function. `matchesVoiceConfirmPhrase` rejects bare "yes" and "haan" — only commit phrases like "confirm", "pay now", "place order" trigger the warning. The voice-confirm interception is symmetric on both the chat-text path (line 4803–4828) and the speech-recognition path (line 5470–5475), which is the kind of small thing that prevents nasty regressions later. The five-state DiscoveryView render path is consistent across all 22 mocks.

**Engineering gaps.**

1. **Single-file scale risk.** `index.html` is 214KB and `discovery.js` is 162KB. The chat handler around line 4234 is doing a lot — informational match, discovery match, restaurant match, shopping match, advisory fixture, booking intent — in a sequential cascade. Adding the next pillar use case will be cheap; adding the *twelfth* matcher type (a new pattern alongside Discovery, Informational, Booking) will be expensive. Time to pull the chat handler into a small module before it ossifies.
2. **The dead chip handler.** Worth fixing now and not at the end of Round 2, because once participants tap a chip and nothing changes, the data is contaminated. Either: (a) implement a lightweight client-side filter that hides cards whose `filter_ids` don't include the active chip set, or (b) remove the chip render entirely until refinement is real. Half-implemented is the worst option. (Plan ticket C2.)
3. **No language detection on the routing layer.** Hinglish mocks are *authored*, not *selected*. If the user types "₹299 ka recharge karo" the matcher fires correctly. If they type "Recharge for 299" the same matcher fires (good) but voice disclosure is in Hinglish (mismatch). Trivial fix: detect Devanagari characters in the input string (or detect Indic transliteration via a small word-list) and route to a `voice_disclosure_en` or `voice_disclosure_hin` field, defaulting to the existing string. Plan ticket C4.
4. **No post-processing sweep on Claude responses.** The system prompt prohibits openers like "Sure!", "Great question!", and closers like "Anything else?". The audit (P2-1) recommended a regex sweep on the model output before rendering. Without it, the prompt is best-effort. Cheap to add: a `sanitizeAssistantText(s)` function that strips a known-bad opener from the first line and a known-bad closer from the last line, with a console warning so violations surface in dev.
5. **Tamil future-string is dead code.** `voice_disclosure_tamil_future` on `MOCK_GAS_REFILL` is not read by any code path. Either (a) implement a `pickVoiceDisclosure(view, lang)` helper that reads `voice_disclosure_<lang>` if present, or (b) delete the field. Schrödinger's localisation is worse than no localisation.
6. **Performance budget for voice is unstated.** The TTS path round-trips to ElevenLabs (server.js:84). On a T3 user's 4G, that's ~600–1200ms before the first audio plays. The build has no perceived-latency affordance — no earcon ack, no "thinking" state on the avatar (the `avatar-thinking.mp4` exists but I haven't traced where it triggers). Worth a profiling pass with throttled network on a low-end device before Round 2.

---

### Backend engineer

**What works.** The `/api/chat` endpoint is small, the system prompt is colocated with the route, and the prompt is defensibly derived from `docs/response-pattern-model.md`. The TTS endpoint has a clear separation. The on-screen-tap rule is reinforced in the model prompt (line 53), so even if the matcher misses, the model is steered toward the safer answer.

**Backend gaps.**

1. **No persistence.** Sessions are not saved. Voice disclosures and Confirm & Pay events vanish on reload. The Gap Analysis flagged this as out-of-scope for the prototype, which is fair — but Round 2 sessions need at least client-side capture of (utterance → matched view → completion) tuples for analysis. Suggest a lightweight `localStorage`-backed event log (or the IndexedDB equivalent) gated behind a "research mode" flag. Bonus: gives moderators a session timeline they can hand back to the participant.
2. **Mock data is on the client.** `MOCK_*` lives in `discovery.js` and ships to every browser. For Round 2 that's perfectly fine. For the moment after Round 2 — when the team wants to A/B different content for Hindi vs Marathi vs urban vs rural — the mocks need to move server-side, behind a per-session context. Worth a small refactor so the matcher returns a *view key* and the server resolves the body. Doesn't have to ship before Round 2; should be on the post-Round-2 list.
3. **No auth, no DPDP scaffolding, no consent UX.** The Gap Analysis listed DPDP compliance, L3 RBI posture, partner economics, memory transparency as HIGH-severity. The voice build does not pretend to address any of these — and per the spec, it shouldn't. But for the voice plan to graduate from prototype to product, *every* irreversible action needs a real consent log, not a voice "haan". The current build is a hard contract on the *interaction* (on-screen tap) but a soft contract on the *data trail* (no record of consent). Do not ship to actual users until that asymmetry is resolved.
4. **No observability on the model output.** When Claude returns a closing question or a banned opener, there's no metric, no log, no alert. Add structured logging on every `/api/chat` response with the first-30-chars-of-output, first-line, last-line, and a flag for any prohibited-pattern match. This pairs with the post-processing sweep on the frontend.
5. **No rate limit on `/api/tts`.** ElevenLabs is metered. A misbehaving client (or an attacker) can run up the bill quickly. Add a per-IP rate limit before any wider preview.

---

### QA

**Risk assessment.** Build is **demoable for Round 2 with caveats**. Build is **not ready for any external user-facing release** — that bar is set by the open Gap Analysis items, not by the use-case implementation status.

**P0 — must fix before Round 2.**

1. **Chip handler is a stub.** Either implement filtering or remove the chips. Half-state will contaminate research data and the participant's confidence in the system.
2. **Booking tracker stub** and **receipt download stub** must be hidden from the demo path or replaced with a polite "coming next round" surface. Dead affordances destroy demo trust faster than missing features.
3. **Off-pillar mocks need a clear secondary tier in the prototype panel** (or be hidden behind a "research probes" toggle) so participants don't drift into IPL/movies and sap session time.
4. **Re-validate card counts across all 22 mocks** with the existing `cards.length > 5` validator. The audit's KURTA finding is stale (5 cards verified today), but worth confirming none of the others has drifted.

**P1 — fix before any external preview.**

5. **Voice repair dialog undesigned.** "Sorry, I didn't catch that" + retry behaviour does not exist. The product cannot face real users until it does.
6. **Language detection.** Hinglish disclosure on a Tamil utterance is a worse experience than English-only.
7. **Post-processing sweep on Claude output.** Prompt-only enforcement leaks under load.
8. **No persistence / event log for the research session.** Round 2 will surface failure modes that the team will want to replay.

**P2 — pre-GA.**

9. The full Gap Analysis HIGH list — DPDP, RBI L3, partner economics, memory transparency, multi-user, offline UX, accessibility WCAG, performance budgets.

**Test plan to run before Round 2 sign-off (one-day exploratory pass per pillar):**

- 10 utterances per use case (3 English, 4 Hinglish, 3 Indic transliteration) — does the matcher fire and the right view render?
- For each Confirm & Pay flow: voice "haan", voice "yes", voice "confirm and pay" — only the explicit phrase triggers the warning, none triggers commit.
- For each DiscoveryView: tap each chip, tap each sort option — note what changes and what doesn't (chips will all "fail" until C2 is shipped).
- For both informational responses: render in voice mode and text mode, verify pivot beat is spoken in voice and stripped in text.
- In Chrome on a throttled-Slow-3G profile, measure time-to-first-audio for the gas-refill flow. Set a budget; fail if > 1500ms.
- Microphone-denied state in Chrome — what does the user see? (Likely nothing helpful right now — log the bug.)
- Network-down state during a voice query — what does the user see? Same.

---

## Recommended next five actions

1. **Fix chip refinement** (frontend; plan ticket C2). Highest user-visible defect; contaminates research if left.
2. **Hide or down-tier off-pillar mocks in the prototype panel** (designer + frontend, half-day). Protects the strategic message of Round 2.
3. **Implement minimal voice repair dialog** (designer + frontend, 1–2 days). At least one principled "I didn't catch that — try again, or tap a suggestion" surface, used by every voice flow.
4. **Add post-processing regex sweep on `/api/chat` output** (frontend + backend, half-day; plan ticket C3). Closes the prompt-leak risk on filler/closers.
5. **Run the one-day cross-pillar test pass** (QA, with researcher observing) before Round 2 fieldwork commits, so the script can route around known failures.

If only one of these ships before Round 2, ship #1.

---

## Note on the planning docs

`JBIQ-Voice-Plan-v2.docx`, `JBIQ-UX-Voice-Plan.docx`, `JBIQ-Plan-Phases.docx`, `JBIQ-Plan-Next-Steps.docx`, `JBIQ-Plan-v2-Strategy-Research-UX.docx` are byte-identical copies of the same document. Recommend keeping `JBIQ-Voice-Plan-v2.docx` as the canonical source and archiving the other four to avoid the "which version is the truth" question on the next review.

`JBIQ_Gap_Analysis.docx` is independent and remains the canonical pre-launch gap register. The voice build closes some of its UX gaps (commitment gate, voice disclosure, four pillars in the prompt) and leaves most of its Strategy and Voice-UX gaps open.
