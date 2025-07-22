import { NextRequest, NextResponse } from 'next/server';

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

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
  const res = await fetch(CALENDAR_API + '?maxResults=10&orderBy=startTime&singleEvents=true&timeMin=' + new Date().toISOString(), {
    headers: {
      Authorization: `Bearer ${typeof tokens.access_token === 'string' ? tokens.access_token : ''}`,
    },
  });
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
  const data = await res.json();
  return NextResponse.json(data);
} 