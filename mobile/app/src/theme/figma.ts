/* Figma palette — exact values from the "Updates" file (nodes 129:1989,
   136:2341, 137:2842). These screens use a distinct, uniform treatment that is
   NOT the same as the generated JDS tokens in `@theme` (which are purple
   #6d17ce): here the brand is indigo #3900ad with an orange #ff671f glyph on
   peach icon circles. Colours live here because they are not (yet) in
   tokens/jds.tokens.json; spacing / radius / type still come from `@theme`.

   If these are later promoted into the design-token pipeline, replace this file
   with the generated equivalents. */

export const fig = {
  // Brand / interactive (buttons, mic, logo, tinted icons)
  brand: '#3900ad',
  brandPressed: '#2a0080',

  // Accent glyph on peach icon circles
  accent: '#ff671f',
  accentSurface: '#fbe6de', // icon-circle background
  accentTint: '#fbcbb9', // stronger peach (active tab / pressed)

  // Lilac surface — the "+" composer button & subtle chips
  lilac: '#e7e9ff',

  // Text
  textHigh: '#0c0d10',
  textLow: 'rgba(12,13,16,0.65)',
  textOnBrand: '#ffffff',

  // Surfaces
  surface: '#ffffff',
  surfaceGhost: '#eeeeef',
  surfaceMinimal: '#f5f5f5',
  tileSurface: '#f5f5f6', // image-tile background (colour/surface/surface) — Figma 179:7263
  heroTint: '#f3f4ff', // primary hero card background (colour/surface/surface)

  // Strokes
  strokeCard: 'rgba(71,76,85,0.12)', // #474c551f — content/stroke-low (cards, phrase pills)
  strokeSubtle: 'rgba(12,13,16,0.12)',

  // Status
  live: '#fa2f40',

  // Festive Home variant (Figma 193:3924 — Diwali)
  festiveBg: '#3900ad', // festival background block (node 193:4237 fill = brand indigo)
  marigold: '#f7ab20', // gold flame / diya accent
} as const;

export type Fig = typeof fig;
