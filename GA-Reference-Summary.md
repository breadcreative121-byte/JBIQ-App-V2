# Consumer Intelligence — GA Reference Summary
*Compiled from North Star, Operating Goals (GA), Pod Objectives (GA), and Pod Plans (GA). May 2026.*

---

## Part 1 — Headline GA Commitments

### The product, restated
JioBharatIQ is India's daily AI Saathi — voice-first, multilingual, pre-installed and default-on across Jio devices. Spans health, devotion, entertainment, commerce, jobs, and more. North Star metric is **Daily Engaged Conversations (DEC) = DAU × Conversations/User/Day**.

### Org-level GA goals (10)
| # | Cluster | Goal |
|---|---|---|
| 01 | Market Reach | 1M+ Indians/month reached |
| 02 | Market Reach | 5+ domains live, 15+ signature experiences |
| 03 | Consumer Outcomes | 40%+ first-time users complete a task in session 1; 80%+ task completion for returning users |
| 04 | Consumer Outcomes | 25%+ of monthly users return daily |
| 05 | Consumer Outcomes | 80%+ response satisfaction, no domain below 70% |
| 06 | Platform Capability | 12+ Indian languages in production, each beating benchmark STT by 5%+ |
| 07 | Platform Capability | 99%+ quality eval pass rate; stable at 100K+ concurrent |
| 08 | Scale Readiness | 10+ partners live (Jio + external); 3+ new partners/month |
| 09 | Scale Readiness | 2+ net new signature experiences/month, built by partners or autonomously |
| 10 | AI-Native Org | 100% of org uses AI tooling as primary workflow |

### Year-1 (from GA) trajectory
- **Scale:** 100M MAU · **Habit:** DAU/MAU 25%+ · **Companion:** 2 sessions/user/day
- **Commercial:** Rs. 1,000 Cr GMV / Rs. 100 Cr ARR
- **Trust:** NPS 50+, Satisfaction 80%+
- **GTM bar:** 10M+ MAU within 90 days of GA, D30 retention 30%+, DAU/MAU 20%+

### Non-negotiable guardrails (apply regardless of growth pressure)
- Trust floors (satisfaction + complaint rate) maintained at all times.
- Every production language meets the **same** quality bar.
- Full DPDP Act compliance and data residency.
- Performance on low-bandwidth connections is a product requirement, not an optimisation.

---

## Part 2 — Pod-by-Pod GA Snapshot

### AI Core
- **Voice & Multimodal (Anmol):** 12+ languages in full pipeline (STT + code-mix + TTS), TTS MOS 4.0+ per language, end-to-end latency targets per query class, multimodal validated on bills/medicine labels/invoices/IDs, 100K+ concurrent load.
- **Agentic Orchestration + MLOps (Bharat):** 97%+ routing accuracy holding past 100 skills; voice p50 ≤2.5s simple → ≤15s multi-skill; chat p50 ≤1.5s → ≤10s; 95%+ task completion; ≤Rs. 0.05/query; 3 in-house SLMs (router, lang/code-mix detector, simple-knowledge); PR-to-prod ≤30 min.
- **Memory (Karan):** Write recall >80% / precision >85%; retrieval P@K and R@K >80%; <500ms added at P95; user view/edit/delete with 24h propagation.
- **Personalization (Karan):** Day-0 warm start >70% of new users; 80% of users with 3+ sessions have 10+ profile attributes; signal freshness <15 min; injection <50ms P95; 24h cross-surface consistency.
- **Evals (Karan):** CI/CD gates on 100% of components, 1P verticals, partner skills; online-offline delta <10pp; ≤2 days to first eval suite for any pod; weekly per-pod coverage published.
- **Quality (Bhushan):** Quality bar documented per component/vertical/skill; 100% of signature experiences validated pre-GA; 80%+ satisfaction with no domain below 70%; cross-language parity within 10pp.
- **Guardrails (Karan):** 100% legal-defined guardrails live at Beta; FNR <5% per category, hard-block FNR 0%, FPR <2%; 99.9% uptime; fail-closed on hard blocks.

