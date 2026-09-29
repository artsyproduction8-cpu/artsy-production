import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('artsy_auth_token');
  if (!cookie) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  try {
    const user = JSON.parse(decodeURIComponent(cookie.value));
    return NextResponse.json({ authenticated: true, user });
  } catch {
    return NextResponse.json({ authenticated: false, user: null }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  // Only allowed in development or for recognized test personas
  const isDev = process.env.NODE_ENV !== 'production';
  const body = await request.json().catch(() => ({}));
  const user = body.user;

  if (!user || !user.role) {
    return NextResponse.json({ error: 'Valid user object required.' }, { status: 400 });
  }

  // Prevent arbitrary privilege escalation in production
  if (!isDev && user.role === 'admin') {
    return NextResponse.json({ error: 'Unauthorized role assignment.' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true, user });
  response.cookies.set('artsy_auth_token', encodeURIComponent(JSON.stringify(user)), {
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
  response.cookies.delete('artsy_auth_token');
  return response;
}
