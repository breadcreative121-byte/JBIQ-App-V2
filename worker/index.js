// JBIQ proxy Worker — mirrors POST /api/chat and POST /api/tts from server.js
// so the static GitHub Pages build can call Anthropic + Sarvam without
// shipping the keys in the client bundle. Secrets come from wrangler:
//   wrangler secret put ANTHROPIC_API_KEY
//   wrangler secret put SARVAM_API_KEY

// System prompt is shared with server.js via ../shared/system-prompt.js so
// chat behaviour stays identical between local dev and production.
import { buildSystemPrompt } from '../shared/system-prompt.js';

const ALLOWED_ORIGINS = [
  'https://breadcreative121-byte.github.io',
];

function corsHeadersFor(origin) {
  const allow =
    origin && (
      ALLOWED_ORIGINS.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    )
      ? origin
      : null;
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
  if (allow) headers['Access-Control-Allow-Origin'] = allow;
  return headers;
}

function jsonResponse(body, status, cors) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function handleChat(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON' }, 400, cors);
  }
  const { messages, userProfile } = body || {};
  if (!Array.isArray(messages)) {
    return jsonResponse({ error: 'messages array is required' }, 400, cors);
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(userProfile),
      messages,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return jsonResponse({ error: `Anthropic ${upstream.status}: ${errText}` }, 502, cors);
  }

  const data = await upstream.json();
  const text = data?.content?.[0]?.text ?? '';
  return jsonResponse({ text }, 200, cors);
}

async function handleTts(request, env, cors) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'invalid JSON' }, 400, cors);
  }
  const { text, speaker, language_code } = body || {};
  if (!text) return jsonResponse({ error: 'text is required' }, 400, cors);
  if (!env.SARVAM_API_KEY) {
    return jsonResponse({ error: 'Sarvam API key not configured' }, 500, cors);
  }

  // Pick language: explicit override wins; otherwise route to hi-IN if any
  // Devanagari is present (Hindi/Hinglish), else en-IN. Sarvam's bulbul handles
  // code-mixed within either language code.
  const lang = language_code || (/[\u0900-\u097F]/.test(text) ? 'hi-IN' : 'en-IN');

  const upstream = await fetch('https://api.sarvam.ai/text-to-speech', {
    method: 'POST',
    headers: {
      'api-subscription-key': env.SARVAM_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      target_language_code: lang,
      speaker: speaker || 'priya',
      model: 'bulbul:v3',
      output_audio_codec: 'mp3',
      speech_sample_rate: '22050',
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    return jsonResponse({ error: `Sarvam ${upstream.status}: ${errText}` }, 502, cors);
  }

  const data = await upstream.json();
  const b64 = data && Array.isArray(data.audios) ? data.audios[0] : null;
  if (!b64) {
    return jsonResponse({ error: 'Sarvam returned no audio' }, 502, cors);
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  return new Response(bytes, {
    status: 200,
    headers: { 'Content-Type': 'audio/mpeg', ...cors },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const cors = corsHeadersFor(origin);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      return handleChat(request, env, cors);
    }
    if (request.method === 'POST' && url.pathname === '/api/tts') {
      return handleTts(request, env, cors);
    }

    return jsonResponse({ error: 'not found' }, 404, cors);
  },
};
