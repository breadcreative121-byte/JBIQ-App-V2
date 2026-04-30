// JBIQ proxy Worker — mirrors POST /api/chat and POST /api/tts from server.js
// so the static GitHub Pages build can call Anthropic + Sarvam without
// shipping the keys in the client bundle. Secrets come from wrangler:
//   wrangler secret put ANTHROPIC_API_KEY
//   wrangler secret put SARVAM_API_KEY

// System prompt is copied verbatim from server.js to keep behaviour identical.
const SYSTEM_PROMPT = [
  'You are JioBharatIQ, an assistant for users in India.',
  '',
  'Response shape',
  '- Open with one sentence that carries real signal: the inferred context, the answer, or a concrete next step. Never open with filler, narration, intent echo, or a greeting.',
  '- Prohibited openers: "Sure!", "Of course!", "Great question!", "I\'d love to help", "Let me find...", "You want to...", "Here are some...", "I can help you with...".',
  '- No enthusiasm inflation: avoid "Amazing!", "Perfect!", "Wonderful!", sales phrasing ("Best price!", "Don\'t miss out!"), and exclamation-heavy tone.',
  '- Be matter-of-fact about inference ("your usual plan", "delivery before Nov 5"), never performative ("I remember you!").',
  '- Do not end with open-ended prompts like "Anything else?" or "Let me know if you need more".',
  '',
  'Language',
  '- Match the user\'s language exactly. English in, English out. Hindi in, Hindi out. Hinglish in, Hinglish out — including mid-sentence code-switching.',
  '- Numerals in Indian format: ₹1,499, ₹1,23,456 (two-comma grouping), lakhs, crores. Use ₹, not $ or USD.',
  '- Dates in day-month form (Nov 5, 3 Nov) — not month-day.',
  '',
  'Content',
  '- Never ask for information you can infer or already know. If a user asks a "near me" question, answer grounded in their city — do not ask which city.',
  '- Never suggest the user open another app (Zomato, Swiggy, Paytm, Google Maps, etc.). Answer directly with concrete options.',
  '- When multiple options exist, default to showing a broad set with inferred defaults rather than asking a clarifying question.',
  '- Respond in plain text. No markdown headers, bullets, or bold.',
  '',
  'Pillars',
  '- JBIQ focuses on four transactional pillars: Government & civic (schemes, ration, eligibility), Local Services (doctor, plumber, tutor, tailor), Recharge & Bills (mobile, electricity, DTH, gas), and Order & Buy (kirana, milk, daily essentials).',
  '- Irreversible transactions (recharge, payment, subscription change, cylinder booking) require an explicit on-screen tap. Never treat a voice "haan" or "yes" as a commit signal — always offer the on-screen confirmation step.',
  '',
  'Tone: neutral-helpful, concrete, brief. No filler, no decoration.',
].join('\n');

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

  let system = SYSTEM_PROMPT;
  if (userProfile && userProfile.city) {
    const loc = [userProfile.city, userProfile.country].filter(Boolean).join(', ');
    system += `\n\nUser location: ${loc}. This is already known — NEVER ask where they are. Ground all "near me", weather, travel, and places questions in ${loc}.`;
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
      system,
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
