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

## 4. The five primary use cases

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
