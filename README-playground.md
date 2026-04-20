# JBIQ Discovery Playground

Schema-validation playground for the JBIQ `DiscoveryView` contract. One HTML file, 20 queries across three sub-patterns (Place × 6, Catalog × 7, Compare × 7), one source of styling truth. Runs on the existing Express server; no new dependencies.

## Run

```bash
npm start               # existing server.js, no changes needed
open http://localhost:3000/place-playground.html
```

The repo's `server.js` does `express.static(__dirname)` ([server.js:8](server.js:8)), so the playground is served automatically. Filename stayed `place-playground.html` for link stability even though the content now covers all three sub-patterns.

## Why one HTML file

The playground is a schema validation tool, not production UI. A single self-contained file:

- slots into the existing static server with zero build step,
- sits beside `index.html` so anyone familiar with the prototype can open it,
- preserves the four disciplines that matter (schema, primitives, tokens, no libraries) without a React toolchain.

What we gave up: compile-time type checks. What replaces them: JSDoc shapes + a runtime validator that runs on every mock.

## File map

All three artifacts live at the repo root:

- [place-playground.html](place-playground.html) — the one file that does everything.
- [SCHEMA-NOTES.md](SCHEMA-NOTES.md) — stress-test findings across all 20 queries + recommendation on card variant count before React Native.
- [README-playground.md](README-playground.md) — this file.

## Inside `place-playground.html`

The `<script type="module">` block is organised into clearly-labelled sections. Jump to a section by searching for its marker:

| Marker | Purpose |
| --- | --- |
| `// === tokens ===` | JS mirror of the `:root` CSS custom properties (JDS-sourced). Single source of truth. |
| `// === schema (JSDoc) ===` | `@typedef`s for `DiscoveryView` family: `PlaceResultCard`, `CatalogResultCard`, `CompareOption`, `CompareRow`, etc. |
| `// === validator ===` | `validateCommon` + per-sub-pattern rules + `validateDiscoveryView` dispatcher. |
| `// === primitives ===` | 9 render functions. Shared (SubjectHeader, FilterChipBar, SortControl, CollectionContainer); Place-only (LocationContext, MapPanel, PlaceResultCard); Catalog-only (CatalogResultCard); Compare-only (CompareTable). |
| `// === composition ===` | `renderDiscoveryView` — runs the validator, dispatches on `sub_pattern`. |
| `// === mocks ===` | 20 `MOCK_*` objects, grouped Place / Catalog / Compare. |
| `// === playground ===` | Grouped `<optgroup>` dropdown, mobile frame, validator panel, delegated event listeners. |

CSS sits in a single `<style>` block at the top of the file. Every declaration uses `var(--…)`; the only hex literals outside `:root` + the JS token mirror are in the explicitly-marked schematic map SVG section and in `media.fallback_color` data fields on cards (schema-sanctioned content).

## Sub-pattern cheatsheet

| Sub-pattern | Anchor | Collection shapes | Card variant |
|---|---|---|---|
| **Place** | geo (map + location_context) | `carousel` only | `place` — media + rating + distance + price tier |
| **Catalog** | no geo | `carousel`, `grid`, `list` | `catalog` — media + rating + price_label + temporal_label + specs |
| **Compare** | no geo | `table` only | `compare` — sticky-label-column + scroll-snap option columns with emphasis |

## How interactivity works

Primitives emit event *strings*, not state transitions. In vanilla JS this is expressed via `data-event` attributes on interactive elements:

- A card carries `data-event="place.restaurant.britannia.open"` (or `catalog.*`, `compare.*`).
- A filter chip carries `data-event="filter.toggle.open_now"`.
- A `<select>` carries `data-event-prefix="sort.change"`; the emitted event is `${prefix}.${selectedValue}`.
- In Compare, each option **column** is the tappable button — cells within are visual-only.

A single delegated `click` listener (and one `change` listener for selects) on the playground root reads these attributes and `console.log`s. Open DevTools and pick any of the 20 queries to see the event stream for that sub-pattern.

## What's out of scope

No commitment flows, no detail views, no navigation. This is `PARTIAL_RESULT_SHOWN` only. Cards/options log on tap; that is the entire interaction surface.

## Next steps

Read [SCHEMA-NOTES.md](SCHEMA-NOTES.md) for the three additive field proposals (`price_label`, `distance_label`, `temporal_label`) and the variant-count recommendation — all should land in the schema before React Native primitive work begins.
