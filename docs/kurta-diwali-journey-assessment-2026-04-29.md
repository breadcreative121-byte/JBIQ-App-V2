# "Shop for a kurta for Diwali" — Gap Assessment

## Context
Same shape as `kurta-diwali-journey-assessment` for the plumber booking. Walks the kurta-Diwali shopping flow end-to-end and cross-checks against `voice-build-assessment-2026-04-29.md`, `voice-build-fix-plan-2026-04-29.md`, `voice-first-use-cases.md`, `response-pattern-model.md`, `app-review-2026-04-24.md`.

**Headline up front:** the kurta journey is a *discovery-only* flow. There is no completion path at all. After the carousel, every onward step (detail, size/colour, cart, address, pay, confirm, ship, deliver, return) is missing. This is structurally different from the plumber flow, which has the full intent-to-confirm rail; kurta has roughly the first third of one.

---

## The journey, as a user actually walks it

| # | Step | Where it lives | What happens | Verdict |
|---|---|---|---|---|
| 1 | Entry — voice or text from home | `index.html:3180`, `index.html:3400` | Same Speak tooltip / text pill as elsewhere | ✅ |
| 2 | Intent capture | `index.html:4055` | Single regex `/\bkurta/i` → view `kurta_diwali` | ⚠ very thin (G1) |
| 3 | Thinking + voice disclosure | `index.html:4910–4926`, `4950–4998` | TTS speaks 4-beat disclosure; pivot stripped in text | ✅ disclosure copy is §15-clean |
| 4 | DiscoveryView render (catalog) | `discovery.js:1815–1917` | 5 cards (men/women, ₹899–₹3,299), 5 filter chips, 3-option sort, "See more" edge affordance | ✅ chips wired (G2 resolved, see below); ⚠ context line leaks a count (G3), card count varies between data and audit (G4) |
| 5 | User taps a card | `discovery.js:1843–1900` (cards), `index.html:3126–3138` (handler) | Event `catalog.kurta.<brand>.open` fires; handler only acts if there's a `query` field. Cards have no query. | ❌ tap is a no-op (G5) |
| 6 | User says "Buy / order this kurta" | n/a | `kurta_diwali` is **not** in `TRANSACTIONAL_VIEW_PRODUCTS` (`index.html:4142–4179`); no booking-intent or shopping-intent entry maps to a kurta | ❌ no commit path (G6) |
| 7 | Detail screen | — | None. No PDP, no images carousel, no reviews, no size guide. | ❌ (G5) |
| 8 | Size / colour / qty select | — | None. | ❌ (G7) |
| 9 | Address + delivery slot | — | None. Shopping flows have no `serviceAddress` analog. | ❌ (G7) |
| 10 | Confirm & Pay (§14) | `index.html:4360–4417` exists for other flows | Never invoked for kurta — there is no entry point | ❌ (G6) |
| 11 | Order Confirmed + tracking | `index.html:4537–4630` framework exists | Never invoked for kurta | ❌ (G6) |
| 12 | Suggested follow-up prompts | `discovery.js:1815–1917` | **Not authored.** MOCK_KURTA_DIWALI has no `suggested_prompts` field (cf. plumbers at `1681–1685`) | ⚠ (G8) |
| 13 | Edge affordance ("See more") | `discovery.js:1905` | Defined in data, but no render slot in schema (universal gap M5) | ⚠ (G9) |

---

## Gaps from intent → completion

### G1 — Intent matcher is one English word **[P0]**
- `index.html:4055`: `{ re: /\bkurta/i, view: 'kurta_diwali' }`. That's the entire surface.
- The canonical Hinglish utterance from the spec — *"Diwali ke liye kurta dhundo"* — works only because it contains the substring "kurta".
- Misses: *"festive ke liye kuch dikhao"*, *"Diwali ke liye kapde"*, *"sherwani"*, *"ethnic wear"*, *"kurta pajama"*, *"chikan"*, *"anarkali"* (despite an Anarkali being in the cards), *"bhabhi ke liye suit"*.
- Build-plan ticket **C4** owns Hinglish breadth globally; nothing kurta-specific has been authored.

