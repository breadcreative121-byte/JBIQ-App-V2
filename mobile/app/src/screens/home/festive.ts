/* Content for the Festive Home variant (Figma 193:3924 — Diwali). Same image-tile
   rows as the tile variant, plus a 3-across category row and festive chrome. Images
   ship the 3D art on the light tile (categories) / transparent flame; PromptTileRow
   and FestiveCategoryRow just draw them. Tapping any item hands its `prompt` to
   Saathi, exactly like the phrase rows / Space cards. */
import type { ImageSourcePropType } from 'react-native';

/** Greeting prefix — composed with the user's name in HomeScreen. */
export const FESTIVE_GREETING = 'Happy Diwali';

export type FestiveCategory = { image: ImageSourcePropType; label: string; prompt: string };
export type FestivePhrase = { image: ImageSourcePropType; text: string; prompt: string };

// The 3-across category row (larger square cards with a label beneath).
export const FESTIVE_CATEGORIES: FestiveCategory[] = [
  { image: require('../../../assets/festive/lights.png'), label: 'Lights', prompt: 'Show me Diwali lights and diyas' },
  { image: require('../../../assets/festive/feasts.png'), label: 'Feasts', prompt: 'Suggest Diwali feast recipes' },
  { image: require('../../../assets/festive/puja.png'), label: 'Puja', prompt: 'Guide me through the Diwali puja' },
];

// The image-tile prompt rows below the category row. Multiple sets so the Home
// carousel (swipe up / dots) can cycle them, same as the other variants.
export const FESTIVE_PHRASE_SETS: FestivePhrase[][] = [
  [
    { image: require('../../../assets/festive/kurtas.png'), text: 'Shop Kurtas for Diwali', prompt: 'Shop kurtas for Diwali' },
    { image: require('../../../assets/festive/gifts.png'), text: 'Shop festive gifts', prompt: 'Shop festive gifts for Diwali' },
    { image: require('../../../assets/festive/celebrate.png'), text: 'How to celebrate Diwali', prompt: 'How do I celebrate Diwali?' },
  ],
  [
    { image: require('../../../assets/festive/lights.png'), text: 'Decorate with diyas', prompt: 'Show me diya decoration ideas' },
    { image: require('../../../assets/festive/feasts.png'), text: 'Diwali sweets to make', prompt: 'Suggest Diwali sweets to make' },
    { image: require('../../../assets/festive/puja.png'), text: 'Puja items checklist', prompt: 'Give me a Diwali puja checklist' },
  ],
  [
    { image: require('../../../assets/festive/gifts.png'), text: 'Gift ideas for family', prompt: 'Gift ideas for my family this Diwali' },
    { image: require('../../../assets/festive/celebrate.png'), text: 'Rangoli design ideas', prompt: 'Show me rangoli designs for Diwali' },
    { image: require('../../../assets/festive/kurtas.png'), text: 'What to wear this Diwali', prompt: 'What should I wear this Diwali?' },
  ],
];

// The edge flames flanking the category row are drawn as a vector (FestiveFlame),
// so no flame image assets are needed here.
