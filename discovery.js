/* ============================================================================
   JBIQ DISCOVERY — shared schema + validator + primitives + mocks.
   Extracted from place-playground.html. The playground stays the schema
   sandbox; this file is what ships into index.html for the real chat flow.

   Exposes the following on `window` so index.html's inline script can use
   them: renderDiscoveryView, validateDiscoveryView, DATASETS, DATASET_GROUPS,
   and every MOCK_* object.

   Namespacing: renderDiscoveryView() wraps its return element in
   <div class="jbiq-discovery"> so discovery.css scoping applies.
   ============================================================================ */

/* ========================================================================
   SECTION: tokens
   Mirror of the :root CSS custom properties. Used by SVG drawing code
   that can't read CSS vars without extra work. Single source of truth.
   ======================================================================== */
const tokens = {
  color: {
    surface: { primary: '#ffffff', secondary: '#f5f5f5', tertiary: '#eeeeef' },
    text: {
      primary: '#0c0d10',
      secondary: 'rgba(12,13,16,0.65)',
      tertiary: 'rgba(12,13,16,0.38)',
      onPrimary: '#ffffff',
    },
    action: { primary: '#6d17ce', primaryHover: '#310064', primarySurface: '#ede7ff' },
    border: { default: 'rgba(12,13,16,0.08)', strong: 'rgba(12,13,16,0.12)' },
    overlay: { dark: 'rgba(12,13,16,0.6)', warning: 'rgba(240,109,15,0.9)' },
    status: { open: '#0c0d10', closingSoon: '#f06d0f', closed: 'rgba(12,13,16,0.65)' },
    feedback: {
      errorBg: 'rgba(250,47,64,0.08)',
      errorText: '#fa2f40',
      errorBorder: 'rgba(250,47,64,0.3)',
    },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
  font: {
    family: "'JioType', 'JioTypeVar', -apple-system, BlinkMacSystemFont, sans-serif",
    size: { caption: 12, small: 12, body: 14, title: 16, hero: 18 },
    weight: { regular: 400, medium: 500, bold: 700 },
    lineHeight: { tight: 1.2, normal: 1.5 },
  },
  layout: {
    mobileFrameWidth: 380,
    cardWidth: 220,
    cardMediaHeight: 110,
    mapHeight: 132,
  },
};

/* ========================================================================
   SECTION: schema (JSDoc)
   The DiscoveryView family — a union type discriminated by `sub_pattern`.
   Three sub-patterns, three card variants, one composition.
   The runtime validator below is the enforcement mechanism.
   ======================================================================== */

/**
 * @typedef {Object} FilterChip
 * @property {string} id
 * @property {string} label
 * @property {string|number} value
 * @property {boolean} selected
 * @property {number} [result_count]
 */

/**
 * @typedef {Object} MapMarker
 * @property {string} id
 * @property {number} lat
 * @property {number} lng
 * @property {string} [pin_label]
 */

/* ---- Card variants ---- */

/**
 * @typedef {Object} PlaceResultCard
 * @property {'place'} variant
 * @property {string} id
 * @property {string} title
 * @property {{ url?: string, alt: string, fallback_color?: string }} media
 * @property {{ value: number, count: number }} [rating]
 * @property {number} [distance_km]
 * @property {string} [distance_label]  -- disambiguates what distance is measured to
 * @property {'₹'|'₹₹'|'₹₹₹'|'₹₹₹₹'} [price_level]
 * @property {string} [price_label]     -- free-form price (e.g. "₹350/visit")
 * @property {string[]} [tags]
 * @property {{ kind: 'open'|'closing_soon'|'closed', label: string }} [status]
 * @property {string[]} [specs]
 * @property {string} [badge]           -- rank / callout (e.g. "#1", "Top rated")
 * @property {string[]} [filter_ids]    -- chip ids this card passes; enables chip-based filtering (§8)
 * @property {string} primary_event
 * @property {Array<{ kind: 'call'|'directions'|'save', label: string, event: string }>} [secondary_events]
 */

/**
 * @typedef {Object} CatalogResultCard
 * @property {'catalog'} variant
 * @property {string} id
 * @property {string} title
 * @property {string} [subtitle]
 * @property {{ url?: string, alt: string, fallback_color?: string }} media
 * @property {{ value: number, count: number }} [rating]
 * @property {string} [price_label]       -- "₹1,499" or "₹1,999 – ₹4,999" or "Free"
 * @property {string} [temporal_label]    -- "Fri 8pm · 3 shows", "42 min", "Before Nov 15"
 * @property {string} [status_label]      -- "Live now", "Applications open", "New"
 * @property {string[]} [tags]
 * @property {string[]} [specs]
 * @property {string} [badge]
 * @property {string[]} [filter_ids]      -- chip ids this card passes (§8)
 * @property {string} primary_event
 * @property {{ label: string, event: string }} [commit_action]
 *   -- Optional explicit commit pill (e.g. "Add"). When present, the card is
 *   rendered as a non-interactive container and only the pill is tappable;
 *   the pill dispatches `commit_action.event`. When absent, the whole card
 *   stays a single tap target firing `primary_event` (legacy behaviour).
 */

/**
 * @typedef {Object} CompareOption
 * @property {string} id
 * @property {string} title
 * @property {string} [subtitle]
 * @property {{ url?: string, alt: string, fallback_color?: string }} [media]
 * @property {string} [badge]         -- "Lowest EMI", "Cheapest", "Recommended"
 * @property {string} primary_event
 */

/**
 * @typedef {Object} CompareRow
 * @property {string} id
 * @property {string} label
 * @property {Array<{ option_id: string, display: string, emphasis?: 'best'|'worst' }>} values
 */

/**
 * §9 Edge Affordance — one optional ancillary action per response.
 * Rendered below the collection, visually subordinate to card CTAs.
 * The `kind` is a semantic hint so QA / analytics can bucket behaviour;
 * labels are free-form and author-chosen. When `query` is set, the host
 * seeds the next user message with that text on tap (simulating a typed
 * follow-up). Without `query` the edge is a pure analytics event.
 *
 * @typedef {Object} EdgeAffordance
 * @property {string} label
 * @property {string} event
 * @property {'see_more'|'compare'|'save_later'|'remind_later'|'context_shift'|'commit'} kind
 * @property {string} [query]
 */

/* ---- Discovery view (union discriminated by sub_pattern) ---- */

/**
 * @typedef {Object} PlaceDiscoveryView
 * @property {'discovery_view'} kind
 * @property {'place'} sub_pattern
 * @property {'PARTIAL_RESULT_SHOWN'} state
 * @property {{ title: string, subtitle?: string }} subject
 * @property {{ area: string, change_event: string }} location_context
 * @property {{ multi_select: boolean, chips: FilterChip[] }} [filters]
 * @property {{ options: Array<{id: string, label: string}>, selected_id: string }} [sort]
 * @property {{ center: {lat: number, lng: number}, zoom: number, user_location?: {lat: number, lng: number}, markers: MapMarker[] }} map
 * @property {{ layout: 'carousel', cards: PlaceResultCard[] }} collection
 * @property {{ title: string, body: string, refine_prompt: string }} [empty_state]
 * @property {EdgeAffordance} [edge_affordance]  -- §9: single ancillary action
 * @property {{ intent: 'discover', query: string, total_count: number, trace_id: string }} meta
 */

/**
 * @typedef {Object} CatalogDiscoveryView
 * @property {'discovery_view'} kind
 * @property {'catalog'} sub_pattern
 * @property {'PARTIAL_RESULT_SHOWN'} state
 * @property {{ title: string, subtitle?: string }} subject
 * @property {{ multi_select: boolean, chips: FilterChip[] }} [filters]
 * @property {{ options: Array<{id: string, label: string}>, selected_id: string }} [sort]
 * @property {{ layout: 'carousel'|'grid'|'list', cards: CatalogResultCard[] }} collection
 * @property {{ title: string, body: string, refine_prompt: string }} [empty_state]
 * @property {EdgeAffordance} [edge_affordance]  -- §9: single ancillary action
 * @property {{ intent: 'discover', query: string, total_count: number, trace_id: string }} meta
 */

/**
 * @typedef {Object} CompareDiscoveryView
 * @property {'discovery_view'} kind
 * @property {'compare'} sub_pattern
 * @property {'PARTIAL_RESULT_SHOWN'} state
 * @property {{ title: string, subtitle?: string }} subject
 * @property {{ multi_select: boolean, chips: FilterChip[] }} [filters]
 * @property {{ options: Array<{id: string, label: string}>, selected_id: string }} [sort]
 * @property {{ layout: 'table', header: { label_column: string, recommended_id?: string }, options: CompareOption[], rows: CompareRow[] }} collection
 * @property {{ title: string, body: string, refine_prompt: string }} [empty_state]
 * @property {EdgeAffordance} [edge_affordance]  -- §9: single ancillary action
 * @property {{ intent: 'discover', query: string, total_count: number, trace_id: string }} meta
 */

/** @typedef {PlaceDiscoveryView | CatalogDiscoveryView | CompareDiscoveryView} DiscoveryView */

/* ========================================================================
   SECTION: validator
   Base rules + per-sub-pattern rules. Pure functions; no side effects.
   Top-level dispatcher: validateDiscoveryView.
   ======================================================================== */

const VALID_EDGE_KINDS = ['see_more', 'compare', 'save_later', 'remind_later', 'context_shift', 'commit'];

function validateCommon(view, errors) {
  if (view.kind !== 'discovery_view') {
    errors.push(`kind must be "discovery_view" (got "${view.kind}")`);
  }
  if (view.state !== 'PARTIAL_RESULT_SHOWN') {
    errors.push(`state must be "PARTIAL_RESULT_SHOWN" (got "${view.state}")`);
  }
  if (!view.meta || view.meta.intent !== 'discover') {
    errors.push('meta.intent must be "discover"');
  }
  if (!view.meta || !view.meta.trace_id) {
    errors.push('meta.trace_id must be non-empty');
  }
  if (view.edge_affordance) {
    const e = view.edge_affordance;
    if (!e.label) errors.push('edge_affordance.label must be non-empty');
    if (!e.event) errors.push('edge_affordance.event must be non-empty');
    if (!VALID_EDGE_KINDS.includes(e.kind)) {
      errors.push(`edge_affordance.kind must be one of ${VALID_EDGE_KINDS.join('|')} (got "${e.kind}")`);
    }
  }
}

function validatePlace(view, errors) {
  if (view.sub_pattern !== 'place') {
    errors.push(`sub_pattern must be "place"`);
  }
  if (!view.location_context) {
    errors.push('location_context is required for Place views');
  }
  if (!view.map) {
    errors.push('map is required for Place views');
  }
  const cardIds = new Set((view.collection?.cards || []).map((c) => c.id));
  for (const marker of view.map?.markers || []) {
    if (!cardIds.has(marker.id)) {
      errors.push(`map marker "${marker.id}" has no matching card in collection.cards`);
    }
  }
  if (!view.collection || view.collection.layout !== 'carousel') {
    errors.push('Place collection.layout must be "carousel"');
  }
  const placeCards = view.collection?.cards || [];
  if (placeCards.length > 5) {
    errors.push(`Place collection.cards must not exceed 5 (got ${placeCards.length}) — §7 3–5 card cap`);
  }
  for (const card of placeCards) {
    if (card.variant !== 'place') {
      errors.push(`card "${card.id}" has variant "${card.variant}", must be "place"`);
    }
    const hasSignal = card.distance_km != null || card.rating || card.status;
    if (!hasSignal) {
      errors.push(`card "${card.id}" must have at least one of: distance_km, rating, status`);
    }
  }
}

function validateCatalog(view, errors) {
  if (view.sub_pattern !== 'catalog') {
    errors.push(`sub_pattern must be "catalog"`);
  }
  const validLayouts = ['carousel', 'grid', 'list'];
  if (!view.collection || !validLayouts.includes(view.collection.layout)) {
    errors.push(`Catalog collection.layout must be one of ${validLayouts.join('|')}`);
  }
  const catalogCards = view.collection?.cards || [];
  if (catalogCards.length > 5) {
    errors.push(`Catalog collection.cards must not exceed 5 (got ${catalogCards.length}) — §7 3–5 card cap`);
  }
  for (const card of catalogCards) {
    if (card.variant !== 'catalog') {
      errors.push(`card "${card.id}" has variant "${card.variant}", must be "catalog"`);
    }
    if (!card.primary_event) {
      errors.push(`card "${card.id}" is missing primary_event`);
    }
    const hasSignal = card.price_label || card.rating || card.temporal_label || card.status_label;
    if (!hasSignal) {
      errors.push(`card "${card.id}" must have at least one of: price_label, rating, temporal_label, status_label`);
    }
  }
}

function validateCompare(view, errors) {
  if (view.sub_pattern !== 'compare') {
    errors.push(`sub_pattern must be "compare"`);
  }
  if (!view.collection || view.collection.layout !== 'table') {
    errors.push('Compare collection.layout must be "table"');
  }
  const options = view.collection?.options || [];
  if (options.length < 2) {
    errors.push(`Compare requires at least 2 options (got ${options.length})`);
  }
  const optionIds = new Set(options.map((o) => o.id));
  for (const opt of options) {
    if (!opt.primary_event) {
      errors.push(`option "${opt.id}" is missing primary_event`);
    }
  }
  for (const row of view.collection?.rows || []) {
    for (const v of row.values || []) {
      if (!optionIds.has(v.option_id)) {
        errors.push(`row "${row.id}" references unknown option_id "${v.option_id}"`);
      }
    }
  }
}

/**
 * @param {DiscoveryView} view
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateDiscoveryView(view) {
  const errors = [];
  validateCommon(view, errors);
  switch (view.sub_pattern) {
    case 'place':   validatePlace(view, errors); break;
    case 'catalog': validateCatalog(view, errors); break;
    case 'compare': validateCompare(view, errors); break;
    default:
      errors.push(`unknown sub_pattern "${view.sub_pattern}" (expected place|catalog|compare)`);
  }
  return { valid: errors.length === 0, errors };
}

// Back-compat alias for the old name used by tests/console snippets.
const validatePlaceDiscoveryView = validateDiscoveryView;

/* ========================================================================
   SECTION: primitives
   Nine pure render functions (plus the inline ValidatorBanner and
   EmptyState helpers). Each returns an HTMLElement, reads only its
   argument + tokens / CSS classes, and knows nothing about its siblings.
   Interactivity is emitted as event strings via data-event attributes —
   a single delegated listener on the root does the logging.

   Shared:       SubjectHeader, FilterChipBar, SortControl,
                 CollectionContainer
   Place-only:   LocationContext, MapPanel, PlaceResultCard
   Catalog-only: CatalogResultCard
   Compare-only: CompareTable
   ======================================================================== */

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k.startsWith('data-')) node.setAttribute(k, String(v));
    else if (k === 'style') Object.assign(node.style, v);
    else node.setAttribute(k, String(v));
  }
  const kids = Array.isArray(children) ? children : [children];
  for (const c of kids) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return node;
}

/** @param {{ title: string, subtitle?: string, brand_chip?: { label: string, variant: string } }} props */
function renderSubjectHeader({ title, subtitle, brand_chip }) {
  let subtitleNode = null;
  if (subtitle) {
    if (brand_chip) {
      subtitleNode = el('p', { class: 'subject-header__subtitle subject-header__subtitle-row' }, [
        el('span', {
          class: `subject-header__brand-chip subject-header__brand-chip--${brand_chip.variant}`,
          text: brand_chip.label,
        }),
        el('span', { text: subtitle }),
      ]);
    } else {
      subtitleNode = el('p', { class: 'subject-header__subtitle', text: subtitle });
    }
  }
  return el('header', { class: 'subject-header' }, [
    el('h2', { class: 'subject-header__title', text: title }),
    subtitleNode,
  ]);
}

/** @param {{ area: string, changeLabel?: string, changeEvent: string }} props */
function renderLocationContext({ area, changeLabel = 'change', changeEvent }) {
  return el('div', { class: 'location-context' }, [
    el('span', { class: 'location-context__area', text: area }),
    el('span', { class: 'location-context__separator', text: '·' }),
    el('button', {
      class: 'location-context__change',
      type: 'button',
      'data-event': changeEvent,
      text: changeLabel,
    }),
  ]);
}

/** @param {{ chips: FilterChip[], multiSelect: boolean }} props */
function renderFilterChipBar({ chips, multiSelect }) {
  const bar = el('div', {
    class: 'filter-chip-bar',
    role: 'group',
    'aria-label': multiSelect ? 'Filter (multi-select)' : 'Filter (single-select)',
  });
  for (const chip of chips) {
    const cls = 'filter-chip' + (chip.selected ? ' filter-chip--selected' : '');
    const label = chip.result_count != null
      ? `${chip.label} (${chip.result_count})`
      : chip.label;
    bar.appendChild(el('button', {
      class: cls,
      type: 'button',
      'data-event': `filter.toggle.${chip.id}`,
      text: label,
    }));
  }
  return bar;
}

/** @param {{ options: Array<{id: string, label: string}>, selectedId: string }} props */
function renderSortControl({ options, selectedId }) {
  const select = el('select', {
    class: 'sort-control__select',
    'data-event-prefix': 'sort.change',
  });
  for (const opt of options) {
    const o = el('option', { value: opt.id, text: opt.label });
    if (opt.id === selectedId) o.setAttribute('selected', 'selected');
    select.appendChild(o);
  }
  return el('div', { class: 'sort-control' }, [
    el('span', { class: 'sort-control__label', text: 'Sort:' }),
    select,
  ]);
}

/**
 * Schematic map. Computes a bounding box from markers + userLocation and
 * projects lat/lng linearly into the SVG viewport with padding.
 * @param {{ center: {lat: number, lng: number}, zoom: number, userLocation?: {lat: number, lng: number}, markers: MapMarker[] }} props
 */
function renderMapPanel({ userLocation, markers }) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const VB_W = 348; // mobile frame (380) minus 2 * --space-lg (16)
  const VB_H = tokens.layout.mapHeight;
  const PAD = 16;

  const points = markers.map((m) => ({ lat: m.lat, lng: m.lng }));
  if (userLocation) points.push(userLocation);
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = (maxLat - minLat) || 0.001;
  const lngRange = (maxLng - minLng) || 0.001;

  const project = (lat, lng) => {
    const x = PAD + ((lng - minLng) / lngRange) * (VB_W - 2 * PAD);
    const y = PAD + ((maxLat - lat) / latRange) * (VB_H - 2 * PAD);
    return { x, y };
  };

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'map-panel__svg');
  svg.setAttribute('viewBox', `0 0 ${VB_W} ${VB_H}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

  // map-panel SVG exception zone: schematic road strokes.
  const roads = [
    `M -10 30 Q 80 10 180 50 T ${VB_W + 10} 40`,
    `M -10 95 Q 120 120 240 80 T ${VB_W + 10} 110`,
    `M 60 -10 Q 90 50 140 90 T 200 ${VB_H + 10}`,
  ];
  for (const d of roads) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', '#D1DAE0'); // map schematic
    path.setAttribute('stroke-width', '10');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
  }

  // User location: halo + dot
  if (userLocation) {
    const { x, y } = project(userLocation.lat, userLocation.lng);
    const halo = document.createElementNS(SVG_NS, 'circle');
    halo.setAttribute('cx', x);
    halo.setAttribute('cy', y);
    halo.setAttribute('r', '6');
    halo.setAttribute('fill', 'rgba(59,130,246,0.25)'); // map schematic
    svg.appendChild(halo);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', '2.5');
    dot.setAttribute('fill', '#3B82F6'); // map schematic
    svg.appendChild(dot);
  }

  // Markers: classic map-pin icon (teardrop body with inner dot). The tip
  // anchors to the marker coordinate; body sits above it.
  for (const m of markers) {
    const { x, y } = project(m.lat, m.lng);
    const g = document.createElementNS(SVG_NS, 'g');
    g.setAttribute('transform', `translate(${x}, ${y})`);

    const pin = document.createElementNS(SVG_NS, 'path');
    pin.setAttribute('d', 'M 0 0 C -4 -6 -7 -10 -7 -14 A 7 7 0 1 1 7 -14 C 7 -10 4 -6 0 0 Z');
    pin.setAttribute('fill', tokens.color.action.primary);
    g.appendChild(pin);

    const inner = document.createElementNS(SVG_NS, 'circle');
    inner.setAttribute('cx', '0');
    inner.setAttribute('cy', '-14');
    inner.setAttribute('r', '2.5');
    inner.setAttribute('fill', '#ffffff');
    g.appendChild(inner);

    svg.appendChild(g);
  }

  const panel = el('div', { class: 'map-panel', role: 'img', 'aria-label': 'Map of results' });
  panel.appendChild(svg);
  return panel;
}

/** @param {{ layout: 'carousel'|'grid'|'list', children: HTMLElement[] }} props */
function renderCollectionContainer({ layout, children }) {
  const container = el('div', {
    class: `collection-container collection-container--${layout}`,
    role: 'list',
  });
  for (const c of children) container.appendChild(c);
  return container;
}

// Back-compat — some earlier code paths may still call the old name.
const renderResultCarousel = (children) =>
  renderCollectionContainer({ layout: 'carousel', children });

/**
 * Hash a card id to a stable fallback fill when no media URL or
 * fallback_color is provided. Keeps mock dev cheap.
 */
function hashColor(id) {
  let hash = 0;
  for (const c of id) hash = ((hash * 31) + c.charCodeAt(0)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 30%, 72%)`;
}

/** @param {PlaceResultCard} card */
function renderPlaceResultCard(card) {
  // Media area — bg image OR fallback colour OR hash-derived tone.
  const mediaStyle = card.media?.url
    ? { backgroundImage: `url(${card.media.url})` }
    : { background: card.media?.fallback_color || hashColor(card.id) };
  const media = el('div', {
    class: 'place-card__media',
    style: mediaStyle,
    role: 'img',
    'aria-label': card.media?.alt || card.title,
  });
  if (card.status) {
    media.appendChild(el('span', {
      class: `place-card__status-badge place-card__status-badge--${card.status.kind.replace('_', '-')}`,
      text: card.status.label,
    }));
  }
  if (card.badge) {
    media.appendChild(el('span', { class: 'place-card__badge', text: card.badge }));
  }

  // Content area — title, tags, meta, optional specs.
  const content = el('div', { class: 'place-card__content' });
  content.appendChild(el('h3', { class: 'place-card__title', text: card.title }));

  if (card.tags?.length) {
    content.appendChild(el('p', {
      class: 'place-card__tags',
      text: card.tags.join(' · '),
    }));
  }

  // Meta line: rating ★count · distance · price_level
  const metaParts = [];
  if (card.rating) {
    const wrap = el('span', {}, [
      el('span', { class: 'place-card__rating-value', text: card.rating.value.toFixed(1) }),
      document.createTextNode(`★ ${card.rating.count.toLocaleString('en-IN')}`),
    ]);
    metaParts.push(wrap);
  }
  if (card.distance_km != null) {
    const label = card.distance_label ? ` ${card.distance_label}` : '';
    metaParts.push(el('span', { text: `${card.distance_km} km${label}` }));
  }
  // price_label (free-form) takes precedence over price_level (tier) when both present.
  if (card.price_label) {
    metaParts.push(el('span', { text: card.price_label }));
  } else if (card.price_level) {
    metaParts.push(el('span', { text: card.price_level }));
  }
  if (metaParts.length > 0) {
    content.appendChild(el('div', { class: 'place-card__meta' }, metaParts));
  }

  if (card.specs?.length) {
    content.appendChild(el('p', {
      class: 'place-card__specs',
      text: card.specs.join(' · '),
    }));
  }

  return el('button', {
    class: 'place-card',
    type: 'button',
    role: 'listitem',
    'data-event': card.primary_event,
    'aria-label': card.title,
  }, [media, content]);
}

