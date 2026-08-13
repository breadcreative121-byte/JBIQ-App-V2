/* Prompt → 3D tile image (Image-tile card variant, Figma 179:7255 / 179:7097).
   The PNGs under assets/tiles ship the emoji already sitting on the light-grey
   #f5f5f6 rounded tile, so PromptTileRow just draws the image. Matching is by
   keyword on the card's own text, so verticals.ts / the phrase sets stay
   untouched ("everything else the same"). Prompts with no match fall back to the
   existing glyph in a grey tile — add a PNG + a rule here to give them art. */
import type { ImageSourcePropType } from 'react-native';

const TILES = {
  panchang: require('../../../assets/tiles/panchang.png'),
  electricity: require('../../../assets/tiles/electricity.png'),
  cricket: require('../../../assets/tiles/cricket.png'),
  darshan: require('../../../assets/tiles/darshan.png'),
  remedy: require('../../../assets/tiles/remedy.png'),
  kundali: require('../../../assets/tiles/kundali.png'),
  compatibility: require('../../../assets/tiles/compatibility.png'),
  shubhMurat: require('../../../assets/tiles/shubh-murat.png'),
} as const;

// First match wins — keep specific patterns above generic ones.
const RULES: { re: RegExp; img: ImageSourcePropType }[] = [
  { re: /electricity|\bbill\b|recharge/i, img: TILES.electricity },
  { re: /match|cricket|score|commentary/i, img: TILES.cricket },
  { re: /panchang/i, img: TILES.panchang },
  { re: /darshan|aarti|devotional|temple/i, img: TILES.darshan },
  { re: /shubh|muhurat|murat/i, img: TILES.shubhMurat },
  { re: /compatib/i, img: TILES.compatibility },
  { re: /kundali|birth chart|horoscope|nakshatra|\bmoon\b/i, img: TILES.kundali },
  { re: /remedy/i, img: TILES.remedy },
];

/** Resolve a tile image for a card's visible text, or undefined to fall back. */
export function tileImageFor(text?: string): ImageSourcePropType | undefined {
  if (!text) return undefined;
  for (const rule of RULES) if (rule.re.test(text)) return rule.img;
  return undefined;
}
