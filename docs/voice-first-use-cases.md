# JBIQ — Voice‑first use cases (Path A implementation spec)

This document is an implementation guide for extending the JBIQ prototype with the eleven future‑state use cases described in the Voice Plan. Hand this file to Claude Code with read access to the repo and ask it to implement against the existing patterns in `discovery.js`, `index.html`, `server.js`, and `docs/response-pattern-model.md`.

It is deliberately a **prototype/research** spec — every flow uses mock data. No real backend integrations (PM‑Kisan API, JustDial, Indane, JioPay) are required. The goal is to make these moments demoable for Round‑2 field research.

---

## 1. Context

JBIQ today ships as a broad voice assistant. The strategic direction is to narrow toward four transactional pillars:

- **Government & civic** — scheme eligibility, ration status, application support
- **Local services** — doctor, plumber, tutor, tailor
- **Recharge & bills** — Jio recharge, electricity, DTH, gas
- **Order & buy** — kirana reorders, milk, daily essentials, ₹50–500 ticket

The eleven use cases below exercise all four pillars and are intended to be the demoable spine for Round 2 user testing.

---

## 2. Constraints — what to extend, not invent

Use the existing schema. Do not introduce new card variants, new matcher mechanisms, or a separate prose response shape unless explicitly noted.

**Existing patterns to reuse:**

- `discovery.js` exports MOCK constants of shape `{ kind: 'discovery_view', sub_pattern: 'place'|'catalog'|'compare', state, subject, filters, sort, map?, collection, edge_affordance, voice_disclosure }`.
- `index.html` registers them in `DISCOVERY_QUERY_PATTERNS` (regex → view key) at ~line 3826 and resolves via `matchDiscoveryQuery(text)`.
- Each MOCK is also exposed on `window.MOCK_<NAME>` and registered in the prototype panel groups in `discovery.js` (search for `key: 'biryani_hyderabad'` to find the group definition pattern).
- Voice disclosure follows §15 four‑beat: outcome + anchor + shape + optional pivot. It is a **single string**, not a structured object — see `MOCK_PLUMBERS.voice_disclosure` for the canonical example.
- Edge affordance kinds: `see_more`, `compare`, `save_later`, `remind_later`, `context_shift`. The `query` field, when present, is seeded as the next user utterance.

**One new pattern needed — Informational responses.**

Two of the eleven use cases (PM‑Kisan status, ration card status) are **Informational** per Response Pattern Model §10 — a single‑status answer with no card collection. The current code routes everything through DiscoveryView. Recommended approach:

- Introduce a parallel constant `INFORMATIONAL_RESPONSES` in `discovery.js` of shape `{ kind: 'informational_response', subject, voice_disclosure, body_text, edge_affordance }`.
- Add a parallel matcher `INFORMATIONAL_QUERY_PATTERNS` in `index.html` and a `matchInformationalQuery(text)` function modelled on `matchDiscoveryQuery`.
- In the chat handler (around line 4234 where `discoveryKey` is computed), check informational match first; if hit, render as a styled prose card with the voice_disclosure spoken in voice mode and the body shown on screen, then offer the edge affordance.

If a simpler approach is to render an Informational response as a 1‑card DiscoveryView with no map/filters/sort, that's acceptable as an interim — but flag it in code so it can be normalised later.

---

## 3. Acceptance criteria (apply to every use case)

For each implemented use case:

1. The sample utterance triggers the matcher and renders the correct view.
2. Voice mode speaks the §15 four‑beat voice disclosure end‑to‑end.
3. Text mode renders the disclosure with the pivot beat stripped via the existing `stripVoicePivot` helper.
4. DiscoveryView use cases respect the §10.3 3‑card floor (initial render shows 3–5 cards).
5. The edge affordance is present and, if it has a `query` field, seeds a sensible next turn.
6. The new view appears in the burger Prototypes panel under the appropriate category group so testers can launch it directly.
7. No regressions to the existing 20 mocks.

---

## 4. The six primary use cases