/** @param {CatalogResultCard} card */
function renderCatalogResultCard(card) {
  const mediaStyle = card.media?.url
    ? { backgroundImage: `url(${card.media.url})` }
    : { background: card.media?.fallback_color || hashColor(card.id) };
  const media = el('div', {
    class: 'catalog-card__media',
    style: mediaStyle,
    role: 'img',
    'aria-label': card.media?.alt || card.title,
  });
  if (card.status_label) {
    const isLive = /live/i.test(card.status_label);
    media.appendChild(el('span', {
      class: `catalog-card__status-badge${isLive ? ' catalog-card__status-badge--live' : ''}`,
      text: card.status_label,
    }));
  }
  if (card.badge) {
    media.appendChild(el('span', { class: 'catalog-card__badge', text: card.badge }));
  }

  const content = el('div', { class: 'catalog-card__content' });
  content.appendChild(el('h3', { class: 'catalog-card__title', text: card.title }));
  if (card.subtitle) {
    content.appendChild(el('p', { class: 'catalog-card__subtitle', text: card.subtitle }));
  }
  if (card.tags?.length) {
    content.appendChild(el('p', {
      class: 'catalog-card__tags',
      text: card.tags.join(' · '),
    }));
  }

  // Meta line: rating · price_label · temporal_label
  const metaParts = [];
  if (card.rating) {
    metaParts.push(el('span', {}, [
      el('span', { class: 'catalog-card__rating-value', text: card.rating.value.toFixed(1) }),
      document.createTextNode(`★ ${card.rating.count.toLocaleString('en-IN')}`),
    ]));
  }
  if (card.price_label) {
    metaParts.push(el('span', { class: 'catalog-card__price', text: card.price_label }));
  }
  if (card.temporal_label) {
    metaParts.push(el('span', { class: 'catalog-card__temporal', text: card.temporal_label }));
  }
  if (metaParts.length > 0) {
    content.appendChild(el('div', { class: 'catalog-card__meta' }, metaParts));
  }

  if (card.specs?.length) {
    content.appendChild(el('p', {
      class: 'catalog-card__specs',
      text: card.specs.join(' · '),
    }));
  }

  if (card.commit_action) {
    // Schema opts the card into a split tap model: only the commit pill
    // (e.g. "Add") is tappable, the wrapper is a div. The pill carries the
    // dispatch event; primary_event is preserved on the wrapper for parity
    // with legacy analytics consumers but is not what fires on tap.
    const pill = el('button', {
      class: 'catalog-card__commit',
      type: 'button',
      'data-event': card.commit_action.event,
      'aria-label': `${card.commit_action.label} ${card.title}`,
      text: card.commit_action.label,
    });
    return el('div', {
      class: 'catalog-card catalog-card--has-commit',
      role: 'listitem',
      'data-event': card.primary_event,
      'aria-label': card.title,
    }, [media, content, pill]);
  }

  return el('button', {
    class: 'catalog-card',
    type: 'button',
    role: 'listitem',
    'data-event': card.primary_event,
    'aria-label': card.title,
  }, [media, content]);
}

/**
 * Compare table. Sticky label column + horizontally-scrolling option
 * columns. Each option column is a single <button> emitting that
 * option's primary_event; cells within the column are visual only.
 * @param {{ header: {label_column: string, recommended_id?: string}, options: CompareOption[], rows: CompareRow[] }} props
 */
function renderCompareTable({ header, options, rows }) {
  // Labels column: an empty header spacer + one label cell per row.
  const labels = el('div', { class: 'compare-table__labels' });
  labels.appendChild(el('div', { class: 'compare-table__header-label', text: header.label_column }));
  for (const row of rows) {
    labels.appendChild(el('div', { class: 'compare-table__label-cell', text: row.label }));
  }

  // Options strip: one <button> column per option.
  const optionsStrip = el('div', { class: 'compare-table__options' });
  for (const opt of options) {
    const col = el('button', {
      class: 'compare-table__option' +
        (header.recommended_id === opt.id ? ' compare-table__option--recommended' : ''),
      type: 'button',
      'data-event': opt.primary_event,
      'aria-label': opt.title,
    });

    // Column header cell (option title + subtitle + badge)
    const hdr = el('div', { class: 'compare-table__header-cell' });
    if (opt.badge) {
      hdr.appendChild(el('span', { class: 'compare-table__option-badge', text: opt.badge }));
    }
    hdr.appendChild(el('p', { class: 'compare-table__option-title', text: opt.title }));
    if (opt.subtitle) {
      hdr.appendChild(el('p', { class: 'compare-table__option-subtitle', text: opt.subtitle }));
    }
    col.appendChild(hdr);

    // Data cells — one per row. Aligns row-for-row with the labels column.
    const valueById = new Map();
    for (const row of rows) {
      valueById.set(row.id, row.values.find((v) => v.option_id === opt.id));
    }
    for (const row of rows) {
      const v = valueById.get(row.id);
      const emphasisCls = v?.emphasis === 'best'
        ? ' compare-table__cell--best'
        : v?.emphasis === 'worst'
          ? ' compare-table__cell--worst'
          : '';
      col.appendChild(el('div', {
        class: `compare-table__cell${emphasisCls}`,
        text: v?.display ?? '—',
      }));
    }

    optionsStrip.appendChild(col);
  }

  return el('div', { class: 'compare-table', role: 'table', 'aria-label': 'Comparison table' }, [
    el('div', { class: 'compare-table__scroller' }, [labels, optionsStrip]),
  ]);
}

/* ========================================================================
   SECTION: composition
   Runs the validator. If invalid, renders ONLY the error banner.
   Otherwise composes the sections in the order defined by the brief.
   ======================================================================== */

function renderValidatorBanner(errors) {
  const list = el('ul', { class: 'validator-banner__list' });
  for (const e of errors) list.appendChild(el('li', { text: e }));
  return el('div', { class: 'validator-banner', role: 'alert' }, [
    el('p', { class: 'validator-banner__title', text: 'Schema validation failed' }),
    list,
  ]);
}

function renderEmptyState({ title, body, refine_prompt }) {
  return el('div', { class: 'empty-state' }, [
    el('p', { class: 'empty-state__title', text: title }),
    el('p', { class: 'empty-state__body', text: body }),
    el('p', { class: 'empty-state__prompt', text: refine_prompt }),
  ]);
}

/**
 * Shared sections (filters / sort) used by all three sub-patterns.
 * Returns nothing; appends to the passed container.
 */
function appendFiltersAndSort(container, view) {
  if (view.filters) {
    container.appendChild(renderFilterChipBar({
      chips: view.filters.chips,
      multiSelect: view.filters.multi_select,
    }));
  }
  if (view.sort) {
    container.appendChild(renderSortControl({
      options: view.sort.options,
      selectedId: view.sort.selected_id,
    }));
  }
}

function appendCollectionOrEmpty(container, view, layout, renderCard) {
  if (view.collection.cards.length > 0) {
    container.appendChild(renderCollectionContainer({
      layout,
      children: view.collection.cards.map(renderCard),
    }));
  } else if (view.empty_state) {
    container.appendChild(renderEmptyState(view.empty_state));
  } else {
    container.appendChild(el('div', { class: 'empty-state' }, [
      el('p', { class: 'empty-state__body', text: 'No results.' }),
    ]));
  }
}

/**
 * §9 Edge Affordance — a single optional next-action pill rendered below the
 * collection. Subordinate styling; not a replacement for refinement chips or
 * card CTAs.
 * @param {EdgeAffordance} edge
 */
function renderEdgeAffordance(edge) {
  return el('div', { class: 'edge-affordance' }, [
    el('button', {
      class: `edge-affordance__btn edge-affordance__btn--${edge.kind}`,
      type: 'button',
      'data-event': edge.event,
      'data-edge-kind': edge.kind,
      text: edge.label,
    }),
  ]);
}

function appendEdgeAffordance(container, view) {
  // Suppress the standalone edge pill when SuggestedPrompts is present —
  // the prompts row already includes the edge_affordance as one of its
  // three pills (per the "1 deepen + 1 pivot + 1 defer" heuristic), so
  // rendering both produces a redundant top pill above the prompts caption.
  // Legacy views (no suggested_prompts) keep their single pill.
  if (Array.isArray(view.suggested_prompts) && view.suggested_prompts.length > 0) return;
  if (view.edge_affordance) {
    container.appendChild(renderEdgeAffordance(view.edge_affordance));
  }
}

/**
 * SuggestedPrompts — a 3-pill follow-up row appended after the edge affordance.
 * Distinct from EdgeAffordance: that is one system-recommended action; this is
 * conversational scaffolding suggesting what the user might say next. Heuristic
 * per use case: one continuation + one pivot + one defer.
 *
 * Tap path: each button carries `data-query`, picked up by the delegated click
 * handler (which forwards via jbiqEmit detail.query) and routed through the
 * host's runPrototypeQuery / showResponse pipeline. No dependency on the view
 * schema at click-time — the query travels with the button.
 *
 * @param {Array<{ label: string, query: string, kind?: string }>} prompts
 * @param {string} [labelText='Yeh bhi puchh sakte hain:']
 */
function renderSuggestedPrompts(prompts, labelText = 'Yeh bhi puchh sakte hain:') {
  if (!Array.isArray(prompts) || prompts.length === 0) return null;
  const container = el('div', {
    class: 'suggested-prompts',
    role: 'group',
    'aria-label': 'Suggested follow-ups',
  });
  if (labelText) {
    container.appendChild(el('p', { class: 'suggested-prompts__label', text: labelText }));
  }
  const row = el('div', { class: 'suggested-prompts__row' });
  for (const p of prompts) {
    const slug = String(p.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 40);
    row.appendChild(el('button', {
      class: 'edge-affordance__btn edge-affordance__btn--suggested',
      type: 'button',
      'data-event': `prompt.${p.kind || 'see_more'}.${slug}`,
      'data-query': p.query,
      text: p.label,
    }));
  }
  container.appendChild(row);
  return container;
}

function appendSuggestedPrompts(container, view) {
  if (Array.isArray(view.suggested_prompts) && view.suggested_prompts.length > 0) {
    const node = renderSuggestedPrompts(view.suggested_prompts, view.suggested_prompts_label);
    if (node) container.appendChild(node);
  }
}

/** @param {PlaceDiscoveryView} view */
function renderPlaceBody(view) {
  const container = el('div', { class: 'discovery-view' });
  container.appendChild(renderSubjectHeader(view.subject));
  container.appendChild(renderLocationContext({
    area: view.location_context.area,
    changeEvent: view.location_context.change_event,
  }));
  appendFiltersAndSort(container, view);
  // Map panel suppressed for now — keep view.map data intact (validator still
  // checks marker/card consistency) but skip the render. Restore by wiring
  // renderMapPanel back in when the map UX returns.
  appendCollectionOrEmpty(container, view, 'carousel', renderPlaceResultCard);
  appendEdgeAffordance(container, view);
  appendSuggestedPrompts(container, view);
  return container;
}

/** @param {CatalogDiscoveryView} view */
function renderCatalogBody(view) {
  const container = el('div', { class: 'discovery-view' });
  container.appendChild(renderSubjectHeader(view.subject));
  appendFiltersAndSort(container, view);
  appendCollectionOrEmpty(container, view, view.collection.layout, renderCatalogResultCard);
  appendEdgeAffordance(container, view);
  appendSuggestedPrompts(container, view);
  return container;
}

/** @param {CompareDiscoveryView} view */
function renderCompareBody(view) {
  const container = el('div', { class: 'discovery-view' });
  container.appendChild(renderSubjectHeader(view.subject));
  appendFiltersAndSort(container, view);
  container.appendChild(renderCompareTable({
    header: view.collection.header,
    options: view.collection.options,
    rows: view.collection.rows,
  }));
  appendEdgeAffordance(container, view);
  appendSuggestedPrompts(container, view);
  return container;
}

/**
 * Renders the inner body for a view (without the .jbiq-discovery wrapper).
 * Kept internal so the playground's existing callers keep working, and so the
 * public renderDiscoveryView can add the namespace wrapper exactly once.
 * @param {DiscoveryView} view
 */
function renderDiscoveryBody(view) {
  const result = validateDiscoveryView(view);
  if (!result.valid) return renderValidatorBanner(result.errors);
  switch (view.sub_pattern) {
    case 'place':   return renderPlaceBody(view);
    case 'catalog': return renderCatalogBody(view);
    case 'compare': return renderCompareBody(view);
    default:        return renderValidatorBanner([`unknown sub_pattern "${view.sub_pattern}"`]);
  }
}

/**
 * Top-level dispatcher. Wraps the rendered body in a namespaced container so
 * discovery.css rules (scoped under .jbiq-discovery) apply — and so the host
 * page's typography/resets aren't disturbed outside discovery content.
 * The live view is stashed on the wrapper so chip/sort dispatch can re-render
 * in place (§8 — chips must refine, not just log).
 * @param {DiscoveryView} view
 */
function renderDiscoveryView(view) {
  const wrapper = document.createElement('div');
  wrapper.className = 'jbiq-discovery';
  wrapper.__jbiqView = view;
  wrapper.appendChild(renderDiscoveryBody(deriveDisplayView(view)));
  return wrapper;
}

// Back-compat alias.
const renderPlaceDiscoveryView = renderDiscoveryView;

/**
 * Re-render the body for a wrapper whose stashed view has mutated (chip
 * toggle, sort change). Preserves the wrapper so focus/scroll neighbours in
 * the chat transcript stay put.
 */
function rerenderDiscoveryView(wrapper) {
  const view = wrapper && wrapper.__jbiqView;
  if (!view) return;
  const newBody = renderDiscoveryBody(deriveDisplayView(view));
  wrapper.replaceChildren(newBody);
}

/**
 * §10.1 Informational — single-status answer with no card collection.
 * Renders subject header + label/value rows + optional edge affordance.
 * Uses the .jbiq-discovery wrapper so the existing delegated click + edge
 * handlers (location.change, edge.*) continue to work uniformly.
 * @param {{ kind: 'informational_response', subject: { title: string, subtitle?: string }, body_text: Array<{ label: string, value: string }>, voice_disclosure: string, edge_affordance?: EdgeAffordance }} view
 */
function renderInformationalResponse(view) {
  const wrapper = document.createElement('div');
  wrapper.className = 'jbiq-discovery';
  wrapper.__jbiqView = view;

  const container = el('div', { class: 'discovery-view' });
  container.appendChild(renderSubjectHeader(view.subject));

  const list = el('div', {
    class: 'info-list',
    style: {
      display: 'flex', flexDirection: 'column', gap: '8px',
      padding: '12px 16px', background: '#fff',
      border: '1px solid rgba(12,13,16,0.08)', borderRadius: '12px',
      marginTop: '8px',
    },
  });
  for (const row of (view.body_text || [])) {
    const rowEl = el('div', {
      class: 'info-row',
      style: {
        display: 'flex', flexDirection: 'column', gap: '2px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(12,13,16,0.06)',
      },
    }, [
      el('span', {
        class: 'info-row__label',
        style: { fontSize: '12px', color: 'rgba(12,13,16,0.65)' },
        text: row.label,
      }),
      el('span', {
        class: 'info-row__value',
        style: { fontSize: '14px', color: '#0c0d10', fontWeight: '500' },
        text: row.value,
      }),
    ]);
    list.appendChild(rowEl);
  }
  if (list.lastElementChild) {
    list.lastElementChild.style.borderBottom = 'none';
    list.lastElementChild.style.paddingBottom = '0';
  }
  container.appendChild(list);

  appendEdgeAffordance(container, view);
  appendSuggestedPrompts(container, view);

  wrapper.appendChild(container);
  return wrapper;
}

/**
 * Pure: return a shallow-cloned view with cards filtered by selected chips
 * and sorted by the selected sort option. Compare views are returned
 * unchanged (row/option matrix isn't amenable to card-filtering in v1).
 */
function deriveDisplayView(view) {
  if (view.sub_pattern !== 'place' && view.sub_pattern !== 'catalog') return view;
  const cards = view.collection && view.collection.cards;
  if (!Array.isArray(cards)) return view;

  const chips = (view.filters && view.filters.chips) || [];
  const selectedIds = chips.filter((c) => c.selected).map((c) => c.id);
  const anyCardHasFilterIds = cards.some((c) => Array.isArray(c.filter_ids) && c.filter_ids.length > 0);

  let nextCards = cards;
  if (selectedIds.length > 0 && anyCardHasFilterIds) {
    nextCards = cards.filter((card) => {
      if (!Array.isArray(card.filter_ids)) return false;
      return selectedIds.every((id) => card.filter_ids.includes(id));
    });
  }

  const sortId = view.sort && view.sort.selected_id;
  if (sortId) nextCards = sortCards(nextCards, sortId, view.sub_pattern);

  const next = { ...view, collection: { ...view.collection, cards: nextCards } };

  // Place views carry map markers that must reference visible cards only.
  // Without this, filtering orphans markers and the validator rejects the
  // derived view on re-render (also: orphan pins on the map are bad UX).
  if (view.sub_pattern === 'place' && view.map && Array.isArray(view.map.markers)) {
    const visibleIds = new Set(nextCards.map((c) => c.id));
    next.map = { ...view.map, markers: view.map.markers.filter((m) => visibleIds.has(m.id)) };
  }

  return next;
}

/**
 * Heuristic sorter keyed off well-known sort option ids. Unknown ids fall
 * back to the input order so author intent is respected.
 */
function sortCards(cards, sortId, subPattern) {
  const copy = cards.slice();
  const priceNumeric = (card) => {
    if (typeof card.price_level === 'string') return card.price_level.length;
    const label = card.price_label || '';
    const m = label.replace(/,/g, '').match(/\d+(\.\d+)?/);
    return m ? parseFloat(m[0]) : Infinity;
  };
  const rating = (card) => (card.rating && typeof card.rating.value === 'number' ? card.rating.value : 0);
  const distance = (card) => (typeof card.distance_km === 'number' ? card.distance_km : Infinity);

  switch (sortId) {
    case 'price':
    case 'price_asc':
      copy.sort((a, b) => priceNumeric(a) - priceNumeric(b));
      break;
    case 'price_desc':
      copy.sort((a, b) => priceNumeric(b) - priceNumeric(a));
      break;
    case 'rating':
      copy.sort((a, b) => rating(b) - rating(a));
      break;
    case 'distance':
      copy.sort((a, b) => distance(a) - distance(b));
      break;
    case 'popular':
    case 'relevance':
    case 'new':
    default:
      // Preserve author order.
      break;
  }
  return copy;
}

/* ========================================================================
   SECTION: mocks
   20 DiscoveryView objects, grouped by sub-pattern:
     - Place (6):   restaurants, biryani_hyderabad, doctors, plumbers,
                    schools_bandra, apartments
     - Catalog (7): kurta_diwali, gifts_wedding, movies_weekend,
                    devotional_morning, courses_datascience, ipl_today,
                    schemes_farmers
     - Compare (7): home_loans, flights_mumbai, recharge_299, phones_20k,
                    trains_tatkal, health_insurance, emi_fridge
   Each mock stress-tests a specific schema axis. The renderer must not
   branch on any query name.
   ======================================================================== */

