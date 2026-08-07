/* Content for the six Spaces. Astrology + Health match Figma 136:2341 /
   137:2842; Devotion, Career, Your Friend and News follow the same card system
   using the prototype (docs/home-spaces-nav-v1.md §4). Every tappable element
   carries a `prompt` — tapping it is the same as saying it, so it hands off to
   the Saathi voice screen. */
import type { Ionicons } from '@expo/vector-icons';
import type { GlyphName } from '@/components/AccentIconChip';
import type { JdsName } from '@/theme/jdsIcons';

type IoniconName = keyof typeof Ionicons.glyphMap;

export type SpaceAction = {
  icon?: GlyphName;
  jds?: JdsName;
  title: string;
  subtitle: string;
  prompt: string;
  soon?: boolean;
};

export type SpaceHero = {
  icon?: GlyphName;
  jds?: JdsName;
  live?: boolean;
  eyebrow: string;
  title: string;
  body: string;
  buttonLabel: string;
  buttonVariant?: 'solid' | 'ghost';
  buttonIcon?: IoniconName;
  prompt: string;
};

export type SpaceBlock =
  | { kind: 'hero'; hero: SpaceHero }
  | { kind: 'grid'; items: [SpaceAction, SpaceAction] }
  | { kind: 'action'; item: SpaceAction }
  | { kind: 'label'; text: string }
  | {
      kind: 'cricket';
      eyebrow: string;
      score: string;
      meta: string;
      chips: { label: string; prompt: string }[];
    }
  | { kind: 'disclaimer'; text: string };

export type Vertical = { id: string; tab: string; contextLine: string; blocks: SpaceBlock[] };

