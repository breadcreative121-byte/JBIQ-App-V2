JioBharatIQ Response Pattern Model

The response contract for JioBharatIQ experiences

| Version | V1.0 |
| --- | --- |
| Status | Work In Progress |
| Applies to | Product, Design, Engineering, Voice, Content, Data, QA, AI Systems |
| Owner | Matt Jarvis |
| Last Updated | April 2026 |

# 0. Purpose & Authority

This document defines the mandatory response behaviour for JioBharatIQ across all domains, surfaces, and sessions. It governs what a JioBharatIQ response looks like when rendered — the anatomy, the refinement mechanism, the language, and the permitted shape of every slot.

It exists to:

- Ensure every rendered response respects the Interaction Contract
- Prevent form-first, question-first, or filler-first response patterns
- Codify refinement as a chip-shaped mechanism, never a follow-up question
- Enable AI systems to generate, evaluate, and enforce correct response shapes
- Create a shared language for response critique in design and engineering reviews

This document is normative, not aspirational.

Any JioBharatIQ response — human-designed or AI-generated — that violates this model must be flagged, justified, and corrected or rejected.

# 1. Scope & Non-Goals

## In scope

- How responses are structured (anatomy and slot order)
- How inferred context is surfaced in the response
- How refinement works (chips, not follow-up questions)
- When clarification is permitted and in what form
- Language, tone, and code-switching in responses
- Response patterns by intent shape
- How confidence and autonomy modify the response
- Prohibited response patterns

## Out of scope

- State machine definitions — governed by the Interaction Model
- Memory, trust, and confidence logic — governed by the Conversation History Model
- Cross-surface orchestration — governed by the Integrated Modal Experience Model
- Capability discovery and invocation — governed by the Assistant & Tools Experience Model
- Brand voice and visual design system
- Domain-specific business logic

This document governs response shape, not behaviour, orchestration, or memory.

# 2. Core Response Philosophy

Every response is the render layer of the Interaction Contract. When the state machine enters PARTIAL_RESULT_SHOWN, COMMITMENT_REQUIRED, or EXECUTION_COMPLETE, something appears on screen. This document defines what that something looks like.

## Fundamental beliefs

- Responses should show value, not request value
- Inference should be visible in the response itself, not hidden behind silent assumptions
- Refinement is chip-shaped, not question-shaped
- Every response must earn its first sentence
- A broad default result is always preferable to a narrow clarification question
- The user's first impression is a finite resource and must not be spent on filler

# 3. Response Invariants (Non-Negotiable)

All JioBharatIQ responses must uphold these invariants. Violations are structural, not stylistic.

- Every response must conform to the canonical anatomy defined in Section 5
- No response may begin with filler (greetings, apologies, or narration of intent)
- No response may use a follow-up question to collect information a chip could represent
- Inference must be surfaced in the response, never hidden as a silent assumption
- Response language must match intent language, including mid-sentence code-switching
- No response may present a form before showing any result
- No response may commit the user to an irreversible action without entering COMMITMENT_REQUIRED
- A response must never end with a gratuitous open-ended prompt (e.g., "Anything else?")

# 4. Intent Shape Taxonomy

All user intents map to one of five canonical shapes. Response patterns vary by shape, not by domain.

| Intent Shape | Trigger Signal | Canonical Response Family |
| --- | --- | --- |
| Informational | User asks for information with no action implied | Inline answer, optional next-best action |
| Transactional — Single Path | User names a specific, unambiguous action | Prepared action preview → commitment |
| Transactional — Multi-Option | User expresses a goal with multiple valid paths | Primary result set → refinement → commitment |
| Stateful Query | User asks about current state of something they own | Live state display, no action required |
| Proactive-Triggered | System initiates based on signal; user has not spoken | Intent surfaced for user to claim |

## Classification rules

- If the user names a specific action with an identifiable target, it is Single Path.
- If the user expresses a goal with implicit choice among valid options, it is Multi-Option.
- If the user asks a question expecting an answer, it is Informational.
- If the user asks about their own state, balance, status, or progress, it is a Stateful Query.
- If there is no user input and the system is initiating, it is Proactive-Triggered.

Ambiguity rule: when an intent could be classified as Single Path or Multi-Option, default to Multi-Option. A broad result set is cheaper to correct than a wrong specific action.

# 5. Canonical Response Anatomy

Every response consists of up to four slots, rendered in fixed order.