/** @type {PlaceDiscoveryView} */
const MOCK_RESTAURANTS = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Restaurants near you', subtitle: '15 within 2 km' },
  location_context: { area: 'Andheri West, Mumbai', change_event: 'location.change.andheri_west' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'open_now',      label: 'Open now',     value: 'open_now',      selected: true },
      { id: 'under_500',     label: 'Under ₹500',   value: 500,             selected: false },
      { id: 'four_plus',     label: '4★ and up',    value: 4,               selected: false },
      { id: 'iranian',       label: 'Iranian',      value: 'iranian',       selected: false },
      { id: 'family',        label: 'Family',       value: 'family',        selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'relevance', label: 'Relevance' },
      { id: 'distance',  label: 'Distance' },
      { id: 'rating',    label: 'Rating' },
      { id: 'price',     label: 'Price' },
    ],
    selected_id: 'relevance',
  },
  map: {
    center: { lat: 19.130, lng: 72.832 },
    zoom: 15,
    user_location: { lat: 19.130, lng: 72.832 },
    markers: [
      { id: 'britannia',      lat: 19.127, lng: 72.837, pin_label: '₹₹' },
      { id: 'trishna',        lat: 19.130, lng: 72.825, pin_label: '₹₹₹' },
      { id: 'bombay_canteen', lat: 19.135, lng: 72.834, pin_label: '₹₹₹' },
      { id: 'kofuku',         lat: 19.125, lng: 72.840, pin_label: '₹₹' },
      { id: 'papa_pancho',    lat: 19.138, lng: 72.828, pin_label: '₹₹' },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'britannia',
        title: 'Britannia & Co.',
        media: { alt: 'Britannia & Co. interior', fallback_color: '#D9B99B' },
        rating: { value: 4.6, count: 2847 },
        distance_km: 1.2,
        price_level: '₹₹',
        tags: ['Iranian', 'Cafe'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['open_now', 'under_500', 'four_plus', 'iranian'],
        primary_event: 'place.restaurant.britannia.open',
      },
      {
        variant: 'place',
        id: 'trishna',
        title: 'Trishna',
        media: { alt: 'Trishna seafood platter', fallback_color: '#C9A686' },
        rating: { value: 4.7, count: 4102 },
        distance_km: 2.1,
        price_level: '₹₹₹',
        tags: ['Seafood', 'Coastal'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['open_now', 'four_plus'],
        primary_event: 'place.restaurant.trishna.open',
      },
      {
        variant: 'place',
        id: 'bombay_canteen',
        title: 'Bombay Canteen',
        media: { alt: 'Bombay Canteen dining room', fallback_color: '#B8956F' },
        rating: { value: 4.5, count: 3251 },
        distance_km: 2.8,
        price_level: '₹₹₹',
        tags: ['Indian', 'Contemporary'],
        status: { kind: 'closing_soon', label: 'Closing 11pm' },
        filter_ids: ['four_plus'],
        primary_event: 'place.restaurant.bombay_canteen.open',
      },
      {
        variant: 'place',
        id: 'kofuku',
        title: 'Kofuku',
        media: { alt: 'Kofuku ramen bowl', fallback_color: '#A9906A' },
        rating: { value: 4.4, count: 1428 },
        distance_km: 1.5,
        price_level: '₹₹',
        tags: ['Japanese', 'Izakaya'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['open_now', 'under_500', 'four_plus'],
        primary_event: 'place.restaurant.kofuku.open',
      },
      {
        variant: 'place',
        id: 'papa_pancho',
        title: 'Papa Pancho',
        media: { alt: 'Papa Pancho dal makhani', fallback_color: '#C4A878' },
        rating: { value: 4.3, count: 2015 },
        distance_km: 0.9,
        price_level: '₹₹',
        tags: ['Punjabi', 'Family'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['open_now', 'under_500', 'four_plus', 'family'],
        primary_event: 'place.restaurant.papa_pancho.open',
      },
    ],
  },
  edge_affordance: {
    label: 'See more restaurants',
    event: 'edge.restaurants.see_more',
    kind: 'see_more',
    query: 'Show me more restaurants nearby',
  },
  voice_disclosure: "15 restaurants within 2 km, 5 open now. Britannia & Co. — Iranian cafe, 1.2 km, 4.6 stars. Others span Punjabi to Japanese, mostly mid-range. I've put them on screen — tap one, or filter by cuisine.",
  meta: {
    intent: 'discover',
    query: 'Restaurants near me',
    total_count: 15,
    trace_id: 'trace-restaurants-001',
  },
};

/** @type {PlaceDiscoveryView} */
const MOCK_DOCTORS = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Doctors near you', subtitle: '12 consulting today' },
  location_context: { area: 'Andheri West, Mumbai', change_event: 'location.change.andheri_west' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'consulting_today', label: 'Consulting today', value: 'today',       selected: true },
      { id: 'open_now',         label: 'Open now',         value: 'open',        selected: false },
      { id: 'general_physician', label: 'General Physician', value: 'gp',        selected: false },
      { id: 'pediatrician',     label: 'Pediatrician',     value: 'peds',        selected: false },
      { id: 'female_doctor',    label: 'Female doctor',    value: 'female',      selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'distance', label: 'Distance' },
      { id: 'rating',   label: 'Rating' },
      { id: 'fee',      label: 'Fee' },
    ],
    selected_id: 'distance',
  },
  map: {
    center: { lat: 19.136, lng: 72.826 },
    zoom: 15,
    user_location: { lat: 19.136, lng: 72.826 },
    markers: [
      { id: 'rao',    lat: 19.137, lng: 72.828 },
      { id: 'menon',  lat: 19.133, lng: 72.822 },
      { id: 'sharma', lat: 19.142, lng: 72.825 },
      { id: 'iyer',   lat: 19.130, lng: 72.831 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'rao',
        title: 'Dr. Anand Rao',
        media: { alt: 'Dr. Anand Rao', fallback_color: '#B5C7D6' },
        rating: { value: 4.8, count: 87 },
        distance_km: 1.5,
        tags: ['General Physician', 'Fever & flu', 'Senior Consultant'],
        status: { kind: 'open', label: 'Consulting now' },
        filter_ids: ['consulting_today', 'open_now', 'general_physician'],
        primary_event: 'place.doctor.rao.open',
      },
      {
        variant: 'place',
        id: 'menon',
        title: 'Dr. Priya Menon',
        media: { alt: 'Dr. Priya Menon', fallback_color: '#C4D4DF' },
        rating: { value: 4.6, count: 142 },
        distance_km: 2.3,
        tags: ['Dermatologist', 'MBBS MD'],
        status: { kind: 'closing_soon', label: 'Next slot 6pm' },
        filter_ids: ['consulting_today', 'open_now'],
        primary_event: 'place.doctor.menon.open',
      },
      {
        variant: 'place',
        id: 'sharma',
        // Breaks "gentle" assumption: only has rating. No distance, no status.
        title: 'Dr. Neha Sharma',
        media: { alt: 'Dr. Neha Sharma', fallback_color: '#D0D9E0' },
        rating: { value: 4.4, count: 32 },
        tags: ['General Physician', 'Female doctor'],
        filter_ids: ['consulting_today', 'general_physician', 'female_doctor'],
        primary_event: 'place.doctor.sharma.open',
      },
      {
        variant: 'place',
        id: 'iyer',
        title: 'Dr. Ramesh Iyer',
        media: { alt: 'Dr. Ramesh Iyer', fallback_color: '#ADC0D0' },
        rating: { value: 4.9, count: 256 },
        distance_km: 0.8,
        tags: ['Pediatrician', 'Fever & flu'],
        filter_ids: ['consulting_today', 'pediatrician'],
        primary_event: 'place.doctor.iyer.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Search by speciality',
    event: 'edge.doctors.context_shift',
    kind: 'context_shift',
    query: 'Find doctors by speciality near me',
  },
  voice_disclosure: "12 doctors consulting today. Dr. Anand Rao is free now — GP, 1.5 km, 4.8 stars. Others range from pediatrics to dermatology, within 2 km. I've put them on screen — tap one, or ask for a pediatrician?",
  meta: {
    intent: 'discover',
    query: 'Doctors near me',
    total_count: 12,
    trace_id: 'trace-doctors-001',
  },
};

/** @type {PlaceDiscoveryView} */
const MOCK_APARTMENTS = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: '2 BHK in Andheri West', subtitle: '8 listings match' },
  location_context: { area: 'Andheri West, Mumbai', change_event: 'location.change.andheri_west' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'under_50k',       label: 'Under ₹50k',      value: 50000, selected: false },
      { id: 'two_bhk',         label: '2 BHK',           value: 2,     selected: false },
      { id: 'semi_furnished',  label: 'Semi-furnished',  value: 'semi', selected: false },
      { id: 'near_metro',      label: 'Near metro',      value: 'metro', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'price_asc',    label: 'Price (low to high)' },
      { id: 'price_desc',   label: 'Price (high to low)' },
      { id: 'metro_dist',   label: 'Distance from metro' },
      { id: 'newest',       label: 'Newest' },
    ],
    selected_id: 'price_asc',
  },
  map: {
    center: { lat: 19.136, lng: 72.826 },
    zoom: 15,
    user_location: { lat: 19.136, lng: 72.826 },
    markers: [
      { id: 'sealine',          lat: 19.137, lng: 72.825 },
      { id: 'lokhandwala_crest', lat: 19.133, lng: 72.828 },
      { id: 'four_bung_heights', lat: 19.139, lng: 72.823 },
      { id: 'hill_view',        lat: 19.135, lng: 72.830 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'sealine',
        title: 'Sealine Residences',
        media: { alt: 'Sealine Residences exterior', fallback_color: '#C7D2CC' },
        // No rating, no status, no price_level. distance_km = metro distance.
        distance_km: 0.4,
        tags: ['Semi-furnished', 'Parking'],
        specs: ['2 BHK', '850 sqft', '₹45,000/mo'],
        filter_ids: ['under_50k', 'two_bhk', 'semi_furnished', 'near_metro'],
        primary_event: 'place.apartment.sealine.open',
      },
      {
        variant: 'place',
        id: 'lokhandwala_crest',
        title: 'Lokhandwala Crest',
        media: { alt: 'Lokhandwala Crest balcony view', fallback_color: '#BDC7C1' },
        distance_km: 0.7,
        tags: ['Furnished', 'Pool'],
        specs: ['2 BHK', '1,100 sqft', '₹62,000/mo'],
        filter_ids: ['two_bhk', 'near_metro'],
        primary_event: 'place.apartment.lokhandwala_crest.open',
      },
      {
        variant: 'place',
        id: 'four_bung_heights',
        title: 'Four Bungalows Heights',
        media: { alt: 'Four Bungalows Heights facade', fallback_color: '#C2CFC8' },
        distance_km: 1.2,
        tags: ['Unfurnished', 'Gated'],
        specs: ['2 BHK', '920 sqft', '₹48,000/mo'],
        filter_ids: ['under_50k', 'two_bhk'],
        primary_event: 'place.apartment.four_bung_heights.open',
      },
      {
        variant: 'place',
        id: 'hill_view',
        title: 'Hill View Apartments',
        media: { alt: 'Hill View Apartments', fallback_color: '#B4C2BA' },
        distance_km: 0.9,
        tags: ['Semi-furnished', 'Gym'],
        specs: ['2 BHK', '1,050 sqft', '₹55,000/mo'],
        filter_ids: ['two_bhk', 'semi_furnished', 'near_metro'],
        primary_event: 'place.apartment.hill_view.open',
      },
    ],
  },
  edge_affordance: {
    label: 'See more listings',
    event: 'edge.apartments.see_more',
    kind: 'see_more',
    query: 'Show me more 2 BHK listings in Andheri',
  },
  voice_disclosure: "8 two-BHK flats in Andheri West. Cheapest is Sealine Residences — ₹45,000 a month, 850 sqft, 0.4 km from metro. Others range up to ₹62,000, one is furnished with a pool. On screen — tap Sealine, or filter by amenities?",
  meta: {
    intent: 'discover',
    query: '2 BHK apartments for rent in Andheri West',
    total_count: 8,
    trace_id: 'trace-apartments-001',
  },
};

/* ---- Place (3 more) ---- */

