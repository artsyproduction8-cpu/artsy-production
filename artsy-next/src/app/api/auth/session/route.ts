import { NextRequest, NextResponse } from 'next/server';
import { verifyAndParseAuthCookie, AUTH_COOKIE_NAME } from '@/lib/auth-cookie';

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

export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully.' });
  response.cookies.delete(AUTH_COOKIE_NAME);
  return response;
}
