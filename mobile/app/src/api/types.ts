// Shapes mirror the Express backend (server.js). Kept intentionally loose where
// the server is loose (userProfile, DiscoveryView).

export type ChatRole = 'user' | 'assistant';
export type ChatMessage = { role: ChatRole; content: string };

// Server forwards this straight into buildSystemPrompt(); flexible by design.
export type UserProfile = Record<string, unknown>;

export type ChatResponse = { text: string };

export type LanguageCode = 'hi-IN' | 'en-IN' | (string & {});

export type TtsOptions = {
  speaker?: string;
  language_code?: LanguageCode;
};

// /api/tts returns audio bytes; the client persists them and hands back a URI.
export type TtsResult = { uri: string };

export type SttResult = { transcript: string; language_code?: string };

// CatalogDiscoveryView is large and renderer-defined; keep it opaque for V1.
export type DiscoveryView = Record<string, unknown>;
export type SwiggyMenuResponse = { view: DiscoveryView; debug?: unknown };
