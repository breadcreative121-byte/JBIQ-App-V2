/* Evergreen category row for the non-festive "Cards" Home (Figma 200-7094 shows
   a 3-across topic row, but its Diwali categories belong to Festive only). These
   map to real app domains and reuse existing tile art, so they read correctly
   year-round. Festive keeps its own FESTIVE_CATEGORIES. */
import type { FestiveCategory } from './festive';

export const HOME_CATEGORIES: FestiveCategory[] = [
  { image: require('../../../assets/tiles/astrology.png'), label: 'Astrology', prompt: 'Read my horoscope' },
  { image: require('../../../assets/tiles/darshan.png'), label: 'Devotion', prompt: 'Join the live Darshan' },
  { image: require('../../../assets/tiles/cricket.png'), label: 'Cricket', prompt: "How did yesterday's match go?" },
];
