import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;

async function refreshTokens(refreshToken: string) {
  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    grant_type: 'refresh_token',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error('Failed to refresh tokens');
  return res.json();
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get('google_tokens');
  if (!cookie) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  let tokens: Record<string, unknown>;
  try {
    tokens = JSON.parse(cookie.value) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Get query parameters for date range and calendar ID
  const { searchParams } = new URL(req.url);
  const timeMin = searchParams.get('timeMin');
  const timeMax = searchParams.get('timeMax');
  const calendarId = searchParams.get('calendarId') || 'primary';
  
  // Build query parameters
  const queryParams = new URLSearchParams({
    maxResults: '100',
    orderBy: 'startTime',
    singleEvents: 'true',
  });
  
  // Add date range if provided, otherwise use current date as minimum
  if (timeMin) {
    queryParams.set('timeMin', timeMin);
  } else {
    queryParams.set('timeMin', new Date().toISOString());
  }
  
  if (timeMax) {
    queryParams.set('timeMax', timeMax);
  }

  const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;

  // Try to fetch calendar data with current access token
  let res = await fetch(`${calendarApiUrl}?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${typeof tokens.access_token === 'string' ? tokens.access_token : ''}`,
    },
  });

  // If access token is expired, try to refresh it
  if (res.status === 401 && tokens.refresh_token) {
    try {
      const newTokens = await refreshTokens(tokens.refresh_token as string) as Record<string, unknown>;
      
      // Update the stored tokens
      const response = NextResponse.json(newTokens);
      response.cookies.set('google_tokens', JSON.stringify(newTokens), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 24 * 60 * 60, // 60 days
      });
      
      // Retry the calendar request with new access token
      res = await fetch(`${calendarApiUrl}?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${typeof newTokens.access_token === 'string' ? newTokens.access_token : ''}`,
        },
      });
    } catch {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
  
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const cookie = req.cookies.get('google_tokens');
  if (!cookie) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  
  let tokens: Record<string, unknown>;
  try {
    tokens = JSON.parse(cookie.value) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  try {
    const body = await req.json();
    
    // Get calendar ID from query params or use primary
    const { searchParams } = new URL(req.url);
    const calendarId = searchParams.get('calendarId') || 'primary';
    
    const calendarApiUrl = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
    
    const res = await fetch(calendarApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${typeof tokens.access_token === 'string' ? tokens.access_token : ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json({ error: 'Failed to create event', details: errorData }, { status: res.status });
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error && error.message === 'Not authenticated') {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Invalid token') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    if (error instanceof Error && error.message === 'Token refresh failed') {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

 
 