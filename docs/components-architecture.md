# GeoVarat IQ — Component System Architecture

A scalable system for translating any partner's MCP tools into the GeoVarat IQ conversation, across any vertical, without bespoke design or engineering work per partner.

---

## The problem, stated plainly

GeoVarat IQ is a voice-first assistant with a visual companion. Voice carries the conversation. The visual surface carries what voice can't say well — comparisons, maps, lists, transactions, live state. When a partner connects their MCP server (Swiggy, Skyscanner, Spotify, Practo — anyone), we need to translate **whatever their tools return** into something that fits this surface, in any vertical, without a custom design pass per partner.

The wrong answer is "a card library." Cards alone don't account for voice timing, comparison rhetoric, transaction safety, or live state. The right answer is a **three-layer translation system** that turns partner tool output into a `{voice, visual, replies}` triplet, using a small, vertical-agnostic vocabulary.

---

## The three layers

### Layer 1 — Semantic entities (the universal vocabulary)

Every partner output normalizes to one of ten primitives. This is the Esperanto. New verticals don't add new primitives — they recombine these.

| Primitive | What it is | Examples across verticals |
|---|---|---|
| **Place** | A physical location | Restaurant, hotel, clinic, gym, store, airport |
| **Item** | A selectable / buyable thing | Menu item, product, ticket, service slot, prescription |
| **Person** | A human in the flow | Doctor, host, driver, agent, instructor |
| **Schedule** | Time-anchored event | Showtime, flight, appointment, reservation |
| **Transaction** | Stateful commercial action | Cart, order, booking, prescription refill |
| **Media** | Consumable content | Track, episode, article, video, course |
| **Route** | A path through space/time | Delivery route, flight, itinerary, navigation |
| **Status** | A state report | Order tracking, lab result, weather, system |
| **Choice** | A decision needed | Confirm, quick reply, multi-select, dismiss |
| **Collection** | A grouping of any of the above | Search results, inbox, history |

Partners describe their tool output through a **manifest** that maps fields to primitives. They don't describe UI — they describe *meaning*. The system handles the rest.

### Layer 2 — Components (the rendering library)

A small, opinionated library, each component typed to one or more primitives. The renderer picks based on (a) entity type, (b) cardinality, (c) conversational context, (d) surface affordances.

**Eleven entity-rendering components cover ~95% of cases** (full spec in `components-spec.md`):

EntityCard · ComparisonGrid · List · Map · Timeline · Tracker · CartPanel · ReceiptPanel · ChoiceChips · MediaPlayer · Gallery

Two additional **system primitives** sit alongside the entity-rendering set — they are never authored in a manifest, the renderer drops them in:

- **SubjectHeader** — title block at the top of every Discovery view, with optional partner-attribution row (brand chip + partner name).
- **ConfirmPanel** — the mandatory interrupt before any Transaction tool fires. See §"Trust & safety as a system property" below and `components-spec.md` §3.

So 13 components total ship in the canonical library, but the partner-facing surface area is the eleven entity renderers.

The library is closed by default. Adding a new component requires a design review and a vertical justification. This is the discipline that keeps the system coherent across partners.

### Files & roles — where the components actually live

The component system is one CSS file with many consumers. To avoid drift:

- **`components.css`** — single source of truth for tokens and primitive CSS. Edit a token or a primitive here and it propagates to every surface that links the file.
- **`components-overview.html`** — the live catalogue. Demonstrates each component across verticals; it consumes `components.css` but does not define styles.
- **`components-playground.html`** — interactive pipeline prototype (tool output → mapped entity → renderer pick → component → voice + visual). Consumer of `components.css`.
- **`place-playground.html`** — schema sandbox for partner manifests and scenarios. Consumer of `components.css`. Renders its primitives through a local copy of the discovery renderer.
- **`index.html` + `discovery.css` + `discovery.js`** — the main app. `discovery.js` produces the canonical DOM; `discovery.css` ships only the chat-surface scoping (`.jbiq-discovery` wrapper, full-bleed rails) on top of `components.css`.

Authoring rule: *primitives live in `components.css`; surface chrome lives in the consuming file.* If you find yourself writing the same selector twice in two HTML files, you're editing the wrong file.

### Layer 3 — Voice ↔ visual choreography (the contract)

Every render in GeoVarat IQ is a triplet, not a screen.

```
Frame {
  voice:    spoken_script    // with optional SSML, persona, pace
  visual:   { component, entities, focus, theme }
  replies:  expected_intents[]   // verbal AND tap
}
```

The two surfaces stay in sync via:

- **Anchors.** Voice mentions "the second one" → visual highlights `entities[1]`. Voice does this by emitting `<focus ref="entities[1]"/>` markers in the script.
- **Reply contracts.** Every component declares the intents it expects. The intent router normalizes "yes / sure / book it" → `confirm`; "the cheap one / lowest price" → `select(min:price)`. Partners don't write NLU — they declare intents.
- **Graceful fallback.** Voice-only mode (driving) collapses comparisons to verbal summaries; visual-only mode (silenced) suppresses the script and surfaces reply chips.

