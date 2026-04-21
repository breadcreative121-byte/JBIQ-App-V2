const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json());
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

    // System prompt is derived from docs/response-pattern-model.md (v1.0).
    // The rules below encode §3 invariants, §6 Context Line, §12 language,
    // and §16 prohibited patterns. Location context is appended when known.
    let systemPrompt = [
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
      'Tone: neutral-helpful, concrete, brief. No filler, no decoration.',
    ].join('\n');

    if (userProfile && userProfile.city) {
      const loc = [userProfile.city, userProfile.country].filter(Boolean).join(', ');
      systemPrompt += `\n\nUser location: ${loc}. This is already known — NEVER ask where they are. Ground all "near me", weather, travel, and places questions in ${loc}.`;
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages,
    });

    const text = response.content[0].text;
    res.json({ text });
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// === ElevenLabs TTS endpoint ===
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
if (ELEVENLABS_API_KEY) {
  console.log('ElevenLabs key loaded:', ELEVENLABS_API_KEY.substring(0, 10) + '...');
}

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice_id } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });
    if (!ELEVENLABS_API_KEY) return res.status(500).json({ error: 'ElevenLabs API key not configured' });

    const voiceId = voice_id || 'cjVigY5qzO86Huf0OWal'; // Eric - Smooth, Trustworthy
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`ElevenLabs API error: ${response.status} - ${err}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': buffer.length });
    res.send(buffer);
  } catch (error) {
    console.error('TTS error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