/** @type {PlaceDiscoveryView} */
const MOCK_BIRYANI_HYDERABAD = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Best biryani in Hyderabad', subtitle: 'Ranked by reviews · 18 places' },
  location_context: { area: 'Hyderabad', change_event: 'location.change.hyderabad' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'top_rated',    label: 'Top rated',       value: 'top',   selected: true },
      { id: 'under_500',    label: 'Under ₹500',      value: 500,     selected: false },
      { id: 'four_five',    label: '4.5★ and up',     value: 4.5,     selected: false },
      { id: 'hyderabadi',   label: 'Hyderabadi dum',  value: 'dum',   selected: false },
      { id: 'family_pack',  label: 'Family pack',     value: 'pack',  selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'top_rated', label: 'Top rated' },
      { id: 'rating',    label: 'Rating' },
      { id: 'distance',  label: 'Distance' },
      { id: 'price',     label: 'Price' },
    ],
    selected_id: 'top_rated',
  },
  map: {
    center: { lat: 17.395, lng: 78.475 },
    zoom: 13,
    user_location: { lat: 17.415, lng: 78.460 },
    markers: [
      { id: 'paradise',      lat: 17.442, lng: 78.498, pin_label: '1' },
      { id: 'bawarchi',      lat: 17.402, lng: 78.469, pin_label: '2' },
      { id: 'shah_ghouse',   lat: 17.374, lng: 78.478, pin_label: '3' },
      { id: 'shadab',        lat: 17.362, lng: 78.477, pin_label: '4' },
      { id: 'alpha',         lat: 17.411, lng: 78.500, pin_label: '5' },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'paradise',
        title: 'Paradise Biryani',
        media: { alt: 'Paradise biryani handi', fallback_color: '#C9855A' },
        rating: { value: 4.7, count: 31820 },
        distance_km: 2.4,
        price_level: '₹₹',
        tags: ['Hyderabadi', 'Dum', 'Family'],
        status: { kind: 'open', label: 'Open' },
        badge: '#1',
        filter_ids: ['top_rated', 'four_five', 'hyderabadi', 'family_pack'],
        primary_event: 'place.biryani.paradise.open',
      },
      {
        variant: 'place',
        id: 'bawarchi',
        title: 'Bawarchi',
        media: { alt: 'Bawarchi chicken biryani', fallback_color: '#D19870' },
        rating: { value: 4.6, count: 24510 },
        distance_km: 0.9,
        price_level: '₹₹',
        tags: ['Hyderabadi', 'Dum'],
        status: { kind: 'open', label: 'Open' },
        badge: '#2',
        filter_ids: ['top_rated', 'four_five', 'hyderabadi'],
        primary_event: 'place.biryani.bawarchi.open',
      },
      {
        variant: 'place',
        id: 'shah_ghouse',
        title: 'Shah Ghouse Cafe',
        media: { alt: 'Shah Ghouse mutton biryani', fallback_color: '#B97349' },
        rating: { value: 4.5, count: 18920 },
        distance_km: 4.7,
        price_level: '₹',
        tags: ['Mutton', 'Late-night'],
        status: { kind: 'open', label: 'Open till 2am' },
        badge: '#3',
        filter_ids: ['top_rated', 'under_500', 'four_five'],
        primary_event: 'place.biryani.shah_ghouse.open',
      },
      {
        variant: 'place',
        id: 'shadab',
        title: 'Hotel Shadab',
        media: { alt: 'Shadab biryani plate', fallback_color: '#A8653E' },
        rating: { value: 4.4, count: 12340 },
        distance_km: 5.6,
        price_level: '₹',
        tags: ['Old city', 'Mutton'],
        status: { kind: 'closing_soon', label: 'Closing 11pm' },
        filter_ids: ['under_500'],
        primary_event: 'place.biryani.shadab.open',
      },
      {
        variant: 'place',
        id: 'alpha',
        title: 'Alpha Hotel',
        media: { alt: 'Alpha Hotel chicken biryani', fallback_color: '#C09162' },
        rating: { value: 4.3, count: 9812 },
        distance_km: 1.6,
        price_level: '₹',
        tags: ['Budget', 'Chicken'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['under_500'],
        primary_event: 'place.biryani.alpha.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Compare top 3',
    event: 'edge.biryani.compare',
    kind: 'compare',
    query: 'Compare Paradise, Bawarchi and Shah Ghouse',
  },
  voice_disclosure: "18 biryani spots in Hyderabad. Paradise is #1 — 4.7 stars, Hyderabadi dum, 2.4 km. Bawarchi and Shah Ghouse follow close behind at similar prices. On screen — tap Paradise, or compare the top three?",
  meta: {
    intent: 'discover',
    query: 'Best biryani in Hyderabad',
    total_count: 18,
    trace_id: 'trace-biryani-001',
  },
};

/** @type {PlaceDiscoveryView} */
const MOCK_PLUMBERS = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Plumbers in your area', subtitle: '4 available now · Andheri West' },
  location_context: { area: 'Andheri West, Mumbai', change_event: 'location.change.andheri_west' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'available_now', label: 'Available now', value: 'avail', selected: true },
      { id: 'twentyfour',    label: '24/7',           value: 24,     selected: false },
      { id: 'under_500',     label: 'Under ₹500',     value: 500,    selected: false },
      { id: 'verified',      label: 'Verified',       value: 'ok',   selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'availability', label: 'Availability' },
      { id: 'distance',     label: 'Distance' },
      { id: 'rating',       label: 'Rating' },
      { id: 'price',        label: 'Price' },
    ],
    selected_id: 'availability',
  },
  map: {
    center: { lat: 19.136, lng: 72.826 },
    zoom: 14,
    user_location: { lat: 19.136, lng: 72.826 },
    markers: [
      { id: 'urban_co',  lat: 19.139, lng: 72.829 },
      { id: 'mr_handy',  lat: 19.131, lng: 72.823 },
      { id: 'quickfix',  lat: 19.142, lng: 72.821 },
      { id: 'localpros', lat: 19.134, lng: 72.833 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'urban_co',
        title: 'Urban Company',
        media: { alt: 'Urban Company technician', fallback_color: '#8FB4D6' },
        rating: { value: 4.8, count: 9432 },
        distance_km: 0.4,
        price_label: '₹349/visit',
        tags: ['Verified', '30-min ETA'],
        status: { kind: 'open', label: 'Available now' },
        filter_ids: ['available_now', 'under_500', 'verified'],
        primary_event: 'place.plumber.urban_co.open',
      },
      {
        variant: 'place',
        id: 'mr_handy',
        title: 'Mr Handy Services',
        media: { alt: 'Mr Handy van', fallback_color: '#A5BFD3' },
        rating: { value: 4.5, count: 512 },
        distance_km: 1.1,
        price_label: '₹299/visit',
        tags: ['24/7', 'Emergency'],
        status: { kind: 'open', label: 'Available now' },
        filter_ids: ['available_now', 'twentyfour', 'under_500'],
        primary_event: 'place.plumber.mr_handy.open',
      },
      {
        variant: 'place',
        id: 'quickfix',
        title: 'QuickFix Mumbai',
        media: { alt: 'QuickFix worker', fallback_color: '#B6CBDC' },
        rating: { value: 4.2, count: 184 },
        distance_km: 0.9,
        price_label: '₹399/visit',
        tags: ['Verified'],
        // Busy status — stress test: no availability
        status: { kind: 'closing_soon', label: 'Busy · 2hr ETA' },
        filter_ids: ['under_500', 'verified'],
        primary_event: 'place.plumber.quickfix.open',
      },
      {
        variant: 'place',
        id: 'localpros',
        title: 'LocalPros',
        media: { alt: 'LocalPros team', fallback_color: '#C4D4E1' },
        rating: { value: 4.0, count: 42 },
        distance_km: 1.8,
        price_label: '₹250/visit',
        tags: ['Budget'],
        status: { kind: 'open', label: 'Available now' },
        filter_ids: ['available_now', 'under_500'],
        primary_event: 'place.plumber.localpros.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Remind me tomorrow',
    event: 'edge.plumbers.remind_later',
    kind: 'remind_later',
    query: 'Remind me to book a plumber tomorrow morning',
  },
  voice_disclosure: "4 plumbers free now in Andheri. Urban Company sabse paas — ₹349, 30-min ETA, 4.8 stars. Mr Handy aur LocalPros bhi available; QuickFix busy hai. On screen — Urban Company tap karein, ya doosre suniyega?",
  suggested_prompts: [
    { label: 'Kal subah ke liye yaad dilao', kind: 'remind_later',  query: 'Kal subah plumber book karne ki yaad dilana' },
    { label: 'Inhe compare karo',            kind: 'compare',       query: 'In plumbers ka comparison dikhao — price, ratings, ETA' },
    { label: 'Electrician bhi chahiye?',     kind: 'context_shift', query: 'Paas mein electrician kaun available hai' },
  ],
  meta: {
    intent: 'discover',
    query: 'Plumber in my area',
    total_count: 4,
    trace_id: 'trace-plumbers-001',
  },
};

/** @type {PlaceDiscoveryView} */
const MOCK_SCHOOLS_BANDRA = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Schools in Bandra', subtitle: '5 admissions open for 2026' },
  location_context: { area: 'Bandra, Mumbai', change_event: 'location.change.bandra' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'cbse',      label: 'CBSE',       value: 'cbse', selected: false },
      { id: 'icse',      label: 'ICSE',       value: 'icse', selected: false },
      { id: 'ib',        label: 'IB',         value: 'ib',   selected: false },
      { id: 'k12',       label: 'K-12',       value: 'k12',  selected: false },
      { id: 'day_school', label: 'Day school', value: 'day', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'distance', label: 'Distance' },
      { id: 'fees',     label: 'Fees' },
      { id: 'rating',   label: 'Rating' },
    ],
    selected_id: 'distance',
  },
  map: {
    center: { lat: 19.055, lng: 72.830 },
    zoom: 14,
    user_location: { lat: 19.055, lng: 72.830 },
    markers: [
      { id: 'jamnabai',        lat: 19.058, lng: 72.828 },
      { id: 'dhirubhai',       lat: 19.060, lng: 72.836 },
      { id: 'learners',        lat: 19.051, lng: 72.833 },
      { id: 'bombay_scottish', lat: 19.054, lng: 72.824 },
      { id: 'cathedral_ib',    lat: 19.063, lng: 72.831 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'jamnabai',
        title: 'Jamnabai Narsee',
        media: { alt: 'Jamnabai Narsee School campus', fallback_color: '#B5C7A8' },
        rating: { value: 4.6, count: 412 },
        distance_km: 0.5,
        specs: ['CBSE', 'K-12', '₹2.8L/yr'],
        tags: ['Co-ed', 'Day'],
        filter_ids: ['cbse', 'k12', 'day_school'],
        primary_event: 'place.school.jamnabai.open',
      },
      {
        variant: 'place',
        id: 'dhirubhai',
        title: 'Dhirubhai Ambani Intl',
        media: { alt: 'DAIS campus', fallback_color: '#C4D1B5' },
        rating: { value: 4.8, count: 298 },
        distance_km: 0.9,
        specs: ['IB', 'K-12', '₹11.5L/yr'],
        tags: ['Co-ed', 'IB PYP/MYP/DP'],
        badge: 'Top rated',
        filter_ids: ['ib', 'k12'],
        primary_event: 'place.school.dhirubhai.open',
      },
      {
        variant: 'place',
        id: 'learners',
        title: 'Learners Academy',
        media: { alt: 'Learners Academy', fallback_color: '#B0BFA3' },
        // No rating — newer branch. Schema allows omission.
        distance_km: 0.8,
        specs: ['ICSE', 'Classes 1-10', '₹1.9L/yr'],
        tags: ['Co-ed', 'Day'],
        filter_ids: ['icse', 'day_school'],
        primary_event: 'place.school.learners.open',
      },
      {
        variant: 'place',
        id: 'bombay_scottish',
        title: 'Bombay Scottish',
        media: { alt: 'Bombay Scottish Bandra', fallback_color: '#A9BC9D' },
        rating: { value: 4.7, count: 521 },
        distance_km: 1.3,
        specs: ['ICSE', 'K-12', '₹1.6L/yr'],
        tags: ['Co-ed', 'Heritage'],
        filter_ids: ['icse', 'k12'],
        primary_event: 'place.school.bombay_scottish.open',
      },
      {
        variant: 'place',
        id: 'cathedral_ib',
        title: 'Cathedral IB',
        media: { alt: 'Cathedral School IB wing', fallback_color: '#BDCDAF' },
        rating: { value: 4.5, count: 187 },
        distance_km: 1.1,
        specs: ['IB', 'Grades 9-12', '₹9.2L/yr'],
        tags: ['Co-ed', 'Senior'],
        filter_ids: ['ib'],
        primary_event: 'place.school.cathedral_ib.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Compare by fees',
    event: 'edge.schools.compare',
    kind: 'compare',
    query: 'Compare these schools by annual fees',
  },
  voice_disclosure: "5 Bandra schools with admissions open. Jamnabai Narsee is closest — CBSE K-12, 0.5 km, ₹2.8 lakh a year. Others span ICSE and IB, up to ₹11.5 lakh. On screen — tap one, or compare by fees?",
  meta: {
    intent: 'discover',
    query: 'Schools for my child in Bandra',
    total_count: 5,
    trace_id: 'trace-schools-001',
  },
};

/* ---- Catalog (7) ---- */

/** @type {CatalogDiscoveryView} */
const MOCK_KURTA_DIWALI = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Kurtas for Diwali', subtitle: '240+ styles · Delivery by Nov 10' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'men',        label: 'Men',          value: 'men',   selected: false },
      { id: 'women',      label: 'Women',        value: 'women', selected: false },
      { id: 'under_2k',   label: 'Under ₹2k',    value: 2000,    selected: false },
      { id: 'silk',       label: 'Silk',         value: 'silk',  selected: false },
      { id: 'cotton',     label: 'Cotton',       value: 'cotton', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'popular',    label: 'Popular' },
      { id: 'price_asc',  label: 'Price: low to high' },
      { id: 'new',        label: 'New arrivals' },
    ],
    selected_id: 'popular',
  },
  collection: {
    layout: 'grid',
    cards: [
      {
        variant: 'catalog',
        id: 'fabindia_silk_kurta',
        title: 'Silk blend Nehru kurta',
        subtitle: 'FabIndia',
        media: { alt: 'Cream silk kurta', fallback_color: '#E8D8B8' },
        price_label: '₹1,499',
        rating: { value: 4.4, count: 1820 },
        tags: ['Silk', 'Men'],
        filter_ids: ['men', 'under_2k', 'silk'],
        primary_event: 'catalog.kurta.fabindia_silk.open',
      },
      {
        variant: 'catalog',
        id: 'manyavar_dhoti_set',
        title: 'Dhoti kurta set — Ivory',
        subtitle: 'Manyavar',
        media: { alt: 'Ivory dhoti kurta', fallback_color: '#EDE0C2' },
        price_label: '₹3,299',
        rating: { value: 4.6, count: 842 },
        tags: ['Silk blend', 'Men'],
        badge: 'Festive pick',
        filter_ids: ['men', 'silk'],
        primary_event: 'catalog.kurta.manyavar.open',
      },
      {
        variant: 'catalog',
        id: 'biba_anarkali',
        title: 'Block-printed Anarkali',
        subtitle: 'Biba',
        media: { alt: 'Block print anarkali', fallback_color: '#D9B9B0' },
        price_label: '₹2,199',
        rating: { value: 4.3, count: 611 },
        tags: ['Cotton', 'Women'],
        filter_ids: ['women', 'cotton'],
        primary_event: 'catalog.kurta.biba.open',
      },
      {
        variant: 'catalog',
        id: 'soch_palazzo',
        title: 'Embroidered kurta palazzo',
        subtitle: 'Soch',
        media: { alt: 'Green embroidered palazzo set', fallback_color: '#BDCCAF' },
        price_label: '₹1,899',
        rating: { value: 4.5, count: 432 },
        tags: ['Rayon', 'Women'],
        filter_ids: ['women', 'under_2k'],
        primary_event: 'catalog.kurta.soch.open',
      },
      {
        variant: 'catalog',
        id: 'jaipur_kurta',
        title: 'Handblock cotton kurta',
        subtitle: 'Jaipur Kurti',
        media: { alt: 'Blue handblock print kurta', fallback_color: '#B5C2D1' },
        price_label: '₹899',
        rating: { value: 4.1, count: 2210 },
        tags: ['Cotton', 'Women'],
        filter_ids: ['women', 'under_2k', 'cotton'],
        primary_event: 'catalog.kurta.jaipur.open',
      },
    ],
  },
  edge_affordance: {
    label: 'See more',
    event: 'edge.kurta.see_more',
    kind: 'see_more',
    query: 'Show me more kurtas for Diwali',
  },
  voice_disclosure: "240 Diwali kurtas, delivery by Nov 10. FabIndia's silk Nehru kurta is top — ₹1,499, 4.4 stars, silk. Others span ₹899 to ₹3,299 across men and women. On screen — tap one, or filter by fabric?",
  meta: {
    intent: 'discover',
    query: 'Shop for a kurta for Diwali',
    total_count: 240,
    trace_id: 'trace-kurta-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_GIFTS_WEDDING = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Wedding gifts for your sister', subtitle: 'Curated · 5 collections' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'under_2k',     label: 'Under ₹2k',    value: 2000, selected: true },
      { id: 'two_to_five',  label: '₹2k - ₹5k',    value: 5000, selected: false },
      { id: 'silver',       label: 'Silver',       value: 'ag', selected: false },
      { id: 'personalised', label: 'Personalised', value: 'p',  selected: false },
      { id: 'couple_sets',  label: 'Couple sets',  value: 'cs', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'popular', label: 'Popular' },
      { id: 'price',   label: 'Price' },
      { id: 'newest',  label: 'Newest' },
    ],
    selected_id: 'popular',
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'catalog',
        id: 'silver_thali',
        title: 'Silver pooja thali',
        subtitle: 'GIVA',
        media: { alt: 'Silver pooja thali set', fallback_color: '#D3D7DB' },
        price_label: '₹1,999 – ₹4,999',
        rating: { value: 4.6, count: 312 },
        tags: ['Silver', 'Religious'],
        filter_ids: ['under_2k', 'two_to_five', 'silver'],
        primary_event: 'catalog.gift.silver_thali.open',
      },
      {
        variant: 'catalog',
        id: 'couple_portrait',
        title: 'Personalised couple portrait',
        subtitle: 'The Design Cart',
        media: { alt: 'Hand-drawn couple portrait', fallback_color: '#E2D0C0' },
        price_label: '₹1,499',
        rating: { value: 4.8, count: 1024 },
        tags: ['Personalised', 'Art'],
        badge: 'Bestseller',
        filter_ids: ['under_2k', 'personalised', 'couple_sets'],
        primary_event: 'catalog.gift.portrait.open',
      },
      {
        variant: 'catalog',
        id: 'kitchen_set',
        title: 'Stainless steel kitchen set',
        subtitle: 'Milton',
        media: { alt: 'Kitchen set', fallback_color: '#C6CBD0' },
        price_label: '₹2,499',
        rating: { value: 4.4, count: 2011 },
        tags: ['Home', 'Practical'],
        filter_ids: ['two_to_five'],
        primary_event: 'catalog.gift.kitchen_set.open',
      },
      {
        variant: 'catalog',
        id: 'cake_hamper',
        title: 'Chocolate & flowers hamper',
        subtitle: 'FernsNPetals',
        media: { alt: 'Chocolates and flower bouquet', fallback_color: '#E3C9C6' },
        price_label: '₹999 – ₹2,499',
        rating: { value: 4.5, count: 5820 },
        tags: ['Same-day', 'Delivery'],
        temporal_label: 'Same-day delivery',
        filter_ids: ['under_2k', 'two_to_five'],
        primary_event: 'catalog.gift.hamper.open',
      },
      {
        variant: 'catalog',
        id: 'home_voucher',
        title: 'Home gift card ₹5,000',
        subtitle: 'Urban Ladder',
        media: { alt: 'Urban Ladder gift card', fallback_color: '#C9B896' },
        price_label: '₹5,000',
        tags: ['Gift card', 'Flexible'],
        filter_ids: ['two_to_five'],
        primary_event: 'catalog.gift.voucher.open',
      },
    ],
  },
  edge_affordance: {
    label: 'See more gift ideas',
    event: 'edge.gifts.see_more',
    kind: 'see_more',
    query: 'Show me more wedding gift ideas',
  },
  voice_disclosure: "120 wedding gift ideas, 5 curated under ₹2k. A silver pooja thali from GIVA is popular — ₹1,999, 4.6 stars. Others include a personalised couple portrait, a kitchen set, and hampers. On screen — tap one, or narrow by price?",
  meta: {
    intent: 'discover',
    query: "Gifts for my sister's wedding",
    total_count: 120,
    trace_id: 'trace-gifts-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_MOVIES_WEEKEND = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Movies this weekend', subtitle: 'Fri – Sun · Around you' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'weekend', label: 'This weekend', value: 'wk',  selected: true },
      { id: 'hindi',   label: 'Hindi',        value: 'hi',  selected: false },
      { id: 'english', label: 'English',      value: 'en',  selected: false },
      { id: 'imax',    label: 'IMAX',         value: 'imax', selected: false },
      { id: 'threed',  label: '3D',           value: '3d',  selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'showtimes', label: 'Showtimes' },
      { id: 'rating',    label: 'Rating' },
      { id: 'release',   label: 'Release date' },
    ],
    selected_id: 'showtimes',
  },
  collection: {
    layout: 'grid',
    cards: [
      {
        variant: 'catalog',
        id: 'movie_jawan_2',
        title: 'Jawan 2',
        subtitle: 'Action · 2h 40m',
        media: { alt: 'Jawan 2 poster', fallback_color: '#8B2A2F' },
        rating: { value: 4.3, count: 18420 },
        temporal_label: 'Fri 8pm · 5 shows',
        tags: ['Hindi', 'IMAX'],
        badge: 'Opening night',
        filter_ids: ['weekend', 'hindi', 'imax'],
        primary_event: 'catalog.movie.jawan_2.open',
      },
      {
        variant: 'catalog',
        id: 'movie_oppenheimer_rerun',
        title: 'Oppenheimer (rerelease)',
        subtitle: 'Biography · 3h 0m',
        media: { alt: 'Oppenheimer poster', fallback_color: '#2F4858' },
        rating: { value: 4.8, count: 24100 },
        temporal_label: 'Sat 9:30pm · 2 shows',
        tags: ['English', 'IMAX 70mm'],
        filter_ids: ['weekend', 'english', 'imax'],
        primary_event: 'catalog.movie.oppenheimer.open',
      },
      {
        variant: 'catalog',
        id: 'movie_local_indie',
        title: 'The Mehta Boys',
        subtitle: 'Drama · 2h 12m',
        media: { alt: 'The Mehta Boys poster', fallback_color: '#A68763' },
        rating: { value: 4.5, count: 3210 },
        temporal_label: 'Sun 6:45pm · 3 shows',
        tags: ['Hindi', 'Festival'],
        filter_ids: ['weekend', 'hindi'],
        primary_event: 'catalog.movie.mehta_boys.open',
      },
      {
        variant: 'catalog',
        id: 'movie_kids_feature',
        title: 'Chhota Bheem: Damyaan',
        subtitle: 'Animated · 1h 38m',
        media: { alt: 'Chhota Bheem poster', fallback_color: '#F0C24A' },
        rating: { value: 4.1, count: 1042 },
        temporal_label: 'Sat 11am · 4 shows',
        tags: ['Hindi', 'Kids'],
        filter_ids: ['weekend', 'hindi'],
        primary_event: 'catalog.movie.chhota_bheem.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Compare showtimes',
    event: 'edge.movies.compare',
    kind: 'compare',
    query: 'Compare showtimes for weekend movies',
  },
  voice_disclosure: "32 weekend movies — 4 up top. Jawan 2 opens Friday 8pm, IMAX, 5 shows. The others run Saturday and Sunday across Hindi and English. I've put them on screen — pick one, or ask me to narrow.",
  meta: {
    intent: 'discover',
    query: 'Movies playing this weekend',
    total_count: 32,
    trace_id: 'trace-movies-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_DEVOTIONAL_MORNING = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Morning devotionals', subtitle: 'Start your day · 5 playlists' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'morning',  label: 'Morning',   value: 'am',  selected: true },
      { id: 'evening',  label: 'Evening',   value: 'pm',  selected: false },
      { id: 'hindi',    label: 'Hindi',     value: 'hi',  selected: false },
      { id: 'tamil',    label: 'Tamil',     value: 'ta',  selected: false },
      { id: 'under_1h', label: 'Under 1hr', value: 60,    selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'popular', label: 'Popular' },
      { id: 'length',  label: 'Length' },
      { id: 'new',     label: 'New' },
    ],
    selected_id: 'popular',
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'catalog',
        id: 'hanuman_chalisa',
        title: 'Hanuman Chalisa',
        subtitle: 'Hariharan',
        media: { alt: 'Hanuman Chalisa cover', fallback_color: '#D97A3A' },
        temporal_label: '42 min',
        tags: ['Hindi', 'Chant'],
        rating: { value: 4.9, count: 182410 },
        filter_ids: ['morning', 'hindi', 'under_1h'],
        primary_event: 'catalog.devotional.hanuman_chalisa.open',
      },
      {
        variant: 'catalog',
        id: 'suprabhatam',
        title: 'Venkatesha Suprabhatam',
        subtitle: 'MS Subbulakshmi',
        media: { alt: 'Suprabhatam album art', fallback_color: '#B88A2F' },
        temporal_label: '28 min',
        tags: ['Sanskrit', 'Classical'],
        rating: { value: 4.9, count: 94820 },
        badge: 'Top pick',
        filter_ids: ['morning', 'under_1h'],
        primary_event: 'catalog.devotional.suprabhatam.open',
      },
      {
        variant: 'catalog',
        id: 'gayatri_mantra',
        title: 'Gayatri Mantra 108x',
        subtitle: 'Various artists',
        media: { alt: 'Gayatri Mantra cover', fallback_color: '#E8C871' },
        temporal_label: '1h 12min',
        tags: ['Hindi', 'Loop'],
        rating: { value: 4.8, count: 58200 },
        filter_ids: ['morning', 'hindi'],
        primary_event: 'catalog.devotional.gayatri.open',
      },
      {
        variant: 'catalog',
        id: 'tamil_thevaram',
        title: 'Thevaram morning set',
        subtitle: 'Sirkazhi Govindarajan',
        media: { alt: 'Thevaram cover', fallback_color: '#C07041' },
        temporal_label: '54 min',
        tags: ['Tamil', 'Classical'],
        rating: { value: 4.7, count: 12410 },
        filter_ids: ['morning', 'tamil', 'under_1h'],
        primary_event: 'catalog.devotional.thevaram.open',
      },
      {
        variant: 'catalog',
        id: 'gurbani_nitnem',
        title: 'Nitnem banis',
        subtitle: 'Bhai Harjinder Singh',
        media: { alt: 'Nitnem album art', fallback_color: '#9C6842' },
        temporal_label: '1h 5min',
        tags: ['Punjabi', 'Gurbani'],
        rating: { value: 4.8, count: 41820 },
        filter_ids: ['morning'],
        primary_event: 'catalog.devotional.nitnem.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Save for later',
    event: 'edge.devotional.save_later',
    kind: 'save_later',
    query: 'Save these devotional tracks to my library',
  },
  voice_disclosure: "5 morning devotionals. Hariharan's Hanuman Chalisa is top — 42 minutes, 4.9 stars, in Hindi. Others run from 28 minutes to over an hour across Sanskrit, Tamil, and Punjabi. On screen — play one, or filter by language?",
  meta: {
    intent: 'discover',
    query: 'Devotional songs for morning',
    total_count: 5,
    trace_id: 'trace-devotional-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_COURSES_DATASCIENCE = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Data science courses', subtitle: '5 beginner-friendly picks' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'beginner',    label: 'Beginner',     value: 'beg',  selected: true },
      { id: 'intermediate', label: 'Intermediate', value: 'int', selected: false },
      { id: 'advanced',    label: 'Advanced',     value: 'adv', selected: false },
      { id: 'under_5k',    label: 'Under ₹5k',    value: 5000,  selected: false },
      { id: 'certificate', label: 'Certificate',  value: 'cert', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'popular', label: 'Popular' },
      { id: 'rating',  label: 'Rating' },
      { id: 'price',   label: 'Price' },
    ],
    selected_id: 'popular',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'coursera_ibm_ds',
        title: 'IBM Data Science Professional',
        subtitle: 'Coursera · IBM',
        media: { alt: 'IBM data science course', fallback_color: '#1F4C9C' },
        rating: { value: 4.6, count: 128412 },
        price_label: '₹3,999/mo',
        specs: ['11 courses', 'Beginner', 'English', 'Certificate'],
        filter_ids: ['beginner', 'under_5k', 'certificate'],
        primary_event: 'catalog.course.ibm_ds.open',
      },
      {
        variant: 'catalog',
        id: 'upgrad_iiit_ds',
        title: 'Executive PG Programme in Data Science',
        subtitle: 'upGrad · IIIT Bangalore',
        media: { alt: 'upGrad PG programme', fallback_color: '#E03D3D' },
        rating: { value: 4.4, count: 8120 },
        price_label: '₹3,50,000',
        specs: ['12 months', 'Advanced', 'Hindi + English'],
        badge: 'Industry-backed',
        filter_ids: ['advanced'],
        primary_event: 'catalog.course.upgrad.open',
      },
      {
        variant: 'catalog',
        id: 'kaggle_learn',
        title: 'Kaggle Learn: Intro to ML',
        subtitle: 'Kaggle · Google',
        media: { alt: 'Kaggle Learn', fallback_color: '#20BEFF' },
        rating: { value: 4.8, count: 54210 },
        price_label: 'Free',
        specs: ['7 lessons', 'Beginner', 'English', 'Hands-on'],
        filter_ids: ['beginner', 'under_5k'],
        primary_event: 'catalog.course.kaggle.open',
      },
      {
        variant: 'catalog',
        id: 'scaler_ds',
        title: 'Scaler Data Science & ML',
        subtitle: 'Scaler Academy',
        media: { alt: 'Scaler course', fallback_color: '#7F2FCC' },
        rating: { value: 4.5, count: 3210 },
        price_label: '₹3,49,000',
        specs: ['14 months', 'Intermediate', 'Live mentorship'],
        filter_ids: ['intermediate'],
        primary_event: 'catalog.course.scaler.open',
      },
      {
        variant: 'catalog',
        id: 'swayam_nptel',
        title: 'NPTEL Intro to Data Science',
        subtitle: 'SWAYAM · IIT Madras',
        media: { alt: 'NPTEL course', fallback_color: '#2A8C5C' },
        rating: { value: 4.3, count: 21840 },
        price_label: 'Free (₹1,000 certificate)',
        specs: ['12 weeks', 'Beginner', 'English', 'Govt.-backed'],
        filter_ids: ['beginner', 'under_5k', 'certificate'],
        primary_event: 'catalog.course.nptel.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Compare all 5',
    event: 'edge.courses.compare',
    kind: 'compare',
    query: 'Compare these 5 data science courses',
  },
  voice_disclosure: "120 data science courses, 5 starter picks. Coursera's IBM Professional leads — ₹3,999 a month, 4.6 stars, certificate. Others include a free Kaggle intro and a paid upGrad path. On screen — tap one, or filter by price?",
  meta: {
    intent: 'discover',
    query: 'Online courses for data science',
    total_count: 120,
    trace_id: 'trace-courses-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_IPL_TODAY = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'IPL today', subtitle: '2 matches · Live coverage' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'today',     label: 'Today',     value: 'today', selected: false },
      { id: 'tomorrow',  label: 'Tomorrow',  value: 'tmw',   selected: false },
      { id: 'playoffs',  label: 'Playoffs',  value: 'po',    selected: false },
      { id: 'english',   label: 'English',   value: 'en',    selected: false },
      { id: 'hindi',     label: 'Hindi',     value: 'hi',    selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'starting_soon', label: 'Starting soon' },
      { id: 'teams',         label: 'Teams' },
    ],
    selected_id: 'starting_soon',
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'catalog',
        id: 'match_mi_csk',
        title: 'MI vs CSK',
        subtitle: 'Wankhede Stadium, Mumbai',
        media: { alt: 'MI vs CSK match art', fallback_color: '#0D4AA2' },
        temporal_label: 'Today 7:30pm',
        status_label: 'Live · 14.3 overs',
        tags: ['Mumbai', 'Live TV + JioCinema'],
        badge: 'Live',
        filter_ids: ['today', 'english', 'hindi'],
        primary_event: 'catalog.ipl.mi_csk.open',
      },
      {
        variant: 'catalog',
        id: 'match_rcb_kkr',
        title: 'RCB vs KKR',
        subtitle: 'M. Chinnaswamy, Bengaluru',
        media: { alt: 'RCB vs KKR match art', fallback_color: '#EE1B2F' },
        temporal_label: 'Today 7:30pm',
        status_label: 'Toss done · RCB bowl',
        tags: ['Bengaluru'],
        filter_ids: ['today', 'english', 'hindi'],
        primary_event: 'catalog.ipl.rcb_kkr.open',
      },
      {
        variant: 'catalog',
        id: 'match_gt_rr',
        title: 'GT vs RR',
        subtitle: 'Narendra Modi Stadium, Ahmedabad',
        media: { alt: 'GT vs RR match art', fallback_color: '#4D7FC9' },
        temporal_label: 'Tomorrow 3:30pm',
        tags: ['Ahmedabad', 'Doubleheader'],
        filter_ids: ['tomorrow', 'english', 'hindi'],
        primary_event: 'catalog.ipl.gt_rr.open',
      },
      {
        variant: 'catalog',
        id: 'match_srh_lsg',
        title: 'SRH vs LSG',
        subtitle: 'Rajiv Gandhi Stadium, Hyderabad',
        media: { alt: 'SRH vs LSG match art', fallback_color: '#F26722' },
        temporal_label: 'Tomorrow 7:30pm',
        tags: ['Hyderabad'],
        filter_ids: ['tomorrow', 'english', 'hindi'],
        primary_event: 'catalog.ipl.srh_lsg.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Remind me for MI vs CSK',
    event: 'edge.ipl.remind_later',
    kind: 'remind_later',
    query: 'Remind me 15 minutes before MI vs CSK starts',
  },
  voice_disclosure: "2 matches today, 2 tomorrow. MI vs CSK is live now — Wankhede Mumbai, 14.3 overs in, English and Hindi. RCB vs KKR starts at 7:30pm. On screen — tap to watch, or set a reminder?",
  meta: {
    intent: 'discover',
    query: 'IPL matches today',
    total_count: 4,
    trace_id: 'trace-ipl-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_SCHEMES_FARMERS = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Schemes for farmers', subtitle: '5 active Govt. schemes' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'active',    label: 'Active',     value: 'on',  selected: true },
      { id: 'subsidy',   label: 'Subsidy',    value: 'sub', selected: false },
      { id: 'insurance', label: 'Insurance',  value: 'ins', selected: false },
      { id: 'credit',    label: 'Credit',     value: 'cre', selected: false },
      { id: 'pan_india', label: 'Pan-India',  value: 'pan', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'deadline', label: 'Deadline' },
      { id: 'alpha',    label: 'A–Z' },
    ],
    selected_id: 'deadline',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'pm_kisan',
        title: 'PM-KISAN Samman Nidhi',
        subtitle: 'Ministry of Agriculture & Farmers Welfare',
        media: { alt: 'PM-KISAN seal', fallback_color: '#FBB040' },
        temporal_label: 'Applications open · 17th instalment',
        specs: ['Landholding < 2ha', '₹6,000/yr', 'DBT to bank'],
        status_label: 'Active',
        tags: ['Direct benefit'],
        badge: 'Top-up pending',
        filter_ids: ['active', 'subsidy', 'pan_india'],
        primary_event: 'catalog.scheme.pm_kisan.open',
      },
      {
        variant: 'catalog',
        id: 'pmfby',
        title: 'Pradhan Mantri Fasal Bima Yojana',
        subtitle: 'Dept. of Agriculture & Cooperation',
        media: { alt: 'PMFBY seal', fallback_color: '#2F8F3C' },
        temporal_label: 'Enroll before Nov 30 (Rabi)',
        specs: ['Crop insurance', 'Premium 2% (kharif) / 1.5% (rabi)'],
        status_label: 'Enrolment window',
        tags: ['Insurance'],
        filter_ids: ['active', 'insurance', 'pan_india'],
        primary_event: 'catalog.scheme.pmfby.open',
      },
      {
        variant: 'catalog',
        id: 'kcc',
        title: 'Kisan Credit Card',
        subtitle: 'NABARD + partner banks',
        media: { alt: 'Kisan Credit Card', fallback_color: '#1F6AB0' },
        temporal_label: 'Open all year',
        specs: ['Short-term credit', '4% interest (after subvention)', 'Up to ₹3L'],
        tags: ['Credit'],
        filter_ids: ['active', 'credit', 'pan_india'],
        primary_event: 'catalog.scheme.kcc.open',
      },
      {
        variant: 'catalog',
        id: 'ensure',
        title: 'e-NAM',
        subtitle: 'Small Farmers Agribusiness Consortium',
        media: { alt: 'e-NAM portal', fallback_color: '#C0403F' },
        temporal_label: 'Always-on market',
        specs: ['Online mandi', '1,400+ markets', 'Zero commission'],
        status_label: 'Active',
        tags: ['Market access'],
        filter_ids: ['active', 'pan_india'],
        primary_event: 'catalog.scheme.enam.open',
      },
      {
        variant: 'catalog',
        id: 'nmsa_soil_health',
        title: 'Soil Health Card Scheme',
        subtitle: 'National Mission for Sustainable Agriculture',
        media: { alt: 'Soil Health Card', fallback_color: '#8B5A2B' },
        temporal_label: 'Renewal due Mar 2026',
        specs: ['Free testing', 'Every 3 years', 'Region-specific advisory'],
        tags: ['Advisory'],
        filter_ids: ['active', 'pan_india'],
        primary_event: 'catalog.scheme.soil_health.open',
      },
    ],
  },
  edge_affordance: {
    label: 'See all central schemes',
    event: 'edge.schemes.see_more',
    kind: 'see_more',
    query: 'Show me all central government schemes for farmers',
  },
  voice_disclosure: "5 active farmer schemes. PM-KISAN's 17th instalment is open now — ₹6,000 a year, direct to bank, for under-2-hectare holdings. Others cover crop insurance, credit, and soil advisory. On screen — tap one, or see all central schemes?",
  meta: {
    intent: 'discover',
    query: 'Government schemes for farmers',
    total_count: 5,
    trace_id: 'trace-schemes-001',
  },
};

/* ---- Compare (7) ---- */

/** @type {CompareDiscoveryView} */
const MOCK_HOME_LOANS = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Home loans under 8%', subtitle: '₹50L · 20yr term · Salaried' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'under_eight',  label: 'Under 8%',     value: 8,     selected: true },
      { id: 'psu',          label: 'PSU banks',    value: 'psu', selected: false },
      { id: 'nbfc',         label: 'NBFCs',        value: 'nbfc', selected: false },
      { id: 'zero_proc',    label: 'No proc. fee', value: 0,     selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'rate',   label: 'Interest rate' },
      { id: 'emi',    label: 'EMI' },
      { id: 'tenure', label: 'Max tenure' },
    ],
    selected_id: 'rate',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Parameter', recommended_id: 'sbi' },
    options: [
      {
        id: 'sbi',
        title: 'SBI',
        subtitle: 'MaxGain Home Loan',
        badge: 'Lowest rate',
        primary_event: 'compare.home_loan.sbi.open',
      },
      {
        id: 'hdfc',
        title: 'HDFC Bank',
        subtitle: 'Adjustable Rate',
        primary_event: 'compare.home_loan.hdfc.open',
      },
      {
        id: 'icici',
        title: 'ICICI Bank',
        subtitle: 'Extra-Home Loan',
        primary_event: 'compare.home_loan.icici.open',
      },
    ],
    rows: [
      {
        id: 'rate', label: 'Interest rate',
        values: [
          { option_id: 'sbi',   display: '7.80%', emphasis: 'best' },
          { option_id: 'hdfc',  display: '7.95%' },
          { option_id: 'icici', display: '8.10%', emphasis: 'worst' },
        ],
      },
      {
        id: 'proc_fee', label: 'Processing fee',
        values: [
          { option_id: 'sbi',   display: '0.35% (cap ₹10k)' },
          { option_id: 'hdfc',  display: '0.50% (min ₹4.5k)' },
          { option_id: 'icici', display: '0.50% (min ₹5k)' },
        ],
      },
      {
        id: 'tenure', label: 'Max tenure',
        values: [
          { option_id: 'sbi',   display: '30 yrs' },
          { option_id: 'hdfc',  display: '30 yrs' },
          { option_id: 'icici', display: '30 yrs' },
        ],
      },
      {
        id: 'emi', label: 'EMI (₹50L · 20yr)',
        values: [
          { option_id: 'sbi',   display: '₹41,293', emphasis: 'best' },
          { option_id: 'hdfc',  display: '₹41,748' },
          { option_id: 'icici', display: '₹42,206' },
        ],
      },
      {
        id: 'eligibility', label: 'Min salary',
        values: [
          { option_id: 'sbi',   display: '₹25k/mo' },
          { option_id: 'hdfc',  display: '₹40k/mo' },
          { option_id: 'icici', display: '₹30k/mo' },
        ],
      },
    ],
  },
  voice_disclosure: "3 home loans under 8%. SBI MaxGain has the lowest rate — 7.80 percent, ₹41,293 monthly, processing fee capped at ₹10k. HDFC and ICICI are slightly higher. On screen — tap SBI, or compare all three?",
  meta: {
    intent: 'discover',
    query: 'Compare home loans under 8%',
    total_count: 3,
    trace_id: 'trace-home-loans-001',
  },
};

