import { WebStack, type WebItem } from './webview/WebStack';

const ITEMS: WebItem[] = [
  { id: 'components', title: 'Components Playground', path: 'components-playground.html' },
  { id: 'components-overview', title: 'Components Overview', path: 'components-overview.html' },
  { id: 'conversation', title: 'Conversation Playground', path: 'conversation-playground.html' },
  { id: 'place', title: 'Place Playground', path: 'place-playground.html' },
  { id: 'research', title: 'Voice Assistant Research', path: 'voice-assistant-research.html' },
  { id: 'brand', title: 'Brand Placement Deck', path: 'brand-placement-deck.html' },
];

export function PlaygroundScreen() {
  return <WebStack title="Playground" items={ITEMS} />;
}
