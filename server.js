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

    // Build system prompt with the user's saved location so responses can
    // reference their city (e.g. "restaurants near you in Mumbai").
    let systemPrompt = 'You are a helpful AI assistant called JioBharatIQ. Keep responses concise and conversational. Respond in plain text without markdown formatting.';
    if (userProfile && userProfile.city) {
      const loc = [userProfile.city, userProfile.country].filter(Boolean).join(', ');
      systemPrompt +=
        ` The user is currently located in ${loc}. This is already known — NEVER ask the user where they are or what city they are in.` +
        ` Always answer "near me" style questions assuming ${loc}. Never suggest the user open another app (Zomato, Swiggy, Google Maps, etc.) — answer directly with recommendations.` +
        ` If the user asks about restaurants, places, weather, or travel, give concrete suggestions grounded in ${loc}.`;
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