/** @type {CompareDiscoveryView} */
const MOCK_FLIGHTS_MUMBAI = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Flights to Mumbai tomorrow', subtitle: 'BLR → BOM · 1 traveller · Economy' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'nonstop',   label: 'Non-stop',  value: 0,    selected: true },
      { id: 'morning',   label: 'Morning',   value: 'am', selected: false },
      { id: 'under_5k',  label: 'Under ₹5k', value: 5000, selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'price',    label: 'Price' },
      { id: 'duration', label: 'Duration' },
      { id: 'depart',   label: 'Depart' },
    ],
    selected_id: 'price',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Detail', recommended_id: 'indigo' },
    options: [
      {
        id: 'indigo',
        title: 'IndiGo',
        subtitle: '6E-5013',
        badge: 'Cheapest',
        primary_event: 'compare.flight.indigo.open',
      },
      {
        id: 'airindia',
        title: 'Air India',
        subtitle: 'AI-504',
        primary_event: 'compare.flight.airindia.open',
      },
      {
        id: 'vistara',
        title: 'Vistara',
        subtitle: 'UK-864',
        primary_event: 'compare.flight.vistara.open',
      },
      {
        id: 'akasa',
        title: 'Akasa',
        subtitle: 'QP-1315',
        primary_event: 'compare.flight.akasa.open',
      },
    ],
    rows: [
      {
        id: 'depart', label: 'Depart',
        values: [
          { option_id: 'indigo',   display: '06:20' },
          { option_id: 'airindia', display: '08:45' },
          { option_id: 'vistara',  display: '10:15' },
          { option_id: 'akasa',    display: '13:50' },
        ],
      },
      {
        id: 'arrive', label: 'Arrive',
        values: [
          { option_id: 'indigo',   display: '08:10' },
          { option_id: 'airindia', display: '10:30' },
          { option_id: 'vistara',  display: '12:05' },
          { option_id: 'akasa',    display: '15:35' },
        ],
      },
      {
        id: 'duration', label: 'Duration',
        values: [
          { option_id: 'indigo',   display: '1h 50m', emphasis: 'best' },
          { option_id: 'airindia', display: '1h 45m', emphasis: 'best' },
          { option_id: 'vistara',  display: '1h 50m' },
          { option_id: 'akasa',    display: '1h 45m', emphasis: 'best' },
        ],
      },
      {
        id: 'stops', label: 'Stops',
        values: [
          { option_id: 'indigo',   display: 'Non-stop' },
          { option_id: 'airindia', display: 'Non-stop' },
          { option_id: 'vistara',  display: 'Non-stop' },
          { option_id: 'akasa',    display: 'Non-stop' },
        ],
      },
      {
        id: 'price', label: 'Price',
        values: [
          { option_id: 'indigo',   display: '₹4,299', emphasis: 'best' },
          { option_id: 'airindia', display: '₹5,820' },
          { option_id: 'vistara',  display: '₹6,499', emphasis: 'worst' },
          { option_id: 'akasa',    display: '₹4,850' },
        ],
      },
    ],
  },
  edge_affordance: {
    label: 'Set price alert',
    event: 'edge.flights.remind_later',
    kind: 'remind_later',
    query: 'Alert me if any flight drops below ₹3,500',
  },
  voice_disclosure: "4 non-stop flights to Mumbai tomorrow. IndiGo is cheapest — ₹4,299, 6:20 AM, 1h 50m. Others run up to ₹6,499 through the afternoon. On screen — tap IndiGo, or set a price alert below ₹3,500?",
  meta: {
    intent: 'discover',
    query: 'Cheap flights to Mumbai tomorrow',
    total_count: 4,
    trace_id: 'trace-flights-001',
  },
};

/** @type {CompareDiscoveryView} */
const MOCK_RECHARGE_299 = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: '₹299 recharge plans', subtitle: 'Prepaid · Compare OTT benefits' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'twenty_eight', label: '28-day',   value: 28,   selected: true },
      { id: 'with_ott',     label: 'With OTT', value: 'ott', selected: false },
      { id: 'fiveg',        label: '5G',       value: '5g', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'data',     label: 'Data/day' },
      { id: 'validity', label: 'Validity' },
    ],
    selected_id: 'data',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Benefit', recommended_id: 'jio' },
    options: [
      {
        id: 'jio',
        title: 'Jio',
        subtitle: '₹299 · 28 days',
        badge: 'Best value',
        primary_event: 'compare.recharge.jio.open',
      },
      {
        id: 'airtel',
        title: 'Airtel',
        subtitle: '₹299 · 28 days',
        primary_event: 'compare.recharge.airtel.open',
      },
      {
        id: 'vi',
        title: 'Vi',
        subtitle: '₹299 · 28 days',
        primary_event: 'compare.recharge.vi.open',
      },
    ],
    rows: [
      {
        id: 'data', label: 'Data/day',
        values: [
          { option_id: 'jio',    display: '2 GB', emphasis: 'best' },
          { option_id: 'airtel', display: '1.5 GB' },
          { option_id: 'vi',     display: '1.5 GB' },
        ],
      },
      {
        id: 'calling', label: 'Calling',
        values: [
          { option_id: 'jio',    display: 'Unlimited' },
          { option_id: 'airtel', display: 'Unlimited' },
          { option_id: 'vi',     display: 'Unlimited' },
        ],
      },
      {
        id: 'validity', label: 'Validity',
        values: [
          { option_id: 'jio',    display: '28 days' },
          { option_id: 'airtel', display: '28 days' },
          { option_id: 'vi',     display: '28 days' },
        ],
      },
      {
        id: 'sms', label: 'SMS',
        values: [
          { option_id: 'jio',    display: '100/day' },
          { option_id: 'airtel', display: '100/day' },
          { option_id: 'vi',     display: '100/day' },
        ],
      },
      {
        id: 'ott', label: 'OTT benefits',
        values: [
          { option_id: 'jio',    display: 'JioCinema Premium', emphasis: 'best' },
          { option_id: 'airtel', display: 'Xstream Play' },
          { option_id: 'vi',     display: 'None', emphasis: 'worst' },
        ],
      },
    ],
  },
  voice_disclosure: "3 plans at ₹299 for 28 days. Jio gives the most — 2 GB a day, unlimited calls, JioCinema Premium. Airtel and Vi offer 1.5 GB with smaller OTT perks. On screen — tap Jio, or compare side by side?",
  meta: {
    intent: 'discover',
    query: '₹299 mobile recharge plans',
    total_count: 3,
    trace_id: 'trace-recharge-001',
  },
};

/** @type {CompareDiscoveryView} */
const MOCK_PHONES_20K = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Phones under ₹20,000', subtitle: 'Top picks · 5G · 8GB+ RAM' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'fiveg',     label: '5G',         value: '5g', selected: true },
      { id: 'eight_gb',  label: '8 GB RAM',   value: 8,    selected: false },
      { id: 'amoled',    label: 'AMOLED',     value: 'amo', selected: false },
      { id: 'hundred',   label: '100+ MP',    value: 100,  selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'value',      label: 'Value' },
      { id: 'price',      label: 'Price' },
      { id: 'new',        label: 'Newest' },
    ],
    selected_id: 'value',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Spec', recommended_id: 'redmi' },
    options: [
      {
        id: 'redmi',
        title: 'Redmi Note 14 Pro',
        subtitle: '5G · 8+256',
        badge: 'Best camera',
        primary_event: 'compare.phone.redmi.open',
      },
      {
        id: 'samsung',
        title: 'Samsung Galaxy M35',
        subtitle: '5G · 8+128',
        primary_event: 'compare.phone.samsung.open',
      },
      {
        id: 'realme',
        title: 'Realme Narzo 70 Pro',
        subtitle: '5G · 8+128',
        primary_event: 'compare.phone.realme.open',
      },
    ],
    rows: [
      {
        id: 'ram', label: 'RAM',
        values: [
          { option_id: 'redmi',   display: '8 GB' },
          { option_id: 'samsung', display: '8 GB' },
          { option_id: 'realme',  display: '8 GB' },
        ],
      },
      {
        id: 'storage', label: 'Storage',
        values: [
          { option_id: 'redmi',   display: '256 GB', emphasis: 'best' },
          { option_id: 'samsung', display: '128 GB' },
          { option_id: 'realme',  display: '128 GB' },
        ],
      },
      {
        id: 'camera', label: 'Rear camera',
        values: [
          { option_id: 'redmi',   display: '200 MP', emphasis: 'best' },
          { option_id: 'samsung', display: '50 MP' },
          { option_id: 'realme',  display: '50 MP' },
        ],
      },
      {
        id: 'battery', label: 'Battery',
        values: [
          { option_id: 'redmi',   display: '5,110 mAh' },
          { option_id: 'samsung', display: '6,000 mAh', emphasis: 'best' },
          { option_id: 'realme',  display: '5,000 mAh', emphasis: 'worst' },
        ],
      },
      {
        id: 'display', label: 'Display',
        values: [
          { option_id: 'redmi',   display: '6.67" AMOLED 120Hz' },
          { option_id: 'samsung', display: '6.6" Super AMOLED' },
          { option_id: 'realme',  display: '6.67" AMOLED 120Hz' },
        ],
      },
      {
        id: 'price', label: 'Price',
        values: [
          { option_id: 'redmi',   display: '₹18,999' },
          { option_id: 'samsung', display: '₹16,499', emphasis: 'best' },
          { option_id: 'realme',  display: '₹17,999' },
        ],
      },
    ],
  },
  edge_affordance: {
    label: 'See reviews',
    event: 'edge.phones.context_shift',
    kind: 'context_shift',
    query: 'Show reviews for these phones',
  },
  voice_disclosure: "3 phones under ₹20,000. Redmi Note 14 Pro leads on camera — 200 megapixels, 8+256, ₹18,999. Samsung M35 is cheapest at ₹16,499 with a bigger battery. On screen — tap Redmi, or narrow by spec?",
  meta: {
    intent: 'discover',
    query: 'Best phones under ₹20,000',
    total_count: 3,
    trace_id: 'trace-phones-001',
  },
};

/** @type {CompareDiscoveryView} */
const MOCK_TRAINS_TATKAL = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Tatkal trains home', subtitle: 'Mumbai → Patna · Tomorrow' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'ac3',       label: '3AC',        value: '3a', selected: true },
      { id: 'ac2',       label: '2AC',        value: '2a', selected: false },
      { id: 'evening',   label: 'Evening',    value: 'pm', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'depart',   label: 'Depart' },
      { id: 'duration', label: 'Duration' },
      { id: 'seats',    label: 'Seats available' },
    ],
    selected_id: 'depart',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Train', recommended_id: 'rajdhani' },
    options: [
      {
        id: 'rajdhani',
        title: 'Rajdhani Exp',
        subtitle: '12310 · Premium',
        badge: 'Fastest',
        primary_event: 'compare.train.rajdhani.open',
      },
      {
        id: 'duronto',
        title: 'Duronto Exp',
        subtitle: '12214',
        primary_event: 'compare.train.duronto.open',
      },
      {
        id: 'shatabdi',
        title: 'Sampark Kranti',
        subtitle: '12394',
        primary_event: 'compare.train.shatabdi.open',
      },
    ],
    rows: [
      {
        id: 'depart', label: 'Depart LTT',
        values: [
          { option_id: 'rajdhani', display: '16:55' },
          { option_id: 'duronto',  display: '21:15' },
          { option_id: 'shatabdi', display: '07:05' },
        ],
      },
      {
        id: 'arrive', label: 'Arrive PNBE',
        values: [
          { option_id: 'rajdhani', display: '07:40 +1' },
          { option_id: 'duronto',  display: '11:15 +1' },
          { option_id: 'shatabdi', display: '22:55' },
        ],
      },
      {
        id: 'duration', label: 'Duration',
        values: [
          { option_id: 'rajdhani', display: '14h 45m', emphasis: 'best' },
          { option_id: 'duronto',  display: '14h 0m', emphasis: 'best' },
          { option_id: 'shatabdi', display: '15h 50m' },
        ],
      },
      {
        id: 'class', label: 'Available class',
        values: [
          { option_id: 'rajdhani', display: '3AC / 2AC / 1AC' },
          { option_id: 'duronto',  display: '3AC / 2AC' },
          { option_id: 'shatabdi', display: 'SL / 3AC' },
        ],
      },
      {
        id: 'seats', label: 'Tatkal seats',
        values: [
          { option_id: 'rajdhani', display: '12 (3AC)' },
          { option_id: 'duronto',  display: '4 (3AC)', emphasis: 'worst' },
          { option_id: 'shatabdi', display: '28 (SL)', emphasis: 'best' },
        ],
      },
      {
        id: 'fare', label: 'Tatkal fare (3AC)',
        values: [
          { option_id: 'rajdhani', display: '₹2,305' },
          { option_id: 'duronto',  display: '₹2,190' },
          { option_id: 'shatabdi', display: '₹1,450', emphasis: 'best' },
        ],
      },
    ],
  },
  edge_affordance: {
    label: 'Set tatkal alert',
    event: 'edge.tatkal.remind_later',
    kind: 'remind_later',
    query: 'Alert me 5 minutes before tatkal booking opens',
  },
  voice_disclosure: "3 tatkal trains to Patna tomorrow. Rajdhani Express leaves LTT at 4:55 PM — 14h 45m, ₹2,305 in 3AC. Duronto runs later, Sampark Kranti is cheapest. On screen — tap Rajdhani, or set a tatkal alert?",
  meta: {
    intent: 'discover',
    query: 'Tatkal trains to hometown',
    total_count: 3,
    trace_id: 'trace-trains-001',
  },
};

/** @type {CompareDiscoveryView} */
const MOCK_HEALTH_INSURANCE = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Health cover · Family of 4', subtitle: '2 adults + 2 kids · ₹10L sum insured' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'cashless',    label: 'Cashless',      value: 'cl',  selected: true },
      { id: 'no_room_cap', label: 'No room cap',   value: 'cap', selected: false },
      { id: 'pre_existing', label: 'PED covered',  value: 'ped', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'premium',  label: 'Premium' },
      { id: 'cover',    label: 'Cover' },
      { id: 'hospitals', label: 'Hospitals' },
    ],
    selected_id: 'premium',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Parameter', recommended_id: 'star' },
    options: [
      {
        id: 'star',
        title: 'Star Health',
        subtitle: 'Family Health Optima',
        badge: 'Widest hospital network',
        primary_event: 'compare.insurance.star.open',
      },
      {
        id: 'hdfc_ergo',
        title: 'HDFC Ergo',
        subtitle: 'my:health Suraksha',
        primary_event: 'compare.insurance.hdfc_ergo.open',
      },
      {
        id: 'niva_bupa',
        title: 'Niva Bupa',
        subtitle: 'Reassure 2.0',
        primary_event: 'compare.insurance.niva_bupa.open',
      },
    ],
    rows: [
      {
        id: 'cover', label: 'Cover',
        values: [
          { option_id: 'star',       display: '₹10L' },
          { option_id: 'hdfc_ergo',  display: '₹10L' },
          { option_id: 'niva_bupa',  display: '₹10L + ∞ restore', emphasis: 'best' },
        ],
      },
      {
        id: 'premium', label: 'Premium / yr',
        values: [
          { option_id: 'star',       display: '₹18,920', emphasis: 'best' },
          { option_id: 'hdfc_ergo',  display: '₹21,480' },
          { option_id: 'niva_bupa',  display: '₹24,750', emphasis: 'worst' },
        ],
      },
      {
        id: 'hospitals', label: 'Network hospitals',
        values: [
          { option_id: 'star',       display: '14,000+', emphasis: 'best' },
          { option_id: 'hdfc_ergo',  display: '13,000+' },
          { option_id: 'niva_bupa',  display: '10,000+' },
        ],
      },
      {
        id: 'cashless', label: 'Cashless',
        values: [
          { option_id: 'star',       display: 'Yes' },
          { option_id: 'hdfc_ergo',  display: 'Yes' },
          { option_id: 'niva_bupa',  display: 'Yes' },
        ],
      },
      {
        id: 'ped', label: 'PED waiting',
        values: [
          { option_id: 'star',       display: '3 yrs' },
          { option_id: 'hdfc_ergo',  display: '3 yrs' },
          { option_id: 'niva_bupa',  display: '2 yrs', emphasis: 'best' },
        ],
      },
    ],
  },
  edge_affordance: {
    label: 'Talk to an advisor',
    event: 'edge.health_insurance.context_shift',
    kind: 'context_shift',
    query: 'Connect me with an insurance advisor',
  },
  voice_disclosure: "3 family health plans at ₹10L cover. Star Optima has the widest network — ₹18,920 a year, 14,000 hospitals, cashless. Niva Bupa costs more but adds unlimited restore. On screen — tap Star, or talk to an advisor?",
  meta: {
    intent: 'discover',
    query: 'Health insurance for family of 4',
    total_count: 3,
    trace_id: 'trace-insurance-001',
  },
};

/** @type {CompareDiscoveryView} */
const MOCK_EMI_FRIDGE = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'EMI for LG 260L fridge', subtitle: '₹32,990 · No-cost EMI options' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'no_cost',   label: 'No-cost EMI', value: 'ncemi', selected: true },
      { id: 'credit',    label: 'Credit card', value: 'cc',    selected: false },
      { id: 'debit',     label: 'Debit card',  value: 'dc',    selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'monthly',  label: 'Monthly EMI' },
      { id: 'tenure',   label: 'Tenure' },
      { id: 'interest', label: 'Total interest' },
    ],
    selected_id: 'monthly',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Detail', recommended_id: 'bajaj' },
    options: [
      {
        id: 'bajaj',
        title: 'Bajaj Finserv',
        subtitle: 'No-cost EMI',
        badge: 'Zero interest',
        primary_event: 'compare.emi.bajaj.open',
      },
      {
        id: 'hdfc_cc',
        title: 'HDFC Credit Card',
        subtitle: '12 months',
        primary_event: 'compare.emi.hdfc_cc.open',
      },
      {
        id: 'sbi_cc',
        title: 'SBI Credit Card',
        subtitle: '9 months',
        primary_event: 'compare.emi.sbi_cc.open',
      },
    ],
    rows: [
      {
        id: 'tenure', label: 'Tenure',
        values: [
          { option_id: 'bajaj',   display: '12 months' },
          { option_id: 'hdfc_cc', display: '12 months' },
          { option_id: 'sbi_cc',  display: '9 months' },
        ],
      },
      {
        id: 'monthly', label: 'Monthly EMI',
        values: [
          { option_id: 'bajaj',   display: '₹2,749', emphasis: 'best' },
          { option_id: 'hdfc_cc', display: '₹2,895' },
          { option_id: 'sbi_cc',  display: '₹3,758' },
        ],
      },
      {
        id: 'proc_fee', label: 'Processing fee',
        values: [
          { option_id: 'bajaj',   display: '₹249' },
          { option_id: 'hdfc_cc', display: '1%' },
          { option_id: 'sbi_cc',  display: '1.5%', emphasis: 'worst' },
        ],
      },
      {
        id: 'total_int', label: 'Total interest',
        values: [
          { option_id: 'bajaj',   display: '₹0', emphasis: 'best' },
          { option_id: 'hdfc_cc', display: '₹1,750' },
          { option_id: 'sbi_cc',  display: '₹890' },
        ],
      },
    ],
  },
  voice_disclosure: "3 EMI options for this ₹32,990 fridge. Bajaj Finserv is zero-interest — ₹2,749 a month, 12 months, ₹249 fee. HDFC and SBI cards charge real interest on top. On screen — tap Bajaj, or see interest totals?",
  meta: {
    intent: 'discover',
    query: 'EMI options for this fridge',
    total_count: 3,
    trace_id: 'trace-emi-001',
  },
};

/* ============================================================================
   Voice-first use cases (Path A) — eleven new mocks across the four pillars
   defined in docs/voice-first-use-cases.md. All flows are mock-only; no real
   backend integrations. Order in this file is by spec section.
   ============================================================================ */

/* ---- §4.2 Plumbers — Indore variant for Track-B T2 city script ---- */
/** @type {PlaceDiscoveryView} */
const MOCK_PLUMBERS_INDORE = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Plumbers in your area', subtitle: '3 available now · Vijay Nagar, Indore' },
  location_context: { area: 'Vijay Nagar, Indore', change_event: 'location.change.indore' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'available_now', label: 'Available now', value: 'avail', selected: true },
      { id: 'under_400',     label: 'Under ₹400',    value: 400,     selected: false },
      { id: 'verified',      label: 'Verified',       value: 'ok',   selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'availability', label: 'Availability' },
      { id: 'distance',     label: 'Distance' },
      { id: 'rating',       label: 'Rating' },
    ],
    selected_id: 'availability',
  },
  map: {
    center: { lat: 22.7531, lng: 75.8937 },
    zoom: 14,
    user_location: { lat: 22.7531, lng: 75.8937 },
    markers: [
      { id: 'urban_co_indore', lat: 22.7548, lng: 75.8956 },
      { id: 'shree_plumbing',  lat: 22.7517, lng: 75.8918 },
      { id: 'apna_plumber',    lat: 22.7558, lng: 75.8929 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'urban_co_indore',
        title: 'Urban Company',
        media: { alt: 'Urban Company technician', fallback_color: '#8FB4D6' },
        rating: { value: 4.7, count: 1820 },
        distance_km: 0.6,
        price_label: '₹349/visit',
        tags: ['Verified', '45-min ETA'],
        status: { kind: 'open', label: 'Available now' },
        filter_ids: ['available_now', 'under_400', 'verified'],
        primary_event: 'place.plumber_indore.urban_co.open',
      },
      {
        variant: 'place',
        id: 'shree_plumbing',
        title: 'Shree Plumbing Works',
        media: { alt: 'Shree Plumbing van', fallback_color: '#A5BFD3' },
        rating: { value: 4.4, count: 218 },
        distance_km: 1.2,
        price_label: '₹250/visit',
        tags: ['Local', 'Same-day'],
        status: { kind: 'open', label: 'Available now' },
        filter_ids: ['available_now', 'under_400'],
        primary_event: 'place.plumber_indore.shree.open',
      },
      {
        variant: 'place',
        id: 'apna_plumber',
        title: 'Apna Plumber',
        media: { alt: 'Apna Plumber team', fallback_color: '#B6CBDC' },
        rating: { value: 4.2, count: 96 },
        distance_km: 0.9,
        price_label: '₹299/visit',
        tags: ['Verified'],
        status: { kind: 'open', label: 'Available now' },
        filter_ids: ['available_now', 'under_400', 'verified'],
        primary_event: 'place.plumber_indore.apna.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Kal subah ke liye yaad dilao',
    event: 'edge.plumbers_indore.remind_later',
    kind: 'remind_later',
    query: 'Mujhe kal subah plumber book karne ke liye yaad dilana',
  },
  voice_disclosure: "3 plumbers free now in Vijay Nagar. Urban Company sabse paas — ₹349, 45-min ETA, 4.7 stars. Shree Plumbing aur Apna Plumber bhi available hain. On screen — Urban Company tap karein, ya doosre suniyega?",
  suggested_prompts: [
    { label: 'Kal subah ke liye yaad dilao', kind: 'remind_later',  query: 'Kal subah plumber book karne ki yaad dilana' },
    { label: 'Inhe compare karo',            kind: 'compare',       query: 'Indore ke plumbers ka comparison dikhao — price, ratings, ETA' },
    { label: 'Electrician bhi chahiye?',     kind: 'context_shift', query: 'Indore mein electrician kaun available hai' },
  ],
  meta: {
    intent: 'discover',
    query: 'Plumber in Indore',
    total_count: 3,
    trace_id: 'trace-plumbers-indore-001',
  },
};

/* ---- §4.3 ₹299 single-plan recharge — Transactional Single-Path ---- */
/** @type {CatalogDiscoveryView} */
const MOCK_RECHARGE_299_SINGLE = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: '₹299 plan ready to confirm', subtitle: 'Jio prepaid · Activates in 1 min' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'twenty_eight', label: '28-day', value: 28, selected: true },
    ],
  },
  sort: {
    options: [
      { id: 'recommended', label: 'Recommended' },
    ],
    selected_id: 'recommended',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'jio_299',
        title: 'Jio ₹299 · 28 days',
        subtitle: 'Recommended for your number',
        media: { alt: 'Jio recharge plan', fallback_color: '#B7E0F4' },
        price_label: '₹299',
        temporal_label: '28 days · 2GB/day · Unlimited calls',
        status_label: 'JioCinema Premium included',
        badge: 'Best value',
        tags: ['2GB/day', 'Unlimited', 'JioCinema'],
        specs: ['100 SMS/day', '5G included', 'Auto-pay optional'],
        primary_event: 'catalog.recharge_299_single.confirm_pay',
      },
    ],
  },
  edge_affordance: {
    label: 'Doosre plans dikhao',
    event: 'edge.recharge_299_single.compare',
    kind: 'compare',
    query: 'Doosre ₹299 plans bhi dikhao',
  },
  voice_disclosure: "₹299 plan mil gaya — 28 din validity, 2GB rozaana, unlimited calls, JioCinema premium. Confirm karein? On screen — Confirm & Pay tap karein.",
  suggested_prompts: [
    { label: 'Doosre plans dikhao',          kind: 'compare',       query: 'Doosre Jio recharge plans dikhao' },
    { label: 'Mera plan kab khatam hoga',    kind: 'see_more',      query: 'Mera current Jio plan kab expire ho raha hai' },
    { label: 'Family ke liye bhi karo',      kind: 'context_shift', query: 'Mere doosre Jio numbers bhi recharge karo' },
  ],
  meta: {
    intent: 'discover',
    query: '₹299 wala recharge lagao',
    total_count: 1,
    trace_id: 'trace-recharge-single-001',
  },
};

