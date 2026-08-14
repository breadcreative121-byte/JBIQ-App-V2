import { WebStack, type WebItem } from './webview/WebStack';

// Titles mirror each chapter page's <title> (kept in sync manually — they change
// rarely). Source of truth is voice-playbook-chN.html.
const CHAPTER_TITLES = [
  'Identity & voice DNA',
  'The ten conversation principles',
  'The reply rhythm',
  'Response shapes & anatomy',
  'Voice disclosure',
  'Language, code-switching & cultural fluency',
  'Memory, confidence & autonomy',
  'Commitment & security',
  'Failing well — errors, repair, resumption',
  'Multi-modal handoff',
  'Partner ecosystem & attribution',
  'Sensitive moments',
  'What JBIQ never does',
  'Measurement, QA & governance',
];

const CHAPTERS: WebItem[] = CHAPTER_TITLES.map((title, i) => ({
  id: `ch${i + 1}`,
  title,
  subtitle: `Chapter ${i + 1}`,
  path: `voice-playbook-ch${i + 1}.html`,
}));

const ITEMS: WebItem[] = [
  { id: 'overview', title: 'Voice Playbook', subtitle: 'Full playbook overview', path: 'voice-playbook.html' },
  ...CHAPTERS,
];

export function PlaybookScreen() {
  return <WebStack title="Playbook" items={ITEMS} />;
}
