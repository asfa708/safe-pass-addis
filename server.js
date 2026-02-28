import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(join(__dirname, 'dist')));

// ── Anthropic API proxy (/api/chat) ───────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'ANTHROPIC_API_KEY is not configured on the server. Set it as an environment variable.',
    });
  }

  const { model = 'claude-sonnet-4-6', system, messages, max_tokens = 2000 } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  try {
    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        error: data?.error?.message || `Anthropic API error ${upstream.status}`,
      });
    }

    res.json({ text: data?.content?.[0]?.text ?? '' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// SPA fallback — all other routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Theodorus running on port ${PORT}`);
});
