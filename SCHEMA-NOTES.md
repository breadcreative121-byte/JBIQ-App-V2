# SCHEMA-NOTES — Discovery stress-test findings

Stress-test output from running 20 intentionally-divergent queries through a single `DiscoveryView` schema family and one set of render primitives. The queries span three sub-patterns (Place × 6, Catalog × 7, Compare × 7) drawn from the working sub-pattern matrix. The question we're answering: **does the `DiscoveryView` family — one schema, three card variants, one composition — hold up across the full range, or does it need to fork before React Native?**

## Headline

**The family holds.** One composition, three card variants (`place`, `catalog`, `compare`), eleven primitives, no data-set-specific renderer branches. All 20 mocks validate and render. The work surfaced **three schema additions** (`price_label`, `distance_label`, `temporal_label`) that land now rather than after RN work begins, and **one semantic rename recommendation** (`status_label` is doing too much in Catalog). No variant split needed.

---

## Place (6 queries) — findings

### Gentle: `restaurants`
Baseline. Every field populated. Renderer reference shape.

### `biryani_hyderabad` — rank-led
- **Observation P1 — `badge` field on the card.** Ranked queries ("best", "top 10") want a prominent visual rank signal. Added `badge?: string` to `PlaceResultCard` (also available on `CompareOption` + `CatalogResultCard`). Used in `biryani_hyderabad` for `#1 / #2 / #3`; in `schools_bandra` for `Top rated`; in `compare` mocks for `Lowest rate / Cheapest / Best camera`. One field, three uses — good sign the abstraction is right.

### `doctors`
D1. `price_level` is restaurant-shaped — resolved by adding `price_label`.
D2. Sparse-meta cards (rating only) render thin but remain valid. Intended flex; no schema change.
D3. `tags` does unstructured double-duty (specialty + seniority). Keep as display surface; domain-structured filter data is out of scope.
D4. `rating.count` semantic varies by domain (doctors 30–300 vs restaurants 2,000+). Not a schema fix — a render/confidence concern.

### `plumbers` — immediate-availability + non-tier price
- **Observation P2 — `price_label` absorbs per-visit pricing cleanly.** `'₹349/visit'`, `'₹250/visit'` render in the price slot without any schema changes beyond the already-recommended `price_label`. Confirms D1's proposal generalises.
- **Observation P3 — `status.kind: 'closing_soon'` with label `'Busy · 2hr ETA'`.** The `status.kind` enum (`open | closing_soon | closed`) is modelled on restaurant hours. For services, "busy" is semantically different from "closing soon" but renders identically (orange badge). Current render is acceptable; next revision should consider broadening `status.kind` to `'available' | 'degraded' | 'unavailable'` or similar, with `closing_soon` as a specific case.

### `schools_bandra` — comparative specs + rating-optional
- **Observation P4 — `specs` handles comparative attributes well (`['CBSE', 'K-12', '₹3.2L/yr']`).** Same shape apartments use; works across both. Confirms `specs` as a general-purpose "comparable attributes" field, not listing-specific.
- **Observation P5 — rating-optional remains valid.** `Learners Academy` has no rating (new branch) but has distance + specs; rule 10 (`distance_km | rating | status`) passes on distance alone. No issues.

### `apartments`
A1. `specs` accommodates the listing shape well. No change.
A2. Rent is `price_label`, not `price_level` — resolved.
A3. `distance_km` semantics drift (distance from metro, not user) — resolved by `distance_label`.
A4. Meta-row absence is a visual rhythm shift. Intended flex, not a defect.

---

## Catalog (7 queries) — findings

### `kurta_diwali` — product grid
- **Observation C1 — `grid` layout on `CollectionContainer` lands clean.** 2-column grid of media-led tiles with price_label. Same primitive (`CollectionContainer`) handles carousel, grid, list via one prop. The Catalog sub-pattern doesn't need a separate container primitive.
- **Observation C2 — `subtitle` (seller name) pulls its weight.** Catalog cards frequently need a second identifying line below the title ("FabIndia", "Manyavar", "Biba"). Added as optional on `CatalogResultCard`. Absent from Place (Place uses tags + subject area for context); justifies a per-variant field rather than pushing onto the shared schema.

