# JBIQ — Assistant & Tools Experience Model: Partner Orchestration Overview (v0.1)

| Version | v0.1 — strategic overview |
| --- | --- |
| Status | Draft for internal review (Product, Design, Engineering, AI) |
| Audience | Internal product + design, engineering / AI |
| Owner | Matt Jarvis |
| Last Updated | 2026-05-05 |
| Companions | `response-pattern-model.md`, `voice-first-use-cases.md`, `build-plan-2026-04-24.md` |

This document is the strategic spine for the **Assistant & Tools Experience Model** — the missing model referenced in `response-pattern-model.md` §20 ("Capability discovery and invocation… Defines entry paths that produce the intents this document responds to"). It does not yet specify shape; it sets the principles, tiers, and the open questions that the v1 spec will resolve.

---

## 1. The gap and why it matters

JBIQ today renders responses; it does not yet orchestrate capability. The four pillars (Government & civic, Local Services, Recharge & Bills, Order & Buy) are demoable on mocks, but the moment a real partner has to fulfill an intent — Indane refilling a cylinder, NPCI clearing a recharge, the PM-Kisan API answering a status query, Apollo confirming an open clinic — JBIQ needs a layer it has not built. This is the ecosystem play: a user expresses intent in any of 12+ languages, JBIQ orchestrates to the right reliance partner or 3rd-party partner, and the result is rendered through the existing Response Pattern Model. Partner orchestration is what turns JBIQ from a voice-led demo into India's daily AI saathi.

The trap, if we get it wrong, is that the partner becomes the experience — partners narrate, partners upsell, partners ask follow-up questions, partners break voice ceilings. The Response Pattern Model's invariants (chip-only refinement, four-beat voice disclosure, on-screen-tap commitment) collapse the moment a partner returns a `{ "message": "Best deal! Click here!" }` payload that JBIQ surfaces verbatim. The orchestration playbook exists to prevent this.

## 2. Principles (non-negotiable)

These are the design rules every other section in this document is downstream of.

**JBIQ is the narrator. Partners are the capability.** The user is in conversation with JBIQ, never with the partner. Partner identity surfaces as metadata (anchor-beat append, badge, chip label) — never as opener, never as voice owner, never as the source of refinement questions.

**The Response Pattern Model holds across every partner.** Partner output is *converted* into the canonical anatomy (Context Line → Primary Result → Refinement Layer → Edge Affordance). A partner that can't return data shaped to the model is not yet integrated.

**Commitment never delegates.** The on-screen-tap contract for irreversible actions (`response-pattern-model.md` §14) lives in JBIQ's core service. Partners receive a signed token after the user has tapped Confirm. They do not see, hear, or accept voice "haan" as commit.

**Tier is a privilege, not a category.** 1P (Reliance) gets top-tier integration by default, but the same response-anatomy, voice-disclosure, and commitment rules apply. 3P partners earn equivalent treatment by passing the same gates — there is no special exemption for 1P.

**Partners are plumbing by default.** A user does not "browse partners". The intent → result loop never asks "which app?" unless the user explicitly invoked a partner by name. Partner directories exist for transparency and audit, not as a discovery surface.

## 3. Tier model

| Tier | Examples | Gate | User-visible signal | Default pick-weight |
| --- | --- | --- | --- | --- |
| **T0 — 1P (Reliance)** | Jio Recharge, JioMart, JioPay, JioCinema | Internal — same anatomy + commitment rules apply | None (transparent by absence) | 100 |
| **T1 — Certified** | Indane, Apollo, Urban Company | DPDP attestation, security audit, response-anatomy compliance ≥99%, native-language coverage ≥3, voice-disclosure agreement, complaint rate <2% | Subtle metadata badge; named in anchor beat where useful | 85 |
| **T2 — Verified** | BigBasket, gov scheme APIs, regional aggregators | Schema validation, security scan, ≥1 native language, voice-disclosure, complaint rate <5% | Named in metadata only; surfaces when T0/T1 unavailable or user asks for them | 60 |
| **T3 — Open / pilot** | New partners, MVPs | Schema only; 90-day trial; weekly review | None unless explicitly invoked | 20 |

The tiers must be earned and revocable. A T1 partner that breaks SLA for 30 days drops to T2 with a 30-day remediation window. Any tier can be suspended for DPDP / sensitive-trait / commitment-integrity violations.

## 4. The four lenses, in brief

### 4.1 Product & UX

Partner identity surfaces *after* the outcome, never before. The anatomy holds without a new slot — partner badges sit inside the Refinement Layer or as small metadata on a Primary Result card. In voice, the four-beat disclosure absorbs partner identity as a two-word append in the anchor ("via Urban Company"), nothing more.