### 4.1 — PM‑Kisan disbursal status (Government & civic)

**Persona:** Ramesh, farmer in Yavatmal. Reading the portal isn't realistic. Voice‑checks once a quarter when he hears about an installment.

**Sample utterances:**
- "PM Kisan ka paisa kab aayega mere account mein?"
- "PM Kisan installment status check karo"
- "Kisan samman nidhi ka next payment kab hai?"

**Suggested matcher (informational):**
```js
{ re: /\bpm\s*kisan|kisan\s*samman\s*nidhi|kisan\s*ka\s*paisa/i, view: 'pm_kisan_status' }
```

**Intent shape:** Informational (Response Pattern Model §10). No DiscoveryView. No card collection.

**Voice disclosure (§15 four‑beat):**
> "Aapki agli PM Kisan kisht ₹2,000 hai, 18 May tak Bank of Baroda account mein aa jayegi. Pichli kisht 14 February ko aayi thi. On screen — full status dekhein, ya alert lagaayein jab paisa aa jaaye?"

**Mock shape:**
```js
const INFO_PM_KISAN_STATUS = {
  kind: 'informational_response',
  subject: { title: 'PM Kisan installment status', subtitle: 'Aadhaar‑linked account · Bank of Baroda ****4521' },
  body_text: [
    { label: 'Next installment', value: '₹2,000 · expected by 18 May 2026' },
    { label: 'Last installment', value: '₹2,000 · received 14 February 2026' },
    { label: 'Eligibility', value: 'Active (12th installment claimed)' },
  ],
  voice_disclosure: "Aapki agli PM Kisan kisht ₹2,000 hai, 18 May tak Bank of Baroda account mein aa jayegi. Pichli kisht 14 February ko aayi thi. On screen — full status dekhein, ya alert lagaayein jab paisa aa jaaye?",
  edge_affordance: {
    label: 'Alert lagaayein jab paisa aaye',
    event: 'edge.pm_kisan.alert_on_disbursal',
    kind: 'remind_later',
    query: 'Mujhe alert kar dena jab PM Kisan ka paisa aa jaaye',
  },
};
```

---

### 4.2 — Plumber booking (Local services)

**Persona:** Asha, homemaker in Indore. Tap leaks. Doesn't know plumbers' names; typing English is friction.

**Already partially implemented** — `MOCK_PLUMBERS` exists. Two changes needed:

1. **Broaden the matcher** to catch Hinglish phrasing:
   ```js
   { re: /\b(plumber|nal\s*theek|nal\s*kharab|leak)/i, view: 'plumbers' }
   ```
   (currently only `/\bplumber/i` — misses "nal theek karne wala")
2. **Add a contextual variant** `MOCK_PLUMBERS_INDORE` for the Asha use case (different city, same shape) so we can run the script in T2 cities during Track B.

**Voice disclosure suggested upgrade (replace existing):**
> "4 plumbers free now in Andheri. Urban Company sabse paas — ₹349, 30‑min ETA, 4.8 stars. Mr Handy aur LocalPros bhi available; QuickFix busy hai. On screen — Urban Company tap karein, ya doosre suniyega?"

**Edge affordance (existing is fine):** `remind_later` with query "Remind me to book a plumber tomorrow morning".

---

### 4.3 — Mobile recharge (Recharge & bills)

**Persona:** Sayed, jeweller in a small T2 town. Currently asks his nephew to recharge his Jio number.

**Sample utterances:**
- "Mera recharge khatam ho raha hai, ₹299 wala lagao"
- "299 ka recharge karo"
- "Jio recharge 299"

**Already partially implemented** — `recharge_299` (Compare view) exists and matches `/\brecharge\b/i`. The Compare view is correct for "show me options"; we additionally need a **Transactional Single‑Path** variant for the case where the user has already named a plan ("₹299 wala lagao").

**Suggested:** Add a second matcher that detects the price marker and routes to a single‑plan confirm view:
```js
// Place this BEFORE the existing recharge regex
{ re: /\b(?:₹|rs\.?)?\s*(99|149|199|249|299|349|399|499|699)\s*(?:wala|ka|plan)?\s*(?:recharge|lagao|karo)/i, view: 'recharge_299_single' }
```