### `gifts_wedding` — price range + same-day temporal
- **Observation C3 — `price_label` handles RANGES without schema work.** `'₹1,999 – ₹4,999'` is just a string. The narrow `price_level` literal (`'₹'|'₹₹'|'₹₹₹'|'₹₹₹₹'`) would have needed a range variant. `price_label` as free-form string sidesteps this entirely.
- **Observation C4 — `temporal_label` as service window.** `'Same-day delivery'` is temporal information but not a time. Fits cleanly into the `temporal_label` field alongside "Fri 8pm · 3 shows" and "42 min". The field is generalising well across content types.

### `movies_weekend` — showtime-led
- **Observation C5 — `temporal_label` is the primary anchor for temporal content.** Movies lead with showtime ("Fri 8pm · 5 shows"), not price. `price_label` is often omitted. Rule: Catalog cards need `primary_event` + at least one of `price_label | rating | temporal_label | status_label`. Movies pass on rating + temporal_label.

### `devotional_morning` — audio duration as temporal
- **Observation C6 — duration lands in `temporal_label` ('42 min', '1h 5min').** Same field, third semantic (schedule / delivery / duration). The name `temporal_label` captures this breadth. Alternatives considered — `duration_label`, `time_label` — were narrower. Stay with `temporal_label`.

### `courses_datascience` — list + spec-heavy
- **Observation C7 — `list` layout renders as horizontal rows** (media left, content right). Added via CSS variant on `CollectionContainer`. No new primitive. `specs: ['11 courses', 'Beginner', 'English', 'Certificate']` carry the comparative attributes.
- **Observation C8 — `price_label: 'Free'`.** Free-form string swallows zero-price cases effortlessly. Tier-based schemas would have needed a `Free` enum value.

### `ipl_today` — live status
- **Observation C9 — `status_label` overloads.** The same field carries `'Live · 14.3 overs'`, `'Toss done · RCB bowl'`, and (elsewhere) `'Active'`, `'Applications open'`. The renderer differentiates "Live" (red badge, via `catalog-card__status-badge--live`) from the default dark badge. This is brittle — it's regex-based. Proposal: rename to `status: { kind: 'live' | 'info' | 'new' | 'closing', label: string }` mirroring Place's `status.kind`. Keep `status_label` as a back-compat string alias. Not landing now — mocks still work — but flagging for RN.

### `schemes_farmers` — list, no rating, deadline-anchored
- **Observation C10 — `specs` + `temporal_label` carry ALL the meta.** `specs: ['Landholding < 2ha', '₹6,000/yr', 'DBT to bank']` + `temporal_label: 'Applications open · 17th instalment'`. No rating, no price_label. Passes validation on the combination. Demonstrates the schema's slot-based design works for civic-service content.
- **Observation C11 — public-service queries may need `authority_label`.** Subtitle currently carries "Ministry of Agriculture & Farmers Welfare". That's a ministry/authority tag, conceptually distinct from the seller-like subtitle on shopping cards. Rendering is fine (subtitle works), but a future `authority` field could enable filter-by-ministry. Not needed now.

---

## Compare (7 queries) — findings

### `home_loans` — percentage-heavy, recommended option
- **Observation X1 — `emphasis: 'best' | 'worst'` renders cleanly.** Purple (primary-50) for best, muted text-low for worst. Works for rate (lower=better), EMI (lower=better), cover (higher=better). The schema does NOT encode "lower is better" / "higher is better" — the mock author decides. This is fine and keeps the schema small; a future optimisation could move directionality to the row definition (`row.direction: 'lower_is_better'`).
- **Observation X2 — `recommended_id` on `header` tints a full column.** `primary-30` surface. Visual anchor. Works, and is a cheap alternative to adding a `recommended: true` flag per option.

### `flights_mumbai` — time-heavy
- **Observation X3 — 4 options fit the 140px × 1.8-visible pattern.** User scrolls horizontally to see airlines 3 and 4. Scroll-snap keeps columns aligned. At 5+ options the sticky-label-column approach would feel cramped; worth noting as a Compare-design ceiling (max ~6 options before UX degrades).

### `recharge_299` — identical-price comparison
- **Observation X4 — Compare works even when the pivot (price) is FIXED.** `recharge_299` fixes price at ₹299; the comparison is entirely on benefits. The `emphasis: 'best'` rows (Data/day, OTT) carry the differentiation. Shows Compare is not just a price-comparison pattern.

