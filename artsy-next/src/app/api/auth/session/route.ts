import { NextRequest, NextResponse } from 'next/server';
import { signAuthCookieValue, verifyAndParseAuthCookie, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(AUTH_COOKIE_NAME);
  if (!cookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const user = verifyAndParseAuthCookie(cookie.value);
  if (user) {
    return NextResponse.json({ authenticated: true, user });
  }

  return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const user = body.user;

  if (!user || !user.role) {
    return NextResponse.json({ error: 'Valid user object required.' }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, user });
  const signedCookie = signAuthCookieValue(user);

  response.cookies.set(AUTH_COOKIE_NAME, signedCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 604800, // 7 days
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