**New view `MOCK_RECHARGE_299_SINGLE`:**
- `sub_pattern: 'catalog'`, single‑card collection
- One card with the chosen plan's details (validity, data, calls, OTT bundles)
- Edge affordance kind: `compare` with `query: 'Doosre plans dikhao'`
- The card's primary CTA wires to the existing `handleConfirmAndPay()` flow at `index.html` ~line 4020. Reuse — do not duplicate the order‑confirmed UX.

**Voice disclosure:**
> "₹299 plan mil gaya — 28 din validity, 2GB rozaana, unlimited calls, JioCinema premium. Confirm karein? On screen — Confirm & Pay tap karein."

**Critical:** This is irreversible (money leaves the wallet). Per §14, the confirmation must be an explicit on‑screen tap. **Never** treat a voice "haan" / "yes" as commit. Reuse the existing Confirm & Pay overlay so this safety contract is enforced consistently.

---

### 4.4 — Pediatrician at 2 a.m. (Local services, emergency mode)

**Persona:** Priya, mother in Lucknow. Child has fever 102°F. Doesn't want to drive without checking.

**Sample utterances:**
- "Bachche ko bukhar hai, abhi koi pediatrician available hai paas mein?"
- "Doctor for child fever near me, open now"
- "Paas mein bachchon ka doctor abhi"

**Suggested matcher:**
```js
{ re: /\b(pediatrician|bachche?\s*(ka|ke)?\s*doctor|child.{0,15}doctor|bukhar|fever)/i, view: 'pediatricians_open_now' }
```

**Note:** The existing `/\b(doctor|fever|consult)/i` will fire first for "fever". Place the pediatrician regex **above** the generic doctor one so specificity wins.

**View shape:** `sub_pattern: 'place'`, 3‑card minimum.

**Card schema additions (new tag values, no new fields needed):**
- Tags include `Open now`, `Tele‑consult`, `Pediatric`.
- Status `kind: 'open'`, `label: 'Open · 24/7'` for the always‑open clinic.
- `primary_event` should be `place.pediatrician.<id>.call` and the renderer should treat `.call` events as a `tel:` link.

**Sample card (for one of three):**
```js
{
  variant: 'place',
  id: 'apollo_24x7',
  title: 'Apollo 24×7 Pediatrics',
  media: { alt: 'Apollo clinic exterior', fallback_color: '#A8C5DA' },
  rating: { value: 4.6, count: 1842 },
  distance_km: 2.3,
  price_label: 'Tele‑consult ₹399',
  tags: ['24/7', 'Tele‑consult', 'Pediatric'],
  status: { kind: 'open', label: 'Open · 24/7' },
  filter_ids: ['open_now', 'teleconsult', 'pediatric'],
  primary_event: 'place.pediatrician.apollo_24x7.call',
}
```

**Filters:** `Open now` (selected by default), `Tele‑consult`, `Within 5 km`, `Pediatric` (selected by default).

**Voice disclosure:**
> "3 pediatric clinics khule hain abhi. Apollo 24×7 sabse paas — 2.3 km, tele‑consult ₹399, 4.6 stars. Cloudnine aur Rainbow bhi open hain. On screen — Apollo ko abhi call karein?"

**Edge affordance:** `kind: 'context_shift'`, label "First aid tips bhi suniyega?", `query: 'Bukhar 102 mein bachche ko kya kare ghar pe'`.

---

### 4.5 — Cooking gas refill (Recharge & bills)

**Persona:** Kavita, retired teacher in Coimbatore. Tamil‑first speaker; types English with effort.

**Sample utterances (Hinglish for V1):**
- "Cylinder book karo, is hafte delivery"
- "Gas cylinder refill"
- "Indane cylinder book"

