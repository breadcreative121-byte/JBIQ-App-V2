/* Interest taxonomy — the single source of truth shared by the first-run
   interests picker (InterestsIntro) and the homepage suggestion prompts. A chip
   maps literally to that interest's prompts, so a user's picks reorder Home.
   Copy is reused from HomeScreen's PHRASE_SETS / the Spaces verticals so the
   personalised set stays in the same voice as the defaults. */
import type { GlyphName } from '@/components/AccentIconChip';
import type { JdsName } from '@/theme/jdsIcons';

// Same shape as HomeScreen's local `Phrase` (structurally compatible).
export type Phrase = { icon?: GlyphName; jds?: JdsName; text: string };

export type InterestId =
  | 'astrology'
  | 'devotion'
  | 'cricket'
  | 'movies'
  | 'news'
  | 'bills'
  | 'health'
  | 'learning'
  | 'friend';

export type Interest = {
  id: InterestId;
  label: string; // chip text
  icon: GlyphName; // MaterialCommunityIcons glyph
  prompts: Phrase[]; // 1–2 homepage suggestions this interest contributes
};

// ~9 granular interests spanning both Spaces and everyday tasks.
export const INTERESTS: Interest[] = [
  {
    id: 'astrology',
    label: 'Astrology & Kundali',
    icon: 'star-four-points',
    prompts: [
      { icon: 'star-four-points', text: "Read tomorrow's horoscope" },
      { icon: 'star-four-points', text: 'Show my Kundali' },
    ],
  },
  {
    id: 'devotion',
    label: 'Devotion & Darshan',
    icon: 'hands-pray',
    prompts: [
      { icon: 'hands-pray', text: 'Join the live darshan' },
      { icon: 'hands-pray', text: "Read today's Panchang" },
    ],
  },
  {
    id: 'cricket',
    label: 'Cricket',
    icon: 'cricket',
    prompts: [{ icon: 'cricket', text: 'How did yesterdays match go' }],
  },
  {
    id: 'movies',
    label: 'Movies & TV',
    icon: 'movie-open-outline',
    prompts: [{ icon: 'movie-open-outline', text: 'What should I watch tonight?' }],
  },
  {
    id: 'news',
    label: 'News',
    icon: 'newspaper-variant-outline',
    prompts: [{ icon: 'newspaper-variant-outline', text: 'Read me the news brief' }],
  },
  {
    id: 'bills',
    label: 'Bills & Recharge',
    icon: 'wallet-outline',
    prompts: [
      { icon: 'lightbulb-on-outline', text: 'Pay the electricity bill' },
      { icon: 'cellphone', text: 'Recharge my number' },
    ],
  },
  {
    id: 'health',
    label: 'Health & Calm',
    icon: 'heart-pulse',
    prompts: [{ icon: 'meditation', text: 'Guide me through breathing' }],
  },
  {
    id: 'learning',
    label: 'Learning English',
    icon: 'school-outline',
    prompts: [{ icon: 'school-outline', text: 'Practice English with me' }],
  },
  {
    id: 'friend',
    label: 'Just chat',
    icon: 'account-heart-outline',
    prompts: [{ jds: 'ic_new_chat', text: 'Talk to me for a bit' }],
  },
];

const BY_ID: Record<InterestId, Interest> = INTERESTS.reduce(
  (acc, it) => {
    acc[it.id] = it;
    return acc;
  },
  {} as Record<InterestId, Interest>,
);

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* Build the homepage suggestion sets from the user's picks: selected interests'
   prompts float to the front (in pick order), the rest follow for variety.
   Returns Phrase[][] in the SAME shape as PHRASE_SETS (sets of 4) so Home's
   swipe-up cycling and dots stay untouched. Empty selection → null (fall back to
   the default PHRASE_SETS). */
export function buildPhraseSets(selected: InterestId[]): Phrase[][] | null {
  if (!selected || selected.length === 0) return null;

  const picked = new Set(selected);
  const selectedPrompts = selected.flatMap((id) => BY_ID[id]?.prompts ?? []);
  const restPrompts = INTERESTS.filter((it) => !picked.has(it.id)).flatMap((it) => it.prompts);

  const ordered = [...selectedPrompts, ...restPrompts];
  const sets = chunk(ordered, 4);
  return sets.length ? sets : null;
}