| Slot | Name | Presence | Role |
| --- | --- | --- | --- |
| 1 | Context Line | 0–1 | One sentence surfacing inferred signal |
| 2 | Primary Result | Required | The substantive response (answer, cards, preview, state) |
| 3 | Refinement Layer | Conditional | Chip-based refinement when multiple options exist |
| 4 | Edge Affordance | Optional | Ancillary action (compare, see more, remind later) |

## Slot rules

- Slot order is fixed; slots may not be rearranged
- Slot 2 is always required
- Slot 3 is required whenever Slot 2 contains more than one valid option
- No content is permitted outside these four slots
- No slot may appear more than once in a single response

# 6. The Context Line

The first impression the user sees. It must earn its place by carrying signal.

## Rules

- One sentence, maximum
- Must contain inferred signal, not filler
- May surface: festival or event timing, delivery window, inferred constraint, memory acknowledgement, price range, autonomy hint
- Must never: apologise, narrate what is coming, ask a question, greet the user, restate the user's intent back to them

## Allowed examples

- "Kurtas for Diwali — delivery before Nov 5"
- "Found your usual ₹299 recharge plan"
- "Your cart from Wednesday is ready"
- "Adani Electricity, ₹1,243, due Nov 3"
- "Morning flights to Mumbai, under ₹3,500"

## Prohibited examples

- "I'd love to help you with that!"
- "Let me find some kurtas for you"
- "Here are some options"
- "Sure! Great question!"
- "You want to shop for a kurta for Diwali" (intent echo)
- "I can help you with shopping" (capability narration)

# 7. The Primary Result

The substantive content of the response. Its shape is dictated by the intent shape (Section 4).

## General rules

- Multi-option transactional: 3–5 cards maximum. Never more.
- Single-path transactional: one prepared card with full commitment-ready detail
- Informational: inline answer as prose, not a card, unless comparison is requested
- Stateful query: live state with the relevant data point foregrounded
- Proactive-triggered: the inferred intent framed as a question the user can claim

## Inferred-attribute surfacing

- Every card or preview must surface the key inferred attributes on its face
- Inferred values that are editable must be visibly editable via chip or tap
- Price is always shown in Indian number format (₹1,499, not $17.99)
- Time-sensitive attributes (delivery date, validity, due date) are always surfaced when applicable
- A card must never hide an inferred assumption that materially affects the user's decision

# 8. The Refinement Layer (Chips, Not Questions)

Refinement is the mechanism by which a user narrows a multi-option result set. JioBharatIQ refinement is always chip-based.

## Core rule

If a refinement can be represented as a chip, it must be a chip. Follow-up questions for refinement are prohibited.

## Chip requirements

- Single-tap, single-outcome
- Reversible in a single tap
- Ordered by predicted impact, highest first
- Maximum 4–7 chips visible; "More" chip may expand additional filters
- Labels use concrete, scannable language ("Under ₹1,500", not "Budget")
- Must not require text input
- Must not open a new screen before rendering the refined result

## Prohibited refinement patterns

- Follow-up question asking for a value a chip could represent (e.g., "What colour?")
- Multi-step refinement flow (chip → new screen → another chip → result)
- Chips that are not reversible (one-way filters)
- Chips that require free-text input
- Mixing chips and follow-up questions in the same response

# 9. The Edge Affordance

An optional fourth slot for actions that sit outside the primary flow.

## Rules

- Maximum one edge affordance per response
- Must not compete visually with the primary commitment action
- Never used as a replacement for chip-based refinement
- Must be reversible or non-destructive

## Allowed examples

- "See more" — expands the result set
- "Compare" — opens a comparison view
- "Save for later" — defers the decision
- "Something more formal?" — shifts the result context
- "Remind me later" — defers a proactive-triggered response

# 10. Response Pattern by Intent Shape

Each intent shape has a canonical pattern. Patterns are prescriptive, not suggestive.

## 10.1 Informational

Pure Q&A flows where the user's intent is informational and requires no action.

| Slot | Behaviour |
| --- | --- |
| Context Line | Optional. Use only when the answer benefits from a signal (e.g., last-updated time). |
| Primary Result | Inline answer as prose. No card unless comparison is explicit. |
| Refinement Layer | None. |
| Edge Affordance | Only if context suggests a next-best action (e.g., rainy forecast → "Call a cab?"). |

## 10.2 Transactional — Single Path

The user names a specific, unambiguous action with an identifiable target.

