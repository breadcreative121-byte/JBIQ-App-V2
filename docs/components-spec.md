# GeoVarat IQ — Component System Spec

The design system, in detail. Every component, every contract, every token. This document is the source of truth for partner manifests and SDK builds.

---

## 1. Design tokens

Every theme is a bundle of these tokens. Partners override **a theme**, not individual components. Themes ship as JSON and are validated for accessibility (contrast, type size) before merge.

### Color (semantic)

The canonical token names live in [`components.css`](../components.css) `:root`. The table below maps each semantic role to the actual variable name as shipped. (An earlier draft of this spec used aliases like `--accent` and `--surface-0`; the implementation chose JDS-aligned names instead. Use the right-hand column when writing CSS.)

| Role | Token (shipped) |
|---|---|
| Primary action, focus state | `--color-action-primary` |
| Hover state for primary action | `--color-action-primary-hover` |
| Selection / soft action background | `--color-action-primary-surface` |
| Page / canvas background | `--color-surface-tertiary` |
| Component background | `--color-surface-primary` |
| Elevated surface (cart totals, modal) | `--color-surface-secondary` |
| Primary text | `--color-text-primary` |
| Secondary text | `--color-text-secondary` |
| Tertiary text, captions | `--color-text-tertiary` |
| Text on a filled primary background | `--color-text-on-primary` |
| Hairline border | `--color-border-default` |
| Stronger border (interactive controls) | `--color-border-strong` |
| Dark overlay (badges on photos) | `--color-overlay-dark` |
| Warning overlay (badges on photos) | `--color-overlay-warning` |
| Status — open (solid, off-media) | `--color-status-open` |
| Status — closing soon (solid, off-media) | `--color-status-closing-soon` |
| Status — closed (solid, off-media) | `--color-status-closed` |
| Confirm states, success | `--color-success` |
| Caution states | `--color-warning` |
| Destructive, errors | `--color-error` |
| Feedback error background | `--color-feedback-error-bg` |
| Feedback error text | `--color-feedback-error-text` |
| Feedback error border | `--color-feedback-error-border` |

### Partner brand tokens

Single-partner surfaces (subject header, brand chip) render a partner-coloured circular swatch above the title. The swatch colour is a canonical token, not a per-partner stylesheet — adding a partner means one PR to `components.css`:

| Token | Partner |
|---|---|
| `--swiggy` (chip `--swiggy`) | Swiggy — orange |
| `--zomato` (chip `--zomato`) | Zomato — red |
| `--vrl` (chip `--vrl`) | VRL Travels — red |

Governance: a new partner colour is submitted as a PR adding a new `.subject-header__brand-chip--<partner>` rule, paired with a contrast check against `#ffffff` chip text (WCAG AA on the chip foreground/background pair).

### Type
- Display: 28/32 — used sparingly (receipt totals, hero numbers)
- Title: 20/26 — component headers
- Body: 16/22 — primary text
- Label: 13/16 — facts, metadata
- Caption: 11/14 — system, timestamps

Density modes: `cozy` (default), `compact` (lists ≥10), `roomy` (regulated/health).

### Motion
- `--motion-fast`: 120ms — focus, hover
- `--motion-mid`: 220ms — component enter/exit
- `--motion-slow`: 380ms — frame transitions
All motion respects `prefers-reduced-motion`.

### Voice persona presets
- `casual_friendly` (default for commerce/food)
- `concise_neutral` (default for travel/utility)
- `warm_clinical` (default for health)
- `playful_energetic` (default for entertainment/fitness)
- Custom personas allowed with a 200-line voice review.

---

## 2. Components

Every component spec includes: entity types accepted, layout, voice template, replies (intents), states, and variants.

### SubjectHeader
A layout primitive — not an entity renderer — that captions every Discovery view. When a single partner owns the answer, it surfaces a partner-attribution row (brand chip + partner name) ABOVE the title in a dedicated row.

- **Entities:** none (layout primitive — wraps any component group)
- **Layout:** Optional partner row (18 × 18 px brand chip + partner name) → title → subtitle
- **Authoring:** System-rendered. Partners do not author SubjectHeader; the renderer assembles it from the frame's metadata (`title`, `subtitle`, `partner`).
- **States:** default, multi-partner (no chip row), partner-attributed (chip + name)
- **Variants:** brand chip is canonical-tokened — `--swiggy`, `--zomato`, `--vrl` ship today. Add new partner colours in `components.css` (see §1 — Partner brand tokens).