### Experiences
- **Core Experience (Sridhar):** 40%+ first-session task completion; 80%+ onboarding completion in <3 min across device tiers; 25%+ organic daily return; 50%+ engage 2+ signature experiences in week one; 90%+ usability pass in tier-2/3 with zero English dependency.
- **Vertical Experiences (Naroo):** 15+ signature experiences across 5+ verticals at GA; every one structurally unreplicable; D7 organic return 40%+ each; **7-day cycle from validated use case to live experience** via the **Vertical Lift** agentic pipeline.
  - **Astrology + Devotion (Shivali):** Grand Kundali Reveal · Talk to Your Planets · Kundali Matching · Shubh Muhurat · Live Darshan · Devotional Feed · Sacred Calendar. Astrology 30% MAU weekly, Devotion 40% weekly; 60% new-user trial in 7 days; NPS ≥60 after 3rd session.
  - **Entertainment + News (Shantanu):** Cricket Match Companion · AI Jockey · AI Anchor Daily Brief · Multimodal Fact Checker. 5% of JioHotstar/JioSaavn/JioNews users on JBIQ weekly; CSAT 4.0+; Fact Checker resolves 90%+ of WA forwards in <8s with sourced verdict; 10% Cricket sessions end in WA share, 15% fact-check verdicts shared back.
  - **Jobs, Careers & Skills (Samyak):** Microlearning · English Learning · Interview Prep · Government Exam Discovery & Prep. 30% MAU weekly; 50% new-user trial in 7 days; 50%+ complete a first coached session; 75%+ sessions end with a feedback signal; outcome instrumentation Day 1.
- **Partner Experience (Sushant):** Sandbox to first working skill in 30 min; 80% governance checks automated; MCP/API/Agent all live; 5-min behaviour visibility, 1-min error/violation surfacing; 9-of-10 partner actions self-serve.

### Systems
- **Platform & Infra (TBD/Manan/Ayush):** 99.5%+ availability; MTTD <2 min, MTTR <30 min; load-stable at 100K+ concurrent with 30% headroom; standard GitOps via ADO/ArgoCD/Helm; PR-to-prod <2h gated by evals; new service stood up in <2 days without platform ticket.
- **Data & Analytics (Kalyan):** Every objective has a live dashboard pre-GA; 5-min data freshness; self-serve answers in <2 min without SQL; new data point in <1 day; **GrowthBook live** — any pod runs an A/B test in <3 days.

### Insights & Growth
- **UXR (Muz):** Validated personas + day-in-life archetypes adopted by product and design **by Beta exit**; 90%+ of signature experiences and core changes have UXR validation completed **at least 2 weeks before ship**; structured post-launch sentiment pulse live within 2 weeks of GA.
- **Consumer Lifecycle (Ayush P):** 40%+ same-session activation; DAU/MAU 20%+, D30 30%+; homepage maps to 6 lifecycle states (New, Activated, Engaged, Retained, At-Risk, Returning); D1/D3/D7 nudge sequence; 15%+ recovery of lapsed users in 30 days; experimentation engine end-to-end tested in FnF/Beta.
- **GTM (Paarmi):** Cohorts ranked and locked before channel planning; brand + positioning signed off before creative production; 10M+ MAU within 90 days; cross-functional launch program with go/no-go checklist grounded in Beta signal.

---

## Part 3 — Beta → GA Sequencing (where it matters)

A few sequencing notes that anchor design dependencies:
- **Beta exit = UXR personas adopted, pre-ship validation playbook live, lifecycle state machine wired, GrowthBook + i18n + JioID + WebSocket infra live, sandbox/playground for partners live.**
- **GA = 15 signature experiences live, Grand Kundali Reveal + Live Darshan + Cricket Companion + Fact Checker + Diagnostic-first coaching all shipped, JioID native SDK integrated, full zero-English-dependency audit cleared, automated notification orchestration, partner portal moved from advisory to hard-gate governance.**

---
*End of summary. See source PDFs in the project folder for the originals.*