---

## The two integration paths

### Path A — Schema-mapped (declarative). For the 80% case.

The partner ships a `geovarat.manifest.json` next to their MCP server. It maps tool outputs to primitives via JSONPath. The renderer auto-picks the component, the voice template, and the reply contract.

```json
{
  "partner": "swiggy",
  "version": "1.0.0",
  "theme": "warm",
  "voice_persona": "casual_friendly",
  "tools": {
    "search_restaurants": {
      "shape": "Collection<Place>",
      "render_hint": "compare_when_few",
      "items": "$.restaurants[*]",
      "fields": {
        "id": "$.id",
        "title": "$.name",
        "subtitle": "$.cuisine_type",
        "rating": "$.rating",
        "image": "$.images[0]",
        "facts": [
          {"label": "ETA",      "value": "$.delivery_time", "unit": "min"},
          {"label": "Price",    "value": "$.price_band"},
          {"label": "Distance", "value": "$.distance_km",   "unit": "km"}
        ]
      },
      "actions": [
        {"intent": "view_menu", "label": "View menu",
         "tool": "get_restaurant_menu", "with": {"restaurant_id": "$.id"}}
      ]
    }
  }
}
```

**Strengths:** zero rendering code on the partner side. Fully versioned. Validated in CI. The platform can A/B test components and voice templates without partner involvement.
**Limits:** can't express truly custom layouts (a workout rep counter, a music waveform, a 3D AR overlay).

### Path B — Component primitives (SDK). For the 20% case.

When a partner needs a layout the schema can't express, they import the SDK and compose primitives directly. They still respect tokens, voice contracts, and intent contracts.

```jsx
<Frame voice="Here's your run from this morning.">
  <Tracker entity={runStatus} primary="distance">
    <Map route={runStatus.route} />
    <FactRow facts={[
      { label: "Pace",   value: "5:32 /km" },
      { label: "Time",   value: "32:14" },
      { label: "HR avg", value: "148" },
    ]}/>
  </Tracker>
  <Replies expected={["share", "save", "compare to last week"]}/>
</Frame>
```

The SDK is just the schema components exposed as JSX, wrapped in a `Frame` that enforces the voice/visual/replies triplet. **Schema is the on-ramp; SDK is the escape hatch.** Most partners never need the SDK.

---

## How the system actually scales

### 1. One vocabulary, infinite verticals
Adding Travel doesn't add components — flights are `Schedule+Place`, hotels are `Place+Item`, baggage tracking is `Status+Route`. The same `Tracker` that renders Swiggy's "delivery in 4 mins" renders Delta's "your bag is at carousel B" and Practo's "doctor will see you in 12 mins."

### 2. Theming is a thin layer over the library
Each partner declares a theme token bundle (palette, type, density, persona, motion) — never a redesign. Swiggy: warm orange, casual voice, dense lists. NHS appointment booking: calm blue, clinical voice, generous spacing. Same component class, different costume.

### 3. Capability negotiation
Partners declare what their MCP can do — `read`, `transact`, `track`, `notify`. The same `EntityCard` renders without a buy button for read-only partners. `ChoiceChips` collapse to dismissable info chips when no action is registered. The renderer never crashes on missing capability — it degrades.

### 4. Versioning at three levels
Components are semver'd. Manifests pin component versions. Breaking changes ship as new components (`EntityCard.v2`), not mutations. Old manifests keep working until the partner upgrades. The renderer keeps the last three majors of every component live.

> **2026-05-11 erratum.** The layout container previously named `.collection-container` (with `--list / --grid / --carousel` modifiers) was renamed to `.collection` as part of the source-of-truth refactor. This is the one historical breaking change in the library to date — no codemod was required because the change preceded any external partner adoption. From this point onward the versioning policy applies in full: future breaks ship as `EntityCard.v2`-style new components, not renames. See `components-spec.md` §6 Changelog for the migration note.

### 5. Uniform telemetry
Every component emits the same events: `impression`, `focus`, `action`, `dismiss`, `abandon`. One funnel report works across every partner. Swiggy's "search → cart → order" and Practo's "search → book → confirm" share the same metric shape, so platform-level optimization is possible — drop-off at `focus → action` is comparable across verticals.

### 6. Vertical packs as recipes, not new code
A "Travel pack" is a curated bundle of manifest snippets, default themes, and voice persona presets — not new components. Onboarding a travel partner becomes a 2-day exercise rather than a 2-month one. The packs are maintained by the platform team; partners pick one and customize the deltas.

### 7. Trust & safety as a system property
Every `Transaction` primitive routes through a centralized confirm step (visual + voice readback) before the tool actually executes. Partners can't bypass it. GeoVarat IQ never accidentally orders the wrong thing — the surface, not each partner, owns the safety story. This becomes the core trust argument when onboarding regulated verticals (health, finance).

