import { API_BASE_URL, REQUEST_TIMEOUT_MS } from '@/config';
import { persistTtsAudio } from './persistTtsAudio';
import type {
  ChatMessage,
  ChatResponse,
  UserProfile,
  TtsOptions,
  TtsResult,
  SttResult,
  SwiggyMenuResponse,
} from './types';

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Devanagari → hi-IN, else en-IN. Mirrors server.js so client and server agree
// when the caller doesn't pin a language explicitly.
export function detectLanguage(text: string): 'hi-IN' | 'en-IN' {
  return /[ऀ-ॿ]/.test(text) ? 'hi-IN' : 'en-IN';
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await run(controller.signal);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new ApiError('Request timed out', 408);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Surfaces a JSON { error } message without ever logging the raw body.
async function errorFrom(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status})`;
  try {
    const data = await res.json();
    if (data && typeof data.error === 'string') message = data.error;
  } catch {
    // non-JSON error body — keep the generic message
  }
  return new ApiError(message, res.status);
}

export function chat(messages: ChatMessage[], userProfile?: UserProfile): Promise<ChatResponse> {
  return withTimeout(async (signal) => {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, userProfile }),
      signal,
    });
    if (!res.ok) throw await errorFrom(res);
    return (await res.json()) as ChatResponse;
  });
}

// POSTs to /api/tts, persists the mp3 bytes to the cache dir, returns a file URI
// the audio player can load (the endpoint is POST-only, so we can't stream it).
export function tts(text: string, opts?: TtsOptions): Promise<TtsResult> {
  return withTimeout(async (signal) => {
    const language_code = opts?.language_code ?? detectLanguage(text);
    const res = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, speaker: opts?.speaker, language_code }),
      signal,
    });
    if (!res.ok) throw await errorFrom(res);

    const bytes = new Uint8Array(await res.arrayBuffer());
    return { uri: persistTtsAudio(bytes) };
  });
}

// Sends base64-encoded audio to /api/stt (server proxies to Sarvam STT). Keeps
// keys off-device. Short utterances only (server's 2 MB JSON limit).
export function stt(audioBase64: string, languageCode?: string): Promise<SttResult> {
  return withTimeout(async (signal) => {
    const res = await fetch(`${API_BASE_URL}/api/stt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: audioBase64, language_code: languageCode }),
      signal,
    });
    if (!res.ok) throw await errorFrom(res);
    return (await res.json()) as SttResult;
  });
}

// Partner demo — stubbed for V1 (native UI is V2). The endpoint exists server-side.
export function swiggyMenu(query: string): Promise<SwiggyMenuResponse> {
  return withTimeout(async (signal) => {
    const res = await fetch(`${API_BASE_URL}/api/partner/swiggy-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
      signal,
    });
    if (!res.ok) throw await errorFrom(res);
    return (await res.json()) as SwiggyMenuResponse;
  });
}