**Out of scope for V1:** the Tamil utterance "Cylinder book pannanum, indha vaaram delivery venum." This is a Track‑B research probe, not a V1 implementation target. Document the Tamil flow in `voice_disclosure_tamil_future` as a string field and leave a TODO so it surfaces when regional‑language work begins.

**Suggested matcher:**
```js
{ re: /\b(cylinder|gas\s*refill|indane|hp\s*gas|bharat\s*gas)/i, view: 'gas_refill' }
```

**View shape:** `sub_pattern: 'catalog'`, single primary card showing the user's connection + a Confirm & Pay CTA.

**Card content:** connection number masked, current cylinder count, last refill date, next available delivery slot, ₹903 price, distributor name.

**Voice disclosure:**
> "Indane connection mil gaya — Friday delivery available. ₹903. Confirm karein? On screen — Confirm & Pay tap karein."

**Edge affordance:** `kind: 'remind_later'`, label "Auto‑book next month bhi", `query: 'Har mahine apne aap cylinder book kar do'`.

**§14 commitment gate:** same as Recharge — irreversible action, on‑screen tap mandatory.

---

### 4.6 — Bus booking, Pune → Aurangabad (Mobility & travel)

**Persona:** Rohit, factory supervisor in Pune. Visits family in Aurangabad twice a month. Books from a phone at the end of his shift; typing dates and routes is tedious and he never knows which app is cheapest.

**Pillar note:** This use case extends JBIQ into a **fifth pillar — Mobility & Travel** — alongside the existing four (Government, Local Services, Recharge & Bills, Order & Buy). If we ship it, add a "Mobility & Travel" group to `DATASET_GROUPS` in `discovery.js` so the prototype panel reflects the new pillar. Cab booking (the canonical Choice‑Gated example in the Multi‑Partner Conflict Resolution Model §5.4) is the natural neighbour and should be drafted in the same sweep.

**Sample utterances:**
- "Pune se Aurangabad ki bus, kal raat ko"
- "Aurangabad jaane ki bus tomorrow night"
- "Bus book karo Pune to Aurangabad, kal"

**Suggested matcher:**
```js
// Place this BEFORE generic mobility patterns
{ re: /\bbus\b.{0,30}(book|booking|ticket)|\b([a-zA-Z]+)\s*se\s*([a-zA-Z]+)\s*(ki|ka)?\s*bus|\bbus\s*(from|to)\b/i, view: 'bus_choice' }
```

The matcher only resolves `bus_choice`. Origin, destination, and date come from existing slot extraction; if any are missing, fall back to a clarifying turn rather than rendering an empty partner picker.

**Intent shape:** Transactional Multi‑Option → **Choice‑Gated** per Multi‑Partner Conflict Resolution Model §5.4. The cab example in that doc ("Book a cab → present Ola, Uber, BluSmart as choice surface") is the template.

**Why Choice‑Gated, not Merged or Single‑Best:**
- Partner identity materially shapes outcome — inventory, cancellation policy, seat layout, refund window, and price for the same operator differ across RedBus, AbhiBus, MakeMyTrip, and state SRTCs.
- Merging routes risks misleading attribution (the same operator appearing with different prices on different aggregators).
- Single‑Best would silently pick a partner for a hard‑financial irreversible commitment, which violates Conflict Resolution §3 invariant 3 (default selection must be explainable) when the user has no learned preference yet.
- Per Conflict Resolution §9, high‑stakes intent + low‑confidence ranking escalates to Choice‑Gated regardless of intent class default.

**Two‑step view shape.** Step 1 picks the partner. Step 2 picks the bus inside that partner.

