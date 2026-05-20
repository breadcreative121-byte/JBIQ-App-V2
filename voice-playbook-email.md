**Subject:** JBIQ Voice Playbook V0.2 — review + sign-off before V1

---

Hi all,

Sharing the V0.2 draft of the JBIQ Voice Playbook for your review and sign-off before I take it to V1.

**Goal.** A single operational reference for JBIQ voice — cited in design, content, engineering, AI, and QA review, not bookmarked and forgotten. Aligned to the Consumer Intelligence GA goals (May 2026).

**Problem.** Today the rules live across six separate specs — Conversation Principles, Response Pattern Model, Voice Disclosure, Partner Capability Manifest, Multi-Partner Conflict Resolution, and Error & Repair. Teams cite them inconsistently, no single doc lands in a review, and cross-language quality varies surface to surface. At GA scale — five verticals plus Core, 12+ production languages — that gap will cost us in consistency, in DEC, and in the time it takes to ship a new vertical.

**Insights.** Three things shaped V0.2:

- **Voice is the discriminating surface.** The rules that matter most for JBIQ are voice-first; UI carries the supporting detail. Most existing guidance is screen-first and quietly fails when voice is the primary modality.
- **GA isn't a single hero use case — it's breadth + quality.** Five verticals plus Core, each held to the same bar. The five-cohort chapter structure (bedrock · response · operating conditions · coexistence · hard edges, closed by measurement) is the operational consequence.
- **DEC is the right north star.** Chapter-level acceptance criteria now roll up to Daily Engaged Consumers, replacing session-level measures. Cross-language parity (≤10pp gap across all production languages) becomes an invariant, not a stretch goal.

**Solution.** V0.2 of the playbook — fourteen chapters in five cohorts, plus four appendices. Each chapter has its invariants vs guidance marked, a worked example, acceptance criteria, and cross-references back to the originating specs. A five-card TL;DR sits at the top for the sixty-second read; Appendix E maps every GA-aligned change in V0.2 against the chapter it touches.

**What I'd value from you:**

- A read of the TL;DR and "How it interlocks" before [date].
- Push-back on any chapter that feels mis-scoped — over- or under-emphasised — for GA.
- Sign-off on the five-cohort structure so I can take each chapter end-to-end through worked examples per intent, language, and surface for V1.

Playbook: [link]

Happy to walk through it in 20 minutes if it helps land any of the above.

Matt