### EntityCard
The atomic unit. A single thing — a place, an item, a person, a piece of media.

- **Entities:** `Place | Item | Person | Media` (single)
- **Layout:** Hero image (16:9 or 1:1), title, subtitle, fact row (1–4 facts), primary action, optional secondary actions
- **Voice template:** *"{title} — {top_facts[0].label} {top_facts[0].value}, {top_facts[1].label} {top_facts[1].value}."*
- **Replies:** `select`, `dismiss`, `more_info`, `compare_to(other)`
- **States:** default, focused (voice anchored), loading (skeleton), error (retry CTA)
- **Place-entity sub-states (badge variants):** when the entity is a `Place`, the card's status badge can render as one of three modifiers — `--open`, `--closing-soon`, `--closed`. The badge sits on the media; backgrounds use `--color-overlay-dark` (open / closed) and `--color-overlay-warning` (closing-soon). Solid off-media equivalents are available via `--color-status-open / --closing-soon / --closed` for use in lists or pills not sitting on photos.
- **Variants:** `compact` (single fact), `full` (3+ facts), `media-led` (image dominant), `inline` (in a list)

### ComparisonGrid
For 2–4 things being weighed against each other. The voice rhetoric here is "this one is X, that one is Y" — the grid surfaces shared axes.

- **Entities:** `Collection<Place|Item|Person|Schedule>` where `2 ≤ count ≤ 4`
- **Layout:** Side-by-side cells, shared fact axes across the bottom, "best in" markers per axis
- **Voice template:** *"Comparing {count}. {entities[0].title} is the {best.axis_a}; {entities[1].title} is the {best.axis_b}."*
- **Replies:** `select(index)`, `filter(criteria)`, `sort(axis)`
- **States:** default, comparing (axis selected, others dim), result (one cell elevated)
- **When the renderer picks this:** cardinality 2–4, ≥2 numeric facts in common, no `render_hint: "list_only"`.

### List
For ≥5 things, or when items are best browsed sequentially.

- **Entities:** `Collection<*>`
- **Layout:** Vertical scroll, optional filter bar, optional sort menu, optional sectioning
- **Voice template:** *"{count} results. Top three are {entities[0..2].title}. Want me to filter?"*
- **Replies:** `select`, `filter(facet, value)`, `sort(axis)`, `scroll`
- **Variants:** `flat`, `sectioned` (e.g., menu by category), `with-map` (split view, pairs with Map), `dense` (compact rows)

### Map
For spatial entities — single Place, multiple Places, or a Route.

- **Entities:** `Place | Collection<Place> | Route`
- **Layout:** Map canvas, pins, route polyline, inset card on selection
- **Voice template:** *"{count} places shown."* or *"Route is {duration}, {distance}."*
- **Replies:** `select(pin)`, `zoom`, `recenter`
- **Pairs with:** `List` (split-view) and `Tracker` (inset)

### Timeline
For schedules — flights, appointments, showtimes, sequences of events.

- **Entities:** `Collection<Schedule>`
- **Layout:** Time axis (vertical or horizontal), events as duration bars, "now" marker, day breaks
- **Voice template:** *"{count} events. Next is {next.title} at {next.time_friendly}."*
- **Replies:** `select`, `scroll_time`, `add_to_calendar`
- **Variants:** `agenda` (vertical, dense), `gantt` (horizontal, with overlaps), `single_day`

### Tracker
For live state — a delivery in progress, a flight in the air, a doctor running late.

- **Entities:** `Status | Status<Route>`
- **Layout:** Large status pill, progress bar, ETA, optional inset Map (if Route), step trail (3–5 steps)
- **Voice template (live):** *"Your {label} is {minutes_away} away."* / *"{stage_name} of {total_stages}."*
- **Replies:** `notify_when(condition)`, `share`, `cancel`, `contact`
- **Lifecycle:** Subscribes to status updates; auto-dismisses on terminal state (delivered, completed, cancelled)
- **The system owns the polling cadence.** Partners declare "expect updates every N seconds," not the polling code.

### CartPanel
Transactions in build state. Building is a *separate* state from confirmed — cart edits are cheap and reversible.