**Step 1 — Partner choice surface** (`sub_pattern: 'compare'`, but as a partner picker, not bus picker)
- 3 cards: **RedBus**, **AbhiBus**, **MSRTC Shivshahi** (Maharashtra State RTC).
- Each card carries the partner attribution glyph per Manifest §4.2 (badge logo + `display_name`), a one‑line headline (bus count + cheapest fare), and a one‑line differentiator ("Most options" / "Cheapest tonight" / "Govt · cash on board").
- Cold‑start budget per Conflict Resolution §7.1 applies if AbhiBus is newly verified — its ranking is artificially boosted for a bounded window so it stays visible against the incumbent.
- Monopoly cap per §7.2: if RedBus has fulfilled more than 70% of recent bus intents in the session window, equity adjustment demotes it slightly so MSRTC and AbhiBus do not disappear from the picker.
- Ranking trace is logged per §8.5 (high‑stakes intent → audit log entry: candidate set, applied filters, ranking signals, chosen strategy).

**Step 2 — Bus list within chosen partner** (`sub_pattern: 'compare'`, standard catalog shape)
- 3–5 bus cards: operator, departure → arrival, duration, bus type (AC sleeper / non‑AC seater / Volvo multi‑axle), seats remaining, fare, rating.
- Tags: `Boarding within 1km`, `Single seat`, `Live tracking`, `Free cancellation`.
- Filter chips: `AC`, `Sleeper`, `< ₹600`, `Departs after 9pm`.
- Tapping a bus card drills into a partner‑scoped seat picker (`SlotPickerView` per Manifest §4.4) → passenger details → canonical `CommitmentSummaryView` for payment.

**Per‑render attribution:** Every bus card in Step 2 carries the source partner badge on the card edge per Conflict Resolution §8.1. Attribution is non‑negotiable regardless of strategy.

**Mock shape (Step 1 — partner choice):**
```js
const MOCK_BUS_CHOICE_PUNE_AURANGABAD = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'partner_choice',
  subject: {
    title: 'Buses · Pune → Aurangabad',
    subtitle: 'Tomorrow night · 3 partners available',
  },
  filters: [],
  sort: { default: 'partner_equity_ranked' },
  collection: [
    {
      variant: 'partner',
      id: 'redbus',
      title: 'RedBus',
      attribution: { logo_uri: '/assets/partners/redbus.svg', tier: 'verified' },
      headline: '24 buses · from ₹420',
      detail: 'Largest selection · AC sleepers, Volvo multi‑axle, non‑AC',
      rating: { value: 4.4, count: 2840 },
      tags: ['Most options', 'Live tracking'],
      ranking_signals: ['autonomy_reinforced', 'sla_health'],
      primary_event: 'partner.bus.redbus.choose',
    },
    {
      variant: 'partner',
      id: 'abhibus',
      title: 'AbhiBus',
      attribution: { logo_uri: '/assets/partners/abhibus.svg', tier: 'verified' },
      headline: '18 buses · from ₹399',
      detail: 'Cheapest tonight · free cancellation till 6pm',
      rating: { value: 4.2, count: 1120 },
      tags: ['Cheapest', 'Free cancel'],
      ranking_signals: ['cold_start_budget'],
      primary_event: 'partner.bus.abhibus.choose',
    },
    {
      variant: 'partner',
      id: 'msrtc',
      title: 'MSRTC Shivshahi',
      attribution: { logo_uri: '/assets/partners/msrtc.svg', tier: 'verified' },
      headline: '6 buses · from ₹360',
      detail: 'State transport · Shivshahi & Hirkani · cash on board',
      rating: { value: 4.0, count: 410 },
      tags: ['Govt', 'Cash OK'],
      ranking_signals: ['locale_match', 'partner_equity_adjustment'],
      primary_event: 'partner.bus.msrtc.choose',
    },
  ],
  edge_affordance: {
    label: 'Yeh teen kyun?',
    event: 'edge.bus.why_these_partners',
    kind: 'context_shift',
    query: 'Why are you showing me these bus partners?',
  },
  voice_disclosure: "Pune se Aurangabad — kal raat ko 3 partners available. RedBus mein 24 buses, AbhiBus sabse sasti ₹399 se, MSRTC Shivshahi government wali. Aap kaunsa choose karenge? On screen — partner tap karein.",
  voice_disclosure_why: "Yeh teen partners isliye — RedBus aapne pehle use ki hai, AbhiBus iss route ke liye sabse sasti hai, aur MSRTC government option dikhane ke liye taaki alternatives bhi milein. Commercial weighting nahi lagi hai.",
};
```