/* ---- §4.4 Pediatricians at 2 a.m. — Local services emergency mode ---- */
/** @type {PlaceDiscoveryView} */
const MOCK_PEDIATRICIANS_OPEN_NOW = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Pediatricians open now', subtitle: '3 clinics within 5 km · child fever' },
  location_context: { area: 'Gomti Nagar, Lucknow', change_event: 'location.change.lucknow' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'open_now',    label: 'Open now',    value: 'open',  selected: true },
      { id: 'teleconsult', label: 'Tele-consult', value: 'tele', selected: false },
      { id: 'within_5km',  label: 'Within 5 km', value: 5,       selected: false },
      { id: 'pediatric',   label: 'Pediatric',    value: 'paed', selected: true },
    ],
  },
  sort: {
    options: [
      { id: 'distance',  label: 'Distance' },
      { id: 'rating',    label: 'Rating' },
      { id: 'eta',       label: 'Tele-consult ETA' },
    ],
    selected_id: 'distance',
  },
  map: {
    center: { lat: 26.8540, lng: 80.9956 },
    zoom: 13,
    user_location: { lat: 26.8540, lng: 80.9956 },
    markers: [
      { id: 'apollo_24x7', lat: 26.8517, lng: 80.9985 },
      { id: 'cloudnine',   lat: 26.8568, lng: 80.9924 },
      { id: 'rainbow',     lat: 26.8579, lng: 81.0012 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'apollo_24x7',
        title: 'Apollo 24×7 Pediatrics',
        media: { alt: 'Apollo clinic exterior', fallback_color: '#A8C5DA' },
        rating: { value: 4.6, count: 1842 },
        distance_km: 2.3,
        price_label: 'Tele-consult ₹399',
        tags: ['24/7', 'Tele-consult', 'Pediatric'],
        status: { kind: 'open', label: 'Open · 24/7' },
        filter_ids: ['open_now', 'teleconsult', 'within_5km', 'pediatric'],
        primary_event: 'place.pediatrician.apollo_24x7.call',
      },
      {
        variant: 'place',
        id: 'cloudnine',
        title: 'Cloudnine Hospital',
        media: { alt: 'Cloudnine pediatric ward', fallback_color: '#B3D6E2' },
        rating: { value: 4.8, count: 924 },
        distance_km: 3.1,
        price_label: 'Walk-in ₹600',
        tags: ['Open now', 'Pediatric', 'NICU'],
        status: { kind: 'open', label: 'Open · 24/7' },
        filter_ids: ['open_now', 'within_5km', 'pediatric'],
        primary_event: 'place.pediatrician.cloudnine.call',
      },
      {
        variant: 'place',
        id: 'rainbow',
        title: 'Rainbow Children\u2019s Hospital',
        media: { alt: 'Rainbow Children Hospital', fallback_color: '#C8DCC4' },
        rating: { value: 4.5, count: 1240 },
        distance_km: 4.6,
        price_label: 'Tele-consult ₹450',
        tags: ['Tele-consult', 'Pediatric'],
        status: { kind: 'open', label: 'Open · 24/7' },
        filter_ids: ['open_now', 'teleconsult', 'within_5km', 'pediatric'],
        primary_event: 'place.pediatrician.rainbow.call',
      },
    ],
  },
  edge_affordance: {
    label: 'First aid tips bhi suniyega?',
    event: 'edge.pediatricians.first_aid',
    kind: 'context_shift',
    query: 'Bukhar 102 mein bachche ko kya kare ghar pe',
  },
  voice_disclosure: "3 pediatric clinics khule hain abhi. Apollo 24×7 sabse paas — 2.3 km, tele-consult ₹399, 4.6 stars. Cloudnine aur Rainbow bhi open hain. On screen — Apollo ko abhi call karein?",
  suggested_prompts: [
    { label: 'First aid tips bhi suniyega?', kind: 'context_shift', query: 'Bukhar 102 mein bachche ko kya kare ghar pe' },
    { label: 'Aur pediatricians dikhao',     kind: 'see_more',      query: '5 km ke andar saare khule pediatricians dikhao' },
    { label: 'Apollo ka number save karo',   kind: 'save_later',    query: 'Apollo 24x7 ka number mere contacts mein save karo' },
  ],
  meta: {
    intent: 'discover',
    query: 'Pediatrician open now child fever',
    total_count: 3,
    trace_id: 'trace-pediatricians-001',
  },
};

/* ---- §4.5 Cooking gas refill — Recharge & Bills (single-path) ---- */
/** @type {CatalogDiscoveryView} */
const MOCK_GAS_REFILL = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Cylinder refill ready to book', subtitle: 'Indane · Friday delivery available' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'this_week', label: 'This week', value: 'week', selected: true },
    ],
  },
  sort: {
    options: [
      { id: 'soonest', label: 'Soonest' },
    ],
    selected_id: 'soonest',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'indane_14kg',
        title: 'Indane 14.2 kg cylinder',
        subtitle: 'Connection #****1284 · Coimbatore',
        media: { alt: 'Indane LPG cylinder', fallback_color: '#F4C893' },
        price_label: '₹903',
        temporal_label: 'Friday delivery slot',
        status_label: 'Distributor: Sri Bhagwathi Gas',
        tags: ['LPG', 'Same-week'],
        specs: ['Last refill: 12 March 2026', '2 cylinders on register', 'Cash on delivery available'],
        primary_event: 'catalog.gas_refill.confirm_pay',
      },
    ],
  },
  edge_affordance: {
    label: 'Auto-book next month bhi',
    event: 'edge.gas_refill.auto_book',
    kind: 'remind_later',
    query: 'Har mahine apne aap cylinder book kar do',
  },
  voice_disclosure: "Indane connection mil gaya — Friday delivery available. ₹903. Confirm karein? On screen — Confirm & Pay tap karein.",
  // TODO: regional-language pass — Tamil disclosure for Track B T2 testing.
  voice_disclosure_tamil_future: "Indane connection kandupidikkapattadhu — Friday delivery kidaikkum. ₹903. Confirm pannattuma? Screen-la Confirm & Pay press pannunga.",
  suggested_prompts: [
    { label: 'Auto-book next month bhi',       kind: 'remind_later', query: 'Har mahine apne aap cylinder book kar do' },
    { label: 'Delivery track karo',            kind: 'see_more',     query: 'Mera cylinder order status kya hai' },
    { label: 'Pichli delivery kab aayi thi',   kind: 'see_more',     query: 'Meri last gas cylinder delivery kab aayi thi' },
  ],
  meta: {
    intent: 'discover',
    query: 'Cylinder book karo this week',
    total_count: 1,
    trace_id: 'trace-gas-refill-001',
  },
};

/* ---- §5.2 Scholarship lookup — Government & civic (compare) ---- */
/** @type {CompareDiscoveryView} */
const MOCK_SCHOLARSHIPS_12TH_SC = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Scholarships for Class 12 (SC category)', subtitle: '3 active schemes · deadlines this quarter' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'open_now',    label: 'Open now',     value: 'open', selected: true },
      { id: 'merit_based', label: 'Merit-based',  value: 'merit', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'deadline', label: 'Deadline' },
      { id: 'amount',   label: 'Amount' },
    ],
    selected_id: 'deadline',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Detail', recommended_id: 'pmms' },
    options: [
      {
        id: 'pmms',
        title: 'Post-Matric (Centre)',
        subtitle: 'Ministry of Social Justice',
        badge: 'Highest payout',
        primary_event: 'compare.scholarship.pmms.open',
      },
      {
        id: 'state_sc',
        title: 'State SC scheme',
        subtitle: 'Maharashtra DSWO',
        primary_event: 'compare.scholarship.state_sc.open',
      },
      {
        id: 'nsp_top',
        title: 'NSP Top-class',
        subtitle: 'NSP Portal',
        primary_event: 'compare.scholarship.nsp_top.open',
      },
    ],
    rows: [
      {
        id: 'eligibility', label: 'Eligibility',
        values: [
          { option_id: 'pmms',     display: 'SC, family ≤₹2.5L' },
          { option_id: 'state_sc', display: 'SC, MH domicile' },
          { option_id: 'nsp_top',  display: 'Top 20% Class 12, SC' },
        ],
      },
      {
        id: 'amount', label: 'Amount/year',
        values: [
          { option_id: 'pmms',     display: '₹13,500', emphasis: 'best' },
          { option_id: 'state_sc', display: '₹8,000' },
          { option_id: 'nsp_top',  display: '₹12,000' },
        ],
      },
      {
        id: 'deadline', label: 'Deadline',
        values: [
          { option_id: 'pmms',     display: '30 June 2026' },
          { option_id: 'state_sc', display: '15 July 2026' },
          { option_id: 'nsp_top',  display: '31 May 2026', emphasis: 'worst' },
        ],
      },
      {
        id: 'recipients', label: 'Last year',
        values: [
          { option_id: 'pmms',     display: '4.2 lakh' },
          { option_id: 'state_sc', display: '82,000' },
          { option_id: 'nsp_top',  display: '1,000' },
        ],
      },
    ],
  },
  edge_affordance: {
    label: 'Deadline ke pehle yaad dilao',
    event: 'edge.scholarships.save_later',
    kind: 'save_later',
    query: 'Mujhe deadline ke pehle yaad dilana scholarships ke baare mein',
  },
  voice_disclosure: "3 scholarships beti ke liye open hain. Post-Matric Centre highest hai — ₹13,500 per saal, deadline 30 June. State SC aur NSP Top-class bhi available hain. On screen — comparison dekhein, ya pehle apply karein?",
  suggested_prompts: [
    { label: 'Deadline ke pehle yaad dilao', kind: 'remind_later',  query: 'Scholarship deadline se pehle mujhe remind karo' },
    { label: 'Eligibility check karein',     kind: 'see_more',      query: 'Meri beti SC category Class 12 ke liye kaunsi scholarship eligible hai' },
    { label: 'Apply kaise karein',           kind: 'context_shift', query: 'NSP portal pe scholarship apply karne ka tarika batao' },
  ],
  meta: {
    intent: 'discover',
    query: 'Scholarships for daughter Class 12',
    total_count: 3,
    trace_id: 'trace-scholarships-001',
  },
};

/* ---- §5.3 Maths tutor for Class 10 — Local services (place) ---- */
/** @type {PlaceDiscoveryView} */
const MOCK_TUTORS_MATHS_CLASS10 = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Class 10 maths tutors near you', subtitle: '4 tutors · within 3 km' },
  location_context: { area: 'Sector 18, Noida', change_event: 'location.change.noida' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'under_500', label: 'Under ₹500/hr',  value: 500,    selected: true },
      { id: 'home',      label: 'Home tuition',    value: 'home', selected: false },
      { id: 'online',    label: 'Online',          value: 'online', selected: false },
      { id: 'weekend',   label: 'Weekend only',    value: 'wknd', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'rating',    label: 'Rating' },
      { id: 'distance',  label: 'Distance' },
      { id: 'price_asc', label: 'Price: low to high' },
    ],
    selected_id: 'rating',
  },
  map: {
    center: { lat: 28.5708, lng: 77.3260 },
    zoom: 14,
    user_location: { lat: 28.5708, lng: 77.3260 },
    markers: [
      { id: 'aakash_sir',    lat: 28.5719, lng: 77.3285 },
      { id: 'meena_madam',   lat: 28.5694, lng: 77.3239 },
      { id: 'fiitjee_local', lat: 28.5733, lng: 77.3221 },
      { id: 'vedantu_pro',   lat: 28.5708, lng: 77.3260 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'aakash_sir',
        title: 'Aakash Verma',
        media: { alt: 'Tutor portrait', fallback_color: '#C8D5E8' },
        rating: { value: 4.9, count: 218 },
        distance_km: 0.5,
        price_label: '₹450/hr',
        tags: ['First class free', 'Maths', 'Class 10'],
        status: { kind: 'open', label: 'Available' },
        filter_ids: ['under_500', 'home'],
        primary_event: 'place.tutor.aakash_sir.open',
      },
      {
        variant: 'place',
        id: 'meena_madam',
        title: 'Meena Sharma',
        media: { alt: 'Tutor portrait', fallback_color: '#D5E0CB' },
        rating: { value: 4.7, count: 142 },
        distance_km: 1.2,
        price_label: '₹400/hr',
        tags: ['Home tuition', 'Weekend'],
        status: { kind: 'open', label: 'Weekend only' },
        filter_ids: ['under_500', 'home', 'weekend'],
        primary_event: 'place.tutor.meena_madam.open',
      },
      {
        variant: 'place',
        id: 'fiitjee_local',
        title: 'FIITJEE Class 10 Maths',
        media: { alt: 'Coaching centre', fallback_color: '#E1D2BB' },
        rating: { value: 4.5, count: 612 },
        distance_km: 2.1,
        price_label: '₹600/hr',
        tags: ['Coaching', 'Group'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: [],
        primary_event: 'place.tutor.fiitjee_local.open',
      },
      {
        variant: 'place',
        id: 'vedantu_pro',
        title: 'Vedantu Pro 1-on-1',
        media: { alt: 'Online tutoring', fallback_color: '#C9C9E2' },
        rating: { value: 4.6, count: 4820 },
        distance_km: 0,
        distance_label: 'online',
        price_label: '₹350/hr',
        tags: ['Online', 'First class free'],
        status: { kind: 'open', label: 'Available' },
        filter_ids: ['under_500', 'online'],
        primary_event: 'place.tutor.vedantu_pro.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Top 3 ka comparison',
    event: 'edge.tutors.compare',
    kind: 'compare',
    query: 'Top 3 maths tutors compare kar do',
  },
  voice_disclosure: "4 maths tutors mil gaye Class 10 ke liye. Aakash Verma sabse paas — 0.5 km, ₹450/hr, 4.9 stars, pehli class free. Meena Madam aur Vedantu Pro bhi affordable hain. On screen — Aakash sir tap karein, ya doosre suniyega?",
  suggested_prompts: [
    { label: 'Top 3 ka comparison',     kind: 'compare',       query: 'In top 3 tutors ka comparison dikhao — fees, ratings, distance' },
    { label: 'Free trial book karo',    kind: 'context_shift', query: 'Aakash sir ke saath ek free demo class schedule karo' },
    { label: 'Home tuition wale dikhao', kind: 'see_more',     query: 'Sirf home tuition karne wale maths tutors dikhao' },
  ],
  meta: {
    intent: 'discover',
    query: 'Maths tutor Class 10',
    total_count: 4,
    trace_id: 'trace-tutors-001',
  },
};

/* ---- §5.4 Diwali blouse tailoring — Local services (place) ---- */
/** @type {PlaceDiscoveryView} */
const MOCK_TAILORS_DIWALI = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Tailors for Diwali', subtitle: '3 tailors · same-day options' },
  location_context: { area: 'Karol Bagh, Delhi', change_event: 'location.change.karol_bagh' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'same_day',    label: 'Same-day',     value: 'sd',  selected: false },
      { id: 'under_500',   label: 'Under ₹500',    value: 500,   selected: false },
      { id: 'designer',    label: 'Designer',      value: 'des', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'eta',      label: 'Delivery ETA' },
      { id: 'distance', label: 'Distance' },
      { id: 'rating',   label: 'Rating' },
    ],
    selected_id: 'eta',
  },
  map: {
    center: { lat: 28.6519, lng: 77.1909 },
    zoom: 14,
    user_location: { lat: 28.6519, lng: 77.1909 },
    markers: [
      { id: 'sona_tailor',     lat: 28.6532, lng: 77.1924 },
      { id: 'singh_designer',  lat: 28.6501, lng: 77.1893 },
      { id: 'bhavna_blouses',  lat: 28.6541, lng: 77.1885 },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'sona_tailor',
        title: 'Sona Tailors',
        media: { alt: 'Sona Tailors shopfront', fallback_color: '#E8C7A0' },
        rating: { value: 4.6, count: 412 },
        distance_km: 0.4,
        price_label: '₹350/blouse',
        tags: ['Same-day', 'Blouse', 'Saree fall'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['same_day', 'under_500'],
        primary_event: 'place.tailor.sona.open',
      },
      {
        variant: 'place',
        id: 'singh_designer',
        title: 'Singh Designer Studio',
        media: { alt: 'Singh Designer Studio interior', fallback_color: '#D8B3D0' },
        rating: { value: 4.8, count: 286 },
        distance_km: 0.8,
        price_label: '₹950/blouse',
        tags: ['Designer', 'Bridal'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['designer'],
        primary_event: 'place.tailor.singh.open',
      },
      {
        variant: 'place',
        id: 'bhavna_blouses',
        title: 'Bhavna Blouses',
        media: { alt: 'Bhavna Blouses workshop', fallback_color: '#C9D8B5' },
        rating: { value: 4.4, count: 168 },
        distance_km: 0.6,
        price_label: '₹450/blouse',
        tags: ['Same-day', 'Blouse'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['same_day', 'under_500'],
        primary_event: 'place.tailor.bhavna.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Top 3 ka comparison',
    event: 'edge.tailors.compare',
    kind: 'compare',
    query: 'Top 3 tailors compare karo Diwali ke liye',
  },
  voice_disclosure: "3 tailors mil gaye Karol Bagh mein. Sona Tailors sabse paas — 0.4 km, ₹350 per blouse, same-day delivery. Singh Designer aur Bhavna Blouses bhi available hain. On screen — Sona Tailors tap karein, ya designer option dekhein?",
  suggested_prompts: [
    { label: 'Top 3 ka comparison',          kind: 'compare',  query: 'In top 3 tailors ka comparison dikhao' },
    { label: 'Diwali se pehle delivery?',    kind: 'see_more', query: 'Konsa tailor Diwali se pehle blouse deliver kar sakta hai' },
    { label: 'Same-day stitching wale',      kind: 'see_more', query: 'Sirf same-day delivery wale tailors dikhao' },
  ],
  meta: {
    intent: 'discover',
    query: 'Tailor for Diwali blouse',
    total_count: 3,
    trace_id: 'trace-tailors-001',
  },
};

/* ---- §5.5 Kirana reorder — Order & Buy (transactional cart) ---- */
/** @type {CatalogDiscoveryView} */
const MOCK_KIRANA_REORDER = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Aapki kirana cart', subtitle: '6 items · Today, 30 min delivery' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'all_items', label: 'All items', value: 'all', selected: true },
    ],
  },
  sort: {
    options: [
      { id: 'as_added', label: 'As added' },
    ],
    selected_id: 'as_added',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'kirana_cart',
        title: 'Kirana cart · ₹285',
        subtitle: 'Maggi 5 packets · Haldi 1 dabba · 4 more',
        media: { alt: 'Kirana cart preview', fallback_color: '#F0DCB7' },
        price_label: '₹285',
        temporal_label: 'Today, 30 min',
        status_label: 'JioMart · Free delivery',
        tags: ['6 items', 'Cash or UPI'],
        specs: [
          'Maggi 2-min noodles · 5 packs · ₹70',
          'Haldi powder · 200g · ₹45',
          'Atta · 5kg · ₹240 → ₹0 (already in pantry)',
          'Chini · 1kg · ₹50',
          'Tea · 500g · ₹120',
          'Total before discount: ₹285',
        ],
        primary_event: 'catalog.kirana_reorder.confirm_pay',
      },
    ],
  },
  edge_affordance: {
    label: 'Saari list dikhao',
    event: 'edge.kirana.full_list',
    kind: 'context_shift',
    query: 'Meri full kirana list batao',
  },
  voice_disclosure: "Cart ready hai — Maggi 5 packets aur haldi 1 dabba, plus 4 aur saamaan. Total ₹285, 30 minute mein aa jayega. Confirm karein? On screen — Confirm & Pay tap karein.",
  suggested_prompts: [
    { label: 'Saari list dikhao',         kind: 'context_shift', query: 'Meri full kirana list batao' },
    { label: 'Atta bhi add karo',         kind: 'context_shift', query: 'Cart mein ek kilo atta aur add karo' },
    { label: 'Kal delivery ka reminder',  kind: 'remind_later',  query: 'Kal delivery ke liye reminder lagao' },
  ],
  meta: {
    intent: 'discover',
    query: 'Kirana reorder Maggi haldi',
    total_count: 1,
    trace_id: 'trace-kirana-001',
  },
};

/* ---- §5.6 Milk subscription edit — Order & Buy (transactional sub-mod) ---- */
/** @type {CatalogDiscoveryView} */
const MOCK_MILK_SUBSCRIPTION_EDIT = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Doodh subscription update', subtitle: 'Country Delight · effective tomorrow' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'effective_tomorrow', label: 'From tomorrow', value: 'tmrw', selected: true },
    ],
  },
  sort: {
    options: [
      { id: 'recommended', label: 'Recommended' },
    ],
    selected_id: 'recommended',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'milk_500_to_1l',
        title: 'Doodh: 500 ml → 1 L per day',
        subtitle: 'Country Delight · A2 cow milk',
        media: { alt: 'Milk subscription card', fallback_color: '#EFE8D2' },
        price_label: '+₹15/day',
        temporal_label: 'From tomorrow morning',
        status_label: 'Auto-charge: Friday',
        tags: ['Subscription mod', 'Daily'],
        specs: [
          'Current: 500 ml/day · ₹35/day',
          'New: 1 L/day · ₹50/day',
          'Difference: ₹15/day · ~₹450/month',
          'Pause anytime from app',
        ],
        primary_event: 'catalog.milk_subscription_edit.confirm_pay',
      },
    ],
  },
  edge_affordance: {
    label: 'Schedule check karo',
    event: 'edge.milk.schedule',
    kind: 'context_shift',
    query: 'Mera milk subscription schedule dikhao',
  },
  voice_disclosure: "Doodh kal se 1 litre ho jayega — ₹15 zyada per day, around ₹450 a month. Confirm karein? On screen — Confirm & Pay tap karein.",
  suggested_prompts: [
    { label: 'Schedule check karo',       kind: 'context_shift', query: 'Mera doodh delivery schedule kya hai' },
    { label: 'Is mahine ka bill dikhao',  kind: 'see_more',      query: 'Is mahine ka doodh subscription ka total kya hoga' },
    { label: 'Kal delivery skip karo',    kind: 'context_shift', query: 'Kal ki doodh delivery skip kar do' },
  ],
  meta: {
    intent: 'discover',
    query: 'Doodh kal se 1 litre kar do',
    total_count: 1,
    trace_id: 'trace-milk-sub-001',
  },
};