### 8. Governance via manifest validation
Partner manifests validate against a JSON Schema in CI before deploy. Voice templates run through a copy review pass (length, persona, brand). Themes pass an accessibility check (contrast, type size). Bad partners can't ship bad UX — the gate is upstream of the renderer.

---

## Worked example — Swiggy MCP through the system

Swiggy's Builders Club exposes 18+ tools across Food, Instamart, and Dineout. Their Food MCP includes: `search_restaurants`, `search_menu`, `get_restaurant_menu`, `update_food_cart`, `get_food_cart`, `place_food_order`, `track_food_order`.

Their `geovarat.manifest.json` maps each tool:

| Tool | Entity | Component | Voice template (excerpt) |
|---|---|---|---|
| `search_restaurants` | `Collection<Place>` | `List` (≥5) or `ComparisonGrid` (2–4) | "I found {count} places. Top one is {entities[0].title}…" |
| `get_restaurant_menu` | `Collection<Item>` grouped | `List.sectioned` | "Their menu has {section_count} sections. Want recommendations?" |
| `update_food_cart` | `Transaction.building` | `CartPanel` | "Added. That's {total}. Anything else?" |
| `place_food_order` | `Transaction.confirmed` | `ReceiptPanel → Tracker` | "Order placed. ETA {eta}." |
| `track_food_order` | `Status<Route>` | `Tracker` w/ `Map` inset | "Your food is {minutes_away} mins away." |

A user says *"I want pad thai."* The orchestrator calls `search_restaurants`. Three results return. The renderer picks `ComparisonGrid` (cardinality = 3, comparable facts present). The voice template fills: *"Three places near you do pad thai. Top is Soi 7 — 4.5 stars, ₹320, 25 minutes."* User says *"second one."* Intent router → `select(entities[1])`. Orchestrator calls `get_restaurant_menu` for Soi 7. Renderer picks `List.sectioned`. And so on through cart, confirm, receipt, tracker.

**The partner wrote no UI code.** They wrote a manifest.

---

## Cross-vertical proof

The same library handles every vertical. The variation is theme + manifest, not new components.

| Vertical | Example partner | Tools | Mapped entities | Components used |
|---|---|---|---|---|
| **Food** | Swiggy | search_restaurants, place_order, track_order | `Collection<Place>`, `Transaction`, `Status<Route>` | List, ComparisonGrid, CartPanel, Tracker |
| **Travel** | Skyscanner | search_flights, book_flight | `Collection<Schedule+Place>`, `Transaction` | ComparisonGrid, Timeline, ReceiptPanel |
| **Entertainment** | Spotify | search_tracks, play, queue_add | `Collection<Media>`, `Status` | Gallery, MediaPlayer |
| **Health** | Practo | search_doctors, book_appointment | `Collection<Person>`, `Schedule`, `Transaction` | List, Timeline, ReceiptPanel |
| **Commerce** | Amazon | search_products, add_to_cart | `Collection<Item>`, `Transaction` | List, CartPanel |
| **Fitness** | Strava | get_activities, log_run | `Collection<Status>`, `Status<Route>` | Timeline, Tracker w/ Map |

Same library. Same voice/visual/reply contract. Same telemetry. Different theme, persona, and vertical-pack voice templates.

---

## What this means in practice

**Partner onboarding** drops from "a project" to "a manifest review." A vertical that today takes 8–12 weeks of design + eng work to integrate becomes a 3–5 day exercise: the partner writes a manifest, the platform team reviews, themes are picked, voice templates are tuned, ship.

**Platform optimization** becomes possible because every partner emits the same telemetry shape. We can A/B test `ComparisonGrid` vs `List` *across all partners at once* and measure conversion lift on a single dashboard. That kind of leverage is impossible with a per-partner UI.

**The surface gets better for everyone simultaneously.** When we ship `Tracker.v2` with smoother live updates, every partner using `Status<Route>` benefits the day they pin the new version. No partner-by-partner rollouts.

**Regulated verticals (health, finance) become reachable.** Because the confirm flow, telemetry, and accessibility live at the platform layer, GeoVarat IQ can credibly carry HIPAA-relevant or PCI-relevant flows without each partner re-litigating safety from scratch.

---

## Open questions for the team

1. **Where does the manifest live?** Co-located with the MCP server (partner-owned) or in a central GeoVarat registry (platform-owned)? Recommendation: partner-owned, registry-validated, signed.
2. **Do we expose the SDK publicly from day one?** Recommendation: no — schema only for the first 6 months. SDK opens after the schema covers ≥80% of submitted use cases. This forces vocabulary improvements rather than escape-hatch usage.
3. **Voice templates: who owns them?** Recommendation: partners draft, platform reviews. A central "voice review" team owns brand-voice consistency.
4. **What's the minimum viable component library to launch?** Recommendation: the eight high-frequency components — EntityCard, ComparisonGrid, List, CartPanel, ReceiptPanel, ChoiceChips, Tracker, Map. Ship Timeline, MediaPlayer, Gallery in v1.1.