**Mock shape (Step 2 — abbreviated, one collection per partner tap):**
- `MOCK_BUSES_REDBUS_PUNE_AURANGABAD` — 5 cards
- `MOCK_BUSES_ABHIBUS_PUNE_AURANGABAD` — 4 cards
- `MOCK_BUSES_MSRTC_PUNE_AURANGABAD` — 3 cards

Each follows the existing `compare` sub_pattern. Wire `primary_event` as `bus.<partner>.<bus_id>.select` → drills into the partner‑scoped `SlotPickerView` for seat selection.

**Voice disclosure (Step 1, partner choice — §15 four‑beat):**
> "Pune se Aurangabad — kal raat ko 3 partners available. RedBus mein 24 buses, AbhiBus sabse sasti ₹399 se, MSRTC Shivshahi government wali. Aap kaunsa choose karenge? On screen — partner tap karein."

The pivot beat ("On screen — partner tap karein") is stripped by `stripVoicePivot()` in text mode.

**Voice disclosure (Step 2, bus list — example for RedBus):**
> "RedBus mein 24 buses. Sabse pehle Volvo multi‑axle 9:30 raat — ₹720, 4.6 stars, single seat available. Neeta Travels aur Paulo Travels bhi popular. On screen — bus tap karein seat chunne ke liye."

**Edge affordances:**
- Step 1: `kind: 'context_shift'`, label "Yeh teen kyun?", `query: 'Why are you showing me these bus partners?'` — wires to the "Why this result?" surface per Conflict Resolution §8.2 and renders a plain‑Hinglish ranking explanation, not a JSON dump.
- Step 2: `kind: 'compare'`, label "Doosre partner ki buses dikhao", `query: 'Show me buses from another partner'` — bounces back to Step 1 with state preserved.

**§14 commitment gate:**
- Bus tickets are irreversible after the departure cutoff (varies by partner — typically 30–60 min before departure). Per Manifest §3 invariant 5, the commitment surface is owned by JBIQ regardless of which partner fulfils — partners do **not** display their own checkout.
- Seat selection (`SlotPickerView`) is partner‑scoped. Passenger details and final payment run through the canonical `CommitmentSummaryView` and `handleConfirmAndPay()` at `index.html` ~line 4020.
- Payment runs through the JBIQ payment broker; the partner only ever receives a tokenised payment reference (Manifest §7.4).
- Never treat a voice "haan" / "yes" as commit. On‑screen tap is mandatory.

**Transparency surfaces (per Conflict Resolution §8):**
- **Attribution per render** (§8.1): partner badge on every Step‑2 bus card and on the order‑confirmed view.
- **"Why this result?"** (§8.2): the Step‑1 edge affordance returns the plain‑language ranking trace — which partners were filtered out, what equity adjustment was applied, whether commercial weighting influenced order (must be zero, undisclosed weighting is an invariant violation per §3 invariant 4).
- **Partner Preferences** (§8.3): "Mujhe hamesha RedBus se book karo" sets `bus_partner_default = redbus` per‑domain, never global. Surface is reachable from any bus‑fulfilled output. Editable and resettable.
- **Audit Log** (§8.5): every Step‑1 resolution is logged in the Compliance Ledger with the candidate set, applied filters, ranking signals, chosen strategy, and fulfilment outcome.

**Manifest fields exercised:** Each partner registers a manifest entry with `canonical_intent: discovery.timeslot.travel.bus`, `primitive: DiscoveryView (compare)` for the bus list, `commitment_level: hard‑financial`, `risk_tier: high`, `signals_required: [origin, destination, date]`, `signals_optional: [class_preference, boarding_point]`, `autonomy_max_level: 1` (high‑risk financial — conservative ceiling, always Choice‑Gated until learned preference is established).