### ~~G2 — Refinement chips are dead code~~ **[RESOLVED — verified 2026-04-29]**
- ~~Same universal critical-finding **C2** as the plumber assessment. Chips ([Men] [Women] [Under ₹2k] [Silk] [Cotton]) render and look interactive; tap is `console.log` only.~~
- **Status:** dispatch is fully wired at `discovery.js:4247–4297`. Verified end-to-end in browser: 5 cards → tap "Women" → 3 cards (Biba, Soch, Jaipur Kurti) → also tap "Cotton" → 2 cards (Biba, Jaipur Kurti). AND-logic, multi-select, deselect-to-restore all working. The audit doc that flagged this as broken is stale.
- The chip-tap path goes: `data-event="filter.toggle.<id>"` → delegated click handler at `discovery.js:4247` → mutates `wrapper.__jbiqView.filters.chips[i].selected` → `rerenderDiscoveryView()` → `deriveDisplayView()` (`discovery.js:1040`) filters cards by `filter_ids` ∩ `selectedIds`.
- Sort is wired by the same mechanism (`discovery.js:4282–4297`).

### G3 — Context line carries a count instead of a signal **[P1]**
- Subject is two fields: `title: "Kurtas for Diwali"` + `subtitle: "240+ styles · Delivery by Nov 10"` (`discovery.js:1819`).
- Response Pattern Model §6 says the Context Line should be one sentence carrying *signal*, not filler. Spec example: *"Kurtas for Diwali — delivery before Nov 5"*.
- "240+ styles" is the textbook violation: a count, not a signal. Audit ticket **P1-2**.

### G4 — Card count drift vs. spec cap **[P0/P1]**
- Spec cap (§10.3): 3–5 for catalogs.
- Current dataset has 5 visible cards (`discovery.js:1843–1900`). Audit doc references a 6th (`anita_groom_sherwani`) flagged for removal under ticket **C5**. Either it's been removed and the audit is stale, or it's still present and not in the explored excerpt.
- Either way: no validator enforces the cap (audit **P2-2**), so future drift goes undetected.

### G5 — Card tap is a no-op (no detail view) **[PARTIALLY RESOLVED — 2026-04-29]**
- ~~`index.html:3126–3138` only navigates if `detail.query` is set. Catalog cards don't set one.~~ ✅ catalog card taps now open a bottom-sheet detail view. New helper `showCatalogDetailSheet(card)` at `index.html:4565`. Wired into the existing `jbiq-discovery-event` listener at `index.html:3290` — pattern `/^catalog\.[^.]+\.[^.]+\.open$/` resolves the card via `wrapper.__jbiqView.collection.cards.find(c => c.primary_event === detail.name)`.
- Sheet content: title, brand subtitle, Price / Rating (★ + count) / Details (tags) / Badge rows, an honest "More photos, fit notes and reviews are TODO" note, a primary "Buy now" button, and a "Close" button. Reuses the `.booking-sheet` CSS so the visual is consistent with G5 plumber.
- "Buy now" closes the sheet then fires `showResponse('Order the {brand} {title}')` — which routes through SHOPPING_CATALOG (G6) to a real Confirm & Pay card with FabIndia / Manyavar / Biba / Soch / Jaipur Kurti data. End-to-end §14 reachable via natural carousel → tap → buy flow.
- Verified: tap FabIndia card → sheet opens with "Silk blend Nehru kurta · FabIndia · ₹1,499 · 4.4★ (1,820) · Silk · Men"; tap Buy now → real FabIndia Confirm & Pay card; Esc / backdrop click / Close button all dismiss; tapping Manyavar / Biba cards opens sheets with the right titles. No console errors.
- **Still open:** photos beyond the card thumbnail, fit notes, customer reviews, fabric-care info, size guide, similar items. The sheet is honest about this rather than faking it. For a Round 2 demo this proves the spine; a real product needs the rest.