export const VERTICALS: Vertical[] = [
  {
    id: 'astrology',
    tab: 'Astrology',
    contextLine: 'Aaj ka rashifal ready — Mesh.',
    blocks: [
      {
        kind: 'hero',
        hero: {
          icon: 'star-four-points',
          eyebrow: 'Aaj ka Rashifal',
          title: 'Today · Mesh (Aries)',
          body: 'A steady day for money matters. 2 min · audio + video.',
          buttonLabel: 'Tap to hear',
          buttonIcon: 'play',
          prompt: 'Aaj ka rashifal sunao',
        },
      },
      {
        kind: 'grid',
        items: [
          {
            icon: 'star-circle-outline',
            title: 'Meri Kundali',
            subtitle: 'Your saved birth chart',
            prompt: 'Meri kundali dikhao',
          },
          {
            icon: 'flower-outline',
            title: 'Aaj Ka Upay',
            subtitle: 'Venus remedy for today',
            prompt: 'Aaj ka upay batao',
          },
        ],
      },
      {
        kind: 'hero',
        hero: {
          icon: 'star-shooting-outline',
          eyebrow: 'Signature',
          title: 'Grand Kundali Reveal',
          body: 'Your birth chart, narrated — voice-first.',
          buttonLabel: 'Begin reveal',
          buttonVariant: 'ghost',
          prompt: 'Grand Kundali Reveal shuru karo',
        },
      },
      { kind: 'disclaimer', text: 'AI-generated · general guidance, not professional advice.' },
    ],
  },
  {
    id: 'devotion',
    tab: 'Devotion',
    contextLine: 'Kashi Vishwanath — live now.',
    blocks: [
      {
        kind: 'hero',
        hero: {
          live: true,
          eyebrow: 'Live Darshan',
          title: 'Kashi Vishwanath',
          body: '12,480 watching · aarti at 7:00 pm',
          buttonLabel: 'Join darshan',
          prompt: 'Kashi Vishwanath darshan join karo',
        },
      },
      {
        kind: 'grid',
        items: [
          {
            icon: 'calendar-clock',
            title: 'Panchang',
            subtitle: 'Sunrise 6:04 · Rahukaal 4:30–6:00 pm',
            prompt: 'Aaj ka panchang batao',
          },
          {
            icon: 'book-open-page-variant-outline',
            jds: 'ic_document',
            title: 'Aaj ki Kahaniya',
            subtitle: "Today's devotional story",
            prompt: 'Aaj ki kahaniya sunao',
          },
        ],
      },
      {
        kind: 'action',
        item: {
          icon: 'music-note-outline',
          title: 'Morning devotionals',
          subtitle: 'Hanuman Chalisa, Suprabhatam · 5 playlists',
          prompt: 'Morning devotional songs chalao',
        },
      },
    ],
  },
  {
    id: 'health',
    tab: 'Health',
    contextLine: 'How are you feeling today?',
    blocks: [
      {
        kind: 'hero',
        hero: {
          icon: 'heart-outline',
          jds: 'ic_health_conditions',
          eyebrow: 'Daily check-in',
          title: 'Tell me how you feel',
          body: "A quick check-in — I'll suggest what helps.",
          buttonLabel: 'Start check-in',
          prompt: 'Aaj thoda thakaan lag rahi hai',
        },
      },
      {
        kind: 'grid',
        items: [
          {
            icon: 'leaf',
            title: "Today's remedy",
            subtitle: 'Guided home remedy',
            prompt: 'Aaj ka gharelu upay batao',
          },
          {
            icon: 'account-heart-outline',
            jds: 'ic_favorite',
            title: 'Care for a loved one',
            subtitle: 'Family health profiles',
            prompt: 'Apne parivaar ki health dekho',
          },
        ],
      },
      {
        kind: 'action',
        item: {
          icon: 'meditation',
          title: 'Breathe & relax',
          subtitle: '2-minute guided breathing',
          prompt: 'Ek breathing exercise karao',
        },
      },
      {
        kind: 'disclaimer',
        text: 'General guidance, not medical advice. For emergencies, contact a doctor.',
      },
    ],
  },
  {
    id: 'career',
    tab: 'Career',
    contextLine: 'SSC CGL mock ready — 20 min.',
    blocks: [
      {
        kind: 'hero',
        hero: {
          icon: 'microphone-outline',
          eyebrow: 'Interview Prep',
          title: 'SSC CGL — mock',
          body: '12 questions · 20 min · diagnostic-first',
          buttonLabel: 'Start drill',
          prompt: 'SSC CGL mock interview shuru karo',
        },
      },
      { kind: 'label', text: 'Pick a path' },
      {
        kind: 'grid',
        items: [
          {
            icon: 'translate',
            jds: 'ic_language',
            title: 'English Learning',
            subtitle: 'Repeat after me · Listen / Speak',
            prompt: 'English pronunciation practice karao',
          },
          {
            icon: 'book-outline',
            jds: 'ic_brain',
            title: 'Micro Learning',
            subtitle: 'Bite-size skill lessons',
            prompt: 'Micro learning shuru karo',
            soon: true,
          },
        ],
      },
      {
        kind: 'action',
        item: {
          icon: 'bank-outline',
          jds: 'ic_document',
          title: 'Government Exam',
          subtitle: 'Discovery & prep',
          prompt: 'Government exam prep dikhao',
          soon: true,
        },
      },
    ],
  },
  {
    id: 'friend',
    tab: 'Your Friend',
    contextLine: "I'm here whenever — how's your day?",
    blocks: [
      {
        kind: 'hero',
        hero: {
          icon: 'chat-outline',
          jds: 'ic_new_chat',
          eyebrow: 'A space to talk',
          title: "Let's chat",
          body: 'No task, no rush. Just talk it out.',
          buttonLabel: 'Start a chat',
          prompt: 'Aaj ka din thoda mushkil tha',
        },
      },
      {
        kind: 'grid',
        items: [
          {
            icon: 'scale-balance',
            title: 'Weigh a decision',
            subtitle: 'Pros & cons, together',
            prompt: 'Ek decision mein meri madad karo',
          },
          {
            icon: 'leaf',
            title: 'Breathing',
            subtitle: 'Calm down in 2 min',
            prompt: 'Ek breathing exercise karao',
          },
        ],
      },
      {
        kind: 'disclaimer',
        text: 'Your Friend is for company and clarity — warm, private, and never about transactions.',
      },
    ],
  },
  {
    id: 'news',
    tab: 'News',
    contextLine: 'Your 3-minute brief is ready.',
    blocks: [
      {
        kind: 'hero',
        hero: {
          icon: 'account-voice',
          jds: 'ic_brain',
          eyebrow: 'AI Anchor · Daily Brief',
          title: 'This morning in 3 minutes',
          body: '6 top stories · in your language',
          buttonLabel: 'Play brief',
          buttonIcon: 'play',
          prompt: 'Aaj ka news brief sunao',
        },
      },
      {
        kind: 'cricket',
        eyebrow: 'Cricket · live',
        score: 'IND 287/4',
        meta: 'Over 42 · Kohli 88* · Gill 54',
        chips: [
          { label: 'Commentary', prompt: 'Commentary chalao' },
          { label: 'Win %', prompt: 'Win percentage batao' },
          { label: 'Share', prompt: 'Match WhatsApp pe share karo' },
        ],
      },
      {
        kind: 'grid',
        items: [
          {
            icon: 'check-decagram-outline',
            title: 'Fact Check',
            subtitle: 'Paste / scan / voice → verdict',
            prompt: 'Is WhatsApp forward ko fact check karo',
          },
          {
            icon: 'map-marker-outline',
            title: 'Local News',
            subtitle: 'Around Indore today',
            prompt: 'Mere sheher ki local news batao',
          },
        ],
      },
    ],
  },
];

/** id → index, for the moment-led deep-link from Home. */
export const VERTICAL_INDEX: Record<string, number> = VERTICALS.reduce(
  (acc, v, i) => ({ ...acc, [v.id]: i }),
  {} as Record<string, number>,
);