**Acceptance criteria additions specific to this use case:**
- Matcher fires on at least three phrasings: full English, Hinglish, transliterated Hindi.
- Step 1 always renders all eligible verified partners; equity adjustment is visible when the monopoly cap would otherwise be breached.
- Tapping a partner card seeds the next utterance with route/date/partner context so Step 2 does not re‑ask.
- "Yeh teen kyun?" returns plain‑language ranking explanation in the user's session locale.
- Confirm & Pay routes through `handleConfirmAndPay()` — never auto‑commit on voice "haan."
- Partner attribution badge appears on every Step‑2 bus card and on the order‑confirmed view.
- The new view appears in the burger Prototypes panel under a new "Mobility & Travel" group.
- Adding the new pillar group does not regress the four existing pillar groups.

**Out of scope for V1 prototype (mock‑only):**
- Real partner inventory (no live RedBus / AbhiBus / MSRTC API calls — use the mock collections).
- Seat map rendering — placeholder `SlotPickerView` with 6 fake seats is sufficient.
- Refund / cancellation flow.
- Multi‑leg journeys (e.g. Pune → Mumbai → Aurangabad with transfers).
- Partner equity simulation (cold‑start budget consumption, monopoly cap counter, demotion decay) — surface the *concept* in the why‑this‑result string and the ranking_signals tags, but don't wire the actual ledger.
- Tamil / Telugu / Kannada / Bengali ASR for this flow. Document a `voice_disclosure_marathi_future` string for Step 1 (Marathi is the natural regional candidate for the Pune → Aurangabad route) and leave a TODO.

---

## 5. Six supporting use cases (lighter spec — match the patterns above)

These round out the four pillars enough for Track B to test breadth alongside depth. Same MOCK shape, same matcher pattern, abbreviated specs.

### 5.1 — Ration card status (Government & civic)
- Intent: Informational (use the same `INFORMATIONAL_RESPONSES` mechanism as 4.1)
- Matcher: `/\bration\s*card|fps\s*shop/i` → `'ration_status'`
- Body fields: card status (Active / Expired), category (APL / BPL / AAY), dependents listed, nearest FPS shop with stock
- Voice disclosure: status + last update + nearest FPS shop with current stock + pivot

### 5.2 — Scholarship lookup for daughter (Government & civic)
- Intent: Transactional Multi‑Option (Compare)
- Matcher: `/\bscholarship|chhatravriti|wazifa/i` → `'scholarships_12th_sc'`
- 3 scheme cards with eligibility, deadline, application link, last‑year recipients count
- Edge affordance: `save_later`, "Mujhe deadline ke pehle yaad dilana"

### 5.3 — Maths tutor for Class 10 (Local services)
- Intent: Transactional Multi‑Option (Place)
- Matcher: `/\b(tutor|tuition|coaching).{0,40}(class\s*10|maths|board)/i` → `'tutors_maths_class10'`
- 3–4 tutor cards: name, subject, ₹/hour, distance, ratings, "first class free" badge
- Filter chips: `Under ₹500/hr`, `Home tuition`, `Online`, `Weekend only`

### 5.4 — Diwali blouse tailoring (Local services)
- Intent: Transactional Multi‑Option (Place)
- Matcher: `/\b(tailor|silwana|blouse|stitching)/i` → `'tailors_diwali'`
- 3 tailor cards: name, distance, ratings, ₹ rate, "same‑day delivery" tag where applicable
- Edge: `compare`, "Top 3 ka comparison dikhaayein"

### 5.5 — Kirana reorder (Order & buy)
- Intent: Transactional Multi‑Option → Single‑Path Confirm & Pay
- Matcher: `/\b(maggi|haldi|atta|chini|reorder|kirana|raashan)/i` → `'kirana_reorder'`
- Cart card built from utterance ("Maggi 5 packets aur ek dabba haldi") with line items, ₹ total, delivery slot
- Edge: `context_shift`, "Saari list dikhaao", `query: 'Meri full kirana list batao'`
- §14 commitment gate on Confirm & Pay

