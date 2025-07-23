import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/google/callback`;

async function getTokens(code: string) {
  const params = new URLSearchParams({
    code,
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
  });
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });
  if (!res.ok) throw new Error('Failed to fetch tokens');
  return res.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  
  // Get the base URL for absolute redirects
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  if (!code) return NextResponse.redirect(`${baseUrl}/calendar?error=missing_code`);
  try {
    const tokens = await getTokens(code) as Record<string, unknown>;
    // Store tokens in a secure, HTTP-only cookie (encrypted in production)
    const response = NextResponse.redirect(`${baseUrl}/calendar`);
    
    // Store tokens with longer expiration for refresh token
    const cookieExpiry = tokens.refresh_token ? 60 * 24 * 60 * 60 : 3600; // 60 days if refresh token, 1 hour if not
    
    response.cookies.set('google_tokens', JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: cookieExpiry,
    });
    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/calendar?error=token_exchange_failed`);
  }
} 