/* ---- §10.1 Informational responses — single-status answer (no card collection) ---- */
const INFO_PM_KISAN_STATUS = {
  kind: 'informational_response',
  subject: { title: 'PM Kisan installment status', subtitle: 'Aadhaar-linked account · Bank of Baroda ****4521' },
  body_text: [
    { label: 'Next installment', value: '₹2,000 · expected by 18 May 2026' },
    { label: 'Last installment', value: '₹2,000 · received 14 February 2026' },
    { label: 'Eligibility',      value: 'Active (12th installment claimed)' },
  ],
  voice_disclosure: "Aapki agli PM Kisan kisht ₹2,000 hai, 18 May tak Bank of Baroda account mein aa jayegi. Pichli kisht 14 February ko aayi thi. On screen — full status dekhein, ya alert lagaayein jab paisa aa jaaye?",
  edge_affordance: {
    label: 'Alert lagaayein jab paisa aaye',
    event: 'edge.pm_kisan.alert_on_disbursal',
    kind: 'remind_later',
    query: 'Mujhe alert kar dena jab PM Kisan ka paisa aa jaaye',
  },
  suggested_prompts: [
    { label: 'Alert lagaayein jab paisa aaye', kind: 'remind_later',  query: 'Mujhe alert kar dena jab PM Kisan ka paisa aa jaaye' },
    { label: 'Eligibility check karein',       kind: 'see_more',      query: 'Meri PM Kisan eligibility ka full status dikhao' },
    { label: 'Pichli saari kistein dikhao',    kind: 'see_more',      query: 'PM Kisan ki pichli saari kistein dikhao' },
  ],
};

const INFO_RATION_STATUS = {
  kind: 'informational_response',
  subject: { title: 'Ration card status', subtitle: 'BPL · 5 dependents · Yavatmal' },
  body_text: [
    { label: 'Card status',  value: 'Active · valid through 31 March 2030' },
    { label: 'Category',     value: 'BPL (Below Poverty Line)' },
    { label: 'Dependents',   value: 'Sunita, Rohan, Priya, Aarav, Naina' },
    { label: 'Nearest FPS',  value: 'Shri Ganesh Kirana, 1.2 km · stock available' },
  ],
  voice_disclosure: "Aapka ration card active hai — BPL category, 5 dependents listed. Shri Ganesh FPS shop 1.2 km duur hai aur abhi stock available hai. On screen — full details dekhein, ya FPS shop ka location chahiye?",
  edge_affordance: {
    label: 'FPS shop ka rasta',
    event: 'edge.ration.fps_directions',
    kind: 'context_shift',
    query: 'FPS shop tak ka rasta dikhao',
  },
  suggested_prompts: [
    { label: 'FPS shop ka rasta',           kind: 'context_shift', query: 'Shri Ganesh Kirana FPS shop kaise pahunchen' },
    { label: 'Is mahine ka allotment',      kind: 'see_more',      query: 'Is mahine mere ration card ka allotment kya hai' },
    { label: 'Naam update karna hai',       kind: 'context_shift', query: 'Ration card mein naam kaise add karein' },
  ],
};

/* ---- Partner experiences — Swiggy MCP (Food only) ---------------------- */
/* Derived from github.com/Swiggy/swiggy-mcp-server-manifest and the
   voice-vs-chat agent-pattern doc at mcp.swiggy.com/builders/docs. The same
   payload renders rich in chat (≤8 results, full cards) and compressed in
   voice (≤3 items, spoken price). The playground exposes both surfaces in
   the new Partner experiences dropdown. */

/** @type {PlaceDiscoveryView} */
const MOCK_SWIGGY_BIRYANI_SEARCH = {
  kind: 'discovery_view',
  sub_pattern: 'place',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: {
    title: 'Biryani on Swiggy',
    subtitle: 'Top picks · 32 min avg delivery',
    brand_chip: { label: 'Sw', variant: 'swiggy' },
  },
  location_context: { area: 'Koramangala, Bengaluru', change_event: 'location.change.koramangala' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'fast_delivery', label: 'Under 30 min',  value: 30,    selected: false },
      { id: 'top_rated',     label: 'Top rated',     value: 'top', selected: true  },
      { id: 'under_400',     label: 'Under ₹400',    value: 400,   selected: false },
      { id: 'free_delivery', label: 'Free delivery', value: 'free', selected: false },
      { id: 'offers',        label: '50% off',       value: 'off50', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'recommended', label: 'Recommended' },
      { id: 'rating',      label: 'Rating' },
      { id: 'eta',         label: 'Delivery time' },
      { id: 'price',       label: 'Price' },
    ],
    selected_id: 'recommended',
  },
  map: {
    center: { lat: 12.9352, lng: 77.6245 },
    zoom: 14,
    user_location: { lat: 12.9352, lng: 77.6245 },
    markers: [
      { id: 'paradise_biryani_swiggy', lat: 12.9382, lng: 77.6271, pin_label: '1' },
      { id: 'meghana_swiggy',          lat: 12.9341, lng: 77.6189, pin_label: '2' },
      { id: 'shah_ghouse_swiggy',      lat: 12.9270, lng: 77.6310, pin_label: '3' },
      { id: 'donne_biryani_swiggy',    lat: 12.9398, lng: 77.6202, pin_label: '4' },
      { id: 'behrouz_swiggy',          lat: 12.9450, lng: 77.6155, pin_label: '5' },
    ],
  },
  collection: {
    layout: 'carousel',
    cards: [
      {
        variant: 'place',
        id: 'paradise_biryani_swiggy',
        title: 'Paradise Biryani',
        subtitle: 'Swiggy · 1.8 km',
        media: { alt: 'Paradise biryani handi', fallback_color: '#C9855A' },
        rating: { value: 4.5, count: 10240 },
        distance_km: 1.8,
        price_level: '₹₹',
        tags: ['28 min', '₹29 fee', 'Top rated'],
        status: { kind: 'open', label: '50% off up to ₹100' },
        badge: '#1',
        filter_ids: ['fast_delivery', 'top_rated', 'offers'],
        primary_event: 'place.swiggy.paradise.open',
      },
      {
        variant: 'place',
        id: 'meghana_swiggy',
        title: 'Meghana Foods',
        subtitle: 'Swiggy · 2.1 km',
        media: { alt: 'Meghana chicken biryani', fallback_color: '#D19870' },
        rating: { value: 4.6, count: 8410 },
        distance_km: 2.1,
        price_level: '₹₹',
        tags: ['32 min', '₹39 fee', 'Andhra'],
        status: { kind: 'open', label: '20% off' },
        badge: '#2',
        filter_ids: ['top_rated', 'offers'],
        primary_event: 'place.swiggy.meghana.open',
      },
      {
        variant: 'place',
        id: 'shah_ghouse_swiggy',
        title: 'Shah Ghouse',
        subtitle: 'Swiggy · 3.4 km',
        media: { alt: 'Shah Ghouse mutton biryani', fallback_color: '#B97349' },
        rating: { value: 4.4, count: 6210 },
        distance_km: 3.4,
        price_level: '₹',
        tags: ['38 min', 'Free delivery', 'Hyderabadi'],
        status: { kind: 'open', label: 'Free delivery on ₹199+' },
        badge: '#3',
        filter_ids: ['top_rated', 'under_400', 'free_delivery'],
        primary_event: 'place.swiggy.shah_ghouse.open',
      },
      {
        variant: 'place',
        id: 'donne_biryani_swiggy',
        title: 'Donne Biryani House',
        subtitle: 'Swiggy · 2.8 km',
        media: { alt: 'Donne biryani plate', fallback_color: '#A8653E' },
        rating: { value: 4.3, count: 3120 },
        distance_km: 2.8,
        price_level: '₹',
        tags: ['35 min', '₹29 fee', 'Bengaluru style'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['under_400'],
        primary_event: 'place.swiggy.donne.open',
      },
      {
        variant: 'place',
        id: 'behrouz_swiggy',
        title: 'Behrouz Biryani',
        subtitle: 'Swiggy · 4.1 km',
        media: { alt: 'Behrouz royal biryani', fallback_color: '#C09162' },
        rating: { value: 4.2, count: 2410 },
        distance_km: 4.1,
        price_level: '₹₹₹',
        tags: ['42 min', '₹49 fee', 'Royal'],
        status: { kind: 'open', label: 'Open' },
        filter_ids: ['top_rated'],
        primary_event: 'place.swiggy.behrouz.open',
      },
    ],
  },
  edge_affordance: {
    label: 'Compare top 3',
    event: 'edge.swiggy_biryani.compare',
    kind: 'compare',
    query: 'Compare Paradise, Meghana and Shah Ghouse on Swiggy',
  },
  voice_disclosure: "Top three biryani spots on Swiggy near you. Paradise — 4.5 stars, twenty-eight minutes, fifty percent off. Meghana — 4.6 stars, thirty-two minutes. Shah Ghouse — 4.4 stars, free delivery on two hundred rupees plus. On screen — tap one to see the menu.",
  suggested_prompts: [
    { label: 'Show Paradise menu',    kind: 'context_shift', query: 'Show Paradise menu on Swiggy' },
    { label: 'Order from Paradise',   kind: 'commit',        query: 'Order biryani from Paradise on Swiggy' },
    { label: 'Cheap options under ₹250', kind: 'compare',     query: 'Biryani on Swiggy under ₹250' },
  ],
  meta: {
    intent: 'discover',
    query: 'Find biryani on Swiggy',
    total_count: 18,
    trace_id: 'trace-swiggy-biryani-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_SWIGGY_PARADISE_MENU = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: {
    title: 'Paradise Biryani — menu',
    subtitle: 'Swiggy · 28 min · ₹29 delivery',
    brand_chip: { label: 'Sw', variant: 'swiggy' },
  },
  filters: {
    multi_select: true,
    chips: [
      { id: 'bestseller', label: 'Bestseller',   value: 'top',     selected: false },
      { id: 'chicken',    label: 'Chicken',      value: 'chicken', selected: false },
      { id: 'mutton',     label: 'Mutton',       value: 'mutton',  selected: false },
      { id: 'veg',        label: 'Veg',          value: 'veg',     selected: false },
      { id: 'family',     label: 'Family pack',  value: 'family',  selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'popular',    label: 'Popular' },
      { id: 'price_asc',  label: 'Price: low to high' },
      { id: 'rating',     label: 'Rating' },
    ],
    selected_id: 'popular',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'paradise_chicken_biryani',
        title: 'Hyderabadi Chicken Biryani',
        subtitle: 'Bestseller · serves 1',
        media: { alt: 'Chicken biryani plate', fallback_color: '#C9855A' },
        price_label: '₹329',
        rating: { value: 4.6, count: 4820 },
        tags: ['Spicy', 'Chicken'],
        badge: 'Top dish',
        filter_ids: ['bestseller', 'chicken'],
        primary_event: 'catalog.swiggy.paradise.chicken_biryani.add',
        commit_action: { label: 'Add', event: 'catalog.swiggy.paradise.chicken_biryani.add' },
      },
      {
        variant: 'catalog',
        id: 'paradise_mutton_biryani',
        title: 'Hyderabadi Mutton Biryani',
        subtitle: 'Slow-cooked · serves 1',
        media: { alt: 'Mutton biryani plate', fallback_color: '#B97349' },
        price_label: '₹449',
        rating: { value: 4.7, count: 3210 },
        tags: ['Spicy', 'Mutton'],
        filter_ids: ['mutton'],
        primary_event: 'catalog.swiggy.paradise.mutton_biryani.add',
        commit_action: { label: 'Add', event: 'catalog.swiggy.paradise.mutton_biryani.add' },
      },
      {
        variant: 'catalog',
        id: 'paradise_veg_biryani',
        title: 'Veg Dum Biryani',
        subtitle: 'Aromatic · serves 1',
        media: { alt: 'Veg biryani plate', fallback_color: '#D6C593' },
        price_label: '₹229',
        rating: { value: 4.2, count: 1180 },
        tags: ['Veg'],
        filter_ids: ['veg'],
        primary_event: 'catalog.swiggy.paradise.veg_biryani.add',
        commit_action: { label: 'Add', event: 'catalog.swiggy.paradise.veg_biryani.add' },
      },
      {
        variant: 'catalog',
        id: 'paradise_family_pack',
        title: 'Family Pack — Chicken (serves 4)',
        subtitle: 'Includes raita & gulab jamun',
        media: { alt: 'Family biryani pack', fallback_color: '#A8653E' },
        price_label: '₹999',
        rating: { value: 4.5, count: 920 },
        tags: ['Family', 'Combo'],
        badge: 'Save ₹150',
        filter_ids: ['chicken', 'family'],
        primary_event: 'catalog.swiggy.paradise.family_pack.add',
        commit_action: { label: 'Add', event: 'catalog.swiggy.paradise.family_pack.add' },
      },
    ],
  },
  voice_disclosure: "Paradise top dish — Hyderabadi Chicken Biryani at three hundred and twenty-nine rupees, 4.6 stars. Mutton biryani is four hundred and forty-nine. Family pack serves four for nine hundred and ninety-nine. Which one shall I add?",
  meta: {
    intent: 'discover',
    query: 'Show Paradise menu on Swiggy',
    total_count: 24,
    trace_id: 'trace-swiggy-menu-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_SWIGGY_PARADISE_ORDER = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: {
    title: 'Order ready to confirm',
    subtitle: 'Paradise Biryani · Swiggy · 28 min',
    brand_chip: { label: 'Sw', variant: 'swiggy' },
  },
  filters: {
    multi_select: true,
    chips: [
      { id: 'cod_off', label: 'Pay online', value: 'online', selected: true },
    ],
  },
  sort: {
    options: [
      { id: 'recommended', label: 'Recommended' },
    ],
    selected_id: 'recommended',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'swiggy_paradise_order',
        title: 'Hyderabadi Chicken Biryani · 1',
        subtitle: 'Paradise Biryani · Koramangala',
        media: { alt: 'Paradise chicken biryani', fallback_color: '#C9855A' },
        price_label: '₹449',
        temporal_label: '28 min · ₹29 delivery · ₹91 taxes',
        status_label: 'Pay online · UPI ready',
        badge: 'Bestseller',
        tags: ['Chicken', 'Spicy'],
        specs: ['1 Chicken Biryani', 'Mint chutney', 'Salan'],
        primary_event: 'catalog.swiggy_paradise_order.confirm_pay',
      },
    ],
  },
  edge_affordance: {
    label: 'Add a side',
    event: 'edge.swiggy_paradise_order.add_side',
    kind: 'compare',
    query: 'Add gulab jamun to my Paradise order',
  },
  voice_disclosure: "Order summary — one Hyderabadi Chicken Biryani from Paradise, four hundred and forty-nine rupees plus twenty-nine delivery and ninety-one taxes. Total five hundred and sixty-nine rupees. Delivery in twenty-eight minutes. Confirm to place the order?",
  suggested_prompts: [
    { label: 'Add a side',         kind: 'compare',       query: 'Add raita to my Paradise order' },
    { label: 'Change to mutton',   kind: 'context_shift', query: 'Change my Paradise order to mutton biryani' },
  ],
  meta: {
    intent: 'discover',
    query: 'Order biryani from Paradise on Swiggy',
    total_count: 1,
    trace_id: 'trace-swiggy-order-001',
  },
};

const INFO_SWIGGY_ORDER_STATUS = {
  kind: 'informational_response',
  subject: { title: 'Swiggy order — Paradise Biryani', subtitle: 'Order #SW-58293 · ₹569 · ETA 9 min' },
  body_text: [
    { label: 'Status',      value: 'Out for delivery · Aakash is 1.4 km away' },
    { label: 'Order',       value: '1 Hyderabadi Chicken Biryani · Paradise' },
    { label: 'Placed',      value: '7:42 PM · paid via UPI' },
    { label: 'Stages',      value: 'Order placed → Kitchen prep → Picked up → Out for delivery' },
  ],
  voice_disclosure: "Your Swiggy order from Paradise is out for delivery. Aakash is one point four kilometres away — about nine minutes. On screen — track live, or call the rider?",
  edge_affordance: {
    label: 'Track live on map',
    event: 'edge.swiggy_order.track',
    kind: 'context_shift',
    query: 'Track my Swiggy order live',
  },
  suggested_prompts: [
    { label: 'Track live on map', kind: 'context_shift', query: 'Track my Swiggy order live' },
    { label: 'Call the rider',    kind: 'context_shift', query: 'Call the Swiggy delivery rider' },
    { label: 'Cancel order',      kind: 'context_shift', query: 'Cancel my Swiggy Paradise order' },
  ],
};

/* ============================================================================
   Bus Travel — partner aggregator. Compare across operators on BLR → TPTY,
   then a seat-class catalog on the picked operator (VRL), a single-card
   booking confirm, and an informational live-trip status. Mirrors the Swiggy
   shape (search → menu → order → track) but at sub_pattern: compare for the
   aggregator step.
   ============================================================================ */

/** @type {CompareDiscoveryView} */
const MOCK_BUS_BLR_TPTY_COMPARE = {
  kind: 'discovery_view',
  sub_pattern: 'compare',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: { title: 'Buses to Tirupati tomorrow', subtitle: 'BLR → TPTY · 1 traveller · Tomorrow night' },
  filters: {
    multi_select: true,
    chips: [
      { id: 'nonstop',        label: 'Non-stop',        value: true,    selected: true },
      { id: 'ac',             label: 'AC',              value: 'ac',    selected: false },
      { id: 'sleeper',        label: 'Sleeper',         value: 'slpr',  selected: false },
      { id: 'under_1200',     label: 'Under ₹1,200',    value: 1200,    selected: false },
      { id: 'depart_evening', label: 'Departs 8–11 PM', value: 'eve',   selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'price',    label: 'Price' },
      { id: 'duration', label: 'Duration' },
      { id: 'depart',   label: 'Depart' },
      { id: 'rating',   label: 'Rating' },
    ],
    selected_id: 'price',
  },
  collection: {
    layout: 'table',
    header: { label_column: 'Detail', recommended_id: 'vrl' },
    options: [
      {
        id: 'vrl',
        title: 'VRL Travels',
        subtitle: 'Volvo B11R AC Sleeper',
        badge: 'Cheapest',
        primary_event: 'compare.bus.vrl.open',
      },
      {
        id: 'srs',
        title: 'SRS Travels',
        subtitle: 'Bharat Benz AC Semi-Sleeper',
        primary_event: 'compare.bus.srs.open',
      },
      {
        id: 'ksrtc',
        title: 'KSRTC Airavat',
        subtitle: 'Volvo Multi-Axle AC',
        badge: 'Govt',
        primary_event: 'compare.bus.ksrtc.open',
      },
      {
        id: 'orange',
        title: 'Orange Tours',
        subtitle: 'Scania Metrolink AC Sleeper',
        badge: 'Premium',
        primary_event: 'compare.bus.orange.open',
      },
    ],
    rows: [
      {
        id: 'depart', label: 'Depart',
        values: [
          { option_id: 'vrl',    display: '9:30 PM' },
          { option_id: 'srs',    display: '10:15 PM' },
          { option_id: 'ksrtc',  display: '8:45 PM' },
          { option_id: 'orange', display: '11:00 PM' },
        ],
      },
      {
        id: 'arrive', label: 'Arrive',
        values: [
          { option_id: 'vrl',    display: '5:45 AM' },
          { option_id: 'srs',    display: '7:00 AM' },
          { option_id: 'ksrtc',  display: '5:30 AM' },
          { option_id: 'orange', display: '6:30 AM' },
        ],
      },
      {
        id: 'duration', label: 'Duration',
        values: [
          { option_id: 'vrl',    display: '8h 15m' },
          { option_id: 'srs',    display: '8h 45m', emphasis: 'worst' },
          { option_id: 'ksrtc',  display: '8h 45m', emphasis: 'worst' },
          { option_id: 'orange', display: '7h 30m', emphasis: 'best' },
        ],
      },
      {
        id: 'bus_type', label: 'Bus type',
        values: [
          { option_id: 'vrl',    display: 'AC Sleeper' },
          { option_id: 'srs',    display: 'AC Semi-Sleeper' },
          { option_id: 'ksrtc',  display: 'AC Seater' },
          { option_id: 'orange', display: 'AC Sleeper' },
        ],
      },
      {
        id: 'seats_left', label: 'Seats left',
        values: [
          { option_id: 'vrl',    display: '12' },
          { option_id: 'srs',    display: '6' },
          { option_id: 'ksrtc',  display: '2',  emphasis: 'worst' },
          { option_id: 'orange', display: '21', emphasis: 'best' },
        ],
      },
      {
        id: 'rating', label: 'Rating',
        values: [
          { option_id: 'vrl',    display: '4.5★' },
          { option_id: 'srs',    display: '4.2★' },
          { option_id: 'ksrtc',  display: '4.1★', emphasis: 'worst' },
          { option_id: 'orange', display: '4.7★', emphasis: 'best' },
        ],
      },
      {
        id: 'price', label: 'Price',
        values: [
          { option_id: 'vrl',    display: '₹899',   emphasis: 'best' },
          { option_id: 'srs',    display: '₹1,049' },
          { option_id: 'ksrtc',  display: '₹1,150' },
          { option_id: 'orange', display: '₹1,499', emphasis: 'worst' },
        ],
      },
    ],
  },
  edge_affordance: {
    label: 'Set price alert',
    event: 'edge.bus.remind_later',
    kind: 'remind_later',
    query: 'Alert me if any Tirupati bus drops below ₹750',
  },
  voice_disclosure: "4 buses to Tirupati tomorrow night. VRL is cheapest — eight ninety-nine, Volvo AC sleeper, departs 9:30 PM, twelve seats left. Others run up to fourteen ninety-nine. On screen — tap VRL, or set an alert below seven fifty?",
  suggested_prompts: [
    { label: 'Show all 12 buses', kind: 'see_more', query: 'Show all buses to Tirupati tomorrow' },
    { label: 'Compare top three', kind: 'compare',  query: 'Compare VRL, SRS, and Orange side by side' },
  ],
  meta: {
    intent: 'discover',
    query: 'Best buses to Tirupati tomorrow',
    total_count: 12,
    trace_id: 'trace-bus-compare-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_BUS_VRL_TPTY_SEATS = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: {
    title: 'VRL Travels — pick a seat',
    subtitle: 'Volvo AC Sleeper · BLR → TPTY · Departs 9:30 PM',
  },
  filters: {
    multi_select: true,
    chips: [
      { id: 'lower_berth', label: 'Lower berth', value: 'lower',  selected: false },
      { id: 'upper_berth', label: 'Upper berth', value: 'upper',  selected: false },
      { id: 'seater',      label: 'Seater',      value: 'seater', selected: false },
      { id: 'ladies_only', label: 'Ladies-only', value: 'ladies', selected: false },
    ],
  },
  sort: {
    options: [
      { id: 'price',    label: 'Price' },
      { id: 'position', label: 'Position' },
    ],
    selected_id: 'price',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'vrl_seater_s5',
        title: 'AC Seater S5',
        subtitle: '8 seats left · Window · Mid',
        media: { alt: 'AC seater', fallback_color: '#C9A55E' },
        price_label: '₹699',
        rating: { value: 4.5, count: 1820 },
        tags: ['Seater'],
        filter_ids: ['seater'],
        primary_event: 'catalog.bus.vrl.seater.select',
        commit_action: { label: 'Select', event: 'catalog.bus.vrl.seater.select' },
      },
      {
        variant: 'catalog',
        id: 'vrl_upper_sleeper_b1',
        title: 'Upper Sleeper B1',
        subtitle: '4 seats left · Window · Front',
        media: { alt: 'Upper sleeper berth', fallback_color: '#7C95C2' },
        price_label: '₹849',
        rating: { value: 4.5, count: 1820 },
        tags: ['Sleeper', 'Upper'],
        badge: 'Cheapest sleeper',
        filter_ids: ['upper_berth'],
        primary_event: 'catalog.bus.vrl.upper_sleeper.select',
        commit_action: { label: 'Select', event: 'catalog.bus.vrl.upper_sleeper.select' },
      },
      {
        variant: 'catalog',
        id: 'vrl_lower_sleeper_a3',
        title: 'Lower Sleeper A3',
        subtitle: '2 seats left · Aisle · Mid',
        media: { alt: 'Lower sleeper berth', fallback_color: '#5E7AA8' },
        price_label: '₹899',
        rating: { value: 4.5, count: 1820 },
        tags: ['Sleeper', 'Lower'],
        filter_ids: ['lower_berth'],
        primary_event: 'catalog.bus.vrl.lower_sleeper.select',
        commit_action: { label: 'Select', event: 'catalog.bus.vrl.lower_sleeper.select' },
      },
      {
        variant: 'catalog',
        id: 'vrl_ladies_l2',
        title: 'Ladies-only Lower L2',
        subtitle: '1 seat left · Front · Reserved',
        media: { alt: 'Ladies-only sleeper berth', fallback_color: '#B97C9F' },
        price_label: '₹949',
        rating: { value: 4.5, count: 1820 },
        tags: ['Sleeper', 'Ladies-only'],
        badge: 'Last seat',
        filter_ids: ['lower_berth', 'ladies_only'],
        primary_event: 'catalog.bus.vrl.ladies.select',
        commit_action: { label: 'Select', event: 'catalog.bus.vrl.ladies.select' },
      },
    ],
  },
  edge_affordance: {
    label: 'Change to a different bus',
    event: 'edge.bus.vrl.change_bus',
    kind: 'context_shift',
    query: 'Best buses to Tirupati tomorrow',
  },
  voice_disclosure: "VRL Volvo to Tirupati. Seater is cheapest at six ninety-nine. Upper sleeper eight forty-nine, four seats left. Lower sleeper eight ninety-nine. Ladies-only is the last seat at nine forty-nine. On screen — pick a seat?",
  suggested_prompts: [
    { label: 'Show seat layout',          kind: 'see_more',     query: 'Show the VRL seat layout' },
    { label: 'Change to a different bus', kind: 'context_shift', query: 'Best buses to Tirupati tomorrow' },
  ],
  meta: {
    intent: 'discover',
    query: 'Pick a seat on VRL to Tirupati',
    total_count: 4,
    trace_id: 'trace-bus-seats-001',
  },
};