| Slot | Behaviour |
| --- | --- |
| Context Line | Required. Names the action target and the material attribute (amount, date, validity). |
| Primary Result | One prepared action card, commitment-ready, with all inferred attributes visible. |
| Refinement Layer | Chips for editable attributes (payment method, amount variant, delivery date). No clarifying questions. |
| Edge Affordance | "Set reminder" or similar deferral. Never a second action. |
| Commitment | Explicit confirmation required. Silent execution prohibited. |

## 10.3 Transactional — Multi-Option

The user expresses a goal; multiple valid paths exist; a selection is needed.

| Slot | Behaviour |
| --- | --- |
| Context Line | Required when there is a contextual signal (festival, delivery window, inferred constraint). Otherwise optional. |
| Primary Result | 3–5 cards using inferred defaults. Each card surfaces key attributes on its face. |
| Refinement Layer | Required. Chips for the highest-impact filters, ordered by predicted impact. |
| Edge Affordance | Optional. "See more" or a context-shift ("Something more formal?"). |
| Commitment | Triggered on card selection. Full preview before confirm. |

## 10.4 Stateful Query

The user asks about the current state of something they own — balance, cart, order, reservation.

| Slot | Behaviour |
| --- | --- |
| Context Line | Optional. May carry a staleness signal if the data is not live. |
| Primary Result | Live state with the relevant value foregrounded. |
| Refinement Layer | None typically. May offer a timeframe chip ("Last 7 days", "This month"). |
| Edge Affordance | Actionable next step if one is contextually valid ("Pay now", "Checkout", "Track"). |

## 10.5 Proactive-Triggered

The system initiates based on a signal (upcoming bill, festival window, inventory depletion). Governed by the Interaction Model's Proactive Flows rule.

| Slot | Behaviour |
| --- | --- |
| Context Line | Required. Identifies the signal that triggered the response. |
| Primary Result | The inferred intent framed as a question the user can claim. |
| Refinement Layer | None. |
| Edge Affordance | "Remind me later" or "Don't suggest again". |
| Commitment | Only after the user claims the intent. Silent auto-execution prohibited except at Autonomy Level 3 with pre-consent. |

# 11. Clarification Rules

A clarifying question is permitted, but rarely. The default is to show a broad result and allow chip-based refinement.

## A clarification is permitted only when all three conditions hold

- The ambiguity cannot be resolved by chips
- Showing a default would produce high-consequence waste (wasted time, wrong direction, unrecoverable state)
- The question has three or fewer valid answers

## Format requirements

- Must be presented as chip-style options, never open text
- Maximum one clarification per turn
- Must come after at least a degraded primary result, never before
- Must use singular, concrete phrasing ("Men's or women's?" not "Please specify the gender category.")

## Prohibited

- Clarifying before any result is shown
- Multi-field questions ("What size, colour, and budget?")
- Questions asked because confidence is low — show a broader result set instead
- Questions that could be resolved by tapping an existing chip
- Clarifying values that are already in memory with medium or high confidence

# 12. Language, Tone & Code-Switching

## Language rules

- Response language must match intent language
- If the user code-switches mid-sentence (e.g., Hinglish), the response follows suit
- Numerals are rendered in Indian format — lakhs, crores, and two-comma grouping (₹1,23,456)
- Festival and regional context surfaces without inferring religious, caste, or political identity
- Language preference persists across modalities and turns until the user switches

## Tone rules

- Neutral-helpful, not enthusiastic-salesy
- Concrete, not abstract
- Brief, not decorative
- Matter-of-fact about inference ("Your usual plan") rather than performative ("I remember you!")

## Prohibited

- Responding in English to a Hindi or Hinglish intent
- Exclamation-heavy tone ("Amazing!", "Perfect!", "Wonderful!")
- Emoji use unless the surface explicitly requires it
- Sales language ("Best price!", "Limited time!", "Don't miss out!")
- Performative memory references ("I'm so glad you're back!")

# 13. Confidence × Intent Shape Matrix

Confidence signals are provided by the Conversation History Model. The response shape adapts accordingly. This matrix defines permitted variations.

| Intent Shape | High Confidence | Medium Confidence | Low Confidence |
| --- | --- | --- | --- |
| Informational | Silent answer | Answer + source hint | Answer + verify suggestion |
| Single Path | Prepared, one-tap confirm | Prepared, full confirm | Fall back to Multi-Option |
| Multi-Option | Top 1 prominent, alternatives below | 3–5 equal options | Broad set + more chips visible |
| Stateful Query | Live state only | State + last-updated signal | Verify query first |
| Proactive-Triggered | Surface with claim prompt | Surface with reason context | Do not surface |

