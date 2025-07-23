import { NextRequest, NextResponse } from 'next/server';

const CALENDAR_LIST_API = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
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

  // Try to fetch calendar list with current access token
  let res = await fetch(CALENDAR_LIST_API, {
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
      res = await fetch(CALENDAR_LIST_API, {
        headers: {
          Authorization: `Bearer ${typeof newTokens.access_token === 'string' ? newTokens.access_token : ''}`,
        },
      });
    } catch {
      return NextResponse.json({ error: 'Token refresh failed' }, { status: 401 });
    }
  }

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch calendars' }, { status: 500 });
  }
  
  const data = await res.json();
  return NextResponse.json(data);
} 