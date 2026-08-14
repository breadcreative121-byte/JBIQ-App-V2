/* Prompt → 3D tile image (Image-tile / Festive / Cards variants). The PNGs under
   assets/tiles ship the emoji already sitting on the light-grey #f5f5f6 rounded
   tile, so PromptTileRow / BigPromptCard just draw the image. Matching is by
   keyword on the card's own text, so verticals.ts / the phrase sets stay
   untouched. Prompts with no match fall back to the glyph — add a PNG + a rule
   here to give them art. */
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
  // Gap-fill art (Figma 200:7494)
  talk: require('../../../assets/tiles/talk.png'),
  breathing: require('../../../assets/tiles/breathing.png'),
  groceries: require('../../../assets/tiles/groceries.png'),
  music: require('../../../assets/tiles/music.png'),
  movies: require('../../../assets/tiles/movies.png'),
  news: require('../../../assets/tiles/news.png'),
  english: require('../../../assets/tiles/english.png'),
  care: require('../../../assets/tiles/care.png'),
  learning: require('../../../assets/tiles/learning.png'),
  exam: require('../../../assets/tiles/exam.png'),
  decision: require('../../../assets/tiles/decision.png'),
  factcheck: require('../../../assets/tiles/factcheck.png'),
  localnews: require('../../../assets/tiles/localnews.png'),
  story: require('../../../assets/tiles/story.png'),
  devotional: require('../../../assets/tiles/devotional.png'),
  recharge: require('../../../assets/tiles/recharge.png'),
  bus: require('../../../assets/tiles/bus.png'),
  weather: require('../../../assets/tiles/weather.png'),
  astrology: require('../../../assets/tiles/astrology.png'),
  horoscope: require('../../../assets/tiles/horoscope.png'),
} as const;

// First match wins — keep specific patterns above generic ones.
const RULES: { re: RegExp; img: ImageSourcePropType }[] = [
  // Utilities / shopping / travel
  { re: /recharge/i, img: TILES.recharge },
  { re: /electricity|\bbill\b/i, img: TILES.electricity },
  { re: /order|milk|bread|grocer/i, img: TILES.groceries },
  { re: /\bbus\b|book a bus/i, img: TILES.bus },
  { re: /weather/i, img: TILES.weather },
  // Media / entertainment
  { re: /commentary|cricket|match|score/i, img: TILES.cricket },
  { re: /watch|movie|tonight|cinema/i, img: TILES.movies },
  { re: /music|song|playlist/i, img: TILES.music },
  // News / info
  { re: /local news/i, img: TILES.localnews },
  { re: /fact.?check/i, img: TILES.factcheck },
  { re: /news/i, img: TILES.news },
  { re: /\bstory\b/i, img: TILES.story },
  // Devotion / astrology
  { re: /panchang/i, img: TILES.panchang },
  { re: /devotional/i, img: TILES.devotional },
  { re: /darshan|aarti|temple/i, img: TILES.darshan },
  { re: /shubh|muhurat|murat/i, img: TILES.shubhMurat },
  { re: /compatib/i, img: TILES.compatibility },
  { re: /horoscope|zodiac/i, img: TILES.horoscope },
  { re: /astrology/i, img: TILES.astrology },
  { re: /kundali|birth chart|nakshatra|\bmoon\b/i, img: TILES.kundali },
  { re: /remedy/i, img: TILES.remedy },
  // Health / wellbeing
  { re: /breath|meditat|relax|\bcalm\b/i, img: TILES.breathing },
  { re: /loved one|\bfamily\b|care for/i, img: TILES.care },
  // Learning / career (english before the generic learning rule)
  { re: /english/i, img: TILES.english },
  { re: /micro learning|\blearning\b|\bbrain\b/i, img: TILES.learning },
  { re: /\bexam\b|government|\bmock\b|interview/i, img: TILES.exam },
  { re: /weigh|decision/i, img: TILES.decision },
  // Conversation
  { re: /\btalk\b|\bchat\b/i, img: TILES.talk },
];

/** Resolve a tile image for a card's visible text, or undefined to fall back. */
export function tileImageFor(text?: string): ImageSourcePropType | undefined {
  if (!text) return undefined;
  for (const rule of RULES) if (rule.re.test(text)) return rule.img;
  return undefined;
}