Financial actions ignore this matrix at the commitment step. Regardless of confidence, a financial commitment requires explicit confirmation and the strongest available authentication channel. Confidence may only reduce pre-commitment friction, never commitment integrity.

# 14. Autonomy × Response Mapping

Autonomy levels are defined in the Interaction Model. Response behaviour adjusts as follows:

| Autonomy Level | Response Behaviour |
| --- | --- |
| Level 0 — Observe | Full summary. No pre-fill. Every attribute shown. Question rate may be higher. |
| Level 1 — Suggest | Pre-filled attributes with explicit confirm. All inferred values visible. |
| Level 2 — Default | Condensed summary with confirm. Inferred values shown but grouped. |
| Level 3 — Semi-Auto | Notification + undo window. Only for flows where the user has pre-consented to automation. |
| Level 4 — Full Auto | Notification only, post-execution. Restricted to mandate flows (e.g., UPI AutoPay) with legal consent. |

Autonomy reduces what must be shown, never what must be confirmed for an irreversible action. A Level 3 response still respects COMMITMENT_REQUIRED for any irreversible step that was not pre-authorised.

# 15. Canonical Worked Examples

The following examples illustrate the rules in this document. They do not override the rules.

## Example 1 — Multi-Option Transactional (English)

Intent: "Shop for a kurta for Diwali"

Shape: Transactional — Multi-Option

Inferred (silent, from memory): gender, size, typical budget, preferred brands, delivery address

Inferred (surfaced in response): Diwali timing → delivery cutoff; festive style bias

Response:

Kurtas for Diwali — delivery before Nov 5

[Card] Fabindia Men's Cotton Kurta · M · Cream · ₹1,499 · Arrives Nov 2

[Card] Manyavar Festive Silk Kurta · M · Maroon · ₹2,899 · Arrives Nov 3

[Card] Biba Women's Anarkali · M · Gold · ₹1,799 · Arrives Nov 3

[Card] Ethnix Embroidered · M · Navy · ₹2,199 · Arrives Nov 2

Filters: [Under ₹1,500] [Men] [Women] [Silk] [Cotton] [More]

See more

## Example 2 — Multi-Option Transactional (Hinglish)

Intent: "Diwali ke liye kurta dhundo"

Shape: Transactional — Multi-Option

Response:

Diwali ke liye kurtas — Nov 5 se pehle delivery

[Card] Fabindia Cotton Kurta · M · Cream · ₹1,499 · Nov 2 tak

[Card] Manyavar Silk Kurta · M · Maroon · ₹2,899 · Nov 3 tak

[Card] Biba Anarkali · M · Gold · ₹1,799 · Nov 3 tak

[Card] Ethnix Embroidered · M · Navy · ₹2,199 · Nov 2 tak

Filters: [₹1,500 se kam] [Men] [Women] [Silk] [Cotton] [More]

## Example 3 — Single Path Transactional

Intent: "Pay electricity bill"

Shape: Transactional — Single Path

Response:

Adani Electricity · ₹1,243 · due Nov 3

[Card] Bill preview

Account: ****8821 (Bandra West)

Amount:  ₹1,243

Due:     Nov 3, 2026

Pay via: GPay (UPI)  [change]

[Pay ₹1,243]   Set reminder

## Example 4 — Single Path Transactional (Hinglish)

Intent: "Recharge kar do 299 wala"

Shape: Transactional — Single Path

Response:

₹299 plan · 2GB/day · 28 din validity

[Card] Recharge preview

Number: 98XXXXXX21 (primary)

Plan:   ₹299 / 28 days / 2GB per day

Pay via: PhonePe (UPI)  [change]

[Pay ₹299]   Dusra plan dekhein

## Example 5 — Informational

Intent: "Kal ka mausam?"

Shape: Informational

Response:

Kal Mumbai mein 31°C, hluki baarish shaam ko.

Cab book karein?

Note: the next-best action ("Cab book karein?") is an edge affordance, permitted because rain implies a plausible next action. It is not a clarification.

## Example 6 — Stateful Query

Intent: "Mera balance kya hai?"

Shape: Stateful Query

Response:

HDFC Savings · ****4412

₹47,289.50

updated just now