### G6 — There is no purchase path **[PARTIALLY RESOLVED — 2026-04-29]**
- ~~`kurta_diwali` is absent from `TRANSACTIONAL_VIEW_PRODUCTS`.~~ ~~The `SHOPPING_CATALOG` covers groceries only.~~ ~~Net: even if a user *said* "Buy the FabIndia silk kurta", nothing routes it to a confirm card.~~ ✅ five kurta SKUs added to `SHOPPING_CATALOG` at `index.html:4490–4495` (FabIndia silk Nehru ₹1,499; Manyavar dhoti ₹3,299; Biba Anarkali ₹2,199; Soch palazzo ₹1,899; Jaipur Kurti ₹899). Each carries real brand, name, fabric+gender+size qty, price, and "Delivery by Nov 10" eta — matching the cards in MOCK_KURTA_DIWALI.
- Verified end-to-end: "Order the FabIndia kurta" → renders Confirm & Pay card with **FabIndia · Silk blend Nehru kurta · Silk · Men · M · ₹1499** → tap Confirm & Pay → order-confirmed card with Processing → Shipped → Delivered stages, "Your order is confirmed" heading, "Download Receipt" CTA. §14 commitment gate intact (voice "haan" interception unchanged).
- **Side fix:** the order-confirmed card was hardcoding `'Quality: 1'` for non-booking flows, both a typo and a regression (it ignored `product.qty`). Changed to `product.qty || 'Quantity: 1'` at `index.html:4546–4548`. Coffee orders now show "100 g jar"; kurta orders now show "Silk · Men · M".
- Discovery flow unchanged — "Shop for a kurta for Diwali" still renders the carousel; only explicit "buy/order [brand] [item]" utterances reach §14.
- Generic phrasings ("Buy a kurta") still fall through to the existing JioMart Pick fallback (₹199 placeholder) — that's pre-existing behaviour, not new debt.
- **Still open:** detail view on card tap (G5), size/colour variant picker (G7), no out-of-stock state, no real cart, no real address picker. The picture is: §14 is now *reachable* for kurta, but only via voice/text intent — not via the carousel-tap path users would normally use.