Disambiguation when multiple partners can serve an intent should default to a silent JBIQ pick (tier-weighted, with the user's history as +1) and an Edge Affordance that lets the user say "show me other options". Asking the user "which app?" violates the natural-voice contract. Failure modes (partner down, partner wrong, partner free-text) are absorbed by JBIQ — the user never sees a partner error message. Payment for 3P remains an open product question (always JioPay, or partner-native?) and is the single largest UX call to make.

### 4.2 Architecture & orchestration

Sit a **capability broker** between intent detection and partner invocation. Every partner declares a capability manifest (capability_id, intent shape per `response-pattern-model.md` §10, tier, language coverage, latency SLA, response-shape contract, auth model). The manifest is the source of truth.

Routing is **hybrid**: regex pre-match for the top ~20 intents per pillar (fast, deterministic) with LLM tool-calling as fallback. Precedence runs tier first, then health/latency, then language quality, then user-history nudge. A circuit breaker on consecutive partner failures fails fast to a fallback partner; if all exhaust, JBIQ degrades gracefully — never silently substitutes informational for transactional.

**MCP is the plumbing, not the architecture.** Anthropic's MCP fits well as transport for greenfield 3P partners; existing partners get REST adapters; 1P partners use a Jio SDK. The capability registry, health checks, auth orchestration, memory enrichment, and failure model all sit *above* MCP in JBIQ-owned code. JioID is the cross-partner identity fabric; "your usual ₹299 plan" lives in the JBIQ user graph and is passed to partners on each invocation, with field-level allow-listing per the partner contract.

### 4.3 Trust, safety, compliance

DPDP consent is **per-pillar / per-partner**, never blanket. The consent moment surfaces as a micro-commitment in voice ("Shall I check with Indane?") before any data leaves JBIQ. JBIQ is the data fiduciary; partners are processors. Outbound payloads are tagged with consent-ID, purpose-code, timestamp, retention window — and audit-replayable for DPDP Article 17–19 erasure rights.

Commitment integrity is the sharpest vulnerability. Money-out via voice alone is unsafe; the playbook enforces a two-step dance — voice captures intent, JBIQ holds commitment state and issues a signed token, partner accepts only the token. Sub-₹500 may use streamlined auth (per RBI/NPCI); above that, explicit second-factor.

A **sensitive-trait firewall** strips inferred religion / caste / politics / sexual-orientation from partner responses before surfacing — this includes 1P (a JioMart purchase history can infer religion just as a scheme API can infer caste). Partner output runs through a sanitiser that parses against a typed schema, rejects free-text "message" fields, and flags sales / urgency language ("best", "limited", "hurry") for review — many of which are already prohibited per `response-pattern-model.md` §17 and must apply to partner-originated text too.

### 4.4 Partner program governance

The partner contract names what JBIQ promises (intent volume by tier, brand placement rules, data minimisation, payout terms) and what the partner promises (anatomy compliance, language coverage, SLA, schema accuracy, sensitive-trait abstinence). The MSA lives with Reliance Legal; DPDP Act, TRAI rules, and NPCI/UPI terms are incorporated by reference.

Onboarding is a five-stage funnel: Inquiry → Technical Integration (60-day cap) → Certification (security + DPDP + voice-disclosure baseline) → Live Ramp (5% → 25% → 100%) → Quarterly Review. Demotion / suspension triggers and the fallback UX ("This service is briefly unavailable — here's an alternative") are pre-agreed with the partner.

Discoverability is invisible by design. There is a partner directory in-product for transparency and audit, but no "browse partners" surface. The user's loyalty is to JBIQ; a partner earns volume by being correct, fast, and quiet.

## 5. Worked example — Indane gas refill, T1 partner

User intent (voice, Hinglish): *"Cylinder book karo, is hafte delivery."*

**Routing:** regex pre-match hits `gas_refill`. Capability registry returns Indane (T1, healthy, ms-latency within SLA, native Hindi support). User has history with this connection. Pick: Indane.

**Consent micro-check** (silent if previously granted within session, surfaced as voice anchor if first-time): "Indane se cylinder book karein?" — captured as a chip-shaped Yes / Change.

**Capability invocation:** JBIQ enriches with JioID profile (`user_address`, `language: hi-IN`, `connection_id`). Indane returns a typed `action_confirmation` payload — single card, validity, ₹903, Friday delivery.

**Anatomy render** (per `voice-first-use-cases.md` §4.5):
- *Context Line*: "Indane connection mil gaya — Friday delivery available."
- *Primary Result*: single Confirm & Pay card (uses the existing `handleConfirmAndPay()` flow per `response-pattern-model.md` §14 commitment gate).
- *Refinement*: chip — "Auto-book next month bhi".
- *Edge Affordance*: `remind_later` reminder option.

**Voice disclosure** (≤40 words, four-beat, partner named in anchor): *"Indane se cylinder mil gaya — Friday delivery, ₹903. Confirm karein? On screen — Confirm & Pay tap karein."*

**Commitment:** explicit on-screen tap. JBIQ issues signed token. Indane charges, returns booking ref. JBIQ surfaces success state. If Indane fails post-token: JBIQ owns the apology and the refund-status surface, not Indane.

**Failure surface (Indane down):** capability broker flags partner unhealthy, falls back to *no partner found* (no T2 alternative for LPG); JBIQ responds informationally with "Booking service is briefly unavailable — call your distributor at [number] or I'll remind you in 30 minutes." The Interaction Contract is preserved: a transactional intent was not silently downgraded — it was *visibly* deferred with a clear retry.

This example fits inside the existing four-slot anatomy with zero new UI primitives. That is the test: if a partner moment requires a new slot, the integration is wrong.

## 6. Open questions — to resolve before v1 of this model

These are the calls that determine the shape of v1. None should be made silently.

1. **Payment scope for 3P**: do all 3P transactions route through JioPay (uniform commitment UX, brittle integration), or can high-trust 3P retain their own checkout (better partner economics, fragmented trust)? — Product + commercial.
2. **Partner-disambiguation default**: silent JBIQ pick + override-by-voice, or surface 2-3 candidates as chips when confidence is medium? — Product + research (T2/T3 fieldwork should test both).
3. **Routing layer**: hybrid regex + LLM tool-call vs pure LLM tool-call. Affects latency, hallucination risk, scaling. — Engineering.
4. **Auth model**: system-credential default vs per-user OAuth default. The recommendation is *system creds for 1P + public APIs, per-user OAuth for sensitive 3P*, but this needs sign-off because it shapes every partner contract. — Engineering + Legal.
5. **Memory location**: JBIQ user graph as canonical (recommended), or partner-resident with JioID as a key (decoupled but divergent)? — Engineering + Architecture.
6. **Self-preferencing**: does default 1P (T0) priority survive CCI / DSA-style scrutiny? Reliance Legal must clear this before launch. Whether and how to disclose the preference is a connected exec call. — Legal + Exec.
7. **Cross-border data residency for 3P**: many 3P partners replicate outside India. DPDP Rules 2025 implications. — Legal.
8. **Voice as financial-flow consent**: RBI/NPCI position on voice-only auth is fragmented across UPI / payment-system / prepaid-instrument rules. What is the floor for second-factor given voice-biometric variance in low-literacy contexts? — Legal + Engineering.
9. **Partner output sanitiser scope**: how aggressive should the prohibited-pattern strip be on partner-originated text? Strip silently, re-prompt, or fail loud? — Product + AI.

## 7. Sequencing — what lands when

This is rough; firm dates land in the next sprint plan after v1 of this model is approved.

| Phase | Scope | Trigger |
| --- | --- | --- |
| Phase 0 — now | This overview reviewed; principles + tiers signed off; the nine open questions assigned owners. | This document |
| Phase 1 — pre-MVP (post May launch) | Capability manifest schema frozen. Capability broker scaffolded with 1P SDK only (Jio Recharge, JioPay). Sensitive-trait firewall in place even on internal calls. Partner contract template drafted. | After current MVP ships per `build-plan-2026-04-24.md` |
| Phase 2 — first T1 onboarding | One T1 partner end-to-end (proposal: Indane — already a use-case, low-risk single-path transaction). Onboarding lifecycle and certification gates exercised. | After Phase 1 |
| Phase 3 — fan-out | Apollo, Urban Company. Routing and observability hardening. Quarterly partner review process live. | After Phase 2 |
| Phase 4 — open program | T2 verified path opens to applicants; partner directory live for audit; T3 pilot framework. | After Phase 3 |

## 8. Relationship to existing JBIQ models

| Model | Owns | This document's relationship |
| --- | --- | --- |
| `response-pattern-model.md` | Response anatomy, refinement, voice disclosure, commitment gate | This model **consumes** — every partner output renders through the existing four slots and §15 four-beat. No new slot introduced. |
| Interaction Model — Core (referenced, not yet committed) | State machine, autonomy levels, commitment | This model **respects** — `COMMITMENT_REQUIRED` lives in JBIQ core, never in the partner. Autonomy Level 3/4 partner flows require pre-consent per §14. |
| Conversation History Model (referenced, not yet committed) | Memory, trust, confidence | This model **extends** — JioID-keyed user graph becomes the cross-partner memory fabric; consent state is part of memory. |
| Integrated Modal Experience Model (referenced, not yet committed) | Cross-surface orchestration | This model **defers** — partner handoff to a partner surface (e.g. Urban Company app deep-link) is governed by the modal model, not this one. |
| Assistant & Tools Experience Model (this) | Capability discovery, partner integration, orchestration, partner program governance | The slot named in `response-pattern-model.md` §20. This document is its v0.1. |

---

## 9. What this document is not

It is not the v1 spec. It does not yet define manifest schemas, the partner-contract MSA template, the certification rubric, the SLA dashboard fields, or the voice-disclosure copy library for partner moments. Those follow once the nine open questions in §6 have owners and decisions. v1 of the Assistant & Tools Experience Model will be normative in the same way `response-pattern-model.md` is — patterns become invariants, with prohibited patterns and acceptance criteria.

## 10. Changelog

- 2026-05-05 — v0.1, strategic overview drafted from a four-lens panel (product/UX, architecture, trust+compliance, governance). Sets principles, tier model, worked example, and the nine open questions for v1.