Transactions dekhein

## Example 7 — Proactive-Triggered

Trigger: electricity bill due tomorrow; user has not spoken

Shape: Proactive-Triggered

Autonomy Level: Level 1 (Suggest)

Response:

Your Adani Electricity bill is due tomorrow — ₹1,243.

Pay now?

[Pay ₹1,243]   Remind me tomorrow   Don't suggest again

## Example 8 — Low-Confidence Multi-Option

Intent: "Shop for a kurta for Diwali" — first-time user, no memory

Shape: Transactional — Multi-Option

Response:

Kurtas for Diwali

Men's or women's?  [Men]  [Women]  [Show both]

[Card] Fabindia Men's Cotton Kurta · Cream · ₹1,499

[Card] Biba Women's Anarkali · Gold · ₹1,799

[Card] Manyavar Festive Silk Kurta · Maroon · ₹2,899

[Card] W Embroidered Kurta · Teal · ₹1,299

Filters: [Under ₹1,500] [Under ₹3,000] [Silk] [Cotton] [More]

Note: the single clarification chip ("Men's or women's?") is permitted because gender is high-impact and cannot be inferred. Results still render — the clarification does not block them.

# 16. Prohibited Patterns

The following patterns are prohibited in all JioBharatIQ responses. Each represents a structural violation of this model. Automated QA should detect these.

| Prohibited Pattern | Why It Violates the Model |
| --- | --- |
| Form-first response | Multiple input fields presented before any result is shown |
| Filler opener | "I'd love to help...", "Sure!", "Great question!" — wastes the first sentence |
| Narration opener | "Let me find some kurtas for you" — narrates intent instead of showing result |
| Intent echo | "You want to shop for a kurta for Diwali" — restates the user's input back |
| Question before result | Any clarifying question asked before a primary result is rendered |
| Multi-field question | "What size, colour, and budget?" — violates single-question rule |
| Follow-up question as refinement | Asking for something a chip could represent |
| Silent commitment | Irreversible action without explicit COMMITMENT_REQUIRED |
| Language mismatch | Responding in English to a Hinglish or vernacular intent |
| Enthusiasm inflation | "Amazing deals!", "Best kurtas for you!", emoji-heavy tone |
| Closing question | "Anything else I can help with?" — unnecessary open prompt |
| More than 5 primary cards | Exceeds the cognitive budget of a single response |
| Irreversible chip | A chip that cannot be un-tapped without extra steps |
| Multi-step refinement | Chip → new screen → another chip — violates single-tap rule |
| Context line without signal | First line contains no inferred information |
| Multiple context lines | More than one sentence before the primary result |
| Hidden assumption | Inferring a material attribute without surfacing it in the response |
| Performative memory | "I remember you love cotton!" — reference to memory without purpose |

# 17. Metrics

How we know the model is working. Metrics must be instrumented per response, aggregated by intent shape, and reviewed quarterly.

## Response-shape metrics

| Metric | Target | Owner |
| --- | --- | --- |
| Context line signal rate (% with signal, not filler) | ≥ 95% | Content / AI |
| Chip-based refinement rate (vs follow-up questions) | ≥ 90% | Product |
| Clarification rate — Multi-Option intents | < 20% | AI |
| Clarification rate — Single-Path intents | < 10% | AI |
| First-card tap rate (top-3 cards) | ≥ 70% | Product |
| Response language match rate | ≥ 95% | Localisation |
| Prohibited pattern detection rate | 0 in production | QA |
| Primary result latency (p90) | < 5 sec | Engineering |

## Shape-distribution metrics

- Intent shape classification accuracy ≥ 95%
- Proportion of Multi-Option responses using chip refinement ≥ 90%
- Proportion of Proactive-Triggered responses claimed by user (vs dismissed)

If it cannot be measured, it cannot be governed.

# 18. Testing Requirements

Every release must pass the following tests before ship:

- Every intent shape × confidence level tested against a canonical prompt set
- Prohibited pattern checks in automated QA — regex-based for filler openers and classifier-based for shape violations
- Language-match test: responses in the same language as the intent, including mid-sentence code-switching
- Low-confidence fallback test: new user with no memory receives a valid Multi-Option response, not a form
- Festival context surfacing test: festival-triggered signals appear in the context line, not as a separate screen
- Refinement-via-chips test: multi-option intents surface chips, never follow-up questions
- Clarification restraint test: low-confidence intents produce a broad result set, not a question
- Prohibited-pattern regression suite run on every model update