### G7 — Size, colour, address, slot, payment **[blocking for any real shopping]**
- Apparel is variant-heavy: size (S/M/L/XL/XXL), colour, length, occasionally fit. None of this is modelled in card schema or in the shopping card.
- No address selection UI, no slot picker, no payment-method choice. (`paymentStatus: 'paid'` is hardcoded in the booking flows that do exist; for shopping it's not even stubbed.)

### G8 — No suggested follow-up prompts **[P1]**
- MOCK_KURTA_DIWALI has no `suggested_prompts` field (the plumbers and other catalogs do).
- Voice users especially need scaffolded next-utterance hints: *"Show me only cotton"*, *"Under ₹1,500"*, *"Women's only"*, *"What's the return policy?"*, *"Will it arrive before Diwali?"*. None present.

### G9 — Edge affordance ("See more") not rendered **[P1]**
- `edge_affordance` is in the data with a query of *"Show me more kurtas for Diwali"*, but the universal **M5** schema gap (no edge slot) means it's not rendered. Same gap as plumbers.

### G10 — Festive urgency is text only **[P1 specific to this flow]**
- Diwali falls Nov 1, 2026. Cards show "Arrives Nov 2 / Nov 3" *as static strings*. There's no clock, no urgency surface, no "order in next 6h to arrive before Diwali" affordance, no out-of-window guard.
- Failure mode: user shops on Oct 31, taps a card with "Arrives Nov 2" — but the underlying date is hardcoded data, not real availability. In a real version this would silently mis-promise.

### G11 — No out-of-stock / no-results state **[P2]**
- No stock field on cards; no schema for a "size sold out" state; no surface for "0 results after filters". Audit ticket **M6**.

### G12 — Voice disclosure is English only **[P2]**
- Disclosure (`discovery.js:1910`) is English with embedded Hindi nouns ("Diwali", "FabIndia"). No Hinglish version, no language-detection branch (audit **C4**). Spec Example 2 in `response-pattern-model.md §15.2` *requires* a Hinglish path.

---

## Scenario coverage matrix

| Scenario | Covered? | Where it breaks |
|---|---|---|
| English "Shop for a kurta for Diwali" | ✅ carousel renders | — |
| English "Buy the FabIndia silk kurta" | ✅ | Real Confirm & Pay → confirmed (G6 partially resolved) |
| Hinglish "Diwali ke liye kurta dhundo" | ✅ regex hits "kurta" | Disclosure stays English (G12) |
| Hinglish "Festive ke liye kuch chahiye" | ❌ | Matcher misses (G1) |
| Spec utterance "sherwani" / "Anarkali" | ❌ | Matcher misses (G1), even though Biba Anarkali is *in* the carousel |
| Filter to Men only | ✅ | Verified — G2 resolved |
| Filter to Under ₹2k | ✅ | Verified — G2 resolved |
| Tap a card to see details | ✅ | Detail sheet renders (G5 partially resolved); photos / fit notes / reviews still TODO |
| Pick a size | ❌ | Doesn't exist (G7) |
| Pick a colour | ❌ | Doesn't exist (G7) |
| Add to cart | ❌ | Doesn't exist (G7) |
| Multi-item cart (kurta + sweets) | ❌ | Universal — only kirana fakes multi-item |
| Address + delivery slot | ❌ | Doesn't exist (G7) |
| "Will this arrive before Diwali?" | ❌ | Static text, no logic (G10) |
| Confirm & Pay | ✅ | Reachable via SHOPPING_CATALOG entry (G6 partially resolved) |
| Voice "haan" tries to commit | n/a | Nothing to commit |
| Order placed, confirmed | ✅ | Order-confirmed card renders with commerce stages (G6 partially resolved); live tracking still TODO |
| Out of stock on selected size | ❌ | Not modelled (G11) |
| Cancel order | ❌ | Doesn't exist (G6) |
| Return / refund / exchange | ❌ | Doesn't exist |
| ASR miss / off-script | ❌ | No repair dialog (universal V4) |
| "See more" edge affordance | ❌ | Authored, not rendered (G9) |
| Suggested follow-ups | ❌ | None authored (G8) |

---

## Headline answer

The plumber journey was *intent → confirm-tap solid; lifecycle stubbed*. The kurta journey is the opposite shape: **only the first leg exists**.

What works: matcher hits, voice disclosure is on-pattern, the catalog renders with five reasonable cards, the §15 four-beat reads cleanly.

What's missing is the entire transactional spine — detail view, size/colour, cart, address, slot, pay, confirm, track, return. None of it exists, none of it is stubbed, and `kurta_diwali` isn't even on the list of views that *could* enter a confirm flow. On top of that the universal gaps (chips inert, edge slot missing, no repair dialog, English-only disclosure) hit harder here because the carousel is the *only* surface, so any dead refinement is the user's only refinement.

For a Round 2 demo where the value prop is "I asked for kurtas and saw kurtas", current state is fine. For anything that promises "I asked for kurtas and bought one", it's a much bigger build than the plumber gap.

### Priority for fixing

**P0 (block any shopping demo beyond carousel):**
- ~~G2 — wire chips (universal C2)~~ ✅ already shipped, verified 2026-04-29
- ~~G5 — provide a detail view, even a sheet with two more facts~~ ✅ shipped 2026-04-29 — `showCatalogDetailSheet(card)` with Buy now → SHOPPING_CATALOG
- ~~G6 — add at least one kurta SKU to a transactional flow so §14 is reachable~~ ✅ shipped 2026-04-29 — five kurta SKUs in SHOPPING_CATALOG, end-to-end verified

**All three kurta P0s closed for Round 2.**

**P1 (block external preview):**
- G1 — broaden Hinglish coverage (universal C4)
- G3 — collapse subject to one signal-bearing sentence (P1-2)
- G7 — model size/colour at minimum on card schema
- G8 — author suggested prompts
- G9 — render edge affordance (universal M5)
- G10 — make the Diwali date a real clock, not a string

**P2 (post-Round-2):**
- G4 — add a card-cap validator
- G11 — model stock/no-results
- G12 — Hinglish disclosure variant

---

## Files to look at if you want to dig in

- `index.html:4055` — the matcher (one line)
- `index.html:3126–3138` — the catalog tap handler (no-op for kurta)
- `index.html:4142–4179` — `TRANSACTIONAL_VIEW_PRODUCTS` (kurta absent)
- `index.html:4317–4325` — `SHOPPING_CATALOG` (groceries only)
- `index.html:4360–4417` — `renderShoppingCard()` — exists, never reached for kurta
- `discovery.js:1815–1917` — `MOCK_KURTA_DIWALI` (data, voice disclosure, chips, sort, edge affordance)
- `docs/response-pattern-model.md §15.1–§15.3` — canonical spec for this exact use case (English + Hinglish examples)
- `docs/voice-build-fix-plan-2026-04-29.md` — tickets C2, C4, C5, C7, V4, V5, M5, H11