- **Entities:** `Transaction.building`
- **Layout:** Line items (with qty + remove), subtotal, fees breakdown, total prominent, primary CTA `Review`
- **Voice template:** *"{item_count} items. {total}. Anything else?"*
- **Replies:** `add(item)`, `remove(item)`, `change_quantity(item, qty)`, `checkout`, `dismiss`
- **Safety contract:** Never finalizes. Always hands off to the system-owned **Confirm flow** before any tool execution.

### ConfirmPanel
The system-injected interrupt that sits between `CartPanel` and `ReceiptPanel`. Partners cannot author or skip it; the renderer drops it in front of any tool execution that mutates state. See §3 for the full Confirm flow.

- **Entities:** `Choice` (system-injected; not partner-authored)
- **Layout:** Secondary-surface card with a tight prompt, a one-line transaction summary, a prominent total in display-size, and a two-button action row (`Cancel` secondary + `Confirm` primary)
- **Voice template:** *"Just to confirm — I'm placing your order for {summary}. Total {total}. Should I go ahead?"*
- **Replies:** `confirm`, `cancel`, `re-prompt` (ambiguous reply triggers a second pass)
- **States:** prompt, awaiting, executing, error (retry CTA)

### ReceiptPanel
Transactions in confirmed or completed state.

- **Entities:** `Transaction.confirmed | Transaction.completed`
- **Layout:** Confirmation banner, line items, totals, payment summary, tracker handoff (if applicable)
- **Voice template:** *"Done. {total} charged. {tracker_handoff_phrase}."*
- **Replies:** `track`, `share`, `get_invoice`, `repeat_order`

### ChoiceChips
Small, fast decisions. The conversational interrupt that says "before we go further, which?"

- **Entities:** `Choice`
- **Layout:** Horizontal row of chips (2–6). Single-select default; multi-select declared per chip.
- **Voice template:** *"{prompt}? {options[0].label} or {options[1].label}?"*
- **Replies:** `select(option_id)`, `dismiss`
- **Degraded form:** With no action registered, chips render as dismissable info tags.

### MediaPlayer
A single piece of consumable media being played.

- **Entities:** `Media` (single)
- **Layout:** Artwork, title, artist/source, scrubber, transport controls (play/pause/skip), volume
- **Voice template:** *"Playing {title} by {artist}."*
- **Replies:** `pause`, `resume`, `skip`, `previous`, `volume(level)`, `queue(item)`

### Gallery
A collection of Media — albums, video catalog, course library.

- **Entities:** `Collection<Media>`
- **Layout:** Grid (2–3 cols) or carousel
- **Voice template:** *"{count} {media_type}s. Top one is {entities[0].title}."*
- **Replies:** `select`, `scroll`, `filter(facet)`, `play_all`

---

## 3. The system-owned Confirm flow

Every Transaction execution routes through the same four-step flow. Partners cannot bypass it. Copy is templated from manifest values; partners can theme but not skip.

1. **Pre-confirm voice readback.** *"Just to confirm — I'm placing your order for {summary}. Total {total}. Should I go ahead?"*
2. **Visual confirm.** Large, two-button affordance — `Confirm` (primary, accent color) and `Cancel` (secondary). Total prominent. Line items collapsed-but-expandable.
3. **Execute.** Only on explicit affirmative — verbal ("yes", "go ahead", "confirm") or tap. Ambiguous replies ("maybe", "I think so") trigger a second pass: *"I want to be sure — yes or no?"*
4. **Receipt.** `ReceiptPanel` renders. Voice ack. Tracker handoff if applicable.

**Why this lives at the platform layer:** because the day a partner ships a bug that orders the wrong thing, it's GeoVarat IQ's reputation, not the partner's. We own the safety, so we own the flow.

---

## 4. The manifest contract (v1.0)

The full schema. Validated in CI. Partners author this; the platform reviews and signs.