/** @type {CatalogDiscoveryView} */
const MOCK_BUS_VRL_BOOKING_CONFIRM = {
  kind: 'discovery_view',
  sub_pattern: 'catalog',
  state: 'PARTIAL_RESULT_SHOWN',
  subject: {
    title: 'Booking ready to confirm',
    subtitle: 'VRL Travels · Volvo AC Sleeper · BLR → TPTY',
  },
  filters: {
    multi_select: true,
    chips: [
      { id: 'pay_online', label: 'Pay online', value: 'online', selected: true },
    ],
  },
  sort: {
    options: [{ id: 'recommended', label: 'Recommended' }],
    selected_id: 'recommended',
  },
  collection: {
    layout: 'list',
    cards: [
      {
        variant: 'catalog',
        id: 'vrl_booking_summary',
        title: 'Lower Sleeper A3 · 1 Adult',
        subtitle: 'Tomorrow 9:30 PM → 5:45 AM',
        media: { alt: 'VRL Volvo sleeper', fallback_color: '#5E7AA8' },
        price_label: '₹899',
        temporal_label: '8h 15m · Boarding Madiwala 9:15 PM',
        status_label: 'Pay online · UPI ready',
        badge: 'Cheapest',
        tags: ['Sleeper', 'AC'],
        specs: [
          '1 Adult · Lower Sleeper A3',
          'Boarding · Madiwala BMTC 9:15 PM',
          'Drop · Tirupati RTC Stand 5:45 AM',
        ],
        primary_event: 'catalog.bus.vrl.booking.confirm_pay',
      },
    ],
  },
  edge_affordance: {
    label: 'Change boarding point',
    event: 'edge.bus.vrl.change_boarding',
    kind: 'context_shift',
    query: 'Change my VRL boarding point to Majestic',
  },
  voice_disclosure: "One adult, lower sleeper A3 on VRL to Tirupati. Eight ninety-nine, departs Madiwala BMTC nine fifteen PM, arrives Tirupati five forty-five AM. Pay online via UPI. Confirm to lock the seat?",
  suggested_prompts: [
    { label: 'Change boarding point', kind: 'context_shift', query: 'Change my VRL boarding point to Majestic' },
    { label: 'Add return ticket',     kind: 'context_shift', query: 'Add a return ticket from Tirupati' },
  ],
  meta: {
    intent: 'discover',
    query: 'Confirm my VRL Tirupati booking',
    total_count: 1,
    trace_id: 'trace-bus-booking-001',
  },
};

const INFO_BUS_TRIP_STATUS = {
  kind: 'informational_response',
  subject: { title: 'VRL Travels · Trip TR-58293', subtitle: 'Lower Sleeper A3 · ₹899 · Departs in 42 min' },
  body_text: [
    { label: 'Status', value: 'Bus is at Madiwala — boarding now' },
    { label: 'Bus',    value: 'VRL Volvo B11R AC Sleeper · KA-01-EX-4821' },
    { label: 'Booked', value: 'Tomorrow · 9:30 PM departure · Lower Sleeper A3' },
    { label: 'Stages', value: 'Booked → Boarding → En route → Arrived' },
  ],
  voice_disclosure: "Your VRL bus to Tirupati is at Madiwala — boarding now. Lower sleeper A3, departs in forty-two minutes. On screen — track live, or call the driver?",
  edge_affordance: {
    label: 'Track live on map',
    event: 'edge.bus.trip.track',
    kind: 'context_shift',
    query: 'Track my VRL bus live on the map',
  },
  suggested_prompts: [
    { label: 'Track live on map', kind: 'context_shift', query: 'Track my VRL bus live on the map' },
    { label: 'Call the driver',   kind: 'context_shift', query: 'Call the VRL bus driver' },
    { label: 'Cancel ticket',     kind: 'context_shift', query: 'Cancel my VRL Tirupati ticket' },
  ],
};

const INFO_BUS_TICKET = {
  kind: 'informational_response',
  subject: { title: 'Bus ticket · PNR TR58293', subtitle: 'VRL Travels · BLR → TPTY · Tomorrow 9:30 PM' },
  body_text: [
    { label: 'Passenger', value: 'Matt Jarvis · 1 Adult' },
    { label: 'Seat',      value: 'Lower Sleeper A3 · ₹899 paid · UPI' },
    { label: 'Bus',       value: 'VRL Volvo B11R AC Sleeper · KA-01-EX-4821' },
    { label: 'Boarding',  value: 'Madiwala BMTC · 9:15 PM (gates close 9:25 PM)' },
    { label: 'Drop',      value: 'Tirupati RTC Stand · ETA 5:45 AM' },
    { label: 'Driver',    value: '+91 98•••••42 (call after 9:00 PM)' },
  ],
  voice_disclosure: "Your VRL ticket to Tirupati. PNR TR58293, lower sleeper A3, eight ninety-nine paid. Boarding Madiwala BMTC tomorrow nine fifteen PM. On screen — share with family, or add to wallet?",
  edge_affordance: {
    label: 'Show as boarding pass',
    event: 'edge.bus.ticket.boarding_pass',
    kind: 'context_shift',
    query: 'Show my bus ticket as a boarding pass',
  },
  suggested_prompts: [
    { label: 'Share with family', kind: 'context_shift', query: 'Share my bus ticket with my family' },
    { label: 'Add to wallet',     kind: 'save_later',    query: 'Add my bus ticket to wallet' },
    { label: 'Call the driver',   kind: 'context_shift', query: 'Call the VRL bus driver' },
  ],
};

const INFORMATIONAL_RESPONSES = {
  pm_kisan_status:    { key: 'pm_kisan_status',    label: 'PM Kisan installment status', view: INFO_PM_KISAN_STATUS },
  ration_status:      { key: 'ration_status',      label: 'Ration card status',          view: INFO_RATION_STATUS },
  swiggy_order_status:{ key: 'swiggy_order_status',label: 'Swiggy order status',         view: INFO_SWIGGY_ORDER_STATUS },
  bus_trip_status:    { key: 'bus_trip_status',    label: 'Bus trip status',             view: INFO_BUS_TRIP_STATUS },
  bus_ticket:         { key: 'bus_ticket',         label: 'Bus ticket preview',          view: INFO_BUS_TICKET },
};

/* ============================================================================
   DATASET_GROUPS + DATASETS — the 20-query registry.
   Lifted verbatim from the playground shell. The playground mount, mobile
   frame, and validator panel are intentionally NOT included here — they
   are specific to the standalone playground UI.
   ============================================================================ */

// 20 queries across three sub-patterns. Each row: dropdown key, user-
// visible label (matches the 20-query table in the brief), and the view.
const DATASET_GROUPS = [
  {
    group: 'Place',
    items: [
      { key: 'restaurants',         label: 'Restaurants nearby',                view: MOCK_RESTAURANTS },
      { key: 'biryani_hyderabad',   label: 'Best biryani in Hyderabad',         view: MOCK_BIRYANI_HYDERABAD },
      { key: 'doctors',             label: 'Doctors near me for fever',         view: MOCK_DOCTORS },
      { key: 'plumbers',            label: 'Plumber in my area',                view: MOCK_PLUMBERS },
      { key: 'schools_bandra',      label: 'Schools for my child in Bandra',    view: MOCK_SCHOOLS_BANDRA },
      { key: 'apartments',          label: 'Apartments for rent in Andheri',    view: MOCK_APARTMENTS },
    ],
  },
  {
    group: 'Catalog',
    items: [
      { key: 'kurta_diwali',        label: 'Shop for a kurta for Diwali',       view: MOCK_KURTA_DIWALI },
      { key: 'gifts_wedding',       label: "Gifts for my sister's wedding",     view: MOCK_GIFTS_WEDDING },
      { key: 'movies_weekend',      label: 'Movies playing this weekend',       view: MOCK_MOVIES_WEEKEND },
      { key: 'devotional_morning',  label: 'Devotional songs for morning',      view: MOCK_DEVOTIONAL_MORNING },
      { key: 'courses_datascience', label: 'Online courses for data science',   view: MOCK_COURSES_DATASCIENCE },
      { key: 'ipl_today',           label: 'IPL matches today',                 view: MOCK_IPL_TODAY },
      { key: 'schemes_farmers',     label: 'Government schemes for farmers',    view: MOCK_SCHEMES_FARMERS },
    ],
  },
  {
    group: 'Compare',
    items: [
      { key: 'home_loans',          label: 'Compare home loans under 8%',       view: MOCK_HOME_LOANS },
      { key: 'flights_mumbai',      label: 'Cheap flights to Mumbai tomorrow',  view: MOCK_FLIGHTS_MUMBAI },
      { key: 'recharge_299',        label: '₹299 mobile recharge plans',        view: MOCK_RECHARGE_299 },
      { key: 'phones_20k',          label: 'Best phones under ₹20,000',         view: MOCK_PHONES_20K },
      { key: 'trains_tatkal',       label: 'Tatkal trains to hometown',         view: MOCK_TRAINS_TATKAL },
      { key: 'health_insurance',    label: 'Health insurance for family of 4',  view: MOCK_HEALTH_INSURANCE },
      { key: 'emi_fridge',          label: 'EMI options for this fridge',       view: MOCK_EMI_FRIDGE },
    ],
  },
];

/**
 * Voice-first use cases (Path A) — registry of new DiscoveryView mocks. Kept
 * separate from DATASET_GROUPS so the existing prototype-panel grouping (Place
 * / Catalog / Compare) stays unchanged. These keys must resolve via the flat
 * DATASETS lookup, so we merge them in below.
 */
const PILLAR_DATASET_ENTRIES = [
  { key: 'plumbers_indore',          label: 'Plumber (Indore variant)',                  view: MOCK_PLUMBERS_INDORE },
  { key: 'recharge_299_single',      label: '₹299 plan — single-path confirm',           view: MOCK_RECHARGE_299_SINGLE },
  { key: 'pediatricians_open_now',   label: 'Pediatrician — child fever 2 a.m.',         view: MOCK_PEDIATRICIANS_OPEN_NOW },
  { key: 'gas_refill',               label: 'Cooking gas refill',                        view: MOCK_GAS_REFILL },
  { key: 'scholarships_12th_sc',     label: 'Scholarships for daughter (Class 12)',      view: MOCK_SCHOLARSHIPS_12TH_SC },
  { key: 'tutors_maths_class10',     label: 'Maths tutor for Class 10',                  view: MOCK_TUTORS_MATHS_CLASS10 },
  { key: 'tailors_diwali',           label: 'Diwali blouse tailoring',                   view: MOCK_TAILORS_DIWALI },
  { key: 'kirana_reorder',           label: 'Kirana reorder',                            view: MOCK_KIRANA_REORDER },
  { key: 'milk_subscription_edit',   label: 'Milk subscription edit',                    view: MOCK_MILK_SUBSCRIPTION_EDIT },
];

// Partner experiences (Swiggy Food). Three discovery keys + one informational
// (registered separately). Each MUST resolve via the flat DATASETS lookup so
// the chat handler's matchDiscoveryQuery → DATASETS[key] path renders them.
const PARTNER_DATASET_ENTRIES = [
  { key: 'swiggy_biryani_search',   label: 'Find biryani on Swiggy',         view: MOCK_SWIGGY_BIRYANI_SEARCH },
  { key: 'swiggy_paradise_menu',    label: 'Show Paradise menu on Swiggy',   view: MOCK_SWIGGY_PARADISE_MENU },
  { key: 'swiggy_paradise_order',   label: 'Order biryani from Paradise',    view: MOCK_SWIGGY_PARADISE_ORDER },
  { key: 'bus_blr_tpty_compare',    label: 'Best buses BLR → Tirupati',      view: MOCK_BUS_BLR_TPTY_COMPARE },
  { key: 'bus_vrl_tpty_seats',      label: 'Pick a seat on VRL',             view: MOCK_BUS_VRL_TPTY_SEATS },
  { key: 'bus_vrl_booking_confirm', label: 'Confirm bus booking',            view: MOCK_BUS_VRL_BOOKING_CONFIRM },
];

// Flat lookup: key -> { label, view }. Includes the 20 legacy mocks plus the
// new pillar-keyed DiscoveryView mocks. Informational responses live in their
// own registry (INFORMATIONAL_RESPONSES) — keep that lookup separate so the
// chat handler can route by intent shape.
const DATASETS = Object.fromEntries([
  ...DATASET_GROUPS.flatMap((g) => g.items.map((it) => [it.key, it])),
  ...PILLAR_DATASET_ENTRIES.map((it) => [it.key, it]),
  ...PARTNER_DATASET_ENTRIES.map((it) => [it.key, it]),
]);

/**
 * Prototype-panel grouping by the four transactional pillars defined in
 * docs/voice-first-use-cases.md. Items use `query` (a sample utterance) so the
 * burger panel routes through the live matchers — exercising the same matcher
 * + render path the user gets via voice / typing. Keep DATASET_GROUPS untouched
 * for non-regression of the existing 20 mocks.
 */
const PILLAR_GROUPS = [
  {
    group: 'Government & civic',
    items: [
      { key: 'pm_kisan_status',       label: 'PM Kisan installment status',                query: 'PM Kisan ka paisa kab aayega mere account mein' },
      { key: 'ration_status',         label: 'Ration card status',                          query: 'Mera ration card ka status check karo' },
      { key: 'scholarships_12th_sc',  label: 'Scholarships for daughter (Class 12)',        query: 'Beti ke liye scholarship batao 12th class' },
    ],
  },
  {
    group: 'Local Services',
    items: [
      { key: 'plumbers_indore',         label: 'Plumber (Indore variant)',                  query: 'Indore mein plumber chahiye, nal kharab hai' },
      { key: 'pediatricians_open_now',  label: 'Pediatrician — child fever 2 a.m.',         query: 'Bachche ko bukhar hai, abhi koi pediatrician available hai paas mein' },
      { key: 'tutors_maths_class10',    label: 'Maths tutor for Class 10',                  query: 'Class 10 ke liye maths tutor chahiye' },
      { key: 'tailors_diwali',          label: 'Diwali blouse tailoring',                   query: 'Diwali ke liye blouse silwana hai' },
    ],
  },
  {
    group: 'Recharge & Bills',
    items: [
      { key: 'recharge_299_single',  label: '₹299 plan — single-path confirm',              query: 'Mera recharge khatam ho raha hai, ₹299 wala lagao' },
      { key: 'gas_refill',           label: 'Cooking gas refill',                           query: 'Cylinder book karo, is hafte delivery' },
    ],
  },
  {
    group: 'Order & Buy',
    items: [
      { key: 'kirana_reorder',          label: 'Kirana reorder',                            query: 'Maggi 5 packets aur ek dabba haldi mangwao' },
      { key: 'milk_subscription_edit',  label: 'Milk subscription edit',                    query: 'Doodh kal se 1 litre kar do' },
    ],
  },
];

/* ============================================================================
   Globals — make the integration points reachable from index.html's inline
   script. Only exposing what host pages actually need.
   ============================================================================ */
window.renderDiscoveryView = renderDiscoveryView;
window.renderInformationalResponse = renderInformationalResponse;
window.renderSuggestedPrompts = renderSuggestedPrompts;
window.validateDiscoveryView = validateDiscoveryView;
window.DATASETS = DATASETS;
window.DATASET_GROUPS = DATASET_GROUPS;
window.PILLAR_GROUPS = PILLAR_GROUPS;
window.INFORMATIONAL_RESPONSES = INFORMATIONAL_RESPONSES;

// Mocks — attached so a host page can build a view from a mock key without
// needing its own registry.
window.MOCK_RESTAURANTS = MOCK_RESTAURANTS;
window.MOCK_BIRYANI_HYDERABAD = MOCK_BIRYANI_HYDERABAD;
window.MOCK_DOCTORS = MOCK_DOCTORS;
window.MOCK_PLUMBERS = MOCK_PLUMBERS;
window.MOCK_SCHOOLS_BANDRA = MOCK_SCHOOLS_BANDRA;
window.MOCK_APARTMENTS = MOCK_APARTMENTS;
window.MOCK_KURTA_DIWALI = MOCK_KURTA_DIWALI;
window.MOCK_GIFTS_WEDDING = MOCK_GIFTS_WEDDING;
window.MOCK_MOVIES_WEEKEND = MOCK_MOVIES_WEEKEND;
window.MOCK_DEVOTIONAL_MORNING = MOCK_DEVOTIONAL_MORNING;
window.MOCK_COURSES_DATASCIENCE = MOCK_COURSES_DATASCIENCE;
window.MOCK_IPL_TODAY = MOCK_IPL_TODAY;
window.MOCK_SCHEMES_FARMERS = MOCK_SCHEMES_FARMERS;
window.MOCK_HOME_LOANS = MOCK_HOME_LOANS;
window.MOCK_FLIGHTS_MUMBAI = MOCK_FLIGHTS_MUMBAI;
window.MOCK_RECHARGE_299 = MOCK_RECHARGE_299;
window.MOCK_PHONES_20K = MOCK_PHONES_20K;
window.MOCK_TRAINS_TATKAL = MOCK_TRAINS_TATKAL;
window.MOCK_HEALTH_INSURANCE = MOCK_HEALTH_INSURANCE;
window.MOCK_EMI_FRIDGE = MOCK_EMI_FRIDGE;
// Pillar mocks (voice-first use cases)
window.MOCK_PLUMBERS_INDORE = MOCK_PLUMBERS_INDORE;
window.MOCK_RECHARGE_299_SINGLE = MOCK_RECHARGE_299_SINGLE;
window.MOCK_PEDIATRICIANS_OPEN_NOW = MOCK_PEDIATRICIANS_OPEN_NOW;
window.MOCK_GAS_REFILL = MOCK_GAS_REFILL;
window.MOCK_SCHOLARSHIPS_12TH_SC = MOCK_SCHOLARSHIPS_12TH_SC;
window.MOCK_TUTORS_MATHS_CLASS10 = MOCK_TUTORS_MATHS_CLASS10;
window.MOCK_TAILORS_DIWALI = MOCK_TAILORS_DIWALI;
window.MOCK_KIRANA_REORDER = MOCK_KIRANA_REORDER;
window.MOCK_MILK_SUBSCRIPTION_EDIT = MOCK_MILK_SUBSCRIPTION_EDIT;
window.INFO_PM_KISAN_STATUS = INFO_PM_KISAN_STATUS;
window.INFO_RATION_STATUS = INFO_RATION_STATUS;
// Partner mocks — Swiggy MCP Food samples
window.MOCK_SWIGGY_BIRYANI_SEARCH = MOCK_SWIGGY_BIRYANI_SEARCH;
window.MOCK_SWIGGY_PARADISE_MENU = MOCK_SWIGGY_PARADISE_MENU;
window.MOCK_SWIGGY_PARADISE_ORDER = MOCK_SWIGGY_PARADISE_ORDER;
window.INFO_SWIGGY_ORDER_STATUS = INFO_SWIGGY_ORDER_STATUS;
// Partner mocks — Bus Travel aggregator
window.MOCK_BUS_BLR_TPTY_COMPARE = MOCK_BUS_BLR_TPTY_COMPARE;
window.MOCK_BUS_VRL_TPTY_SEATS = MOCK_BUS_VRL_TPTY_SEATS;
window.MOCK_BUS_VRL_BOOKING_CONFIRM = MOCK_BUS_VRL_BOOKING_CONFIRM;
window.INFO_BUS_TRIP_STATUS = INFO_BUS_TRIP_STATUS;
window.INFO_BUS_TICKET = INFO_BUS_TICKET;

/* ============================================================================
   Delegated event plumbing — every interactive primitive carries
   `data-event` (click) or `data-event-prefix` (change). The playground used
   one listener on its own root; for host integration we listen on `document`
   but only fire for targets that live inside a `.jbiq-discovery` container so
   we never interfere with the host app's own event handling.

   Chip and sort events mutate the wrapper's stashed view and trigger a
   re-render (§8 — chips must narrow the result set in a single tap,
   reversible in a single tap). All other events are passed through to any
   listeners added via `window.addEventListener('jbiq-discovery-event', ...)`,
   which is how the host (chat) can react to card taps, location changes, etc.
   ============================================================================ */
function jbiqEmit(wrapper, name, detail) {
  window.dispatchEvent(new CustomEvent('jbiq-discovery-event', {
    detail: { wrapper, name, ...detail },
  }));
}

document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-event]');
  if (!target) return;
  const wrapper = target.closest('.jbiq-discovery');
  if (!wrapper) return;

  const name = target.getAttribute('data-event');
  const view = wrapper.__jbiqView;

  // Chip toggle: `filter.toggle.<chip_id>`
  const chipMatch = /^filter\.toggle\.(.+)$/.exec(name);
  if (chipMatch && view && view.filters && Array.isArray(view.filters.chips)) {
    const chipId = chipMatch[1];
    const chip = view.filters.chips.find((c) => c.id === chipId);
    if (chip) {
      if (view.filters.multi_select === false) {
        view.filters.chips.forEach((c) => { c.selected = (c.id === chipId) ? !c.selected : false; });
      } else {
        chip.selected = !chip.selected;
      }
      rerenderDiscoveryView(wrapper);
    }
    jbiqEmit(wrapper, name, { chipId });
    return;
  }

  // Any other click is a host-observable event (card tap, location change,
  // secondary action). Re-dispatch as a CustomEvent for the host to handle.
  // SuggestedPrompts buttons also carry `data-query` — forward it in the
  // detail so the host can fire the next utterance without needing to look
  // up via the view schema (data travels with the click).
  const query = target.getAttribute('data-query') || null;
  jbiqEmit(wrapper, name, { query });
});

document.addEventListener('change', (e) => {
  const target = e.target.closest('[data-event-prefix]');
  if (!target) return;
  const wrapper = target.closest('.jbiq-discovery');
  if (!wrapper) return;

  const prefix = target.getAttribute('data-event-prefix');
  const value = target.value;
  const name = `${prefix}.${value}`;
  const view = wrapper.__jbiqView;

  if (prefix === 'sort.change' && view && view.sort) {
    view.sort.selected_id = value;
    rerenderDiscoveryView(wrapper);
  }
  jbiqEmit(wrapper, name, { prefix, value });
});