### `phones_20k` — 6-row spec grid
- **Observation X5 — Multiple rows can have `'best' | 'worst'` emphasis across different options.** Redmi wins storage + camera; Samsung wins battery + price; Realme takes worst battery. No single "best overall" — the user is expected to weigh. The schema allows any mix, and the renderer doesn't sum. Correct modelling.

### `trains_tatkal` — 6 rows incl. "+1 day" arrivals
- **Observation X6 — Cell values are free-form strings (`'07:40 +1'`).** No type constraints. Good — timezones, +1 day markers, fuzzy info all fit. Rendering is just `textContent`.
- **Observation X7 — `duration` row has TWO cells marked `'best'` (Rajdhani + Duronto tied within a minute).** Renderer handles correctly — both cells styled. Ties are common in real data; forcing a single "best" would falsify.

### `health_insurance` — mixed-direction emphasis
- **Observation X8 — Premium (lower=better) and Cover (higher=better) both resolve via author-chosen `emphasis`.** Reinforces X1: schema stays dumb, mock author owns semantics. Simpler.

### `emi_fridge` — computed values, 4 rows
- **Observation X9 — Compare is useful for computed-from-same-principal scenarios.** Monthly EMI and Total interest are derived from the same ₹32,990. The table makes the tradeoffs readable. Works with 3 options, 4 rows — probably the floor of useful Compare.

---

## Cross-cutting: schema additions

Beyond the `price_label` and `distance_label` already recommended in the Place-only pass, Catalog surfaced a third:

| Field | Applies to | Purpose |
| --- | --- | --- |
| `price_label` | Place, Catalog | Free-form price (non-tier): "₹349/visit", "Free", "₹1,999 – ₹4,999" |
| `distance_label` | Place | Disambiguates what distance is measured to: "from you", "from metro" |
| `temporal_label` | Catalog | Time-anchored signal: showtime, duration, delivery window, deadline |

All three are additive optional strings. No existing data breaks.

## Cross-cutting: primitive reuse

Adding Catalog and Compare to an initially-Place-only playground produced:
- **4 new primitives** (`CollectionContainer` consolidating carousel/grid/list, `CatalogResultCard`, `CompareTable`, and the tacit `EmptyState` cleanup) — up from 7 to 11.
- **Zero forking of the shared primitives.** `SubjectHeader`, `FilterChipBar`, `SortControl`, and the `el()` helper are unchanged and service all three sub-patterns.
- **One sub-pattern-specific primitive each for Place (`LocationContext`, `MapPanel`) and Compare (`CompareTable`).** Catalog adds only its card variant; it reuses the shared `CollectionContainer` entirely.

This is strong evidence the "one composition, variant-per-collection" rule holds up. Each Catalog query uses a different layout (`carousel` / `grid` / `list`), and this is achieved with a single `CollectionContainer` primitive taking a layout prop — no primitive multiplication.

---

## Final recommendation

**Ship the `DiscoveryView` family with three card variants (`place`, `catalog`, `compare`) as the React Native target.** Do not split into separate top-level schemas per sub-pattern. Do not merge the variants into a single "universal card" — the field sets diverge enough that it would require negative-space fields (e.g., `never_rating_for_apartments` nonsense) to work.

Land these before RN implementation begins:

1. `price_label?: string` on `PlaceResultCard` and `CatalogResultCard` (additive; renderer prefers it over `price_level` when both present).
2. `distance_label?: string` on `PlaceResultCard`.
3. `temporal_label?: string` on `CatalogResultCard`.
4. Consider replacing Catalog's string `status_label` with a `{ kind, label }` shape mirroring Place's `status` (so "Live" / "New" / "Applications open" differentiate visually without regex). Not blocking.
5. Consider broadening Place's `status.kind` enum to cover service-availability semantics (`'available' | 'busy' | 'unavailable'` alongside restaurant hours). Not blocking.

## Deferred for RN handoff

1. **`secondary_events`** remains schema-only in this playground. Belongs to `COMMITMENT_REQUIRED` (detail view), not `PARTIAL_RESULT_SHOWN`.
2. **Row directionality** in Compare (`lower_is_better` / `higher_is_better`) could enable automatic emphasis tagging. Currently mock authors mark `emphasis` manually — acceptable for static data, would help when views are AI-generated.
3. **JDS token resolution notes**: spacing/radii snap to the JDS scale cleanly; the brief's "JDS primary orange" placeholder was wrong — actual JDS primary is purple (`primary-50: #6d17ce`). Prior mockups relying on orange primary need reconciliation.
