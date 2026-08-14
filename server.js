const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const { buildSystemPrompt } = require('./shared/system-prompt');

const fs = require('fs');
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('ERROR: ANTHROPIC_API_KEY not found in .env');
  process.exit(1);
}
console.log('API key loaded:', apiKey.substring(0, 15) + '...');

const anthropic = new Anthropic({ apiKey });

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, userProfile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(userProfile),
      messages: messages,
    });

    const text = response.content[0].text;
    res.json({ text });
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// === Sarvam TTS endpoint ===
// Mirrors the Worker build (commit 45b5d4b): ElevenLabs's abuse detector
// was blocking Free Tier traffic from Cloudflare Workers, so the public
// build moved to Sarvam (bulbul:v3). Keep server.js aligned so local dev
// matches production. Detect Devanagari → hi-IN, else en-IN. Sarvam returns
// base64-encoded mp3 in { audios: [...] } — we decode and re-emit as
// audio/mpeg so the existing frontend Audio playback path stays unchanged.
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
if (SARVAM_API_KEY) {
  console.log('Sarvam key loaded:', SARVAM_API_KEY.substring(0, 10) + '...');
}

app.post('/api/tts', async (req, res) => {
  try {
    const { text, speaker, language_code } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text is required' });
    if (!SARVAM_API_KEY) return res.status(500).json({ error: 'Sarvam API key not configured' });

    const lang = language_code || (/[ऀ-ॿ]/.test(text) ? 'hi-IN' : 'en-IN');

    const response = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'api-subscription-key': SARVAM_API_KEY,
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

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Sarvam API error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    const b64 = data && Array.isArray(data.audios) ? data.audios[0] : null;
    if (!b64) {
      throw new Error('Sarvam returned no audio');
    }

    const buffer = Buffer.from(b64, 'base64');
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': buffer.length });
    res.send(buffer);
  } catch (error) {
    console.error('TTS error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// === Sarvam STT endpoint ===
// Added for the native iOS app (mobile/app). The phone records short WAV clips
// and sends them base64-encoded so the Sarvam key never leaves the server. We
// decode and forward to Sarvam STT (saarika) as multipart form-data. Additive
// only — the existing web build does not use this route.
app.post('/api/stt', async (req, res) => {
  try {
    const { audio, language_code } = req.body || {};
    if (!audio) return res.status(400).json({ error: 'audio (base64) is required' });
    if (!SARVAM_API_KEY) return res.status(500).json({ error: 'Sarvam API key not configured' });

    const buffer = Buffer.from(audio, 'base64');
    const form = new FormData();
    form.append('file', new Blob([buffer], { type: 'audio/wav' }), 'speech.wav');
    form.append('model', 'saarika:v2.5');
    form.append('language_code', language_code || 'unknown');

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': SARVAM_API_KEY },
      body: form,
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Sarvam STT error: ${response.status} - ${err}`);
    }

    const data = await response.json();
    res.json({ transcript: data.transcript || '', language_code: data.language_code });
  } catch (error) {
    console.error('STT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// === Swiggy MCP partner endpoint ===
// Internal-demo only. Calls Anthropic Messages API with the Swiggy Food MCP
// connector and asks Claude to return a CatalogDiscoveryView-shaped JSON the
// existing renderer can consume. Auth is the user's OAuth bearer obtained via
// `npx @modelcontextprotocol/inspector` against https://mcp.swiggy.com/food
// and stashed in .env as SWIGGY_MCP_TOKEN. Falls back to fixture on failure.
const SWIGGY_MCP_TOKEN = process.env.SWIGGY_MCP_TOKEN;
const SWIGGY_MCP_URL = 'https://mcp.swiggy.com/food';

const SWIGGY_MENU_SYSTEM_PROMPT = `You are JBIQ's Swiggy partner-experience adapter.

Your job: use the swiggy-food MCP tools to look up the requested restaurant menu, then return a SINGLE JSON object matching the CatalogDiscoveryView schema below. No prose, no markdown fences, no commentary — just the JSON object.

Schema example (use this shape exactly; substitute real values from the MCP response):
{
  "kind": "discovery_view",
  "sub_pattern": "catalog",
  "state": "PARTIAL_RESULT_SHOWN",
  "subject": {
    "title": "<Restaurant name> — menu",
    "subtitle": "Swiggy · <eta> · ₹<delivery> delivery",
    "brand_chip": { "label": "Sw", "variant": "swiggy", "name": "Swiggy" }
  },
  "filters": {
    "multi_select": true,
    "chips": [
      { "id": "bestseller", "label": "Bestseller", "value": "top", "selected": false }
    ]
  },
  "sort": {
    "options": [
      { "id": "popular", "label": "Popular" },
      { "id": "price_asc", "label": "Price: low to high" },
      { "id": "rating", "label": "Rating" }
    ],
    "selected_id": "popular"
  },
  "collection": {
    "layout": "list",
    "cards": [
      {
        "variant": "catalog",
        "id": "<stable_dish_id>",
        "title": "<Dish name>",
        "subtitle": "<short descriptor> · serves N",
        "media": { "alt": "<dish>", "fallback_color": "<hex>" },
        "price_label": "₹<price>",
        "rating": { "value": <number 0-5>, "count": <integer> },
        "tags": ["<tag1>", "<tag2>"],
        "badge": "<optional badge text or omit>",
        "filter_ids": ["bestseller"],
        "primary_event": "catalog.swiggy.<restaurant>.<dish_id>.add",
        "commit_action": { "label": "Add", "event": "catalog.swiggy.<restaurant>.<dish_id>.add" }
      }
    ]
  },
  "voice_disclosure": "<one-sentence India-English summary naming top dish + price + 1-2 alternatives>",
  "meta": {
    "intent": "discover",
    "query": "<user query>",
    "total_count": <total dishes>,
    "trace_id": "trace-swiggy-menu-live"
  }
}

Rules:
- Return at most 8 cards (top 4–8 dishes).
- "layout" MUST be "list".
- Prices: use rupee symbol "₹" prefix.
- "fallback_color" is any visually plausible hex for the dish.
- Every card MUST include "commit_action" with label "Add" and the same event as primary_event.
- All filter chips MUST start with "selected": false (no chip pre-selected).
- Do NOT include an "edge_affordance" — the per-card "Add" pill is the only commit affordance.
- subject.brand_chip MUST be { "label": "Sw", "variant": "swiggy" } so the live and fixture paths render the same Swiggy mark.
- If the MCP call fails, return a JSON object: {"error": "<short reason>"}.
- Do NOT wrap the JSON in markdown fences. Output raw JSON only.`;

function extractJsonFromText(text) {
  if (!text) return null;
  // Strip optional markdown fences and surrounding prose.
  const fenced = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

app.post('/api/partner/swiggy-menu', async (req, res) => {
  if (!SWIGGY_MCP_TOKEN) {
    return res.status(503).json({
      error: 'SWIGGY_MCP_TOKEN not configured',
      hint: 'Run `npx @modelcontextprotocol/inspector`, complete OAuth against https://mcp.swiggy.com/food, copy the access_token into .env as SWIGGY_MCP_TOKEN.',
    });
  }

  const query = (req.body && req.body.query) || 'Show Paradise Biryani menu on Swiggy';

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'mcp-client-2025-11-20',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 4096,
        system: SWIGGY_MENU_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: query }],
        mcp_servers: [{
          type: 'url',
          url: SWIGGY_MCP_URL,
          name: 'swiggy-food',
          authorization_token: SWIGGY_MCP_TOKEN,
        }],
        tools: [{ type: 'mcp_toolset', mcp_server_name: 'swiggy-food' }],
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text();
      console.error('[swiggy-menu] Anthropic error:', upstream.status, errText);
      return res.status(502).json({ error: `Anthropic ${upstream.status}: ${errText.slice(0, 300)}` });
    }

    const data = await upstream.json();
    const blocks = Array.isArray(data.content) ? data.content : [];
    const mcpCalls = blocks.filter((b) => b.type === 'mcp_tool_use').map((b) => b.name);
    const finalText = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
    const view = extractJsonFromText(finalText);

    if (!view) {
      console.error('[swiggy-menu] could not extract JSON. raw text:', finalText.slice(0, 500));
      return res.status(502).json({ error: 'Could not parse DiscoveryView from MCP response', raw: finalText.slice(0, 500) });
    }
    if (view.error) {
      return res.status(502).json({ error: `MCP failure: ${view.error}` });
    }

    res.json({ view, debug: { mcpToolsCalled: mcpCalls, stopReason: data.stop_reason } });
  } catch (err) {
    console.error('[swiggy-menu] exception:', err);
    res.status(500).json({ error: err.message });
  }
});

// === Voice Playbook copy editor ===
// Stores in-browser copy edits as a sidecar JSON map { "<editId>": "<innerHTML>" }
// keyed by data-edit-id. The raw HTML stays untouched. This is a local
// single-author authoring tool, so validation is intentionally light.
//
// Each page gets its OWN sidecar via the optional ?doc=<name> query param so a
// standalone chapter page (e.g. ?doc=ch5) can never overwrite the main playbook's
// edits. No param → the main voice-playbook-content.json (backward compatible).
const PLAYBOOK_CONTENT_FILE = path.join(__dirname, 'voice-playbook-content.json');

function playbookContentFile(doc) {
  if (doc === undefined || doc === null || doc === '') return PLAYBOOK_CONTENT_FILE;
  if (typeof doc !== 'string' || !/^[a-z0-9-]{1,40}$/.test(doc)) return null;
  return path.join(__dirname, `voice-playbook-${doc}-content.json`);
}

app.get('/api/playbook-content', (req, res) => {
  const file = playbookContentFile(req.query.doc);
  if (!file) return res.status(400).json({ error: 'Invalid doc parameter' });
  try {
    if (!fs.existsSync(file)) return res.json({});
    const raw = fs.readFileSync(file, 'utf8');
    res.json(JSON.parse(raw || '{}'));
  } catch (err) {
    console.error('[playbook-content] read error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/playbook-content', (req, res) => {
  const file = playbookContentFile(req.query.doc);
  if (!file) return res.status(400).json({ error: 'Invalid doc parameter' });
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return res.status(400).json({ error: 'Body must be a flat object of editId -> html string' });
  }
  for (const [k, v] of Object.entries(body)) {
    if (typeof k !== 'string' || typeof v !== 'string') {
      return res.status(400).json({ error: 'All keys and values must be strings' });
    }
  }
  try {
    fs.writeFileSync(file, JSON.stringify(body, null, 2), 'utf8');
    res.json({ ok: true, count: Object.keys(body).length });
  } catch (err) {
    console.error('[playbook-content] write error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  if (SWIGGY_MCP_TOKEN) {
    console.log('Swiggy MCP token loaded:', SWIGGY_MCP_TOKEN.slice(0, 8) + '...');
  } else {
    console.log('Swiggy MCP token NOT set — /api/partner/swiggy-menu will return 503 (fixture fallback applies).');
  }
});