### 5.6 — Milk subscription edit (Order & buy)
- Intent: Transactional Single‑Path (subscription mod)
- Matcher: `/\bdoodh|milk.{0,15}(subscrip|delivery|kal\s*se)/i` → `'milk_subscription_edit'`
- Single card: current subscription details (500ml / day) → new subscription (1L / day from tomorrow), price diff, confirm CTA
- Voice disclosure: "Doodh kal se 1 litre ho jayega — ₹15 zyada per day. Confirm karein?"
- §14 commitment gate

---

## 6. Where to make changes (file‑by‑file)

**`discovery.js`**
- Add new MOCK constants for use cases 4.2 (Indore variant), 4.3 (single‑plan recharge), 4.4 (pediatricians), 4.5 (gas refill), 5.2 (scholarships), 5.3 (tutors), 5.4 (tailors), 5.5 (kirana cart), 5.6 (milk subscription).
- Add `INFORMATIONAL_RESPONSES` constant with entries for 4.1 (PM Kisan) and 5.1 (ration status).
- Expose each on `window` (mirror the existing `window.MOCK_*` pattern).
- Register each in the prototype panel `DATASET_GROUPS` under the appropriate category group ("Government", "Local Services", "Recharge & Bills", "Order & Buy"). Add the four new groups if needed.

**`index.html`**
- Extend `DISCOVERY_QUERY_PATTERNS` (~line 3826) with the new regex → view mappings. Order matters — place specific patterns above generic ones (e.g. pediatrician above doctor, single‑plan recharge above the comparison recharge).
- Add `INFORMATIONAL_QUERY_PATTERNS` and `matchInformationalQuery(text)` modelled on the existing matcher.
- In the chat handler near line 4234 where `discoveryKey` is computed, check informational match first; if hit, render via a new `renderInformationalResponse()` helper.
- Implement `renderInformationalResponse()` in the same style as the existing DiscoveryView renderers in `discovery.js` — card‑shaped prose, voice disclosure spoken in voice mode and shown (pivot stripped) in text mode, edge affordance pill below.

**`server.js`**
- Update the system prompt to acknowledge the four pillars (Government, Local Services, Recharge & Bills, Order & Buy) and to reinforce that **transactional commitments are always confirmed by an on‑screen tap**, never by a voice "yes."
- No new model calls or routing required — these all run on Claude Sonnet via the existing `/api/chat` endpoint.

**`docs/`**
- Reference this file from `docs/response-pattern-model.md` so future contributors find the worked examples next to the spec.

---

## 7. Out of scope for this implementation

Do not implement these now — they are research probes for Round 2 or future engineering work:

- Real backend integration (PM‑Kisan API, NPCI/UPI rails, JioPay SDK, IndianOil cylinder API, scheme deadline data feeds). All flows mock‑only.
- Tamil / Telugu / Kannada / Bengali ASR + response. Document the desired regional‑language voice disclosure as a `voice_disclosure_<lang>_future` string field for one or two cases (4.5 cylinder is a good candidate) but do not wire ASR for them.
- Server‑side session persistence across reloads (the long‑prompt recovery work).
- localStorage draft‑save / resume.
- Bundle splitting and minification.

These are tracked separately as engineering tasks; the goal of this document is to make the four pillars demoable for Round‑2 research, no more.

---

## 8. Self‑check before handing back

Before declaring done, run through:

- [ ] Does each matcher fire on at least three different phrasings (English, Hinglish, Indic transliteration)?
- [ ] Does every Confirm & Pay flow route through the existing `handleConfirmAndPay()` and never auto‑commit on voice "yes"?
- [ ] Do all DiscoveryView‑shaped use cases initial‑render with 3+ cards (§10.3 floor)?
- [ ] Does every voice disclosure end with a §15 pivot beat that is stripped by `stripVoicePivot()` in text mode?
- [ ] Are the new view keys discoverable from the burger Prototypes panel under their pillar group?
- [ ] No regression to the existing 20 mocks (run the prototype panel through every entry).

Report back what shipped, what didn't (and why), and any spec ambiguity that was resolved by judgement during implementation.
