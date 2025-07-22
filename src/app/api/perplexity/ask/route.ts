import { NextRequest, NextResponse } from 'next/server';

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const CHAT_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const QUERY_ENDPOINT = 'https://api.perplexity.ai/query';

interface PerplexityCitation {
  label?: string;
  url?: string;
}
interface PerplexityMessage {
  role: string;
  content: string;
  citations?: PerplexityCitation[];
}
interface PerplexityDelta {
  content?: string;
  citations?: PerplexityCitation[];
}
interface PerplexityChoice {
  delta?: PerplexityDelta;
  message?: PerplexityMessage;
}
interface PerplexityResponse {
  choices?: PerplexityChoice[];
}

export async function POST(req: NextRequest) {
  if (!PERPLEXITY_API_KEY) {
    console.error('Perplexity API key not set');
    return NextResponse.json({ error: 'Perplexity API key not set' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (err) {
    console.error('Invalid JSON', err);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  let stream = false;
  if (body.stream === true) {
    stream = true;
  }
  // If 'messages' is present, use chat endpoint; else, use query endpoint
  let url: string;
  let payload: Record<string, unknown>;
  if (Array.isArray(body.messages)) {
    url = CHAT_ENDPOINT;
    payload = {
      model: typeof body.model === 'string' ? body.model : 'sonar-pro',
      messages: body.messages,
      ...(body.temperature !== undefined && { temperature: body.temperature }),
      ...(body.max_tokens !== undefined && { max_tokens: body.max_tokens }),
      ...(stream && { stream: true }),
    };
  } else if (typeof body.query === 'string') {
    url = QUERY_ENDPOINT;
    payload = { query: body.query, ...(stream && { stream: true }) };
  } else {
    console.error('Missing required parameters: messages or query', body);
    return NextResponse.json({ error: 'Missing required parameters: messages or query' }, { status: 400 });
  }

  try {
    console.log('Proxying to Perplexity:', url, payload);
    const apiRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (stream && apiRes.body) {
      // Stream the response directly to the client
      return new Response(apiRes.body, {
        status: apiRes.status,
        headers: {
          'Content-Type': apiRes.headers.get('Content-Type') || 'text/event-stream',
        },
      });
    }
    const text = await apiRes.text();
    let data: PerplexityResponse;
    try {
      data = JSON.parse(text) as PerplexityResponse;
    } catch {
      console.error('Failed to parse Perplexity response as JSON:', text);
      return NextResponse.json({ error: 'Invalid response from Perplexity', raw: text }, { status: 502 });
    }
    console.log('Perplexity API status:', apiRes.status, 'Response:', data);
    return NextResponse.json(data, { status: apiRes.status });
  } catch (err) {
    console.error('Failed to contact Perplexity API', err);
    return NextResponse.json({ error: 'Failed to contact Perplexity API', details: (err as Error).message }, { status: 500 });
  }
}