```json
{
  "$schema": "https://geovarat.iq/schemas/manifest/v1.json",
  "partner": "string",
  "version": "semver",
  "theme": "string | object",
  "voice_persona": "casual_friendly | concise_neutral | warm_clinical | playful_energetic | custom_id",
  "capabilities": ["read", "transact", "track", "notify"],
  "tools": {
    "<tool_name>": {
      "shape": "EntityType | Collection<EntityType>",
      "render_hint": "list_only | compare_when_few | media_led | timeline | tracker | cart | receipt",
      "items": "JSONPath",
      "fields": {
        "id":       "JSONPath",
        "title":    "JSONPath",
        "subtitle": "JSONPath",
        "image":    "JSONPath",
        "rating":   "JSONPath",
        "facts": [
          { "label": "string", "value": "JSONPath", "unit": "string?", "compare_axis": "boolean?" }
        ],
        "location": { "lat": "JSONPath", "lng": "JSONPath", "address": "JSONPath?" },
        "schedule": { "start": "JSONPath", "end": "JSONPath?", "tz": "JSONPath?" },
        "status":   { "stage": "JSONPath", "stages": "JSONPath", "eta": "JSONPath?" }
      },
      "actions": [
        { "intent": "string", "label": "string",
          "tool": "string", "with": { "<param>": "JSONPath" },
          "requires_confirm": "boolean" }
      ],
      "voice_template": "string with {placeholders}",
      "expected_replies": ["intent_id", "..."]
    }
  },
  "fallbacks": {
    "voice_only": { "max_count_read_aloud": 3 },
    "visual_only": { "default_to": "List" }
  }
}
```

### Authoring rules

- **JSONPath only** — no JS, no transformations. If a field needs computation, the partner does it server-side and returns it ready.
- **Voice templates** are length-bounded by persona (casual_friendly: ≤25 words; warm_clinical: ≤35 words).
- **Every action that mutates state** must declare `requires_confirm: true` if `capability: transact` is registered. Validation fails otherwise.
- **Image URLs must be HTTPS** and pass a CDN check at validation time.

---

## 5. Telemetry — uniform across all components

Every component emits these events. One funnel report works across every partner.

| Event | When | Payload |
|---|---|---|
| `impression` | Component first renders | `component`, `entity_count`, `frame_id`, `partner` |
| `focus` | Voice anchors or user taps | `entity_id`, `source: "voice"\|"tap"` |
| `action` | User triggers an action | `intent`, `entity_id`, `result: "ok"\|"error"` |
| `dismiss` | User dismisses without action | `dwell_ms` |
| `abandon` | User leaves frame without resolving | `dwell_ms`, `last_focus` |
| `frame_transition` | Renderer moves to next frame | `from`, `to`, `cause` |

Partners receive their slice; the platform receives the full firehose for cross-partner optimization.

---

## 6. Versioning policy

- **Components**: semver. Renderer keeps the last 3 major versions live.
- **Manifests**: pin component versions per mapping; default to "latest minor."
- **Breaking changes** ship as new components (`EntityCard.v2`), not mutations.
- **Deprecations** announce 6 months ahead, with a migration codemod for manifests.
- **The schema itself** is versioned (`$schema` URL pin); the platform supports the last 2 major schema versions.

### Changelog

- **2026-05-11 — Breaking: `.collection-container` → `.collection`.** The layout container that wraps cards (formerly `.collection-container` + `--list / --grid / --carousel`) was renamed to `.collection` + `--list / --grid / --carousel`. No codemod required — find-and-replace is sufficient. The renderer's function name `renderCollectionContainer` is retained; only the CSS class string output changed. The old name is fully retired across `components.css`, `discovery.css`, `discovery.js`, `place-playground.html`, `components-playground.html`, and `components-overview.html`.

---

## 7. Accessibility (non-negotiable)

- Contrast: WCAG 2.1 AA minimum on every theme; AAA target on health/finance themes.
- Type size: 16px minimum body across all densities; 13px minimum for labels.
- Touch targets: 44×44pt minimum.
- Voice-only mode parity: every visual component has a verbal equivalent. Anything that can be done by tap can be done by voice.
- Reduced motion: every transition has a `motion: none` fallback.
- Screen reader: every component ships with a labeled landmark and a verbal summary that the screen reader can read instead of (not in addition to) walking the DOM.

---

## 8. What's deliberately *not* in v1

- **Custom components.** Partners can't ship their own. The escape hatch is the SDK with system primitives.
- **Free-form text input fields.** Voice + ChoiceChips covers ~all cases; text input is a fallback only.
- **Embedded web views.** Partner can't embed an iframe. If they need a custom view, they use the SDK.
- **Notifications.** Out of scope for v1; lives on the surface layer, not the component system.
- **Multi-partner composition.** A frame renders one partner's data at a time. Cross-partner orchestration (e.g., "book a flight and a hotel") is a separate orchestrator concern.

These constraints are the discipline. Loosen them, and the system fragments. Hold them, and it scales.
