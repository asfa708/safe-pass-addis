// Serverless proxy: receives requests from the browser and forwards them to
// the Anthropic API using the server-side ANTHROPIC_API_KEY env variable.
// This avoids CORS entirely — the browser never talks to Anthropic directly.

const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

exports.handler = async (event) => {
  const headers = { 'content-type': 'application/json' };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        error: 'ANTHROPIC_API_KEY is not configured on the server. Add it in Netlify → Site settings → Environment variables.',
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid request body' }) };
  }

  const { model = 'claude-sonnet-4-6', system, messages, max_tokens = 2000 } = payload;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'messages array is required' }) };
  }

  try {
    const response = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ model, max_tokens, system, messages }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: data?.error?.message || `Anthropic API error ${response.status}` }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: data?.content?.[0]?.text ?? '' }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Internal server error' }),
    };
  }
};