# 19. Relationship to Other Models

This document operates inside the JioBharatIQ governance hierarchy.

| Model | Governs | Relationship to this Document |
| --- | --- | --- |
| Interaction Model — Core | State machine, autonomy, commitment, behaviour | Defines WHEN a response is rendered; this document defines WHAT it looks like |
| Conversation History Model | Memory, trust, confidence, consent | Provides signals this document consumes |
| Integrated Modal Experience Model | Orchestration, surface rendering, synchronisation | Defines HOW to deliver this response across surfaces |
| Assistant & Tools Experience Model | Capability discovery and invocation | Defines entry paths that produce the intents this document responds to |
| Response Pattern Model (this) | Response anatomy, refinement, clarification, language | Renders what the state machine requests |

## What this model consumes

- Interaction state (from Interaction Model)
- Autonomy level (from Interaction Model)
- Confidence signal (from Conversation History Model)
- Memory acknowledgements (from Conversation History Model)
- Surface capabilities (from Integrated Modal Experience Model)
- Intent language (from Intent Router)

## What this model governs

- Response anatomy and slot order
- Refinement mechanism (chips vs questions)
- Clarification shape and frequency
- Language and tone of response
- Prohibited response patterns

## What this model never redefines

- State transitions (owned by Interaction Model)
- Autonomy rules (owned by Interaction Model)
- Memory mutation (owned by Conversation History Model)
- Cross-surface orchestration (owned by Integrated Modal Experience Model)

# 20. Enforcement

This model must be referenced in:

- Product Requirements Documents (PRDs)
- Design reviews and critiques
- Content and voice specifications
- AI generation and prompt-engineering workflows
- QA test plans and acceptance criteria
- Team onboarding materials

## Review process

- Any response pattern that violates this model must be flagged in design or code review
- Violations must be justified with documented rationale and stakeholder approval
- Responses must be corrected or rejected unless an exception is explicitly approved

## Exception criteria

- Regulatory or legal requirement in direct conflict with a pattern (e.g., RBI-mandated flow)
- Technical constraint making compliance infeasible, with documented mitigation
- User research evidence that the pattern produces worse outcomes in a specific context

All exceptions are documented and revisited quarterly.

# 21. Versioning & Governance

- Changes require version increments
- Breaking changes require migration notes and cross-team communication
- Exceptions must be documented explicitly in an appendix
- Machine-readable specs (shape classifier, prohibited-pattern detectors, chip-vs-question tests) must remain in sync with this document

## Change process

- Propose change with rationale and worked examples
- Cross-functional review (Product, Design, Engineering, AI, Content)
- Impact assessment on existing response patterns and in-flight domains
- Approval by governance committee
- Update machine specs in parallel
- Communicate to all teams

This document evolves slowly by design.

# Appendix A — Response Pattern Decision Tree

A quick-reference flow for classifying an intent and choosing the correct response pattern.

| Question | Decision |
| --- | --- |
| Is there user input? | No → Proactive-Triggered pattern (Section 10.5). Yes → next question. |
| Is the user asking for information with no action implied? | Yes → Informational (Section 10.1). No → next question. |
| Is the user asking about their own state or data? | Yes → Stateful Query (Section 10.4). No → next question. |
| Does the intent name a specific, unambiguous action with a target? | Yes → Single Path (Section 10.2). No → Multi-Option (Section 10.3). |

## Once the shape is classified

- Apply the slot anatomy from Section 5
- Check confidence level and apply the matrix in Section 13
- Check autonomy level and apply the mapping in Section 14
- Verify language match (Section 12)
- Verify the response does not match any prohibited pattern in Section 16

# Appendix B — Quick Reference: Chip vs Question

When in doubt about whether a refinement should be a chip or a question, apply this test.

| If… | Use… |
| --- | --- |
| The possible answers fit on a screen as tappable options | Chips |
| The user's answer will narrow the result set | Chips |
| The refinement is reversible in a single tap | Chips |
| The refinement is one of many the user might make | Chips |
| The possible answers exceed ~7 and cannot be grouped | Still chips, with a "More" expansion |
| The ambiguity is gender, language, or profile, and no result can be shown meaningfully without it | One clarification chip row, rendered alongside a degraded result |
| The user has asked for free-text input (e.g., an address) | Text input, but only after a primary result is shown |

Default: chips. A follow-up question is an exception that must be justified.

